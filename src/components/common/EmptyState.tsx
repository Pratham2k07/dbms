import React from 'react';
import { RotateCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'NO ACTIVE SHUTTLES',
  subtitle = 'There are currently no shuttles approaching this stop.',
  onRefresh
}) => {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
      {/* Minimal Shuttle Silhouette Illustration */}
      <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center mb-4 text-stone-400">
        <svg
          className="w-9 h-9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="13" rx="3" />
          <path d="M6 18v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
          <path d="M15 18v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
          <path d="M3 11h18" />
          <circle cx="7" cy="14" r="1" fill="currentColor" />
          <circle cx="17" cy="14" r="1" fill="currentColor" />
        </svg>
      </div>

      <h3 className="font-editorial font-bold text-lg text-[#121316] tracking-tight leading-snug uppercase mb-1">
        {title}
      </h3>

      <p className="text-xs text-stone-500 max-w-xs mb-6 leading-relaxed">
        {subtitle}
      </p>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-editorial font-semibold tracking-wider transition-colors shadow-subtle active:scale-95"
        >
          <RotateCw className="w-3.5 h-3.5 text-jklu-orange" />
          REFRESH
        </button>
      )}
    </div>
  );
};
