import React from 'react';
import { useApp } from '../context/AppContext';
import { routeService } from '../services/routeService';
import { ArrowDown, ArrowLeft, Bus, Layers } from 'lucide-react';

export const RouteDetailsScreen: React.FC = () => {
  const {
    selectedRouteId,
    setSelectedRouteId,
    routes,
    trips,
    shuttles,
    setCurrentScreen,
    navigateToLiveTracking
  } = useApp();

  const activeRoute = routes.find((r) => r.route_id === selectedRouteId) || routes[0];
  const stopsMetadata = routeService.getRouteStopsWithMetadata(activeRoute.route_id);

  // Active shuttles currently operating on this route
  const activeTripsOnRoute = trips.filter(
    (t) => t.route_id === activeRoute.route_id && t.running_status === 'RUNNING'
  );

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
          <button
            onClick={() => setCurrentScreen('live-tracking')}
            className="group inline-flex items-center gap-2 text-stone-500 hover:text-[#121316] text-xs font-editorial font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>BACK TO LIVE TRACKING</span>
          </button>

          {/* Route Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200 overflow-x-auto">
            {routes.map((r) => {
              const isActive = r.route_id === activeRoute.route_id;
              return (
                <button
                  key={r.route_id}
                  onClick={() => setSelectedRouteId(r.route_id)}
                  className={`min-w-[100px] py-1.5 px-3 rounded-lg text-xs font-editorial font-bold tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-[#121316] text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {r.route_code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Header Summary */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-jklu-orange uppercase block">
            CAMPUS MOBILITY CORRIDOR
          </span>
          <h1 className="font-editorial font-black text-3xl sm:text-4xl text-[#121316] tracking-tight leading-none uppercase">
            {activeRoute.route_name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 pt-1">
            {activeRoute.description}
          </p>
        </div>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 5 cols) - Metadata & Running Fleet */}
          <div className="lg:col-span-5 space-y-5">
            {/* Route Metadata Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                  ROUTE ID
                </span>
                <p className="font-editorial font-black text-2xl text-[#121316]">
                  {activeRoute.route_code}
                </p>
              </div>

              <div className="space-y-0.5 border-x border-stone-100">
                <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                  TOTAL STOPS
                </span>
                <p className="font-editorial font-black text-2xl text-[#121316]">
                  0{stopsMetadata.length}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                  ACTIVE FLEET
                </span>
                <p className="font-editorial font-black text-2xl text-emerald-600">
                  0{activeTripsOnRoute.length}
                </p>
              </div>
            </div>

            {/* Active Shuttles on this Corridor */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="font-editorial font-bold text-xs tracking-widest text-stone-400 uppercase">
                  RUNNING FLEET ON {activeRoute.route_code}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">
                  LIVE TELEMETRY
                </span>
              </div>

              <div className="space-y-2">
                {activeTripsOnRoute.map((t) => {
                  const shuttle = shuttles.find((s) => s.shuttle_id === t.shuttle_id);
                  return (
                    <div
                      key={t.trip_id}
                      onClick={() => navigateToLiveTracking(t.trip_id)}
                      className="group cursor-pointer p-3.5 rounded-2xl bg-[#FBFBF9] hover:bg-orange-50/50 border border-stone-200 shadow-subtle flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-orange-100 text-stone-700 group-hover:text-jklu-orange flex items-center justify-center transition-colors">
                          <Bus className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-editorial font-bold text-sm text-[#121316] uppercase">
                            {shuttle?.shuttle_number} • {t.trip_id}
                          </h4>
                          <p className="text-[11px] font-mono text-stone-500">
                            Reg: {shuttle?.registration_number} • Speed {t.speed_kmh} km/h
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-editorial font-bold text-jklu-orange group-hover:translate-x-1 transition-transform">
                        TRACK →
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (PC: 7 cols) - Sequential Stops Sequence */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
            <div className="border-b border-stone-200/80 pb-3">
              <h2 className="font-editorial font-bold text-2xl text-[#121316] tracking-tight leading-none uppercase">
                ROUTE STOPS SEQUENCE
              </h2>
              <p className="text-xs text-stone-500 font-medium tracking-wide uppercase mt-1">
                Fixed sequential order terminating at JKLU Campus
              </p>
            </div>

            <div className="space-y-2">
              {stopsMetadata.map((item, idx) => {
                const stop = item.stop;
                const seqStr = item.sequence_number < 10 ? `0${item.sequence_number}` : `${item.sequence_number}`;
                const isLast = idx === stopsMetadata.length - 1;

                return (
                  <div key={stop.stop_id} className="group">
                    <div className="p-4 rounded-2xl bg-[#FBFBF9] hover:bg-white border border-stone-200 shadow-subtle flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="font-editorial font-bold text-2xl text-stone-300 group-hover:text-jklu-orange transition-colors">
                          {seqStr}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-editorial font-bold text-base text-[#121316] uppercase">
                              {stop.stop_name}
                            </h4>
                            {stop.is_destination && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#121316] text-[#FBFBF9]">
                                CAMPUS
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {stop.description}
                          </p>
                        </div>
                      </div>

                      {/* Shared Stop Badge */}
                      {item.isShared && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-[10px] font-mono text-stone-600 border border-stone-200">
                          <Layers className="w-3.5 h-3.5 text-stone-400" />
                          <span>Shared: {item.sharedWithRoutes.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {!isLast && (
                      <div className="py-1 flex justify-center text-stone-300">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
