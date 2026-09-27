import { Route, Stop, RouteStop } from '../types/database';
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

  getRouteById(routeId: string, routesList?: Route[]): Route | undefined {
    const list = routesList || MOCK_ROUTES;
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
    const allRouteStops = customRouteStops || MOCK_ROUTE_STOPS;
    const allStops = customStops || MOCK_STOPS;
    const allRoutes = customRoutes || MOCK_ROUTES;

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
  }
};
