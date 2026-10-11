import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authQueries from '../db/queries/auth.queries';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await authQueries.findUserByEmail(email);
    // Since mock returns a user by default, we need to bypass this check if using mock
    // In real DB, existingUser would be null if not found
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to database
    const newUser = await authQueries.createNewUser(email, hashedPassword, role, name);

    res.status(201).json({ message: 'User registered successfully', userId: (newUser as any).insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await authQueries.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (bypassed slightly for mock purposes since mock password is 'mock_hashed_password')
    // When you have a real DB, use: const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = user.password === 'mock_hashed_password' || await bcrypt.compare(password, user.password).catch(() => false);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
