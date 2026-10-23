import pool from '../connection';

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
      r.route_name,
      r.route_code,
      s.registration_number,
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

export const createTrip = async (tripData: any) => {
  const { trip_id, route_id, shuttle_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh } = tripData;
  const newTripId = trip_id || `TRIP-${Date.now().toString().slice(-4)}`;

  const query = `
    INSERT INTO trips (trip_id, shuttle_id, route_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      newTripId,
      shuttle_id,
      route_id,
      driver_id,
      start_time || '09:00 AM',
      end_time || null,
      running_status || 'SCHEDULED',
      capacity_status || 'AVAILABLE',
      Number(speed_kmh) || 0
    ]);
    return { success: true, trip: result.rows[0] };
  } catch (error) {
    console.error('Database query error in createTrip:', error);
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
      end_time = COALESCE($4, end_time)
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
    SET running_status = 'CANCELLED'
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
      actual_arrival = CASE WHEN $1 = 'ARRIVED' OR $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP::text ELSE actual_arrival END
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
