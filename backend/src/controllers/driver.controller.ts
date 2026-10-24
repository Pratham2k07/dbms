import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';
import { socketEvents } from '../services/socket.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getDrivers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT d.driver_id, d.license_no, u.name, u.email, u.phone_number,
        COALESCE(
          (SELECT r.assigned_shuttle_id FROM routes r WHERE r.assigned_driver_id = d.driver_id LIMIT 1),
          (SELECT da.shuttle_id FROM driver_assignments da WHERE da.driver_id = d.driver_id AND da.status = 'ACTIVE' LIMIT 1)
        ) as assigned_shuttle_id
       FROM drivers d
       JOIN users u ON d.driver_id = u.user_id
       ORDER BY d.driver_id ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch drivers', error: error.message });
  }
};

export const createDriver = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { name, email, phone_number, license_no, assigned_shuttle_id } = req.body;

    if (!name || !license_no) {
      res.status(400).json({ success: false, message: 'name and license_no are required' });
      return;
    }

    await client.query('BEGIN');

    const countRes = await client.query('SELECT COUNT(*) FROM drivers');
    const nextNum = 101 + parseInt(countRes.rows[0].count, 10);
    const driverId = `DRV-${nextNum}`;

    const cleanEmail =
      email ? email.trim().toLowerCase() : `${name.toLowerCase().replace(/\s+/g, '.')}.driver@jklu.edu.in`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('driver@8821', salt);

    await client.query(
      `INSERT INTO users (user_id, name, email, password_hash, phone_number, role)
       VALUES ($1, $2, $3, $4, $5, 'driver')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
      [driverId, name, cleanEmail, passwordHash, phone_number || null]
    );

    const driverRes = await client.query(
      `INSERT INTO drivers (driver_id, license_no)
       VALUES ($1, $2)
       ON CONFLICT (driver_id) DO UPDATE SET license_no = EXCLUDED.license_no
       RETURNING *`,
      [driverId, license_no]
    );

    if (assigned_shuttle_id) {
      const asgId = `ASG-${Date.now().toString(36).toUpperCase()}`;
      await client.query(
        `INSERT INTO driver_assignments (assignment_id, driver_id, route_id, shuttle_id, shift_date, shift_type, status)
         VALUES ($1, $2, 'ROUTE-01', $3, 'Today', 'Assigned Shift', 'ACTIVE')`,
        [asgId, driverId, assigned_shuttle_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      driver: {
        driver_id: driverId,
        name,
        email: cleanEmail,
        phone_number,
        license_no,
        assigned_shuttle_id,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating driver:', error);
    res.status(500).json({ success: false, message: 'Failed to create driver', error: error.message });
  } finally {
    client.release();
  }
};

export const updateDriver = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, phone_number, license_no, assigned_shuttle_id } = req.body;

    await client.query('BEGIN');

    if (name || phone_number) {
      await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone_number = COALESCE($2, phone_number)
         WHERE user_id = $3`,
        [name || null, phone_number || null, id]
      );
    }

    if (license_no) {
      await client.query(
        'UPDATE drivers SET license_no = $1 WHERE driver_id = $2',
        [license_no, id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      driver: {
        driver_id: id,
        name,
        phone_number,
        license_no,
        assigned_shuttle_id,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating driver:', error);
    res.status(500).json({ success: false, message: 'Failed to update driver', error: error.message });
  } finally {
    client.release();
  }
};

export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE user_id = $1', [id]);
    res.json({ success: true, message: `Driver ${id} deleted` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete driver', error: error.message });
  }
};

export const getDriverAssignedTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Identify driver: prefer authenticated user, fallback to query param or first driver
    let driverId = req.user?.user_id;
    if (!driverId && req.query.driver_id) {
      driverId = String(req.query.driver_id);
    }
    if (!driverId) {
      // Default to first active driver DRV-101
      driverId = 'DRV-101';
    }

    // Look for running trip first, then scheduled trip
    const tripRes = await query(
      `SELECT t.*,
        r.route_name, r.route_code, r.color as route_color, r.total_stops, r.description as route_description,
        s.shuttle_number, s.registration_number, s.capacity as shuttle_capacity,
        u.name as driver_name, d.license_no as driver_license
       FROM trips t
       JOIN routes r ON t.route_id = r.route_id
       JOIN shuttles s ON t.shuttle_id = s.shuttle_id
       JOIN drivers d ON t.driver_id = d.driver_id
       JOIN users u ON d.driver_id = u.user_id
       WHERE t.driver_id = $1 AND t.running_status IN ('RUNNING', 'SCHEDULED')
       ORDER BY CASE WHEN t.running_status = 'RUNNING' THEN 0 ELSE 1 END, t.start_time ASC
       LIMIT 1`,
      [driverId]
    );

    if (tripRes.rows.length === 0) {
      res.json({ success: true, trip: null, message: 'No active or scheduled trip assigned.' });
      return;
    }

    res.json({ success: true, trip: tripRes.rows[0] });
  } catch (error: any) {
    console.error('Error fetching assigned trip:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch driver assigned trip', error: error.message });
  }
};

export const startShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { shuttleId } = req.body;
    const driverId = req.user?.user_id || 'DRV-101';

    const asgId = `ASG-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO driver_assignments (assignment_id, driver_id, route_id, shuttle_id, shift_date, shift_type, status)
       VALUES ($1, $2, 'ROUTE-01', $3, 'Today', 'Manual Shift Start', 'ACTIVE')`,
      [asgId, driverId, shuttleId || 'SHT-01']
    );

    res.json({ success: true, message: 'Shift started successfully', assignment_id: asgId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to start shift', error: error.message });
  }
};

export const endShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const driverId = req.user?.user_id || 'DRV-101';
    await query(
      "UPDATE driver_assignments SET status = 'COMPLETED' WHERE driver_id = $1 AND status = 'ACTIVE'",
      [driverId]
    );
    res.json({ success: true, message: 'Shift ended successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to end shift', error: error.message });
  }
};

export const submitDriverLocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      trip_id,
      shuttle_id,
      latitude,
      longitude,
      speed_kmh = 0,
      bearing = 0,
      accuracy_m,
    } = req.body;

    if (!latitude || !longitude || !shuttle_id) {
      res.status(400).json({ success: false, message: 'latitude, longitude, and shuttle_id are required' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const speed = parseFloat(speed_kmh);
    const bear = parseFloat(bearing);

    // Save location to shuttle_locations
    const locRes = await query(
      `INSERT INTO shuttle_locations (shuttle_id, trip_id, latitude, longitude, bearing, speed_kmh)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [shuttle_id, trip_id || null, lat, lng, bear, speed]
    );

    // Update trip speed
    if (trip_id) {
      await query('UPDATE trips SET speed_kmh = $1 WHERE trip_id = $2', [speed, trip_id]);
    }

    // Broadcast live telemetry
    const telemetryPayload = {
      shuttle_id,
      trip_id,
      latitude: lat,
      longitude: lng,
      speed_kmh: speed,
      bearing: bear,
      accuracy_m: accuracy_m ? parseFloat(accuracy_m) : undefined,
      recorded_at: locRes.rows[0].recorded_at,
    };

    socketEvents.emitLocationUpdate(telemetryPayload);

    // Calculate upcoming stops along the trip
    let upcomingStops: any[] = [];
    if (trip_id) {
      const stopsRes = await query(
        `SELECT s.stop_id, s.stop_name, s.latitude, s.longitude, ts.arrival_status
         FROM trip_stops ts
         JOIN stops s ON ts.stop_id = s.stop_id
         WHERE ts.trip_id = $1 AND ts.arrival_status NOT IN ('COMPLETED', 'SKIPPED')
         LIMIT 3`,
        [trip_id]
      );

      upcomingStops = stopsRes.rows.map((st: any) => {
        // Haversine distance
        const dLat = (st.latitude - lat) * (Math.PI / 180);
        const dLng = (st.longitude - lng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) * Math.cos(st.latitude * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = parseFloat((6371 * c).toFixed(1));
        const etaMins = Math.max(1, Math.round((distKm / Math.max(speed, 25)) * 60));

        return {
          stop_id: st.stop_id,
          stop_name: st.stop_name,
          remaining_road_distance_km: distKm,
          theoretical_eta_minutes: etaMins,
        };
      });
    }

    res.json({
      success: true,
      telemetry: telemetryPayload,
      upcomingStops,
    });
  } catch (error: any) {
    console.error('Error submitting driver location:', error);
    res.status(500).json({ success: false, message: 'Failed to record driver telemetry', error: error.message });
  }
};
