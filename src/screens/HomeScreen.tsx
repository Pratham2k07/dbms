import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/map/MapView';
import { NearbyStopList } from '../components/stops/NearbyStopList';
import { locationService } from '../services/locationService';
import { stopService } from '../services/stopService';
import { MapPin, Compass, Bus, Navigation2 } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    student,
    studentLocation,
    stops,
    trips,
    tripStops,
    shuttleLocations,
    shuttles,
    navigateToStopDetails,
    navigateToLiveTracking,
    selectedStopId,
    setSelectedStopId
  } = useApp();

  // 1. Calculate approaching shuttle counts across stops
  const approachingCounts = useMemo(() => {
    return stopService.getApproachingCounts(trips, tripStops);
  }, [trips, tripStops]);

  // 2. Sort stops dynamically by geographic distance from student location
  const nearbyStops = useMemo(() => {
    return locationService.calculateNearbyStops(
      studentLocation,
      stops,
      approachingCounts
    );
  }, [studentLocation, stops, approachingCounts]);

  // 3. Format active shuttles for map rendering
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
        {/* Top Greeting & Operational Summary Bar */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <h1 className="font-editorial font-extrabold text-3xl sm:text-4xl text-[#121316] tracking-tight leading-tight">
              Good morning, {student.name.split(' ')[0]}.
            </h1>
          </div>

          {/* Quick Metrics (Desktop Enhanced) */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-jklu-orange flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">ACTIVE FLEET</span>
                <span className="font-editorial font-bold text-sm text-[#121316]">{activeShuttlesForMap.length} Shuttles Running</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Compass className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">DESTINATION</span>
                <span className="font-editorial font-bold text-sm text-[#121316]">JKLU Campus</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Column Layout on PC / Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (PC: 7 cols) - Interactive Map */}
          <div className="lg:col-span-7 space-y-4">
            {/* Current Location Badge (Desktop/Mobile responsive) */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-subtle flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-editorial font-bold tracking-wider text-stone-400 uppercase block">
                  YOUR CURRENT LOCATION
                </span>
                <div className="flex items-center gap-2 font-editorial font-bold text-base text-[#121316]">
                  <MapPin className="w-4 h-4 text-jklu-orange" />
                  <span>{studentLocation.location_name}</span>
                </div>
                <span className="text-[11px] font-mono text-stone-400 block">
                  Last updated just now • Signal Accurate (±3m)
                </span>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
                ● GPS ACTIVE
              </div>
            </div>

            {/* Map Component with responsive height */}
            <div className="space-y-2">
              <MapView
                stops={stops}
                studentLocation={studentLocation}
                activeShuttles={activeShuttlesForMap}
                selectedStopId={selectedStopId}
                onSelectStop={(stopId) => {
                  setSelectedStopId(stopId);
                  navigateToStopDetails(stopId);
                }}
                onSelectShuttle={(tripId) => navigateToLiveTracking(tripId)}
                heightClass="h-80 lg:h-[480px]"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 px-1">
                <span>● Tap any stop pin or shuttle icon to view live telemetry</span>
                <span className="text-emerald-700 font-semibold">{activeShuttlesForMap.length} ACTIVE SHUTTLES</span>
              </div>
            </div>
          </div>

          {/* Right Column (PC: 5 cols) - Ordered Nearby Stops List */}
          <div className="lg:col-span-5 bg-white lg:rounded-3xl border border-stone-200/90 shadow-subtle p-2 sm:p-4">
            <NearbyStopList
              stops={nearbyStops}
              onSelectStop={(stopId) => navigateToStopDetails(stopId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
