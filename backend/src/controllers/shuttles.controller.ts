import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { socketEvents } from '../services/socket.service.js';

export const getShuttles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM shuttles ORDER BY shuttle_id ASC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching shuttles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shuttles', error: error.message });
  }
};

export const createShuttle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shuttle_id, registration_number, capacity = 32, status = 'ACTIVE', shuttle_number } = req.body;

    if (!registration_number) {
      res.status(400).json({ success: false, message: 'registration_number is required' });
      return;
    }

    const countRes = await query('SELECT COUNT(*) FROM shuttles');
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
    const finalShuttleId = shuttle_id || `SHT-${String(nextNum).padStart(2, '0')}`;
    const finalShuttleNumber = shuttle_number || `SHUTTLE ${String(nextNum).padStart(2, '0')}`;

    const insertSql = `
      INSERT INTO shuttles (shuttle_id, registration_number, capacity, status, shuttle_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(insertSql, [
      finalShuttleId,
      registration_number.trim().toUpperCase(),
      parseInt(capacity, 10),
      status,
      finalShuttleNumber,
    ]);

    const created = result.rows[0];
    socketEvents.emitShuttleCreated(created);

    res.status(201).json({ success: true, shuttle: created });
  } catch (error: any) {
    console.error('Error creating shuttle:', error);
    res.status(500).json({ success: false, message: 'Failed to create shuttle', error: error.message });
  }
};

export const updateShuttle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { registration_number, capacity, status, shuttle_number } = req.body;

    const updateSql = `
      UPDATE shuttles
      SET registration_number = COALESCE($1, registration_number),
          capacity = COALESCE($2, capacity),
          status = COALESCE($3, status),
          shuttle_number = COALESCE($4, shuttle_number)
      WHERE shuttle_id = $5
      RETURNING *
    `;

    const result = await query(updateSql, [
      registration_number ? registration_number.trim().toUpperCase() : null,
      capacity ? parseInt(capacity, 10) : null,
      status || null,
      shuttle_number || null,
      id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Shuttle not found' });
      return;
    }

    const updated = result.rows[0];
    socketEvents.emitShuttleUpdated(updated);

    res.json({ success: true, shuttle: updated });
  } catch (error: any) {
    console.error('Error updating shuttle:', error);
    res.status(500).json({ success: false, message: 'Failed to update shuttle', error: error.message });
  }
};

export const updateShuttleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'MAINTENANCE', 'OFFLINE'].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status. Must be 'ACTIVE', 'MAINTENANCE', or 'OFFLINE'." });
      return;
    }

    const result = await query(
      'UPDATE shuttles SET status = $1 WHERE shuttle_id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Shuttle not found' });
      return;
    }

    socketEvents.emitShuttleStatusChanged(id, status);

    res.json({ success: true, shuttle: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating shuttle status:', error);
    res.status(500).json({ success: false, message: 'Failed to update shuttle status', error: error.message });
  }
};

export const updateShuttleLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lat, lng, latitude, longitude, bearing = 0, speed = 0, speed_kmh, trip_id, progress_percentage = 0 } = req.body;

    const finalLat = lat !== undefined ? lat : latitude;
    const finalLng = lng !== undefined ? lng : longitude;
    const finalSpeed = speed_kmh !== undefined ? speed_kmh : speed;

    if (finalLat === undefined || finalLng === undefined) {
      res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
      return;
    }

    // Insert into shuttle_locations weak entity
    const insertSql = `
      INSERT INTO shuttle_locations (shuttle_id, trip_id, latitude, longitude, bearing, speed_kmh, progress_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await query(insertSql, [
      id,
      trip_id || null,
      parseFloat(finalLat),
      parseFloat(finalLng),
      parseFloat(bearing),
      parseFloat(finalSpeed),
      parseFloat(progress_percentage),
    ]);

    const locRecord = result.rows[0];

    // Broadcast live telemetry
    socketEvents.emitLocationUpdate({
      shuttle_id: id,
      trip_id: trip_id || null,
      latitude: parseFloat(finalLat),
      longitude: parseFloat(finalLng),
      bearing: parseFloat(bearing),
      speed_kmh: parseFloat(finalSpeed),
      progress_percentage: parseFloat(progress_percentage),
      recorded_at: locRecord.recorded_at,
    });

    res.json({ success: true, location: locRecord });
  } catch (error: any) {
    console.error('Error recording shuttle location:', error);
    res.status(500).json({ success: false, message: 'Failed to record location', error: error.message });
  }
};
