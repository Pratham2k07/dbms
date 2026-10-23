import pool from './connection';
import { getRoadRouteGeometry } from '../services/routing.service';

export async function populateRouteGeometries() {
  console.log('[SEED_ROADS] Populating real road geometries for all routes via OSRM...');

  const client = await pool.connect();
  try {
    // Ensure ROUTE-06 has stops
    await client.query(`
      INSERT INTO route_stops (route_id, stop_id, sequence_number)
      VALUES 
        ('ROUTE-06', 'STOP-JKLU-START', 1),
        ('ROUTE-06', 'STOP-MANSAROVAR', 2),
        ('ROUTE-06', 'STOP-DCM', 3),
        ('ROUTE-06', 'STOP-JKLU', 4)
      ON CONFLICT (route_id, stop_id) DO NOTHING;
    `);

    const routesRes = await client.query('SELECT route_id, route_code, route_name FROM routes ORDER BY route_id');
    const routes = routesRes.rows;

    for (const r of routes) {
      console.log(`\nProcessing route: ${r.route_code} (${r.route_id}) - ${r.route_name}`);
      const stopsRes = await client.query(`
        SELECT s.stop_id, s.stop_name, s.latitude, s.longitude, rs.sequence_number
        FROM route_stops rs
        JOIN stops s ON rs.stop_id = s.stop_id
        WHERE rs.route_id = $1
        ORDER BY rs.sequence_number ASC
      `, [r.route_id]);

      const stops = stopsRes.rows;
      if (stops.length < 2) {
        console.log(`  Route has less than 2 stops (${stops.length}), skipping.`);
        continue;
      }

      console.log(`  Querying OSRM road path across ${stops.length} stops: ${stops.map(s => s.stop_id).join(' -> ')}`);
      const geoResult = await getRoadRouteGeometry(stops);

      console.log(`  Road geometry obtained: ${geoResult.coordinates.length} points, ${geoResult.total_distance_km} km (source: ${geoResult.source})`);

      // 1. Update route
      await client.query(`
        UPDATE routes
        SET 
          route_coordinates = $1,
          total_distance_km = $2
        WHERE route_id = $3
      `, [JSON.stringify(geoResult.coordinates), geoResult.total_distance_km, r.route_id]);

      // 2. Update route stops cumulative and segment distances
      for (const sd of geoResult.stopDistances) {
        await client.query(`
          UPDATE route_stops
          SET
            distance_from_prev_km = $1,
            cumulative_distance_km = $2
          WHERE route_id = $3 AND stop_id = $4
        `, [sd.distance_from_prev_km, sd.cumulative_distance_km, r.route_id, sd.stop_id]);
      }
      console.log(`  Updated route_stops distances successfully.`);
    }

    console.log('\n[SEED_ROADS] All routes successfully updated with real road geometry!');
  } catch (error) {
    console.error('[SEED_ROADS] Error populating route geometries:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  populateRouteGeometries()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
