import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import * as studentQueries from '../db/queries/student.queries.js';

export const recordStudentLocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, accuracy_m, gps_timestamp } = req.body;
    // Derive student identity securely from session, fallback to default student profile for guest/unauth
    const studentId = req.user?.user_id || 'USR-STU-001';

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      res.status(400).json({ success: false, message: 'latitude and longitude are required' });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ success: false, message: 'Invalid GPS coordinates: latitude must be between -90 and 90, longitude between -180 and 180' });
      return;
    }

    const recorded = await studentQueries.recordStudentLocation({
      student_id: studentId,
      latitude: lat,
      longitude: lng,
      accuracy_m: accuracy_m !== undefined && accuracy_m !== null ? Number(accuracy_m) : undefined,
      gps_timestamp: gps_timestamp ? String(gps_timestamp) : undefined,
    });

    console.log(`[Student Location Ingest] Student ${studentId} location saved: (${lat}, ${lng}) [±${accuracy_m ?? 'unknown'}m] ID: ${recorded?.location_id}`);
    res.json({ success: true, location: recorded });
  } catch (error: any) {
    console.error('Error recording student location:', error);
    res.status(500).json({ success: false, message: 'Failed to record student location', error: error.message });
  }
};

export const getStudentNearbyStops = async (req: Request, res: Response): Promise<void> => {
  try {
    let lat: number | null = req.query.lat !== undefined ? Number(req.query.lat) : null;
    let lng: number | null = req.query.lng !== undefined ? Number(req.query.lng) : null;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 25;

    // If coordinates not provided in query params, inspect if authenticated student has a latest recorded location
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      const studentId = (req as AuthenticatedRequest).user?.user_id || 'USR-STU-001';
      const latest = await studentQueries.getLatestStudentLocation(studentId);
      if (latest && !isNaN(latest.latitude) && !isNaN(latest.longitude)) {
        lat = latest.latitude;
        lng = latest.longitude;
      }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude coordinates are required to calculate nearby stops',
      });
      return;
    }

    const calculated = await studentQueries.getNearbyStops(lat, lng, radius, limit);
    res.json(calculated);
  } catch (error: any) {
    console.error('Error fetching nearby stops:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate nearby stops', error: error.message });
  }
};

export const getLatestStudentLocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.user_id || 'USR-STU-001';
    const latest = await studentQueries.getLatestStudentLocation(studentId);

    res.json({
      success: true,
      location: latest, // Returns actual latest record or null if no GPS fixes recorded yet
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
