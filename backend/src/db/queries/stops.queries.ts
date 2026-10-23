import pool from '../connection';
import { getRoadRouteGeometry } from '../../services/routing.service';

export const fetchAllRoutes = async () => {
  const query = `
    SELECT 
      r.route_id, 
      r.route_code, 
      r.route_name, 
      r.total_stops, 
      r.description, 
      r.color, 
      r.status,
      r.assigned_shuttle_id,
      r.assigned_driver_id,
      r.route_coordinates,
      r.total_distance_km
    FROM routes r
    ORDER BY r.route_code ASC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllRoutes:', error);
    return [];
  }
};

export const fetchAllRouteStops = async () => {
  const query = `
    SELECT 
      route_id, 
      stop_id, 
      sequence_number, 
      distance_from_prev_km, 
      cumulative_distance_km, 
      scheduled_arrival, 
      scheduled_departure
    FROM route_stops
    ORDER BY route_id, sequence_number ASC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllRouteStops:', error);
    return [];
  }
};

export const fetchStopsForRoute = async (routeId: string) => {
  const query = `
    SELECT 
      s.stop_id, 
      s.stop_name, 
      s.latitude, 
      s.longitude, 
      s.is_destination, 
      s.description,
      rs.sequence_number,
      rs.distance_from_prev_km,
      rs.cumulative_distance_km,
      rs.scheduled_arrival,
      rs.scheduled_departure
    FROM stops s
    INNER JOIN route_stops rs ON s.stop_id = rs.stop_id
    WHERE rs.route_id = $1
    ORDER BY rs.sequence_number ASC;
  `;

  try {
    const result = await pool.query(query, [routeId]);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchStopsForRoute:', error);
    return [];
  }
};

export const createRoute = async (routeData: any) => {
  const { route_id, route_code, route_name, total_stops, description, color, status, stop_ids, assigned_shuttle_id, assigned_driver_id } = routeData;
  const newRouteId = route_id || `ROUTE-${Date.now().toString().slice(-4)}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const routeQuery = `
      INSERT INTO routes (route_id, route_code, route_name, total_stops, description, color, status, assigned_shuttle_id, assigned_driver_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (route_id) DO UPDATE SET
        route_code = EXCLUDED.route_code,
        route_name = EXCLUDED.route_name,
        total_stops = EXCLUDED.total_stops,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        status = EXCLUDED.status,
        assigned_shuttle_id = COALESCE(EXCLUDED.assigned_shuttle_id, routes.assigned_shuttle_id),
        assigned_driver_id = COALESCE(EXCLUDED.assigned_driver_id, routes.assigned_driver_id)
      RETURNING *;
    `;
    const routeRes = await client.query(routeQuery, [
      newRouteId,
      route_code || 'R-NEW',
      route_name || 'New University Route',
      total_stops || (stop_ids ? stop_ids.length : 0),
      description || '',
      color || '#E8590C',
      status || 'ACTIVE',
      assigned_shuttle_id || null,
      assigned_driver_id || null
    ]);

    const orderedStopsForGeo: { stop_id: string; latitude: number; longitude: number }[] = [];

    if (Array.isArray(stop_ids) && stop_ids.length > 0) {
      for (let i = 0; i < stop_ids.length; i++) {
        const sid = stop_ids[i];
        // Ensure stop exists to prevent foreign key errors
        await client.query(
          `INSERT INTO stops (stop_id, stop_name, latitude, longitude, is_destination)
           VALUES ($1, $2, 26.8500, 75.7500, false)
           ON CONFLICT (stop_id) DO NOTHING;`,
          [sid, sid.replace(/^STOP-/, '').replace(/-/g, ' ')]
        );
        await client.query(
          `INSERT INTO route_stops (route_id, stop_id, sequence_number)
           VALUES ($1, $2, $3)
           ON CONFLICT (route_id, stop_id) DO UPDATE SET sequence_number = $3;`,
          [newRouteId, sid, i + 1]
        );

        const sRow = await client.query('SELECT stop_id, latitude, longitude FROM stops WHERE stop_id = $1', [sid]);
        if (sRow.rows[0]) {
          orderedStopsForGeo.push(sRow.rows[0]);
        }
      }

      // Calculate actual road geometry and distances via OSRM
      if (orderedStopsForGeo.length >= 2) {
        const geoResult = await getRoadRouteGeometry(orderedStopsForGeo);
        await client.query(
          `UPDATE routes SET route_coordinates = $1, total_distance_km = $2 WHERE route_id = $3;`,
          [JSON.stringify(geoResult.coordinates), geoResult.total_distance_km, newRouteId]
        );

        for (const sd of geoResult.stopDistances) {
          await client.query(
            `UPDATE route_stops SET distance_from_prev_km = $1, cumulative_distance_km = $2 WHERE route_id = $3 AND stop_id = $4;`,
            [sd.distance_from_prev_km, sd.cumulative_distance_km, newRouteId, sd.stop_id]
          );
        }
      }
    }

    let tripRes = null;
    if (routeData.assigned_shuttle_id && routeData.assigned_driver_id) {
      const tripId = routeData.trip_id || `TRIP-${Date.now().toString().slice(-4)}`;
      
      // Ensure shuttle exists
      await client.query(
        `INSERT INTO shuttles (shuttle_id, registration_number, capacity, status)
         VALUES ($1, 'RJ 14 PA ' || RIGHT($1, 4), 32, 'ACTIVE')
         ON CONFLICT (shuttle_id) DO NOTHING;`,
        [routeData.assigned_shuttle_id]
      );

      // Ensure driver exists
      await client.query(
        `INSERT INTO users (user_id, name, email, password_hash, role)
         VALUES ($1, 'Assigned Driver', $1 || '@jklu.edu.in', 'hash', 'driver')
         ON CONFLICT (user_id) DO NOTHING;`,
        [routeData.assigned_driver_id]
      );
      await client.query(
        `INSERT INTO drivers (driver_id, license_no)
         VALUES ($1, 'RJ14-DL-' || RIGHT($1, 4))
         ON CONFLICT (driver_id) DO NOTHING;`,
        [routeData.assigned_driver_id]
      );

      const tripQuery = `
        INSERT INTO trips (trip_id, shuttle_id, route_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh)
        VALUES ($1, $2, $3, $4, $5, NULL, 'SCHEDULED', 'AVAILABLE', 0)
        ON CONFLICT (trip_id) DO UPDATE SET
          shuttle_id = EXCLUDED.shuttle_id,
          route_id = EXCLUDED.route_id,
          driver_id = EXCLUDED.driver_id,
          start_time = EXCLUDED.start_time
        RETURNING *;
      `;
      const tRes = await client.query(tripQuery, [
        tripId,
        routeData.assigned_shuttle_id,
        newRouteId,
        routeData.assigned_driver_id,
        routeData.start_time || '10:00 AM'
      ]);
      tripRes = tRes.rows[0];

      if (Array.isArray(stop_ids)) {
        for (const sid of stop_ids) {
          await client.query(
            `INSERT INTO trip_stops (trip_id, stop_id, estimated_arrival, arrival_status)
             VALUES ($1, $2, $3, 'SCHEDULED')
             ON CONFLICT (trip_id, stop_id) DO NOTHING;`,
            [tripId, sid, routeData.start_time || '10:00 AM']
          );
        }
      }
    }

    await client.query('COMMIT');
    return { success: true, route: routeRes.rows[0], trip: tripRes };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error in createRoute:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const updateRoute = async (routeId: string, routeData: any) => {
  const { route_name, description, color, status, stop_ids, assigned_shuttle_id, assigned_driver_id } = routeData;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE routes 
      SET 
        route_name = COALESCE($1, route_name),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        status = COALESCE($4, status),
        assigned_shuttle_id = COALESCE($5, assigned_shuttle_id),
        assigned_driver_id = COALESCE($6, assigned_driver_id)
      WHERE route_id = $7
      RETURNING *;
    `;
    const res = await client.query(updateQuery, [route_name, description, color, status, assigned_shuttle_id, assigned_driver_id, routeId]);

    if (Array.isArray(stop_ids)) {
      await client.query(`DELETE FROM route_stops WHERE route_id = $1;`, [routeId]);
      const orderedStopsForGeo: { stop_id: string; latitude: number; longitude: number }[] = [];

      for (let i = 0; i < stop_ids.length; i++) {
        await client.query(
          `INSERT INTO route_stops (route_id, stop_id, sequence_number) VALUES ($1, $2, $3);`,
          [routeId, stop_ids[i], i + 1]
        );
        const sRow = await client.query('SELECT stop_id, latitude, longitude FROM stops WHERE stop_id = $1', [stop_ids[i]]);
        if (sRow.rows[0]) {
          orderedStopsForGeo.push(sRow.rows[0]);
        }
      }
      await client.query(`UPDATE routes SET total_stops = $1 WHERE route_id = $2;`, [stop_ids.length, routeId]);

      if (orderedStopsForGeo.length >= 2) {
        const geoResult = await getRoadRouteGeometry(orderedStopsForGeo);
        await client.query(
          `UPDATE routes SET route_coordinates = $1, total_distance_km = $2 WHERE route_id = $3;`,
          [JSON.stringify(geoResult.coordinates), geoResult.total_distance_km, routeId]
        );

        for (const sd of geoResult.stopDistances) {
          await client.query(
            `UPDATE route_stops SET distance_from_prev_km = $1, cumulative_distance_km = $2 WHERE route_id = $3 AND stop_id = $4;`,
            [sd.distance_from_prev_km, sd.cumulative_distance_km, routeId, sd.stop_id]
          );
        }
      }
    }

    await client.query('COMMIT');
    return { success: true, route: res.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error in updateRoute:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const deleteRoute = async (routeId: string) => {
  const query = `DELETE FROM routes WHERE route_id = $1 RETURNING route_id;`;
  try {
    const result = await pool.query(query, [routeId]);
    return { success: true, deleted: result.rowCount ? result.rowCount > 0 : false };
  } catch (error) {
    console.error('Database query error in deleteRoute:', error);
    return { success: false, error };
  }
};

export const createStop = async (stopData: any) => {
  const { stop_id, stop_name, latitude, longitude, is_destination, description } = stopData;
  const newStopId = stop_id || `STOP-${Date.now().toString().slice(-4)}`;

  const query = `
    INSERT INTO stops (stop_id, stop_name, latitude, longitude, is_destination, description)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [
      newStopId,
      stop_name,
      Number(latitude),
      Number(longitude),
      Boolean(is_destination),
      description || ''
    ]);
    return { success: true, stop: result.rows[0] };
  } catch (error) {
    console.error('Database query error in createStop:', error);
    return { success: false, error };
  }
};

export const updateStop = async (stopId: string, stopData: any) => {
  const { stop_name, latitude, longitude, is_destination, description } = stopData;
  const query = `
    UPDATE stops
    SET 
      stop_name = COALESCE($1, stop_name),
      latitude = COALESCE($2, latitude),
      longitude = COALESCE($3, longitude),
      is_destination = COALESCE($4, is_destination),
      description = COALESCE($5, description)
    WHERE stop_id = $6
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [stop_name, latitude, longitude, is_destination, description, stopId]);
    return { success: true, stop: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateStop:', error);
    return { success: false, error };
  }
};

export const deleteStop = async (stopId: string) => {
  const query = `DELETE FROM stops WHERE stop_id = $1 RETURNING stop_id;`;
  try {
    const result = await pool.query(query, [stopId]);
    return { success: true, deleted: result.rowCount ? result.rowCount > 0 : false };
  } catch (error) {
    console.error('Database query error in deleteStop:', error);
    return { success: false, error };
  }
};

export const fetchAllStops = async () => {
  const query = `
    SELECT 
      stop_id,
      stop_name,
      latitude,
      longitude,
      is_destination,
      description
    FROM stops
    ORDER BY stop_name ASC;
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllStops:', error);
    return [];
  }
};

