import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  LogOut,
  ChevronDown,
  Bell,
  MapPin,
  Phone,
  Shield,
  CheckCircle2,
  ChevronRight,
  Settings
} from 'lucide-react';

export const ProfileDropdown: React.FC = () => {
  const {
    student,
    driver,
    currentUserRole,
    isDriverMode,
    logoutUser,
    setCurrentScreen,
    currentScreen
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [gpsActive, setGpsActive] = useState(true);
  const [alertsActive, setAlertsActive] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const isDriver = currentUserRole === 'driver' || isDriverMode;
  const displayName = isDriver ? driver.name : student.name.split(' ')[0];
  const fullName = isDriver ? driver.name : student.name;
  const initials = isDriver ? 'RK' : 'PL';
  const roleLabel = isDriver ? 'CAMPUS SHUTTLE DRIVER' : 'AUTHENTICATED STUDENT';
  const subInfo = isDriver ? driver.phone_number : student.roll_no;
  const emailInfo = isDriver ? 'ramesh.kumar@jklu.edu.in' : student.email;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button in place of Logout */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/25 transition-all shadow-sm select-none group"
        title="Account Profile & Settings Menu"
        aria-label="Toggle user profile menu"
        aria-expanded={isOpen}
      >
        {/* User Avatar Circle with Initials */}
        <div className="w-6 h-6 rounded-lg bg-white/25 border border-white/40 flex items-center justify-center font-editorial font-bold text-xs text-white shadow-xs group-hover:scale-105 transition-transform">
          {initials}
        </div>

        {/* User Name */}
        <div className="flex items-center gap-1.5">
          <span className="font-editorial font-bold text-xs tracking-wide text-white">
            {displayName}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </div>
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[92vw] bg-white rounded-3xl shadow-2xl border border-stone-200 z-50 overflow-hidden text-[#141518] animate-fadeIn select-none">
          {/* Identity Section */}
          <div className="p-4 bg-gradient-to-br from-[#2B4A7E]/5 via-[#486DA8]/10 to-[#6686C6]/5 border-b border-stone-100">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-[#2B4A7E] text-white">
                    {roleLabel}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active SSO Session" />
                </div>
                <h3 className="font-editorial font-bold text-lg text-[#121316] tracking-tight truncate">
                  {fullName}
                </h3>
                <p className="font-mono text-[11px] text-stone-500 truncate">
                  {emailInfo}
                </p>
                <div className="pt-0.5 flex items-center gap-2 text-[10px] font-mono text-stone-600">
                  <span>ID: <strong className="text-stone-800">{subInfo}</strong></span>
                  <span className="text-stone-300">•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    SSO Verified
                  </span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-editorial font-bold text-base text-[#2B4A7E] shrink-0 shadow-xs">
                {initials}
              </div>
            </div>
          </div>

          {/* Profile Sections & Quick Links */}
          <div className="p-3 space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 px-3 py-1">
              Profile Sections
            </div>

            {/* 1. View Full Profile & Settings Screen */}
            <button
              onClick={() => {
                setIsOpen(false);
                setCurrentScreen('profile');
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                currentScreen === 'profile'
                  ? 'bg-orange-50/80 border border-orange-200 text-jklu-orange font-bold'
                  : 'hover:bg-stone-50 text-stone-700 hover:text-[#121316]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-jklu-orange flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-editorial font-bold text-xs block">
                    Full Profile & Settings
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    Manage university preferences & pass
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            {/* 2. Preferences & Hardware: GPS Status */}
            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-editorial font-bold text-xs text-stone-800 block">
                    High-Precision GPS
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    {gpsActive ? 'Signal active (±3m)' : 'GPS Disabled'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGpsActive(!gpsActive)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  gpsActive ? 'bg-emerald-600' : 'bg-stone-200'
                }`}
                title="Toggle GPS accuracy"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                    gpsActive ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 3. Preferences: Shuttle Alerts */}
            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2B4A7E] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-editorial font-bold text-xs text-stone-800 block">
                    Approaching Alerts
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    {alertsActive ? '5-min arrival buzzer' : 'Alerts muted'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlertsActive(!alertsActive)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  alertsActive ? 'bg-jklu-orange' : 'bg-stone-200'
                }`}
                title="Toggle shuttle notifications"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                    alertsActive ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 4. Transport Helpline Quick Call */}
            <a
              href="tel:+911417107500"
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-editorial font-bold text-xs text-stone-800 block">
                    Campus Helpline
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 block">
                    +91 141 710 7500
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-full">
                CALL
              </span>
            </a>
          </div>

          {/* Sign Out Section */}
          <div className="p-3 border-t border-stone-100 bg-stone-50/50">
            <button
              onClick={() => {
                setIsOpen(false);
                logoutUser();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl text-red-600 hover:bg-red-50/80 active:bg-red-100 transition-all font-editorial font-bold text-xs group"
              title="Sign out of University Portal"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block">Sign Out of University Portal</span>
                  <span className="text-[10px] text-stone-400 font-normal block">
                    Return to Login Screen
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
