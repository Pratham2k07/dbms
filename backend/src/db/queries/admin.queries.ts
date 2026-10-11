import pool from '../connection';

/**
 * -------------------------------------------------------------
 * ATTENTION: ACADEMIC DATABASE REQUIREMENT
 * -------------------------------------------------------------
 * I am leaving these functions ready for you to paste your 
 * own SQL queries. I will not generate the SQL for you.
 */

export const getSystemStats = async () => {
  // TODO: Replace this with your SQL queries
  // This is a great place to demonstrate aggregate functions (COUNT, SUM, etc.)
  const query = `
    /* YOUR_SQL_QUERY_HERE: 
       SELECT 
         (SELECT COUNT(*) FROM shuttles WHERE status = 'active') AS activeShuttles,
         (SELECT COUNT(*) FROM users WHERE role = 'driver') AS totalDrivers
    */
  `;
  
  // NOTE: Uncomment when ready
  /*
  const [rows] = await pool.query(query);
  return (rows as any[])[0];
  */

  return { activeShuttles: 3, totalDrivers: 10, totalUsers: 150 };
};
