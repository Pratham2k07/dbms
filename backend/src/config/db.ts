import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';

dotenv.config();
if (!process.env.MYSQL_USER) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

const PK_MAP: Record<string, string> = {
  users: 'user_id',
  shuttles: 'shuttle_id',
  routes: 'route_id',
  stops: 'stop_id',
  trips: 'trip_id',
  drivers: 'driver_id',
  students: 'student_id',
  admins: 'admin_id',
  shuttle_locations: 'location_id',
  student_locations: 'location_id',
  driver_assignments: 'assignment_id',
  driver_notifications: 'notification_id'
};

function transformPgToMysql(sql: string, params: any[] = []): { sql: string; params: any[] } {
  let s = sql.trim();

  // 1. Transaction control
  if (/^BEGIN$/i.test(s)) {
    return { sql: 'START TRANSACTION', params: [] };
  }

  // 2. Postgres JSON aggregates
  s = s.replace(/json_agg/gi, 'JSON_ARRAYAGG');
  s = s.replace(/json_build_object/gi, 'JSON_OBJECT');
  s = s.replace(/FILTER\s*\([^)]+\)/gi, '');

  // 3. ON CONFLICT DO NOTHING -> ON DUPLICATE KEY UPDATE col = col
  s = s.replace(/ON CONFLICT\s*\(([a-zA-Z0-9_,\s]+)\)\s*DO NOTHING/gi, (_match, cols) => {
    const firstCol = cols.split(',')[0].trim();
    return `ON DUPLICATE KEY UPDATE ${firstCol} = ${firstCol}`;
  });

  // 4. ON CONFLICT DO UPDATE
  s = s.replace(/ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET([\s\S]*?)(RETURNING|$)/gi, (_match, updateClause, tail) => {
    const mysqlUpdate = updateClause.replace(/EXCLUDED\.([a-zA-Z0-9_]+)/g, 'VALUES($1)');
    return 'ON DUPLICATE KEY UPDATE' + mysqlUpdate + ' ' + tail;
  });

  // 5. ANY array syntax
  s = s.replace(/=\s*ANY\s*\((\$\d+)\)/gi, 'IN ($1)');

  // 6. Postgres type casts
  s = s.replace(/NOW\(\)::text/gi, 'NOW()');
  s = s.replace(/::text/gi, '');
  s = s.replace(/::int/gi, '');

  // 7. Auto alias unaliased COUNT(*) to count
  s = s.replace(/COUNT\(\*\)(?!\s+as\s+[\w]+)/gi, 'COUNT(*) AS count');

  // 8. Parameter placeholders $1, $2, ... -> ?
  const newParams: any[] = [];
  s = s.replace(/\$(\d+)/g, (_, n) => {
    const val = params[parseInt(n, 10) - 1];
    newParams.push(val);
    return '?';
  });

  return { sql: s, params: newParams };
}

async function executeOnMysql(target: any, sql: string, params: any[] = []): Promise<QueryResult> {
  const hasReturning = /RETURNING/i.test(sql);
  const rawTransformed = transformPgToMysql(sql, params);
  let cleanSql = rawTransformed.sql;
  let cleanParams = rawTransformed.params;

  if (hasReturning) {
    const insertMatch = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
    const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+?)\s+RETURNING/i);

    cleanSql = cleanSql.replace(/RETURNING\s+[\s\S]*?$/i, '').trim();

    const [result]: any = await target.query(cleanSql, cleanParams);

    if (insertMatch) {
      const table = insertMatch[1].toLowerCase();
      const cols = insertMatch[2].split(',').map((c) => c.trim().toLowerCase());
      const pkCol = PK_MAP[table] || cols[0];
      const pkIdx = cols.indexOf(pkCol);

      let lookupVal: any = null;
      if (pkIdx !== -1 && cleanParams[pkIdx] !== undefined) {
        lookupVal = cleanParams[pkIdx];
      } else if (result && result.insertId) {
        lookupVal = result.insertId;
      }

      if (lookupVal !== null) {
        const [rows]: any = await target.query(`SELECT * FROM ${table} WHERE ${pkCol} = ?`, [lookupVal]);
        return { rows: Array.isArray(rows) ? rows : [], rowCount: rows.length || 1 };
      }
      return { rows: [], rowCount: 1 };
    }

    if (updateMatch) {
      const table = updateMatch[1];
      const whereClause = updateMatch[3].trim();
      const setClause = updateMatch[2];
      const setPlaceholdersCount = (setClause.match(/\?/g) || []).length;
      const whereParams = cleanParams.slice(setPlaceholdersCount);

      const [rows]: any = await target.query(`SELECT * FROM ${table} WHERE ${whereClause}`, whereParams);
      return { rows: Array.isArray(rows) ? rows : [], rowCount: rows.length || 0 };
    }
  }

  const [rows]: any = await target.query(cleanSql, cleanParams);

  if (Array.isArray(rows)) {
    for (const r of rows) {
      if (r && typeof r === 'object') {
        if (r['COUNT(*)'] !== undefined && r.count === undefined) {
          r.count = Number(r['COUNT(*)']);
        }
        if (r['count(*)'] !== undefined && r.count === undefined) {
          r.count = Number(r['count(*)']);
        }
      }
    }
    return { rows, rowCount: rows.length };
  }
  return { rows: [], rowCount: rows?.affectedRows || 0 };
}

// ================= MYSQL DATABASE CONNECTION (EXCLUSIVE) =================
const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || '123456';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'jklu_shuttle_db';

const mysqlConfig = process.env.MYSQL_URL || (process.env.DATABASE_URL?.startsWith('mysql') ? process.env.DATABASE_URL : null) || {
  host: mysqlHost,
  port: mysqlPort,
  user: mysqlUser,
  password: mysqlPassword,
  database: mysqlDatabase,
  waitForConnections: true,
  connectionLimit: 20,
  decimalNumbers: true
};

const rawPool = mysql.createPool(mysqlConfig as any);

console.log(`[Database] Connected to MySQL Server on ${mysqlHost}:${mysqlPort}/${mysqlDatabase}`);

export const pool = {
  connect: async () => {
    const conn = await rawPool.getConnection();
    return {
      query: async (text: string, params?: any[]) => {
        return executeOnMysql(conn, text, params);
      },
      release: () => {
        conn.release();
      }
    };
  },
  query: async (text: string, params?: any[]) => {
    return executeOnMysql(rawPool, text, params);
  },
  end: async () => {
    await rawPool.end();
  }
};

export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await executeOnMysql(rawPool, text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 500) {
    console.log(`[SLOW QUERY] ${text} - ${duration}ms`);
  }
  return res as QueryResult<T>;
};

export default {
  pool,
  query,
};
