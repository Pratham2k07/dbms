import React, { useMemo } from 'react';
import { Route, Stop, Trip, TripStop } from '../../types/database';
import { Building2, Bus, Check, Clock, MapPin } from 'lucide-react';
import { routeService } from '../../services/routeService';
import { useApp } from '../../context/AppContext';
import { computeTripProgression } from '../../services/routeProgressTracker';

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
  const { routeStops, stops, routes, shuttleLocations } = useApp();
  const stopsMetadata = routeService.getRouteStopsWithMetadata(route.route_id, routeStops, stops, routes);

  // Shuttle current location
  const currentLocation = useMemo(() => {
    return shuttleLocations.find(
      (l) => l.shuttle_id === trip.shuttle_id || l.trip_id === trip.trip_id
    );
  }, [shuttleLocations, trip.shuttle_id, trip.trip_id]);

  // Determine passed vs approaching vs upcoming stops dynamically with monotonic latching
  const { completedIndices, activeApproachingIndex } = useMemo(() => {
    const orderedStops = stopsMetadata.map((sm) => sm.stop);
    return computeTripProgression(
      trip.trip_id,
      trip.running_status === 'RUNNING',
      orderedStops,
      currentLocation,
      tripStops
    );
  }, [stopsMetadata, trip.trip_id, trip.running_status, currentLocation, tripStops]);

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

          const isSelectedStop = stop.stop_id === selectedStopId;
          const isCampusStop = stop.stop_name.toLowerCase().includes('campus') || stop.stop_name.toLowerCase().includes('jklu');
          const isOrigin = idx === 0 || stop.stop_id === 'STOP-JKLU-START' || (isCampusStop && idx === 0);
          const isDestination = idx === stopsMetadata.length - 1 || Boolean(stop.is_destination);
          const isCompleted = completedIndices.has(idx);
          const isApproaching = activeApproachingIndex === idx && !isCompleted;

          return (
            <div key={stop.stop_id} className="relative flex items-start gap-4 group">
              {/* Timeline Node Symbol */}
              <div className="relative z-10 -ml-6 flex items-center justify-center">
                {isCompleted ? (
                  // Passed / Completed Stop: Solid dark ring with green checkmark
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center ring-2 ring-emerald-500/80 shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  </div>
                ) : isApproaching ? (
                  // Active Next Station: Pulsing Radar Ring
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white shadow-md">
                      <Bus className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : isDestination ? (
                  // Final Stop: Architectural JKLU Crest if Campus, or Destination Location Pin
                  <div className="w-8 h-8 rounded-lg bg-[#121316] text-[#FBFBF9] border-2 border-jklu-orange flex items-center justify-center shadow-md">
                    {isCampusStop ? (
                      <Building2 className="w-4 h-4 text-jklu-orange" />
                    ) : (
                      <MapPin className="w-4 h-4 text-jklu-orange" />
                    )}
                  </div>
                ) : (
                  // Upcoming Pending Stop
                  <div className={`w-6 h-6 rounded-full bg-white border-2 ${isSelectedStop ? 'border-jklu-orange ring-2 ring-orange-100' : 'border-stone-300 group-hover:border-stone-400'} text-stone-400 flex items-center justify-center`}>
                    <span className={`w-2 h-2 rounded-full ${isSelectedStop ? 'bg-jklu-orange' : 'bg-stone-300'}`} />
                  </div>
                )}
              </div>

              {/* Stop Information Block */}
              <div
                className={`flex-1 -mt-1 p-2.5 rounded-xl transition-colors ${
                  isApproaching
                    ? 'bg-emerald-50/50 border border-emerald-200/70 shadow-xs'
                    : isSelectedStop
                    ? 'bg-orange-50/40 border border-orange-200/60 shadow-2xs'
                    : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-editorial font-bold text-sm uppercase tracking-tight ${
                        isCompleted
                          ? 'text-stone-400 line-through decoration-stone-300'
                          : isApproaching
                          ? 'text-emerald-800 font-extrabold text-base'
                          : isDestination || isOrigin
                          ? 'text-[#121316] font-extrabold'
                          : isSelectedStop
                          ? 'text-[#E8590C] font-bold'
                          : 'text-[#121316]'
                      }`}
                    >
                      {stop.stop_name}
                    </h4>

                    {isOrigin && !isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-700 text-white">
                        ORIGIN BAY
                      </span>
                    )}

                    {isDestination && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#121316] text-[#FBFBF9]">
                        {isCampusStop ? 'CAMPUS TERMINUS' : 'TERMINUS'}
                      </span>
                    )}
                  </div>

                  {/* Status / Timing pill */}
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                      <span>PASSED</span>
                    </span>
                  ) : isApproaching ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse shadow-2xs">
                      <span>APPROACHING</span>
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
                    {stop.description || (isCampusStop ? 'JK Lakshmipat University Campus' : 'Route Terminus')}
                  </p>

                  {item.isShared && (
                    <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                      Shared: {item.sharedWithRoutes.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};