import pool from '../connection';

/**
 * -------------------------------------------------------------
 * ATTENTION: ACADEMIC DATABASE REQUIREMENT
 * -------------------------------------------------------------
 * I am leaving these functions ready for you to paste your 
 * own SQL queries. I will not generate the SQL for you.
 */

export const findUserByEmail = async (email: string) => {
  // TODO: Replace this with your SQL query
  // This query should select a user (student, driver, or admin) by their email.
  const query = `/* YOUR_SQL_QUERY_HERE: SELECT * FROM users WHERE email = ? */`;
  
  // NOTE: Uncomment the code below once you write your query!
  /*
  const [rows] = await pool.query(query, [email]);
  return (rows as any[])[0];
  */

  // Temporary mock data for UI testing
  if (email === 'admin@jklu.edu.in') {
    return { id: 1, email, password: 'mock_hashed_password', role: 'admin', name: 'Admin User' };
  } else if (email === 'driver@jklu.edu.in') {
    return { id: 2, email, password: 'mock_hashed_password', role: 'driver', name: 'Driver User' };
  }
  return { id: 3, email, password: 'mock_hashed_password', role: 'student', name: 'Student User' };
};

export const createNewUser = async (email: string, passwordHash: string, role: string, name: string) => {
  // TODO: Replace this with your SQL query
  // This query should insert a new user into your database.
  const query = `/* YOUR_SQL_QUERY_HERE: INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?) */`;
  
  // NOTE: Uncomment the code below once you write your query!
  /*
  const [result] = await pool.query(query, [email, passwordHash, role, name]);
  return result;
  */
  
  return { insertId: Math.floor(Math.random() * 1000) };
};
