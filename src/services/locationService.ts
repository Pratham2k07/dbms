import { StudentLocation, Stop } from '../types/database';
import { NearbyStopInfo } from '../types/ui';
import { recordStudentLocation } from './apiService';

/**
 * Calculates Great Circle distance between two geo coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates estimated walking time based on standard pedestrian speed (approx 70m/min)
 */
export function calculateWalkingTimeMinutes(distanceMeters: number): number {
  const walkingSpeedMpm = 70; // 70 meters per minute ~ 4.2 km/h
  const minutes = Math.ceil(distanceMeters / walkingSpeedMpm);
  return Math.max(1, minutes);
}

let lastPersistedTime = 0;
let lastPersistedCoords: { lat: number; lng: number } | null = null;

export const locationService = {
  calculateHaversineDistance,
  calculateWalkingTimeMinutes,

  /**
   * Requests real browser geolocation permission and obtains actual device coordinates.
   * Persists valid coordinates to the backend database.
   * Never fabricates fake coordinates.
   */
  async getCurrentLocation(): Promise<StudentLocation> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser.');
    }

    const tryGetPosition = (highAccuracy: boolean, timeoutMs: number): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: 30000,
        });
      });
    };

    let position: GeolocationPosition;
    try {
      // 1. Try high accuracy first (5s timeout)
      position = await tryGetPosition(true, 5000);
    } catch (err: any) {
      // If user explicitly denied permission, don't retry - surface error
      if (err && err.code === 1) {
        throw new Error('Location permission was denied. Please allow location access in your browser.');
      }
      // 2. Fall back to standard accuracy (Wi-Fi / IP / Cell network positioning)
      try {
        position = await tryGetPosition(false, 8000);
      } catch (fallbackErr: any) {
        if (fallbackErr && fallbackErr.code === 1) {
          throw new Error('Location permission was denied. Please allow location access in your browser.');
        }
        throw new Error(fallbackErr?.message || 'Unable to obtain GPS fix from device.');
      }
    }

    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date(position.timestamp).toISOString();

    // Determine location name based on coordinates
    const distToCampus = calculateHaversineDistance(latitude, longitude, 26.8373, 75.6499);
    const locationName =
      distToCampus < 1500
        ? 'JK Lakshmipat University Campus'
        : accuracy < 100
        ? `Live GPS Location (±${Math.round(accuracy)}m)`
        : `Approximate Device Location (±${Math.round(accuracy)}m)`;

    const studentLoc: StudentLocation = {
      student_id: 'USR-STU-001',
      latitude,
      longitude,
      accuracy_m: accuracy,
      timestamp,
      location_name: locationName,
    };

    // Persist to backend database asynchronously
    recordStudentLocation({
      latitude,
      longitude,
      accuracy_m: accuracy,
      gps_timestamp: timestamp,
    }).catch((err) => {
      console.warn('Failed to persist student location to backend:', err);
    });

    return studentLoc;
  },

  /**
   * Watch real student location changes with sensible database write policy
   */
  watchLocation(
    onLocation: (loc: StudentLocation) => void,
    onError: (err: Error) => void
  ): number | null {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported.'));
      return null;
    }

    return navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const timestamp = new Date(pos.timestamp).toISOString();

        const loc: StudentLocation = {
          student_id: 'USR-STU-001',
          latitude,
          longitude,
          accuracy_m: accuracy,
          timestamp,
          location_name: 'Current Device Location'
        };

        onLocation(loc);

        // Sensible persistence policy: at most once every 15s or if moved > 25m
        const now = Date.now();
        const distMoved = lastPersistedCoords
          ? calculateHaversineDistance(lastPersistedCoords.lat, lastPersistedCoords.lng, latitude, longitude)
          : 999;

        if (now - lastPersistedTime > 15000 || distMoved > 25) {
          lastPersistedTime = now;
          lastPersistedCoords = { lat: latitude, lng: longitude };
          try {
            await recordStudentLocation({
              latitude,
              longitude,
              accuracy_m: accuracy,
              gps_timestamp: timestamp
            });
          } catch (e) {
            // Non-blocking
          }
        }
      },
      (err) => {
        onError(new Error(err.message || 'Location watch error'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  },

  clearWatch(watchId: number) {
    if (navigator.geolocation && watchId !== null && watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Computes nearby stops sorted by geographic distance
   */
  calculateNearbyStops(
    studentLocation: StudentLocation,
    stops: Stop[],
    approachingCounts: Record<string, number>
  ): NearbyStopInfo[] {
    const list: NearbyStopInfo[] = stops.map((stop) => {
        const dist = calculateHaversineDistance(
          studentLocation.latitude,
          studentLocation.longitude,
          stop.latitude,
          stop.longitude
        );

        return {
          stop,
          distance_meters: dist,
          walking_time_minutes: calculateWalkingTimeMinutes(dist),
          approaching_shuttles_count: approachingCounts[stop.stop_id] || 0,
          is_nearest: false
        };
      });

    list.sort((a, b) => a.distance_meters - b.distance_meters);

    if (list.length > 0) {
      list[0].is_nearest = true;
    }

    return list;
  },

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} M AWAY`;
    }
    return `${(meters / 1000).toFixed(1)} KM AWAY`;
  }
};
