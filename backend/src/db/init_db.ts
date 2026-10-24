import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runInit() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase PostgreSQL database.');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema and seed SQL...');
    await client.query(sql);
    console.log('✅ Schema & Seed Data applied successfully to Supabase!');

    // Verify row counts
    const tables = ['users', 'students', 'drivers', 'admins', 'shuttles', 'routes', 'stops', 'route_stops', 'trips', 'trip_stops', 'shuttle_locations'];
    console.log('\n--- VERIFICATION OF TABLES ---');
    for (const tbl of tables) {
      const res = await client.query(`SELECT COUNT(*) as count FROM ${tbl}`);
      console.log(`• Table "${tbl}": ${res.rows[0].count} records`);
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runInit();
