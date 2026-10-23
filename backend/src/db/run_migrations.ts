import fs from 'fs';
import path from 'path';
import pool from './connection';

export async function runMigrations() {
  const migrationPath = path.join(__dirname, 'migrations', '001_real_gps_tracking.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('[MIGRATION] Applying 001_real_gps_tracking.sql...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[MIGRATION] Migration 001 applied successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Failed to apply migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
