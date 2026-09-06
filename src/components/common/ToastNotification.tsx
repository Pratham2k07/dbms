import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { notifications, dismissNotification } = useApp();
  const activeNotice = notifications[0];

  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDismissing, setIsDismissing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const dismissThreshold = 75; // px to trigger dismissal

  // Auto-dismiss timer (6 seconds)
  useEffect(() => {
    if (!activeNotice || isPaused) return;

    const timer = setTimeout(() => {
      triggerDismiss('right');
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeNotice?.id, isPaused]);

  if (!activeNotice) return null;

  const triggerDismiss = (direction: 'left' | 'right') => {
    setIsDismissing(true);
    setDragOffset(direction === 'right' ? 400 : -400);
    setTimeout(() => {
      dismissNotification(activeNotice.id);
      setIsDismissing(false);
      setDragOffset(0);
    }, 250);
  };

  // Touch Handlers for Mobile Swipe/Slide
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setIsDragging(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Primarily horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPaused(false);
    if (Math.abs(dragOffset) > dismissThreshold) {
      triggerDismiss(dragOffset > 0 ? 'right' : 'left');
    } else {
      // Snap back if threshold not met
      setDragOffset(0);
    }
  };

  const getIcon = () => {
    switch (activeNotice.type) {
      case 'approaching':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'full':
        return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'delay':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-orange-400 shrink-0" />;
    }
  };

  // Opacity decreases as user drags
  const opacity = Math.max(0.2, 1 - Math.abs(dragOffset) / 300);

  return (
    <aside
      aria-label="Campus Alert Notification"
      className="fixed top-14 sm:top-16 inset-x-3 sm:inset-x-4 z-50 max-w-sm sm:max-w-md mx-auto pointer-events-auto transition-all"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          transform: `translateX(${dragOffset}px)`,
          opacity: opacity,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s'
        }}
        className="relative overflow-hidden bg-gradient-to-r from-[#1E365D] to-[#2B4A7E] text-white rounded-2xl p-3.5 shadow-2xl border border-white/20 backdrop-blur-md cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-start gap-3">
          {/* Leading Alert Icon */}
          <div className="mt-0.5 p-1 rounded-lg bg-white/10 border border-white/10 shrink-0">
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-editorial font-bold text-[11px] tracking-wider text-orange-300 uppercase truncate">
                {activeNotice.title}
              </span>
              <span className="text-[9px] text-blue-200/80 font-mono shrink-0">
                {activeNotice.timestamp}
              </span>
            </div>

            <p className="text-xs text-white/95 mt-0.5 leading-snug font-medium">
              {activeNotice.message}
            </p>
          </div>

          {/* Prominent Tap/Click Cross Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerDismiss('right');
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 active:bg-white/35 text-white/90 hover:text-white transition-all shrink-0 border border-white/15"
            title="Dismiss notification (or slide away)"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Countdown Progress Bar */}
        {!isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15 overflow-hidden">
            <div
              className="h-full bg-jklu-orange transition-all ease-linear"
              style={{
                animation: 'shrinkWidth 6s linear forwards'
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </aside>
  );
};
