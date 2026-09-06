import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, CheckCircle2 } from 'lucide-react';

export const LocationLoadingScreen: React.FC = () => {
  const { setCurrentScreen, studentLocation } = useApp();
  const [phase, setPhase] = useState<'locating' | 'connecting' | 'ready'>('locating');

  useEffect(() => {
    // Phase 1: Locating (0 - 1.2s)
    const t1 = setTimeout(() => {
      setPhase('connecting');
    }, 1200);

    // Phase 2: Connecting nearby stops (1.2s - 2.4s)
    const t2 = setTimeout(() => {
      setPhase('ready');
    }, 2400);

    // Phase 3: Transition to Home
    const t3 = setTimeout(() => {
      setCurrentScreen('home');
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [setCurrentScreen]);

  return (
    <div className="relative min-h-screen bg-[#FBFBF9] flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full pt-2 flex items-center justify-between">
        <span className="font-editorial font-bold text-xs tracking-widest text-stone-400 uppercase">
          LOCATION SERVICES // SATELLITE TELEMETRY
        </span>
        <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          SIGNAL ACCURATE (±3M)
        </span>
      </div>

      {/* Main Body */}
      <div className="my-auto max-w-lg mx-auto w-full space-y-8">
        {/* Editorial Heading */}
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="font-editorial font-extrabold text-4xl sm:text-5xl text-[#121316] tracking-tight leading-none uppercase">
            FINDING
            <br />
            YOUR LOCATION
          </h1>
          <p className="text-sm sm:text-base text-stone-500 font-medium leading-relaxed">
            We are locating the nearest
            <br />
            JKLU shuttle stops.
          </p>
        </div>

        {/* Minimal Animated Map Grid Visual */}
        <div className="relative w-full aspect-square max-h-80 bg-[#F4F3EE] rounded-3xl border border-stone-200/90 overflow-hidden flex items-center justify-center p-6 shadow-inner">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E3DB_1px,transparent_1px),linear-gradient(to_bottom,#E5E3DB_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Animated Connecting Vector Lines */}
          <svg className="absolute inset-0 w-full h-full">
            {phase !== 'locating' && (
              <>
                {/* Connecting to Main Gate */}
                <line
                  x1="50%"
                  y1="50%"
                  x2="28%"
                  y2="30%"
                  stroke="#E8590C"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  className="animate-pulse"
                />
                {/* Connecting to Hostel Gate */}
                <line
                  x1="50%"
                  y1="50%"
                  x2="72%"
                  y2="38%"
                  stroke="#2B4C7E"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  className="animate-pulse"
                />
                {/* Connecting to Campus */}
                <line
                  x1="50%"
                  y1="50%"
                  x2="60%"
                  y2="78%"
                  stroke="#121316"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              </>
            )}
          </svg>

          {/* Connected Nearby Stops Pins */}
          {phase !== 'locating' && (
            <>
              {/* Stop 1: Mansarovar Metro */}
              <div className="absolute top-[28%] left-[26%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-fadeIn">
                <div className="w-3.5 h-3.5 rounded-full bg-jklu-orange border-2 border-white shadow-sm" />
                <span className="text-[10px] font-editorial font-bold text-stone-700 mt-1 bg-white/90 px-2 py-0.5 rounded shadow-subtle whitespace-nowrap">
                  MANSAROVAR METRO
                </span>
              </div>

              {/* Stop 2: DCM (Ajmer Road) */}
              <div className="absolute top-[36%] right-[24%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-fadeIn">
                <div className="w-3.5 h-3.5 rounded-full bg-jklu-blue border-2 border-white shadow-sm" />
                <span className="text-[10px] font-editorial font-bold text-stone-700 mt-1 bg-white/90 px-2 py-0.5 rounded shadow-subtle whitespace-nowrap">
                  DCM (AJMER RD)
                </span>
              </div>

              {/* Destination: JKLU Campus */}
              <div className="absolute bottom-[20%] right-[36%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-fadeIn">
                <div className="px-2 py-1 rounded bg-[#121316] border border-jklu-orange text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                  JKLU CAMPUS
                </div>
              </div>
            </>
          )}

          {/* Central Pulsing Student Location Marker */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Outer expanding pulsing wave */}
            <div className="absolute w-28 h-28 rounded-full bg-jklu-blue/15 animate-ping" />
            <div className="absolute w-20 h-20 rounded-full bg-jklu-blue/25 animate-pulse" />

            {/* Core Pin */}
            <div className="relative w-12 h-12 rounded-full bg-[#121316] text-[#FBFBF9] border-2 border-white flex items-center justify-center shadow-float">
              <MapPin className="w-6 h-6 text-jklu-orange" />
            </div>

            <div className="mt-3 px-3 py-1 rounded-full bg-[#121316] text-[#FBFBF9] text-xs font-mono font-bold tracking-wider shadow-sm">
              📍 {studentLocation.location_name}
            </div>
          </div>
        </div>

        {/* Phase Status Readout */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
          {phase === 'ready' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full border-2 border-jklu-orange border-t-transparent animate-spin shrink-0" />
          )}

          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-editorial font-bold text-stone-800 uppercase tracking-wide block">
              {phase === 'locating'
                ? 'Acquiring GPS fix...'
                : phase === 'connecting'
                ? 'Calculating walking distances & approaching shuttles...'
                : 'Stops identified. Loading transit feed...'}
            </span>
            <span className="text-[11px] text-stone-400 font-mono">
              Coordinates: {studentLocation.latitude.toFixed(4)}° N, {studentLocation.longitude.toFixed(4)}° E
            </span>
          </div>
        </div>
      </div>

      {/* Footer Skip Action */}
      <div className="pb-4 max-w-sm mx-auto w-full text-center">
        <button
          onClick={() => setCurrentScreen('home')}
          className="text-xs font-editorial font-semibold tracking-wider text-stone-500 hover:text-stone-800 underline uppercase"
        >
          Skip to Home View →
        </button>
      </div>
    </div>
  );
};
