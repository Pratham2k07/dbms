import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configure connection pool supporting Supabase DATABASE_URL or individual credentials
const isRemoteOrSupabase = Boolean(
  process.env.DATABASE_URL?.includes('supabase') ||
  process.env.DB_HOST?.includes('supabase') ||
  process.env.NODE_ENV === 'production'
);

const defaultSupabaseUrl =
  'postgresql://postgres.ylsiszfpsgubumyzqaxc:Namaste%25%5EJKLU@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const connectionString = process.env.DATABASE_URL || defaultSupabaseUrl;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

export default pool;
