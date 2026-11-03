import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/map/MapView';
import { RouteTimeline } from '../components/tracking/RouteTimeline';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { ETA } from '../components/shuttles/ETA';
import { ArrowLeft, Route as RouteIcon, Radio, User, Gauge, ShieldCheck, Bus, MapPin } from 'lucide-react';
import { routeService } from '../services/routeService';
import * as apiService from '../services/apiService';
import { calculateEtaBetweenCoords } from '../services/locationService';
import { computeTripProgression } from '../services/routeProgressTracker';
import { ShuttleLocation } from '../types/database';

export const LiveTrackingScreen: React.FC = () => {
  const {
    selectedTripId,
    setSelectedTripId,
    trips,
    shuttles,
    routes,
    drivers,
    stops,
    tripStops,
    routeStops: allRouteStops,
    shuttleLocations,
    studentLocation,
    selectedStopId,
    setSelectedStopId,
    etaMap,
    setCurrentScreen,
    navigateToRouteDetails,
    routeCoordinates
  } = useApp();

  const [showAllStopsOnMap, setShowAllStopsOnMap] = useState<boolean>(true);
  const [liveTripData, setLiveTripData] = useState<any | null>(null);

  // Filter ONLY currently running trips
  const runningTrips = useMemo(() => {
    return trips.filter((t) => t.running_status === 'RUNNING');
  }, [trips]);

  // Selected running trip (defaults to first running trip)
  const trip = useMemo(() => {
    return (
      runningTrips.find((t) => t.trip_id === selectedTripId) ||
      runningTrips[0] ||
      null
    );
  }, [runningTrips, selectedTripId]);

  // Ensure selectedTripId stays synced with an active running trip
  useEffect(() => {
    if (runningTrips.length > 0 && (!selectedTripId || !runningTrips.some((t) => t.trip_id === selectedTripId))) {
      setSelectedTripId(runningTrips[0].trip_id);
    }
  }, [runningTrips, selectedTripId, setSelectedTripId]);

  // Fetch real database-driven live trip details
  useEffect(() => {
    let isMounted = true;
    if (!trip?.trip_id) return;

    const fetchLive = async () => {
      try {
        const data = await apiService.getLiveTripDetails(trip.trip_id);
        if (isMounted && data) {
          const tId = data.trip_id || data.trip?.trip_id;
          if (tId) {
            setLiveTripData(data);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [trip?.trip_id]);

  const shuttle = trip ? (shuttles.find((s) => s.shuttle_id === trip.shuttle_id) || shuttles[0]) : shuttles[0];
  const route = trip ? (routes.find((r) => r.route_id === trip.route_id) || routes[0]) : routes[0];
  const driver = trip ? (drivers.find((d) => d.driver_id === trip.driver_id) || drivers[0]) : drivers[0];

  // Find next upcoming stop along route if selectedStopId not chosen
  const currentTripStops = useMemo(() => {
    if (!trip) return [];
    return tripStops.filter((ts) => ts.trip_id === trip.trip_id);
  }, [trip, tripStops]);

  const currentLoc =
    liveTripData?.latest_location ||
    liveTripData?.latestLocation ||
    shuttleLocations.find(
      (item) => item.trip_id === trip?.trip_id || item.shuttle_id === shuttle?.shuttle_id
    );

  // Ordered stops along the active route
  const orderedRouteStops = useMemo(() => {
    if (!route) return [];
    return allRouteStops
      .filter((rs) => rs.route_id === route.route_id)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => stops.find((s) => s.stop_id === rs.stop_id))
      .filter((s): s is (typeof stops)[0] => !!s);
  }, [route, allRouteStops, stops]);

  // Trip progression computed with monotonic latching (no fluctuation, no backwards flips)
  const progression = useMemo(() => {
    if (!trip || !route) {
      return {
        completedIndices: new Set<number>(),
        completedStopIds: new Set<string>(),
        activeApproachingIndex: -1,
        activeApproachingStopId: undefined,
        highestCompletedIndex: -1
      };
    }
    return computeTripProgression(
      trip.trip_id,
      trip.running_status === 'RUNNING',
      orderedRouteStops,
      currentLoc,
      tripStops
    );
  }, [trip, route, orderedRouteStops, currentLoc, tripStops]);

  const effectiveStopId = useMemo(() => {
    if (selectedStopId && currentTripStops.some((ts) => ts.stop_id === selectedStopId)) {
      return selectedStopId;
    }
    if (progression.activeApproachingStopId) {
      return progression.activeApproachingStopId;
    }
    const nextStop =
      currentTripStops.find((ts) => ts.arrival_status === 'APPROACHING') ||
      currentTripStops.find((ts) => ts.arrival_status === 'SCHEDULED') ||
      currentTripStops[0];
    return nextStop?.stop_id || stops[0]?.stop_id;
  }, [selectedStopId, currentTripStops, progression.activeApproachingStopId, stops]);

  const targetTripStop = currentTripStops.find((ts) => ts.stop_id === effectiveStopId);
  const targetStop = stops.find((s) => s.stop_id === effectiveStopId);

  const etaKey = trip ? `${trip.trip_id}_${effectiveStopId}` : '';
  const liveStopMeta = liveTripData?.stops?.find((s: any) => s.stop_id === effectiveStopId);

  const etaMinutes = useMemo(() => {
    if (targetTripStop?.arrival_status === 'COMPLETED') return 0;
    if (etaKey && etaMap[etaKey] !== undefined) return etaMap[etaKey];
    if (liveStopMeta?.theoretical_eta_minutes !== undefined) return liveStopMeta.theoretical_eta_minutes;
    if (currentLoc && targetStop) {
      return calculateEtaBetweenCoords(
        Number(currentLoc.latitude),
        Number(currentLoc.longitude),
        Number(targetStop.latitude),
        Number(targetStop.longitude),
        25
      );
    }
    return 0;
  }, [etaKey, etaMap, liveStopMeta, currentLoc, targetStop, targetTripStop]);

  // Formatted active shuttles for the map (renders ONLY running shuttles, exactly like Home page)
  const activeShuttlesForMap = useMemo(() => {
    const list: { location: ShuttleLocation; number: string; routeId: string }[] = [];
    const addedShuttleIds = new Set<string>();

    for (const t of runningTrips) {
      if (addedShuttleIds.has(t.shuttle_id)) continue;

      let loc =
        (t.trip_id === trip?.trip_id ? (liveTripData?.latest_location || liveTripData?.latestLocation) : null) ||
        shuttleLocations.find((l) => l.trip_id === t.trip_id || l.shuttle_id === t.shuttle_id);

      if (!loc) {
        const originRS = allRouteStops
          .filter((rs) => rs.route_id === t.route_id)
          .sort((a, b) => a.sequence_number - b.sequence_number)[0];
        const originStop = originRS ? stops.find((s) => s.stop_id === originRS.stop_id) : stops[0];

        if (originStop) {
          loc = {
            shuttle_id: t.shuttle_id,
            trip_id: t.trip_id,
            latitude: Number(originStop.latitude),
            longitude: Number(originStop.longitude),
            bearing: 0,
            speed_kmh: 24,
            progress_percentage: 0,
            timestamp: new Date().toISOString()
          };
        }
      }

      const s = shuttles.find((item) => item.shuttle_id === t.shuttle_id);
      if (loc && s) {
        list.push({
          location: loc,
          number: s.shuttle_number,
          routeId: t.route_id
        });
        addedShuttleIds.add(t.shuttle_id);
      }
    }

    return list;
  }, [runningTrips, trip, liveTripData, shuttleLocations, allRouteStops, stops, shuttles]);

  // Real road pathway coordinates for active route (exactly like Home page)
  const activeRoutePolyline = useMemo(() => {
    if (!route) return undefined;
    const routeId = route.route_id;

    if (routeCoordinates && routeCoordinates[routeId] && routeCoordinates[routeId].length > 0) {
      return routeCoordinates[routeId];
    }

    const rCoords = route.route_coordinates;
    if (rCoords) {
      if (Array.isArray(rCoords) && rCoords.length > 0) return rCoords;
      if (typeof rCoords === 'string') {
        try {
          const parsed = JSON.parse(rCoords);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }

    const ordered = allRouteStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => {
        const s = stops.find((st) => st.stop_id === rs.stop_id);
        return s ? ([Number(s.latitude), Number(s.longitude)] as [number, number]) : null;
      })
      .filter(Boolean) as [number, number][];

    return ordered.length > 1 ? ordered : undefined;
  }, [route, routeCoordinates, allRouteStops, stops]);

  // Stops to render on map (default to all 40 stops across Jaipur, matching Home page)
  const mapStops = useMemo(() => {
    if (showAllStopsOnMap || !route) return stops;
    const currentRouteStops = allRouteStops.filter((rs) => rs.route_id === route.route_id);
    const stopIdSet = new Set(currentRouteStops.map((rs) => rs.stop_id));
    if (effectiveStopId) stopIdSet.add(effectiveStopId);
    return stops.filter((s) => stopIdSet.has(s.stop_id));
  }, [showAllStopsOnMap, stops, allRouteStops, route, effectiveStopId]);

  // Dynamically determine passed stops for map pin checkmark indicators (latched, monotonic)
  const completedStopIds = progression.completedStopIds;

  if (!trip || runningTrips.length === 0) {
    return (
      <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
            <button
              onClick={() => setCurrentScreen('home')}
              className="group inline-flex items-center gap-2 text-stone-600 hover:text-[#121316] text-xs font-editorial font-bold tracking-wider uppercase transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>BACK TO HOME & MAP</span>
            </button>
            <span className="flex items-center gap-1.5 text-xs font-mono text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-semibold">
              <Radio className="w-3 h-3 text-stone-400" />
              <span>NO ACTIVE TRIPS</span>
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-4 shadow-subtle">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Bus className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-editorial font-extrabold text-2xl text-[#121316]">
                No Trips Currently in Transit
              </h2>
              <p className="text-sm text-stone-500 font-medium">
                There are currently no active shuttle trips running in the database. When an administrator dispatches a trip or a driver begins their route, live tracking will automatically appear here.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setCurrentScreen('home')}
                className="px-6 py-2.5 rounded-xl bg-[#E8590C] text-white font-editorial font-bold text-xs uppercase tracking-wider hover:bg-[#d04e0a] transition-all shadow-sm"
              >
                Return to Campus Map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Multi-Shuttle Switcher Bar: ONLY SHOWS RUNNING SHUTTLES */}
        <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 pl-1">
              Select Shuttle to Track:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {runningTrips.map((t) => {
                const s = shuttles.find((item) => item.shuttle_id === t.shuttle_id);
                const r = routes.find((item) => item.route_id === t.route_id);
                const isSelected = t.trip_id === trip.trip_id;

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
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Bus className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                    <span>{s?.shuttle_number || t.shuttle_id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-200/70 text-stone-600'
                      }`}
                    >
                      {r?.route_code || t.route_id}
                    </span>
                    <span className={`text-[9px] font-mono uppercase font-bold ${isSelected ? 'text-white/90' : 'text-emerald-600'}`}>
                      LIVE
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map view mode toggle: All Stops Pinned vs Active Corridor */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllStopsOnMap((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border ${
                showAllStopsOnMap
                  ? 'bg-blue-50 text-[#1E3A68] border-blue-200 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <MapPin className="w-3 h-3 text-[#E8590C]" />
              <span>{showAllStopsOnMap ? `ALL ${stops.length} STOPS PINNED` : 'ACTIVE CORRIDOR STOPS'}</span>
            </button>
          </div>
        </div>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 7 cols) - Grand Live Interactive Map (identical clean road rendering as Home page) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative">
              <MapView
                stops={mapStops}
                studentLocation={studentLocation}
                activeShuttles={activeShuttlesForMap}
                highlightRouteId={route?.route_id}
                routeCoordinates={routeCoordinates}
                activeRoutePolyline={activeRoutePolyline}
                selectedStopId={selectedStopId}
                onSelectShuttle={(shuttleTripId) => setSelectedTripId(shuttleTripId)}
                onSelectStop={(stopId) => setSelectedStopId(stopId)}
                heightClass="h-[55vh] lg:h-[620px]"
                interactive={true}
              />
            </div>

            <div className="hidden lg:flex items-center justify-between text-xs font-mono text-stone-500 px-2">
              <span>â— Tap any stop pin or vehicle marker to inspect connectivity</span>
              <span className="text-[#E8590C] font-bold">
                TRACKING {shuttle.shuttle_number} ({route.route_code})
              </span>
            </div>
          </div>

          {/* Right Column (PC: 5 cols) - Telemetry & Route Timeline */}
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
                    LIVE TRANSIT CORRIDOR • {route.route_name}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <StatusIndicator status={trip.capacity_status} size="lg" />
                    <span className="text-stone-300">•</span>
                    <span className="text-xs font-mono text-stone-500">
                      TRIP {trip.trip_id}
                    </span>
                  </div>
                </div>

                {/* Dominant Large ETA calculated uniformly at 25 km/h */}
                <div className="text-right">
                  <span className="text-[10px] font-editorial font-bold tracking-widest text-stone-400 uppercase block">
                    ETA TO {selectedStopId ? (targetStop?.stop_name ? targetStop.stop_name.replace(' (ORIGIN)', '').replace(' (TERMINUS)', '') + ' (YOUR STOP)' : 'YOUR STOP') : (targetStop?.stop_name ? targetStop.stop_name.replace(' (ORIGIN)', '').replace(' (TERMINUS)', '') + ' (NEXT STOP)' : 'NEXT STOP')} (25 KM/H)
                  </span>
                  <ETA
                    minutes={
                      liveTripData?.stops?.find((s: any) => s.stop_id === effectiveStopId)?.theoretical_eta_minutes ??
                      etaMinutes
                    }
                    size="hero"
                  />
                  {liveTripData?.stops?.find((s: any) => s.stop_id === effectiveStopId)?.remaining_road_distance_km !== undefined && (
                    <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                      {liveTripData.stops.find((s: any) => s.stop_id === effectiveStopId).remaining_road_distance_km} km road distance
                    </span>
                  )}
                </div>
              </div>

              {/* Live telemetry details */}
              {liveTripData?.latest_location && (
                <div className="p-3 bg-stone-900 text-white rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Radio className="w-3 h-3 animate-pulse" />
                      LIVE GPS FIX
                    </span>
                    <span className="text-stone-400">
                      Accuracy: ±{liveTripData.latest_location.accuracy_m || 5}m
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="bg-stone-800 p-1.5 rounded-lg">
                      <span className="text-[9px] text-stone-400 block">SPEED</span>
                      <span className="font-bold">{liveTripData.latest_location.speed_kmh} km/h</span>
                    </div>
                    <div className="bg-stone-800 p-1.5 rounded-lg">
                      <span className="text-[9px] text-stone-400 block">BEARING</span>
                      <span className="font-bold">{liveTripData.latest_location.bearing}°</span>
                    </div>
                    <div className="bg-stone-800 p-1.5 rounded-lg">
                      <span className="text-[9px] text-stone-400 block">PROGRESS</span>
                      <span className="font-bold">{liveTripData.latest_location.progress_percentage}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timing info row */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-stone-400 block text-[10px]">ESTIMATED ARRIVAL</span>
                  <span className="font-bold text-[#121316] text-sm">{targetTripStop?.estimated_arrival || 'En Route'}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">SCHEDULED TIME</span>
                  <span className="text-stone-600 text-sm">{targetTripStop?.scheduled_arrival || trip.start_time}</span>
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

            {/* Complete Vertical Route Timeline */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle">
              <RouteTimeline
                route={route}
                trip={trip}
                tripStops={tripStops}
                selectedStopId={selectedStopId}
                etaMinutes={
                  liveTripData?.stops?.find((s: any) => s.stop_id === effectiveStopId)?.theoretical_eta_minutes ??
                  etaMinutes
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
