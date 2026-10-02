import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Route, Stop } from '../../types/database';
import {
  Route as RouteIcon,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Search,
  MapPin,
  Compass,
  CheckCircle2,
  GripVertical,
  Bus
} from 'lucide-react';

interface AdminRoutesScreenProps {
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const AdminRoutesScreen: React.FC<AdminRoutesScreenProps> = ({
  isCreateModalOpen: initialCreateOpen = false,
  onCloseCreateModal
}) => {
  const {
    routes,
    stops,
    routeStops,
    trips,
    shuttles,
    drivers,
    createRoute,
    createRouteWithAssignment,
    updateRoute,
    cancelRoute,
    deleteRoute,
    createStop,
    setSelectedRouteId,
    setCurrentScreen
  } = useApp();

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState<boolean>(false);
  const [isEditingRoute, setIsEditingRoute] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(initialCreateOpen);

  // Edit Route Form State
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#2B4A7E');
  const [editAssignedDriverId, setEditAssignedDriverId] = useState('');
  const [editAssignedShuttleId, setEditAssignedShuttleId] = useState('');
  const [editSearchStop, setEditSearchStop] = useState('');

  // Create Route Form State
  const [newRouteId, setNewRouteId] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteCode, setNewRouteCode] = useState('');
  const [newRouteDesc, setNewRouteDesc] = useState('');
  const [newRouteColor, setNewRouteColor] = useState('#E8590C');
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>([]);
  const [newAssignedShuttleId, setNewAssignedShuttleId] = useState('');
  const [newAssignedDriverId, setNewAssignedDriverId] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:30 AM');
  const [newInstructions, setNewInstructions] = useState('Campus express circuit assigned from Admin Dispatch');
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and Drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editDraggedIndex, setEditDraggedIndex] = useState<number | null>(null);

  // Inline "Add Brand New Stop" modal inside Route Creator
  const [showInlineNewStop, setShowInlineNewStop] = useState(false);
  const [inlineStopId, setInlineStopId] = useState('');
  const [inlineStopName, setInlineStopName] = useState('');
  const [inlineLat, setInlineLat] = useState('26.8500');
  const [inlineLng, setInlineLng] = useState('75.7500');
  const [inlineDesc, setInlineDesc] = useState('');

  // Pre-fill route suggestion
  const openCreateModal = () => {
    const nextNum = routes.length + 1;
    const numPad = String(nextNum).padStart(2, '0');
    setNewRouteId(`ROUTE-${numPad}`);
    setNewRouteCode(`R-${numPad}`);
    setNewRouteName(nextNum === 4 ? 'Jaipur Central Circuit' : `Jaipur Transit Circuit ${numPad}`);
    setNewRouteDesc('University campus circuit linking transit hubs');
    setNewRouteColor(nextNum === 4 ? '#E8590C' : '#2B4A7E');

    // Pre-select JKLU Campus Origin as initial starting stop
    const originStop = stops.find((s) => s.stop_id === 'STOP-JKLU-START' || s.stop_id.includes('JKLU'));
    setSelectedStopIds(originStop ? [originStop.stop_id] : []);

    // Pre-select available active shuttle
    const availableShuttle = shuttles.find(
      (s) => s.status === 'ACTIVE' && !trips.some((t) => t.shuttle_id === s.shuttle_id && t.running_status === 'RUNNING')
    );
    setNewAssignedShuttleId(availableShuttle?.shuttle_id || shuttles[0]?.shuttle_id || '');

    // Pre-select available driver
    const availableDriver = drivers.find(
      (d) => !trips.some((t) => t.driver_id === d.driver_id && t.running_status === 'RUNNING')
    );
    setNewAssignedDriverId(availableDriver?.driver_id || drivers[0]?.driver_id || '');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNewStartTime(timeStr);
    setNewInstructions('Assigned from Campus Admin Operations');
    setCreateError('');
    setCreateSuccessMsg('');
    setShowCreateModal(true);
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setCreateSuccessMsg('');
    setCreateError('');
    if (onCloseCreateModal) onCloseCreateModal();
  };

  // Get stops for a route in exact sequence
  const getRouteStopsList = (routeId: string) => {
    return routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => {
        const stop = stops.find((s) => s.stop_id === rs.stop_id);
        return {
          sequence: rs.sequence_number,
          stop_id: rs.stop_id,
          stop_name: stop?.stop_name || rs.stop_id,
          description: stop?.description || '',
          lat: stop?.latitude,
          lng: stop?.longitude
        };
      });
  };

  // Open Details Modal
  const handleOpenDetails = (r: Route) => {
    setSelectedRoute(r);
    setIsViewingDetails(true);
    setIsEditingRoute(false);
    setEditName(r.route_name);
    setEditCode(r.route_code);
    setEditDesc(r.description);
    setEditColor(r.color);
    setEditAssignedDriverId(r.assigned_driver_id || '');
    setEditAssignedShuttleId(r.assigned_shuttle_id || '');
    setEditSearchStop('');
  };

  // Move a stop up or down in the sequence
  const handleMoveStop = (routeId: string, index: number, direction: 'up' | 'down') => {
    const currentList = getRouteStopsList(routeId);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const stopIds = currentList.map((s) => s.stop_id);

    const temp = stopIds[index];
    stopIds[index] = stopIds[targetIndex];
    stopIds[targetIndex] = temp;

    const r = routes.find((rt) => rt.route_id === routeId);
    if (r) {
      updateRoute(r, stopIds);
    }
  };

  // Add stop to existing route in Details modal
  const handleAddStopToExistingRoute = (routeId: string, stopId: string) => {
    const currentList = getRouteStopsList(routeId);
    const stopIds = [...currentList.map((s) => s.stop_id), stopId];
    const r = routes.find((rt) => rt.route_id === routeId);
    if (r) {
      updateRoute({ ...r, total_stops: stopIds.length }, stopIds);
    }
  };

  // Remove stop from route
  const handleRemoveStopFromRoute = (routeId: string, stopId: string) => {
    const currentList = getRouteStopsList(routeId);
    if (currentList.length <= 2) {
      alert('A route must have at least 2 stops in its circuit.');
      return;
    }
    const remaining = currentList.filter((s) => s.stop_id !== stopId).map((s) => s.stop_id);
    const r = routes.find((rt) => rt.route_id === routeId);
    if (r) {
      updateRoute({ ...r, total_stops: remaining.length }, remaining);
    }
  };

  // Save edited route info
  const handleSaveRouteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    const updated: Route = {
      ...selectedRoute,
      route_name: editName.trim(),
      route_code: editCode.trim().toUpperCase(),
      description: editDesc.trim(),
      color: editColor,
      assigned_driver_id: editAssignedDriverId || undefined,
      assigned_shuttle_id: editAssignedShuttleId || undefined
    };

    updateRoute(updated, undefined, editAssignedDriverId || undefined, editAssignedShuttleId || undefined);
    setSelectedRoute(updated);
    setIsEditingRoute(false);
  };

  // Cancel Route (propagates immediately to driver & student portals)
  const handleCancelRoute = (routeId: string) => {
    if (confirm(`Are you sure you want to cancel Route ${routeId}? All active and scheduled trips on this corridor will be cancelled, and assigned drivers and students will be updated immediately.`)) {
      const res = cancelRoute(routeId);
      if (res.success) {
        setIsViewingDetails(false);
        setSelectedRoute(null);
      } else {
        alert(res.error || 'Failed to cancel route.');
      }
    }
  };

  // Delete Route with safety check
  const handleDeleteRoute = (routeId: string) => {
    const activeTrip = trips.find(
      (t) => t.route_id === routeId && (t.running_status === 'RUNNING' || t.running_status === 'SCHEDULED')
    );
    if (activeTrip) {
      alert(
        `Cannot delete Route ${routeId}: Trip ${activeTrip.trip_id} is currently ${activeTrip.running_status}. Complete or cancel dependent trips first.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete Route ${routeId}? This will remove its stop sequence associations.`)) {
      const res = deleteRoute(routeId);
      if (res.success) {
        setIsViewingDetails(false);
        setSelectedRoute(null);
      } else {
        alert(res.error || 'Failed to delete route.');
      }
    }
  };

  // Route Creator - Submit
  const handleCreateRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccessMsg('');

    if (selectedStopIds.length < 2) {
      setCreateError('Please select at least 2 stops to form a valid route circuit.');
      return;
    }

    setIsSubmitting(true);
    const res = createRouteWithAssignment({
      route_id: newRouteId,
      route_name: newRouteName,
      route_code: newRouteCode,
      description: newRouteDesc,
      color: newRouteColor,
      stop_ids: selectedStopIds,
      assigned_shuttle_id: newAssignedShuttleId || undefined,
      assigned_driver_id: newAssignedDriverId || undefined,
      start_time: newStartTime,
      instructions: newInstructions
    });
    setIsSubmitting(false);

    if (res.success) {
      const drv = drivers.find((d) => d.driver_id === newAssignedDriverId);
      const sht = shuttles.find((s) => s.shuttle_id === newAssignedShuttleId);
      const drvName = drv ? drv.name : 'Assigned Driver';
      const shtName = sht ? sht.shuttle_number : 'Assigned Shuttle';

      setCreateSuccessMsg(
        `Route ${newRouteCode} successfully created! Saved to database and assigned to ${drvName} (${shtName}). Real-time dispatch notification sent.`
      );

      setTimeout(() => {
        handleCloseCreate();
      }, 1800);
    } else {
      setCreateError(res.error || 'Failed to create route.');
    }
  };

  // Inline Add New Stop submit
  const handleAddInlineStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineStopName.trim()) return;

    const genId = inlineStopId.trim() || `STOP-${inlineStopName.trim().toUpperCase().replace(/\s+/g, '-')}`;
    const newStop: Stop = {
      stop_id: genId,
      stop_name: inlineStopName.trim().toUpperCase(),
      latitude: parseFloat(inlineLat) || 26.85,
      longitude: parseFloat(inlineLng) || 75.75,
      description: inlineDesc.trim() || 'University Designated Stop'
    };

    const res = createStop(newStop);
    if (res.success) {
      setSelectedStopIds((prev) => [...prev, newStop.stop_id]);
      setShowInlineNewStop(false);
      setInlineStopName('');
      setInlineStopId('');
      setInlineDesc('');
    } else {
      alert(res.error || 'Could not add stop.');
    }
  };

  // Filter available stops for search in builder
  const filteredAvailableStops = stops.filter(
    (s) =>
      s.stop_name.toLowerCase().includes(stopSearchQuery.toLowerCase()) ||
      s.stop_id.toLowerCase().includes(stopSearchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(stopSearchQuery.toLowerCase()))
  );

  // Filter stops for Edit Route modal
  const filteredEditStops = stops.filter(
    (s) =>
      s.stop_name.toLowerCase().includes(editSearchStop.toLowerCase()) ||
      s.stop_id.toLowerCase().includes(editSearchStop.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1920px] mx-auto">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-[#2B4A7E]" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Route Management
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Configure university shuttle circuits, stop order sequences, route colors, and select from all 38 Jaipur stops.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#D9480F] text-white font-editorial font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Route</span>
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {routes.map((route) => {
          const routeStopsList = getRouteStopsList(route.route_id);
          const activeTripsOnRoute = trips.filter(
            (t) => t.route_id === route.route_id && t.running_status === 'RUNNING'
          );

          return (
            <div
              key={route.route_id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Badge & Color indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-black text-white shadow-sm"
                      style={{ backgroundColor: route.color || '#2B4A7E' }}
                    >
                      {route.route_code}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400 font-bold">
                      {route.route_id}
                    </span>
                  </div>

                  {activeTripsOnRoute.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {activeTripsOnRoute.length} Live
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      Standby
                    </span>
                  )}
                </div>

                {/* Route Name & Description */}
                <div>
                  <h3 className="font-editorial font-bold text-base text-stone-900 group-hover:text-[#2B4A7E] transition-colors">
                    {route.route_name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                    {route.description}
                  </p>
                </div>

                {/* Assigned Shuttle & Driver Badges */}
                {(() => {
                  const assignedSht = shuttles.find((s) => s.shuttle_id === route.assigned_shuttle_id);
                  const assignedDrv = drivers.find((d) => d.driver_id === route.assigned_driver_id);
                  return (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px] font-mono">
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Assigned Shuttle</span>
                        <span className="font-bold text-stone-800 truncate block mt-0.5">
                          {assignedSht ? `${assignedSht.shuttle_number}` : 'Unassigned'}
                        </span>
                        {assignedSht && (
                          <span className="text-[10px] text-stone-400 truncate block">
                            {assignedSht.registration_number}
                          </span>
                        )}
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Assigned Driver</span>
                        <span className="font-bold text-stone-800 truncate block mt-0.5">
                          {assignedDrv ? assignedDrv.name : 'Unassigned'}
                        </span>
                        {assignedDrv && (
                          <span className="text-[10px] text-stone-400 truncate block">
                            {assignedDrv.driver_id}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Stops Sequence Preview */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 uppercase">
                    <span>Circuit Sequence</span>
                    <span>{routeStopsList.length} Stops</span>
                  </div>

                  <div className="space-y-1 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100 max-h-36 overflow-y-auto">
                    {routeStopsList.map((item) => (
                      <div key={item.stop_id + item.sequence} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[10px] text-stone-400 font-bold w-4">
                          {String(item.sequence).padStart(2, '0')}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                        <span className="font-medium text-stone-700 truncate">
                          {item.stop_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenDetails(route)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Configure & Assign</span>
                </button>

                {route.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelRoute(route.route_id)}
                    title="Cancel Route"
                    className="p-2 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteRoute(route.route_id)}
                  title="Delete Route"
                  className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= ROUTE DETAILS / EDIT MODAL ================= */}
      {isViewingDetails && selectedRoute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-stone-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-white shadow-xs"
                    style={{ backgroundColor: selectedRoute.color }}
                  >
                    {selectedRoute.route_code}
                  </span>
                  <h2 className="font-editorial text-xl font-bold text-stone-900">
                    {selectedRoute.route_name}
                  </h2>
                </div>
                <p className="text-xs text-stone-500 font-mono">
                  Route ID: {selectedRoute.route_id} • Total Stops: {getRouteStopsList(selectedRoute.route_id).length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingRoute(!isEditingRoute)}
                  className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
                  title="Edit Route Info"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsViewingDetails(false)}
                  className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Edit Route Details Form (if toggled) */}
            {isEditingRoute && (
              <form onSubmit={handleSaveRouteEdit} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <h4 className="font-editorial font-bold text-xs uppercase tracking-wider text-[#2B4A7E]">
                  Edit Route Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-stone-600">Route Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-stone-600">Route Code</label>
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-stone-600">Description</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-stone-600">Route Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200"
                      />
                      <span className="font-mono text-xs">{editColor}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Shuttle & Driver in Edit Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                  <div>
                    <label className="text-[11px] font-medium text-stone-600 block mb-1">
                      Assigned Shuttle
                    </label>
                    <select
                      value={editAssignedShuttleId}
                      onChange={(e) => setEditAssignedShuttleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium"
                    >
                      <option value="">-- No Shuttle Assigned --</option>
                      {shuttles.map((s) => (
                        <option key={s.shuttle_id} value={s.shuttle_id} disabled={s.status !== 'ACTIVE'}>
                          {s.shuttle_number} ({s.registration_number}) {s.status !== 'ACTIVE' ? `[${s.status}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-600 block mb-1">
                      Assigned Driver (Operator)
                    </label>
                    <select
                      value={editAssignedDriverId}
                      onChange={(e) => setEditAssignedDriverId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium"
                    >
                      <option value="">-- No Driver Assigned --</option>
                      {drivers.map((d) => (
                        <option key={d.driver_id} value={d.driver_id}>
                          Captain {d.name} ({d.driver_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingRoute(false)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#2B4A7E] text-white text-xs font-bold font-editorial shadow-xs"
                  >
                    Save Changes & Reassign
                  </button>
                </div>
              </form>
            )}

            {/* Sequence Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial font-bold text-sm text-stone-800">
                    Stops in Exact Sequence ({getRouteStopsList(selectedRoute.route_id).length})
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Route_Stop.sequence_number determines transit stop order. Drag or click arrows to reorder.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {getRouteStopsList(selectedRoute.route_id).map((item, idx, arr) => (
                  <div
                    key={item.stop_id + idx}
                    draggable
                    onDragStart={() => setEditDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (editDraggedIndex === null || editDraggedIndex === idx) return;
                      const currentList = getRouteStopsList(selectedRoute.route_id);
                      const stopIds = currentList.map((s) => s.stop_id);
                      const movedItem = stopIds.splice(editDraggedIndex, 1)[0];
                      stopIds.splice(idx, 0, movedItem);
                      updateRoute(selectedRoute, stopIds);
                      setEditDraggedIndex(null);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80 hover:bg-stone-100/60 transition-colors cursor-move"
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-mono font-bold text-xs text-[#2B4A7E] shadow-2xs shrink-0">
                        {String(item.sequence).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="font-editorial font-bold text-xs text-stone-900">
                          {item.stop_name}
                        </div>
                        <div className="text-[10px] font-mono text-stone-400">
                          {item.stop_id} • Lat: {item.lat?.toFixed(4)}, Lng: {item.lng?.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleMoveStop(selectedRoute.route_id, idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-[#2B4A7E] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStop(selectedRoute.route_id, idx, 'down')}
                        disabled={idx === arr.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-[#2B4A7E] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveStopFromRoute(selectedRoute.route_id, item.stop_id)}
                        title="Remove Stop from Route"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Stops from 38 Jaipur Locations to this route */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">
                  + Append Stop from Jaipur Locations
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editSearchStop}
                      onChange={(e) => setEditSearchStop(e.target.value)}
                      placeholder="Search Amer, WTP, Mansarovar, Hawa Mahal..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {filteredEditStops.slice(0, 15).map((st) => (
                    <button
                      key={st.stop_id}
                      type="button"
                      onClick={() => handleAddStopToExistingRoute(selectedRoute.route_id, st.stop_id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#2B4A7E] text-[#2B4A7E] hover:text-white text-[11px] font-editorial font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{st.stop_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteRoute(selectedRoute.route_id)}
                  className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-editorial font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Route</span>
                </button>

                {selectedRoute.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelRoute(selectedRoute.route_id)}
                    className="px-3.5 py-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-editorial font-bold flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cancel / Deactivate Route</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsViewingDetails(false)}
                className="px-5 py-2.5 rounded-xl bg-[#2B4A7E] text-white text-xs font-editorial font-bold shadow-md hover:bg-[#1E3A68]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ROUTE BUILDER / CREATE NEW ROUTE MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[94vh] overflow-y-auto border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E8590C]/10 text-[#E8590C]">
                  <span>ROUTE BUILDER • 38 JAIPUR LOCATIONS</span>
                </div>
                <h2 className="font-editorial text-xl sm:text-2xl font-black text-stone-900">
                  Create New Campus Shuttle Route
                </h2>
                <p className="text-xs text-stone-500">
                  Select and arrange stops from the 38 Jaipur locations plus JKLU Campus to build custom transit routes.
                </p>
              </div>

              <button
                onClick={handleCloseCreate}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            {/* Creation Form */}
            <form onSubmit={handleCreateRouteSubmit} className="space-y-6">
              {/* ROUTE INFORMATION SECTION */}
              <div className="space-y-3">
                <h3 className="font-editorial font-bold text-sm text-[#1E3A68] uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>1. Route Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-editorial font-bold text-stone-700 block mb-1">
                      Route ID
                    </label>
                    <input
                      type="text"
                      value={newRouteId}
                      onChange={(e) => setNewRouteId(e.target.value.toUpperCase())}
                      placeholder="ROUTE-04"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-editorial font-bold text-stone-700 block mb-1">
                      Route Code
                    </label>
                    <input
                      type="text"
                      value={newRouteCode}
                      onChange={(e) => setNewRouteCode(e.target.value.toUpperCase())}
                      placeholder="R-04"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-editorial font-bold text-stone-700 block mb-1">
                      Theme Color
                    </label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={newRouteColor}
                        onChange={(e) => setNewRouteColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                      />
                      <span className="font-mono text-xs text-stone-600 font-bold">{newRouteColor}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-editorial font-bold text-stone-700 block mb-1">
                      Route Name
                    </label>
                    <input
                      type="text"
                      value={newRouteName}
                      onChange={(e) => setNewRouteName(e.target.value)}
                      placeholder="e.g. Jaipur Central Circuit"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-editorial font-bold text-stone-700 block mb-1">
                      Description / Circuit Summary
                    </label>
                    <input
                      type="text"
                      value={newRouteDesc}
                      onChange={(e) => setNewRouteDesc(e.target.value)}
                      placeholder="JKLU Campus → Mansarovar → Malviya Nagar → WTP → DCM → JKLU"
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* STOP SELECTION / ROUTE BUILDER SECTION */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-editorial font-bold text-sm text-[#1E3A68] uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>2. Select Route Stops (38 Jaipur Locations + JKLU Campus)</span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Search and click <strong>+ Add</strong> on stops to assemble the route. Drag or use arrows to arrange sequence.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowInlineNewStop(true)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-editorial font-bold flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#E8590C]" />
                    <span>+ Custom Physical Stop</span>
                  </button>
                </div>

                {/* Inline Add Brand New Stop Modal (if needed by admin) */}
                {showInlineNewStop && (
                  <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="font-editorial font-bold text-xs text-[#E8590C] uppercase tracking-wider">
                        Quick Add New Physical Stop
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowInlineNewStop(false)}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-stone-600">Stop Name</label>
                        <input
                          type="text"
                          value={inlineStopName}
                          onChange={(e) => setInlineStopName(e.target.value)}
                          placeholder="JAGATPURA CIRCLE"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-stone-600">Stop ID (Optional)</label>
                        <input
                          type="text"
                          value={inlineStopId}
                          onChange={(e) => setInlineStopId(e.target.value.toUpperCase())}
                          placeholder="STOP-JAGATPURA"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-stone-600">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={inlineLat}
                          onChange={(e) => setInlineLat(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-stone-600">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={inlineLng}
                          onChange={(e) => setInlineLng(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddInlineStop}
                      className="px-4 py-2 rounded-xl bg-[#E8590C] text-white text-xs font-bold font-editorial"
                    >
                      Save Stop & Add to Route
                    </button>
                  </div>
                )}

                {/* 2-Column Stop Selector & Ordered Sequence Builder */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Searchable Stop Database */}
                  <div className="space-y-2 border border-stone-200 p-3.5 rounded-2xl bg-stone-50/50">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={stopSearchQuery}
                        onChange={(e) => setStopSearchQuery(e.target.value)}
                        placeholder="Search Amer, Jal Mahal, WTP, Mansarovar, Hawa Mahal..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium outline-none focus:border-[#2B4A7E]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-400 font-bold px-1">
                      <span>Available Stops ({filteredAvailableStops.length})</span>
                      <span>Total DB Stops: {stops.length}</span>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {filteredAvailableStops.map((stop) => {
                        return (
                          <div
                            key={stop.stop_id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200/80 hover:border-blue-300 text-xs transition-colors group"
                          >
                            <div className="truncate pr-2">
                              <div className="font-editorial font-bold text-stone-800 truncate group-hover:text-[#2B4A7E]">
                                {stop.stop_name}
                              </div>
                              <div className="text-[10px] font-mono text-stone-400 truncate">
                                {stop.stop_id} • {stop.description || 'Jaipur Stop'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStopIds((prev) => [...prev, stop.stop_id]);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#2B4A7E] text-[#2B4A7E] hover:text-white font-mono text-[11px] font-bold transition-colors shrink-0"
                            >
                              + Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Ordered Route Sequence Builder with Drag-and-Drop */}
                  <div className="space-y-2 border border-[#2B4A7E]/20 p-3.5 rounded-2xl bg-blue-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-mono text-[#1E3A68] font-bold">
                        Selected Stops in Order ({selectedStopIds.length})
                      </span>
                      {selectedStopIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedStopIds([])}
                          className="text-[10px] text-red-500 hover:underline font-bold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {selectedStopIds.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-stone-200 rounded-xl text-stone-400 text-xs space-y-1">
                        <MapPin className="w-6 h-6 mx-auto text-stone-300" />
                        <p className="font-medium">No stops selected yet.</p>
                        <p className="text-[10px]">Select stops on the left to arrange your custom route circuit.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {selectedStopIds.map((sid, idx) => {
                          const stopInfo = stops.find((s) => s.stop_id === sid);

                          return (
                            <div
                              key={sid + idx}
                              draggable
                              onDragStart={() => setDraggedIndex(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggedIndex === null || draggedIndex === idx) return;
                                const copy = [...selectedStopIds];
                                const item = copy.splice(draggedIndex, 1)[0];
                                copy.splice(idx, 0, item);
                                setSelectedStopIds(copy);
                                setDraggedIndex(null);
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs text-xs cursor-move hover:border-blue-400 transition-all"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <GripVertical className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                                <span className="w-6 h-6 rounded-md bg-[#2B4A7E] text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 shadow-xs">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span className="text-stone-300 font-mono text-[10px]">→</span>
                                <span className="font-editorial font-bold text-stone-800 truncate">
                                  {stopInfo?.stop_name || sid}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (idx === 0) return;
                                    const copy = [...selectedStopIds];
                                    const temp = copy[idx];
                                    copy[idx] = copy[idx - 1];
                                    copy[idx - 1] = temp;
                                    setSelectedStopIds(copy);
                                  }}
                                  disabled={idx === 0}
                                  title="Move Up"
                                  className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30"
                                >
                                  <MoveUp className="w-3 h-3 text-stone-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (idx === selectedStopIds.length - 1) return;
                                    const copy = [...selectedStopIds];
                                    const temp = copy[idx];
                                    copy[idx] = copy[idx + 1];
                                    copy[idx + 1] = temp;
                                    setSelectedStopIds(copy);
                                  }}
                                  disabled={idx === selectedStopIds.length - 1}
                                  title="Move Down"
                                  className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30"
                                >
                                  <MoveDown className="w-3 h-3 text-stone-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStopIds((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  title="Remove Stop"
                                  className="p-1 text-red-500 hover:bg-red-50 rounded ml-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: ASSIGN SHUTTLE & DRIVER */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="space-y-0.5">
                  <h3 className="font-editorial font-bold text-sm text-[#1E3A68] uppercase tracking-wider flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#E8590C]" />
                    <span>3. Assign Shuttle & Driver (Real-Time Driver Dispatch)</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Assign an active university shuttle vehicle and driver. Upon saving, a scheduled trip and real-time database notification are dispatched to the driver's portal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shuttle Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-editorial font-bold text-stone-700 block">
                      Assigned Shuttle Vehicle
                    </label>
                    <select
                      value={newAssignedShuttleId}
                      onChange={(e) => setNewAssignedShuttleId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium outline-none focus:border-[#2B4A7E]"
                    >
                      <option value="">-- Do Not Assign Shuttle Now --</option>
                      {shuttles.map((s) => (
                        <option
                          key={s.shuttle_id}
                          value={s.shuttle_id}
                          disabled={s.status !== 'ACTIVE'}
                        >
                          {s.shuttle_number} ({s.registration_number}) — {s.capacity} seats {s.status !== 'ACTIVE' ? `[${s.status}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Driver Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-editorial font-bold text-stone-700 block">
                      Assigned Driver (Operator)
                    </label>
                    <select
                      value={newAssignedDriverId}
                      onChange={(e) => setNewAssignedDriverId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium outline-none focus:border-[#2B4A7E]"
                    >
                      <option value="">-- Do Not Assign Driver Now --</option>
                      {drivers.map((d) => (
                        <option key={d.driver_id} value={d.driver_id}>
                          Captain {d.name} ({d.driver_id}) • Lic: {d.license_no}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-editorial font-bold text-stone-700 block">
                      Scheduled Departure Time
                    </label>
                    <input
                      type="text"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold outline-none focus:border-[#2B4A7E]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-editorial font-bold text-stone-700 block">
                      Driver Instructions / Dispatch Notes
                    </label>
                    <input
                      type="text"
                      value={newInstructions}
                      onChange={(e) => setNewInstructions(e.target.value)}
                      placeholder="e.g. Depart from Bay 1, stop at all designated campus stops"
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium outline-none focus:border-[#2B4A7E]"
                    />
                  </div>
                </div>

                {/* Error Banner in Form */}
                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Success Banner in Form */}
                {createSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn font-editorial font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    <span>{createSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-mono">
                  {selectedStopIds.length} stops selected • Stored in Route_Stop
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseCreate}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-editorial font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !!createSuccessMsg}
                    className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#D9480F] disabled:opacity-50 text-white font-editorial font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving & Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create & Dispatch Route</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
