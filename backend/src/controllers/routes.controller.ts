import { Request, Response } from 'express';
import { query, pool } from '../config/db.js';
import { socketEvents } from '../services/socket.service.js';
import { getRoadRouteGeometry } from '../services/routing.service.js';

export const getRoutes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT r.*, 
        d.driver_id as driver_id, 
        u.name as driver_name,
        s.shuttle_id as shuttle_id,
        s.shuttle_number,
        s.registration_number
       FROM routes r
       LEFT JOIN drivers d ON r.assigned_driver_id = d.driver_id
       LEFT JOIN users u ON d.driver_id = u.user_id
       LEFT JOIN shuttles s ON r.assigned_shuttle_id = s.shuttle_id
       ORDER BY r.route_id ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch routes', error: error.message });
  }
};

export const getAllRouteStops = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT rs.*, s.stop_name, s.latitude, s.longitude, s.description as stop_description
       FROM route_stops rs
       JOIN stops s ON rs.stop_id = s.stop_id
       ORDER BY rs.route_id, rs.sequence_number ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching route stops:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch route stops', error: error.message });
  }
};

export const getStopsByRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT s.*, rs.sequence_number, rs.scheduled_arrival, rs.scheduled_departure, rs.cumulative_distance_km
       FROM stops s
       JOIN route_stops rs ON s.stop_id = rs.stop_id
       WHERE rs.route_id = $1
       ORDER BY rs.sequence_number ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching stops for route:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stops for route', error: error.message });
  }
};

export const createRoute = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const {
      route_id,
      route_name,
      route_code,
      description,
      color = '#E8590C',
      stop_ids = [],
      assigned_driver_id,
      assigned_shuttle_id,
      start_time = '10:30 AM',
      instructions,
    } = req.body;

    if (!route_name) {
      res.status(400).json({ success: false, message: 'Route name is required' });
      return;
    }

    await client.query('BEGIN');

    // Generate Route ID if not provided
    let finalRouteId = route_id;
    if (!finalRouteId) {
      const countRes = await client.query('SELECT COUNT(*) FROM routes');
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      finalRouteId = `ROUTE-${String(nextNum).padStart(2, '0')}`;
    }

    let finalRouteCode = route_code;
    if (!finalRouteCode) {
      finalRouteCode = `R-${finalRouteId.replace('ROUTE-', '')}`;
    }

    const totalStops = Array.isArray(stop_ids) ? stop_ids.length : 0;

    // Insert Route
    const insertRouteSql = `
      INSERT INTO routes (route_id, route_name, total_stops, description, color, status, route_code, assigned_driver_id, assigned_shuttle_id)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8)
      RETURNING *
    `;
    const routeRes = await client.query(insertRouteSql, [
      finalRouteId,
      route_name,
      totalStops,
      description || null,
      color,
      finalRouteCode,
      assigned_driver_id || null,
      assigned_shuttle_id || null,
    ]);

    const createdRoute = routeRes.rows[0];

    // Insert Route Stops with sequence numbers
    if (Array.isArray(stop_ids) && stop_ids.length > 0) {
      for (let i = 0; i < stop_ids.length; i++) {
        const stopId = stop_ids[i];
        const seq = i + 1;
        const estDist = seq === 1 ? 0.0 : (seq - 1) * 7.5;
        await client.query(
          `INSERT INTO route_stops (route_id, stop_id, sequence_number, scheduled_arrival, scheduled_departure, cumulative_distance_km)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (route_id, stop_id) DO UPDATE SET sequence_number = EXCLUDED.sequence_number`,
          [finalRouteId, stopId, seq, start_time, start_time, estDist]
        );
      }

      // Calculate and save realistic road pathway
      if (stop_ids.length >= 2) {
        const stopsDataRes = await client.query(
          'SELECT stop_id, latitude, longitude FROM stops WHERE stop_id = ANY($1)',
          [stop_ids]
        );
        const stopsMap = new Map(stopsDataRes.rows.map((s: any) => [s.stop_id, s]));
        const orderedStops = stop_ids.map((id: string) => stopsMap.get(id)).filter(Boolean);
        const geoResult = await getRoadRouteGeometry(orderedStops);
        await client.query(
          'UPDATE routes SET route_coordinates = $1, total_distance_km = $2 WHERE route_id = $3',
          [JSON.stringify(geoResult.coordinates), geoResult.total_distance_km, finalRouteId]
        );
        createdRoute.route_coordinates = geoResult.coordinates;
        createdRoute.total_distance_km = geoResult.total_distance_km;
      }
    }

    // If driver and shuttle are assigned, create dispatch notification & assignment record
    if (assigned_driver_id) {
      const notifId = `NOTIF-${Date.now().toString(36).toUpperCase()}`;
      await client.query(
        `INSERT INTO driver_notifications (notification_id, driver_id, title, message, type, related_route_id)
         VALUES ($1, $2, $3, $4, 'info', $5)`,
        [
          notifId,
          assigned_driver_id,
          `New Route Assignment: ${finalRouteCode}`,
          instructions || `You have been assigned to ${finalRouteCode} (${route_name}). Departure: ${start_time}.`,
          finalRouteId,
        ]
      );

      if (assigned_shuttle_id) {
        const asgId = `ASG-${Date.now().toString(36).toUpperCase()}`;
        await client.query(
          `INSERT INTO driver_assignments (assignment_id, driver_id, route_id, shuttle_id, shift_date, shift_type, status)
           VALUES ($1, $2, $3, $4, 'Today', 'Assigned Shift', 'ACTIVE')`,
          [asgId, assigned_driver_id, finalRouteId, assigned_shuttle_id]
        );
      }

      socketEvents.emitDriverAssigned(assigned_driver_id, {
        route_id: finalRouteId,
        shuttle_id: assigned_shuttle_id,
      });
    }

    await client.query('COMMIT');

    // Real-time broadcast
    socketEvents.emitRouteCreated(createdRoute);

    res.status(201).json({
      success: true,
      route: createdRoute,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating route:', error);
    res.status(500).json({ success: false, message: 'Failed to create route', error: error.message });
  } finally {
    client.release();
  }
};

export const updateRoute = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      route_name,
      route_code,
      description,
      color,
      status,
      stop_ids,
      assigned_driver_id,
      assigned_shuttle_id,
    } = req.body;

    await client.query('BEGIN');

    // Fetch existing route
    const existingRes = await client.query('SELECT * FROM routes WHERE route_id = $1', [id]);
    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Route not found' });
      return;
    }

    const current = existingRes.rows[0];
    const totalStops = Array.isArray(stop_ids) ? stop_ids.length : current.total_stops;

    const updateSql = `
      UPDATE routes
      SET route_name = COALESCE($1, route_name),
          route_code = COALESCE($2, route_code),
          description = COALESCE($3, description),
          color = COALESCE($4, color),
          status = COALESCE($5, status),
          total_stops = $6,
          assigned_driver_id = $7,
          assigned_shuttle_id = $8
      WHERE route_id = $9
      RETURNING *
    `;

    const updatedRes = await client.query(updateSql, [
      route_name || null,
      route_code || null,
      description !== undefined ? description : null,
      color || null,
      status || null,
      totalStops,
      assigned_driver_id !== undefined ? assigned_driver_id : current.assigned_driver_id,
      assigned_shuttle_id !== undefined ? assigned_shuttle_id : current.assigned_shuttle_id,
      id,
    ]);

    const updatedRoute = updatedRes.rows[0];

    // If stop_ids provided, replace route_stops sequence
    if (Array.isArray(stop_ids)) {
      await client.query('DELETE FROM route_stops WHERE route_id = $1', [id]);
      for (let i = 0; i < stop_ids.length; i++) {
        const stopId = stop_ids[i];
        const seq = i + 1;
        const estDist = seq === 1 ? 0.0 : (seq - 1) * 7.5;
        await client.query(
          `INSERT INTO route_stops (route_id, stop_id, sequence_number, cumulative_distance_km)
           VALUES ($1, $2, $3, $4)`,
          [id, stopId, seq, estDist]
        );
      }

      if (stop_ids.length >= 2) {
        const stopsDataRes = await client.query(
          'SELECT stop_id, latitude, longitude FROM stops WHERE stop_id = ANY($1)',
          [stop_ids]
        );
        const stopsMap = new Map(stopsDataRes.rows.map((s: any) => [s.stop_id, s]));
        const orderedStops = stop_ids.map((sid: string) => stopsMap.get(sid)).filter(Boolean);
        const geoResult = await getRoadRouteGeometry(orderedStops);
        await client.query(
          'UPDATE routes SET route_coordinates = $1, total_distance_km = $2 WHERE route_id = $3',
          [JSON.stringify(geoResult.coordinates), geoResult.total_distance_km, id]
        );
        updatedRoute.route_coordinates = geoResult.coordinates;
        updatedRoute.total_distance_km = geoResult.total_distance_km;
      }
    }

    await client.query('COMMIT');

    // Real-time broadcast
    socketEvents.emitRouteUpdated(updatedRoute);

    res.json({
      success: true,
      route: updatedRoute,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating route:', error);
    res.status(500).json({ success: false, message: 'Failed to update route', error: error.message });
  } finally {
    client.release();
  }
};

export const deleteRoute = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;
    await client.query('BEGIN');
    await client.query('DELETE FROM trips WHERE route_id = $1', [id]);
    await client.query('DELETE FROM route_stops WHERE route_id = $1', [id]);
    await client.query('DELETE FROM routes WHERE route_id = $1', [id]);
    await client.query('COMMIT');

    socketEvents.emitRouteDeleted(id);

    res.json({ success: true, message: `Route ${id} deleted successfully` });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting route:', error);
    res.status(500).json({ success: false, message: 'Failed to delete route', error: error.message });
  } finally {
    client.release();
  }
};
