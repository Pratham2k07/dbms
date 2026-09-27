import React from 'react';
import { NearbyStopInfo, UpcomingShuttleCardData } from '../../types/ui';
import { Footprints, Bus, ChevronDown, ArrowRight } from 'lucide-react';
import { locationService } from '../../services/locationService';
import { ETA } from '../shuttles/ETA';
import { StatusIndicator } from '../common/StatusIndicator';

interface NearbyStopItemProps {
  item: NearbyStopInfo;
  index: number;
  isSelected?: boolean;
  onSelect: (stopId: string) => void;
  upcomingShuttles?: UpcomingShuttleCardData[];
  onTrackShuttle?: (tripId: string) => void;
}

export const NearbyStopItem: React.FC<NearbyStopItemProps> = ({
  item,
  index,
  isSelected = false,
  onSelect,
  upcomingShuttles = [],
  onTrackShuttle
}) => {
  const sequenceStr = index < 9 ? `0${index + 1}` : `${index + 1}`;

  return (
    <div
      className={`transition-all duration-200 rounded-2xl ${
        isSelected
          ? 'bg-orange-50/50 border-2 border-jklu-orange shadow-md my-2 ring-2 ring-jklu-orange/15'
          : item.is_nearest
          ? 'bg-white/80 hover:bg-stone-50/80 relative shadow-subtle rounded-xl my-1 border border-stone-200'
          : 'hover:bg-stone-50/70 border-b border-stone-200/80'
      }`}
    >
      {/* Clickable Header Row (toggles dropdown box) */}
      <div
        onClick={() => onSelect(item.stop.stop_id)}
        className="group cursor-pointer py-4 px-4 flex items-start justify-between gap-3 select-none"
      >
        {/* Left: Big sequence number + Info */}
        <div className="flex items-baseline gap-3 sm:gap-4 flex-1 min-w-0">
          <span
            className={`font-editorial font-bold text-2xl select-none leading-none transition-colors ${
              isSelected
                ? 'text-jklu-orange font-black'
                : 'text-stone-300 group-hover:text-jklu-orange'
            }`}
          >
            {sequenceStr}
          </span>

          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-editorial font-bold text-base sm:text-lg tracking-tight uppercase transition-colors truncate ${
                  isSelected
                    ? 'text-jklu-orange font-black'
                    : 'text-[#121316] group-hover:text-jklu-orange'
                }`}
              >
                {item.stop.stop_name}
              </h3>
              {isSelected && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-jklu-orange text-white shadow-xs">
                  OPEN
                </span>
              )}
              {item.is_nearest && !isSelected && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-orange-50 text-jklu-orange border border-orange-200/80">
                  NEAREST
                </span>
              )}
            </div>

            {/* Metrics: Distance, Walk time, Approaching Shuttles */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone-500 font-medium">
              <span
                className={`tracking-wider font-mono ${
                  isSelected ? 'text-jklu-orange font-bold' : 'text-[#121316] font-semibold'
                }`}
              >
                {locationService.formatDistance(item.distance_meters)}
              </span>

              <span className="text-stone-300">•</span>

              <div className="flex items-center gap-1 text-stone-600">
                <Footprints className="w-3.5 h-3.5 text-stone-400" />
                <span>{item.walking_time_minutes} MIN WALK</span>
              </div>

              <span className="text-stone-300">•</span>

              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                <Bus className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {item.approaching_shuttles_count}{' '}
                  {item.approaching_shuttles_count === 1 ? 'SHUTTLE' : 'SHUTTLES'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dropdown Toggle Icon */}
        <div
          className={`self-center p-1.5 rounded-xl transition-all duration-200 ${
            isSelected
              ? 'bg-orange-100/80 text-jklu-orange'
              : 'text-stone-400 group-hover:text-[#121316] group-hover:bg-stone-100'
          }`}
          title={isSelected ? 'Collapse details' : 'Expand details'}
        >
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              isSelected ? 'rotate-180 text-jklu-orange' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Box (revealed when this stop is selected) */}
      {isSelected && (
        <div className="px-4 pb-4 pt-1 border-t border-orange-200/70 space-y-3 animate-fadeIn">
          {/* Stop description if present */}
          {item.stop.description && (
            <p className="text-xs text-stone-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-stone-200/70">
              {item.stop.description}
            </p>
          )}

          {/* Header for approaching shuttles */}
          <div className="flex items-center justify-between text-xs font-editorial font-bold pt-1">
            <span className="text-[#121316] uppercase tracking-wider flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-jklu-orange" />
              <span>Approaching Shuttles</span>
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              Sorted by ETA
            </span>
          </div>

          {/* Shuttles list inside dropdown box */}
          {upcomingShuttles.length > 0 ? (
            <div className="space-y-2">
              {upcomingShuttles.map((shuttleItem) => (
                <div
                  key={`${shuttleItem.trip.trip_id}_${shuttleItem.trip_stop.stop_id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTrackShuttle) onTrackShuttle(shuttleItem.trip.trip_id);
                  }}
                  className="group/shuttle cursor-pointer p-3 bg-white hover:bg-orange-50/50 rounded-xl border border-stone-200 hover:border-orange-300 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Shuttle details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-jklu-orange text-white font-editorial font-bold text-[11px] tracking-wider uppercase">
                          {shuttleItem.shuttle.shuttle_number}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {shuttleItem.shuttle.registration_number}
                        </span>
                      </div>

                      {/* Route & Destination */}
                      <div>
                        <h4 className="font-editorial font-bold text-xs text-[#121316] truncate group-hover/shuttle:text-jklu-orange transition-colors">
                          {shuttleItem.route.route_name}
                        </h4>
                        <div className="text-[10px] text-stone-500 font-medium">
                          Destination: <strong className="text-stone-700">JKLU Campus</strong>
                        </div>
                      </div>

                      {/* Timings & Capacity */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-stone-500 pt-0.5">
                        <span>Est: <strong className="text-stone-800">{shuttleItem.estimated_time}</strong></span>
                        <span className="text-stone-300">•</span>
                        <span>Sched: {shuttleItem.scheduled_time}</span>
                      </div>

                      <div className="pt-0.5">
                        <StatusIndicator status={shuttleItem.capacity_status} size="sm" />
                      </div>
                    </div>

                    {/* Right: ETA & Live Track */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-1">
                      <div className="text-right">
                        <span className="text-[8px] font-editorial font-bold tracking-widest text-stone-400 uppercase block mb-0.5">
                          ARRIVING IN
                        </span>
                        <ETA minutes={shuttleItem.eta_minutes} size="sm" />
                      </div>

                      {onTrackShuttle && (
                        <div className="flex items-center gap-1 text-[10px] font-editorial font-bold tracking-wider text-jklu-orange group-hover/shuttle:translate-x-0.5 transition-transform mt-2">
                          <span>LIVE TRACK</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-center space-y-1">
              <p className="font-editorial font-bold text-xs text-stone-700 uppercase">
                No Active Shuttles Approaching
              </p>
              <p className="text-[10px] text-stone-500">
                Next scheduled departure towards JKLU Campus is at 09:15 AM.
              </p>
            </div>
          )}

          {/* Close/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.stop.stop_id);
            }}
            className="w-full py-1.5 px-3 rounded-lg border border-orange-200/80 bg-white hover:bg-orange-50 text-stone-600 hover:text-jklu-orange text-[11px] font-editorial font-bold tracking-wide transition-all flex items-center justify-center gap-1"
          >
            <ChevronDown className="w-3.5 h-3.5 rotate-180 text-jklu-orange" />
            <span>Collapse Dropdown</span>
          </button>
        </div>
      )}
    </div>
  );
};
