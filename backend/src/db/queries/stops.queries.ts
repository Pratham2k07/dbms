import pool from '../connection';

export const fetchAllRoutes = async () => {
  const query = `
    SELECT 
      r.route_id, 
      r.route_code, 
      r.route_name, 
      r.total_stops, 
      r.description, 
      r.color, 
      r.status
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

export const fetchStopsForRoute = async (routeId: string) => {
  const query = `
    SELECT 
      s.stop_id, 
      s.stop_name, 
      s.latitude, 
      s.longitude, 
      s.is_destination, 
      s.description,
      rs.sequence_number
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
  const { route_id, route_code, route_name, total_stops, description, color, status, stop_ids } = routeData;
  const newRouteId = route_id || `ROUTE-${Date.now().toString().slice(-4)}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const routeQuery = `
      INSERT INTO routes (route_id, route_code, route_name, total_stops, description, color, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const routeRes = await client.query(routeQuery, [
      newRouteId,
      route_code || 'R-NEW',
      route_name || 'New University Route',
      total_stops || (stop_ids ? stop_ids.length : 0),
      description || '',
      color || '#E8590C',
      status || 'ACTIVE'
    ]);

    if (Array.isArray(stop_ids) && stop_ids.length > 0) {
      for (let i = 0; i < stop_ids.length; i++) {
        await client.query(
          `INSERT INTO route_stops (route_id, stop_id, sequence_number)
           VALUES ($1, $2, $3)
           ON CONFLICT (route_id, stop_id) DO UPDATE SET sequence_number = $3;`,
          [newRouteId, stop_ids[i], i + 1]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true, route: routeRes.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error in createRoute:', error);
    return { success: false, error };
  } finally {
    client.release();
  }
};

export const updateRoute = async (routeId: string, routeData: any) => {
  const { route_name, description, color, status, stop_ids } = routeData;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE routes 
      SET 
        route_name = COALESCE($1, route_name),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        status = COALESCE($4, status)
      WHERE route_id = $5
      RETURNING *;
    `;
    const res = await client.query(updateQuery, [route_name, description, color, status, routeId]);

    if (Array.isArray(stop_ids)) {
      await client.query(`DELETE FROM route_stops WHERE route_id = $1;`, [routeId]);
      for (let i = 0; i < stop_ids.length; i++) {
        await client.query(
          `INSERT INTO route_stops (route_id, stop_id, sequence_number) VALUES ($1, $2, $3);`,
          [routeId, stop_ids[i], i + 1]
        );
      }
      await client.query(`UPDATE routes SET total_stops = $1 WHERE route_id = $2;`, [stop_ids.length, routeId]);
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
