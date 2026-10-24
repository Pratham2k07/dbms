import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop, ShuttleLocation } from '../../types/database';
import { ZoomIn, ZoomOut, Compass, Navigation } from 'lucide-react';

interface MapViewProps {
  stops?: Stop[];
  studentLocation?: { latitude: number; longitude: number };
  activeShuttles?: { location: ShuttleLocation; number: string; routeId: string }[];
  highlightRouteId?: string;
  routeCoordinates?: Record<string, [number, number][]>;
  activeRoutePolyline?: [number, number][];
  selectedStopId?: string;
  destinationCoords?: { latitude: number; longitude: number; name?: string };
  onSelectStop?: (stopId: string) => void;
  onSelectShuttle?: (tripId: string) => void;
  heightClass?: string;
  interactive?: boolean;
  centerCoords?: [number, number];
  zoomLevel?: number;
}

type MapLayerType = 'streets' | 'satellite';

const GOOGLE_TILE_SERVERS: Record<MapLayerType, { url: string; maxZoom: number; subdomains: string[] }> = {
  streets: {
    // Google Maps Roadmap / Streets
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  },
  satellite: {
    // Google Maps Hybrid (Satellite Imagery + Street Overlays)
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }
};

export const MapView: React.FC<MapViewProps> = ({
  stops = [],
  studentLocation,
  activeShuttles = [],
  highlightRouteId = 'ROUTE-01',
  routeCoordinates,
  activeRoutePolyline,
  selectedStopId,
  destinationCoords,
  onSelectStop,
  onSelectShuttle,
  heightClass = 'h-72',
  interactive = true,
  centerCoords,
  zoomLevel = 13
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapType, setMapType] = useState<MapLayerType>('streets');
  const [currentZoom, setCurrentZoom] = useState(zoomLevel);

  // Initialize Leaflet map with Google Maps Tile Layer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center around Jaipur / JKLU corridor (lat: 26.868, lng: 75.720)
    const initialCenter: [number, number] = centerCoords || [26.8680, 75.7200];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive
    });

    // Create Google tile layer
    const tileConfig = GOOGLE_TILE_SERVERS[mapType];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Create Layer Groups for markers & polylines
    routesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    // Fix map sizing in case parent container renders with animation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user toggles map type (Streets vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = GOOGLE_TILE_SERVERS[mapType];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains
    }).addTo(map);

    // Ensure tile layer stays beneath routes and markers
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [mapType]);

  // Update Route Polylines
  useEffect(() => {
    if (!routesLayerRef.current) return;
    routesLayerRef.current.clearLayers();

    const allRoutes = routeCoordinates || {};

    // Draw non-highlighted routes with subtle gray/orange
    Object.entries(allRoutes).forEach(([rId, coords]) => {
      if (rId !== highlightRouteId && coords && coords.length > 0) {
        L.polyline(coords, {
          color: '#B0B5C0',
          weight: 3,
          opacity: 0.45,
          dashArray: '6, 8',
          lineCap: 'round'
        }).addTo(routesLayerRef.current!);
      }
    });

    // Draw active highlighted route with vibrant JKLU Orange
    const activeCoords =
      (activeRoutePolyline && activeRoutePolyline.length > 0)
        ? activeRoutePolyline
        : (routeCoordinates && highlightRouteId && routeCoordinates[highlightRouteId] && routeCoordinates[highlightRouteId].length > 0)
          ? routeCoordinates[highlightRouteId]
          : (routeCoordinates && Object.values(routeCoordinates).find((coords) => coords && coords.length > 0))
            ? Object.values(routeCoordinates).find((coords) => coords && coords.length > 0)
            : (stops && stops.length >= 2)
              ? (stops.map((s) => [Number(s.latitude), Number(s.longitude)] as [number, number]))
              : undefined;

    if (activeCoords && activeCoords.length > 0) {
      // Glow underlayer
      L.polyline(activeCoords, {
        color: '#FF8833',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round'
      }).addTo(routesLayerRef.current);

      // Main corridor line
      L.polyline(activeCoords, {
        color: '#E8590C',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round'
      }).addTo(routesLayerRef.current);
    }
  }, [highlightRouteId, routeCoordinates, activeRoutePolyline]);

  // Update Location Pins (Stops, Active Shuttles, Student Location, Destination)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    // Check if student is in close proximity to any active shuttle to prevent badge collision
    const isStudentNearShuttle = Boolean(
      studentLocation &&
      activeShuttles.some((s) => {
        const dLat = Math.abs(Number(s.location.latitude) - studentLocation.latitude);
        const dLng = Math.abs(Number(s.location.longitude) - studentLocation.longitude);
        return dLat < 0.0018 && dLng < 0.0018;
      })
    );

    // Track coordinates to prevent duplicate stop pins directly overlapping
    const seenCoordinates = new Map<string, number>();

    // 1. Render Transit Stops with dedicated location pins
    stops.forEach((stop) => {
      let lat = Number(stop.latitude);
      let lng = Number(stop.longitude);
      const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const duplicateCount = seenCoordinates.get(coordKey) || 0;
      seenCoordinates.set(coordKey, duplicateCount + 1);

      // Apply subtle spatial separation for coincident stops (e.g. Origin & Terminus on campus)
      if (duplicateCount > 0) {
        lat += 0.0003 * duplicateCount;
        lng += 0.0003 * duplicateCount;
      }

      const isSelected = stop.stop_id === selectedStopId;
      const isOrigin = stop.stop_name.includes('ORIGIN') || stop.stop_name.includes('CAMPUS');
      const isTerminus = Boolean(stop.is_destination) || stop.stop_name.includes('TERMINUS');
      const displayName = stop.stop_name.replace(' (ORIGIN)', '').replace(' (TERMINUS)', '');

      // A: Major / Selected / Terminal Stop Pin (Teardrop Location Pin)
      if (isSelected || isOrigin || isTerminus) {
        const pinColor = isSelected ? '#E8590C' : isOrigin ? '#1E3A68' : '#18181B';
        const badgeBg = isSelected ? 'bg-[#E8590C]' : isOrigin ? 'bg-[#1E3A68]' : 'bg-[#18181B]';
        const badgeLabel = isSelected
          ? `📍 ${displayName}`
          : isOrigin
          ? `CAMPUS • ${displayName}`
          : `TERMINUS • ${displayName}`;

        const pinHtml = `
          <div class="flex flex-col items-center cursor-pointer group pointer-events-auto select-none" style="width: 140px;">
            <!-- Floating Stop Label Badge -->
            <div class="px-2.5 py-0.5 mb-1 rounded-md text-[9px] font-sans font-bold uppercase tracking-tight text-white ${badgeBg} shadow-md border border-white/80 whitespace-nowrap transition-transform duration-150 group-hover:scale-105">
              ${badgeLabel}
            </div>
            <!-- Teardrop Location Pin -->
            <div class="relative flex flex-col items-center">
              ${isSelected ? '<div class="absolute -top-1 w-10 h-10 rounded-full bg-orange-500/30 animate-ping"></div>' : ''}
              <svg width="28" height="38" viewBox="0 0 28 38" fill="none" class="drop-shadow-md">
                <path d="M14 38C14 38 28 23.5 28 14C28 6.26801 21.732 0 14 0C6.26801 0 0 6.26801 0 14C0 23.5 14 38 14 38Z" fill="${pinColor}"/>
                <circle cx="14" cy="14" r="6" fill="#FFFFFF"/>
                <circle cx="14" cy="14" r="3" fill="${pinColor}"/>
              </svg>
              <!-- Pin Contact Shadow on Road -->
              <div class="w-3 h-1 bg-black/25 rounded-full blur-[0.5px] -mt-0.5"></div>
            </div>
          </div>
        `;

        const stopIcon = L.divIcon({
          className: 'custom-stop-pin',
          html: pinHtml,
          iconSize: [140, 64],
          iconAnchor: [70, 60] // Exact pointer tip contact with road
        });

        const marker = L.marker([lat, lng], {
          icon: stopIcon,
          zIndexOffset: isSelected ? 800 : 500
        }).addTo(markersLayerRef.current!);

        marker.on('click', () => {
          if (onSelectStop) onSelectStop(stop.stop_id);
        });
      } else {
        // B: Intermediate Transit Node Pin along Route
        const showLabel = currentZoom >= 14;
        const nodeHtml = `
          <div class="flex flex-col items-center cursor-pointer group pointer-events-auto select-none" style="width: 110px;">
            ${
              showLabel
                ? `<div class="px-1.5 py-0.5 mb-1 rounded text-[8.5px] font-sans font-semibold bg-white/95 text-stone-700 shadow-xs border border-stone-300/80 whitespace-nowrap group-hover:bg-[#E8590C] group-hover:text-white transition-colors">
                     ${displayName}
                   </div>`
                : ''
            }
            <div class="relative flex items-center justify-center">
              <div class="w-4 h-4 rounded-full bg-white border-[3px] border-[#475569] shadow-sm flex items-center justify-center transition-all group-hover:scale-125 group-hover:border-[#E8590C]">
                <div class="w-1.5 h-1.5 rounded-full bg-[#475569] group-hover:bg-[#E8590C]"></div>
              </div>
            </div>
          </div>
        `;

        const stopIcon = L.divIcon({
          className: 'custom-stop-node',
          html: nodeHtml,
          iconSize: [110, showLabel ? 36 : 18],
          iconAnchor: [55, showLabel ? 27 : 9] // Exact center of transit node circle
        });

        const marker = L.marker([lat, lng], {
          icon: stopIcon,
          zIndexOffset: 300
        }).addTo(markersLayerRef.current!);

        marker.on('click', () => {
          if (onSelectStop) onSelectStop(stop.stop_id);
        });
      }
    });

    // 2. Render Destination Pin (if explicit destination passed)
    if (destinationCoords) {
      const destHtml = `
        <div class="flex flex-col items-center select-none" style="width: 130px;">
          <div class="px-2 py-0.5 mb-1 rounded-md text-[9px] font-sans font-bold uppercase tracking-tight text-white bg-[#059669] shadow-md border border-white/80 whitespace-nowrap">
            DESTINATION • ${destinationCoords.name || 'Arrival Point'}
          </div>
          <div class="relative flex flex-col items-center">
            <svg width="28" height="38" viewBox="0 0 28 38" fill="none" class="drop-shadow-md">
              <path d="M14 38C14 38 28 23.5 28 14C28 6.26801 21.732 0 14 0C6.26801 0 0 6.26801 0 14C0 23.5 14 38 14 38Z" fill="#059669"/>
              <circle cx="14" cy="14" r="6" fill="#FFFFFF"/>
              <circle cx="14" cy="14" r="3" fill="#059669"/>
            </svg>
            <div class="w-3 h-1 bg-black/25 rounded-full blur-[0.5px] -mt-0.5"></div>
          </div>
        </div>
      `;

      const destIcon = L.divIcon({
        className: 'custom-destination-pin',
        html: destHtml,
        iconSize: [130, 64],
        iconAnchor: [65, 60]
      });

      L.marker([destinationCoords.latitude, destinationCoords.longitude], {
        icon: destIcon,
        zIndexOffset: 850
      }).addTo(markersLayerRef.current);
    }

    // 3. Render Student Location ("YOU ARE HERE" GPS Beacon)
    if (studentLocation) {
      // Smart non-colliding layout: if student is near a shuttle, anchor label to side
      const studentHtml = isStudentNearShuttle
        ? `
          <div class="flex items-center gap-1.5 select-none pointer-events-none" style="width: 140px;">
            <div class="relative flex items-center justify-center flex-shrink-0">
              <div class="absolute w-7 h-7 rounded-full bg-blue-500/30 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-white shadow-md border border-blue-600 flex items-center justify-center">
                <div class="w-3 h-3 rounded-full bg-[#1D4ED8] flex items-center justify-center">
                  <div class="w-1 h-1 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
            <div class="px-2 py-0.5 rounded-full text-[8.5px] font-sans font-black uppercase tracking-wider bg-[#1E3A8A] text-white shadow-md border border-white/90 whitespace-nowrap flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></span>
              <span>YOU</span>
            </div>
          </div>
        `
        : `
          <div class="flex flex-col items-center select-none pointer-events-none" style="width: 120px;">
            <div class="px-2.5 py-0.5 mb-0.5 rounded-full text-[9px] font-sans font-black uppercase tracking-wider bg-[#1E3A8A] text-white shadow-md border border-white/90 whitespace-nowrap flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></span>
              <span>YOU ARE HERE</span>
            </div>
            <div class="w-0 h-0 border-x-3 border-x-transparent border-t-[4px] border-t-[#1E3A8A] mb-0.5"></div>
            <div class="relative flex items-center justify-center">
              <div class="absolute w-7 h-7 rounded-full bg-blue-500/30 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-white shadow-md border border-blue-600 flex items-center justify-center">
                <div class="w-3 h-3 rounded-full bg-[#1D4ED8] flex items-center justify-center">
                  <div class="w-1 h-1 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
          </div>
        `;

      const studentIcon = L.divIcon({
        className: 'custom-student-pin',
        html: studentHtml,
        iconSize: isStudentNearShuttle ? [140, 28] : [120, 52],
        iconAnchor: isStudentNearShuttle ? [10, 14] : [60, 39] // Exact center of blue GPS dot
      });

      L.marker([studentLocation.latitude, studentLocation.longitude], {
        icon: studentIcon,
        zIndexOffset: 1200
      }).addTo(markersLayerRef.current);
    }

    // 4. Render Active Shuttles with precision downward pointer pin
    activeShuttles.forEach((shuttle) => {
      const shuttleHtml = `
        <div class="flex flex-col items-center cursor-pointer group pointer-events-auto select-none" style="width: 120px;">
          <!-- Top Shuttle Identifier Badge -->
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1 rounded-full bg-[#E8590C] text-white text-[9px] font-sans font-black uppercase tracking-wider shadow-lg ring-1.5 ring-white whitespace-nowrap group-hover:scale-105 transition-transform">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>${shuttle.number}</span>
            <span class="text-[7.5px] opacity-80 font-mono">LIVE</span>
          </div>
          <!-- Vehicle Puck with Downward Pointer Beak -->
          <div class="relative flex flex-col items-center">
            <div class="absolute -inset-1 rounded-full bg-orange-500/25 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-[#18181B] text-white border-2 border-white shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <!-- Ground pointer beak -->
            <div class="w-0 h-0 border-x-4 border-x-transparent border-t-[5px] border-t-[#18181B] -mt-[1px]"></div>
            <!-- Shadow on Road -->
            <div class="w-3.5 h-1 bg-black/25 rounded-full blur-[0.5px] -mt-0.5"></div>
          </div>
        </div>
      `;

      const shuttleIcon = L.divIcon({
        className: 'custom-shuttle-pin',
        html: shuttleHtml,
        iconSize: [120, 62],
        iconAnchor: [60, 59] // Pointer beak tip touches the road
      });

      const marker = L.marker([Number(shuttle.location.latitude), Number(shuttle.location.longitude)], {
        icon: shuttleIcon,
        zIndexOffset: 1500
      }).addTo(markersLayerRef.current!);

      marker.on('click', () => {
        if (onSelectShuttle) onSelectShuttle(shuttle.location.trip_id);
      });
    });
  }, [stops, studentLocation, activeShuttles, selectedStopId, destinationCoords, currentZoom]);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Auto-center map smoothly when student location updates (e.g. from GPS or DevTools Sensors)
  const lastCenteredStudentLoc = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!mapInstanceRef.current || !studentLocation) return;
    const { latitude, longitude } = studentLocation;
    const prev = lastCenteredStudentLoc.current;
    if (!prev || Math.abs(prev.lat - latitude) > 0.002 || Math.abs(prev.lng - longitude) > 0.002) {
      lastCenteredStudentLoc.current = { lat: latitude, lng: longitude };
      mapInstanceRef.current.panTo([latitude, longitude], { animate: true, duration: 1.0 });
    }
  }, [studentLocation]);

  // Recenter to JKLU Campus / Corridor
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const center: [number, number] = centerCoords || [26.8680, 75.7200];
      mapInstanceRef.current.flyTo(center, 13, { duration: 1.2 });
    }
  };

  // Focus directly on Student's Live Location pin
  const handleFocusStudent = () => {
    if (mapInstanceRef.current && studentLocation) {
      mapInstanceRef.current.flyTo([studentLocation.latitude, studentLocation.longitude], 15, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className={`relative w-full ${heightClass} bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 shadow-subtle group select-none`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Map Layer Switcher (Streets vs Satellite) */}
      <div className="absolute top-3 left-3 z-[400]">
        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl p-0.5 border border-stone-200/90 shadow-sm">
          <button
            onClick={() => setMapType('streets')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold transition-all ${
              mapType === 'streets'
                ? 'bg-[#2B4A7E] text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Google Maps Streets View"
          >
            Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold transition-all ${
              mapType === 'satellite'
                ? 'bg-[#2B4A7E] text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Google Maps Satellite Hybrid View"
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Bottom Right: Clean Controls */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5">
        {studentLocation && (
          <button
            onClick={handleFocusStudent}
            className="w-9 h-9 rounded-xl bg-blue-50/95 backdrop-blur-md hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 shadow-md flex items-center justify-center transition-all active:scale-95"
            title="Focus On My GPS Location"
          >
            <Navigation className="w-4 h-4 text-[#1D4ED8]" />
          </button>
        )}
        <button
          onClick={handleRecenter}
          className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-stone-700 hover:text-[#2B4A7E] border border-stone-200 shadow-md flex items-center justify-center transition-all active:scale-95"
          title="Recenter to JKLU Corridor"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-stone-700 hover:text-[#2B4A7E] border border-stone-200 shadow-md flex items-center justify-center transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-stone-700 hover:text-[#2B4A7E] border border-stone-200 shadow-md flex items-center justify-center transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
