import React from 'react';

interface ETAProps {
  minutes: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showUnit?: boolean;
}

export const ETA: React.FC<ETAProps> = ({
  minutes,
  size = 'md',
  className = '',
  showUnit = true
}) => {
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  if (size === 'hero') {
    return (
      <div className={`flex items-baseline gap-1.5 ${className}`}>
        <span className="font-editorial font-bold text-5xl tracking-tighter text-[#121316] leading-none">
          {formattedMinutes}
        </span>
        {showUnit && (
          <span className="font-editorial font-bold text-lg text-jklu-orange uppercase tracking-wider">
            MIN
          </span>
        )}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex items-baseline gap-1 ${className}`}>
        <span className="font-editorial font-bold text-3xl tracking-tight text-[#121316] leading-none">
          {formattedMinutes}
        </span>
        {showUnit && (
          <span className="font-editorial font-semibold text-xs text-jklu-orange uppercase tracking-wider">
            MIN
          </span>
        )}
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-baseline gap-0.5 ${className}`}>
        <span className="font-mono font-bold text-base text-[#121316] leading-none">
          {formattedMinutes}
        </span>
        {showUnit && (
          <span className="text-[10px] font-bold text-jklu-orange uppercase tracking-wider">
            M
          </span>
        )}
      </div>
    );
  }

  // Default 'md'
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="font-editorial font-bold text-2xl tracking-tight text-[#121316] leading-none">
        {formattedMinutes}
      </span>
      {showUnit && (
        <span className="font-editorial font-bold text-[11px] text-jklu-orange uppercase tracking-wider">
          MIN
        </span>
      )}
    </div>
  );
};
