import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isDriverMode,
    setCurrentScreen,
    notifications,
    dismissNotification
  } = useApp();

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100/80 shadow-sm transition-all">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Section */}
        <div
          onClick={() => {
            if (isDriverMode) {
              setCurrentScreen('driver-dashboard');
            } else {
              setCurrentScreen('home');
            }
          }}
          className="cursor-pointer group flex items-center gap-2.5"
        >
          {/* Official JKLU University Logo */}
          <div className="w-9 h-9 rounded-xl bg-white p-1 border border-blue-100/90 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden shrink-0">
            <img src="/jklu-logo.png" alt="JKLU Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial font-bold text-[14px] tracking-tight text-[#2B4A7E] leading-none">
                JKLU SHUTTLE
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-jklu-orange animate-pulse" />
            </div>
            <p className="text-[10px] text-[#4F70B0] font-medium tracking-wide uppercase mt-0.5">
              University Mobility
            </p>
          </div>
        </div>

        {/* Action Controls: Notifications Alert Bell */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-2 rounded-full hover:bg-blue-50 text-[#2B4A7E] transition-colors"
            title="Official Announcements & Notices"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-jklu-orange ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div className="fixed inset-x-0 top-[52px] z-50 p-4 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="font-editorial font-bold text-xs uppercase tracking-wider text-stone-800">
                Official Shuttle Broadcasts
              </span>
              <button
                onClick={() => setShowNotifDrawer(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center">No active service notices.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-[#FBFBF9] border border-stone-200 text-xs relative flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-jklu-orange uppercase tracking-wider">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">{n.timestamp}</span>
                    </div>
                    <p className="text-stone-700 leading-snug">{n.message}</p>
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="self-end text-[10px] text-stone-400 hover:text-stone-600 underline mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
