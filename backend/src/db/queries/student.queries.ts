import pool from '../connection.js';
import { haversineDistanceMeters } from '../../services/routing.service.js';

export interface StudentLocationInput {
  student_id: string;
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  gps_timestamp?: string;
}

/**
 * Persist student's actual permitted GPS location.
 * Derives student identity from authenticated session.
 */
export const recordStudentLocation = async (data: StudentLocationInput) => {
  const { student_id, latitude, longitude, accuracy_m, gps_timestamp } = data;

  const lat = Number(latitude);
  const lng = Number(longitude);

  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Invalid GPS coordinates provided');
  }

  // Ensure student record exists in students subclass
  try {
    await pool.query(
      `INSERT INTO students (student_id, roll_no)
       VALUES ($1, $2)
       ON CONFLICT (student_id) DO NOTHING;`,
      [student_id, `ROLL-${student_id.slice(-6)}`]
    );
  } catch (err) {
    // Non-blocking if table constraints vary
  }

  const query = `
    INSERT INTO student_locations (
      student_id,
      latitude,
      longitude,
      accuracy_m,
      gps_timestamp,
      recorded_at
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    RETURNING location_id, student_id, latitude, longitude, accuracy_m, gps_timestamp, recorded_at;
  `;

  let parsedGpsTime: Date;
  if (gps_timestamp) {
    const t = new Date(gps_timestamp);
    parsedGpsTime = isNaN(t.getTime()) ? new Date() : t;
  } else {
    parsedGpsTime = new Date();
  }

  const parsedAccuracy = accuracy_m !== undefined && accuracy_m !== null && !isNaN(Number(accuracy_m))
    ? Math.max(0, Math.round(Number(accuracy_m) * 100) / 100)
    : null;

  const result = await pool.query(query, [
    student_id,
    lat,
    lng,
    parsedAccuracy,
    parsedGpsTime
  ]);

  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    accuracy_m: row.accuracy_m !== null && row.accuracy_m !== undefined ? parseFloat(row.accuracy_m) : null,
  };
};

/**
 * Get latest valid GPS location recorded for a student
 */
export const getLatestStudentLocation = async (studentId: string) => {
  const query = `
    SELECT 
      location_id,
      student_id,
      latitude,
      longitude,
      accuracy_m,
      gps_timestamp,
      recorded_at
    FROM student_locations
    WHERE student_id = $1
    ORDER BY recorded_at DESC, location_id DESC
    LIMIT 1;
  `;

  const result = await pool.query(query, [studentId]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    accuracy_m: row.accuracy_m !== null && row.accuracy_m !== undefined ? parseFloat(row.accuracy_m) : null,
  };
};

/**
 * Dynamically identify nearby stops using student's actual coordinates
 */
export const getNearbyStops = async (
  latitude: number,
  longitude: number,
  maxRadiusKm: number = 20,
  limit: number = 10
) => {
  // Query all stops with the routes they belong to
  const query = `
    SELECT 
      s.stop_id,
      s.stop_name,
      s.latitude,
      s.longitude,
      s.is_destination,
      s.description,
      COALESCE(
        json_agg(
          json_build_object(
            'route_id', r.route_id,
            'route_name', r.route_name,
            'route_code', r.route_code,
            'color', r.color,
            'sequence_number', rs.sequence_number,
            'cumulative_distance_km', rs.cumulative_distance_km
          ) ORDER BY rs.sequence_number
        ) FILTER (WHERE r.route_id IS NOT NULL),
        '[]'
      ) as routes
    FROM stops s
    LEFT JOIN route_stops rs ON s.stop_id = rs.stop_id
    LEFT JOIN routes r ON rs.route_id = r.route_id
    GROUP BY s.stop_id
  `;

  const result = await pool.query(query);

  // Calculate distance from student to each stop using Haversine
  const stopsWithDistance = result.rows.map((stop: any) => {
    const distMeters = haversineDistanceMeters(
      Number(latitude),
      Number(longitude),
      Number(stop.latitude),
      Number(stop.longitude)
    );
    const distance_km = Math.round((distMeters / 1000) * 100) / 100;

    return {
      stop_id: stop.stop_id,
      stop_name: stop.stop_name,
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
      is_destination: stop.is_destination,
      description: stop.description,
      distance_km,
      routes: stop.routes
    };
  });

  // Filter within max radius and sort closest first
  return stopsWithDistance
    .filter((s: any) => s.distance_km <= maxRadiusKm)
    .sort((a: any, b: any) => a.distance_km - b.distance_km)
    .slice(0, limit);
};
