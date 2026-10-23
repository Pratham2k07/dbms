import pool from '../connection';

export const fetchAllDrivers = async () => {
  const query = `
    SELECT 
      d.driver_id,
      d.license_no,
      u.name,
      u.email,
      u.phone_number,
      u.user_id,
      t.shuttle_id AS assigned_shuttle_id
    FROM drivers d
    INNER JOIN users u ON d.driver_id = u.user_id
    LEFT JOIN (
      SELECT driver_id, shuttle_id 
      FROM trips 
      WHERE running_status = 'RUNNING' 
      ORDER BY trip_id DESC 
      LIMIT 1
    ) t ON d.driver_id = t.driver_id
    ORDER BY d.driver_id ASC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error in fetchAllDrivers:', error);
    return [];
  }
};

export const createDriver = async (driverData: any) => {
  const { driver_id, name, phone_number, license_no, email, password } = driverData;
  const newDriverId = driver_id || `DRV-${Date.now().toString().slice(-4)}`;
  const driverEmail = email || `${name.toLowerCase().replace(/\s+/g, '.') || 'driver'}@jklu.edu.in`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert into users
    const userQuery = `
      INSERT INTO users (user_id, name, email, password_hash, phone_number, role)
      VALUES ($1, $2, $3, $4, $5, 'driver')
      ON CONFLICT (user_id) DO UPDATE SET name = $2, phone_number = $5;
    `;
    await client.query(userQuery, [
      newDriverId,
      name,
      driverEmail,
      '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', // default password123
      phone_number
    ]);

    // 2. Insert into drivers
    const driverQuery = `
      INSERT INTO drivers (driver_id, license_no)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const res = await client.query(driverQuery, [newDriverId, license_no || 'RJ14-PENDING']);

    await client.query('COMMIT');
    return { success: true, driver: { ...res.rows[0], name, phone_number, email: driverEmail } };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error in createDriver:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const updateDriver = async (driverId: string, driverData: any) => {
  const { name, phone_number, license_no } = driverData;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (name || phone_number) {
      await client.query(
        `UPDATE users 
         SET name = COALESCE($1, name), phone_number = COALESCE($2, phone_number)
         WHERE user_id = $3;`,
        [name, phone_number, driverId]
      );
    }

    if (license_no) {
      await client.query(
        `UPDATE drivers SET license_no = $1 WHERE driver_id = $2;`,
        [license_no, driverId]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error in updateDriver:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const deleteDriver = async (driverId: string) => {
  // Deleting user will cascade to drivers table
  const query = `DELETE FROM users WHERE user_id = $1 RETURNING user_id;`;
  try {
    const result = await pool.query(query, [driverId]);
    return { success: true, deleted: result.rowCount ? result.rowCount > 0 : false };
  } catch (error) {
    console.error('Database query error in deleteDriver:', error);
    return { success: false, error };
  }
};

// Shift functions
export const assignShuttleToDriver = async (driverId: string, shuttleId: string) => {
  const query = `
    UPDATE trips 
    SET running_status = 'RUNNING' 
    WHERE driver_id = $1 AND shuttle_id = $2 AND running_status = 'SCHEDULED'
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [driverId, shuttleId]);
    return { success: true, trip: result.rows[0] || null };
  } catch (error) {
    console.error('Database query error in assignShuttleToDriver:', error);
    return { success: false, error };
  }
};

export const endDriverShift = async (driverId: string) => {
  const query = `
    UPDATE trips 
    SET running_status = 'COMPLETED', end_time = CURRENT_TIMESTAMP::text
    WHERE driver_id = $1 AND running_status = 'RUNNING'
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [driverId]);
    return { success: true, completedTrips: result.rows };
  } catch (error) {
    console.error('Database query error in endDriverShift:', error);
    return { success: false, error };
  }
};
