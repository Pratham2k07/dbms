import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Driver } from '../../types/database';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Phone,
  CreditCard,
  Bus,
  CheckCircle2,
  Activity,
  AlertTriangle,
  History
} from 'lucide-react';

interface AdminDriversScreenProps {
  isAddDriverModalOpen?: boolean;
  onCloseAddDriverModal?: () => void;
}

export const AdminDriversScreen: React.FC<AdminDriversScreenProps> = ({
  isAddDriverModalOpen: initialAddOpen = false,
  onCloseAddDriverModal
}) => {
  const {
    drivers,
    shuttles,
    trips,
    routes,
    createDriver,
    updateDriver,
    deleteDriver
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(initialAddOpen);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<Driver | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+91 ');
  const [formLicense, setFormLicense] = useState('RJ14-2022-');
  const [formAssignedShuttle, setFormAssignedShuttle] = useState('');
  const [formError, setFormError] = useState('');

  const handleOpenAddModal = () => {
    setFormName('');
    setFormPhone('+91 9');
    setFormLicense('RJ14-2024-00');
    setFormAssignedShuttle('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    if (onCloseAddDriverModal) onCloseAddDriverModal();
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formLicense.trim()) {
      setFormError('Driver name and valid commercial license number are required.');
      return;
    }

    if (editingDriver) {
      const updated: Driver = {
        ...editingDriver,
        name: formName.trim(),
        phone_number: formPhone.trim(),
        license_no: formLicense.trim(),
        assigned_shuttle_id: formAssignedShuttle || undefined
      };
      updateDriver(updated);
      setEditingDriver(null);
    } else {
      const res = createDriver({
        name: formName.trim(),
        phone_number: formPhone.trim(),
        license_no: formLicense.trim(),
        assigned_shuttle_id: formAssignedShuttle || undefined
      });
      if (res.success) {
        handleCloseAddModal();
      } else {
        setFormError(res.error || 'Failed to add driver.');
      }
    }
  };

  const handleDelete = (driverId: string) => {
    const res = deleteDriver(driverId);
    if (!res.success) {
      alert(res.error);
    }
  };

  // Helper: Get driver current trip & trip history
  const getDriverOperationalInfo = (driverId: string) => {
    const currentTrip = trips.find(
      (t) => t.driver_id === driverId && t.running_status === 'RUNNING'
    );
    const completedTrips = trips.filter(
      (t) => t.driver_id === driverId && t.running_status === 'COMPLETED'
    );
    const scheduledTrips = trips.filter(
      (t) => t.driver_id === driverId && t.running_status === 'SCHEDULED'
    );

    return {
      currentTrip,
      completedCount: completedTrips.length,
      scheduledCount: scheduledTrips.length,
      allTrips: trips.filter((t) => t.driver_id === driverId)
    };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Driver & Transport Staff Management
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Relational driver records linked to Users table (Driver.driver_id → Users.user_id), commercial licenses, and dispatch assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#2B4A7E] hover:bg-[#1E3A68] text-white font-editorial font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Enroll New Driver</span>
        </button>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {drivers.map((drv) => {
          const ops = getDriverOperationalInfo(drv.driver_id);
          const assignedShuttle = shuttles.find((s) => s.shuttle_id === drv.assigned_shuttle_id);

          return (
            <div
              key={drv.driver_id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-editorial text-sm">
                      {drv.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-editorial font-bold text-sm text-stone-900">
                        {drv.name}
                      </div>
                      <div className="text-[10px] font-mono text-stone-400">
                        {drv.driver_id}
                      </div>
                    </div>
                  </div>

                  {ops.currentTrip ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      On Duty
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-500">
                      Standby
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-mono text-[11px]">{drv.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-mono text-[10px] truncate">{drv.license_no}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="text-[11px] truncate">
                      {assignedShuttle ? assignedShuttle.shuttle_number : 'No Dedicated Shuttle'}
                    </span>
                  </div>
                </div>

                {/* Active Trip Info Box */}
                {ops.currentTrip && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] space-y-1">
                    <div className="font-editorial font-bold text-[#2B4A7E]">
                      Operating Trip {ops.currentTrip.trip_id}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Route: {ops.currentTrip.route_id} • Started {ops.currentTrip.start_time}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedDriverDetails(drv)}
                  className="flex-1 py-1.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-editorial font-bold transition-colors"
                >
                  Trip History
                </button>

                <button
                  onClick={() => {
                    setEditingDriver(drv);
                    setFormName(drv.name);
                    setFormPhone(drv.phone_number);
                    setFormLicense(drv.license_no);
                    setFormAssignedShuttle(drv.assigned_shuttle_id || '');
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(drv.driver_id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DRIVER DETAILS & TRIP HISTORY MODAL ================= */}
      {selectedDriverDetails && (() => {
        const ops = getDriverOperationalInfo(selectedDriverDetails.driver_id);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-stone-200">
              <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                <div className="space-y-1">
                  <h3 className="font-editorial text-lg font-bold text-stone-900">
                    {selectedDriverDetails.name}
                  </h3>
                  <p className="text-xs font-mono text-stone-400">
                    ID: {selectedDriverDetails.driver_id} • License: {selectedDriverDetails.license_no}
                  </p>
                </div>
                <button onClick={() => setSelectedDriverDetails(null)} className="text-stone-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono block">COMPLETED RUNS</span>
                  <span className="font-bold text-stone-800">{ops.completedCount} Trips</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-mono block">UPCOMING RUNS</span>
                  <span className="font-bold text-stone-800">{ops.scheduledCount} Trips</span>
                </div>
              </div>

              {/* Trip Log */}
              <div className="space-y-2">
                <h4 className="font-editorial font-bold text-xs uppercase tracking-wider text-stone-400">
                  Trip Assignment Log
                </h4>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {ops.allTrips.map((t) => (
                    <div
                      key={t.trip_id}
                      className="p-2.5 rounded-xl border border-stone-200/80 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-stone-800">{t.trip_id}</span>
                        <div className="text-[10px] text-stone-500">
                          Route {t.route_id} • Start {t.start_time}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          t.running_status === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.running_status === 'COMPLETED'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.running_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDriverDetails(null)}
                  className="px-5 py-2 rounded-xl bg-[#2B4A7E] text-white text-xs font-editorial font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= ADD / EDIT DRIVER MODAL ================= */}
      {(showAddModal || editingDriver) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-editorial font-bold text-base text-stone-900">
                {editingDriver ? 'Edit Driver Record' : 'Enroll Certified Driver'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDriver(null);
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

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div>
                <label className="font-editorial font-bold text-stone-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                />
              </div>

              <div>
                <label className="font-editorial font-bold text-stone-700 block mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 94140 00000"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono"
                />
              </div>

              <div>
                <label className="font-editorial font-bold text-stone-700 block mb-1">
                  Commercial Driver License No.
                </label>
                <input
                  type="text"
                  value={formLicense}
                  onChange={(e) => setFormLicense(e.target.value.toUpperCase())}
                  placeholder="RJ14-2018-00912"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-editorial font-bold text-stone-700 block mb-1">
                  Assigned Default Shuttle (Optional)
                </label>
                <select
                  value={formAssignedShuttle}
                  onChange={(e) => setFormAssignedShuttle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                >
                  <option value="">None / Floating</option>
                  {shuttles.map((s) => (
                    <option key={s.shuttle_id} value={s.shuttle_id}>
                      {s.shuttle_number} ({s.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDriver(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2B4A7E] text-white font-editorial font-bold"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
