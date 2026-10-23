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
    const id = req.params.id as string;
    const result = await tripsQueries.updateTrip(id, req.body);
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
