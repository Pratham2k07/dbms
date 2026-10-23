import { ShuttleLocation } from '../types/database';

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
  return Math.round((brng + 360) % 360);
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
  calculateBearing,
  interpolateCoords,

  formatSpeed(speedKmh?: number): string {
    if (!speedKmh || speedKmh < 1) return '0 km/h';
    return `${Math.round(speedKmh)} km/h`;
  }
};
