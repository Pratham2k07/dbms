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
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [driverId, name, cleanEmail, passwordHash, phone_number || null]
    );

    await client.query(
      `INSERT INTO drivers (driver_id, license_no)
       VALUES ($1, $2)
       ON DUPLICATE KEY UPDATE license_no = VALUES(license_no)
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

    const createdDriver = {
      driver_id: driverId,
      name,
      email: cleanEmail,
      phone_number,
      license_no,
      assigned_shuttle_id,
    };

    res.status(201).json({
      success: true,
      driver: createdDriver,
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
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Check if driver has active/scheduled trips
    const activeTrips = await client.query(
      "SELECT trip_id FROM trips WHERE driver_id = $1 AND running_status IN ('RUNNING', 'SCHEDULED')",
      [id]
    );
    if (activeTrips.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete driver ${id}: Currently assigned to active/scheduled trip ${activeTrips.rows[0].trip_id}.`,
      });
      return;
    }

    // Check if driver has completed/cancelled trip history
    const allTrips = await client.query('SELECT COUNT(*) FROM trips WHERE driver_id = $1', [id]);
    if (parseInt(allTrips.rows[0].count, 10) > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete driver ${id}: Driver is referenced by ${allTrips.rows[0].count} historical trip record(s). Delete or reassign historical trips first.`,
      });
      return;
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM driver_assignments WHERE driver_id = $1', [id]);
    await client.query('DELETE FROM driver_notifications WHERE driver_id = $1', [id]);
    await client.query('DELETE FROM drivers WHERE driver_id = $1', [id]);
    await client.query('DELETE FROM users WHERE user_id = $1', [id]);
    await client.query('COMMIT');

    res.json({ success: true, message: `Driver ${id} deleted successfully` });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Failed to delete driver', error: error.message });
  } finally {
    client.release();
  }
};

export const getDriverAssignedTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Identify driver: prefer authenticated user, fallback to query param or default
    let driverId = req.user?.user_id;
    if (!driverId && req.query.driver_id) {
      driverId = String(req.query.driver_id);
    }
    if (!driverId) {
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

    // Calculate upcoming stops along the trip
    let upcomingStops: any[] = [];
    let nextStop: any = null;
    if (trip_id) {
      const stopsRes = await query(
        `SELECT s.stop_id, s.stop_name, s.latitude, s.longitude, ts.arrival_status
         FROM trip_stops ts
         JOIN stops s ON ts.stop_id = s.stop_id
         WHERE ts.trip_id = $1 AND ts.arrival_status NOT IN ('COMPLETED', 'SKIPPED')
         ORDER BY ts.arrival_status = 'APPROACHING' DESC, ts.trip_stop_id ASC
         LIMIT 5`,
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
        // ETA formula: Distance (km) / 25 km/h * 60 minutes
        const etaMins = distKm <= 0.05 ? 0 : Math.max(1, Math.round((distKm / 25) * 60));

        return {
          stop_id: st.stop_id,
          stop_name: st.stop_name,
          remaining_road_distance_km: distKm,
          theoretical_eta_minutes: etaMins,
        };
      });

      if (upcomingStops.length > 0) {
        nextStop = upcomingStops[0];
      }
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
      current_or_next_stop: nextStop,
      upcoming_stops: upcomingStops,
    };

    socketEvents.emitLocationUpdate(telemetryPayload);

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
