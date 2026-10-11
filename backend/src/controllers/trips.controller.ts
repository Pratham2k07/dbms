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

export const createTrip = async (req: Request, res: Response) => {
  try {
    const result = await tripsQueries.createTrip(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const result = await tripsQueries.updateTrip(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const result = await tripsQueries.cancelTrip(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateTripCapacity = async (req: Request, res: Response) => {
  try {
    const result = await tripsQueries.updateTripCapacity(req.params.id, req.body.capacity);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateTripStopStatus = async (req: Request, res: Response) => {
  try {
    const result = await tripsQueries.updateTripStopStatus(req.params.id, req.params.stopId, req.body.status);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
