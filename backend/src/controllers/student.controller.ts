import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const recordStudentLocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude } = req.body;
    const studentId = req.user?.user_id || 'USR-STU-001';

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'latitude and longitude are required' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const result = await query(
      `INSERT INTO student_locations (student_id, latitude, longitude)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [studentId, lat, lng]
    );

    res.json({ success: true, location: result.rows[0] });
  } catch (error: any) {
    console.error('Error recording student location:', error);
    res.status(500).json({ success: false, message: 'Failed to record student location', error: error.message });
  }
};

export const getStudentNearbyStops = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 26.8373;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 75.6499;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const stopsRes = await query('SELECT * FROM stops');

    const calculated = stopsRes.rows.map((stop: any) => {
      const dLat = (stop.latitude - lat) * (Math.PI / 180);
      const dLng = (stop.longitude - lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(stop.latitude * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = parseFloat((6371 * c).toFixed(2));

      return {
        ...stop,
        distance_km: distanceKm,
        walking_time_mins: Math.round(distanceKm * 12),
      };
    });

    calculated.sort((a: any, b: any) => a.distance_km - b.distance_km);

    res.json(calculated.slice(0, limit));
  } catch (error: any) {
    console.error('Error fetching nearby stops:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate nearby stops', error: error.message });
  }
};

export const getLatestStudentLocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.user_id || 'USR-STU-001';
    const result = await query(
      `SELECT * FROM student_locations 
       WHERE student_id = $1 
       ORDER BY recorded_at DESC LIMIT 1`,
      [studentId]
    );

    res.json({
      success: true,
      location: result.rows[0] || {
        latitude: 26.8373,
        longitude: 75.6499,
        recorded_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch student location', error: error.message });
  }
};

export const getActiveStudentTrips = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT t.*,
        r.route_name, r.route_code, r.color as route_color, r.total_stops,
        s.shuttle_number, s.registration_number,
        u.name as driver_name, u.phone_number as driver_phone
       FROM trips t
       JOIN routes r ON t.route_id = r.route_id
       JOIN shuttles s ON t.shuttle_id = s.shuttle_id
       JOIN drivers d ON t.driver_id = d.driver_id
       JOIN users u ON d.driver_id = u.user_id
       WHERE t.running_status IN ('RUNNING', 'SCHEDULED')
       ORDER BY CASE WHEN t.running_status = 'RUNNING' THEN 0 ELSE 1 END, t.start_time ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch student active trips', error: error.message });
  }
};
