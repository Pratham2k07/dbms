import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool to handle multiple connections efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jklu_shuttle',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
