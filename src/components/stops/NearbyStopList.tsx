import React from 'react';
import { NearbyStopInfo } from '../../types/ui';
import { NearbyStopItem } from './NearbyStopItem';

import { UpcomingShuttleCardData } from '../../types/ui';

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
    <section className="space-y-2">
      {/* Editorial Section Header */}
      <div className="px-4 pt-2">
        <h2 className="font-editorial font-bold text-2xl text-[#121316] tracking-tight leading-none uppercase">
          NEARBY
          <br />
          STOPS
        </h2>
        <p className="text-xs text-stone-500 font-medium tracking-wide mt-1.5 uppercase">
          Based on your current location
        </p>
      </div>

      {/* Stop Items List with subtle separators */}
      <div className="divide-y divide-stone-200/60 pt-1">
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
