import React from 'react';
import { Stop } from '../../types/database';
import { UpcomingShuttleCardData } from '../../types/ui';
import { locationService } from '../../services/locationService';
import { ETA } from '../shuttles/ETA';
import { StatusIndicator } from '../common/StatusIndicator';
import { ArrowLeft, X, Footprints, Bus, ArrowRight, MapPin } from 'lucide-react';

interface InlineStopDetailPanelProps {
  stop: Stop;
  distanceMeters: number;
  walkingTimeMinutes: number;
  upcomingShuttles: UpcomingShuttleCardData[];
  onClose: () => void;
  onTrackShuttle: (tripId: string) => void;
}

export const InlineStopDetailPanel: React.FC<InlineStopDetailPanelProps> = ({
  stop,
  distanceMeters,
  walkingTimeMinutes,
  upcomingShuttles,
  onClose,
  onTrackShuttle
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-subtle p-4 sm:p-5 space-y-4 transition-all duration-300">
      {/* Top Bar with Clear Back / Close Action */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
        <button
          onClick={onClose}
          className="group inline-flex items-center gap-1.5 text-xs font-editorial font-bold tracking-wider text-stone-500 hover:text-jklu-orange uppercase transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>BACK TO NEARBY STOPS</span>
        </button>

        <button
          onClick={onClose}
          className="p-1 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          title="Close stop details"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stop Overview & Primary Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold text-jklu-orange uppercase tracking-wider block">
            CAMPUS TRANSIT STOP
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70">
            {upcomingShuttles.length} {upcomingShuttles.length === 1 ? 'SHUTTLE' : 'SHUTTLES'} APPROACHING
          </span>
        </div>

        <h3 className="font-editorial font-black text-2xl sm:text-3xl text-[#121316] tracking-tight uppercase leading-none">
          {stop.stop_name}
        </h3>

        {/* Distance from current location & estimated walking time */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 font-medium pt-0.5">
          <span className="font-mono font-bold text-jklu-orange">
            {locationService.formatDistance(distanceMeters)} away
          </span>
          <span className="text-stone-300">•</span>
          <div className="flex items-center gap-1 text-stone-700 font-semibold">
            <Footprints className="w-3.5 h-3.5 text-stone-400" />
            <span>{walkingTimeMinutes} MIN WALK FROM YOU</span>
          </div>
        </div>

        {stop.description && (
          <p className="text-xs text-stone-500 leading-relaxed pt-0.5">
            {stop.description}
          </p>
        )}
      </div>

      {/* Approaching Shuttles Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between border-t border-stone-200/80 pt-3">
          <div className="flex items-center gap-1.5">
            <Bus className="w-4 h-4 text-jklu-orange" />
            <span className="text-[11px] font-editorial font-bold uppercase tracking-wider text-[#121316]">
              Approaching Shuttles
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            Sorted by Live ETA
          </span>
        </div>

        {upcomingShuttles.length > 0 ? (
          <div className="space-y-2.5">
            {upcomingShuttles.map((shuttleItem) => (
              <div
                key={`${shuttleItem.trip.trip_id}_${shuttleItem.trip_stop.stop_id}`}
                onClick={() => onTrackShuttle(shuttleItem.trip.trip_id)}
                className="group cursor-pointer p-3.5 bg-stone-50/80 hover:bg-white rounded-2xl border border-stone-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Shuttle number + Route + Destination */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-jklu-orange text-white font-editorial font-bold text-xs tracking-wider uppercase shadow-xs">
                        {shuttleItem.shuttle.shuttle_number}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        {shuttleItem.shuttle.registration_number}
                      </span>
                    </div>

                    {/* Route & Destination Information */}
                    <div>
                      <h4 className="font-editorial font-bold text-sm text-[#121316] truncate group-hover:text-jklu-orange transition-colors">
                        {shuttleItem.route.route_name}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                        <span className="text-stone-400">Destination:</span>
                        <span className="text-stone-700 font-semibold">JKLU Campus</span>
                      </div>
                    </div>

                    {/* Timings: Est vs Sched */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 pt-0.5">
                      <span>Est: <strong className="text-stone-800">{shuttleItem.estimated_time}</strong></span>
                      <span className="text-stone-300">•</span>
                      <span>Sched: {shuttleItem.scheduled_time}</span>
                    </div>

                    {/* Capacity Status */}
                    <div className="pt-0.5">
                      <StatusIndicator status={shuttleItem.capacity_status} size="sm" />
                    </div>
                  </div>

                  {/* Right: Dominant ETA & Live Track Action */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-2">
                    <div className="text-right">
                      <span className="text-[8px] font-editorial font-bold tracking-widest text-stone-400 uppercase block mb-0.5">
                        ARRIVING IN
                      </span>
                      <ETA minutes={shuttleItem.eta_minutes} size="md" />
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-editorial font-bold tracking-wider text-jklu-orange group-hover:translate-x-1 transition-transform mt-2">
                      <span>TRACK</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1.5">
            <Bus className="w-5 h-5 text-stone-400 mx-auto" />
            <p className="font-editorial font-bold text-xs text-stone-700 uppercase">
              No Shuttles Currently Approaching
            </p>
            <p className="text-[11px] text-stone-500">
              Next scheduled shuttle departure towards JKLU Campus is at 09:15 AM.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-1">
        <button
          onClick={onClose}
          className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-700 text-xs font-editorial font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5 text-stone-500" />
          <span>Close Stop Details</span>
        </button>
      </div>
    </div>
  );
};
