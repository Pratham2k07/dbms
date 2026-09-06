import { StudentLocation, Stop } from '../types/database';
import { NearbyStopInfo } from '../types/ui';
import { INITIAL_STUDENT_LOCATION } from '../data/mockDatabase';

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

export const locationService = {
  calculateHaversineDistance,
  calculateWalkingTimeMinutes,
  /**
   * Retrieves current student location (simulated or browser GPS)
   */
  async getCurrentLocation(): Promise<StudentLocation> {
    // Return student location with fresh timestamp
    return {
      ...INITIAL_STUDENT_LOCATION,
      timestamp: new Date().toISOString()
    };
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
      // Filter out university final destination from boarding list, or keep as destination
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

    // Sort Nearest to Farthest
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
