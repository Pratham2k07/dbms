import { pool } from '../config/db.js';
import { getRoadRouteGeometry } from '../services/routing.service.js';

export async function populateRouteGeometries() {
  console.log('[ROUTING] Computing and populating road pathways for routes...');
  const client = await pool.connect();
  try {
    const routesRes = await client.query('SELECT route_id, route_code, route_name FROM routes ORDER BY route_id');
    const routes = routesRes.rows;

    for (const r of routes) {
      console.log(`Processing ${r.route_code} (${r.route_id})...`);
      const stopsRes = await client.query(
        `SELECT s.stop_id, s.stop_name, s.latitude, s.longitude, rs.sequence_number
         FROM route_stops rs
         JOIN stops s ON rs.stop_id = s.stop_id
         WHERE rs.route_id = $1
         ORDER BY rs.sequence_number ASC`,
        [r.route_id]
      );

      const stops = stopsRes.rows;
      if (stops.length < 2) {
        console.log(`  Route has fewer than 2 stops, skipping.`);
        continue;
      }

      console.log(`  Routing across ${stops.length} stops: ${stops.map((s: any) => s.stop_name).join(' → ')}`);
      const geoResult = await getRoadRouteGeometry(stops);
      console.log(`  Obtained pathway: ${geoResult.coordinates.length} waypoints, ${geoResult.total_distance_km} km (source: ${geoResult.source})`);

      await client.query(
        'UPDATE routes SET route_coordinates = $1, total_distance_km = $2 WHERE route_id = $3',
        [JSON.stringify(geoResult.coordinates), geoResult.total_distance_km, r.route_id]
      );

      for (const sd of geoResult.stopDistances) {
        await client.query(
          'UPDATE route_stops SET cumulative_distance_km = $1 WHERE route_id = $2 AND stop_id = $3',
          [sd.cumulative_distance_km, r.route_id, sd.stop_id]
        );
      }
    }
    console.log('[ROUTING] All routes updated with real pathway geometry successfully!');
  } catch (err) {
    console.error('Error populating geometries:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

populateRouteGeometries();
