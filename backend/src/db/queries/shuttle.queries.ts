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
  const { shuttle_id, registration_number, capacity, status, shuttle_number } = shuttleData;
  const newShuttleId = shuttle_id || `SHT-${Date.now().toString().slice(-4)}`;

  const query = `
    INSERT INTO shuttles (shuttle_id, registration_number, capacity, status, shuttle_number)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      newShuttleId,
      registration_number,
      Number(capacity) || 32,
      status || 'ACTIVE',
      shuttle_number || newShuttleId
    ]);
    return { success: true, shuttle: result.rows[0] };
  } catch (error) {
    console.error('Database query error in createShuttle:', error);
    return { success: false, error };
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

export const updateShuttleCoordinates = async (
  id: string,
  lat: number,
  lng: number,
  options?: { speed_kmh?: number; bearing?: number; progress_percentage?: number; trip_id?: string }
) => {
  const query = `
    INSERT INTO shuttle_locations (shuttle_id, trip_id, latitude, longitude, bearing, speed_kmh, progress_percentage)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      id,
      options?.trip_id || null,
      lat,
      lng,
      options?.bearing || 0,
      options?.speed_kmh || 0,
      options?.progress_percentage || 0
    ]);
    return { success: true, location: result.rows[0] };
  } catch (error) {
    console.error('Database query error in updateShuttleCoordinates:', error);
    return { success: false, error };
  }
};
