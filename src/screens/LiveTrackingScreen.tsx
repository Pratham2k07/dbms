import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/map/MapView';
import { RouteTimeline } from '../components/tracking/RouteTimeline';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { ETA } from '../components/shuttles/ETA';
import { ArrowLeft, Route as RouteIcon, Radio, User, Gauge, ShieldCheck } from 'lucide-react';
import { routeService } from '../services/routeService';
import { MOCK_DRIVERS } from '../data/mockDatabase';

export const LiveTrackingScreen: React.FC = () => {
  const {
    selectedTripId,
    trips,
    shuttles,
    routes,
    stops,
    tripStops,
    shuttleLocations,
    studentLocation,
    selectedStopId,
    etaMap,
    setCurrentScreen,
    navigateToRouteDetails
  } = useApp();

  // Selected trip & shuttle data
  const trip = trips.find((t) => t.trip_id === selectedTripId) || trips[0];
  const shuttle = shuttles.find((s) => s.shuttle_id === trip.shuttle_id) || shuttles[0];
  const route = routes.find((r) => r.route_id === trip.route_id) || routes[0];
  const driver = MOCK_DRIVERS.find((d) => d.driver_id === trip.driver_id) || MOCK_DRIVERS[0];

  // Dynamic ETA for this trip & stop
  const etaKey = `${trip.trip_id}_${selectedStopId}`;
  const etaMinutes = etaMap[etaKey] || 5;

  const targetTripStop = tripStops.find(
    (ts) => ts.trip_id === trip.trip_id && ts.stop_id === selectedStopId
  );

  // Formatted active shuttles list for the map
  const activeShuttlesForMap = useMemo(() => {
    return shuttleLocations.map((loc) => {
      const t = trips.find((item) => item.trip_id === loc.trip_id);
      const s = shuttles.find((item) => item.shuttle_id === loc.shuttle_id);
      return {
        location: loc,
        number: s ? s.shuttle_number : 'SHUTTLE',
        routeId: t ? t.route_id : 'ROUTE-01'
      };
    });
  }, [shuttleLocations, trips, shuttles]);

  // Stops belonging to this route
  const routeStops = useMemo(() => {
    const sequenceList = routeService.getRouteStopsWithMetadata(route.route_id);
    return sequenceList.map((item) => item.stop);
  }, [route.route_id]);

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 space-y-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <button
            onClick={() => setCurrentScreen('stop-details')}
            className="group inline-flex items-center gap-2 text-stone-600 hover:text-[#121316] text-xs font-editorial font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>BACK TO STOP DETAILS</span>
          </button>

          <div className="flex items-center gap-3">
            {/* View Route Details Button */}
            <button
              onClick={() => navigateToRouteDetails(route.route_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial font-bold tracking-wider uppercase bg-white border border-stone-200 hover:border-stone-400 text-stone-700 shadow-subtle transition-all active:scale-95"
            >
              <RouteIcon className="w-3.5 h-3.5 text-jklu-orange" />
              <span>VIEW CORRIDOR {route.route_code}</span>
            </button>

            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70 font-semibold">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE GPS TELEMETRY</span>
            </span>
          </div>
        </div>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 7 cols) - Grand Live Interactive Map */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative">
              <MapView
                stops={routeStops}
                studentLocation={studentLocation}
                activeShuttles={activeShuttlesForMap}
                highlightRouteId={route.route_id}
                selectedStopId={selectedStopId}
                heightClass="h-[55vh] lg:h-[620px]"
                interactive={true}
              />
            </div>

            <div className="hidden lg:flex items-center justify-between text-xs font-mono text-stone-500 px-2">
              <span>● Smooth GPS interpolation along corridor waypoints</span>
              <span className="text-jklu-orange font-bold">UPDATED LIVE JUST NOW</span>
            </div>
          </div>

          {/* Right Column (PC: 5 cols) - Telemetry & Route Timeline (Visible directly on PC) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Telemetry Card */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-editorial font-bold text-2xl text-[#121316] tracking-tight uppercase">
                      {shuttle.shuttle_number}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-xs font-mono font-medium text-stone-500">
                      {shuttle.registration_number}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium uppercase tracking-wide mt-0.5">
                    ON THE WAY TO CAMPUS
                  </p>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <StatusIndicator status={trip.capacity_status} size="lg" />
                    <span className="text-stone-300">•</span>
                    <span className="text-xs font-mono text-stone-500">
                      TRIP {trip.trip_id}
                    </span>
                  </div>
                </div>

                {/* Dominant Large ETA */}
                <div className="text-right">
                  <span className="text-[10px] font-editorial font-bold tracking-widest text-stone-400 uppercase block">
                    ARRIVING IN
                  </span>
                  <ETA minutes={etaMinutes} size="hero" />
                </div>
              </div>

              {/* Timing info row */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-stone-400 block text-[10px]">ESTIMATED ARRIVAL</span>
                  <span className="font-bold text-[#121316] text-sm">{targetTripStop?.estimated_arrival || '10:35 AM'}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">SCHEDULED TIME</span>
                  <span className="text-stone-600 text-sm">{targetTripStop?.scheduled_arrival || '10:30 AM'}</span>
                </div>
              </div>

              {/* Driver & Speed metadata */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-[#FBFBF9] border border-stone-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-mono uppercase">
                    <User className="w-3 h-3 text-stone-400" />
                    <span>Driver</span>
                  </div>
                  <p className="font-editorial font-bold text-sm text-[#121316]">
                    {driver.name}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    Lic: {driver.license_no}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#FBFBF9] border border-stone-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-mono uppercase">
                    <Gauge className="w-3 h-3 text-stone-400" />
                    <span>Telemetry Speed</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-[#121316]">
                    {trip.speed_kmh || 38} KM/H
                  </p>
                  <p className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Live GPS Broadcast
                  </p>
                </div>
              </div>
            </div>

            {/* Complete Vertical Route Timeline (visible in right panel on PC) */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle">
              <RouteTimeline
                route={route}
                trip={trip}
                tripStops={tripStops}
                selectedStopId={selectedStopId}
                etaMinutes={etaMinutes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
