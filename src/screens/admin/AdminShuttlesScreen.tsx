import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shuttle } from '../../types/database';
import {
  Bus,
  Plus,
  Edit,
  Trash2,
  X,
  Wrench,
  PowerOff,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Gauge,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AdminShuttlesScreenProps {
  isAddShuttleModalOpen?: boolean;
  onCloseAddShuttleModal?: () => void;
}

export const AdminShuttlesScreen: React.FC<AdminShuttlesScreenProps> = ({
  isAddShuttleModalOpen: initialAddOpen = false,
  onCloseAddShuttleModal
}) => {
  const {
    shuttles,
    trips,
    routes,
    drivers,
    stops,
    tripStops,
    etaMap,
    createShuttle,
    updateShuttle,
    setShuttleStatus,
    setSelectedTripId,
    setSelectedRouteId,
    setCurrentScreen
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(initialAddOpen);
  const [selectedShuttleDetail, setSelectedShuttleDetail] = useState<Shuttle | null>(null);
  const [editingShuttle, setEditingShuttle] = useState<Shuttle | null>(null);

  // Form State
  const [formNumber, setFormNumber] = useState('');
  const [formReg, setFormReg] = useState('');
  const [formCapacity, setFormCapacity] = useState('32');
  const [formStatus, setFormStatus] = useState<Shuttle['status']>('ACTIVE');
  const [formError, setFormError] = useState('');

  const handleOpenAddModal = () => {
    const nextNum = shuttles.length + 1;
    setFormNumber(`SHUTTLE ${String(nextNum).padStart(2, '0')}`);
    setFormReg(`RJ 14 PC ${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCapacity('32');
    setFormStatus('ACTIVE');
    setFormError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    if (onCloseAddShuttleModal) onCloseAddShuttleModal();
  };

  const handleSaveShuttle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNumber.trim() || !formReg.trim()) {
      setFormError('Shuttle number and registration are required.');
      return;
    }

    if (editingShuttle) {
      const updated: Shuttle = {
        ...editingShuttle,
        shuttle_number: formNumber.trim(),
        registration_number: formReg.trim(),
        capacity: parseInt(formCapacity) || 32,
        status: formStatus
      };
      updateShuttle(updated);
      setEditingShuttle(null);
    } else {
      const nextId = `SHT-${String(shuttles.length + 1).padStart(2, '0')}`;
      const newShuttle: Shuttle = {
        shuttle_id: nextId,
        shuttle_number: formNumber.trim().toUpperCase(),
        registration_number: formReg.trim().toUpperCase(),
        capacity: parseInt(formCapacity) || 32,
        status: formStatus
      };
      const res = createShuttle(newShuttle);
      if (res.success) {
        handleCloseAddModal();
      } else {
        setFormError(res.error || 'Failed to add shuttle.');
      }
    }
  };

  // Get active trip info for a shuttle
  const getShuttleTripInfo = (shuttleId: string) => {
    const activeTrip = trips.find(
      (t) => t.shuttle_id === shuttleId && t.running_status === 'RUNNING'
    );
    if (!activeTrip) return null;

    const route = routes.find((r) => r.route_id === activeTrip.route_id);
    const driver = drivers.find((d) => d.driver_id === activeTrip.driver_id);

    // Current/Next stop and ETA
    const tStops = tripStops.filter((ts) => ts.trip_id === activeTrip.trip_id);
    const nextTripStop =
      tStops.find((ts) => ts.arrival_status === 'APPROACHING') ||
      tStops.find((ts) => ts.arrival_status === 'SCHEDULED') ||
      tStops[tStops.length - 1];

    const currentPassedStop =
      [...tStops].reverse().find((ts) => ts.arrival_status === 'COMPLETED') || tStops[0];

    const currentStopName = stops.find((s) => s.stop_id === currentPassedStop?.stop_id)?.stop_name || 'JKLU Origin';
    const nextStopName = stops.find((s) => s.stop_id === nextTripStop?.stop_id)?.stop_name || 'En Route';

    const etaKey = `${activeTrip.trip_id}_${nextTripStop?.stop_id}`;
    const dynamicEta = etaMap[etaKey] || 5;

    return {
      trip: activeTrip,
      route,
      driver,
      speed: activeTrip.speed_kmh || 38,
      currentStop: currentStopName,
      nextStop: nextStopName,
      eta: dynamicEta
    };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-stone-800" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Shuttle Fleet Management
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            University vehicle registry, maintenance diagnostics, offline parking states, and real-time transit telemetry.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#2B4A7E] hover:bg-[#1E3A68] text-white font-editorial font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Shuttle to Fleet</span>
        </button>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {shuttles.map((shuttle) => {
          const tripInfo = getShuttleTripInfo(shuttle.shuttle_id);

          return (
            <div
              key={shuttle.shuttle_id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 group-hover:scale-105 transition-transform">
                    <Bus className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      shuttle.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : shuttle.status === 'MAINTENANCE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {shuttle.status}
                  </span>
                </div>

                {/* Shuttle Info */}
                <div>
                  <h3 className="font-editorial font-bold text-base text-stone-900">
                    {shuttle.shuttle_number}
                  </h3>
                  <p className="font-mono text-xs text-stone-500">
                    {shuttle.registration_number} • {shuttle.capacity} Seats
                  </p>
                </div>

                {/* Current Transit Status */}
                <div className="pt-2 border-t border-stone-100 text-xs space-y-1.5">
                  {tripInfo ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {tripInfo.trip.trip_id}
                        </span>
                        <span className="font-mono text-stone-500">{tripInfo.speed} km/h</span>
                      </div>
                      <div className="text-[11px] text-stone-700 font-medium truncate">
                        Route: {tripInfo.route?.route_code} • {tripInfo.driver?.name}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Next: {tripInfo.nextStop} (~{tripInfo.eta}m)
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-stone-400 text-[11px] font-mono text-center">
                      No active trip in transit
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono font-bold">
                  <button
                    onClick={() => setShuttleStatus(shuttle.shuttle_id, 'ACTIVE')}
                    className={`py-1 rounded-lg transition-colors ${
                      shuttle.status === 'ACTIVE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-emerald-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setShuttleStatus(shuttle.shuttle_id, 'MAINTENANCE')}
                    className={`py-1 rounded-lg transition-colors ${
                      shuttle.status === 'MAINTENANCE'
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-amber-50'
                    }`}
                  >
                    Maint.
                  </button>
                  <button
                    onClick={() => setShuttleStatus(shuttle.shuttle_id, 'OFFLINE')}
                    className={`py-1 rounded-lg transition-colors ${
                      shuttle.status === 'OFFLINE'
                        ? 'bg-stone-700 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Offline
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setSelectedShuttleDetail(shuttle)}
                    className="flex-1 py-1.5 rounded-xl bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-xs transition-colors text-center"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      setEditingShuttle(shuttle);
                      setFormNumber(shuttle.shuttle_number);
                      setFormReg(shuttle.registration_number);
                      setFormCapacity(String(shuttle.capacity));
                      setFormStatus(shuttle.status);
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DETAILED SHUTTLE VIEW MODAL ================= */}
      {selectedShuttleDetail && (() => {
        const info = getShuttleTripInfo(selectedShuttleDetail.shuttle_id);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-stone-200">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bus className="w-5 h-5 text-[#2B4A7E]" />
                    <h2 className="font-editorial text-xl font-bold text-stone-900">
                      {selectedShuttleDetail.shuttle_number}
                    </h2>
                  </div>
                  <p className="text-xs font-mono text-stone-400">
                    Registration: {selectedShuttleDetail.registration_number}
                  </p>
                </div>

                <button onClick={() => setSelectedShuttleDetail(null)} className="text-stone-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Key Attributes Box */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">Capacity</span>
                  <span className="font-bold text-stone-800">{selectedShuttleDetail.capacity} Passengers</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">Status</span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      selectedShuttleDetail.status === 'ACTIVE'
                        ? 'text-emerald-700'
                        : selectedShuttleDetail.status === 'MAINTENANCE'
                        ? 'text-amber-700'
                        : 'text-stone-600'
                    }`}
                  >
                    {selectedShuttleDetail.status}
                  </span>
                </div>
              </div>

              {/* Real-time Telemetry Section */}
              <div className="space-y-2">
                <h4 className="font-editorial font-bold text-xs uppercase tracking-wider text-stone-400">
                  Real-Time Telemetry & Operations
                </h4>

                {info ? (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">CURRENT ROUTE</span>
                        <span className="font-bold text-[#2B4A7E]">{info.route?.route_name} ({info.route?.route_code})</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">CURRENT TRIP</span>
                        <span className="font-mono font-bold text-stone-900">{info.trip.trip_id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">DRIVER</span>
                        <span className="font-medium text-stone-800">{info.driver?.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">CURRENT SPEED</span>
                        <span className="font-mono font-bold text-stone-900">{info.speed} km/h</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-100 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">CURRENT STOP</span>
                        <span className="font-medium text-stone-800">{info.currentStop}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 block">NEXT STOP</span>
                        <span className="font-bold text-emerald-800">{info.nextStop} (~{info.eta} min)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center text-xs text-stone-400">
                    Vehicle currently stationary. No live trip assigned.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 flex justify-between items-center">
                {info && (
                  <button
                    onClick={() => {
                      setSelectedTripId(info.trip.trip_id);
                      setSelectedRouteId(info.trip.route_id);
                      setSelectedShuttleDetail(null);
                      setCurrentScreen('admin-live-tracking');
                    }}
                    className="text-xs font-editorial font-bold text-[#2B4A7E] flex items-center gap-1 hover:underline"
                  >
                    <span>Open in Live GPS Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedShuttleDetail(null)}
                  className="px-5 py-2 rounded-xl bg-[#2B4A7E] text-white text-xs font-editorial font-bold ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= ADD / EDIT MODAL ================= */}
      {(showAddModal || editingShuttle) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-editorial font-bold text-base text-stone-900">
                {editingShuttle ? 'Edit Shuttle Vehicle' : 'Register New Shuttle'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingShuttle(null);
                }}
                className="text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveShuttle} className="space-y-3 text-xs">
              <div>
                <label className="font-editorial font-bold text-stone-700 block mb-1">
                  Shuttle Label / Name
                </label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="e.g. SHUTTLE 05"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                />
              </div>

              <div>
                <label className="font-editorial font-bold text-stone-700 block mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formReg}
                  onChange={(e) => setFormReg(e.target.value.toUpperCase())}
                  placeholder="RJ 14 PA 9999"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-editorial font-bold text-stone-700 block mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-editorial font-bold text-stone-700 block mb-1">
                    Fleet Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingShuttle(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2B4A7E] text-white font-editorial font-bold"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
