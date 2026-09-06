import React from 'react';
import { NearbyStopInfo } from '../../types/ui';
import { NearbyStopItem } from './NearbyStopItem';

interface NearbyStopListProps {
  stops: NearbyStopInfo[];
  onSelectStop: (stopId: string) => void;
}

export const NearbyStopList: React.FC<NearbyStopListProps> = ({ stops, onSelectStop }) => {
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
        {stops.map((item, idx) => (
          <NearbyStopItem
            key={item.stop.stop_id}
            item={item}
            index={idx}
            onSelect={onSelectStop}
          />
        ))}
      </div>
    </section>
  );
};
