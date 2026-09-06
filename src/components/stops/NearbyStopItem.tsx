import React from 'react';
import { NearbyStopInfo } from '../../types/ui';
import { ArrowRight, Footprints, Bus } from 'lucide-react';
import { locationService } from '../../services/locationService';

interface NearbyStopItemProps {
  item: NearbyStopInfo;
  index: number;
  onSelect: (stopId: string) => void;
}

export const NearbyStopItem: React.FC<NearbyStopItemProps> = ({ item, index, onSelect }) => {
  const sequenceStr = index < 9 ? `0${index + 1}` : `${index + 1}`;

  return (
    <div
      onClick={() => onSelect(item.stop.stop_id)}
      className={`group cursor-pointer py-4 px-4 transition-all duration-200 border-b border-stone-200/80 ${
        item.is_nearest
          ? 'bg-white/80 hover:bg-white relative shadow-subtle rounded-xl my-1 border border-stone-200'
          : 'hover:bg-stone-50/70'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Big sequence number + Info */}
        <div className="flex items-baseline gap-4">
          <span className="font-editorial font-bold text-2xl text-stone-300 group-hover:text-jklu-orange transition-colors select-none leading-none">
            {sequenceStr}
          </span>

          <div className="space-y-1.5">
            {/* Nearest Badge & Title */}
            <div className="flex items-center gap-2">
              <h3 className="font-editorial font-bold text-lg text-[#121316] tracking-tight uppercase group-hover:text-jklu-orange transition-colors">
                {item.stop.stop_name}
              </h3>
              {item.is_nearest && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-orange-50 text-jklu-orange border border-orange-200/80">
                  NEAREST
                </span>
              )}
            </div>

            {/* Metrics: Distance, Walk time, Approaching Shuttles */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 font-medium">
              <span className="text-[#121316] font-semibold tracking-wider font-mono">
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
                  {item.approaching_shuttles_count === 1 ? 'SHUTTLE' : 'SHUTTLES'} APPROACHING
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <div className="self-center p-2 rounded-full text-stone-400 group-hover:text-[#121316] group-hover:translate-x-1 transition-all">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
