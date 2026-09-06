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
      {/* Top Global Navigation Bar - Official JKLU Blue, Orange & White Theme */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#2B4A7E] via-[#486DA8] to-[#6686C6] border-b border-white/20 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Branding */}
          <div
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            {/* Crisp White Emblem with Orange & Deep Blue */}
            <div className="w-9 h-9 rounded-xl bg-white text-[#2B4A7E] border border-white/40 flex items-center justify-center font-editorial font-black text-xs shadow-md group-hover:scale-105 transition-transform">
              <span className="text-jklu-orange">JK</span>LU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial font-bold text-sm sm:text-base tracking-wide text-white leading-none">
                  JKLU SHUTTLE
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-blue-100/90 font-mono uppercase tracking-wider mt-0.5">
                University Mobility Service
              </p>
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
                      if (s.id === 'driver-dashboard') {
                        setIsDriverMode(true);
                      } else {
                        setIsDriverMode(false);
                      }
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-editorial font-semibold border transition-all ${
                isDriverMode
                  ? 'bg-jklu-orange text-white border-white/30 shadow-md font-bold'
                  : 'bg-white text-[#2B4A7E] border-white/60 hover:bg-blue-50 shadow-sm'
              }`}
            >
              {isDriverMode ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Driver Mode</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-[#2B4A7E]" />
                  <span>Student Mode</span>
                </>
              )}
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
                  if (s.id === 'driver-dashboard') {
                    setIsDriverMode(true);
                  } else {
                    setIsDriverMode(false);
                  }
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
