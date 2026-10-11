import { Request, Response } from 'express';
import * as adminQueries from '../db/queries/admin.queries';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminQueries.getSystemStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
