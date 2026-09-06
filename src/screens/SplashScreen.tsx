import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Compass } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    // Subtle route line completion animation
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    // Transition automatically to Location Loading after completion
    const timer = setTimeout(() => {
      setCurrentScreen('location-loading');
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [setCurrentScreen]);

  return (
    <div className="relative min-h-screen bg-[#FBFBF9] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* Background Architectural Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#E5E3DB_1px,transparent_1px)] [background-size:28px_28px] opacity-60 pointer-events-none" />

      {/* Top University Branding Bar */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#121316] text-[#FBFBF9] flex items-center justify-center font-editorial font-bold text-xs shadow-sm">
            <span className="text-jklu-orange">JK</span>LU
          </div>
          <div>
            <span className="text-xs font-editorial font-bold tracking-wider text-stone-700 uppercase block">
              JK Lakshmipat University
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Jaipur, Rajasthan</span>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full border border-stone-200 bg-white text-[11px] font-mono font-medium text-stone-600 shadow-subtle">
          OFFICIAL DIGITAL SERVICE
        </div>
      </div>

      {/* Center Content: Bold Editorial Typography & Animated Route Symbol */}
      <div className="relative z-10 my-auto py-12 max-w-xl mx-auto w-full text-center space-y-8">
        {/* Modern Minimal Shuttle Geometric Emblem */}
        <div className="w-24 h-24 mx-auto rounded-3xl bg-[#121316] text-white flex items-center justify-center border-2 border-stone-800 shadow-xl relative group">
          <svg
            className="w-12 h-12 text-[#FBFBF9]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="15" rx="3.5" />
            <path d="M7 19v2" />
            <path d="M17 19v2" />
            <path d="M3 11h18" stroke="#E8590C" strokeWidth="2" />
            <circle cx="7.5" cy="15" r="1.25" fill="#E8590C" />
            <circle cx="16.5" cy="15" r="1.25" fill="#E8590C" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-jklu-orange ring-4 ring-[#FBFBF9] animate-pulse" />
        </div>

        {/* Brand Headings */}
        <div className="space-y-2">
          <h1 className="font-editorial font-black text-5xl sm:text-6xl tracking-tighter text-[#121316] leading-none">
            JKLU
            <br />
            <span className="text-jklu-orange">SHUTTLE</span>
          </h1>
          <p className="font-editorial font-semibold text-xs sm:text-sm tracking-widest text-stone-500 uppercase pt-2">
            University Shuttle Tracking System
          </p>
          <p className="text-xs text-stone-400 font-mono">
            Campus Transit & Real-Time Telemetry
          </p>
        </div>

        {/* Minimal Animated Route Line with moving shuttle */}
        <div className="pt-4 px-6 sm:px-12 space-y-3">
          <div className="relative w-full h-8 flex items-center">
            {/* Base gray path */}
            <div className="w-full h-1.5 bg-stone-200 rounded-full" />
            {/* Orange progress path */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-jklu-orange rounded-full transition-all duration-75"
              style={{ width: `${animationProgress}%` }}
            />
            {/* Start Node */}
            <div className="absolute left-0 w-3.5 h-3.5 rounded-full bg-stone-800 ring-2 ring-white" />
            {/* Moving Shuttle icon */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75"
              style={{ left: `${animationProgress}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-jklu-orange text-white flex items-center justify-center shadow-md">
                <span className="text-[10px] font-bold">🚌</span>
              </div>
            </div>
            {/* Destination Node: Campus */}
            <div className="absolute right-0 w-4 h-4 rounded bg-[#121316] border border-jklu-orange ring-2 ring-white flex items-center justify-center text-[7px] text-white font-bold" />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>CITY TERMINAL</span>
            <span className="text-jklu-orange font-bold">ESTABLISHING GPS LINK</span>
            <span>JKLU CAMPUS</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="relative z-10 pb-4 max-w-sm mx-auto w-full space-y-3 text-center">
        <button
          onClick={() => setCurrentScreen('location-loading')}
          className="w-full py-4 px-6 rounded-2xl bg-[#121316] text-[#FBFBF9] hover:bg-black font-editorial font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-float transition-transform active:scale-[0.99]"
        >
          <span>ENTER SERVICE</span>
          <ArrowRight className="w-4 h-4 text-jklu-orange" />
        </button>

        <p className="text-[10px] text-stone-400 font-mono">
          An official JKLU Digital Service • Production Release
        </p>
      </div>
    </div>
  );
};
