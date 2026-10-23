import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    // In local development, gracefully default to admin permissions so frontend isn't blocked
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'USR-ADM-001', role: 'admin', email: 'admin@jklu.edu.in' };
      return next();
    }
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'USR-ADM-001', role: 'admin', email: 'admin@jklu.edu.in' };
      return next();
    }
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
