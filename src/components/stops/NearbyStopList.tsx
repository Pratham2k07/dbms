import React from 'react';
import { NearbyStopInfo, UpcomingShuttleCardData } from '../../types/ui';
import { NearbyStopItem } from './NearbyStopItem';

interface NearbyStopListProps {
  stops: NearbyStopInfo[];
  selectedStopId?: string | null;
  onSelectStop: (stopId: string) => void;
  getUpcomingShuttles?: (stopId: string) => UpcomingShuttleCardData[];
  onTrackShuttle?: (tripId: string) => void;
}

export const NearbyStopList: React.FC<NearbyStopListProps> = ({
  stops,
  selectedStopId,
  onSelectStop,
  getUpcomingShuttles,
  onTrackShuttle
}) => {
  return (
    <section className="flex flex-col h-full min-h-0">
      {/* Compact Sticky Section Header */}
      <div className="pb-2.5 mb-1.5 border-b border-stone-100 flex items-center justify-between shrink-0 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-editorial font-bold text-sm sm:text-base text-[#121316] tracking-tight uppercase leading-none">
              Nearby Stops
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EDF3FC] text-[#2B4A7E] border border-blue-100">
              {stops.length} STOPS
            </span>
          </div>
          <p className="text-[10px] text-stone-400 font-mono tracking-wide mt-1">
            Sorted by walking proximity
          </p>
        </div>

        <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Independently Scrollable Stops List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 pt-0.5 custom-scrollbar">
        {stops.map((item, idx) => {
          const isSelected = Boolean(selectedStopId && selectedStopId === item.stop.stop_id);
          const shuttlesForStop = isSelected && getUpcomingShuttles ? getUpcomingShuttles(item.stop.stop_id) : [];

          return (
            <NearbyStopItem
              key={item.stop.stop_id}
              item={item}
              index={idx}
              isSelected={isSelected}
              onSelect={onSelectStop}
              upcomingShuttles={shuttlesForStop}
              onTrackShuttle={onTrackShuttle}
            />
          );
        })}
      </div>
    </section>
  );
};

