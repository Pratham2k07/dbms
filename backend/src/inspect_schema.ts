import pool from './db/connection';

async function inspect() {
  const tables = [
    'users', 'students', 'drivers', 'admins', 
    'shuttles', 'routes', 'stops', 'route_stops', 
    'trips', 'trip_stops', 'shuttle_locations', 'student_locations'
  ];
  for (const t of tables) {
    const res = await pool.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
      [t]
    );
    console.log(`TABLE: ${t}`);
    console.log(`  Columns: ${res.rows.map(c => `${c.column_name} (${c.data_type})`).join(', ')}`);
  }

  // Check existing constraints and indexes
  const constraints = await pool.query(`
    SELECT conname, contype, relname 
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE cl.relname IN ('routes', 'trips', 'route_stops', 'trip_stops', 'shuttle_locations', 'student_locations')
  `);
  console.log('\nCONSTRAINTS:');
  console.table(constraints.rows);

  await pool.end();
}

inspect().catch(console.error);
