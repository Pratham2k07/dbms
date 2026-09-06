import React from 'react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types/ui';
import { Compass, Navigation, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, setCurrentScreen, isDriverMode } = useApp();

  // If in driver mode, student navigation can still be accessed or driver returns to dashboard
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        setCurrentScreen('home');
        break;
      case 'track':
        setCurrentScreen('live-tracking');
        break;
      case 'profile':
        setCurrentScreen('profile');
        break;
    }
  };

  const navItems: { tab: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'home', label: 'HOME', icon: Compass },
    { tab: 'track', label: 'TRACK', icon: Navigation },
    { tab: 'profile', label: 'PROFILE', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-blue-100/90 shadow-md pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab && !isDriverMode;
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              onClick={() => handleTabClick(item.tab)}
              className="group relative flex-1 py-1.5 flex flex-col items-center justify-center transition-all focus:outline-none"
            >
              {/* Active hairline indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-[2.5px] bg-jklu-orange rounded-full animate-fadeIn" />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 group-active:scale-95 ${
                  isActive ? 'text-[#2B4A7E]' : 'text-slate-400 group-hover:text-[#4F70B0]'
                }`}
              />

              <span
                className={`text-[10px] font-editorial font-bold tracking-widest mt-1 transition-colors ${
                  isActive ? 'text-[#2B4A7E]' : 'text-slate-400 group-hover:text-[#4F70B0]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
