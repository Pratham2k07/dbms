import { Request, Response } from 'express';
import * as driverQueries from '../db/queries/driver.queries';

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
    const result = await driverQueries.updateDriver(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const result = await driverQueries.deleteDriver(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const startShift = async (req: Request, res: Response) => {
  try {
    const driverId = req.user.id;
    const { shuttleId } = req.body;
    await driverQueries.assignShuttleToDriver(driverId, shuttleId);
    res.status(200).json({ message: 'Shift started' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const endShift = async (req: Request, res: Response) => {
  try {
    const driverId = req.user.id;
    await driverQueries.endDriverShift(driverId);
    res.status(200).json({ message: 'Shift ended' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
