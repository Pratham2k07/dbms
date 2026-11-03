import { Stop, Trip, TripStop, Shuttle, Route, ShuttleLocation } from '../types/database';
import { UpcomingShuttleCardData } from '../types/ui';
import { databaseService } from './databaseService';
import { calculateEtaBetweenCoords } from './locationService';

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
   * Calculates approaching shuttle counts for all stops based on active trip stops
   */
  getApproachingCounts(trips: Trip[], tripStops: TripStop[]): Record<string, number> {
    const counts: Record<string, number> = {};
    const runningTripIds = new Set(
      trips.filter((t) => t.running_status === 'RUNNING').map((t) => t.trip_id)
    );

    for (const ts of tripStops) {
      if (runningTripIds.has(ts.trip_id) && (ts.arrival_status === 'APPROACHING' || ts.arrival_status === 'SCHEDULED')) {
        counts[ts.stop_id] = (counts[ts.stop_id] || 0) + 1;
      }
    }

    return counts;
  },

  /**
   * Retrieves all upcoming shuttles heading to a specific stop
   * Uses ETA = Distance of shuttle to stop / 25 km/h
   */
  getUpcomingShuttles(
    stopId: string,
    trips: Trip[],
    tripStops: TripStop[],
    shuttles: Shuttle[],
    routes: Route[],
    shuttleLocations: ShuttleLocation[],
    etaOverrides?: Record<string, number>
  ): UpcomingShuttleCardData[] {
    const relevantTripStops = tripStops.filter(
      (ts) => ts.stop_id === stopId && ts.arrival_status !== 'COMPLETED'
    );

    const cards: UpcomingShuttleCardData[] = [];
    const targetStop = this.getStopById(stopId);

    for (const ts of relevantTripStops) {
      const trip = trips.find((t) => t.trip_id === ts.trip_id);
      if (!trip || trip.running_status !== 'RUNNING') continue;

      const shuttle = shuttles.find((s) => s.shuttle_id === trip.shuttle_id);
      const route = routes.find((r) => r.route_id === trip.route_id);
      const location = shuttleLocations.find((l) => l.shuttle_id === trip.shuttle_id || l.trip_id === trip.trip_id);

      if (shuttle && route) {
        // ETA formula: Distance of shuttle from the specific stop / 25 km/h
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
          // Fallback if telemetry not yet available
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
    }

    // Sort by smallest ETA first
    cards.sort((a, b) => a.eta_minutes - b.eta_minutes);
    return cards;
  }
};
