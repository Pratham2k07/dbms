import { Route, Stop } from '../types/database';
import { MOCK_ROUTES, MOCK_ROUTE_STOPS, MOCK_STOPS } from '../data/mockDatabase';

export interface RouteStopSequence {
  sequence_number: number;
  stop: Stop;
  isShared: boolean;
  sharedWithRoutes: string[];
}

export const routeService = {
  getAllRoutes(): Route[] {
    return MOCK_ROUTES;
  },

  getRouteById(routeId: string): Route | undefined {
    return MOCK_ROUTES.find((r) => r.route_id === routeId);
  },

  /**
   * Returns sorted stops for a route with sequence numbers and shared stop annotations
   */
  getRouteStopsWithMetadata(routeId: string): RouteStopSequence[] {
    const routeStops = MOCK_ROUTE_STOPS
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number);

    return routeStops.map((rs) => {
      const stop = MOCK_STOPS.find((s) => s.stop_id === rs.stop_id)!;
      // Check which other routes also contain this stop
      const otherRouteIds = MOCK_ROUTE_STOPS
        .filter((item) => item.stop_id === rs.stop_id && item.route_id !== routeId)
        .map((item) => {
          const r = MOCK_ROUTES.find((route) => route.route_id === item.route_id);
          return r ? r.route_code : item.route_id;
        });

      return {
        sequence_number: rs.sequence_number,
        stop,
        isShared: otherRouteIds.length > 0,
        sharedWithRoutes: otherRouteIds
      };
    });
  }
};
