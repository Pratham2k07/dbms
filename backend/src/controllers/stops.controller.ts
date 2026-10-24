import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { socketEvents } from '../services/socket.service.js';

export const getAllStops = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM stops ORDER BY stop_name ASC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching stops:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stops', error: error.message });
  }
};

export const getStopById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM stops WHERE stop_id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Stop not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch stop', error: error.message });
  }
};

export const createStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stop_id, stop_name, latitude, longitude, is_destination = false, description } = req.body;

    if (!stop_name || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'stop_name, latitude, and longitude are required' });
      return;
    }

    const finalStopId =
      stop_id || `STOP-${stop_name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

    const insertSql = `
      INSERT INTO stops (stop_id, stop_name, latitude, longitude, is_destination, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (stop_id) DO UPDATE SET
        stop_name = EXCLUDED.stop_name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        description = EXCLUDED.description
      RETURNING *
    `;

    const result = await query(insertSql, [
      finalStopId,
      stop_name.trim().toUpperCase(),
      parseFloat(latitude),
      parseFloat(longitude),
      Boolean(is_destination),
      description || null,
    ]);

    const createdStop = result.rows[0];
    socketEvents.emitStopCreated(createdStop);

    res.status(201).json({ success: true, stop: createdStop });
  } catch (error: any) {
    console.error('Error creating stop:', error);
    res.status(500).json({ success: false, message: 'Failed to create stop', error: error.message });
  }
};

export const updateStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stop_name, latitude, longitude, is_destination, description } = req.body;

    const updateSql = `
      UPDATE stops
      SET stop_name = COALESCE($1, stop_name),
          latitude = COALESCE($2, latitude),
          longitude = COALESCE($3, longitude),
          is_destination = COALESCE($4, is_destination),
          description = COALESCE($5, description)
      WHERE stop_id = $6
      RETURNING *
    `;

    const result = await query(updateSql, [
      stop_name !== undefined ? stop_name.trim().toUpperCase() : null,
      latitude !== undefined ? parseFloat(latitude) : null,
      longitude !== undefined ? parseFloat(longitude) : null,
      is_destination !== undefined ? Boolean(is_destination) : null,
      description !== undefined ? description : null,
      id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Stop not found' });
      return;
    }

    const updatedStop = result.rows[0];
    socketEvents.emitStopUpdated(updatedStop);

    res.json({ success: true, stop: updatedStop });
  } catch (error: any) {
    console.error('Error updating stop:', error);
    res.status(500).json({ success: false, message: 'Failed to update stop', error: error.message });
  }
};

export const deleteStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await query('DELETE FROM stops WHERE stop_id = $1', [id]);
    socketEvents.emitStopDeleted(id);
    res.json({ success: true, message: `Stop ${id} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting stop:', error);
    res.status(500).json({ success: false, message: 'Failed to delete stop', error: error.message });
  }
};
