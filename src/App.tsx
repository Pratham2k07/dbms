import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNavigation } from './components/common/BottomNavigation';
import { ToastNotification } from './components/common/ToastNotification';
import { LocationLoadingScreen } from './screens/LocationLoadingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StopDetailsScreen } from './screens/StopDetailsScreen';
import { LiveTrackingScreen } from './screens/LiveTrackingScreen';
import { RouteDetailsScreen } from './screens/RouteDetailsScreen';
import { DriverDashboardScreen } from './screens/DriverDashboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Shield, User, LogOut } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    isDriverMode,
    setIsDriverMode,
    logoutUser,
    currentUserRole
  } = useApp();

  // Screen router
  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen />;
      case 'location-loading':
        return <LocationLoadingScreen />;
      case 'home':
        return <HomeScreen />;
      case 'stop-details':
        return <StopDetailsScreen />;
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
        { id: 'stop-details', label: '2. Stop Details' },
        { id: 'live-tracking', label: '3. Live Tracking' },
        { id: 'route-details', label: '4. Route Details' },
        { id: 'profile', label: '5. Profile' }
      ];

  // Initially only login portal appears (without navbar or other elements)
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
  const showMobileBottomNav = !isLoading && !isDriverMode;

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

          {/* Right: Authenticated User Status & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={logoutUser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-editorial font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all shadow-sm"
              title="Sign out to Login Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-orange-300" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Screen Selector Bar (for small phone screens) */}
        <div className="md:hidden overflow-x-auto no-scrollbar px-3 py-1.5 bg-[#2B4A7E]/95 border-t border-white/15 flex items-center gap-1">
          {screenItems.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentScreen(s.id as any);
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-editorial transition-all ${
                  isActive
                    ? 'bg-jklu-orange text-white font-bold shadow-sm'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Floating Active Alerts */}
      <ToastNotification />

      {/* Main Responsive Body */}
      <div className="flex-1 w-full bg-[#FBFBF9] flex flex-col">
        {!isLoading && <Header />}

        <main className="flex-1">
          {renderScreen()}
        </main>

        {/* Bottom Navigation for mobile viewports */}
        {showMobileBottomNav && (
          <div className="lg:hidden">
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
};
