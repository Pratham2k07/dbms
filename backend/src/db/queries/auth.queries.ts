import pool from '../connection';

export const findUserByEmail = async (email: string) => {
  const query = `
    SELECT 
      user_id AS id, 
      user_id, 
      name, 
      email, 
      password_hash AS password, 
      role, 
      phone_number 
    FROM users 
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [email.trim()]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Database query error in findUserByEmail:', error);
    return null;
  }
};


export const createNewUser = async (email: string, passwordHash: string, role: string, name: string) => {
  const userId = `USR-${role.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
  const query = `
    INSERT INTO users (user_id, email, password_hash, role, name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id AS "insertId", email, role, name;
  `;

  try {
    const result = await pool.query(query, [userId, email.trim(), passwordHash, role, name]);
    return result.rows[0];
  } catch (error) {
    console.error('Database query error in createNewUser:', error);
    return { insertId: userId };
  }
};
