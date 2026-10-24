import { Request, Response } from 'express';
import { query, pool } from '../config/db.js';
import { socketEvents } from '../services/socket.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getTrips = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT t.*,
        r.route_name, r.route_code, r.color as route_color, r.total_stops,
        s.shuttle_number, s.registration_number, s.capacity as shuttle_capacity,
        u.name as driver_name, u.phone_number as driver_phone, d.license_no as driver_license
       FROM trips t
       LEFT JOIN routes r ON t.route_id = r.route_id
       LEFT JOIN shuttles s ON t.shuttle_id = s.shuttle_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       LEFT JOIN users u ON d.driver_id = u.user_id
       ORDER BY t.start_time ASC, t.trip_id ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trips', error: error.message });
  }
};

export const getAllTripStops = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT ts.*, s.stop_name, s.latitude, s.longitude, rs.sequence_number
       FROM trip_stops ts
       JOIN stops s ON ts.stop_id = s.stop_id
       JOIN trips t ON ts.trip_id = t.trip_id
       LEFT JOIN route_stops rs ON t.route_id = rs.route_id AND ts.stop_id = rs.stop_id
       ORDER BY ts.trip_id, rs.sequence_number ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching trip stops:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trip stops', error: error.message });
  }
};

export const getLiveTripDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tripRes = await query(
      `SELECT t.*,
        r.route_name, r.route_code, r.color as route_color,
        s.shuttle_number, s.registration_number, s.capacity as shuttle_capacity,
        u.name as driver_name, u.phone_number as driver_phone
       FROM trips t
       LEFT JOIN routes r ON t.route_id = r.route_id
       LEFT JOIN shuttles s ON t.shuttle_id = s.shuttle_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       LEFT JOIN users u ON d.driver_id = u.user_id
       WHERE t.trip_id = $1`,
      [id]
    );

    if (tripRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const trip = tripRes.rows[0];

    // Fetch stops for this trip
    const stopsRes = await query(
      `SELECT ts.*, s.stop_name, s.latitude, s.longitude, rs.sequence_number
       FROM trip_stops ts
       JOIN stops s ON ts.stop_id = s.stop_id
       JOIN trips t ON ts.trip_id = t.trip_id
       LEFT JOIN route_stops rs ON t.route_id = rs.route_id AND ts.stop_id = rs.stop_id
       WHERE ts.trip_id = $1
       ORDER BY rs.sequence_number ASC`,
      [id]
    );

    // Fetch latest location
    const locRes = await query(
      `SELECT * FROM shuttle_locations 
       WHERE trip_id = $1 OR shuttle_id = $2
       ORDER BY recorded_at DESC LIMIT 1`,
      [id, trip.shuttle_id]
    );

    res.json({
      success: true,
      trip_id: trip.trip_id,
      trip,
      stops: stopsRes.rows,
      latestLocation: locRes.rows[0] || null,
      latest_location: locRes.rows[0] || null,
      route_coordinates: trip.route_coordinates,
    });
  } catch (error: any) {
    console.error('Error fetching live trip details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch live trip', error: error.message });
  }
};

export const createTrip = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { route_id, shuttle_id, driver_id, start_time, end_time } = req.body;

    if (!route_id || !shuttle_id || !driver_id || !start_time) {
      res.status(400).json({
        success: false,
        message: 'route_id, shuttle_id, driver_id, and start_time are required.',
      });
      return;
    }

    await client.query('BEGIN');

    // Check if shuttle is already operating a RUNNING trip
    const busyShuttle = await client.query(
      "SELECT trip_id FROM trips WHERE shuttle_id = $1 AND running_status = 'RUNNING'",
      [shuttle_id]
    );
    if (busyShuttle.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        message: `Shuttle ${shuttle_id} is currently operating Trip ${busyShuttle.rows[0].trip_id}.`,
      });
      return;
    }

    // Check if driver is already operating a RUNNING trip
    const busyDriver = await client.query(
      "SELECT trip_id FROM trips WHERE driver_id = $1 AND running_status = 'RUNNING'",
      [driver_id]
    );
    if (busyDriver.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        message: `Driver ${driver_id} is currently operating Trip ${busyDriver.rows[0].trip_id}.`,
      });
      return;
    }

    // Generate unique Trip ID
    const countRes = await client.query('SELECT COUNT(*) FROM trips');
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
    const finalTripId = `TRIP-${String(nextNum).padStart(2, '0')}`;

    // Insert Trip
    const insertTripSql = `
      INSERT INTO trips (trip_id, shuttle_id, route_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh)
      VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED', 'AVAILABLE', 0)
      RETURNING *
    `;

    const tripRes = await client.query(insertTripSql, [
      finalTripId,
      shuttle_id,
      route_id,
      driver_id,
      start_time,
      end_time || null,
    ]);

    const createdTrip = tripRes.rows[0];

    // Populate trip_stops from the route's stops
    const routeStopsRes = await client.query(
      'SELECT stop_id, sequence_number, scheduled_arrival FROM route_stops WHERE route_id = $1 ORDER BY sequence_number ASC',
      [route_id]
    );

    for (const rs of routeStopsRes.rows) {
      await client.query(
        `INSERT INTO trip_stops (trip_id, stop_id, estimated_arrival, arrival_status)
         VALUES ($1, $2, $3, 'SCHEDULED')
         ON CONFLICT (trip_id, stop_id) DO NOTHING`,
        [finalTripId, rs.stop_id, rs.scheduled_arrival || start_time]
      );
    }

    // Create driver dispatch notification
    const routeInfo = await client.query('SELECT route_name, route_code FROM routes WHERE route_id = $1', [route_id]);
    const routeName = routeInfo.rows[0]?.route_name || route_id;
    const routeCode = routeInfo.rows[0]?.route_code || route_id;

    const notifId = `NOTIF-${Date.now().toString(36).toUpperCase()}`;
    await client.query(
      `INSERT INTO driver_notifications (notification_id, driver_id, title, message, type, related_route_id)
       VALUES ($1, $2, $3, $4, 'info', $5)`,
      [
        notifId,
        driver_id,
        `Trip Scheduled: ${finalTripId}`,
        `You are assigned to Trip ${finalTripId} on ${routeCode} (${routeName}). Departure: ${start_time}.`,
        route_id,
      ]
    );

    // Create / update driver assignment
    const asgId = `ASG-${Date.now().toString(36).toUpperCase()}`;
    await client.query(
      `INSERT INTO driver_assignments (assignment_id, driver_id, route_id, shuttle_id, shift_date, shift_type, status)
       VALUES ($1, $2, $3, $4, 'Today', 'Trip Dispatch', 'ACTIVE')`,
      [asgId, driver_id, route_id, shuttle_id]
    );

    await client.query('COMMIT');

    // Enrich created trip with driver & shuttle names for frontend display
    const fullTripRes = await query(
      `SELECT t.*,
        r.route_name, r.route_code, r.color as route_color, r.total_stops,
        s.shuttle_number, s.registration_number, s.capacity as shuttle_capacity,
        u.name as driver_name, u.phone_number as driver_phone
       FROM trips t
       LEFT JOIN routes r ON t.route_id = r.route_id
       LEFT JOIN shuttles s ON t.shuttle_id = s.shuttle_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       LEFT JOIN users u ON d.driver_id = u.user_id
       WHERE t.trip_id = $1`,
      [finalTripId]
    );

    const enrichedTrip = fullTripRes.rows[0] || createdTrip;

    // Real-time broadcasts
    socketEvents.emitTripCreated(enrichedTrip);
    socketEvents.emitDriverAssigned(driver_id, { trip: enrichedTrip });

    res.status(201).json({
      success: true,
      trip: enrichedTrip,
      message: `Trip ${finalTripId} scheduled successfully in Supabase.`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating trip:', error);
    res.status(500).json({ success: false, message: 'Failed to create trip', error: error.message });
  } finally {
    client.release();
  }
};

export const updateTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { shuttle_id, route_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh } = req.body;

    const updateSql = `
      UPDATE trips
      SET shuttle_id = COALESCE($1, shuttle_id),
          route_id = COALESCE($2, route_id),
          driver_id = COALESCE($3, driver_id),
          start_time = COALESCE($4, start_time),
          end_time = COALESCE($5, end_time),
          running_status = COALESCE($6, running_status),
          capacity_status = COALESCE($7, capacity_status),
          speed_kmh = COALESCE($8, speed_kmh)
      WHERE trip_id = $9
      RETURNING *
    `;

    const result = await query(updateSql, [
      shuttle_id || null,
      route_id || null,
      driver_id || null,
      start_time || null,
      end_time !== undefined ? end_time : null,
      running_status || null,
      capacity_status || null,
      speed_kmh !== undefined ? speed_kmh : null,
      id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const updatedTrip = result.rows[0];
    socketEvents.emitTripUpdated(updatedTrip);

    res.json({ success: true, trip: updatedTrip });
  } catch (error: any) {
    console.error('Error updating trip:', error);
    res.status(500).json({ success: false, message: 'Failed to update trip', error: error.message });
  }
};

export const startTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;

    // Check if trip exists
    const tripRes = await client.query('SELECT * FROM trips WHERE trip_id = $1', [id]);
    if (tripRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const currentTrip = tripRes.rows[0];

    // Authorization check: if authenticated user is driver, verify driver owns this trip
    if (req.user && req.user.role === 'driver' && req.user.user_id !== currentTrip.driver_id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to operate trips assigned to your driver ID.',
      });
      return;
    }

    await client.query('BEGIN');

    // Update trip running status
    const updateRes = await client.query(
      "UPDATE trips SET running_status = 'RUNNING' WHERE trip_id = $1 RETURNING *",
      [id]
    );

    const updatedTrip = updateRes.rows[0];

    // Ensure origin stop is marked ARRIVED / APPROACHING
    await client.query(
      `UPDATE trip_stops SET arrival_status = 'ARRIVED', actual_arrival = NOW()::text
       WHERE trip_id = $1 AND stop_id IN (
         SELECT stop_id FROM route_stops WHERE route_id = $2 AND sequence_number = 1
       )`,
      [id, currentTrip.route_id]
    );

    await client.query('COMMIT');

    // Broadcast trip started
    socketEvents.emitTripStarted(id, updatedTrip);

    res.json({
      success: true,
      trip: updatedTrip,
      message: `Trip ${id} has commenced. Active across all portals.`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error starting trip:', error);
    res.status(500).json({ success: false, message: 'Failed to start trip', error: error.message });
  } finally {
    client.release();
  }
};

export const endTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;

    const tripRes = await client.query('SELECT * FROM trips WHERE trip_id = $1', [id]);
    if (tripRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const currentTrip = tripRes.rows[0];

    // Driver authorization check
    if (req.user && req.user.role === 'driver' && req.user.user_id !== currentTrip.driver_id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to operate trips assigned to your driver ID.',
      });
      return;
    }

    await client.query('BEGIN');

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark trip COMPLETED
    const updateRes = await client.query(
      "UPDATE trips SET running_status = 'COMPLETED', end_time = $1, speed_kmh = 0 WHERE trip_id = $2 RETURNING *",
      [nowStr, id]
    );

    const updatedTrip = updateRes.rows[0];

    // Mark all stops COMPLETED
    await client.query(
      "UPDATE trip_stops SET arrival_status = 'COMPLETED' WHERE trip_id = $1",
      [id]
    );

    await client.query('COMMIT');

    // Broadcast trip ended
    socketEvents.emitTripEnded(id, currentTrip.shuttle_id, updatedTrip);

    res.json({
      success: true,
      trip: updatedTrip,
      message: `Trip ${id} successfully completed.`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error ending trip:', error);
    res.status(500).json({ success: false, message: 'Failed to end trip', error: error.message });
  } finally {
    client.release();
  }
};

export const cancelTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const tripRes = await query('SELECT * FROM trips WHERE trip_id = $1', [id]);
    if (tripRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const currentTrip = tripRes.rows[0];

    // Driver authorization check
    if (req.user && req.user.role === 'driver' && req.user.user_id !== currentTrip.driver_id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to operate trips assigned to your driver ID.',
      });
      return;
    }

    const updateRes = await query(
      "UPDATE trips SET running_status = 'CANCELLED' WHERE trip_id = $1 RETURNING *",
      [id]
    );

    socketEvents.emitTripCancelled(id);

    res.json({
      success: true,
      trip: updateRes.rows[0],
      message: `Trip ${id} cancelled.`,
    });
  } catch (error: any) {
    console.error('Error cancelling trip:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel trip', error: error.message });
  }
};

export const updateTripCapacity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { capacity, capacity_status } = req.body;

    const statusToSet = capacity_status || capacity || 'AVAILABLE';

    const result = await query(
      'UPDATE trips SET capacity_status = $1 WHERE trip_id = $2 RETURNING *',
      [statusToSet, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const updatedTrip = result.rows[0];
    socketEvents.emitTripUpdated(updatedTrip);

    res.json({ success: true, trip: updatedTrip });
  } catch (error: any) {
    console.error('Error updating capacity:', error);
    res.status(500).json({ success: false, message: 'Failed to update capacity', error: error.message });
  }
};

export const updateTripStopStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripId, stopId } = req.params;
    const { status, arrival_status } = req.body;

    const finalStatus = arrival_status || status || 'ARRIVED';

    const result = await query(
      `UPDATE trip_stops 
       SET arrival_status = $1, actual_arrival = NOW()::text
       WHERE trip_id = $2 AND stop_id = $3
       RETURNING *`,
      [finalStatus, tripId, stopId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Trip stop record not found' });
      return;
    }

    socketEvents.emitTripUpdated({ trip_id: tripId, updatedStop: result.rows[0] });

    res.json({ success: true, tripStop: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating stop status:', error);
    res.status(500).json({ success: false, message: 'Failed to update stop status', error: error.message });
  }
};
