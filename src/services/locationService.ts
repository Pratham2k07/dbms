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
let activeLocationPromise: Promise<StudentLocation> | null = null;

export const locationService = {
  calculateHaversineDistance,
  calculateWalkingTimeMinutes,

  /**
   * Requests real browser geolocation permission and obtains actual device coordinates.
   * Uses maximumAge: 0 to ensure a fresh hardware GPS fix is obtained.
   * Deduplicates concurrent in-flight calls and throttles redundant backend writes.
   * Never fabricates fake coordinates.
   */
  async getCurrentLocation(options?: { highAccuracy?: boolean; timeoutMs?: number; forcePersist?: boolean }): Promise<StudentLocation> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser.');
    }

    // Deduplicate concurrent requests so simultaneous component mounts share the same in-flight GPS fix
    if (activeLocationPromise) {
      return activeLocationPromise;
    }

    const tryGetPosition = (highAccuracy: boolean, timeoutMs: number): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: 0, // CRITICAL: Always request fresh reading from device hardware, no stale browser cache
        });
      });
    };

    activeLocationPromise = (async () => {
      let position: GeolocationPosition;
      const useHighAccuracy = options?.highAccuracy ?? true;
      const timeoutLimit = options?.timeoutMs ?? 8000;

      try {
        // 1. Primary GPS fix: High accuracy with maximumAge: 0
        position = await tryGetPosition(useHighAccuracy, timeoutLimit);
      } catch (err: any) {
        // If user explicitly denied permission, do not retry - surface immediately
        if (err && err.code === 1) {
          throw new Error('Location permission was denied. Please allow location access in your browser settings.');
        }

        // 2. If timed out or position unavailable, fall back once to standard network/Wi-Fi positioning with fresh reading
        try {
          position = await tryGetPosition(false, 7000);
        } catch (fallbackErr: any) {
          if (fallbackErr && fallbackErr.code === 1) {
            throw new Error('Location permission was denied. Please allow location access in your browser settings.');
          }
          if (fallbackErr && fallbackErr.code === 3) {
            throw new Error('GPS satellite request timed out. Please verify your device location/GPS is enabled.');
          }
          throw new Error(fallbackErr?.message || 'Unable to obtain GPS fix from device.');
        }
      }

      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = new Date(position.timestamp).toISOString();

      // Determine human-readable location label
      const distToCampus = calculateHaversineDistance(latitude, longitude, 26.8373, 75.6499);
      const locationName =
        distToCampus < 1500
          ? 'JK Lakshmipat University Campus'
          : accuracy < 100
          ? `Live Device Location (±${Math.round(accuracy)}m)`
          : `Approximate Device Location (±${Math.round(accuracy)}m)`;

      const studentLoc: StudentLocation = {
        student_id: 'USR-STU-001',
        latitude,
        longitude,
        accuracy_m: accuracy,
        timestamp,
        location_name: locationName,
      };

      // Persist to backend database (immediate if forcePersist or coordinates changed > 5m)
      const now = Date.now();
      const distMoved = lastPersistedCoords
        ? calculateHaversineDistance(lastPersistedCoords.lat, lastPersistedCoords.lng, latitude, longitude)
        : 999;

      if (options?.forcePersist || now - lastPersistedTime > 4000 || distMoved > 5) {
        lastPersistedTime = now;
        lastPersistedCoords = { lat: latitude, lng: longitude };

        try {
          await recordStudentLocation({
            latitude,
            longitude,
            accuracy_m: accuracy,
            gps_timestamp: timestamp,
          });
          console.log('[GPS Service] Persisted fresh GPS location to backend:', latitude, longitude);
        } catch (err) {
          console.warn('Failed to persist student location to backend:', err);
        }
      }

      return studentLoc;
    })().finally(() => {
      activeLocationPromise = null;
    });

    return activeLocationPromise;
  },

  /**
   * Watch real student location changes with sensible database write policy
   * Enables continuous live tracking across device movements and DevTools Sensors emulation.
   */
  watchLocation(
    onLocation: (loc: StudentLocation) => void,
    onError: (err: Error) => void
  ): number | null {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      onError(new Error('Geolocation is not supported by your browser.'));
      return null;
    }

    return navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const timestamp = new Date(pos.timestamp).toISOString();

        const distToCampus = calculateHaversineDistance(latitude, longitude, 26.8373, 75.6499);
        const locationName =
          distToCampus < 1500
            ? 'JK Lakshmipat University Campus'
            : accuracy < 100
            ? `Live Device Location (±${Math.round(accuracy)}m)`
            : `Approximate Device Location (±${Math.round(accuracy)}m)`;

        const loc: StudentLocation = {
          student_id: 'USR-STU-001',
          latitude,
          longitude,
          accuracy_m: accuracy,
          timestamp,
          location_name: locationName
        };

        console.log('[GPS Watcher] Live coordinate update received:', latitude, longitude, `(±${Math.round(accuracy)}m)`);
        onLocation(loc);

        // Immediate persistence if position moved > 5m or elapsed > 4s
        const now = Date.now();
        const distMoved = lastPersistedCoords
          ? calculateHaversineDistance(lastPersistedCoords.lat, lastPersistedCoords.lng, latitude, longitude)
          : 999;

        if (now - lastPersistedTime > 4000 || distMoved > 5) {
          lastPersistedTime = now;
          lastPersistedCoords = { lat: latitude, lng: longitude };
          try {
            await recordStudentLocation({
              latitude,
              longitude,
              accuracy_m: accuracy,
              gps_timestamp: timestamp
            });
            console.log('[GPS Watcher] Saved updated coordinates to backend database:', latitude, longitude);
          } catch (e) {
            console.warn('[GPS Watcher] Failed to persist location to backend:', e);
          }
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : err.code === 3
            ? 'Location watch timed out'
            : err.message || 'Location watch error';
        onError(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Fresh GPS updates only
      }
    );
  },

  clearWatch(watchId: number) {
    if (typeof window !== 'undefined' && navigator.geolocation && watchId !== null && watchId !== undefined) {
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
