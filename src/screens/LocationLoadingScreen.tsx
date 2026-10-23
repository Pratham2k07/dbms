import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, CheckCircle2, AlertCircle, Navigation } from 'lucide-react';
import { locationService } from '../services/locationService';

export const LocationLoadingScreen: React.FC = () => {
  const { setCurrentScreen, studentLocation, updateStudentLocation } = useApp();
  const [phase, setPhase] = useState<'requesting' | 'locating' | 'ready' | 'denied'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestActualLocation = async () => {
    setPhase('locating');
    setErrorMessage(null);
    try {
      const loc = await locationService.getCurrentLocation();
      updateStudentLocation(loc);
      setPhase('ready');
      setTimeout(() => {
        setCurrentScreen('home');
      }, 1000);
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setPhase('denied');
      setErrorMessage(err.message || 'Permission denied or GPS unavailable.');
    }
  };

  useEffect(() => {
    requestActualLocation();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FBFBF9] flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full pt-2 flex items-center justify-between">
        <span className="font-editorial font-bold text-xs tracking-widest text-stone-400 uppercase">
          LOCATION SERVICES // SATELLITE TELEMETRY
        </span>
        <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
          phase === 'ready'
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : phase === 'denied'
            ? 'text-red-700 bg-red-50 border-red-200'
            : 'text-amber-700 bg-amber-50 border-amber-200'
        }`}>
          {phase === 'ready' ? 'GPS ACCURATE (PERMITTED)' : phase === 'denied' ? 'PERMISSION REQUIRED' : 'REQUESTING GPS FIX'}
        </span>
      </div>

      {/* Main Body */}
      <div className="my-auto max-w-lg mx-auto w-full space-y-8">
        {/* Editorial Heading */}
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="font-editorial font-extrabold text-4xl sm:text-5xl text-[#121316] tracking-tight leading-none uppercase">
            {phase === 'denied' ? 'ALLOW GPS ACCESS' : 'ACQUIRING YOUR LOCATION'}
          </h1>
          <p className="text-sm sm:text-base text-stone-500 font-medium leading-relaxed">
            {phase === 'denied'
              ? 'Real-time road distances and dynamic nearby stop calculations require device location permission.'
              : 'Requesting device satellite fix to calculate nearby stops and walking proximity.'}
          </p>
        </div>

        {/* Minimal Animated Visual */}
        <div className="relative w-full aspect-square max-h-80 bg-[#F4F3EE] rounded-3xl border border-stone-200/90 overflow-hidden flex items-center justify-center p-6 shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E3DB_1px,transparent_1px),linear-gradient(to_bottom,#E5E3DB_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative z-10 flex flex-col items-center">
            {phase === 'denied' ? (
              <div className="relative w-16 h-16 rounded-full bg-red-100 border-2 border-red-400 text-red-600 flex items-center justify-center shadow-md">
                <AlertCircle className="w-8 h-8" />
              </div>
            ) : (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-blue-500/15 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full bg-blue-500/25 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-[#121316] text-[#FBFBF9] border-2 border-white flex items-center justify-center shadow-float">
                  <Navigation className="w-6 h-6 text-jklu-orange animate-pulse" />
                </div>
              </>
            )}

            <div className="mt-4 px-3 py-1 rounded-full bg-[#121316] text-[#FBFBF9] text-xs font-mono font-bold tracking-wider shadow-sm">
              {phase === 'ready'
                ? `📍 ${studentLocation?.latitude.toFixed(4)}, ${studentLocation?.longitude.toFixed(4)}`
                : phase === 'denied'
                ? '📍 Geolocation Denied'
                : '📍 Interrogating device GPS...'}
            </div>
          </div>
        </div>

        {/* Phase Status Readout */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
          {phase === 'ready' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : phase === 'denied' ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full border-2 border-jklu-orange border-t-transparent animate-spin shrink-0" />
          )}

          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-editorial font-bold text-stone-800 uppercase tracking-wide block">
              {phase === 'locating'
                ? 'Awaiting browser permission and GPS fix...'
                : phase === 'ready'
                ? 'Location verified and stored. Loading transit feed...'
                : 'Permission Required'}
            </span>
            <span className="text-[11px] text-stone-400 font-mono">
              {errorMessage || 'High accuracy satellite positioning'}
            </span>
          </div>
        </div>

        {phase === 'denied' && (
          <div className="space-y-2">
            <button
              onClick={requestActualLocation}
              className="w-full py-3.5 px-4 rounded-2xl bg-jklu-orange hover:bg-orange-600 text-white font-editorial font-bold text-xs tracking-widest uppercase transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>ALLOW LOCATION PERMISSION</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Skip Action */}
      <div className="pb-4 max-w-sm mx-auto w-full text-center">
        <button
          onClick={() => setCurrentScreen('home')}
          className="text-xs font-editorial font-semibold tracking-wider text-stone-500 hover:text-stone-800 underline uppercase"
        >
          Continue with Campus Transit Map →
        </button>
      </div>
    </div>
  );
};
