import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNavigation } from './components/common/BottomNavigation';
import { ToastNotification } from './components/common/ToastNotification';
import { SplashScreen } from './screens/SplashScreen';
import { LocationLoadingScreen } from './screens/LocationLoadingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StopDetailsScreen } from './screens/StopDetailsScreen';
import { LiveTrackingScreen } from './screens/LiveTrackingScreen';
import { RouteDetailsScreen } from './screens/RouteDetailsScreen';
import { DriverDashboardScreen } from './screens/DriverDashboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Radio, Shield, User } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    isDriverMode,
    setIsDriverMode,
    isSimulating
  } = useApp();

  // Screen router
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
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

  const isSplashOrLoading = currentScreen === 'splash' || currentScreen === 'location-loading';
  const showMobileBottomNav = !isSplashOrLoading && !isDriverMode;

  const screenItems = [
    { id: 'splash', label: '1. Splash' },
    { id: 'location-loading', label: '2. Location' },
    { id: 'home', label: '3. Home & Stops' },
    { id: 'stop-details', label: '4. Stop Details' },
    { id: 'live-tracking', label: '5. Live Tracking' },
    { id: 'route-details', label: '6. Route Details' },
    { id: 'driver-dashboard', label: '7. Driver Mode' },
    { id: 'profile', label: '8. Profile' }
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#141518] flex flex-col select-none font-sans">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#1A1B20] border-b border-stone-800 shadow-xl text-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Branding */}
          <div
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#121316] text-[#FBFBF9] border border-stone-700 flex items-center justify-center font-editorial font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-jklu-orange">JK</span>LU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial font-bold text-sm tracking-wide text-white leading-none">
                  JKLU SHUTTLE
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider mt-0.5">
                University Mobility Service
              </p>
            </div>
          </div>

          {/* Center: Horizontal Screen Selector Pill Bar */}
          <div className="hidden md:flex flex-1 items-center justify-center overflow-x-auto no-scrollbar py-1">
            <nav className="flex items-center gap-1 bg-[#121316]/90 p-1 rounded-xl border border-stone-800/90 shadow-inner">
              {screenItems.map((s) => {
                const isActive = currentScreen === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.id === 'driver-dashboard') {
                        setIsDriverMode(true);
                      } else {
                        setIsDriverMode(false);
                      }
                      setCurrentScreen(s.id as any);
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-editorial transition-all ${
                      isActive
                        ? 'bg-jklu-orange text-white font-bold shadow-sm'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Mode & System Status */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mode Switcher: Student vs Driver */}
            <button
              onClick={() => {
                const next = !isDriverMode;
                setIsDriverMode(next);
                if (next) {
                  setCurrentScreen('driver-dashboard');
                } else {
                  setCurrentScreen('home');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-editorial font-medium border transition-all ${
                isDriverMode
                  ? 'bg-jklu-orange text-white border-orange-500 font-bold shadow-sm'
                  : 'bg-[#121316] text-stone-300 border-stone-700 hover:border-stone-500'
              }`}
            >
              {isDriverMode ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Driver Mode</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>Student Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Screen Selector Bar (for small phone screens) */}
        <div className="md:hidden overflow-x-auto no-scrollbar px-4 py-1.5 bg-[#121316] border-t border-stone-800 flex items-center gap-1">
          {screenItems.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id === 'driver-dashboard') {
                    setIsDriverMode(true);
                  } else {
                    setIsDriverMode(false);
                  }
                  setCurrentScreen(s.id as any);
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-editorial ${
                  isActive ? 'bg-jklu-orange text-white font-bold' : 'text-stone-400'
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
        {!isSplashOrLoading && <Header />}

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
