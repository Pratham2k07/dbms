import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Database,
  FastForward,
  RotateCcw,
  LogOut,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const AdminProfileScreen: React.FC = () => {
  const {
    admin,
    logoutUser,
    isSimulating,
    setIsSimulating,
    simSpeed,
    setSimSpeed,
    resetSimulation,
    routes,
    stops,
    shuttles,
    drivers,
    trips,
    tripStops
  } = useApp();

  const schemaTables = [
    { name: 'Users', description: 'Base user authentication & contacts', count: 1 + drivers.length + 1 },
    { name: 'Student', description: 'Student roll numbers & credentials', count: 1 },
    { name: 'Driver', description: 'Licensed commercial shuttle drivers', count: drivers.length },
    { name: 'Route', description: 'Configured university transit circuits', count: routes.length },
    { name: 'Stop', description: 'Physical geo-coded transit stops', count: stops.length },
    { name: 'Route_Stop', description: 'Sequence order associations', count: 'Active' },
    { name: 'Shuttle', description: 'Campus mobility fleet inventory', count: shuttles.length },
    { name: 'Trip', description: 'Scheduled and running dispatch operations', count: trips.length },
    { name: 'Trip_Stop', description: 'Stop schedules & ETA checkpoints', count: tripStops.length }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1E3A68] to-[#2B4A7E] text-white flex items-center justify-center font-editorial font-black text-2xl shadow-md">
              {admin.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-xl sm:text-2xl font-black text-stone-900">
                  {admin.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E8590C]/10 text-[#E8590C] border border-[#E8590C]/20">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                {admin.designation}
              </p>
            </div>
          </div>

          <button
            onClick={logoutUser}
            className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-editorial font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
            <div className="flex items-center gap-2 text-stone-400 font-mono text-[10px]">
              <Mail className="w-3.5 h-3.5" />
              <span>OFFICIAL EMAIL</span>
            </div>
            <div className="font-editorial font-bold text-stone-900">{admin.email}</div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
            <div className="flex items-center gap-2 text-stone-400 font-mono text-[10px]">
              <Phone className="w-3.5 h-3.5" />
              <span>PHONE NUMBER</span>
            </div>
            <div className="font-editorial font-bold text-stone-900">{admin.phone_number}</div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
            <div className="flex items-center gap-2 text-stone-400 font-mono text-[10px]">
              <Building className="w-3.5 h-3.5" />
              <span>DEPARTMENT</span>
            </div>
            <div className="font-editorial font-bold text-stone-900">{admin.department}</div>
          </div>
        </div>
      </div>

      {/* Relational Database Schema Health */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#2B4A7E]" />
              <h2 className="font-editorial text-lg font-bold text-stone-900">
                Relational Database Schema Status
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Active university schema entities with foreign-key referential integrity
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
            All 9 Tables Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {schemaTables.map((t) => (
            <div
              key={t.name}
              className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-mono font-bold text-stone-900">{t.name}</div>
                <div className="text-[10px] text-stone-400">{t.description}</div>
              </div>
              <span className="font-mono font-bold text-[#2B4A7E] px-2 py-0.5 rounded bg-white border border-stone-200 text-[11px]">
                {t.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Simulation Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#E8590C]" />
            <h2 className="font-editorial text-lg font-bold text-stone-900">
              GPS Simulation & Telemetry Engine
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Control the real-time GPS coordinate advance and ETA decrement loop across all active student, driver, and admin portals
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-editorial font-bold text-stone-700">Simulation Speed:</span>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  simSpeed === spd
                    ? 'bg-[#2B4A7E] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-4 py-2 rounded-xl font-editorial font-bold text-xs transition-all ${
                isSimulating
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
              }`}
            >
              {isSimulating ? 'Pause GPS Engine' : 'Resume GPS Engine'}
            </button>

            <button
              onClick={resetSimulation}
              className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 font-editorial font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
