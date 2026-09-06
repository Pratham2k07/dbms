import React from 'react';
import { UpcomingShuttleCardData } from '../../types/ui';
import { ShuttleItem } from './ShuttleItem';
import { EmptyState } from '../common/EmptyState';

interface ShuttleListProps {
  shuttles: UpcomingShuttleCardData[];
  onTrack: (tripId: string) => void;
  onRefresh?: () => void;
}

export const ShuttleList: React.FC<ShuttleListProps> = ({ shuttles, onTrack, onRefresh }) => {
  if (shuttles.length === 0) {
    return (
      <EmptyState
        title="NO ACTIVE SHUTTLES"
        subtitle="There are currently no shuttles approaching this stop."
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-3">
      {shuttles.map((item, idx) => (
        <ShuttleItem
          key={`${item.trip.trip_id}_${item.trip_stop.stop_id}`}
          data={item}
          index={idx}
          onTrack={onTrack}
        />
      ))}
    </div>
  );
};
