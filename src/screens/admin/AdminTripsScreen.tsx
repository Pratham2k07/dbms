import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trip, TripStop } from '../../types/database';
import {
  CalendarCheck,
  Plus,
  Play,
  Square,
  X,
  AlertTriangle,
  Clock,
  Bus,
  Users,
  Route as RouteIcon,
  CheckCircle2,
  ChevronRight,
  Eye,
  Sliders,
  Filter,
  Check
} from 'lucide-react';

interface AdminTripsScreenProps {
  isCreateTripModalOpen?: boolean;
  onCloseCreateTripModal?: () => void;
}

export const AdminTripsScreen: React.FC<AdminTripsScreenProps> = ({
  isCreateTripModalOpen: initialCreateOpen = false,
  onCloseCreateTripModal
}) => {
  const {
    trips,
    routes,
    shuttles,
    drivers,
    tripStops,
    stops,
    routeStops,
    createTrip,
    updateTrip,
    cancelTrip,
    handleStartTrip,
    handleEndTrip,
    updateTripCapacity,
    updateTripStopArrivalStatus,
    setSelectedTripId,
    setSelectedRouteId,
    setCurrentScreen
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState<boolean>(initialCreateOpen);
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Step-by-step Create Trip Wizard State (Steps 1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedRouteIdState, setSelectedRouteIdState] = useState<string>('');
  const [selectedShuttleIdState, setSelectedShuttleIdState] = useState<string>('');
  const [selectedDriverIdState, setSelectedDriverIdState] = useState<string>('');
  const [startTimeState, setStartTimeState] = useState<string>('10:30 AM');
  const [endTimeState, setEndTimeState] = useState<string>('');
  const [wizardError, setWizardError] = useState<string>('');

  // Open Create Wizard
  const handleOpenCreateWizard = () => {
    setCurrentStep(1);
    setSelectedRouteIdState(routes[0]?.route_id || '');
    // Pre-select first active shuttle not in maintenance or offline
    const availableShuttle = shuttles.find(
      (s) => s.status === 'ACTIVE' && !trips.some((t) => t.shuttle_id === s.shuttle_id && t.running_status === 'RUNNING')
    );
    setSelectedShuttleIdState(availableShuttle?.shuttle_id || '');
    // Pre-select first available driver
    const availableDriver = drivers.find(
      (d) => !trips.some((t) => t.driver_id === d.driver_id && t.running_status === 'RUNNING')
    );
    setSelectedDriverIdState(availableDriver?.driver_id || '');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStartTimeState(timeStr);
    setEndTimeState('');
    setWizardError('');
    setShowCreateModal(true);
  };

  const handleCloseWizard = () => {
    setShowCreateModal(false);
    if (onCloseCreateTripModal) onCloseCreateTripModal();
  };

  // Helper names
  const getShuttleName = (id: string) => {
    const s = shuttles.find((item) => item.shuttle_id === id);
    return s ? `${s.shuttle_number} (${s.registration_number})` : id;
  };

  const getDriverName = (id: string) => {
    const d = drivers.find((item) => item.driver_id === id);
    return d ? d.name : id;
  };

  const getRouteInfo = (id: string) => {
    return routes.find((item) => item.route_id === id);
  };

  // Wizard Step Next handler with strict validations
  const handleNextStep = () => {
    setWizardError('');

    if (currentStep === 1) {
      if (!selectedRouteIdState) {
        setWizardError('Please select a route for this trip.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedShuttleIdState) {
        setWizardError('Please select a shuttle for this trip.');
        return;
      }
      const sht = shuttles.find((s) => s.shuttle_id === selectedShuttleIdState);
      if (sht?.status === 'MAINTENANCE') {
        setWizardError(`Shuttle ${sht.shuttle_number} is in MAINTENANCE and cannot be scheduled.`);
        return;
      }
      if (sht?.status === 'OFFLINE') {
        setWizardError(`Shuttle ${sht.shuttle_number} is OFFLINE and cannot be scheduled.`);
        return;
      }
      const isAlreadyRunning = trips.some(
        (t) => t.shuttle_id === selectedShuttleIdState && t.running_status === 'RUNNING'
      );
      if (isAlreadyRunning) {
        setWizardError(`Shuttle ${sht?.shuttle_number} is currently operating another active trip.`);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedDriverIdState) {
        setWizardError('Please select a driver for this trip.');
        return;
      }
      const isDriverBusy = trips.some(
        (t) => t.driver_id === selectedDriverIdState && t.running_status === 'RUNNING'
      );
      if (isDriverBusy) {
        const d = drivers.find((drv) => drv.driver_id === selectedDriverIdState);
        setWizardError(`Driver ${d?.name || selectedDriverIdState} is already operating another active trip.`);
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!startTimeState.trim()) {
        setWizardError('Please specify a start time.');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    }
  };

  // Wizard Step 6 Submit
  const handleFinalCreateTrip = () => {
    const res = createTrip({
      route_id: selectedRouteIdState,
      shuttle_id: selectedShuttleIdState,
      driver_id: selectedDriverIdState,
      start_time: startTimeState,
      end_time: endTimeState || null
    });

    if (res.success) {
      handleCloseWizard();
    } else {
      setWizardError(res.error || 'Failed to create trip.');
    }
  };

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.running_status === filterStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#2B4A7E]" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Trip Scheduling & Lifecycle Management
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Dispatch shuttles, assign drivers, generate automated Trip_Stop arrival estimates, and monitor real-time lifecycle.
          </p>
        </div>

        <button
          onClick={handleOpenCreateWizard}
          className="px-4 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#D9480F] text-white font-editorial font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create / Schedule Trip</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'RUNNING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-editorial font-bold transition-all ${
              filterStatus === st
                ? 'bg-[#2B4A7E] text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {st} ({st === 'ALL' ? trips.length : trips.filter((t) => t.running_status === st).length})
          </button>
        ))}
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-mono uppercase tracking-wider text-stone-400">
                <th className="pb-3 font-semibold">Trip ID</th>
                <th className="pb-3 font-semibold">Route</th>
                <th className="pb-3 font-semibold">Assigned Shuttle</th>
                <th className="pb-3 font-semibold">Assigned Driver</th>
                <th className="pb-3 font-semibold">Start / End Time</th>
                <th className="pb-3 font-semibold">Capacity</th>
                <th className="pb-3 font-semibold">Running Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredTrips.map((trip) => {
                const route = getRouteInfo(trip.route_id);
                const shuttle = shuttles.find((s) => s.shuttle_id === trip.shuttle_id);
                const driver = drivers.find((d) => d.driver_id === trip.driver_id);

                return (
                  <tr key={trip.trip_id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pr-3 font-mono font-bold text-stone-900">
                      {trip.trip_id}
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-2xs"
                          style={{ backgroundColor: route?.color || '#2B4A7E' }}
                        >
                          {route?.route_code}
                        </span>
                        <span className="font-medium text-stone-800 truncate max-w-[130px] sm:max-w-xs">
                          {route?.route_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="font-editorial font-bold text-stone-800">
                        {shuttle?.shuttle_number || trip.shuttle_id}
                      </div>
                      <div className="text-[10px] font-mono text-stone-400">
                        {shuttle?.registration_number}
                      </div>
                    </td>

                    <td className="py-3.5 pr-3 font-medium text-stone-700">
                      {driver?.name || trip.driver_id}
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-stone-700">
                      <div>Start: {trip.start_time}</div>
                      {trip.end_time && <div className="text-stone-400">End: {trip.end_time}</div>}
                    </td>

                    <td className="py-3.5 pr-3">
                      <select
                        value={trip.capacity_status}
                        onChange={(e) => updateTripCapacity(trip.trip_id, e.target.value as any)}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border outline-none ${
                          trip.capacity_status === 'FULL'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : trip.capacity_status === 'MODERATE'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="MODERATE">MODERATE</option>
                        <option value="FULL">FULL</option>
                      </select>
                    </td>

                    <td className="py-3.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          trip.running_status === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trip.running_status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : trip.running_status === 'COMPLETED'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {trip.running_status === 'RUNNING' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {trip.running_status}
                      </span>
                    </td>

                    <td className="py-3.5 text-right space-x-1 shrink-0">
                      {trip.running_status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => handleStartTrip(trip.trip_id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-editorial font-bold text-[11px] transition-all inline-flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                          <button
                            onClick={() => cancelTrip(trip.trip_id)}
                            className="px-2 py-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 text-[11px]"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {trip.running_status === 'RUNNING' && (
                        <>
                          <button
                            onClick={() => handleEndTrip(trip.trip_id)}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white font-editorial font-bold text-[11px] transition-all inline-flex items-center gap-1"
                          >
                            <Square className="w-3 h-3" />
                            <span>End</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTripId(trip.trip_id);
                              setSelectedRouteId(trip.route_id);
                              setCurrentScreen('admin-live-tracking');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-[11px] transition-all"
                          >
                            Track
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setSelectedTripDetails(trip)}
                        title="View Trip Stops"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= STEP 1 TO 6 CREATE TRIP WIZARD MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-stone-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#E8590C] uppercase tracking-wider">
                  Step {currentStep} of 6 • Trip Dispatch Wizard
                </span>
                <h2 className="font-editorial text-xl font-bold text-stone-900">
                  {currentStep === 1 && 'Step 1: Select Route'}
                  {currentStep === 2 && 'Step 2: Select Shuttle'}
                  {currentStep === 3 && 'Step 3: Select Driver'}
                  {currentStep === 4 && 'Step 4: Set Start Time'}
                  {currentStep === 5 && 'Step 5: Set End Time (Optional)'}
                  {currentStep === 6 && 'Step 6: Confirm & Create Trip'}
                </h2>
              </div>
              <button onClick={handleCloseWizard} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {wizardError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: SELECT ROUTE */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  Choose the university shuttle route for this scheduled run:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {routes.map((r) => (
                    <label
                      key={r.route_id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedRouteIdState === r.route_id
                          ? 'border-[#2B4A7E] bg-blue-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="routeSelect"
                          checked={selectedRouteIdState === r.route_id}
                          onChange={() => setSelectedRouteIdState(r.route_id)}
                          className="text-[#2B4A7E]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white"
                              style={{ backgroundColor: r.color }}
                            >
                              {r.route_code}
                            </span>
                            <span className="font-editorial font-bold text-xs text-stone-900">
                              {r.route_name}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {r.description}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 shrink-0">
                        {r.total_stops} Stops
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: SELECT SHUTTLE */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  Select an ACTIVE university shuttle vehicle. (Maintenance & Offline shuttles disabled):
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {shuttles.map((s) => {
                    const isBusy = trips.some(
                      (t) => t.shuttle_id === s.shuttle_id && t.running_status === 'RUNNING'
                    );
                    const isDisabled = s.status !== 'ACTIVE' || isBusy;

                    return (
                      <label
                        key={s.shuttle_id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isDisabled
                            ? 'opacity-50 bg-stone-50 border-stone-200 cursor-not-allowed'
                            : selectedShuttleIdState === s.shuttle_id
                            ? 'border-[#2B4A7E] bg-blue-50/50 shadow-xs cursor-pointer'
                            : 'border-stone-200 hover:border-stone-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shuttleSelect"
                            disabled={isDisabled}
                            checked={selectedShuttleIdState === s.shuttle_id}
                            onChange={() => setSelectedShuttleIdState(s.shuttle_id)}
                            className="text-[#2B4A7E]"
                          />
                          <div>
                            <div className="font-editorial font-bold text-xs text-stone-900">
                              {s.shuttle_number}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400">
                              {s.registration_number} • Capacity: {s.capacity} seats
                            </div>
                          </div>
                        </div>

                        <div>
                          {isBusy ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                              Already Running
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                s.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : s.status === 'MAINTENANCE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {s.status}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT DRIVER */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  Assign an available certified shuttle driver:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {drivers.map((d) => {
                    const isBusy = trips.some(
                      (t) => t.driver_id === d.driver_id && t.running_status === 'RUNNING'
                    );

                    return (
                      <label
                        key={d.driver_id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isBusy
                            ? 'opacity-50 bg-stone-50 border-stone-200 cursor-not-allowed'
                            : selectedDriverIdState === d.driver_id
                            ? 'border-[#2B4A7E] bg-blue-50/50 shadow-xs cursor-pointer'
                            : 'border-stone-200 hover:border-stone-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="driverSelect"
                            disabled={isBusy}
                            checked={selectedDriverIdState === d.driver_id}
                            onChange={() => setSelectedDriverIdState(d.driver_id)}
                            className="text-[#2B4A7E]"
                          />
                          <div>
                            <div className="font-editorial font-bold text-xs text-stone-900">
                              {d.name}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400">
                              License: {d.license_no} • {d.phone_number}
                            </div>
                          </div>
                        </div>

                        {isBusy ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                            On Active Trip
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: SET START TIME */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  Specify scheduled trip departure time:
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-editorial font-bold text-stone-700 block">
                    Departure Time (e.g. 10:30 AM or 02:15 PM)
                  </label>
                  <input
                    type="text"
                    value={startTimeState}
                    onChange={(e) => setStartTimeState(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono font-bold"
                  />
                  <div className="flex items-center gap-2 pt-2">
                    {['09:00 AM', '10:30 AM', '01:15 PM', '04:00 PM', '06:30 PM'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setStartTimeState(t)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] font-mono text-stone-700"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: SET END TIME (OPTIONAL) */}
            {currentStep === 5 && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  Optionally specify estimated completion / terminus arrival time:
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-editorial font-bold text-stone-700 block">
                    Estimated Terminus Arrival (Optional)
                  </label>
                  <input
                    type="text"
                    value={endTimeState}
                    onChange={(e) => setEndTimeState(e.target.value)}
                    placeholder="e.g. 11:45 AM (or leave blank for auto)"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono font-bold"
                  />
                  <p className="text-[11px] text-stone-400">
                    If left blank, the system automatically schedules stops with sequential intervals.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 6: CONFIRM & CREATE */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <h4 className="font-editorial font-bold text-xs uppercase tracking-wider text-[#2B4A7E]">
                    Trip Summary & Validation Passed
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-mono">Route</span>
                      <span className="font-bold text-stone-900">
                        {getRouteInfo(selectedRouteIdState)?.route_name} ({selectedRouteIdState})
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-mono">Shuttle</span>
                      <span className="font-bold text-stone-900">
                        {getShuttleName(selectedShuttleIdState)}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-mono">Driver</span>
                      <span className="font-bold text-stone-900">
                        {getDriverName(selectedDriverIdState)}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-mono">Departure</span>
                      <span className="font-mono font-bold text-stone-900">{startTimeState}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-100 text-[11px] text-[#2B4A7E] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Automatic association: Trip_Stop records will be generated for all route stops with status SCHEDULED.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-editorial font-bold text-xs"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-[#2B4A7E] hover:bg-[#1E3A68] text-white font-editorial font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalCreateTrip}
                  className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#D9480F] text-white font-editorial font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create & Schedule Trip</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TRIP DETAILS & TRIP_STOPS MODAL ================= */}
      {selectedTripDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-stone-200">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial text-lg font-bold text-stone-900">
                    Trip Telemetry & Stop Schedule
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
                    {selectedTripDetails.trip_id}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Associated Trip_Stop records, scheduled arrival vs actual arrival
                </p>
              </div>

              <button onClick={() => setSelectedTripDetails(null)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Info Pills & Reassignment Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 font-mono block mb-1">ROUTE CORRIDOR</span>
                <span className="font-bold text-stone-800 block">{selectedTripDetails.route_id}</span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {getRouteInfo(selectedTripDetails.route_id)?.route_name}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-mono block mb-1">ASSIGNED SHUTTLE</span>
                <select
                  value={selectedTripDetails.shuttle_id}
                  disabled={selectedTripDetails.running_status === 'COMPLETED' || selectedTripDetails.running_status === 'CANCELLED'}
                  onChange={(e) => {
                    const newShuttleId = e.target.value;
                    const updated = { ...selectedTripDetails, shuttle_id: newShuttleId };
                    updateTrip(updated);
                    setSelectedTripDetails(updated);
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-stone-200 bg-white font-editorial font-bold text-stone-800 text-xs"
                >
                  {shuttles.map((s) => (
                    <option key={s.shuttle_id} value={s.shuttle_id} disabled={s.status !== 'ACTIVE'}>
                      {s.shuttle_number} ({s.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-mono block mb-1">ASSIGNED DRIVER (OPERATOR)</span>
                <select
                  value={selectedTripDetails.driver_id}
                  disabled={selectedTripDetails.running_status === 'COMPLETED' || selectedTripDetails.running_status === 'CANCELLED'}
                  onChange={(e) => {
                    const newDriverId = e.target.value;
                    const updated = { ...selectedTripDetails, driver_id: newDriverId };
                    updateTrip(updated);
                    setSelectedTripDetails(updated);
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-stone-200 bg-white font-editorial font-bold text-stone-800 text-xs"
                >
                  {drivers.map((d) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.name} ({d.driver_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-mono block mb-1">RUNNING STATUS</span>
                <span
                  className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-lg border uppercase ${
                    selectedTripDetails.running_status === 'RUNNING'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedTripDetails.running_status === 'CANCELLED'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : selectedTripDetails.running_status === 'COMPLETED'
                      ? 'bg-stone-100 text-stone-700 border-stone-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {selectedTripDetails.running_status}
                </span>
              </div>
            </div>

            {/* Trip_Stop Records Sequence */}
            <div className="space-y-3">
              <h4 className="font-editorial font-bold text-xs uppercase tracking-wider text-stone-400">
                Trip_Stop Sequence Records ({tripStops.filter((ts) => ts.trip_id === selectedTripDetails.trip_id).length})
              </h4>

              <div className="space-y-2">
                {tripStops
                  .filter((ts) => ts.trip_id === selectedTripDetails.trip_id)
                  .map((ts, idx) => {
                    const stop = stops.find((s) => s.stop_id === ts.stop_id);

                    return (
                      <div
                        key={ts.stop_id + idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-mono font-bold text-[11px] text-[#2B4A7E]">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-editorial font-bold text-stone-900">
                              {stop?.stop_name || ts.stop_id}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400">
                              Sched: {ts.scheduled_arrival} • Est: {ts.estimated_arrival}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={ts.arrival_status}
                            onChange={(e) =>
                              updateTripStopArrivalStatus(ts.trip_id, ts.stop_id, e.target.value as any)
                            }
                            className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border outline-none ${
                              ts.arrival_status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ts.arrival_status === 'APPROACHING'
                                ? 'bg-orange-50 text-orange-800 border-orange-200 animate-pulse'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="APPROACHING">APPROACHING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="SKIPPED">SKIPPED</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTripDetails(null)}
                className="px-5 py-2 rounded-xl bg-[#2B4A7E] text-white text-xs font-bold font-editorial shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
