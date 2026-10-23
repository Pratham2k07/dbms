import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configure connection pool supporting Supabase DATABASE_URL or individual credentials
const isRemoteOrSupabase = Boolean(
  process.env.DATABASE_URL?.includes('supabase') ||
  process.env.DB_HOST?.includes('supabase') ||
  process.env.NODE_ENV === 'production'
);

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemoteOrSupabase ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
      ssl: isRemoteOrSupabase ? { rejectUnauthorized: false } : undefined,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

export default pool;
