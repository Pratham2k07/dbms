import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || '123456';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'jklu_shuttle_db';

async function runInit() {
  const defaultSockets = [
    process.env.MYSQL_SOCKET,
    '/var/lib/mysql/mysql.sock',
    '/var/run/mysqld/mysqld.sock',
    '/tmp/mysql.sock'
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

  const detectedSocket = defaultSockets.length > 0 ? defaultSockets[0] : undefined;

  const connection = await mysql.createConnection({
    ...(detectedSocket ? { socketPath: detectedSocket } : { host: mysqlHost, port: mysqlPort }),
    user: mysqlUser,
    password: mysqlPassword,
    multipleStatements: true,
  });

  try {
    console.log(`Connected to MySQL (${detectedSocket ? `Socket: ${detectedSocket}` : `${mysqlHost}:${mysqlPort}`}).`);
    const schemaPath = path.join(__dirname, 'schema_mysql.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Executing ${schemaPath} schema and seed data...`);
    await connection.query(sql);
    console.log('✅ Schema & Seed Data applied successfully to MySQL!');

    // Switch to database and verify row counts
    await connection.query(`USE ${mysqlDatabase};`);
    const tables = ['users', 'students', 'drivers', 'admins', 'shuttles', 'routes', 'stops', 'route_stops', 'trips', 'trip_stops', 'shuttle_locations'];
    console.log('\n--- VERIFICATION OF MYSQL TABLES ---');
    for (const tbl of tables) {
      const [rows]: any = await connection.query(`SELECT COUNT(*) as count FROM ${tbl}`);
      console.log(`• Table "${tbl}": ${rows[0].count} records`);
    }
  } catch (err) {
    console.error('MySQL database initialization failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runInit();
