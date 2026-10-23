import { Request, Response } from 'express';
import * as studentQueries from '../db/queries/student.queries';
import * as tripsQueries from '../db/queries/trips.queries';

export const recordLocation = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id || 'USR-STU-001';
    const { latitude, longitude, accuracy_m, gps_timestamp } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const recorded = await studentQueries.recordStudentLocation({
      student_id: studentId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy_m: accuracy_m ? Number(accuracy_m) : undefined,
      gps_timestamp: gps_timestamp || new Date().toISOString()
    });

    // Optionally retrieve top 5 nearby stops for immediate context
    const nearbyStops = await studentQueries.getNearbyStops(Number(latitude), Number(longitude), 20, 5);

    res.status(200).json({
      success: true,
      data: recorded,
      nearbyStops
    });
  } catch (error: any) {
    console.error('Error recording student location:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getNearbyStops = async (req: Request, res: Response) => {
  try {
    let lat = Number(req.query.lat);
    let lng = Number(req.query.lng);
    const radius = req.query.radius ? Number(req.query.radius) : 20;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    // If coordinates not provided in query, lookup student's last recorded location
    if (isNaN(lat) || isNaN(lng)) {
      const studentId = req.user?.id || 'USR-STU-001';
      const lastLoc = await studentQueries.getLatestStudentLocation(studentId);
      if (lastLoc) {
        lat = Number(lastLoc.latitude);
        lng = Number(lastLoc.longitude);
      } else {
        // Fallback default: JKLU Campus Origin
        lat = 26.837300;
        lng = 75.649900;
      }
    }

    const stops = await studentQueries.getNearbyStops(lat, lng, radius, limit);
    res.status(200).json(stops);
  } catch (error) {
    console.error('Error fetching nearby stops:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getLatestLocation = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id || 'USR-STU-001';
    const loc = await studentQueries.getLatestStudentLocation(studentId);
    res.status(200).json(loc || null);
  } catch (error) {
    console.error('Error fetching latest student location:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getActiveStudentTrips = async (req: Request, res: Response) => {
  try {
    const allTrips = await tripsQueries.fetchAllTrips();
    // Filter trips that are active (RUNNING) or scheduled for today
    const activeTrips = allTrips.filter((t: any) => t.running_status === 'RUNNING' || t.running_status === 'SCHEDULED');
    
    // Enrich running trips with live telemetry details
    const enrichedTrips = await Promise.all(
      activeTrips.map(async (trip: any) => {
        if (trip.running_status === 'RUNNING') {
          const liveDetails = await tripsQueries.getLiveTripDetails(trip.trip_id);
          return liveDetails || trip;
        }
        return trip;
      })
    );

    res.status(200).json(enrichedTrips);
  } catch (error) {
    console.error('Error fetching active student trips:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
