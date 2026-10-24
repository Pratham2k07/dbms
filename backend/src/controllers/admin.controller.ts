import { Request, Response } from 'express';
import { query } from '../config/db.js';

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [routesCount, stopsCount, shuttlesCount, driversCount, tripsCount, activeTripsCount] = await Promise.all([
      query('SELECT COUNT(*) FROM routes'),
      query('SELECT COUNT(*) FROM stops'),
      query('SELECT COUNT(*) FROM shuttles'),
      query('SELECT COUNT(*) FROM drivers'),
      query('SELECT COUNT(*) FROM trips'),
      query("SELECT COUNT(*) FROM trips WHERE running_status = 'RUNNING'"),
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
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
  }
};
