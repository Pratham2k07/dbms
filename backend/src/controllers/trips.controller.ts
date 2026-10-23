import { Request, Response } from 'express';
import * as tripsQueries from '../db/queries/trips.queries';

export const getAllTrips = async (req: Request, res: Response) => {
  try {
    const trips = await tripsQueries.fetchAllTrips();
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const trip = await tripsQueries.fetchTripById(id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getLiveTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const liveDetails = await tripsQueries.getLiveTripDetails(id);
    if (!liveDetails) {
      return res.status(404).json({ message: 'Live trip not found' });
    }
    res.status(200).json(liveDetails);
  } catch (error) {
    console.error('Error fetching live trip:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const result = await tripsQueries.createTrip(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await tripsQueries.updateTrip(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const startTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const driverId = (req as any).user?.id;
    const result = await tripsQueries.startTripById(id, driverId);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    const io = (req as any).io;
    if (io) {
      io.emit('trip_started', { trip_id: id, driver_id: driverId, trip: result.trip });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const endTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const driverId = (req as any).user?.id;
    const result = await tripsQueries.endTripById(id, driverId);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    const io = (req as any).io;
    if (io) {
      io.emit('trip_ended', { trip_id: id, driver_id: driverId, trip: result.trip });
      io.emit('shuttle_tracking_disabled', { trip_id: id, shuttle_id: result.trip?.shuttle_id });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await tripsQueries.cancelTrip(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateTripCapacity = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await tripsQueries.updateTripCapacity(id, req.body.capacity);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateTripStopStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const stopId = req.params.stopId as string;
    const result = await tripsQueries.updateTripStopStatus(id, stopId, req.body.status);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
