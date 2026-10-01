import React, { useMemo, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/map/MapView';
import { NearbyStopList } from '../components/stops/NearbyStopList';
import { locationService } from '../services/locationService';
import { stopService } from '../services/stopService';
import { MapPin, Compass, Bus } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    student,
    studentLocation,
    stops,
    trips,
    tripStops,
    routeStops,
    shuttleLocations,
    shuttles,
    routes,
    etaMap,
    navigateToLiveTracking,
    selectedStopId,
    setSelectedStopId
  } = useApp();

  // Inline stop selection on Home & Map (toggles dropdown box inside the stop item)
  const [inlineSelectedStopId, setInlineSelectedStopId] = useState<string | null>(null);

  // Single active shuttle selection (ensures only 1 shuttle is rendered on the map at any time)
  const [selectedShuttleId, setSelectedShuttleId] = useState<string>(() => {
    const running = trips.find((t) => t.running_status === 'RUNNING');
    return running ? running.shuttle_id : (shuttles[0]?.shuttle_id || 'SHT-01');
  });

  const handleSelectStop = (stopId: string) => {
    if (inlineSelectedStopId === stopId) {
      setInlineSelectedStopId(null);
    } else {
      setInlineSelectedStopId(stopId);
      setSelectedStopId(stopId);
    }
  };

  // 1. Calculate approaching shuttle counts across stops
  const approachingCounts = useMemo(() => {
    return stopService.getApproachingCounts(trips, tripStops);
  }, [trips, tripStops]);

  // 2. Sort stops dynamically by geographic distance from student location
  const nearbyStops = useMemo(() => {
    return locationService.calculateNearbyStops(
      studentLocation,
      stops,
      approachingCounts
    );
  }, [studentLocation, stops, approachingCounts]);

  // 3. Active running trips to cross-reference
  const runningTrips = useMemo(() => {
    return trips.filter((t) => t.running_status === 'RUNNING');
  }, [trips]);

  // Find the trip assigned to the currently selected 1 shuttle
  const activeTripForSelectedShuttle = useMemo(() => {
    return (
      trips.find((t) => t.shuttle_id === selectedShuttleId && t.running_status === 'RUNNING') ||
      trips.find((t) => t.shuttle_id === selectedShuttleId) ||
      trips[0]
    );
  }, [trips, selectedShuttleId]);

  const activeRouteForSelectedShuttle = useMemo(() => {
    return (
      routes.find((r) => r.route_id === activeTripForSelectedShuttle?.route_id) || routes[0]
    );
  }, [routes, activeTripForSelectedShuttle]);

  // 4. Format active shuttle for map rendering - STRICTLY 1 SHUTTLE AT A TIME
  const activeShuttlesForMap = useMemo(() => {
    const loc = shuttleLocations.find(
      (l) =>
        l.shuttle_id === selectedShuttleId ||
        (activeTripForSelectedShuttle && l.trip_id === activeTripForSelectedShuttle.trip_id)
    );
    const shuttle = shuttles.find((s) => s.shuttle_id === selectedShuttleId);
    if (!loc || !shuttle) return [];
    return [
      {
        location: loc,
        number: shuttle.shuttle_number,
        routeId: activeTripForSelectedShuttle ? activeTripForSelectedShuttle.route_id : 'ROUTE-01'
      }
    ];
  }, [shuttleLocations, selectedShuttleId, activeTripForSelectedShuttle, shuttles]);

  // 5. Filter map stops to this 1 shuttle's active route corridor (+ selected stop),
  // preventing 40 cluttered pins across Jaipur while keeping clean focus on 1 shuttle
  const stopsForMap = useMemo(() => {
    if (!activeTripForSelectedShuttle) return stops;
    const currentRouteStops = routeStops.filter(
      (rs) => rs.route_id === activeTripForSelectedShuttle.route_id
    );
    const stopIdSet = new Set(currentRouteStops.map((rs) => rs.stop_id));
    if (selectedStopId) stopIdSet.add(selectedStopId);
    return stops.filter((s) => stopIdSet.has(s.stop_id));
  }, [stops, routeStops, activeTripForSelectedShuttle, selectedStopId]);

  // 6. Retrieve upcoming shuttles for any stop
  const getUpcomingShuttlesForStop = useCallback((stopId: string) => {
    return stopService.getUpcomingShuttles(
      stopId,
      trips,
      tripStops,
      shuttles,
      routes,
      shuttleLocations,
      etaMap
    );
  }, [trips, tripStops, shuttles, routes, shuttleLocations, etaMap]);

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-4 select-none">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 lg:pt-6 space-y-5">
        {/* Top Greeting & Operational Summary Bar */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <h1 className="font-editorial font-extrabold text-3xl sm:text-4xl text-[#121316] tracking-tight leading-tight">
              Good morning, {student.name.split(' ')[0]}.
            </h1>
          </div>

          {/* Quick Metrics (Desktop Enhanced) */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-jklu-orange flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">ACTIVE FLEET</span>
                <span className="font-editorial font-bold text-sm text-[#121316]">{activeShuttlesForMap.length} Shuttles Running</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Compass className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">DESTINATION</span>
                <span className="font-editorial font-bold text-sm text-[#121316]">JKLU Campus</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Column Layout on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 7 cols) - Interactive Map */}
          <div className="lg:col-span-7 space-y-4">
            {/* Current Location Badge (Desktop/Mobile responsive) */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-editorial font-bold tracking-wider text-stone-400 uppercase block">
                  YOUR CURRENT LOCATION
                </span>
                <div className="flex items-center gap-2 font-editorial font-bold text-base text-[#121316]">
                  <MapPin className="w-4 h-4 text-jklu-orange" />
                  <span>{studentLocation.location_name}</span>
                </div>
                <span className="text-[11px] font-mono text-stone-400 block">
                  Last updated just now • Signal Accurate (±3m)
                </span>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
                ● GPS ACTIVE
              </div>
            </div>

            {/* Map Section with 1-Shuttle at a time Focus */}
            <div className="space-y-2">
              {/* Single Shuttle Selector Bar */}
              <div className="bg-white p-2.5 rounded-2xl border border-stone-200/90 shadow-subtle flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 pl-1">
                    Track Shuttle:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {shuttles.map((sht) => {
                      const isSelected = selectedShuttleId === sht.shuttle_id;
                      const hasRunningTrip = runningTrips.some((rt) => rt.shuttle_id === sht.shuttle_id);
                      return (
                        <button
                          key={sht.shuttle_id}
                          type="button"
                          onClick={() => setSelectedShuttleId(sht.shuttle_id)}
                          className={`px-3 py-1 rounded-xl text-xs font-editorial font-bold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-[#E8590C] text-white shadow-sm ring-2 ring-[#E8590C]/25'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : hasRunningTrip
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-stone-300'
                            }`}
                          />
                          <span>{sht.shuttle_number}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 font-semibold flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>1 ACTIVE SHUTTLE DISPLAYED</span>
                </div>
              </div>

              {/* Map displaying only the selected shuttle */}
              <MapView
                stops={stopsForMap}
                studentLocation={studentLocation}
                activeShuttles={activeShuttlesForMap}
                highlightRouteId={activeTripForSelectedShuttle?.route_id || 'ROUTE-02'}
                selectedStopId={selectedStopId}
                onSelectStop={(stopId) => handleSelectStop(stopId)}
                onSelectShuttle={(tripId) => {
                  const t = trips.find((item) => item.trip_id === tripId);
                  if (t) setSelectedShuttleId(t.shuttle_id);
                  navigateToLiveTracking(tripId);
                }}
                heightClass="h-72 sm:h-80 lg:h-[400px] xl:h-[430px]"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 px-1 pt-0.5">
                <span>● Tap stop pin or shuttle icon to view live telemetry</span>
                <span className="text-stone-700 font-medium">
                  Showing: <strong className="text-[#E8590C]">{shuttles.find((s) => s.shuttle_id === selectedShuttleId)?.shuttle_number || 'SHUTTLE 01'}</strong> ({activeRouteForSelectedShuttle.route_code})
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (PC: 5 cols) - Ordered Nearby Stops List with Dropdown Boxes */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 shadow-subtle p-3 sm:p-4 flex flex-col lg:h-[545px] xl:h-[575px] overflow-hidden">
            <NearbyStopList
              stops={nearbyStops}
              selectedStopId={inlineSelectedStopId}
              onSelectStop={handleSelectStop}
              getUpcomingShuttles={getUpcomingShuttlesForStop}
              onTrackShuttle={(tripId) => {
                const t = trips.find((item) => item.trip_id === tripId);
                if (t) setSelectedShuttleId(t.shuttle_id);
                navigateToLiveTracking(tripId);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
