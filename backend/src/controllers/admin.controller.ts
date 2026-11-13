import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [routesCount, stopsCount, shuttlesCount, driversCount, tripsCount, activeTripsCount, usersCount] = await Promise.all([
      query('SELECT COUNT(*) FROM routes'),
      query('SELECT COUNT(*) FROM stops'),
      query('SELECT COUNT(*) FROM shuttles'),
      query('SELECT COUNT(*) FROM drivers'),
      query('SELECT COUNT(*) FROM trips'),
      query("SELECT COUNT(*) FROM trips WHERE running_status = 'RUNNING'"),
      query('SELECT COUNT(*) FROM users')
    ]);

    res.json({
      success: true,
      stats: {
        totalRoutes: parseInt(routesCount.rows[0].count, 10),
        totalStops: parseInt(stopsCount.rows[0].count, 10),
        totalShuttles: parseInt(shuttlesCount.rows[0].count, 10),
        totalDrivers: parseInt(driversCount.rows[0].count, 10),
        totalTrips: parseInt(tripsCount.rows[0].count, 10),
        activeTrips: parseInt(activeTripsCount.rows[0].count, 10),
        totalUsers: parseInt(usersCount.rows[0].count, 10)
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.user_id, u.name, u.email, u.phone_number, u.role,
              s.roll_no,
              d.license_no,
              a.designation, a.department
       FROM users u
       LEFT JOIN students s ON u.user_id = s.student_id
       LEFT JOIN drivers d ON u.user_id = d.driver_id
       LEFT JOIN admins a ON u.user_id = a.admin_id
       ORDER BY u.role ASC, u.name ASC`
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone_number, roll_no, license_no, designation, department } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }
    if (!password || !password.trim()) {
      res.status(400).json({ success: false, message: 'Password is required' });
      return;
    }
    if (!role || !['admin', 'driver', 'student'].includes(role.toLowerCase())) {
      res.status(400).json({ success: false, message: 'Valid role (admin, driver, student) is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.toLowerCase();

    // Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'A user with this email address already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    // Generate sequential user_id in unified USR-XXX format for all roles
    const lastUserRes = await query(
      "SELECT user_id FROM users WHERE user_id REGEXP '^USR-[0-9]+$' ORDER BY CAST(SUBSTRING(user_id, 5) AS UNSIGNED) DESC LIMIT 1"
    );
    let nextNum = 1;
    if (lastUserRes.rows.length > 0) {
      const parsed = parseInt(lastUserRes.rows[0].user_id.replace('USR-', ''), 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
    const userId = `USR-${String(nextNum).padStart(3, '0')}`;

    // Insert into users table
    await query(
      'INSERT INTO users (user_id, name, email, password_hash, phone_number, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name.trim(), cleanEmail, passwordHash, phone_number?.trim() || null, cleanRole]
    );

    // Insert into subclass table
    if (cleanRole === 'student') {
      const cleanRoll = roll_no?.trim() || `ROLL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      await query('INSERT INTO students (student_id, roll_no) VALUES ($1, $2)', [userId, cleanRoll]);
    } else if (cleanRole === 'driver') {
      const cleanLicense = license_no?.trim() || `RJ14-${Date.now().toString().slice(-6)}`;
      await query('INSERT INTO drivers (driver_id, license_no) VALUES ($1, $2)', [userId, cleanLicense]);
    } else if (cleanRole === 'admin') {
      await query('INSERT INTO admins (admin_id, designation, department) VALUES ($1, $2, $3)', [
        userId,
        designation?.trim() || 'Transit Administrator',
        department?.trim() || 'JKLU Mobility Operations',
      ]);
    }

    res.status(201).json({
      success: true,
      message: `${cleanRole.toUpperCase()} user created successfully`,
      user: {
        user_id: userId,
        name: name.trim(),
        email: cleanEmail,
        role: cleanRole,
        phone_number: phone_number?.trim() || null,
        roll_no: cleanRole === 'student' ? roll_no : undefined,
        license_no: cleanRole === 'driver' ? license_no : undefined,
        designation: cleanRole === 'admin' ? designation : undefined,
        department: cleanRole === 'admin' ? department : undefined,
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Guard: Prevent deleting standard initial root admin
    if (id === 'USR-001') {
      res.status(400).json({ success: false, message: 'Cannot delete primary root administrator account' });
      return;
    }

    // Clean subclass rows first
    await query('DELETE FROM students WHERE student_id = $1', [id]);
    await query('DELETE FROM drivers WHERE driver_id = $1', [id]);
    await query('DELETE FROM admins WHERE admin_id = $1', [id]);
    await query('DELETE FROM users WHERE user_id = $1', [id]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};
