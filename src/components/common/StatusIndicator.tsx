import React from 'react';

interface StatusIndicatorProps {
  status: 'AVAILABLE' | 'FULL' | 'SCHEDULED' | 'RUNNING';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = true
}) => {
  const getColors = () => {
    switch (status) {
      case 'AVAILABLE':
        return {
          dot: 'bg-emerald-600',
          ping: 'bg-emerald-400',
          text: 'text-emerald-700 font-semibold',
          badge: 'bg-emerald-50 border-emerald-200/60 text-emerald-800'
        };
      case 'FULL':
        return {
          dot: 'bg-red-600',
          ping: 'bg-red-400',
          text: 'text-red-700 font-semibold',
          badge: 'bg-red-50 border-red-200/60 text-red-800'
        };
      case 'RUNNING':
        return {
          dot: 'bg-jklu-orange',
          ping: 'bg-orange-300',
          text: 'text-jklu-orange font-semibold',
          badge: 'bg-orange-50 border-orange-200/60 text-orange-800'
        };
      case 'SCHEDULED':
      default:
        return {
          dot: 'bg-stone-400',
          ping: 'bg-stone-300',
          text: 'text-stone-600 font-medium',
          badge: 'bg-stone-100 border-stone-200 text-stone-700'
        };
    }
  };

  const colors = getColors();
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
      <span className="relative flex items-center justify-center">
        {status === 'RUNNING' || status === 'AVAILABLE' ? (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${colors.ping}`}
          />
        ) : null}
        <span className={`relative inline-flex rounded-full ${dotSizes[size]} ${colors.dot}`} />
      </span>
      {showLabel && (
        <span className={colors.text}>
          {status}
        </span>
      )}
    </div>
  );
};
