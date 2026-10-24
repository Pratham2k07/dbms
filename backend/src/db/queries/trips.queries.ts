import pool from '../connection';
import { projectVehicleOnRoute, calculateTheoreticalEtaMinutes } from '../../services/routing.service';

export const fetchAllTrips = async () => {
  const query = `
    SELECT 
      t.trip_id,
      t.shuttle_id,
      t.route_id,
      t.driver_id,
      t.start_time,
      t.end_time,
      t.running_status,
      t.capacity_status,
      t.speed_kmh,
      t.trip_date,
      t.actual_start_time,
      t.actual_end_time,
      r.route_name,
      r.route_code,
      r.route_coordinates,
      r.total_distance_km,
      s.registration_number,
      s.shuttle_number,
      u.name AS driver_name
    FROM trips t
    LEFT JOIN routes r ON t.route_id = r.route_id
    LEFT JOIN shuttles s ON t.shuttle_id = s.shuttle_id
    LEFT JOIN drivers d ON t.driver_id = d.driver_id
    LEFT JOIN users u ON d.driver_id = u.user_id
    ORDER BY t.trip_id ASC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllTrips:', error);
    return [];
  }
};

export const fetchTripById = async (tripId: string) => {
  const query = `
    SELECT 
      t.trip_id,
      t.shuttle_id,
      t.route_id,
      t.driver_id,
      t.start_time,
      t.end_time,
      t.running_status,
      t.capacity_status,
      t.speed_kmh,
      t.trip_date,
      t.actual_start_time,
      t.actual_end_time,
      r.route_name,
      r.route_code,
      r.route_coordinates,
      r.total_distance_km,
      s.registration_number,
      s.shuttle_number,
      u.name AS driver_name
    FROM trips t
    LEFT JOIN routes r ON t.route_id = r.route_id
    LEFT JOIN shuttles s ON t.shuttle_id = s.shuttle_id
    LEFT JOIN drivers d ON t.driver_id = d.driver_id
    LEFT JOIN users u ON d.driver_id = u.user_id
    WHERE t.trip_id = $1;
  `;
  try {
    const result = await pool.query(query, [tripId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error in fetchTripById:', error);
    return null;
  }
};


export const createTrip = async (tripData: any) => {
  const { trip_id, route_id, shuttle_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh, trip_date } = tripData;
  const newTripId = trip_id || `TRIP-${Date.now().toString().slice(-4)}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure route exists
    if (route_id) {
      await client.query(
        `INSERT INTO routes (route_id, route_code, route_name, total_stops, description, color, status)
         VALUES ($1, 'R-NEW', 'University Route', 2, 'Assigned Route', '#2B4A7E', 'ACTIVE')
         ON CONFLICT (route_id) DO NOTHING;`,
        [route_id]
      );
    }

    // Ensure shuttle exists
    if (shuttle_id) {
      await client.query(
        `INSERT INTO shuttles (shuttle_id, registration_number, capacity, status)
         VALUES ($1::varchar, 'RJ 14 PA ' || RIGHT($1::text, 4), 32, 'ACTIVE')
         ON CONFLICT (shuttle_id) DO NOTHING;`,
        [shuttle_id]
      );
    }

    // Ensure driver exists
    if (driver_id) {
      await client.query(
        `INSERT INTO users (user_id, name, email, password_hash, role)
         VALUES ($1::varchar, 'Assigned Driver', $1::text || '@jklu.edu.in', 'hash', 'driver')
         ON CONFLICT (user_id) DO NOTHING;`,
        [driver_id]
      );
      await client.query(
        `INSERT INTO drivers (driver_id, license_no)
         VALUES ($1::varchar, 'RJ14-DL-' || RIGHT($1::text, 4))
         ON CONFLICT (driver_id) DO NOTHING;`,
        [driver_id]
      );
    }


    const query = `
      INSERT INTO trips (trip_id, shuttle_id, route_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh, trip_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::date, CURRENT_DATE))
      ON CONFLICT (trip_id) DO UPDATE SET
        shuttle_id = EXCLUDED.shuttle_id,
        route_id = EXCLUDED.route_id,
        driver_id = EXCLUDED.driver_id,
        start_time = EXCLUDED.start_time,
        running_status = EXCLUDED.running_status
      RETURNING *;
    `;

    const result = await client.query(query, [
      newTripId,
      shuttle_id,
      route_id,
      driver_id,
      start_time || '09:00 AM',
      end_time || null,
      running_status || 'SCHEDULED',
      capacity_status || 'AVAILABLE',
      Number(speed_kmh) || 0,
      trip_date || null
    ]);

    // Automatically generate trip_stops from route_stops if present
    if (route_id) {
      const rsRes = await client.query(
        `SELECT stop_id, scheduled_arrival FROM route_stops WHERE route_id = $1 ORDER BY sequence_number ASC`,
        [route_id]
      );
      for (const rs of rsRes.rows) {
        await client.query(
          `INSERT INTO trip_stops (trip_id, stop_id, estimated_arrival, arrival_status)
           VALUES ($1, $2, $3, 'SCHEDULED')
           ON CONFLICT (trip_id, stop_id) DO NOTHING;`,
          [newTripId, rs.stop_id, rs.scheduled_arrival || start_time || '09:00 AM']
        );
      }
    }

    await client.query('COMMIT');
    return { success: true, trip: result.rows[0] };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Database query error in createTrip:', error);
    if (error?.code === '23505') {
      return {
        success: false,
        error: 'Duplicate trip rejected: A trip for this route, operating date, and start time is already scheduled.'
      };
    }
    return { success: false, error: error?.message || 'Database error creating trip' };
  } finally {
    client.release();
  }
};

export const startTripById = async (tripId: string, driverId?: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let checkQuery = 'SELECT * FROM trips WHERE trip_id = $1';
    const params: any[] = [tripId];
    if (driverId) {
      checkQuery += ' AND driver_id = $2';
      params.push(driverId);
    }

    const tRes = await client.query(checkQuery, params);
    if (tRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Trip not found or unauthorized driver.' };
    }

    const trip = tRes.rows[0];
    if (trip.running_status === 'COMPLETED') {
      await client.query('ROLLBACK');
      return { success: false, error: 'Cannot start a trip that is already completed.' };
    }

    const updateRes = await client.query(
      `UPDATE trips 
       SET 
         running_status = 'RUNNING',
         actual_start_time = COALESCE(actual_start_time, CURRENT_TIMESTAMP),
         speed_kmh = 0
       WHERE trip_id = $1 
       RETURNING *;`,
      [tripId]
    );

    // Update shuttle status to ACTIVE
    if (trip.shuttle_id) {
      await client.query(`UPDATE shuttles SET status = 'ACTIVE' WHERE shuttle_id = $1;`, [trip.shuttle_id]);
    }

    await client.query('COMMIT');
    return { success: true, trip: updateRes.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error starting trip:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const endTripById = async (tripId: string, driverId?: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let checkQuery = 'SELECT * FROM trips WHERE trip_id = $1';
    const params: any[] = [tripId];
    if (driverId) {
      checkQuery += ' AND driver_id = $2';
      params.push(driverId);
    }

    const tRes = await client.query(checkQuery, params);
    if (tRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Trip not found or unauthorized driver.' };
    }

    const updateRes = await client.query(
      `UPDATE trips 
       SET 
         running_status = 'COMPLETED',
         actual_end_time = CURRENT_TIMESTAMP,
         speed_kmh = 0
       WHERE trip_id = $1 
       RETURNING *;`,
      [tripId]
    );

    // Mark all remaining unvisited stops as COMPLETED
    await client.query(
      `UPDATE trip_stops 
       SET 
         arrival_status = 'COMPLETED',
         actual_arrival = COALESCE(actual_arrival, CURRENT_TIMESTAMP::text),
         actual_departure = COALESCE(actual_departure, CURRENT_TIMESTAMP::text)
       WHERE trip_id = $1 AND arrival_status != 'COMPLETED';`,
      [tripId]
    );

    await client.query('COMMIT');
    return { success: true, trip: updateRes.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ending trip:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const getLiveTripDetails = async (tripId: string) => {
  try {
    // 1. Fetch trip and route
    const tripRes = await pool.query(`
      SELECT 
        t.trip_id,
        t.shuttle_id,
        t.route_id,
        t.driver_id,
        t.start_time,
        t.end_time,
        t.running_status,
        t.capacity_status,
        t.speed_kmh,
        t.trip_date,
        t.actual_start_time,
        t.actual_end_time,
        r.route_name,
        r.route_code,
        r.route_coordinates,
        r.total_distance_km,
        s.registration_number,
        s.shuttle_number,
        s.capacity,
        u.name AS driver_name,
        u.phone_number AS driver_phone
      FROM trips t
      LEFT JOIN routes r ON t.route_id = r.route_id
      LEFT JOIN shuttles s ON t.shuttle_id = s.shuttle_id
      LEFT JOIN drivers d ON t.driver_id = d.driver_id
      LEFT JOIN users u ON d.driver_id = u.user_id
      WHERE t.trip_id = $1;
    `, [tripId]);

    if (tripRes.rows.length === 0) {
      return { success: false, error: 'Trip not found' };
    }

    const trip = tripRes.rows[0];

    // 2. Fetch latest telemetry
    const locRes = await pool.query(`
      SELECT 
        location_id,
        shuttle_id,
        trip_id,
        driver_id,
        latitude,
        longitude,
        bearing,
        speed_kmh,
        progress_percentage,
        accuracy_m,
        gps_timestamp,
        recorded_at
      FROM shuttle_locations
      WHERE trip_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1;
    `, [tripId]);

    const latestLocation = locRes.rows[0] || null;
    const isStale = latestLocation
      ? Date.now() - new Date(latestLocation.recorded_at).getTime() > 2 * 60 * 1000
      : true;

    // 3. Fetch ordered trip stops
    const stopsRes = await pool.query(`
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
        rs.scheduled_departure,
        ts.estimated_arrival,
        ts.actual_arrival,
        ts.actual_departure,
        ts.arrival_status
      FROM trip_stops ts
      JOIN stops s ON ts.stop_id = s.stop_id
      LEFT JOIN route_stops rs ON rs.route_id = $1 AND rs.stop_id = s.stop_id
      WHERE ts.trip_id = $2
      ORDER BY COALESCE(rs.sequence_number, 999) ASC;
    `, [trip.route_id, tripId]);

    // 4. Calculate road-based remaining distance and theoretical ETA
    let currentBusProgressKm = 0;
    if (latestLocation && trip.route_coordinates) {
      const proj = projectVehicleOnRoute(
        Number(latestLocation.latitude),
        Number(latestLocation.longitude),
        trip.route_coordinates,
        Number(trip.total_distance_km) || 0
      );
      currentBusProgressKm = proj.distanceFromStartKm;
    }

    const orderedStopsWithEta = stopsRes.rows.map((st) => {
      const stopCumKm = Number(st.cumulative_distance_km) || 0;
      const remainingRoadDistKm = Math.max(0, Number((stopCumKm - currentBusProgressKm).toFixed(2)));
      const theoreticalEtaMin = calculateTheoreticalEtaMinutes(remainingRoadDistKm, 25);

      return {
        ...st,
        remaining_road_distance_km: remainingRoadDistKm,
        theoretical_eta_minutes: theoreticalEtaMin
      };
    });

    return {
      success: true,
      trip: {
        ...trip,
        is_live_tracking_active: trip.running_status === 'RUNNING' && latestLocation && !isStale
      },
      latestLocation: latestLocation ? { ...latestLocation, is_stale: isStale } : null,
      stops: orderedStopsWithEta,
      currentProgressKm: currentBusProgressKm,
      totalDistanceKm: Number(trip.total_distance_km) || 0
    };
  } catch (error) {
    console.error('Error fetching live trip details:', error);
    return { success: false, error };
  }
};

export const updateTrip = async (tripId: string, tripData: any) => {
  const { running_status, capacity_status, speed_kmh, end_time } = tripData;
  const query = `
    UPDATE trips
    SET
      running_status = COALESCE($1, running_status),
      capacity_status = COALESCE($2, capacity_status),
      speed_kmh = COALESCE($3, speed_kmh),
      end_time = COALESCE($4, end_time),
      actual_end_time = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE actual_end_time END,
      actual_start_time = CASE WHEN $1 = 'RUNNING' THEN COALESCE(actual_start_time, CURRENT_TIMESTAMP) ELSE actual_start_time END
    WHERE trip_id = $5
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [running_status, capacity_status, speed_kmh, end_time, tripId]);
    return { success: true, trip: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateTrip:', error);
    return { success: false, error };
  }
};

export const cancelTrip = async (tripId: string) => {
  const query = `
    UPDATE trips 
    SET 
      running_status = 'CANCELLED',
      actual_end_time = CURRENT_TIMESTAMP
    WHERE trip_id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [tripId]);
    return { success: true, trip: result.rows[0] };
  } catch (error) {
    console.error('Database query error in cancelTrip:', error);
    return { success: false, error };
  }
};

export const updateTripCapacity = async (tripId: string, capacity: string) => {
  const query = `
    UPDATE trips 
    SET capacity_status = $1
    WHERE trip_id = $2
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [capacity, tripId]);
    return { success: true, trip: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateTripCapacity:', error);
    return { success: false, error };
  }
};

export const updateTripStopStatus = async (tripId: string, stopId: string, status: string) => {
  const query = `
    UPDATE trip_stops 
    SET 
      arrival_status = $1,
      actual_arrival = CASE WHEN $1 = 'ARRIVED' OR $1 = 'COMPLETED' THEN COALESCE(actual_arrival, CURRENT_TIMESTAMP::text) ELSE actual_arrival END,
      actual_departure = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP::text ELSE actual_departure END
    WHERE trip_id = $2 AND stop_id = $3
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [status, tripId, stopId]);
    return { success: true, tripStop: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateTripStopStatus:', error);
    return { success: false, error };
  }
};

export const fetchAllTripStops = async () => {
  const query = `
    SELECT 
      ts.trip_id,
      ts.stop_id,
      ts.stop_sequence,
      ts.arrival_status,
      ts.actual_arrival,
      ts.actual_departure,
      s.stop_name,
      s.latitude,
      s.longitude
    FROM trip_stops ts
    JOIN stops s ON ts.stop_id = s.stop_id
    ORDER BY ts.trip_id, ts.stop_sequence ASC;
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllTripStops:', error);
    return [];
  }
};
