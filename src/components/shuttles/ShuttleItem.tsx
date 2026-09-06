import React from 'react';
import { UpcomingShuttleCardData } from '../../types/ui';
import { ETA } from './ETA';
import { StatusIndicator } from '../common/StatusIndicator';
import { ArrowRight, Compass } from 'lucide-react';

interface ShuttleItemProps {
  data: UpcomingShuttleCardData;
  index: number;
  onTrack: (tripId: string) => void;
}

export const ShuttleItem: React.FC<ShuttleItemProps> = ({ data, index, onTrack }) => {
  const sequenceStr = index < 9 ? `0${index + 1}` : `${index + 1}`;

  return (
    <div
      onClick={() => onTrack(data.trip.trip_id)}
      className="group cursor-pointer py-4 px-4 bg-white hover:bg-stone-50/90 rounded-2xl border border-stone-200 shadow-subtle hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left column: Shuttle Number + Route + Status */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-stone-400 select-none">
              {sequenceStr}
            </span>
            <span className="font-editorial font-bold text-sm tracking-wider text-[#121316] uppercase">
              {data.shuttle.shuttle_number}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-[10px] font-mono text-stone-500">
              {data.shuttle.registration_number}
            </span>
          </div>

          {/* Route path */}
          <div>
            <h4 className="font-editorial font-bold text-base text-[#121316] tracking-tight leading-snug uppercase group-hover:text-jklu-orange transition-colors">
              {data.route.route_name}
            </h4>
            <p className="text-[11px] text-stone-500 font-medium">
              {data.route.description}
            </p>
          </div>

          {/* Timing Comparison: Estimated vs Scheduled */}
          <div className="pt-1 flex items-center gap-3 text-[11px] font-mono">
            <span className="text-stone-700">
              Est <span className="font-semibold text-[#121316]">{data.estimated_time}</span>
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500">
              Sched {data.scheduled_time}
            </span>
          </div>

          {/* Capacity Status */}
          <div className="pt-0.5">
            <StatusIndicator status={data.capacity_status} />
          </div>
        </div>

        {/* Right column: Large Dominant ETA + Tracking Action */}
        <div className="flex flex-col items-end justify-between self-stretch pl-2">
          <div className="text-right">
            <span className="text-[9px] font-editorial font-bold tracking-widest text-stone-400 uppercase block mb-0.5">
              ARRIVING IN
            </span>
            <ETA minutes={data.eta_minutes} size="lg" />
          </div>

          {/* Arrow / Track button */}
          <div className="flex items-center gap-1 text-[11px] font-editorial font-bold tracking-wider text-jklu-orange group-hover:translate-x-1 transition-transform mt-3">
            <span>TRACK</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
