import pool from '../connection';

export const fetchAllShuttles = async () => {
  const query = `
    SELECT 
      shuttle_id,
      registration_number,
      capacity,
      status,
      COALESCE(shuttle_number, shuttle_id) AS shuttle_number
    FROM shuttles
    ORDER BY shuttle_id ASC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllShuttles:', error);
    return [];
  }
};

export const fetchShuttleById = async (id: string) => {
  const query = `
    SELECT 
      shuttle_id,
      registration_number,
      capacity,
      status,
      COALESCE(shuttle_number, shuttle_id) AS shuttle_number
    FROM shuttles
    WHERE shuttle_id = $1
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error in fetchShuttleById:', error);
    return null;
  }
};

export const createShuttle = async (shuttleData: any) => {
  let { shuttle_id, registration_number, capacity, status, shuttle_number } = shuttleData;
  const client = await pool.connect();

  try {
    if (!shuttle_id) {
      const maxRes = await client.query(`
        SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(shuttle_id, '\\D', '', 'g'), '') AS INTEGER)), 0) AS max_num 
        FROM shuttles
      `);
      const nextNum = (maxRes.rows[0]?.max_num || 0) + 1;
      shuttle_id = `SHT-${String(nextNum).padStart(2, '0')}`;
    }

    const reg = (registration_number || `RJ 14 PX ${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const label = shuttle_number || `SHUTTLE ${shuttle_id.replace(/\D/g, '') || '01'}`;

    // If registration_number already exists on a DIFFERENT shuttle_id, append suffix to avoid constraint violation
    const regConflict = await client.query(
      `SELECT shuttle_id FROM shuttles WHERE registration_number = $1 AND shuttle_id != $2`,
      [reg, shuttle_id]
    );
    const finalReg = regConflict.rows.length > 0 ? `${reg}-${Date.now().toString().slice(-2)}` : reg;

    const query = `
      INSERT INTO shuttles (shuttle_id, registration_number, capacity, status, shuttle_number)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (shuttle_id) DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        capacity = EXCLUDED.capacity,
        status = EXCLUDED.status,
        shuttle_number = EXCLUDED.shuttle_number
      RETURNING *;
    `;

    const result = await client.query(query, [
      shuttle_id,
      finalReg,
      Number(capacity) || 32,
      status || 'ACTIVE',
      label
    ]);
    return { success: true, shuttle: result.rows[0] };
  } catch (error) {
    console.error('Database query error in createShuttle:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const updateShuttle = async (shuttleId: string, shuttleData: any) => {
  const { registration_number, capacity, status, shuttle_number } = shuttleData;
  const query = `
    UPDATE shuttles
    SET
      registration_number = COALESCE($1, registration_number),
      capacity = COALESCE($2, capacity),
      status = COALESCE($3, status),
      shuttle_number = COALESCE($4, shuttle_number)
    WHERE shuttle_id = $5
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      registration_number,
      capacity ? Number(capacity) : null,
      status,
      shuttle_number,
      shuttleId
    ]);
    return { success: true, shuttle: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateShuttle:', error);
    return { success: false, error };
  }
};

export const updateShuttleStatus = async (shuttleId: string, status: string) => {
  const query = `
    UPDATE shuttles
    SET status = $1
    WHERE shuttle_id = $2
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [status, shuttleId]);
    return { success: true, shuttle: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateShuttleStatus:', error);
    return { success: false, error };
  }
};

import { projectVehicleOnRoute, haversineDistanceMeters, calculateTheoreticalEtaMinutes } from '../../services/routing.service';

export const getLatestShuttleLocation = async (shuttleId: string) => {
  const query = `
    SELECT 
      sl.*,
      t.route_id,
      t.running_status,
      r.route_name,
      r.route_code,
      s.shuttle_number,
      s.registration_number
    FROM shuttle_locations sl
    LEFT JOIN trips t ON sl.trip_id = t.trip_id
    LEFT JOIN routes r ON t.route_id = r.route_id
    LEFT JOIN shuttles s ON sl.shuttle_id = s.shuttle_id
    WHERE sl.shuttle_id = $1
    ORDER BY sl.recorded_at DESC
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [shuttleId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error in getLatestShuttleLocation:', error);
    return null;
  }
};

export const updateShuttleCoordinates = async (
  id: string,
  lat: number,
  lng: number,
  options?: { speed_kmh?: number; bearing?: number; progress_percentage?: number; trip_id?: string; driver_id?: string; accuracy_m?: number }
) => {
  const query = `
    INSERT INTO shuttle_locations (shuttle_id, trip_id, driver_id, latitude, longitude, bearing, speed_kmh, progress_percentage, accuracy_m, recorded_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      id,
      options?.trip_id || null,
      options?.driver_id || null,
      lat,
      lng,
      options?.bearing || 0,
      options?.speed_kmh || 0,
      options?.progress_percentage || 0,
      options?.accuracy_m || null
    ]);
    return { success: true, location: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateShuttleCoordinates:', error);
    return { success: false, error };
  }
};

export const recordDriverGpsLocation = async (params: {
  driver_id: string;
  trip_id: string;
  shuttle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  bearing?: number;
  accuracy_m?: number;
  gps_timestamp?: string;
}) => {
  const { driver_id, trip_id, shuttle_id, latitude, longitude, speed_kmh, bearing, accuracy_m, gps_timestamp } = params;

  // Coordinate validity check
  if (isNaN(latitude) || latitude < -90 || latitude > 90 || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { success: false, error: 'Invalid geographic coordinates provided.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Validate active trip
    const tripRes = await client.query(
      `SELECT t.*, r.route_coordinates, r.total_distance_km
       FROM trips t
       JOIN routes r ON t.route_id = r.route_id
       WHERE t.trip_id = $1`,
      [trip_id]
    );

    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: `Trip ${trip_id} not found.` };
    }

    const trip = tripRes.rows[0];

    // Trip must be actively RUNNING
    if (trip.running_status !== 'RUNNING') {
      await client.query('ROLLBACK');
      return { 
        success: false, 
        error: `Cannot accept GPS telemetry. Trip ${trip_id} is currently ${trip.running_status}.` 
      };
    }

    // Server-side authorization check: driver must match assigned driver
    if (driver_id && trip.driver_id !== driver_id) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Unauthorized. You are not the assigned driver for this active trip.' };
    }

    // 2. Project vehicle onto real road route geometry
    const routeCoords = trip.route_coordinates || [];
    const totalDistKm = Number(trip.total_distance_km) || 0;
    const projection = projectVehicleOnRoute(latitude, longitude, routeCoords, totalDistKm);

    const calculatedBearing = (bearing !== undefined && bearing !== null && !isNaN(bearing) && bearing > 0)
      ? bearing
      : 0;

    const recordedSpeed = (speed_kmh !== undefined && speed_kmh !== null && !isNaN(speed_kmh))
      ? Number(speed_kmh)
      : 0;

    // 3. Persist real telemetry record
    const insertLocRes = await client.query(
      `INSERT INTO shuttle_locations (
         shuttle_id, trip_id, driver_id, latitude, longitude, bearing, speed_kmh, progress_percentage, accuracy_m, gps_timestamp, recorded_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamptz, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
       RETURNING *;`,
      [
        trip.shuttle_id,
        trip_id,
        trip.driver_id,
        latitude,
        longitude,
        calculatedBearing,
        recordedSpeed,
        projection.progressPercentage,
        accuracy_m || null,
        gps_timestamp || null
      ]
    );
    const savedLocation = insertLocRes.rows[0];

    // 4. Update trip current speed
    await client.query(
      `UPDATE trips SET speed_kmh = $1 WHERE trip_id = $2;`,
      [recordedSpeed, trip_id]
    );

    // 5. Automatic Stop Arrival & Departure Detection (Requirement 7.E)
    const tripStopsRes = await client.query(
      `SELECT ts.*, s.stop_name, s.latitude, s.longitude, rs.sequence_number, rs.cumulative_distance_km
       FROM trip_stops ts
       JOIN stops s ON ts.stop_id = s.stop_id
       LEFT JOIN route_stops rs ON rs.route_id = $1 AND rs.stop_id = s.stop_id
       WHERE ts.trip_id = $2
       ORDER BY COALESCE(rs.sequence_number, 999) ASC;`,
      [trip.route_id, trip_id]
    );

    let stopArrivalTriggered: any = null;
    const upcomingStops = [];
    for (const ts of tripStopsRes.rows) {
      const distToStopMeters = haversineDistanceMeters(
        latitude,
        longitude,
        Number(ts.latitude),
        Number(ts.longitude)
      );

      // Arrival threshold: 75m
      if (distToStopMeters <= 75 && (ts.arrival_status === 'SCHEDULED' || ts.arrival_status === 'APPROACHING')) {
        await client.query(
          `UPDATE trip_stops 
           SET 
             arrival_status = 'ARRIVED',
             actual_arrival = COALESCE(actual_arrival, CURRENT_TIMESTAMP::text)
           WHERE trip_id = $1 AND stop_id = $2;`,
          [trip_id, ts.stop_id]
        );
        ts.arrival_status = 'ARRIVED';
        stopArrivalTriggered = {
          trip_id,
          stop_id: ts.stop_id,
          stop_name: ts.stop_name,
          arrival_status: 'ARRIVED',
          timestamp: new Date().toISOString()
        };
      }
      // Departure threshold: > 100m after being ARRIVED
      else if (distToStopMeters > 100 && ts.arrival_status === 'ARRIVED') {
        await client.query(
          `UPDATE trip_stops 
           SET 
             arrival_status = 'COMPLETED',
             actual_departure = COALESCE(actual_departure, CURRENT_TIMESTAMP::text)
           WHERE trip_id = $1 AND stop_id = $2;`,
          [trip_id, ts.stop_id]
        );
        ts.arrival_status = 'COMPLETED';
      }

      const stopCumKm = Number(ts.cumulative_distance_km) || 0;
      const remainingRoadKm = Math.max(0, Number((stopCumKm - projection.distanceFromStartKm).toFixed(2)));
      const theoreticalEta = calculateTheoreticalEtaMinutes(remainingRoadKm, 25);

      upcomingStops.push({
        stop_id: ts.stop_id,
        stop_name: ts.stop_name,
        arrival_status: ts.arrival_status,
        distance_to_bus_meters: Math.round(distToStopMeters),
        remaining_road_distance_km: remainingRoadKm,
        theoretical_eta_minutes: theoreticalEta
      });
    }

    await client.query('COMMIT');

    return {
      success: true,
      location: savedLocation,
      projection,
      upcomingStops,
      stopArrivalTriggered
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording driver GPS location:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};
