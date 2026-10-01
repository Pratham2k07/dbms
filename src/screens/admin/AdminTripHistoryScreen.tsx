import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trip, TripStop } from '../../types/database';
import {
  History,
  Filter,
  Eye,
  X,
  Calendar,
  Bus,
  Users,
  Route as RouteIcon,
  CheckCircle2,
  Clock,
  Search,
  Download
} from 'lucide-react';

export const AdminTripHistoryScreen: React.FC = () => {
  const { trips, routes, shuttles, drivers, tripStops, stops } = useApp();

  const [filterRoute, setFilterRoute] = useState<string>('ALL');
  const [filterShuttle, setFilterShuttle] = useState<string>('ALL');
  const [filterDriver, setFilterDriver] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [inspectTrip, setInspectTrip] = useState<Trip | null>(null);

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    if (filterRoute !== 'ALL' && t.route_id !== filterRoute) return false;
    if (filterShuttle !== 'ALL' && t.shuttle_id !== filterShuttle) return false;
    if (filterDriver !== 'ALL' && t.driver_id !== filterDriver) return false;
    if (filterStatus !== 'ALL' && t.running_status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = t.trip_id.toLowerCase().includes(q);
      const matchRoute = t.route_id.toLowerCase().includes(q);
      const matchShuttle = t.shuttle_id.toLowerCase().includes(q);
      if (!matchId && !matchRoute && !matchShuttle) return false;
    }

    return true;
  });

  const getShuttle = (id: string) => shuttles.find((s) => s.shuttle_id === id);
  const getDriver = (id: string) => drivers.find((d) => d.driver_id === id);
  const getRoute = (id: string) => routes.find((r) => r.route_id === id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#2B4A7E]" />
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Trip History & Operations Archive
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Historical logs of university shuttle runs, completed cycles, driver assignments, and Trip_Stop arrival checkpoints.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600">
          <span>Total Records: {trips.length}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-editorial font-bold text-stone-700">
            <Filter className="w-4 h-4 text-[#2B4A7E]" />
            <span>Filter Archives</span>
          </div>

          {(filterRoute !== 'ALL' || filterShuttle !== 'ALL' || filterDriver !== 'ALL' || filterStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilterRoute('ALL');
                setFilterShuttle('ALL');
                setFilterDriver('ALL');
                setFilterStatus('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-[#E8590C] hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
              Search ID / Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Trip ID, Route..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs outline-none"
              />
            </div>
          </div>

          {/* Route Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
              Route
            </label>
            <select
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
            >
              <option value="ALL">All Routes</option>
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.route_code} — {r.route_name}
                </option>
              ))}
            </select>
          </div>

          {/* Shuttle Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
              Shuttle Vehicle
            </label>
            <select
              value={filterShuttle}
              onChange={(e) => setFilterShuttle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
            >
              <option value="ALL">All Shuttles</option>
              {shuttles.map((s) => (
                <option key={s.shuttle_id} value={s.shuttle_id}>
                  {s.shuttle_number}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
              Operating Driver
            </label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
            >
              <option value="ALL">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.driver_id} value={d.driver_id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
              Trip Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-mono uppercase tracking-wider text-stone-400">
                <th className="pb-3 font-semibold">Trip ID</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Route</th>
                <th className="pb-3 font-semibold">Shuttle</th>
                <th className="pb-3 font-semibold">Driver</th>
                <th className="pb-3 font-semibold">Start Time</th>
                <th className="pb-3 font-semibold">End Time</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredTrips.map((trip) => {
                const route = getRoute(trip.route_id);
                const shuttle = getShuttle(trip.shuttle_id);
                const driver = getDriver(trip.driver_id);

                return (
                  <tr key={trip.trip_id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pr-3 font-mono font-bold text-stone-900">
                      {trip.trip_id}
                    </td>

                    <td className="py-3.5 pr-3 text-stone-600 font-mono text-[11px]">
                      Today
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-2xs"
                          style={{ backgroundColor: route?.color || '#2B4A7E' }}
                        >
                          {route?.route_code}
                        </span>
                        <span className="font-medium text-stone-700 truncate max-w-[130px] sm:max-w-xs">
                          {route?.route_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 pr-3 font-medium text-stone-800">
                      {shuttle?.shuttle_number || trip.shuttle_id}
                    </td>

                    <td className="py-3.5 pr-3 text-stone-700">
                      {driver?.name || trip.driver_id}
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-stone-700">
                      {trip.start_time}
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-stone-700">
                      {trip.end_time || (trip.running_status === 'RUNNING' ? 'In Progress' : '—')}
                    </td>

                    <td className="py-3.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          trip.running_status === 'COMPLETED'
                            ? 'bg-stone-100 text-stone-700'
                            : trip.running_status === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trip.running_status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {trip.running_status}
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setInspectTrip(trip)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#2B4A7E] hover:bg-[#2B4A7E] hover:text-white font-editorial font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TRIP STOPS INSPECTION MODAL ================= */}
      {inspectTrip && (() => {
        const route = getRoute(inspectTrip.route_id);
        const shuttle = getShuttle(inspectTrip.shuttle_id);
        const driver = getDriver(inspectTrip.driver_id);
        const relatedTripStops = tripStops.filter((ts) => ts.trip_id === inspectTrip.trip_id);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-stone-200">
              <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold">
                      {inspectTrip.trip_id}
                    </span>
                    <h3 className="font-editorial text-lg font-bold text-stone-900">
                      Trip Operational Audit
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Comprehensive arrival/departure timestamps for every stop checkpoint
                  </p>
                </div>

                <button onClick={() => setInspectTrip(null)} className="text-stone-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">Route</span>
                  <span className="font-bold text-stone-800">{route?.route_code}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">Shuttle</span>
                  <span className="font-bold text-stone-800">{shuttle?.shuttle_number}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">Driver</span>
                  <span className="font-bold text-stone-800">{driver?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">Status</span>
                  <span className="font-mono font-bold text-emerald-700">{inspectTrip.running_status}</span>
                </div>
              </div>

              {/* Stop Audit Table */}
              <div className="space-y-3">
                <h4 className="font-editorial font-bold text-xs uppercase tracking-wider text-stone-400">
                  Trip_Stop Checkpoint Log
                </h4>

                <div className="space-y-2">
                  {relatedTripStops.map((ts, idx) => {
                    const stop = stops.find((s) => s.stop_id === ts.stop_id);

                    return (
                      <div
                        key={ts.stop_id + idx}
                        className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-stone-100 font-mono font-bold text-[10px] flex items-center justify-center text-stone-600">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-editorial font-bold text-stone-900">
                              {stop?.stop_name || ts.stop_id}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400">
                              Sched Arrival: {ts.scheduled_arrival}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              ts.arrival_status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ts.arrival_status === 'APPROACHING'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {ts.arrival_status}
                          </span>
                          <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                            Actual: {ts.actual_arrival || '—'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInspectTrip(null)}
                  className="px-5 py-2 rounded-xl bg-[#2B4A7E] text-white text-xs font-editorial font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
