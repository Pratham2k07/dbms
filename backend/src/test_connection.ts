import pool from './db/connection';

async function testConnection() {
  console.log('Testing Supabase PostgreSQL connection...');
  try {
    const res = await pool.query('SELECT NOW() AS current_time, COUNT(*)::int AS total_stops FROM stops;');
    console.log('✅ Connection successful!');
    console.log('Database current time:', res.rows[0].current_time);
    console.log('Total seeded stops found in Supabase:', res.rows[0].total_stops);

    const routesRes = await pool.query('SELECT route_code, route_name FROM routes ORDER BY route_code ASC;');
    console.log('\nActive Routes in Supabase:');
    routesRes.rows.forEach(r => console.log(` - [${r.route_code}] ${r.route_name}`));

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
