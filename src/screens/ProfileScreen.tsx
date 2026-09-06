import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  MapPin,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Phone,
  Shield,
  LogOut
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    student,
    setIsDriverMode,
    setCurrentScreen,
    resetSimulation,
    triggerNotification,
    logoutUser
  } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-24 lg:pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 space-y-6">
        {/* Editorial Heading */}
        <section className="space-y-1 border-b border-stone-200/80 pb-4">
          <span className="font-editorial font-bold text-xs tracking-widest text-jklu-orange uppercase">
            JKLU DIGITAL SERVICES
          </span>
          <h1 className="font-editorial font-black text-3xl sm:text-4xl text-[#121316] tracking-tight leading-none uppercase">
            STUDENT PROFILE & SETTINGS
          </h1>
        </section>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 6 cols) - Identity & Preferences */}
          <div className="lg:col-span-6 space-y-5">
            {/* Student Identity Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="font-editorial font-bold text-2xl text-[#121316] tracking-tight">
                    {student.name}
                  </h2>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#121316] text-[#FBFBF9]">
                    AUTHENTICATED STUDENT
                  </span>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center font-editorial font-bold text-lg text-stone-700">
                  PL
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                    ROLL NUMBER
                  </span>
                  <p className="font-mono font-semibold text-sm text-[#121316]">
                    {student.roll_no}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                    UNIVERSITY EMAIL
                  </span>
                  <p className="font-mono text-xs text-stone-600 truncate">
                    {student.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Group */}
            <div className="space-y-3">
              <span className="font-editorial font-bold text-xs tracking-widest text-stone-400 uppercase block px-1">
                PREFERENCES & HARDWARE
              </span>

              <div className="rounded-3xl bg-white border border-stone-200 divide-y divide-stone-100 shadow-subtle overflow-hidden text-sm">
                {/* Location Toggle */}
                <div className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-stone-500" />
                    <div>
                      <span className="font-medium text-[#121316] block">High-Precision GPS Location</span>
                      <p className="text-xs text-stone-400">Used to sort nearest campus stops</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocationEnabled(!locationEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      locationEnabled ? 'bg-jklu-orange' : 'bg-stone-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${
                        locationEnabled ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Notifications Toggle */}
                <div className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-stone-500" />
                    <div>
                      <span className="font-medium text-[#121316] block">Approaching Shuttle Alerts</span>
                      <p className="text-xs text-stone-400">Notifies when shuttle is 5 min away</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      notificationsEnabled ? 'bg-jklu-orange' : 'bg-stone-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${
                        notificationsEnabled ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Help & Support */}
                <div
                  onClick={() => setShowSupportModal(true)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-stone-500" />
                    <div>
                      <span className="font-medium text-[#121316] block">Transport Desk & Campus Helpline</span>
                      <p className="text-xs text-stone-400">Official university transport contact numbers</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </div>

                {/* Sign Out to Login Screen */}
                <div
                  onClick={logoutUser}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-red-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-medium text-red-600 block">Sign Out of University Portal</span>
                      <p className="text-xs text-stone-400">Return to Login Screen to switch accounts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-red-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (PC: 6 cols) - Viva / Faculty Demonstration Panel */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-6 rounded-3xl bg-stone-100/90 border border-stone-200 shadow-subtle space-y-4">
              <div className="space-y-1">
                <span className="font-editorial font-bold text-xs tracking-widest text-jklu-orange uppercase block">
                  FACULTY & VIVA EVALUATION CONTROLS
                </span>
                <h3 className="font-editorial font-bold text-lg text-[#121316]">
                  Simulation & State Controls
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Test and showcase real-time database synchronization, driver actions, alert broadcasting, and multi-route tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    triggerNotification(
                      'JKLU SHUTTLE',
                      'Shuttle 01 has arrived at Main Gate bus bay.',
                      'approaching'
                    );
                  }}
                  className="py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-editorial font-bold tracking-wider uppercase transition-all shadow-subtle text-left"
                >
                  Trigger Arrival Notice
                </button>

                <button
                  onClick={resetSimulation}
                  className="py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-editorial font-bold tracking-wider uppercase transition-all shadow-subtle flex items-center justify-between"
                >
                  <span>Reset All Telemetry</span>
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                </button>

                <button
                  onClick={() => {
                    setIsDriverMode(true);
                    setCurrentScreen('driver-dashboard');
                  }}
                  className="py-3 px-4 rounded-2xl bg-[#121316] text-white text-xs font-editorial font-bold tracking-wider uppercase transition-all shadow-subtle flex items-center justify-between"
                >
                  <span>Driver Interface</span>
                  <Shield className="w-3.5 h-3.5 text-jklu-orange" />
                </button>
              </div>
            </div>

            {/* Campus Control Room Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-3">
              <span className="font-editorial font-bold text-xs tracking-widest text-stone-400 uppercase block">
                CENTRAL CONTROL ROOM
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                JK Lakshmipat University, Near Mahindra SEZ, P.O. Mahapura, Ajmer Road, Jaipur, Rajasthan 302026
              </p>
              <div className="pt-2 flex items-center gap-2 font-mono text-xs text-jklu-orange font-bold">
                <Phone className="w-4 h-4" />
                <span>+91 141 710 7500 • transport@jklu.edu.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* University Transport Desk Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="font-editorial font-bold text-lg text-[#121316] uppercase">
                  JKLU Transport Helpline
                </h3>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-600">
                <p>
                  For bus pass enquiries, route schedules, or transport support along the Ajmer Road / Jaipur corridor:
                </p>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-800 block uppercase">
                    Central Campus Control Room
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-jklu-orange font-bold text-sm">
                    <Phone className="w-4 h-4" />
                    <span>+91 141 710 7500</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    Hours: 07:30 AM – 08:30 PM (Daily)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-800 block uppercase">
                    Official Support Email
                  </span>
                  <span className="font-mono text-stone-700 block">
                    transport@jklu.edu.in
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full py-3 rounded-2xl bg-[#121316] text-white font-editorial font-bold text-xs uppercase tracking-wider"
              >
                Close Helpline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
