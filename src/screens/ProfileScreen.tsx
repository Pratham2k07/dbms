import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  MapPin,
  HelpCircle,
  ChevronRight,
  Phone,
  LogOut
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { student, logoutUser } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-24 lg:pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 space-y-6">
        {/* Editorial Heading */}
        <section className="border-b border-stone-200/80 pb-4">
          <h1 className="font-editorial font-black text-3xl sm:text-4xl text-[#121316] tracking-tight leading-none uppercase">
            STUDENT PROFILE & SETTINGS
          </h1>
        </section>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 7 cols) - Identity & Preferences */}
          <div className="lg:col-span-7 space-y-5">
            {/* Student Identity Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="font-editorial font-bold text-2xl text-[#121316] tracking-tight">
                    {student.name}
                  </h2>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#2B4A7E] text-white">
                    AUTHENTICATED STUDENT
                  </span>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-editorial font-bold text-lg text-[#2B4A7E]">
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

          {/* Right Column (PC: 5 cols) - Campus Control Room & Transport Support */}
          <div className="lg:col-span-5 space-y-5">
            {/* Campus Control Room Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-4">
              <div className="space-y-1">
                <span className="font-editorial font-bold text-xs tracking-widest text-[#2B4A7E] uppercase block">
                  CENTRAL TRANSPORT DESK
                </span>
                <h3 className="font-editorial font-bold text-lg text-[#121316]">
                  Campus Operations & Helpline
                </h3>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                JK Lakshmipat University, Near Mahindra SEZ, P.O. Mahapura, Ajmer Road, Jaipur, Rajasthan 302026
              </p>

              <div className="p-4 rounded-2xl bg-[#EDF3FC] border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-[#2B4A7E] font-bold">
                  <Phone className="w-4 h-4 text-jklu-orange" />
                  <span>+91 141 710 7500</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Email: <span className="font-mono text-stone-700">transport@jklu.edu.in</span>
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  Operating Hours: 07:30 AM – 08:30 PM (Daily)
                </p>
              </div>

              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#2B4A7E] hover:bg-[#20375E] text-white font-editorial font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>View Full Support Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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
                className="w-full py-3 rounded-2xl bg-[#2B4A7E] text-white font-editorial font-bold text-xs uppercase tracking-wider"
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
