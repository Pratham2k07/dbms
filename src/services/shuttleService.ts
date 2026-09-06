import { ShuttleLocation } from '../types/database';
import { ROUTE_PATH_COORDINATES } from '../data/mockDatabase';

/**
 * Calculates compass bearing from point A to point B in degrees
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Linear interpolation between two coordinates
 */
export function interpolateCoords(
  p1: [number, number],
  p2: [number, number],
  fraction: number
): [number, number] {
  return [
    p1[0] + (p2[0] - p1[0]) * fraction,
    p1[1] + (p2[1] - p1[1]) * fraction
  ];
}

export const shuttleService = {
  /**
   * Smoothly advances a shuttle's simulated GPS position along its route polyline
   */
  advanceShuttleLocation(
    currentLoc: ShuttleLocation,
    routeId: string,
    stepPercent: number = 0.8
  ): ShuttleLocation {
    const path = ROUTE_PATH_COORDINATES[routeId] || ROUTE_PATH_COORDINATES['ROUTE-01'];
    if (!path || path.length < 2) return currentLoc;

    // Advance percentage (looping back when reaching destination for continuous demo)
    let newProgress = currentLoc.progress_percentage + stepPercent;
    if (newProgress >= 98) {
      newProgress = 5; // Loop back to start of trip
    }

    const totalSegments = path.length - 1;
    const progressNormalized = newProgress / 100;
    const rawIndex = progressNormalized * totalSegments;
    const segmentIndex = Math.min(Math.floor(rawIndex), totalSegments - 1);
    const fraction = rawIndex - segmentIndex;

    const p1 = path[segmentIndex];
    const p2 = path[segmentIndex + 1];

    const [newLat, newLng] = interpolateCoords(p1, p2, fraction);
    const newBearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

    return {
      ...currentLoc,
      latitude: Number(newLat.toFixed(6)),
      longitude: Number(newLng.toFixed(6)),
      bearing: Math.round(newBearing),
      progress_percentage: Number(newProgress.toFixed(2)),
      current_segment_index: segmentIndex,
      timestamp: new Date().toISOString()
    };
  }
};
