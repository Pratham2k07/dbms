import React, { useState } from 'react';
import { Shuttle, Trip, Route, TripStop } from '../../types/database';
import { ETA } from '../shuttles/ETA';
import { StatusIndicator } from '../common/StatusIndicator';
import { RouteTimeline } from './RouteTimeline';
import { ChevronDown, ChevronUp, User, Gauge, ShieldCheck, MapPin } from 'lucide-react';
import { MOCK_DRIVERS } from '../../data/mockDatabase';

interface TripBottomSheetProps {
  shuttle: Shuttle;
  trip: Trip;
  route: Route;
  tripStops: TripStop[];
  selectedStopId: string;
  etaMinutes: number;
}

export const TripBottomSheet: React.FC<TripBottomSheetProps> = ({
  shuttle,
  trip,
  route,
  tripStops,
  selectedStopId,
  etaMinutes
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const driver = MOCK_DRIVERS.find((d) => d.driver_id === trip.driver_id) || MOCK_DRIVERS[0];
  const targetTripStop = tripStops.find(
    (ts) => ts.trip_id === trip.trip_id && ts.stop_id === selectedStopId
  );

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 max-w-lg mx-auto pointer-events-auto">
      <div
        className={`bg-white rounded-t-3xl border-t border-x border-stone-200 shadow-sheet transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[82vh] overflow-y-auto' : 'max-h-56'
        }`}
      >
        {/* Drag / Toggle Handle */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 select-none rounded-t-3xl transition-colors"
        >
          <div className="w-12 h-1.5 bg-stone-300 rounded-full mb-1" />
          <div className="flex items-center gap-1 text-[10px] font-mono text-stone-400 font-semibold uppercase tracking-wider">
            <span>{isExpanded ? 'Tap to Collapse' : 'Swipe Up for Trip Timeline'}</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
            )}
          </div>
        </div>

        {/* Collapsed Core Summary View */}
        <div className="px-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial font-bold text-xl text-[#121316] tracking-tight uppercase">
                  {shuttle.shuttle_number}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs font-mono font-medium text-stone-500">
                  {shuttle.registration_number}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium mt-0.5 uppercase tracking-wide">
                ON THE WAY TO CAMPUS
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusIndicator status={trip.capacity_status} />
                <span className="text-stone-300">•</span>
                <span className="text-[11px] font-mono text-stone-500">
                  TRIP {trip.trip_id}
                </span>
              </div>
            </div>

            {/* Dominant Large ETA Block */}
            <div className="text-right">
              <span className="text-[10px] font-editorial font-bold tracking-widest text-stone-400 uppercase block">
                ARRIVING IN
              </span>
              <ETA minutes={etaMinutes} size="hero" />
            </div>
          </div>
        </div>

        {/* Timing Information Row */}
        <div className="px-5 py-2.5 bg-stone-50/90 border-y border-stone-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">ESTIMATED ARRIVAL:</span>
            <span className="font-mono font-bold text-[#121316]">
              {targetTripStop?.estimated_arrival || '10:35 AM'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium">SCHEDULED:</span>
            <span className="font-mono text-stone-600">
              {targetTripStop?.scheduled_arrival || '10:30 AM'}
            </span>
          </div>
        </div>

        {/* Expanded Full Details */}
        {isExpanded && (
          <div className="p-5 space-y-5 animate-fadeIn">
            {/* Driver & Telemetry Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#FBFBF9] border border-stone-200 space-y-1">
                <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-mono uppercase">
                  <User className="w-3 h-3 text-stone-400" />
                  <span>Assigned Driver</span>
                </div>
                <p className="font-editorial font-bold text-sm text-[#121316]">
                  {driver.name}
                </p>
                <p className="text-[10px] font-mono text-stone-500">
                  Lic: {driver.license_no}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FBFBF9] border border-stone-200 space-y-1">
                <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-mono uppercase">
                  <Gauge className="w-3 h-3 text-stone-400" />
                  <span>Current Speed</span>
                </div>
                <p className="font-mono font-bold text-sm text-[#121316]">
                  {trip.speed_kmh || 38} KM/H
                </p>
                <p className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> GPS Broadcasting
                </p>
              </div>
            </div>

            {/* Vertical Route Timeline */}
            <RouteTimeline
              route={route}
              trip={trip}
              tripStops={tripStops}
              selectedStopId={selectedStopId}
              etaMinutes={etaMinutes}
            />
          </div>
        )}
      </div>
    </div>
  );
};
