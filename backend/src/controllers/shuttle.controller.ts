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
    const shuttle = await shuttleQueries.fetchShuttleById(req.params.id);
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
    const result = await shuttleQueries.updateShuttle(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateShuttleStatus = async (req: Request, res: Response) => {
  try {
    const result = await shuttleQueries.updateShuttleStatus(req.params.id, req.body.status);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateShuttleLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    await shuttleQueries.updateShuttleCoordinates(req.params.id, lat, lng);
    
    const io = (req as any).io;
    if (io) {
      io.to(`shuttle_${req.params.id}`).emit('location_updated', { id: req.params.id, lat, lng });
    }
    
    res.status(200).json({ message: 'Location updated', data: { id: req.params.id, lat, lng } });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
