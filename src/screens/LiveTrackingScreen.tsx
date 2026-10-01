import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/map/MapView';
import { RouteTimeline } from '../components/tracking/RouteTimeline';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { ETA } from '../components/shuttles/ETA';
import { ArrowLeft, Route as RouteIcon, Radio, User, Gauge, ShieldCheck, Bus } from 'lucide-react';
import { routeService } from '../services/routeService';
import { MOCK_DRIVERS } from '../data/mockDatabase';

export const LiveTrackingScreen: React.FC = () => {
  const {
    selectedTripId,
    setSelectedTripId,
    trips,
    shuttles,
    routes,
    stops,
    tripStops,
    routeStops: allRouteStops,
    shuttleLocations,
    studentLocation,
    selectedStopId,
    etaMap,
    setCurrentScreen,
    navigateToRouteDetails
  } = useApp();

  const [showAllShuttlesOnMap, setShowAllShuttlesOnMap] = useState<boolean>(true);

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

  // Formatted active shuttles for the map (renders all moving shuttles when toggle is active)
  const activeShuttlesForMap = useMemo(() => {
    if (!showAllShuttlesOnMap) {
      const loc = shuttleLocations.find(
        (item) => item.trip_id === trip.trip_id || item.shuttle_id === shuttle.shuttle_id
      );
      if (!loc) return [];
      return [
        {
          location: loc,
          number: shuttle ? shuttle.shuttle_number : 'SHUTTLE',
          routeId: route ? route.route_id : 'ROUTE-01'
        }
      ];
    }

    return shuttleLocations
      .map((loc) => {
        const t = trips.find((item) => item.trip_id === loc.trip_id);
        const s = shuttles.find((item) => item.shuttle_id === loc.shuttle_id);
        if (!t || !s) return null;
        return {
          location: loc,
          number: s.shuttle_number,
          routeId: t.route_id
        };
      })
      .filter(Boolean) as { location: (typeof shuttleLocations)[0]; number: string; routeId: string }[];
  }, [shuttleLocations, trips, shuttles, trip, shuttle, route, showAllShuttlesOnMap]);

  // Stops belonging to this route and active corridors
  const mapStops = useMemo(() => {
    if (!showAllShuttlesOnMap) {
      const sequenceList = routeService.getRouteStopsWithMetadata(route.route_id);
      return sequenceList.map((item) => item.stop);
    }
    const activeRouteIds = new Set(trips.filter((t) => t.running_status === 'RUNNING').map((t) => t.route_id));
    activeRouteIds.add(route.route_id);
    return stops.filter((s) =>
      allRouteStops.some((rs) => activeRouteIds.has(rs.route_id) && rs.stop_id === s.stop_id)
    );
  }, [showAllShuttlesOnMap, route.route_id, trips, stops, allRouteStops]);

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 lg:pt-6 space-y-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="group inline-flex items-center gap-2 text-stone-600 hover:text-[#121316] text-xs font-editorial font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>BACK TO HOME & MAP</span>
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

        {/* Multi-Shuttle Switcher Bar */}
        <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 pl-1">
              Select Shuttle to Track:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {trips.map((t) => {
                const s = shuttles.find((item) => item.shuttle_id === t.shuttle_id);
                const r = routes.find((item) => item.route_id === t.route_id);
                const isSelected = t.trip_id === trip.trip_id;
                const isRunning = t.running_status === 'RUNNING';

                return (
                  <button
                    key={t.trip_id}
                    type="button"
                    onClick={() => setSelectedTripId(t.trip_id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-editorial font-bold flex items-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-[#E8590C] text-white border-[#E8590C] shadow-sm ring-2 ring-[#E8590C]/25'
                        : 'bg-[#FBFBF9] hover:bg-stone-100 text-stone-700 border-stone-200/90'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : isRunning
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-stone-300'
                      }`}
                    />
                    <Bus className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                    <span>{s?.shuttle_number || t.shuttle_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-200/70 text-stone-600'
                      }`}
                    >
                      {r?.route_code || t.route_id}
                    </span>
                    {!isRunning && (
                      <span className="text-[9px] font-mono uppercase opacity-70">
                        (Scheduled)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map view mode toggle: Show all shuttles vs Focused shuttle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllShuttlesOnMap(!showAllShuttlesOnMap)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border ${
                showAllShuttlesOnMap
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title="Toggle showing all moving shuttles simultaneously on map"
            >
              <Radio className={`w-3 h-3 ${showAllShuttlesOnMap ? 'text-emerald-600 animate-pulse' : 'text-stone-400'}`} />
              <span>{showAllShuttlesOnMap ? 'All Shuttles on Map' : 'Selected Shuttle Only'}</span>
            </button>
          </div>
        </div>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 7 cols) - Grand Live Interactive Map */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative">
              <MapView
                stops={mapStops}
                studentLocation={studentLocation}
                activeShuttles={activeShuttlesForMap}
                highlightRouteId={route.route_id}
                selectedStopId={selectedStopId}
                onSelectShuttle={(tripId) => setSelectedTripId(tripId)}
                heightClass="h-[55vh] lg:h-[620px]"
                interactive={true}
              />
            </div>

            <div className="hidden lg:flex items-center justify-between text-xs font-mono text-stone-500 px-2">
              <span>● Tap any shuttle marker on map or bar above to focus telemetry</span>
              <span className="text-[#E8590C] font-bold">UPDATED LIVE JUST NOW</span>
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
