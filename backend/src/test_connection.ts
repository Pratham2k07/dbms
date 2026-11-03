import { pool } from './config/db.js';

async function testConnection() {
  console.log('Testing MySQL connection...');
  try {
    const res = await pool.query('SELECT NOW() AS current_time, COUNT(*) AS total_stops FROM stops;');
    console.log('✅ Connection successful!');
    console.log('Database current time:', res.rows[0].current_time);
    console.log('Total seeded stops found in MySQL:', res.rows[0].total_stops);

    const routesRes = await pool.query('SELECT route_code, route_name FROM routes ORDER BY route_code ASC;');
    console.log('\nActive Routes in MySQL:');
    routesRes.rows.forEach((r: any) => console.log(` - [${r.route_code}] ${r.route_name}`));

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
