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
      className={`transition-all duration-150 rounded-xl border ${
        isSelected
          ? 'bg-orange-50/50 border-[#E8590C] shadow-xs ring-1 ring-[#E8590C]/25'
          : item.is_nearest
          ? 'bg-white border-orange-200/80 hover:border-orange-300 hover:bg-orange-50/20 shadow-xs'
          : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/70'
      }`}
    >
      {/* Clickable Compact Row */}
      <div
        onClick={() => onSelect(item.stop.stop_id)}
        className="group cursor-pointer py-2 px-2.5 sm:py-2.5 sm:px-3 flex items-center justify-between gap-2.5 select-none"
      >
        {/* Left: Sequence number pill + Name & Secondary info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Stop Number */}
          <div
            className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 transition-colors ${
              isSelected
                ? 'bg-[#E8590C] text-white shadow-xs'
                : item.is_nearest
                ? 'bg-[#E8590C]/10 text-[#E8590C] font-extrabold border border-[#E8590C]/25'
                : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200/80 group-hover:text-stone-800'
            }`}
          >
            {sequenceStr}
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            {/* Primary line: Stop Name + Badges */}
            <div className="flex items-center gap-1.5 min-w-0">
              <h3
                className={`font-editorial font-bold text-xs sm:text-sm tracking-tight uppercase truncate transition-colors leading-tight ${
                  isSelected
                    ? 'text-[#E8590C] font-black'
                    : 'text-[#121316] group-hover:text-[#E8590C]'
                }`}
              >
                {item.stop.stop_name}
              </h3>

              {item.is_nearest && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-wider uppercase bg-[#E8590C]/10 text-[#E8590C] border border-[#E8590C]/20 shrink-0">
                  NEAREST
                </span>
              )}
              {isSelected && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-wider uppercase bg-[#E8590C] text-white shadow-xs shrink-0">
                  OPEN
                </span>
              )}
            </div>

            {/* Secondary line: Distance, Walking Time, Available Shuttle Count */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-stone-500 font-medium leading-tight">
              <span
                className={`tracking-wider font-mono ${
                  isSelected ? 'text-[#E8590C] font-bold' : 'text-stone-700 font-semibold'
                }`}
              >
                {locationService.formatDistance(item.distance_meters)}
              </span>

              <span className="text-stone-300">•</span>

              <div className="flex items-center gap-1 text-stone-600">
                <Footprints className="w-3 h-3 text-stone-400" />
                <span>{item.walking_time_minutes}m walk</span>
              </div>

              <span className="text-stone-300">•</span>

              <div
                className={`flex items-center gap-1 font-medium ${
                  item.approaching_shuttles_count > 0 ? 'text-emerald-700 font-semibold' : 'text-stone-400'
                }`}
              >
                <Bus className="w-3 h-3 text-emerald-600" />
                <span>
                  {item.approaching_shuttles_count}{' '}
                  {item.approaching_shuttles_count === 1 ? 'shuttle' : 'shuttles'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Expand / Collapse Icon */}
        <div
          className={`p-1 rounded-md transition-all duration-150 shrink-0 ${
            isSelected
              ? 'bg-orange-100/70 text-[#E8590C]'
              : 'text-stone-400 group-hover:text-stone-700 group-hover:bg-stone-100'
          }`}
          title={isSelected ? 'Collapse details' : 'Expand details'}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isSelected ? 'rotate-180 text-[#E8590C]' : ''
            }`}
          />
        </div>
      </div>

      {/* Inline Expanded Dropdown Box */}
      {isSelected && (
        <div className="px-2.5 pb-2.5 pt-1.5 border-t border-orange-200/60 space-y-2 animate-fadeIn bg-white/60 rounded-b-xl">
          {/* Stop description if present */}
          {item.stop.description && (
            <p className="text-[11px] text-stone-600 leading-relaxed bg-white p-2 rounded-lg border border-stone-200/70">
              {item.stop.description}
            </p>
          )}

          {/* Header for approaching shuttles */}
          <div className="flex items-center justify-between text-[11px] font-editorial font-bold pt-0.5 px-0.5">
            <span className="text-[#121316] uppercase tracking-wider flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-[#E8590C]" />
              <span>Approaching Shuttles</span>
            </span>
            <span className="text-[9px] font-mono text-stone-400">
              Sorted by ETA
            </span>
          </div>

          {/* Shuttles list inside dropdown box */}
          {upcomingShuttles.length > 0 ? (
            <div className="space-y-1.5">
              {upcomingShuttles.map((shuttleItem) => (
                <div
                  key={`${shuttleItem.trip.trip_id}_${shuttleItem.trip_stop.stop_id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTrackShuttle) onTrackShuttle(shuttleItem.trip.trip_id);
                  }}
                  className="group/shuttle cursor-pointer p-2 sm:p-2.5 bg-white hover:bg-orange-50/50 rounded-lg border border-stone-200 hover:border-orange-300 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Shuttle details */}
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#E8590C] text-white font-editorial font-bold text-[10px] tracking-wider uppercase">
                          {shuttleItem.shuttle.shuttle_number}
                        </span>
                        <span className="text-[9px] font-mono text-stone-500">
                          {shuttleItem.shuttle.registration_number}
                        </span>
                      </div>

                      {/* Route & Destination */}
                      <div>
                        <h4 className="font-editorial font-bold text-[11px] text-[#121316] truncate group-hover/shuttle:text-[#E8590C] transition-colors leading-tight">
                          {shuttleItem.route.route_name}
                        </h4>
                        <div className="text-[9px] text-stone-500 font-medium">
                          Destination: <strong className="text-stone-700">JKLU Campus</strong>
                        </div>
                      </div>

                      {/* Timings & Capacity */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono text-stone-500 pt-0.5">
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
                        <div className="flex items-center gap-1 text-[9px] font-editorial font-bold tracking-wider text-[#E8590C] group-hover/shuttle:translate-x-0.5 transition-transform mt-1.5">
                          <span>LIVE TRACK</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-white/90 border border-stone-200 text-center space-y-0.5">
              <p className="font-editorial font-bold text-[11px] text-stone-700 uppercase">
                No Active Shuttles Approaching
              </p>
              <p className="text-[9px] text-stone-500">
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
            className="w-full py-1 px-2.5 rounded-md border border-orange-200/80 bg-white hover:bg-orange-50 text-stone-600 hover:text-[#E8590C] text-[10px] font-editorial font-bold tracking-wide transition-all flex items-center justify-center gap-1"
          >
            <ChevronDown className="w-3 h-3 rotate-180 text-[#E8590C]" />
            <span>Collapse Details</span>
          </button>
        </div>
      )}
    </div>
  );
};
