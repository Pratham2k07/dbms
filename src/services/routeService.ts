import { Route, Stop, RouteStop } from '../types/database';
import { databaseService } from './databaseService';

export interface RouteStopSequence {
  sequence_number: number;
  stop: Stop;
  isShared: boolean;
  sharedWithRoutes: string[];
}

export const routeService = {
  getAllRoutes(): Route[] {
    return databaseService.getState().routes;
  },

  getRouteById(routeId: string, routesList?: Route[]): Route | undefined {
    const list = routesList || databaseService.getState().routes;
    return list.find((r) => r.route_id === routeId);
  },

  /**
   * Returns sorted stops for a route with sequence numbers and shared stop annotations
   */
  getRouteStopsWithMetadata(
    routeId: string,
    customRouteStops?: RouteStop[],
    customStops?: Stop[],
    customRoutes?: Route[]
  ): RouteStopSequence[] {
    const dbState = databaseService.getState();
    const allRouteStops = customRouteStops || dbState.routeStops;
    const allStops = customStops || dbState.stops;
    const allRoutes = customRoutes || dbState.routes;

    const routeStops = allRouteStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number);

    return routeStops
      .map((rs) => {
        const stop = allStops.find((s) => s.stop_id === rs.stop_id);
        if (!stop) return null;

        // Check which other routes also contain this stop
        const otherRouteIds = allRouteStops
          .filter((item) => item.stop_id === rs.stop_id && item.route_id !== routeId)
          .map((item) => {
            const r = allRoutes.find((route) => route.route_id === item.route_id);
            return r ? r.route_code : item.route_id;
          });

        return {
          sequence_number: rs.sequence_number,
          stop,
          isShared: otherRouteIds.length > 0,
          sharedWithRoutes: Array.from(new Set(otherRouteIds))
        };
      })
      .filter((item): item is RouteStopSequence => item !== null);
  },

  /**
   * Ensures the route polyline terminates at the final stop of the route.
   * If the route is non-circular (origin != terminus), trims any trailing points
   * that loop past the terminus back to origin.
   */
  trimPolylineToTerminus(
    coords: [number, number][] | undefined,
    orderedStops: { latitude: number | string; longitude: number | string; stop_name?: string }[]
  ): [number, number][] | undefined {
    if (!coords || coords.length < 2 || !orderedStops || orderedStops.length < 2) return coords;

    const firstStop = orderedStops[0];
    const lastStop = orderedStops[orderedStops.length - 1];

    const lat0 = Number(firstStop.latitude);
    const lon0 = Number(firstStop.longitude);
    const latLast = Number(lastStop.latitude);
    const lonLast = Number(lastStop.longitude);

    // If start and end are within ~300 meters, it's a true circular corridor
    const originToTerminusDist = Math.hypot(latLast - lat0, lonLast - lon0);
    if (originToTerminusDist < 0.003) {
      return coords;
    }

    // Non-circular route: find closest point to the final stop
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dist = Math.hypot(coords[i][0] - latLast, coords[i][1] - lonLast);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // If point within ~800m is found before the end of coords, trim trailing loop
    if (bestIdx > 0 && bestDist < 0.008 && bestIdx < coords.length - 1) {
      return coords.slice(0, bestIdx + 1);
    }

    return coords;
  },

  /**
   * Generates a smooth pathway that strictly passes through all given stops in order.
   * Fine step interpolation between each consecutive pair of stops ensures
   * the route line is never static and adapts dynamically whenever stops change.
   */
  generatePathwayFromStops(
    orderedStops: { latitude: number | string; longitude: number | string }[]
  ): [number, number][] {
    if (!orderedStops || orderedStops.length < 2) {
      return orderedStops ? orderedStops.map((s) => [Number(s.latitude), Number(s.longitude)] as [number, number]) : [];
    }

    const coords: [number, number][] = [];
    const stepsPerLeg = 20;

    for (let i = 0; i < orderedStops.length; i++) {
      const curr = orderedStops[i];
      const currLat = Number(curr.latitude);
      const currLng = Number(curr.longitude);

      if (i === 0) {
        coords.push([currLat, currLng]);
      } else {
        const prev = orderedStops[i - 1];
        const prevLat = Number(prev.latitude);
        const prevLng = Number(prev.longitude);

        for (let step = 1; step <= stepsPerLeg; step++) {
          const frac = step / stepsPerLeg;
          const lat = prevLat + (currLat - prevLat) * frac;
          const lng = prevLng + (currLng - prevLng) * frac;
          coords.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
        }
      }
    }

    return coords;
  },

  /**
   * Dynamically resolves the best route coordinates for any route:
   * 1. Checks if route.route_coordinates matches the current given stops.
   * 2. If valid and matches stops, returns the coordinates trimmed at the terminus.
   * 3. If missing, mismatched, or if stops were changed, dynamically generates the pathway
   *    directly through the given stops so the line changes whenever stops change!
   */
  getDynamicRouteCoordinates(
    route?: Route,
    orderedStops?: { latitude: number | string; longitude: number | string }[],
    routeCoordinatesMap?: Record<string, [number, number][]>
  ): [number, number][] | undefined {
    if (!orderedStops || orderedStops.length < 2) {
      if (orderedStops && orderedStops.length === 1) {
        return [[Number(orderedStops[0].latitude), Number(orderedStops[0].longitude)]];
      }
      return undefined;
    }

    const routeId = route?.route_id;

    // 1. Check coordinates attached to route
    let rawCoords: [number, number][] | undefined = undefined;
    const rCoords = route?.route_coordinates;
    if (rCoords) {
      if (Array.isArray(rCoords) && rCoords.length > 0) rawCoords = rCoords;
      else if (typeof rCoords === 'string') {
        try {
          const p = JSON.parse(rCoords);
          if (Array.isArray(p) && p.length > 0) rawCoords = p;
        } catch {}
      }
    }

    // 2. Check cached dictionary
    if (!rawCoords && routeId && routeCoordinatesMap && routeCoordinatesMap[routeId]?.length > 0) {
      rawCoords = routeCoordinatesMap[routeId];
    }

    // 3. Verify if rawCoords aligns with the current given stops
    if (rawCoords && rawCoords.length > 1) {
      const firstStop = orderedStops[0];
      const lastStop = orderedStops[orderedStops.length - 1];
      const startDist = Math.hypot(rawCoords[0][0] - Number(firstStop.latitude), rawCoords[0][1] - Number(firstStop.longitude));
      const endDist = Math.hypot(rawCoords[rawCoords.length - 1][0] - Number(lastStop.latitude), rawCoords[rawCoords.length - 1][1] - Number(lastStop.longitude));

      // If the coordinates start and end within ~1.5 km of the first and last stop, verify intermediate alignment
      if (startDist < 0.015 && endDist < 0.015) {
        return this.trimPolylineToTerminus(rawCoords, orderedStops);
      }
      // Or if rawCoords passes near lastStop and needs trimming
      const trimmed = this.trimPolylineToTerminus(rawCoords, orderedStops);
      if (trimmed && trimmed.length > 1) {
        const trimmedEndDist = Math.hypot(trimmed[trimmed.length - 1][0] - Number(lastStop.latitude), trimmed[trimmed.length - 1][1] - Number(lastStop.longitude));
        if (startDist < 0.015 && trimmedEndDist < 0.015) {
          return trimmed;
        }
      }
    }

    // 4. If coordinates were static, missing, or mismatched with the new stops:
    // Generate a fresh dynamic pathway that strictly follows the given stops in order!
    return this.generatePathwayFromStops(orderedStops);
  }
};
