import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../../components/map/MapView';
import {
  Radio,
  Bus,
  Gauge,
  MapPin,
  Clock,
  Users,
  Shield,
  X,
  Play,
  Square,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const AdminLiveTrackingScreen: React.FC = () => {
  const {
    shuttles,
    routes,
    trips,
    drivers,
    stops,
    tripStops,
    shuttleLocations,
    etaMap,
    selectedTripId,
    setSelectedTripId,
    selectedRouteId,
    setSelectedRouteId,
    handleEndTrip,
    handleToggleCapacity,
    updateTripStopArrivalStatus
  } = useApp();

  const [activeRouteFilter, setActiveRouteFilter] = useState<string>('ALL');
  const [activeTelemetryTripId, setActiveTelemetryTripId] = useState<string | null>(selectedTripId || 'TRIP-101');
  const [viewMode, setViewMode] = useState<'single' | 'fleet'>('single');

  // Filter running trips
  const runningTrips = trips.filter((t) => t.running_status === 'RUNNING');

  // Selected trip telemetry info
  const selectedTrip = trips.find((t) => t.trip_id === activeTelemetryTripId) || runningTrips[0];
  const selectedShuttle = shuttles.find((s) => s.shuttle_id === selectedTrip?.shuttle_id);

  // Prepare active shuttles for MapView - strictly 1 shuttle in single mode, or all in fleet mode
  const mapActiveShuttles = useMemo(() => {
    if (viewMode === 'single' && selectedTrip) {
      const loc = shuttleLocations.find((sl) => sl.shuttle_id === selectedTrip.shuttle_id || sl.trip_id === selectedTrip.trip_id);
      if (!loc) return [];
      return [
        {
          location: loc,
          number: selectedShuttle?.shuttle_number || selectedTrip.shuttle_id,
          routeId: selectedTrip.route_id
        }
      ];
    }

    return runningTrips
      .map((trip) => {
        const loc = shuttleLocations.find((sl) => sl.shuttle_id === trip.shuttle_id || sl.trip_id === trip.trip_id);
        const sht = shuttles.find((s) => s.shuttle_id === trip.shuttle_id);
        if (!loc) return null;

        // Filter by route if selected
        if (activeRouteFilter !== 'ALL' && trip.route_id !== activeRouteFilter) return null;

        return {
          location: loc,
          number: sht?.shuttle_number || trip.shuttle_id,
          routeId: trip.route_id
        };
      })
      .filter(Boolean) as { location: any; number: string; routeId: string }[];
  }, [viewMode, selectedTrip, selectedShuttle, shuttleLocations, runningTrips, activeRouteFilter]);

  // Selected trip telemetry info
  const selectedRoute = routes.find((r) => r.route_id === selectedTrip?.route_id);
  const selectedDriver = drivers.find((d) => d.driver_id === selectedTrip?.driver_id);
  const selectedLocation = shuttleLocations.find((sl) => sl.trip_id === selectedTrip?.trip_id || sl.shuttle_id === selectedTrip?.shuttle_id);

  // Associated trip stops
  const associatedTripStops = selectedTrip ? tripStops.filter((ts) => ts.trip_id === selectedTrip.trip_id) : [];
  const nextTripStop =
    associatedTripStops.find((ts) => ts.arrival_status === 'APPROACHING') ||
    associatedTripStops.find((ts) => ts.arrival_status === 'SCHEDULED') ||
    associatedTripStops[associatedTripStops.length - 1];

  const currentPassedStop =
    [...associatedTripStops].reverse().find((ts) => ts.arrival_status === 'COMPLETED') || associatedTripStops[0];

  const currentStopName = stops.find((s) => s.stop_id === currentPassedStop?.stop_id)?.stop_name || 'JKLU Origin';
  const nextStopName = stops.find((s) => s.stop_id === nextTripStop?.stop_id)?.stop_name || 'En Route';

  const etaKey = `${selectedTrip?.trip_id}_${nextTripStop?.stop_id}`;
  const dynamicEta = etaMap[etaKey] || 4;

  const handleShuttleMarkerClick = (tripId: string) => {
    setActiveTelemetryTripId(tripId);
    setSelectedTripId(tripId);
    const tr = trips.find((t) => t.trip_id === tripId);
    if (tr) setSelectedRouteId(tr.route_id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1920px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Live Fleet GPS & Telemetry Tracking
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Real-time multi-shuttle GPS positioning on high-resolution Google Maps, speed gauges, and persistent telemetry panel.
          </p>
        </div>

        {/* Route Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveRouteFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-editorial font-bold transition-all ${
              activeRouteFilter === 'ALL'
                ? 'bg-[#2B4A7E] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Active ({runningTrips.length})
          </button>
          {routes.map((r) => {
            const count = runningTrips.filter((t) => t.route_id === r.route_id).length;
            return (
              <button
                key={r.route_id}
                onClick={() => setActiveRouteFilter(r.route_id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeRouteFilter === r.route_id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span>{r.route_code} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Shuttle Focus Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] uppercase font-mono font-bold text-stone-400 shrink-0">
          Focus Vehicle:
        </span>
        {runningTrips.map((trip) => {
          const s = shuttles.find((item) => item.shuttle_id === trip.shuttle_id);
          const isSelected = selectedTrip?.trip_id === trip.trip_id;

          return (
            <button
              key={trip.trip_id}
              onClick={() => handleShuttleMarkerClick(trip.trip_id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-editorial font-bold flex items-center gap-2 border transition-all shrink-0 ${
                isSelected
                  ? 'bg-white border-[#E8590C] text-[#E8590C] shadow-md ring-2 ring-[#E8590C]/20'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>{s?.shuttle_number || trip.shuttle_id}</span>
              <span className="font-mono text-[10px] text-stone-400">({trip.trip_id})</span>
            </button>
          );
        })}
      </div>

      {/* Main Map + Integrated Telemetry Panel View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Resolution Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="font-editorial font-bold text-stone-800">
                GPS Coordinate Telemetry Feed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-stone-400 hidden sm:inline">
                View Mode:
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                    viewMode === 'single'
                      ? 'bg-white text-[#E8590C] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  1 Shuttle
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('fleet')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                    viewMode === 'fleet'
                      ? 'bg-white text-[#2B4A7E] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  All Fleet
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
            <MapView
              stops={stops}
              activeShuttles={mapActiveShuttles}
              highlightRouteId={selectedTrip?.route_id || 'ROUTE-01'}
              onSelectShuttle={handleShuttleMarkerClick}
              heightClass="h-[480px] sm:h-[540px]"
              zoomLevel={13}
            />
          </div>
        </div>

        {/* Right 1 Col: Integrated Persistent Telemetry Panel */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-5">
          {selectedTrip ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-editorial font-black bg-[#1E3A68] text-white">
                      {selectedShuttle?.shuttle_number || selectedTrip.shuttle_id}
                    </span>
                    <span className="font-mono text-xs text-stone-400">
                      {selectedTrip.trip_id}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    RUNNING
                  </span>
                </div>

                <div className="font-editorial font-bold text-base text-stone-900 pt-1">
                  {selectedRoute?.route_name}
                </div>
                <div className="text-xs text-stone-500">
                  Vehicle Reg: {selectedShuttle?.registration_number} • Capacity: {selectedShuttle?.capacity} Seats
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-mono mb-1">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>CURRENT SPEED</span>
                  </div>
                  <div className="font-mono font-black text-xl text-stone-900">
                    {selectedTrip.speed_kmh || 38} <span className="text-xs font-normal text-stone-500">km/h</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-mono mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ETA TO NEXT</span>
                  </div>
                  <div className="font-mono font-black text-xl text-[#E8590C]">
                    ~{dynamicEta} <span className="text-xs font-normal text-stone-500">min</span>
                  </div>
                </div>
              </div>

              {/* Waypoint Info */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 block uppercase">Last Passed Stop</span>
                    <span className="font-medium text-stone-800">{currentStopName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-blue-100/80">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 block uppercase">Next Approaching Stop</span>
                    <span className="font-bold text-stone-900">{nextStopName}</span>
                  </div>
                </div>
              </div>

              {/* Driver & Capacity Controls */}
              <div className="space-y-3 text-xs pt-1">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-editorial font-bold text-stone-800">{selectedDriver?.name}</div>
                      <div className="text-[10px] font-mono text-stone-400">{selectedDriver?.phone_number}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border text-stone-600">
                    Staff
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <span className="font-editorial font-bold text-stone-700">Capacity State:</span>
                  <button
                    onClick={() => handleToggleCapacity(selectedTrip.trip_id)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      selectedTrip.capacity_status === 'FULL'
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {selectedTrip.capacity_status}
                  </button>
                </div>
              </div>

              {/* Operations Footer */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                {nextTripStop && nextTripStop.arrival_status !== 'COMPLETED' && (
                  <button
                    onClick={() =>
                      updateTripStopArrivalStatus(selectedTrip.trip_id, nextTripStop.stop_id, 'COMPLETED')
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Advance Past {nextStopName}</span>
                  </button>
                )}

                <button
                  onClick={() => handleEndTrip(selectedTrip.trip_id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-[#E8590C] hover:text-white font-editorial font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Complete Trip at Terminus</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 space-y-2 text-stone-400">
              <Bus className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-xs font-editorial font-bold">No active trip selected</p>
              <p className="text-[11px]">Click a shuttle icon on the map to inspect telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
