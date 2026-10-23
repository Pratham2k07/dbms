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
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const timestamp = new Date(position.timestamp).toISOString();

          const studentLoc: StudentLocation = {
            student_id: 'USR-STU-001',
            latitude,
            longitude,
            accuracy_m: accuracy,
            timestamp,
            location_name: accuracy < 50 ? 'Current GPS Location' : 'Approximate Device Location'
          };

          // Persist to database asynchronously
          try {
            await recordStudentLocation({
              latitude,
              longitude,
              accuracy_m: accuracy,
              gps_timestamp: timestamp
            });
            lastPersistedTime = Date.now();
            lastPersistedCoords = { lat: latitude, lng: longitude };
          } catch (err) {
            console.warn('Failed to persist student location to backend:', err);
          }

          resolve(studentLoc);
        },
        (error) => {
          let errorMsg = 'Failed to obtain device location.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Please allow location access to track shuttles.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'GPS location is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out. Please check device GPS.';
          }
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000
        }
      );
    });
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
    const list: NearbyStopInfo[] = stops
      .filter((stop) => !stop.is_destination)
      .map((stop) => {
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
