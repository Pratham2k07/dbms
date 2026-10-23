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
