import pool from './connection';
import bcrypt from 'bcryptjs';
import { populateRouteGeometries } from './seed_road_routes';

export async function seedAllRoutes() {
  console.log('[SEED_ROUTES] Starting route and auth verification...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Ensure routes table has assigned_shuttle_id and assigned_driver_id columns
    await client.query(`
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS assigned_shuttle_id VARCHAR(50);
      ALTER TABLE routes ADD COLUMN IF NOT EXISTS assigned_driver_id VARCHAR(50);
    `);

    // 2. Ensure all 3 real routes exist with proper codes and descriptions
    const routesData = [
      {
        route_id: 'ROUTE-01',
        route_code: 'R-01',
        route_name: 'JKLU ⟲ MALVIYA NAGAR CIRCUIT',
        total_stops: 5,
        description: 'JKLU Campus → Malviya Nagar → Airport → DCM → JKLU Campus',
        color: '#E8590C',
        status: 'ACTIVE',
        assigned_shuttle_id: 'SHT-01',
        assigned_driver_id: 'DRV-101'
      },
      {
        route_id: 'ROUTE-02',
        route_code: 'R-02',
        route_name: 'JKLU ⟲ MANSAROVAR CIRCUIT',
        total_stops: 5,
        description: 'JKLU Campus → Mansarovar Metro → Vaishali Nagar → DCM → JKLU Campus',
        color: '#2B4C7E',
        status: 'ACTIVE',
        assigned_shuttle_id: 'SHT-02',
        assigned_driver_id: 'DRV-102'
      },
      {
        route_id: 'ROUTE-03',
        route_code: 'R-03',
        route_name: 'JKLU ⟲ RAILWAY STATION CIRCUIT',
        total_stops: 5,
        description: 'JKLU Campus → Railway Station → Vaishali Nagar → DCM → JKLU Campus',
        color: '#D97706',
        status: 'ACTIVE',
        assigned_shuttle_id: 'SHT-03',
        assigned_driver_id: 'DRV-103'
      }
    ];

    for (const r of routesData) {
      await client.query(`
        INSERT INTO routes (route_id, route_code, route_name, total_stops, description, color, status, assigned_shuttle_id, assigned_driver_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (route_id) DO UPDATE SET
          route_code = EXCLUDED.route_code,
          route_name = EXCLUDED.route_name,
          total_stops = EXCLUDED.total_stops,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          status = EXCLUDED.status,
          assigned_shuttle_id = EXCLUDED.assigned_shuttle_id,
          assigned_driver_id = EXCLUDED.assigned_driver_id;
      `, [
        r.route_id,
        r.route_code,
        r.route_name,
        r.total_stops,
        r.description,
        r.color,
        r.status,
        r.assigned_shuttle_id,
        r.assigned_driver_id
      ]);
    }

    // 3. Ensure route_stops are present
    const routeStopsData = [
      // Route 01
      { route_id: 'ROUTE-01', stop_id: 'STOP-JKLU-START', sequence: 1, arr: '09:45 AM', dep: '09:50 AM' },
      { route_id: 'ROUTE-01', stop_id: 'STOP-MALVIYA-NAGAR', sequence: 2, arr: '10:15 AM', dep: '10:20 AM' },
      { route_id: 'ROUTE-01', stop_id: 'STOP-AIRPORT', sequence: 3, arr: '10:35 AM', dep: '10:40 AM' },
      { route_id: 'ROUTE-01', stop_id: 'STOP-DCM', sequence: 4, arr: '10:55 AM', dep: '10:58 AM' },
      { route_id: 'ROUTE-01', stop_id: 'STOP-JKLU', sequence: 5, arr: '11:15 AM', dep: '11:20 AM' },

      // Route 02
      { route_id: 'ROUTE-02', stop_id: 'STOP-JKLU-START', sequence: 1, arr: '09:30 AM', dep: '09:35 AM' },
      { route_id: 'ROUTE-02', stop_id: 'STOP-MANSAROVAR', sequence: 2, arr: '10:00 AM', dep: '10:05 AM' },
      { route_id: 'ROUTE-02', stop_id: 'STOP-VAISHALI', sequence: 3, arr: '10:20 AM', dep: '10:23 AM' },
      { route_id: 'ROUTE-02', stop_id: 'STOP-DCM', sequence: 4, arr: '10:35 AM', dep: '10:38 AM' },
      { route_id: 'ROUTE-02', stop_id: 'STOP-JKLU', sequence: 5, arr: '10:55 AM', dep: '11:00 AM' },

      // Route 03
      { route_id: 'ROUTE-03', stop_id: 'STOP-JKLU-START', sequence: 1, arr: '09:40 AM', dep: '09:45 AM' },
      { route_id: 'ROUTE-03', stop_id: 'STOP-RAILWAY-STN', sequence: 2, arr: '10:10 AM', dep: '10:15 AM' },
      { route_id: 'ROUTE-03', stop_id: 'STOP-VAISHALI', sequence: 3, arr: '10:30 AM', dep: '10:33 AM' },
      { route_id: 'ROUTE-03', stop_id: 'STOP-DCM', sequence: 4, arr: '10:45 AM', dep: '10:48 AM' },
      { route_id: 'ROUTE-03', stop_id: 'STOP-JKLU', sequence: 5, arr: '11:05 AM', dep: '11:10 AM' }
    ];

    for (const rs of routeStopsData) {
      await client.query(`
        INSERT INTO route_stops (route_id, stop_id, sequence_number, scheduled_arrival, scheduled_departure)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (route_id, stop_id) DO UPDATE SET
          sequence_number = EXCLUDED.sequence_number,
          scheduled_arrival = EXCLUDED.scheduled_arrival,
          scheduled_departure = EXCLUDED.scheduled_departure;
      `, [rs.route_id, rs.stop_id, rs.sequence, rs.arr, rs.dep]);
    }

    // 4. Fix password hashes for default demo accounts so authentication succeeds
    const salt = await bcrypt.genSalt(10);
    const validHash = await bcrypt.hash('password123', salt);
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE user_id IN ('USR-ADM-001', 'USR-STU-001', 'DRV-101', 'DRV-102', 'DRV-103', 'DRV-104');
    `, [validHash]);

    await client.query('COMMIT');
    console.log('[SEED_ROUTES] Routes, stops sequence, and user passwords committed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SEED_ROUTES] Error in seedAllRoutes:', error);
    throw error;
  } finally {
    client.release();
  }

  // 5. Compute road geometries via OSRM for all routes
  await populateRouteGeometries();
}

if (require.main === module) {
  seedAllRoutes()
    .then(() => {
      console.log('[SEED_ROUTES] Complete.');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
