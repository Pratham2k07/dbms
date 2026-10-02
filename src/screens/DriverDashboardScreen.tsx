import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/common/StatusIndicator';
import {
  Play,
  Square,
  Users,
  CheckCircle2,
  Shield,
  Radio,
  Bell,
  X,
  MapPin,
  Clock,
  Bus,
  AlertTriangle,
  ArrowRight,
  Eye,
  Check,
  RotateCcw,
  Ban
} from 'lucide-react';
import { DriverNotification, Route, Trip } from '../types/database';

export const DriverDashboardScreen: React.FC = () => {
  const {
    driver,
    trips,
    shuttles,
    routes,
    stops,
    routeStops,
    driverNotifications,
    handleStartTrip,
    handleEndTrip,
    handleToggleCapacity,
    cancelTrip,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();

  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [viewingRouteDetails, setViewingRouteDetails] = useState<Route | null>(null);
  const [selectedTripIdOverride, setSelectedTripIdOverride] = useState<string | null>(null);

  // 1. Filter trips strictly assigned to this logged-in driver
  const assignedTrips = useMemo(() => {
    return trips.filter((t) => t.driver_id === driver.driver_id);
  }, [trips, driver.driver_id]);

  // 2. Filter notifications strictly for this driver
  const driverNotifs = useMemo(() => {
    return driverNotifications
      .filter((n) => n.recipient_driver_id === driver.driver_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [driverNotifications, driver.driver_id]);

  const unreadCount = useMemo(() => {
    return driverNotifs.filter((n) => !n.read_status).length;
  }, [driverNotifs]);

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'UNREAD') {
      return driverNotifs.filter((n) => !n.read_status);
    }
    return driverNotifs;
  }, [driverNotifs, notificationFilter]);

  // Determine currently active or selected trip
  const activeTrip: Trip | undefined = useMemo(() => {
    if (selectedTripIdOverride) {
      const match = assignedTrips.find((t) => t.trip_id === selectedTripIdOverride);
      if (match) return match;
    }
    // Prefer running trip, then scheduled trip, then first assigned trip
    const running = assignedTrips.find((t) => t.running_status === 'RUNNING');
    if (running) return running;
    const scheduled = assignedTrips.find((t) => t.running_status === 'SCHEDULED');
    if (scheduled) return scheduled;
    return assignedTrips[0];
  }, [assignedTrips, selectedTripIdOverride]);

  const assignedShuttle = shuttles.find((s) => s.shuttle_id === activeTrip?.shuttle_id);
  const assignedRoute = routes.find((r) => r.route_id === activeTrip?.route_id);

  const isRunning = activeTrip?.running_status === 'RUNNING';
  const isScheduled = activeTrip?.running_status === 'SCHEDULED';
  const isCompleted = activeTrip?.running_status === 'COMPLETED';
  const isCancelled = activeTrip?.running_status === 'CANCELLED';
  const isFull = activeTrip?.capacity_status === 'FULL';

  // Helper to get stops for a route in exact sequence
  const getOrderedStopsForRoute = (routeId: string) => {
    return routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => {
        const stop = stops.find((s) => s.stop_id === rs.stop_id);
        return {
          sequence: rs.sequence_number,
          stop_id: rs.stop_id,
          stop_name: stop?.stop_name || rs.stop_id,
          description: stop?.description || ''
        };
      });
  };

  const handleOpenRouteDetails = (route: Route) => {
    setViewingRouteDetails(route);
  };

  const handleNotificationClick = (notif: DriverNotification) => {
    markNotificationAsRead(notif.notification_id);
    if (notif.related_route_id) {
      const r = routes.find((rt) => rt.route_id === notif.related_route_id);
      if (r) {
        setViewingRouteDetails(r);
      }
    }
  };

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 lg:pt-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <div>
            <span className="font-editorial font-bold text-xs tracking-widest text-jklu-orange uppercase">
              JKLU MOBILITY OPERATIONS
            </span>
            <h1 className="font-editorial font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#121316] tracking-tight leading-none uppercase">
              DRIVER DASHBOARD
            </h1>
          </div>

          {/* Top Right: Notification Bell Button with Unread Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNotificationPanelOpen(true)}
              className="relative p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 shadow-sm flex items-center gap-2 transition-all active:scale-95 group"
              aria-label="Dispatch Notifications"
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-stone-700 group-hover:text-jklu-orange transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-editorial font-bold text-xs text-stone-700 group-hover:text-[#121316]">
                Dispatch Alerts
              </span>
            </button>
          </div>
        </div>

        {/* Dual Column Layout on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 6 cols) - Authenticated Driver & Current Assignment */}
          <div className="lg:col-span-6 space-y-5">
            {/* Driver Profile Badge */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                  AUTHENTICATED OPERATOR
                </span>
                <h3 className="font-editorial font-bold text-xl text-[#121316] mt-0.5">
                  {driver.name}
                </h3>
                <p className="text-xs font-mono text-stone-500 mt-1">
                  License: {driver.license_no} • Driver ID: <strong className="text-stone-800">{driver.driver_id}</strong>
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-Time Database Sync Active
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-jklu-orange flex items-center justify-center font-bold text-sm font-mono shadow-xs">
                DRV
              </div>
            </div>

            {/* Assigned Trips Selector (if driver has multiple assignments) */}
            {assignedTrips.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                  Your Assigned Trips ({assignedTrips.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {assignedTrips.map((t) => {
                    const isSelected = activeTrip?.trip_id === t.trip_id;
                    const r = routes.find((rt) => rt.route_id === t.route_id);
                    return (
                      <button
                        key={t.trip_id}
                        onClick={() => setSelectedTripIdOverride(t.trip_id)}
                        className={`px-3 py-2 rounded-xl text-xs font-editorial font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#121316] text-white border-[#121316] shadow-sm'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{t.trip_id}</span>
                        <span className="text-[10px] font-mono opacity-80">({r?.route_code || t.route_id})</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.running_status === 'RUNNING'
                              ? 'bg-emerald-400 animate-ping'
                              : t.running_status === 'CANCELLED'
                              ? 'bg-red-400'
                              : 'bg-stone-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Assignment Section or Empty State */}
            {activeTrip && assignedRoute && assignedShuttle ? (
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-stone-400 uppercase">
                    ACTIVE ROSTER ASSIGNMENT
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase ${
                        isRunning
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : isCancelled
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : isCompleted
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {activeTrip.running_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">TRIP CODE</span>
                    <p className="font-mono font-bold text-lg text-[#121316]">
                      {activeTrip.trip_id}
                    </p>
                    <span className="text-[11px] font-mono text-stone-500">
                      Departs: {activeTrip.start_time}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">ASSIGNED SHUTTLE</span>
                    <p className="font-editorial font-bold text-lg text-[#121316]">
                      {assignedShuttle.shuttle_number}
                    </p>
                    <span className="text-[11px] font-mono text-stone-500">
                      Reg: {assignedShuttle.registration_number}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">OPERATIONAL CORRIDOR</span>
                    <button
                      onClick={() => handleOpenRouteDetails(assignedRoute)}
                      className="text-xs text-jklu-orange hover:underline font-editorial font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Route Stops ({getOrderedStopsForRoute(assignedRoute.route_id).length})</span>
                    </button>
                  </div>
                  <p className="font-editorial font-bold text-lg text-jklu-orange">
                    {assignedRoute.route_code} — {assignedRoute.route_name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {assignedRoute.description}
                  </p>
                </div>

                {/* Ordered Stops Quick Preview */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                    Assigned Stops Circuit
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-editorial">
                    {getOrderedStopsForRoute(assignedRoute.route_id).map((s, idx, arr) => (
                      <div key={s.stop_id} className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-1 rounded-lg bg-stone-100 text-stone-800 text-[11px] font-semibold border border-stone-200">
                          {idx + 1}. {s.stop_name}
                        </span>
                        {idx < arr.length - 1 && <span className="text-stone-300 font-bold">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state if driver has no assigned trips */
              <div className="p-8 rounded-3xl bg-white border border-dashed border-stone-300 text-center space-y-3 shadow-subtle">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                  <Bus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-editorial font-bold text-base text-stone-800">
                    No Active Route Assignment
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    You currently have no scheduled trips. When the Admin Dispatch assigns a new route or trip to Captain {driver.name}, it will immediately sync to this screen.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (PC: 6 cols) - Controls & Telemetry */}
          <div className="lg:col-span-6 space-y-5">
            {/* Trip Operations & Status Card */}
            {activeTrip && (
              <div className="p-6 rounded-3xl bg-[#121316] text-[#FBFBF9] shadow-float space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                    TRIP RUNNING STATUS
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isRunning
                          ? 'bg-emerald-500 animate-ping'
                          : isCancelled
                          ? 'bg-red-500'
                          : isCompleted
                          ? 'bg-blue-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      {activeTrip.running_status}
                    </span>
                  </div>
                </div>

                {/* Action Buttons based on lifecycle status */}
                {isRunning ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 uppercase block">
                          ACTIVE TRIP TELEMETRY
                        </span>
                        <span className="font-editorial font-bold text-base text-white">
                          TRIP IN PROGRESS
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-emerald-400 block">
                          Live GPS Broadcast: ON
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          Speed: ~24 km/h
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEndTrip(activeTrip.trip_id)}
                        className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-editorial font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>END TRIP AT CAMPUS</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to cancel Trip ${activeTrip.trip_id}? Students will be notified.`)) {
                            cancelTrip(activeTrip.trip_id);
                          }
                        }}
                        className="py-3.5 px-4 rounded-2xl bg-red-600/80 hover:bg-red-600 text-white font-editorial font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-98"
                      >
                        <Ban className="w-4 h-4" />
                        <span>CANCEL TRIP</span>
                      </button>
                    </div>
                  </div>
                ) : isScheduled ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStartTrip(activeTrip.trip_id)}
                      className="w-full py-4 px-5 rounded-2xl bg-jklu-orange hover:bg-orange-600 text-white font-editorial font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>START TRIP (COMMENCE RUN)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Cancel Trip ${activeTrip.trip_id}?`)) {
                          cancelTrip(activeTrip.trip_id);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl text-stone-400 hover:text-red-400 text-xs font-mono transition-colors"
                    >
                      Report Cancellation / Delay
                    </button>
                  </div>
                ) : isCompleted ? (
                  <div className="p-4 rounded-2xl bg-blue-900/30 border border-blue-700/50 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto" />
                    <div className="font-editorial font-bold text-sm text-white">
                      Trip Successfully Completed
                    </div>
                    <p className="text-xs font-mono text-stone-400">
                      All stops logged at JKLU Campus. Awaiting next dispatch.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-900/30 border border-red-700/50 text-center space-y-2">
                    <Ban className="w-8 h-8 text-red-400 mx-auto" />
                    <div className="font-editorial font-bold text-sm text-white">
                      Trip Cancelled by Dispatch
                    </div>
                    <p className="text-xs font-mono text-stone-400">
                      This assignment was cancelled. Check dispatch alerts for updates.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Capacity Management Card */}
            {activeTrip && assignedShuttle && (
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-stone-400 uppercase block">
                      CAPACITY AVAILABILITY TOGGLE
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusIndicator status={activeTrip.capacity_status} size="lg" />
                      <span className="text-xs font-mono text-stone-500">
                        (Capacity: {assignedShuttle.capacity} seats)
                      </span>
                    </div>
                  </div>

                  <Users className="w-6 h-6 text-stone-400" />
                </div>

                <button
                  onClick={() => handleToggleCapacity(activeTrip.trip_id)}
                  disabled={!isRunning}
                  className={`w-full py-3.5 px-4 rounded-2xl font-editorial font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 border ${
                    !isRunning
                      ? 'opacity-50 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                      : isFull
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                  }`}
                >
                  {isFull ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>MARK AS AVAILABLE (SEATS OPEN)</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-red-600" />
                      <span>MARK AS FULL (NO VACANCY)</span>
                    </>
                  )}
                </button>
                {!isRunning && (
                  <p className="text-[10px] font-mono text-stone-400 text-center">
                    Capacity toggle active while trip is in RUNNING status.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= SLIDE-OUT NOTIFICATION DRAWER ================= */}
      {isNotificationPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-slideInRight">
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-jklu-orange flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial font-bold text-base text-stone-900 leading-tight">
                    Dispatch Notifications
                  </h3>
                  <p className="text-[11px] font-mono text-stone-500">
                    Captain {driver.name} • {unreadCount} unread
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNotificationPanelOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                aria-label="Close Notification Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader: Filter & Mark Read */}
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setNotificationFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-editorial font-bold transition-colors ${
                    notificationFilter === 'ALL'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All ({driverNotifs.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('UNREAD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-editorial font-bold transition-colors ${
                    notificationFilter === 'UNREAD'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead(driver.driver_id)}
                  className="text-xs font-editorial font-bold text-jklu-orange hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center space-y-2 text-stone-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60" />
                  <p className="font-editorial font-bold text-sm text-stone-700">
                    All caught up!
                  </p>
                  <p className="text-xs font-mono">
                    No {notificationFilter === 'UNREAD' ? 'unread' : ''} dispatch notifications.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      notif.read_status
                        ? 'bg-stone-50/70 border-stone-200 text-stone-600'
                        : 'bg-orange-50/50 border-orange-200 shadow-2xs text-stone-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              notif.type === 'ASSIGNMENT_NEW'
                                ? 'bg-emerald-100 text-emerald-800'
                                : notif.type === 'ASSIGNMENT_REMOVED'
                                ? 'bg-amber-100 text-amber-800'
                                : notif.type === 'TRIP_CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {notif.type.replace('_', ' ')}
                          </span>
                          {!notif.read_status && (
                            <span className="w-2 h-2 rounded-full bg-jklu-orange" />
                          )}
                        </div>
                        <h4 className="font-editorial font-bold text-sm text-stone-900 pt-1">
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.stops_preview && notif.stops_preview.length > 0 && (
                      <div className="pt-1 text-[11px] font-mono text-stone-500 truncate">
                        Stops: {notif.stops_preview.join(' → ')}
                      </div>
                    )}

                    {notif.related_route_id && (
                      <div className="pt-2 flex items-center justify-between text-xs font-editorial font-bold text-jklu-orange">
                        <span>View Route Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ROUTE & STOPS DETAILS MODAL ================= */}
      {viewingRouteDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-stone-200 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-jklu-orange font-bold uppercase tracking-wider block">
                  ROUTE SPECIFICATIONS
                </span>
                <h3 className="font-editorial font-bold text-xl text-stone-900">
                  {viewingRouteDetails.route_code} — {viewingRouteDetails.route_name}
                </h3>
              </div>
              <button
                onClick={() => setViewingRouteDetails(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              {viewingRouteDetails.description}
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase font-bold text-stone-400 block">
                Ordered Stops in Circuit ({getOrderedStopsForRoute(viewingRouteDetails.route_id).length})
              </span>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {getOrderedStopsForRoute(viewingRouteDetails.route_id).map((s, idx) => (
                  <div
                    key={s.stop_id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3 text-xs"
                  >
                    <span className="w-6 h-6 rounded-lg bg-white border border-stone-200 font-mono font-bold text-[11px] text-stone-800 flex items-center justify-center shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="truncate">
                      <div className="font-editorial font-bold text-stone-900 truncate">
                        {s.stop_name}
                      </div>
                      <div className="text-[10px] font-mono text-stone-400 truncate">
                        {s.description || s.stop_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setViewingRouteDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-editorial font-bold text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
