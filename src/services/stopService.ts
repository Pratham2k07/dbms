import { Stop, Trip, TripStop, Shuttle, Route, ShuttleLocation } from '../types/database';
import { UpcomingShuttleCardData } from '../types/ui';
import { MOCK_STOPS } from '../data/mockDatabase';

export const stopService = {
  getAllStops(): Stop[] {
    return MOCK_STOPS;
  },

  getStopById(stopId: string): Stop | undefined {
    return MOCK_STOPS.find((s) => s.stop_id === stopId);
  },

  getDestinationStop(): Stop {
    return MOCK_STOPS.find((s) => s.is_destination) || MOCK_STOPS[MOCK_STOPS.length - 1];
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

    for (const ts of relevantTripStops) {
      const trip = trips.find((t) => t.trip_id === ts.trip_id);
      if (!trip || trip.running_status !== 'RUNNING') continue;

      const shuttle = shuttles.find((s) => s.shuttle_id === trip.shuttle_id);
      const route = routes.find((r) => r.route_id === trip.route_id);
      const location = shuttleLocations.find((l) => l.shuttle_id === trip.shuttle_id);

      if (shuttle && route) {
        // Base ETA calculation or override from simulation
        const key = `${trip.trip_id}_${stopId}`;
        const etaMinutes = etaOverrides && etaOverrides[key] !== undefined
          ? etaOverrides[key]
          : ts.stop_id === 'STOP-MANSAROVAR' && trip.trip_id === 'TRIP-101'
          ? 5
          : ts.stop_id === 'STOP-DCM' && trip.trip_id === 'TRIP-101'
          ? 18
          : ts.stop_id === 'STOP-AIRPORT' && trip.trip_id === 'TRIP-102'
          ? 7
          : ts.stop_id === 'STOP-VAISHALI' && trip.trip_id === 'TRIP-103'
          ? 4
          : 9;

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
