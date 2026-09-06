import React from 'react';
import { Route, Stop, Trip, TripStop } from '../../types/database';
import { Building2, Bus, Check, Clock } from 'lucide-react';
import { routeService } from '../../services/routeService';

interface RouteTimelineProps {
  route: Route;
  trip: Trip;
  tripStops: TripStop[];
  selectedStopId: string;
  etaMinutes: number;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  route,
  trip,
  tripStops,
  selectedStopId,
  etaMinutes
}) => {
  const stopsMetadata = routeService.getRouteStopsWithMetadata(route.route_id);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between pb-1 border-b border-stone-100">
        <span className="font-editorial font-bold text-xs tracking-widest text-stone-400 uppercase">
          ROUTE TIMELINE
        </span>
        <span className="text-[11px] font-mono text-stone-500">
          {stopsMetadata.length} STOPS ON {route.route_code}
        </span>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[35px] top-4 bottom-5 w-[2px] bg-stone-200" />

        {stopsMetadata.map((item, idx) => {
          const stop = item.stop;
          const tripStop = tripStops.find(
            (ts) => ts.trip_id === trip.trip_id && ts.stop_id === stop.stop_id
          );

          const isSelectedStudentStop = stop.stop_id === selectedStopId;
          const isOrigin = stop.stop_id === 'STOP-JKLU-START';
          const isDestination = stop.is_destination;
          const isCompleted = tripStop?.arrival_status === 'COMPLETED';
          const isApproaching = tripStop?.arrival_status === 'APPROACHING';

          return (
            <div key={stop.stop_id} className="relative flex items-start gap-4 group">
              {/* Timeline Node Symbol */}
              <div className="relative z-10 -ml-6 flex items-center justify-center">
                {isDestination ? (
                  // Final Stop: Architectural JKLU Crest
                  <div className="w-8 h-8 rounded-lg bg-[#121316] text-[#FBFBF9] border-2 border-jklu-orange flex items-center justify-center shadow-md">
                    <Building2 className="w-4 h-4 text-jklu-orange" />
                  </div>
                ) : isOrigin ? (
                  // Origin Stop: Campus Departure Bay
                  <div className="w-8 h-8 rounded-lg bg-[#121316] text-[#FBFBF9] border-2 border-emerald-500 flex items-center justify-center shadow-md">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : isSelectedStudentStop ? (
                  // Student Selected Stop
                  <div className="w-8 h-8 rounded-full bg-jklu-orange text-white flex items-center justify-center ring-4 ring-orange-100 shadow-md">
                    <span className="font-mono text-xs font-bold">◎</span>
                  </div>
                ) : isCompleted ? (
                  // Completed Stop
                  <div className="w-6 h-6 rounded-full bg-stone-800 text-white flex items-center justify-center ring-2 ring-white">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                ) : (
                  // Upcoming Stop
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-stone-300 text-stone-400 flex items-center justify-center group-hover:border-stone-400">
                    <span className="w-2 h-2 rounded-full bg-stone-300" />
                  </div>
                )}
              </div>

              {/* Stop Information Block */}
              <div
                className={`flex-1 -mt-1 p-2.5 rounded-xl transition-colors ${
                  isSelectedStudentStop
                    ? 'bg-orange-50/70 border border-orange-200/80 shadow-subtle'
                    : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-editorial font-bold text-sm uppercase tracking-tight ${
                        isSelectedStudentStop
                          ? 'text-jklu-orange text-base'
                          : isDestination || isOrigin
                          ? 'text-[#121316] font-extrabold'
                          : isCompleted
                          ? 'text-stone-500 line-through decoration-stone-300'
                          : 'text-[#121316]'
                      }`}
                    >
                      {stop.stop_name}
                    </h4>

                    {isSelectedStudentStop && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-jklu-orange text-white">
                        YOUR STOP
                      </span>
                    )}

                    {isOrigin && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-700 text-white">
                        ORIGIN BAY
                      </span>
                    )}

                    {isDestination && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#121316] text-[#FBFBF9]">
                        CAMPUS TERMINUS
                      </span>
                    )}
                  </div>

                  {/* Status/Timing pill */}
                  {isSelectedStudentStop ? (
                    <span className="font-mono text-xs font-bold text-jklu-orange bg-white px-2 py-0.5 rounded border border-orange-200">
                      ETA {etaMinutes} MIN
                    </span>
                  ) : isOrigin ? (
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                      Departed {tripStop?.actual_departure || '09:35 AM'}
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[10px] font-mono text-stone-400">
                      Completed {tripStop?.actual_arrival || tripStop?.scheduled_arrival}
                    </span>
                  ) : isDestination ? (
                    <span className="text-[10px] font-mono text-stone-700 font-semibold">
                      Terminus {tripStop?.estimated_arrival || '10:55 AM'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-stone-400">
                      Upcoming
                    </span>
                  )}
                </div>

                {/* Subtitle / Shared Route Info */}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] text-stone-500">
                    {isDestination
                      ? 'JK Lakshmipat University'
                      : stop.description || 'Shuttle Transit Point'}
                  </p>

                  {item.isShared && (
                    <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                      Shared: {item.sharedWithRoutes.join(', ')}
                    </span>
                  )}
                </div>

                {/* Simulated Moving Shuttle Node if between stops */}
                {isApproaching && !isSelectedStudentStop && (
                  <div className="mt-2 flex items-center gap-2 py-1 px-2 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200 animate-pulse">
                    <Bus className="w-3.5 h-3.5 text-jklu-orange" />
                    <span>Shuttle is approaching this station</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
