import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { ToastNotification } from './components/common/ToastNotification';
import { LocationLoadingScreen } from './screens/LocationLoadingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StopDetailsScreen } from './screens/StopDetailsScreen';
import { LiveTrackingScreen } from './screens/LiveTrackingScreen';
import { RouteDetailsScreen } from './screens/RouteDetailsScreen';
import { DriverDashboardScreen } from './screens/DriverDashboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProfileDropdown } from './components/navigation/ProfileDropdown';
import { Shield, User, LogOut, Menu, X } from 'lucide-react';

import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginScreen } from './screens/admin/AdminLoginScreen';

export const App: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    isDriverMode,
    setIsDriverMode,
    logoutUser,
    currentUserRole
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect /admin in path or hash
  const [isAdminPath, setIsAdminPath] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/admin') || hash.includes('admin');
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsAdminPath(path.startsWith('/admin') || hash.includes('admin'));
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Screen router
  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen />;
      case 'location-loading':
        return <LocationLoadingScreen />;
      case 'home':
      case 'stop-details':
        return <HomeScreen />;
      case 'live-tracking':
        return <LiveTrackingScreen />;
      case 'route-details':
        return <RouteDetailsScreen />;
      case 'driver-dashboard':
        return <DriverDashboardScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const screenItems = isDriverMode
    ? [
        { id: 'driver-dashboard', label: '1. Driver Dashboard' }
      ]
    : [
        { id: 'home', label: '1. Home & Map' },
        { id: 'live-tracking', label: '2. Live Tracking' },
        { id: 'route-details', label: '3. Route Details' }
      ];

  // 1. When logged in as Admin, render dedicated Admin Portal Control Center
  if (currentUserRole === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <ToastNotification />
        <AdminLayout />
      </div>
    );
  }

  // 2. When user navigates to /admin (or #admin) while not authenticated, show Admin Login
  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-[#0F1E36]">
        <ToastNotification />
        <AdminLoginScreen />
      </div>
    );
  }

  // 3. Regular root / login portal (Student & Driver only)
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex flex-col justify-center select-none font-sans">
        <ToastNotification />
        <main className="flex-1 flex flex-col justify-center">
          <LoginScreen />
        </main>
      </div>
    );
  }

  const isLoading = currentScreen === 'location-loading';

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#141518] flex flex-col select-none font-sans">
      {/* Top Global Navigation Bar - Revealed After Login */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#2B4A7E] via-[#486DA8] to-[#6686C6] border-b border-white/20 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Branding */}
          <div
            onClick={() => setCurrentScreen(isDriverMode ? 'driver-dashboard' : 'home')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            {/* Official JKLU University Logo */}
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-white/50 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img src="/jklu-logo.png" alt="JKLU Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-editorial font-bold text-sm sm:text-base tracking-wide text-white leading-none">
                JKLU SHUTTLE
              </h1>
            </div>
          </div>

          {/* Center: Horizontal Screen Selector Pill Bar */}
          <div className="hidden md:flex flex-1 items-center justify-center overflow-x-auto no-scrollbar py-1">
            <nav className="flex items-center gap-1 bg-[#243B66]/45 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-inner">
              {screenItems.map((s) => {
                const isActive = currentScreen === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentScreen(s.id as any);
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-editorial transition-all ${
                      isActive
                        ? 'bg-jklu-orange text-white font-bold shadow-md ring-1 ring-white/40'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Profile Dropdown in place of standalone Logout + 3-Lines Menu (Mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Profile Dropdown Menu */}
            <ProfileDropdown />

            {/* Mobile 3-Lines Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/25 transition-all shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white transition-transform duration-200" />
              ) : (
                <Menu className="w-5 h-5 text-white transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (revealed when 3-lines hamburger is clicked) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-[#243B66]/95 backdrop-blur-xl px-4 py-3 space-y-1.5 shadow-2xl transition-all">
            <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200 px-2 pb-1">
              Navigation Menu
            </div>
            {screenItems.map((s) => {
              const isActive = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentScreen(s.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-editorial font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-jklu-orange text-white shadow-md ring-1 ring-white/30'
                      : 'text-white/85 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <span>{s.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}

            {/* Mobile Profile & Logout inside Dropdown */}
            <div className="pt-2 mt-2 border-t border-white/15 space-y-1">
              <button
                onClick={() => {
                  setCurrentScreen('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-editorial font-bold transition-all flex items-center gap-2 ${
                  currentScreen === 'profile'
                    ? 'bg-jklu-orange text-white shadow-md'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-blue-200" />
                <span>My Profile & Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logoutUser();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-editorial font-bold text-orange-200 hover:bg-white/15 hover:text-white flex items-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4 text-orange-400" />
                <span>Sign Out ({currentUserRole === 'driver' ? 'Driver' : 'Student'})</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Floating Active Alerts */}
      <ToastNotification />

      {/* Main Responsive Body */}
      <div className="flex-1 w-full bg-[#FBFBF9] flex flex-col">
        <main className="flex-1">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};
