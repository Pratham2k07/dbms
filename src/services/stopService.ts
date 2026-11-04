import { Stop, Trip, TripStop, Shuttle, Route, ShuttleLocation, RouteStop } from '../types/database';
import { UpcomingShuttleCardData } from '../types/ui';
import { databaseService } from './databaseService';
import { calculateEtaBetweenCoords } from './locationService';
import { computeTripProgression } from './routeProgressTracker';

export const stopService = {
  getAllStops(): Stop[] {
    return databaseService.getState().stops;
  },

  getStopById(stopId: string): Stop | undefined {
    return databaseService.getState().stops.find((s) => s.stop_id === stopId);
  },

  getDestinationStop(): Stop {
    const stops = databaseService.getState().stops;
    return stops.find((s) => s.is_destination) || stops[stops.length - 1];
  },

  /**
   * Calculates approaching shuttle counts for all stops based on active trip stops.
   * Leverages the exact same monotonic progression logic as the Live Tracking screen
   * so stops that the shuttle has already crossed never show as approaching.
   */
  getApproachingCounts(
    trips: Trip[],
    tripStops: TripStop[],
    shuttleLocations?: ShuttleLocation[],
    routeStops?: RouteStop[],
    stops?: Stop[]
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    const runningTrips = trips.filter((t) => t.running_status === 'RUNNING');
    if (runningTrips.length === 0) return counts;

    const db = databaseService.getState();
    const allStops = stops && stops.length > 0 ? stops : db.stops;
    const allRouteStops = routeStops && routeStops.length > 0 ? routeStops : db.routeStops;
    const allLocations = shuttleLocations && shuttleLocations.length > 0 ? shuttleLocations : db.shuttleLocations;

    for (const trip of runningTrips) {
      const ordered = allRouteStops
        .filter((rs) => rs.route_id === trip.route_id)
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map((rs) => allStops.find((s) => s.stop_id === rs.stop_id))
        .filter(Boolean) as Stop[];

      if (ordered.length === 0) continue;

      const loc = allLocations.find(
        (l) => l.trip_id === trip.trip_id || l.shuttle_id === trip.shuttle_id
      );

      const progression = computeTripProgression(
        trip.trip_id,
        true,
        ordered,
        loc,
        tripStops
      );

      // Only count stops that the shuttle has NOT yet passed
      for (const stop of ordered) {
        if (!progression.completedStopIds.has(stop.stop_id)) {
          counts[stop.stop_id] = (counts[stop.stop_id] || 0) + 1;
        }
      }
    }

    return counts;
  },

  /**
   * Retrieves all upcoming shuttles heading to a specific stop.
   * Uses identical Live Tracking screen progression:
   * - If a shuttle has already passed this stop, it is omitted.
   * - Uses identical ETA formula (distance to stop / 25 km/h).
   */
  getUpcomingShuttles(
    stopId: string,
    trips: Trip[],
    tripStops: TripStop[],
    shuttles: Shuttle[],
    routes: Route[],
    shuttleLocations: ShuttleLocation[],
    etaOverrides?: Record<string, number>,
    routeStops?: RouteStop[],
    stops?: Stop[]
  ): UpcomingShuttleCardData[] {
    const db = databaseService.getState();
    const allStops = stops && stops.length > 0 ? stops : db.stops;
    const allRouteStops = routeStops && routeStops.length > 0 ? routeStops : db.routeStops;
    const targetStop = allStops.find((s) => s.stop_id === stopId) || this.getStopById(stopId);

    const cards: UpcomingShuttleCardData[] = [];
    const runningTrips = trips.filter((t) => t.running_status === 'RUNNING');

    for (const trip of runningTrips) {
      const shuttle = shuttles.find((s) => s.shuttle_id === trip.shuttle_id);
      const route = routes.find((r) => r.route_id === trip.route_id);
      if (!shuttle || !route) continue;

      // Ordered stops along this route
      const ordered = allRouteStops
        .filter((rs) => rs.route_id === trip.route_id)
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map((rs) => allStops.find((s) => s.stop_id === rs.stop_id))
        .filter(Boolean) as Stop[];

      const stopIdx = ordered.findIndex((s) => s.stop_id === stopId);
      if (stopIdx === -1) continue;

      const location = shuttleLocations.find(
        (l) => l.trip_id === trip.trip_id || l.shuttle_id === trip.shuttle_id
      );

      // Compute exact progression using Live Tracking screen logic
      const progression = computeTripProgression(
        trip.trip_id,
        true,
        ordered,
        location,
        tripStops
      );

      // If the shuttle has already crossed this stop, DO NOT list it as approaching!
      if (progression.completedStopIds.has(stopId)) {
        continue;
      }

      // Find trip_stop record if available
      const ts = tripStops.find((t) => t.trip_id === trip.trip_id && t.stop_id === stopId) || ({
        trip_id: trip.trip_id,
        stop_id: stopId,
        arrival_status: progression.activeApproachingStopId === stopId ? 'APPROACHING' : 'SCHEDULED',
        scheduled_arrival: trip.start_time,
        estimated_arrival: trip.start_time
      } as TripStop);

      // Identical ETA calculation as Live Tracking screen
      const key = `${trip.trip_id}_${stopId}`;
      let etaMinutes: number;

      if (etaOverrides && etaOverrides[key] !== undefined) {
        etaMinutes = etaOverrides[key];
      } else if (location && targetStop) {
        etaMinutes = calculateEtaBetweenCoords(
          Number(location.latitude),
          Number(location.longitude),
          Number(targetStop.latitude),
          Number(targetStop.longitude),
          25
        );
      } else {
        etaMinutes = 5;
      }

      cards.push({
        shuttle,
        trip,
        route,
        trip_stop: ts,
        eta_minutes: Math.max(1, etaMinutes),
        estimated_time: ts.estimated_arrival,
        scheduled_time: ts.scheduled_arrival,
        capacity_status: trip.capacity_status,
        shuttle_location: location
      });
    }

    // Sort by smallest ETA first
    cards.sort((a, b) => a.eta_minutes - b.eta_minutes);
    return cards;
  }
};
