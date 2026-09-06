import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  return (
    <div className="space-y-2 w-full animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-stone-200/80 rounded ${
            i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
          } ${className}`}
        />
      ))}
    </div>
  );
};
