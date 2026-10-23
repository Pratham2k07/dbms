import { Request, Response } from 'express';
import * as shuttleQueries from '../db/queries/shuttle.queries';

export const getAllShuttles = async (req: Request, res: Response) => {
  try {
    const shuttles = await shuttleQueries.fetchAllShuttles();
    res.status(200).json(shuttles);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getShuttleById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const shuttle = await shuttleQueries.fetchShuttleById(id);
    if (!shuttle) return res.status(404).json({ message: 'Shuttle not found' });
    res.status(200).json(shuttle);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createShuttle = async (req: Request, res: Response) => {
  try {
    const result = await shuttleQueries.createShuttle(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateShuttle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await shuttleQueries.updateShuttle(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateShuttleStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await shuttleQueries.updateShuttleStatus(id, req.body.status);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateShuttleLocation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { lat, lng, speed, bearing, progress, trip_id } = req.body;
    await shuttleQueries.updateShuttleCoordinates(id, Number(lat), Number(lng), {
      speed_kmh: speed,
      bearing,
      progress_percentage: progress,
      trip_id
    });
    
    const io = (req as any).io;
    if (io) {
      io.to(`shuttle_${id}`).emit('location_updated', { id, lat, lng, speed, bearing, progress, trip_id });
      io.emit('location_updated', { id, lat, lng, speed, bearing, progress, trip_id });
    }
    
    res.status(200).json({ message: 'Location updated', data: { id, lat, lng } });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
