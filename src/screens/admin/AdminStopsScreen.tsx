import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Stop } from '../../types/database';
import {
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ExternalLink,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface AdminStopsScreenProps {
  isAddStopModalOpen?: boolean;
  onCloseAddStopModal?: () => void;
}

export const AdminStopsScreen: React.FC<AdminStopsScreenProps> = ({
  isAddStopModalOpen: initialAddOpen = false,
  onCloseAddStopModal
}) => {
  const {
    stops,
    routes,
    routeStops,
    createStop,
    updateStop,
    deleteStop,
    assignStopToRoute,
    removeStopFromRoute
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(initialAddOpen);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isEditingStop, setIsEditingStop] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<Stop | null>(null);

  // Add/Edit Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formLat, setFormLat] = useState('26.8500');
  const [formLng, setFormLng] = useState('75.7500');
  const [formDesc, setFormDesc] = useState('');
  const [formIsDest, setFormIsDest] = useState(false);
  const [formError, setFormError] = useState('');

  // Assign to Route Form State
  const [assignRouteId, setAssignRouteId] = useState('');
  const [assignSequence, setAssignSequence] = useState('1');

  // Filter stops
  const filteredStops = stops.filter(
    (s) =>
      s.stop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.stop_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper: Find which routes use this stop
  const getRoutesUsingStop = (stopId: string) => {
    const routeIds = Array.from(
      new Set(routeStops.filter((rs) => rs.stop_id === stopId).map((rs) => rs.route_id))
    );
    return routeIds.map((rid) => routes.find((r) => r.route_id === rid)).filter(Boolean);
  };

  const handleOpenAddModal = () => {
    setFormId('');
    setFormName('');
    setFormLat('26.8500');
    setFormLng('75.7500');
    setFormDesc('');
    setFormIsDest(false);
    setFormError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    if (onCloseAddStopModal) onCloseAddStopModal();
  };

  const handleOpenEditModal = (stop: Stop) => {
    setSelectedStop(stop);
    setFormId(stop.stop_id);
    setFormName(stop.stop_name);
    setFormLat(String(stop.latitude));
    setFormLng(String(stop.longitude));
    setFormDesc(stop.description || '');
    setFormIsDest(!!stop.is_destination);
    setFormError('');
    setIsEditingStop(true);
  };

  const handleSaveStop = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Stop name is required.');
      return;
    }

    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (isNaN(lat) || isNaN(lng)) {
      setFormError('Valid Latitude and Longitude are required.');
      return;
    }

    if (isEditingStop && selectedStop) {
      const updated: Stop = {
        ...selectedStop,
        stop_name: formName.trim().toUpperCase(),
        latitude: lat,
        longitude: lng,
        description: formDesc.trim(),
        is_destination: formIsDest
      };
      updateStop(updated);
      setIsEditingStop(false);
      setSelectedStop(null);
    } else {
      const cleanId =
        formId.trim() || `STOP-${formName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
      const newStop: Stop = {
        stop_id: cleanId,
        stop_name: formName.trim().toUpperCase(),
        latitude: lat,
        longitude: lng,
        description: formDesc.trim() || 'University Designated Transit Stop',
        is_destination: formIsDest
      };
      const res = createStop(newStop);
      if (res.success) {
        handleCloseAddModal();
      } else {
        setFormError(res.error || 'Failed to add stop.');
      }
    }
  };

  const handleDelete = (stopId: string) => {
    const res = deleteStop(stopId);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal || !assignRouteId) return;

    assignStopToRoute(assignRouteId, showAssignModal.stop_id, parseInt(assignSequence) || 1);
    setShowAssignModal(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Stop Management
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Relational physical stops, geo-coordinates, destination terminals, and multi-route hub assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#2B4A7E] hover:bg-[#1E3A68] text-white font-editorial font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Physical Stop</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stops by name, stop ID (e.g. DCM, Mansarovar, JKLU), or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-medium outline-none focus:border-[#2B4A7E]"
          />
        </div>
      </div>

      {/* Stops Table */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial font-bold text-base text-stone-900">
            Registered Transit Stops ({filteredStops.length})
          </h2>
          <span className="text-[11px] font-mono text-stone-400">
            Database Table: Stop
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-mono uppercase tracking-wider text-stone-400">
                <th className="pb-3 font-semibold">Stop ID / Name</th>
                <th className="pb-3 font-semibold">GPS Coordinates</th>
                <th className="pb-3 font-semibold">Destination Status</th>
                <th className="pb-3 font-semibold">Routes Serving Stop</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredStops.map((stop) => {
                const routesUsing = getRoutesUsingStop(stop.stop_id);

                return (
                  <tr key={stop.stop_id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="font-editorial font-bold text-stone-900">
                        {stop.stop_name}
                      </div>
                      <div className="text-[10px] font-mono text-stone-400">
                        {stop.stop_id}
                      </div>
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-stone-700">
                      <div>Lat: {stop.latitude.toFixed(4)}</div>
                      <div>Lng: {stop.longitude.toFixed(4)}</div>
                    </td>

                    <td className="py-3.5 pr-3">
                      {stop.is_destination ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                          ★ Terminus Hub
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-600">
                          Way Station
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {routesUsing.length > 0 ? (
                          routesUsing.map((r) => (
                            <span
                              key={r?.route_id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-2xs"
                              style={{ backgroundColor: r?.color || '#2B4A7E' }}
                            >
                              {r?.route_code}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-mono text-stone-400 italic">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 pr-3 text-stone-600 max-w-xs truncate">
                      {stop.description || '—'}
                    </td>

                    <td className="py-3.5 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => {
                          setShowAssignModal(stop);
                          setAssignRouteId(routes[0]?.route_id || '');
                        }}
                        title="Assign to Route"
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-[11px] transition-colors"
                      >
                        + Route
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(stop)}
                        title="Edit Stop"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(stop.stop_id)}
                        title="Delete Stop"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD / EDIT STOP MODAL ================= */}
      {(showAddModal || isEditingStop) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-editorial text-lg font-bold text-stone-900">
                {isEditingStop ? 'Edit Physical Stop' : 'Add New Transit Stop'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditingStop(false);
                }}
                className="p-2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStop} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-editorial font-bold text-stone-700 block">
                  Stop Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. JAIPUR AIRPORT TERMINAL 2"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                />
              </div>

              {!isEditingStop && (
                <div className="space-y-1">
                  <label className="text-xs font-editorial font-bold text-stone-700 block">
                    Stop ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="STOP-AIRPORT"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-stone-400">Leave blank to auto-generate.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-editorial font-bold text-stone-700 block">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-editorial font-bold text-stone-700 block">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-editorial font-bold text-stone-700 block">
                  Description / Landmarks
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Circle near Terminal 2, Sanganer highway"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="destCheck"
                  checked={formIsDest}
                  onChange={(e) => setFormIsDest(e.target.checked)}
                  className="rounded text-[#2B4A7E]"
                />
                <label htmlFor="destCheck" className="text-xs font-editorial font-medium text-stone-700">
                  Mark as Destination / Main University Campus Terminus
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditingStop(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-editorial font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2B4A7E] hover:bg-[#1E3A68] text-white text-xs font-editorial font-bold shadow-md"
                >
                  {isEditingStop ? 'Save Updates' : 'Add Stop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN STOP TO ROUTE MODAL ================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-editorial font-bold text-base text-stone-900">
                Assign Stop to Route
              </h3>
              <button onClick={() => setShowAssignModal(null)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
              <span className="font-bold text-[#2B4A7E]">{showAssignModal.stop_name}</span> ({showAssignModal.stop_id})
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-editorial font-bold text-stone-700">Select Target Route</label>
                <select
                  value={assignRouteId}
                  onChange={(e) => setAssignRouteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                >
                  {routes.map((r) => (
                    <option key={r.route_id} value={r.route_id}>
                      {r.route_code} — {r.route_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-editorial font-bold text-stone-700">
                  Sequence Position (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={assignSequence}
                  onChange={(e) => setAssignSequence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                />
                <p className="text-[10px] text-stone-400">
                  Determines Route_Stop.sequence_number within the circuit.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2B4A7E] text-white text-xs font-bold font-editorial shadow-xs"
                >
                  Assign to Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
