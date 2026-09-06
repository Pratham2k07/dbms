import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { Play, Square, Users, CheckCircle2, Shield, Radio } from 'lucide-react';

export const DriverDashboardScreen: React.FC = () => {
  const {
    driver,
    trips,
    shuttles,
    routes,
    handleStartTrip,
    handleEndTrip,
    handleToggleCapacity
  } = useApp();

  // Ramesh Kumar is assigned to Shuttle 01 / Trip 101
  const assignedTrip = trips.find((t) => t.trip_id === 'TRIP-101') || trips[0];
  const assignedShuttle = shuttles.find((s) => s.shuttle_id === assignedTrip.shuttle_id) || shuttles[0];
  const assignedRoute = routes.find((r) => r.route_id === assignedTrip.route_id) || routes[0];

  const isRunning = assignedTrip.running_status === 'RUNNING';
  const isFull = assignedTrip.capacity_status === 'FULL';

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <div>
            <span className="font-editorial font-bold text-xs tracking-widest text-jklu-orange uppercase">
              JKLU SHUTTLE
            </span>
            <h1 className="font-editorial font-extrabold text-3xl sm:text-4xl text-[#121316] tracking-tight leading-none uppercase">
              DRIVER DASHBOARD
            </h1>
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
                  License: {driver.license_no} • Operator ID: {driver.driver_id}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-[#121316] font-bold text-sm font-mono border border-stone-200">
                DRV
              </div>
            </div>

            {/* Current Assignment Section */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-[10px] font-mono font-bold tracking-widest text-stone-400 uppercase">
                  ACTIVE ROSTER ASSIGNMENT
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ASSIGNED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-stone-400 uppercase">TRIP CODE</span>
                  <p className="font-mono font-bold text-lg text-[#121316]">
                    {assignedTrip.trip_id}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-stone-400 uppercase">ASSIGNED SHUTTLE</span>
                  <p className="font-editorial font-bold text-lg text-[#121316]">
                    {assignedShuttle.shuttle_number}
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <span className="text-[10px] font-mono text-stone-400 uppercase">OPERATIONAL CORRIDOR</span>
                <p className="font-editorial font-bold text-lg text-jklu-orange">
                  {assignedRoute.route_name}
                </p>
                <p className="text-xs text-stone-500">
                  {assignedRoute.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (PC: 6 cols) - Controls & Telemetry */}
          <div className="lg:col-span-6 space-y-5">
            {/* Trip Operations & Status Card */}
            <div className="p-6 rounded-3xl bg-[#121316] text-[#FBFBF9] shadow-float space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                  TRIP RUNNING STATUS
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRunning ? 'bg-emerald-500 animate-ping' : 'bg-stone-500'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    {isRunning ? 'RUNNING' : 'SCHEDULED'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
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
                    <span className="text-xs font-mono text-stone-300">
                      Started at: {assignedTrip.start_time}
                    </span>
                  </div>

                  <button
                    onClick={() => handleEndTrip(assignedTrip.trip_id)}
                    className="w-full py-4 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-editorial font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>END TRIP AT CAMPUS</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartTrip(assignedTrip.trip_id)}
                  className="w-full py-4 px-5 rounded-2xl bg-jklu-orange hover:bg-orange-600 text-white font-editorial font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START TRIP</span>
                </button>
              )}
            </div>

            {/* Capacity Management Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-stone-400 uppercase block">
                    CAPACITY AVAILABILITY TOGGLE
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusIndicator status={assignedTrip.capacity_status} size="lg" />
                    <span className="text-xs font-mono text-stone-500">
                      (Capacity: {assignedShuttle.capacity} seats)
                    </span>
                  </div>
                </div>

                <Users className="w-6 h-6 text-stone-400" />
              </div>

              <button
                onClick={() => handleToggleCapacity(assignedTrip.trip_id)}
                className={`w-full py-3.5 px-4 rounded-2xl font-editorial font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 border ${
                  isFull
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
