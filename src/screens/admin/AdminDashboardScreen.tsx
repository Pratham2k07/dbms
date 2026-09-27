import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Route as RouteIcon,
  MapPin,
  Bus,
  Users,
  CalendarCheck,
  Activity,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Square,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Gauge
} from 'lucide-react';

interface AdminDashboardScreenProps {
  onOpenCreateRoute: () => void;
  onOpenCreateTrip: () => void;
  onOpenAddShuttle: () => void;
  onOpenAddDriver: () => void;
  onOpenAddStop: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onOpenCreateRoute,
  onOpenCreateTrip,
  onOpenAddShuttle,
  onOpenAddDriver,
  onOpenAddStop
}) => {
  const {
    routes,
    stops,
    shuttles,
    drivers,
    trips,
    tripStops,
    etaMap,
    setCurrentScreen,
    handleStartTrip,
    handleEndTrip,
    cancelTrip,
    setSelectedTripId,
    setSelectedRouteId
  } = useApp();

  // Compute statistics
  const totalRoutes = routes.length;
  const totalStops = stops.length;
  const totalShuttles = shuttles.length;
  const activeShuttles = shuttles.filter((s) => s.status === 'ACTIVE').length;
  const maintenanceShuttles = shuttles.filter((s) => s.status === 'MAINTENANCE').length;
  const offlineShuttles = shuttles.filter((s) => s.status === 'OFFLINE').length;
  const totalDrivers = drivers.length;

  const tripsScheduled = trips.filter((t) => t.running_status === 'SCHEDULED').length;
  const tripsRunning = trips.filter((t) => t.running_status === 'RUNNING').length;
  const tripsCompleted = trips.filter((t) => t.running_status === 'COMPLETED').length;

  const runningTrips = trips.filter((t) => t.running_status === 'RUNNING');

  // Helper to get driver name
  const getDriverName = (driverId: string) => {
    const d = drivers.find((drv) => drv.driver_id === driverId);
    return d ? d.name : driverId;
  };

  // Helper to get shuttle details
  const getShuttle = (shuttleId: string) => {
    return shuttles.find((s) => s.shuttle_id === shuttleId);
  };

  // Helper to get route details
  const getRoute = (routeId: string) => {
    return routes.find((r) => r.route_id === routeId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-[#1E3A68] via-[#2B4A7E] to-[#3B629B] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-orange-200 border border-white/20 text-xs font-mono font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>JKLU MOBILITY CONTROL CENTER</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-black tracking-tight text-white">
              Transit Operations Command
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Real-time monitoring and configuration of university shuttle routes, schedules, telemetry, and driver dispatch across Jaipur circuits.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={onOpenCreateRoute}
              className="px-3.5 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#D9480F] text-white font-editorial font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Route</span>
            </button>
            <button
              onClick={onOpenCreateTrip}
              className="px-3.5 py-2.5 rounded-xl bg-white text-[#1E3A68] hover:bg-blue-50 font-editorial font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-jklu-orange" />
              <span>+ Create Trip</span>
            </button>
            <button
              onClick={onOpenAddShuttle}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-editorial font-bold text-xs flex items-center gap-2 border border-white/25 transition-all"
            >
              <Bus className="w-3.5 h-3.5" />
              <span>+ Add Shuttle</span>
            </button>
            <button
              onClick={onOpenAddDriver}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-editorial font-bold text-xs flex items-center gap-2 border border-white/25 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Add Driver</span>
            </button>
            <button
              onClick={onOpenAddStop}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-editorial font-bold text-xs flex items-center gap-2 border border-white/25 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>+ Add Stop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 8 Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {/* Total Routes */}
        <div
          onClick={() => setCurrentScreen('admin-routes')}
          className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <RouteIcon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold text-stone-400">R-SYS</span>
          </div>
          <div className="font-editorial font-black text-2xl text-stone-900">{totalRoutes}</div>
          <div className="text-[11px] font-medium text-stone-500">Total Routes</div>
        </div>

        {/* Total Stops */}
        <div
          onClick={() => setCurrentScreen('admin-stops')}
          className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold text-stone-400">STOPS</span>
          </div>
          <div className="font-editorial font-black text-2xl text-stone-900">{totalStops}</div>
          <div className="text-[11px] font-medium text-stone-500">Total Stops</div>
        </div>

        {/* Total Shuttles */}
        <div
          onClick={() => setCurrentScreen('admin-shuttles')}
          className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <Bus className="w-4 h-4 text-stone-700 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold text-stone-400">FLEET</span>
          </div>
          <div className="font-editorial font-black text-2xl text-stone-900">{totalShuttles}</div>
          <div className="text-[11px] font-medium text-stone-500">Total Shuttles</div>
        </div>

        {/* Active Shuttles */}
        <div
          onClick={() => setCurrentScreen('admin-shuttles')}
          className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <Activity className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              LIVE
            </span>
          </div>
          <div className="font-editorial font-black text-2xl text-emerald-700">{activeShuttles}</div>
          <div className="text-[11px] font-medium text-emerald-800">Active Shuttles</div>
        </div>

        {/* Total Drivers */}
        <div
          onClick={() => setCurrentScreen('admin-drivers')}
          className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold text-stone-400">STAFF</span>
          </div>
          <div className="font-editorial font-black text-2xl text-stone-900">{totalDrivers}</div>
          <div className="text-[11px] font-medium text-stone-500">Total Drivers</div>
        </div>

        {/* Trips Scheduled */}
        <div
          onClick={() => setCurrentScreen('admin-trips')}
          className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold text-blue-400">PLAN</span>
          </div>
          <div className="font-editorial font-black text-2xl text-blue-700">{tripsScheduled}</div>
          <div className="text-[11px] font-medium text-blue-700">Scheduled</div>
        </div>

        {/* Trips Running */}
        <div
          onClick={() => setCurrentScreen('admin-live-tracking')}
          className="bg-white rounded-2xl p-4 border border-orange-200 bg-orange-50/25 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-orange-600 mb-2">
            <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="w-2 h-2 rounded-full bg-[#E8590C] animate-pulse" />
          </div>
          <div className="font-editorial font-black text-2xl text-[#E8590C]">{tripsRunning}</div>
          <div className="text-[11px] font-medium text-orange-800">Trips Running</div>
        </div>

        {/* Trips Completed */}
        <div
          onClick={() => setCurrentScreen('admin-history')}
          className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold text-stone-400">DONE</span>
          </div>
          <div className="font-editorial font-black text-2xl text-stone-800">{tripsCompleted}</div>
          <div className="text-[11px] font-medium text-stone-500">Completed</div>
        </div>
      </div>

      {/* Main Grid: Active Fleet & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: ACTIVE FLEET */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-editorial font-bold text-lg text-stone-900">
                  Active Fleet Operations
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  {runningTrips.length} Operating
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Live telemetry and real-time transit status for currently running shuttles
              </p>
            </div>

            <button
              onClick={() => setCurrentScreen('admin-live-tracking')}
              className="text-xs font-editorial font-bold text-[#2B4A7E] hover:text-[#1E3A68] flex items-center gap-1.5 group"
            >
              <span>View Full Fleet Map</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {runningTrips.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-2">
              <Bus className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-editorial font-bold text-stone-600">No active trips currently in transit.</p>
              <button
                onClick={onOpenCreateTrip}
                className="text-xs text-[#E8590C] hover:underline font-bold"
              >
                Schedule and start a trip now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-mono uppercase tracking-wider text-stone-400">
                    <th className="pb-3 font-semibold">Shuttle</th>
                    <th className="pb-3 font-semibold">Route</th>
                    <th className="pb-3 font-semibold">Driver</th>
                    <th className="pb-3 font-semibold">Status / Speed</th>
                    <th className="pb-3 font-semibold">Current/Next Stop</th>
                    <th className="pb-3 font-semibold">ETA</th>
                    <th className="pb-3 font-semibold text-right">Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {runningTrips.map((trip) => {
                    const shuttle = getShuttle(trip.shuttle_id);
                    const route = getRoute(trip.route_id);
                    const driverName = getDriverName(trip.driver_id);

                    // Find upcoming stop in tripStops
                    const tStops = tripStops.filter((ts) => ts.trip_id === trip.trip_id);
                    const nextTripStop =
                      tStops.find((ts) => ts.arrival_status === 'APPROACHING') ||
                      tStops.find((ts) => ts.arrival_status === 'SCHEDULED') ||
                      tStops[tStops.length - 1];

                    const nextStop = stops.find((s) => s.stop_id === nextTripStop?.stop_id);
                    const etaKey = `${trip.trip_id}_${nextTripStop?.stop_id}`;
                    const dynamicEta = etaMap[etaKey] || 6;

                    return (
                      <tr key={trip.trip_id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 pr-3">
                          <div className="font-editorial font-bold text-stone-900">
                            {shuttle?.shuttle_number || trip.shuttle_id}
                          </div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {shuttle?.registration_number}
                          </div>
                        </td>

                        <td className="py-3.5 pr-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono text-white shadow-xs"
                            style={{ backgroundColor: route?.color || '#2B4A7E' }}
                          >
                            {route?.route_code || trip.route_id}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3 font-medium text-stone-700">
                          {driverName}
                        </td>

                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-mono font-bold text-emerald-700">RUNNING</span>
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-stone-400" />
                            <span>{trip.speed_kmh || 38} km/h</span>
                          </div>
                        </td>

                        <td className="py-3.5 pr-3">
                          <div className="font-medium text-stone-800">
                            {nextStop?.stop_name || 'In Transit'}
                          </div>
                          <span className={`inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            trip.capacity_status === 'FULL'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {trip.capacity_status}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3 font-mono font-bold text-stone-900">
                          ~{dynamicEta} min
                        </td>

                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedTripId(trip.trip_id);
                              setSelectedRouteId(trip.route_id);
                              setCurrentScreen('admin-live-tracking');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-[11px] transition-colors"
                          >
                            Track Live
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: SYSTEM OVERVIEW */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="font-editorial font-bold text-lg text-stone-900">
              System Overview
            </h2>
            <p className="text-xs text-stone-500">
              Resource allocation and status breakdown
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-editorial font-bold text-stone-800">Running Trips</div>
                  <div className="text-[10px] text-stone-500">Active shuttles on campus routes</div>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-emerald-700">{tripsRunning}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-editorial font-bold text-stone-800">Available Shuttles</div>
                  <div className="text-[10px] text-stone-500">Active & ready for dispatch</div>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-blue-700">{activeShuttles}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-editorial font-bold text-stone-800">Maintenance Shuttles</div>
                  <div className="text-[10px] text-stone-500">Under workshop inspection</div>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-amber-700">{maintenanceShuttles}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center">
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-editorial font-bold text-stone-800">Offline Shuttles</div>
                  <div className="text-[10px] text-stone-500">Parked in depot / off-duty</div>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-stone-700">{offlineShuttles}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-editorial font-bold text-stone-800">Operating Drivers</div>
                  <div className="text-[10px] text-stone-500">Captains currently on road</div>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-indigo-700">{runningTrips.length}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-editorial font-bold text-stone-800">Upcoming Scheduled</div>
                  <div className="text-[10px] text-stone-500">Trips queued for today</div>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-orange-700">{tripsScheduled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S TRIPS TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial font-bold text-lg text-stone-900">Today's Trips Schedule</h2>
            <p className="text-xs text-stone-500">Complete list of scheduled, active, and completed shuttle runs</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateTrip}
              className="px-3.5 py-2 rounded-xl bg-[#2B4A7E] hover:bg-[#1E3A68] text-white font-editorial font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Schedule Trip</span>
            </button>
            <button
              onClick={() => setCurrentScreen('admin-trips')}
              className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-editorial font-bold text-xs"
            >
              Manage Trips
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-mono uppercase tracking-wider text-stone-400">
                <th className="pb-3 font-semibold">Trip ID</th>
                <th className="pb-3 font-semibold">Route</th>
                <th className="pb-3 font-semibold">Shuttle</th>
                <th className="pb-3 font-semibold">Driver</th>
                <th className="pb-3 font-semibold">Start Time</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Quick Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {trips.slice(0, 6).map((trip) => {
                const shuttle = getShuttle(trip.shuttle_id);
                const route = getRoute(trip.route_id);
                const driverName = getDriverName(trip.driver_id);

                return (
                  <tr key={trip.trip_id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 font-mono font-bold text-stone-800">{trip.trip_id}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white"
                          style={{ backgroundColor: route?.color || '#2B4A7E' }}
                        >
                          {route?.route_code}
                        </span>
                        <span className="font-medium text-stone-700 truncate max-w-[140px] sm:max-w-xs">
                          {route?.route_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-stone-700">
                      {shuttle?.shuttle_number || trip.shuttle_id}
                    </td>
                    <td className="py-3 text-stone-600">{driverName}</td>
                    <td className="py-3 font-mono text-stone-700">{trip.start_time}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          trip.running_status === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trip.running_status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : trip.running_status === 'COMPLETED'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {trip.running_status === 'RUNNING' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {trip.running_status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {trip.running_status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStartTrip(trip.trip_id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-editorial font-bold text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </button>
                      )}
                      {trip.running_status === 'RUNNING' && (
                        <button
                          onClick={() => handleEndTrip(trip.trip_id)}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white font-editorial font-bold text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <Square className="w-3 h-3" />
                          <span>End</span>
                        </button>
                      )}
                      {trip.running_status === 'COMPLETED' && (
                        <span className="text-[11px] text-stone-400 font-mono">Archived</span>
                      )}
                      {trip.running_status === 'CANCELLED' && (
                        <span className="text-[11px] text-red-400 font-mono">Cancelled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
