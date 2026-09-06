import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/map/MapView';
import { ShuttleList } from '../components/shuttles/ShuttleList';
import { stopService } from '../services/stopService';
import { locationService } from '../services/locationService';
import { ArrowLeft, Footprints, MapPin, Bus } from 'lucide-react';

export const StopDetailsScreen: React.FC = () => {
  const {
    selectedStopId,
    stops,
    studentLocation,
    trips,
    tripStops,
    shuttles,
    routes,
    shuttleLocations,
    etaMap,
    setCurrentScreen,
    navigateToLiveTracking
  } = useApp();

  const stop = stopService.getStopById(selectedStopId) || stops[0];

  // Calculate distance & walking time
  const distance = useMemo(() => {
    return locationService.calculateHaversineDistance(
      studentLocation.latitude,
      studentLocation.longitude,
      stop.latitude,
      stop.longitude
    );
  }, [studentLocation, stop]);

  const walkingMinutes = locationService.calculateWalkingTimeMinutes(distance);

  // Retrieve upcoming shuttles approaching this specific stop
  const upcomingShuttles = useMemo(() => {
    return stopService.getUpcomingShuttles(
      stop.stop_id,
      trips,
      tripStops,
      shuttles,
      routes,
      shuttleLocations,
      etaMap
    );
  }, [stop.stop_id, trips, tripStops, shuttles, routes, shuttleLocations, etaMap]);

  // Filter shuttles for mini map
  const activeShuttlesForMap = useMemo(() => {
    return shuttleLocations.map((loc) => {
      const trip = trips.find((t) => t.trip_id === loc.trip_id);
      const shuttle = shuttles.find((s) => s.shuttle_id === loc.shuttle_id);
      return {
        location: loc,
        number: shuttle ? shuttle.shuttle_number : 'SHUTTLE',
        routeId: trip ? trip.route_id : 'ROUTE-01'
      };
    });
  }, [shuttleLocations, trips, shuttles]);

  return (
    <div className="min-h-full bg-[#FBFBF9] pb-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 space-y-6">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="group inline-flex items-center gap-2 text-stone-500 hover:text-[#121316] text-xs font-editorial font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>BACK TO HOME & NEARBY STOPS</span>
          </button>

          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
            {upcomingShuttles.length} APPROACHING SHUTTLES
          </span>
        </div>

        {/* Dual-Column Grid on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 5 cols) - Stop Details & Focused Map */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-subtle space-y-3">
              <span className="text-[10px] font-mono font-bold text-jklu-orange uppercase tracking-wider block">
                CAMPUS TRANSIT STOP
              </span>
              <h1 className="font-editorial font-black text-3xl sm:text-4xl text-[#121316] tracking-tight leading-none uppercase">
                {stop.stop_name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 font-medium pt-1">
                <span className="font-mono font-bold text-jklu-orange">
                  {locationService.formatDistance(distance)}
                </span>
                <span className="text-stone-300">•</span>
                <div className="flex items-center gap-1 text-stone-700">
                  <Footprints className="w-4 h-4 text-stone-400" />
                  <span>{walkingMinutes} MIN WALK FROM YOU</span>
                </div>
              </div>

              <p className="text-xs text-stone-500 pt-1 leading-relaxed">
                {stop.description}
              </p>
            </div>

            {/* Focused Map View */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-stone-400 uppercase px-1">
                STOP VICINITY CARTOGRAPHY
              </span>
              <MapView
                stops={[stop, stopService.getDestinationStop()]}
                studentLocation={studentLocation}
                activeShuttles={activeShuttlesForMap}
                selectedStopId={stop.stop_id}
                onSelectShuttle={(tripId) => navigateToLiveTracking(tripId)}
                heightClass="h-64 lg:h-[380px]"
                interactive={true}
              />
            </div>
          </div>

          {/* Right Column (PC: 7 cols) - Upcoming Shuttles */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-end justify-between border-b border-stone-200/80 pb-3">
              <div>
                <h2 className="font-editorial font-bold text-2xl text-[#121316] tracking-tight leading-none uppercase">
                  UPCOMING
                  <br />
                  SHUTTLES
                </h2>
                <p className="text-xs text-stone-500 font-medium tracking-wide uppercase mt-1">
                  Arriving at {stop.stop_name}
                </p>
              </div>

              <span className="text-xs font-mono text-stone-500">
                Sorted by ETA
              </span>
            </div>

            {/* Shuttle Cards List */}
            <ShuttleList
              shuttles={upcomingShuttles}
              onTrack={(tripId) => navigateToLiveTracking(tripId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
