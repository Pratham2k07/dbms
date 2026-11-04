import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let mysqlHost = process.env.MYSQL_HOST || 'localhost';
let mysqlPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
let mysqlUser = process.env.MYSQL_USER || 'root';
let mysqlPassword = process.env.MYSQL_PASSWORD || '123456';
let mysqlDatabase = process.env.MYSQL_DATABASE || 'jklu_shuttle_db';

const rawUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (rawUri && rawUri.startsWith('mysql')) {
  try {
    const parsed = new URL(rawUri);
    if (parsed.hostname) mysqlHost = parsed.hostname;
    if (parsed.port) mysqlPort = parseInt(parsed.port, 10);
    if (parsed.username) mysqlUser = decodeURIComponent(parsed.username);
    if (parsed.password) mysqlPassword = decodeURIComponent(parsed.password);
    if (parsed.pathname && parsed.pathname.length > 1) mysqlDatabase = parsed.pathname.slice(1);
  } catch (err) {
    console.warn('Could not parse database URI, using individual MYSQL_* variables.');
  }
}

async function runInit() {
  const isRemote = mysqlHost !== 'localhost' && mysqlHost !== '127.0.0.1';

  const defaultSockets = !isRemote ? [
    process.env.MYSQL_SOCKET,
    '/var/lib/mysql/mysql.sock',
    '/var/run/mysqld/mysqld.sock',
    '/tmp/mysql.sock'
  ].filter((p): p is string => Boolean(p && fs.existsSync(p))) : [];

  const detectedSocket = defaultSockets.length > 0 ? defaultSockets[0] : undefined;

  const sslOption = isRemote || process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === '1'
    ? { rejectUnauthorized: false }
    : undefined;

  const connectionConfig: any = {
    ...(detectedSocket ? { socketPath: detectedSocket } : { host: mysqlHost, port: mysqlPort }),
    user: mysqlUser,
    password: mysqlPassword,
    multipleStatements: true,
    ...(sslOption ? { ssl: sslOption } : {})
  };

  // If remote and database is specified (e.g. defaultdb on Aiven/Railway), preselect it
  if (isRemote && mysqlDatabase) {
    connectionConfig.database = mysqlDatabase;
  }

  console.log(`Connecting to MySQL at ${detectedSocket ? `Socket: ${detectedSocket}` : `${mysqlHost}:${mysqlPort}`} as user "${mysqlUser}" (SSL: ${sslOption ? 'ENABLED' : 'DISABLED'})...`);

  const connection = await mysql.createConnection(connectionConfig);

  try {
    const targetDb = mysqlDatabase || 'jklu_shuttle_db';
    console.log(`Target database: "${targetDb}"`);

    // Ensure database exists or switch to it
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    } catch (e: any) {
      console.log(`Notice: CREATE DATABASE skipped (${e.message}), using existing database "${targetDb}"`);
    }
    await connection.query(`USE \`${targetDb}\`;`);

    const schemaPath = path.join(__dirname, 'schema_mysql.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove the hardcoded CREATE DATABASE / USE statements so it applies to the targetDb
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS\s+jklu_shuttle_db[^;]*;/gi, '-- CREATE DATABASE handled above');
    sql = sql.replace(/USE\s+jklu_shuttle_db;/gi, `-- USE ${targetDb} handled above`);

    console.log(`Executing ${schemaPath} schema and seed data into "${targetDb}"...`);
    await connection.query(sql);
    console.log('✅ Schema & Seed Data applied successfully to MySQL!');

    // Verify row counts
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
