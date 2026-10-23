import { Request, Response } from 'express';
import * as driverQueries from '../db/queries/driver.queries';
import * as shuttleQueries from '../db/queries/shuttle.queries';
import * as tripsQueries from '../db/queries/trips.queries';
import pool from '../db/connection';

export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await driverQueries.fetchAllDrivers();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const result = await driverQueries.createDriver(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await driverQueries.updateDriver(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await driverQueries.deleteDriver(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const startShift = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.id || 'DRV-101';
    const { shuttleId } = req.body;
    await driverQueries.assignShuttleToDriver(driverId, shuttleId);
    res.status(200).json({ message: 'Shift started' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const endShift = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.id || 'DRV-101';
    await driverQueries.endDriverShift(driverId);
    res.status(200).json({ message: 'Shift ended' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get assigned active or scheduled trip for the authenticated driver
 */
export const getAssignedTrip = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.id || 'DRV-101';
    
    // Find today's running or scheduled trip for this driver
    const query = `
      SELECT 
        t.trip_id,
        t.shuttle_id,
        t.route_id,
        t.driver_id,
        t.start_time,
        t.end_time,
        t.running_status,
        t.capacity_status,
        t.speed_kmh,
        t.trip_date,
        t.actual_start_time,
        r.route_name,
        r.route_code,
        r.route_coordinates,
        r.total_distance_km,
        s.registration_number,
        s.shuttle_number
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN shuttles s ON t.shuttle_id = s.shuttle_id
      WHERE t.driver_id = $1
      ORDER BY 
        CASE t.running_status 
          WHEN 'RUNNING' THEN 1 
          WHEN 'SCHEDULED' THEN 2 
          ELSE 3 
        END,
        t.trip_date DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [driverId]);
    if (result.rows.length === 0) {
      return res.status(200).json(null);
    }

    const trip = result.rows[0];
    if (trip.running_status === 'RUNNING') {
      const live = await tripsQueries.getLiveTripDetails(trip.trip_id);
      return res.status(200).json(live);
    }

    res.status(200).json(trip);
  } catch (error) {
    console.error('Error fetching driver assigned trip:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Driver starts their assigned trip
 */
export const startTrip = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.id || 'DRV-101';
    const tripId = req.params.tripId || req.body.trip_id;

    if (!tripId) {
      return res.status(400).json({ message: 'Trip ID is required' });
    }

    const result = await tripsQueries.startTripById(tripId, driverId);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    const io = (req as any).io;
    if (io) {
      io.emit('trip_started', { trip_id: tripId, driver_id: driverId, trip: result.trip });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Driver ends their active trip
 */
export const endTrip = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.id || 'DRV-101';
    const tripId = req.params.tripId || req.body.trip_id;

    if (!tripId) {
      return res.status(400).json({ message: 'Trip ID is required' });
    }

    const result = await tripsQueries.endTripById(tripId, driverId);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    const io = (req as any).io;
    if (io) {
      io.emit('trip_ended', { trip_id: tripId, driver_id: driverId, trip: result.trip });
      io.emit('shuttle_tracking_disabled', { trip_id: tripId, shuttle_id: result.trip?.shuttle_id });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Ingest real GPS coordinates from driver device
 */
export const submitDriverLocation = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.id || 'DRV-101';
    const { trip_id, shuttle_id, latitude, longitude, speed_kmh, bearing, accuracy_m, gps_timestamp } = req.body;

    if (!trip_id || !shuttle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'trip_id, shuttle_id, latitude, and longitude are required' });
    }

    const result = await shuttleQueries.recordDriverGpsLocation({
      driver_id: driverId,
      trip_id,
      shuttle_id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      speed_kmh: speed_kmh !== undefined ? Number(speed_kmh) : undefined,
      bearing: bearing !== undefined ? Number(bearing) : undefined,
      accuracy_m: accuracy_m !== undefined ? Number(accuracy_m) : undefined,
      gps_timestamp: gps_timestamp || new Date().toISOString()
    });

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    const resData = result as any;
    const io = (req as any).io;
    if (io) {
      const nextStop = resData.upcomingStops?.[0] || null;
      const payload = {
        shuttle_id,
        trip_id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed_kmh: Number(speed_kmh || 0),
        bearing: Number(bearing || 0),
        progress_percentage: resData.projection?.progressPercentage || 0,
        distance_remaining_km: nextStop?.remaining_road_distance_km || 0,
        current_or_next_stop: nextStop,
        timestamp: resData.location?.recorded_at || new Date().toISOString(),
        accuracy_m
      };
      io.emit('location_updated', payload);
      io.emit('shuttle_location_update', payload);
      if (resData.stopArrivalTriggered) {
        io.emit('stop_arrival', resData.stopArrivalTriggered);
      }
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error submitting driver location:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
