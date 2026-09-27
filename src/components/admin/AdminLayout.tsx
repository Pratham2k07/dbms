import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenType } from '../../types/ui';
import {
  LayoutDashboard,
  Route as RouteIcon,
  MapPin,
  CalendarCheck,
  Bus,
  Users,
  Radio,
  History,
  UserCheck,
  LogOut,
  Menu,
  X,
  Plus,
  Activity,
  Bell,
  Clock
} from 'lucide-react';
import { AdminDashboardScreen } from '../../screens/admin/AdminDashboardScreen';
import { AdminRoutesScreen } from '../../screens/admin/AdminRoutesScreen';
import { AdminStopsScreen } from '../../screens/admin/AdminStopsScreen';
import { AdminTripsScreen } from '../../screens/admin/AdminTripsScreen';
import { AdminShuttlesScreen } from '../../screens/admin/AdminShuttlesScreen';
import { AdminDriversScreen } from '../../screens/admin/AdminDriversScreen';
import { AdminLiveTrackingScreen } from '../../screens/admin/AdminLiveTrackingScreen';
import { AdminTripHistoryScreen } from '../../screens/admin/AdminTripHistoryScreen';
import { AdminProfileScreen } from '../../screens/admin/AdminProfileScreen';

export const AdminLayout: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    logoutUser,
    admin,
    trips,
    shuttles
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Quick Action Modal Triggers
  const [openCreateRouteModal, setOpenCreateRouteModal] = useState(false);
  const [openCreateTripModal, setOpenCreateTripModal] = useState(false);
  const [openAddShuttleModal, setOpenAddShuttleModal] = useState(false);
  const [openAddDriverModal, setOpenAddDriverModal] = useState(false);
  const [openAddStopModal, setOpenAddStopModal] = useState(false);

  // Navigation Items
  const navItems = [
    { id: 'admin-dashboard' as ScreenType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-routes' as ScreenType, label: 'Routes', icon: RouteIcon },
    { id: 'admin-stops' as ScreenType, label: 'Stops', icon: MapPin },
    { id: 'admin-trips' as ScreenType, label: 'Trips', icon: CalendarCheck },
    { id: 'admin-shuttles' as ScreenType, label: 'Shuttles', icon: Bus },
    { id: 'admin-drivers' as ScreenType, label: 'Drivers', icon: Users },
    { id: 'admin-live-tracking' as ScreenType, label: 'Live Tracking', icon: Radio, badge: trips.filter(t => t.running_status === 'RUNNING').length },
    { id: 'admin-history' as ScreenType, label: 'Trip History', icon: History },
    { id: 'admin-profile' as ScreenType, label: 'Profile & System', icon: UserCheck }
  ];

  const handleNavClick = (screenId: ScreenType) => {
    setCurrentScreen(screenId);
    setIsMobileSidebarOpen(false);
  };

  // Render Subscreen
  const renderAdminScreen = () => {
    switch (currentScreen) {
      case 'admin-dashboard':
        return (
          <AdminDashboardScreen
            onOpenCreateRoute={() => {
              setCurrentScreen('admin-routes');
              setOpenCreateRouteModal(true);
            }}
            onOpenCreateTrip={() => {
              setCurrentScreen('admin-trips');
              setOpenCreateTripModal(true);
            }}
            onOpenAddShuttle={() => {
              setCurrentScreen('admin-shuttles');
              setOpenAddShuttleModal(true);
            }}
            onOpenAddDriver={() => {
              setCurrentScreen('admin-drivers');
              setOpenAddDriverModal(true);
            }}
            onOpenAddStop={() => {
              setCurrentScreen('admin-stops');
              setOpenAddStopModal(true);
            }}
          />
        );
      case 'admin-routes':
        return (
          <AdminRoutesScreen
            isCreateModalOpen={openCreateRouteModal}
            onCloseCreateModal={() => setOpenCreateRouteModal(false)}
          />
        );
      case 'admin-stops':
        return (
          <AdminStopsScreen
            isAddStopModalOpen={openAddStopModal}
            onCloseAddStopModal={() => setOpenAddStopModal(false)}
          />
        );
      case 'admin-trips':
        return (
          <AdminTripsScreen
            isCreateTripModalOpen={openCreateTripModal}
            onCloseCreateTripModal={() => setOpenCreateTripModal(false)}
          />
        );
      case 'admin-shuttles':
        return (
          <AdminShuttlesScreen
            isAddShuttleModalOpen={openAddShuttleModal}
            onCloseAddShuttleModal={() => setOpenAddShuttleModal(false)}
          />
        );
      case 'admin-drivers':
        return (
          <AdminDriversScreen
            isAddDriverModalOpen={openAddDriverModal}
            onCloseAddDriverModal={() => setOpenAddDriverModal(false)}
          />
        );
      case 'admin-live-tracking':
        return <AdminLiveTrackingScreen />;
      case 'admin-history':
        return <AdminTripHistoryScreen />;
      case 'admin-profile':
        return <AdminProfileScreen />;
      default:
        return (
          <AdminDashboardScreen
            onOpenCreateRoute={() => setCurrentScreen('admin-routes')}
            onOpenCreateTrip={() => setCurrentScreen('admin-trips')}
            onOpenAddShuttle={() => setCurrentScreen('admin-shuttles')}
            onOpenAddDriver={() => setCurrentScreen('admin-drivers')}
            onOpenAddStop={() => setCurrentScreen('admin-stops')}
          />
        );
    }
  };

  const runningCount = trips.filter((t) => t.running_status === 'RUNNING').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-stone-900 select-none">
      {/* ================= DESKTOP LEFT SIDEBAR ================= */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-[#1E3A68] text-white flex-col justify-between shrink-0 shadow-2xl z-40 border-r border-blue-900/40">
        <div className="p-6 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
              <img src="/jklu-logo.png" alt="JKLU University Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-editorial font-black text-sm tracking-wide text-white">
                  JKLU SHUTTLE
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#E8590C] text-white uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-blue-200/80 font-mono">
                Transport Control Center
              </p>
            </div>
          </div>

          {/* Operational Status Pill */}
          <div className="p-3 rounded-2xl bg-[#2B4A7E]/70 border border-blue-400/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-blue-100">
                ACTIVE DISPATCH
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
              {runningCount} Running
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] uppercase font-mono font-bold text-blue-300/60 px-3 pb-1 tracking-wider">
              Management Portal
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-editorial font-bold transition-all ${
                    isActive
                      ? 'bg-[#E8590C] text-white shadow-md'
                      : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-300'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white text-[#E8590C]'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 m-4 rounded-2xl bg-[#172D52] border border-blue-900/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#E8590C] flex items-center justify-center font-bold text-xs font-editorial border border-orange-500/30">
              AS
            </div>
            <div className="truncate">
              <div className="font-editorial font-bold text-xs text-white truncate">
                {admin.name}
              </div>
              <div className="text-[10px] text-blue-300/70 truncate">
                Transport Cell Incharge
              </div>
            </div>
          </div>

          <button
            onClick={logoutUser}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-stone-300 text-xs font-editorial font-bold flex items-center justify-center gap-2 transition-colors border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE HEADER BAR ================= */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#1E3A68] text-white px-4 py-3 border-b border-blue-900/60 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white p-1">
            <img src="/jklu-logo.png" alt="JKLU Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial font-bold text-sm text-white leading-none">
                JKLU SHUTTLE
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#E8590C] text-white uppercase">
                Admin
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ================= MOBILE DRAWER MENU ================= */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 bg-[#1E3A68] text-white p-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-blue-800/60">
                <span className="font-editorial font-bold text-sm">Control Navigation</span>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="text-blue-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-editorial font-bold transition-all ${
                        isActive
                          ? 'bg-[#E8590C] text-white shadow-md'
                          : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-blue-800/60">
              <button
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  logoutUser();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600/30 text-red-200 text-xs font-editorial font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Desktop Context Banner */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-stone-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-stone-400 uppercase">
              PORTAL:
            </span>
            <span className="text-xs font-editorial font-bold text-stone-800 capitalize">
              {currentScreen.replace('admin-', '').replace('-', ' ')}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs font-mono text-stone-500">
              JK Lakshmipat University Transit Central
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentScreen('admin-live-tracking');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold hover:bg-emerald-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{runningCount} Shuttles Active</span>
            </button>
          </div>
        </div>

        {/* Dynamic Subscreen */}
        <div className="flex-1 pb-12">
          {renderAdminScreen()}
        </div>
      </main>
    </div>
  );
};
