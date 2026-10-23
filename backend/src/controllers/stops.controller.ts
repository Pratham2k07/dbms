import { Request, Response } from 'express';
import * as stopsQueries from '../db/queries/stops.queries';

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await stopsQueries.fetchAllRoutes();
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getStopsByRouteId = async (req: Request, res: Response) => {
  try {
    const routeId = req.params.routeId as string;
    const stops = await stopsQueries.fetchStopsForRoute(routeId);
    res.status(200).json(stops);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const result = await stopsQueries.createRoute(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await stopsQueries.updateRoute(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await stopsQueries.deleteRoute(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createStop = async (req: Request, res: Response) => {
  try {
    const result = await stopsQueries.createStop(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateStop = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await stopsQueries.updateStop(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteStop = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await stopsQueries.deleteStop(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAllStops = async (req: Request, res: Response) => {
  try {
    const stops = await stopsQueries.fetchAllStops();
    res.status(200).json(stops);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

