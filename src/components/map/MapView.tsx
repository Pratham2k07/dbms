import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop, ShuttleLocation } from '../../types/database';
import { ROUTE_PATH_COORDINATES } from '../../data/mockDatabase';
import { ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface MapViewProps {
  stops?: Stop[];
  studentLocation?: { latitude: number; longitude: number };
  activeShuttles?: { location: ShuttleLocation; number: string; routeId: string }[];
  highlightRouteId?: string;
  selectedStopId?: string;
  destinationCoords?: { latitude: number; longitude: number; name?: string };
  onSelectStop?: (stopId: string) => void;
  onSelectShuttle?: (tripId: string) => void;
  heightClass?: string;
  interactive?: boolean;
  centerCoords?: [number, number];
  zoomLevel?: number;
}

type MapLayerType = 'streets' | 'satellite' | 'terrain';

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
  },
  terrain: {
    // Google Maps Terrain
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }
};

export const MapView: React.FC<MapViewProps> = ({
  stops = [],
  studentLocation,
  activeShuttles = [],
  highlightRouteId = 'ROUTE-01',
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
    }, 200);

    return () => {
      clearTimeout(timer);
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

    // Draw non-highlighted routes with subtle gray/orange
    Object.entries(ROUTE_PATH_COORDINATES).forEach(([rId, coords]) => {
      if (rId !== highlightRouteId) {
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
    const activeCoords = ROUTE_PATH_COORDINATES[highlightRouteId] || ROUTE_PATH_COORDINATES['ROUTE-01'];
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
  }, [highlightRouteId]);

  // Update Markers (Stops, Active Shuttles, Student Location)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    // 1. Render Stops
    stops.forEach((stop) => {
      const isSelected = stop.stop_id === selectedStopId;
      const isOrigin = stop.stop_name.includes('ORIGIN') || stop.stop_name.includes('CAMPUS');

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center cursor-pointer group pointer-events-auto">
            <div class="px-2 py-0.5 mb-1 rounded-md text-[9px] font-sans font-extrabold uppercase whitespace-nowrap shadow-md transition-all ${
              isSelected
                ? 'bg-jklu-orange text-white ring-2 ring-white scale-110'
                : isOrigin
                ? 'bg-[#243B66] text-white border border-white/60'
                : 'bg-white/95 text-stone-800 border border-stone-300 group-hover:bg-jklu-orange group-hover:text-white'
            }">
              ${stop.stop_name.replace(' (ORIGIN)', '').replace(' (TERMINUS)', '')}
            </div>
            <div class="relative flex items-center justify-center">
              ${
                isSelected
                  ? '<div class="absolute w-7 h-7 rounded-full bg-orange-400/40 animate-ping"></div>'
                  : ''
              }
              <div class="w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                isOrigin
                  ? 'bg-[#243B66]'
                  : isSelected
                  ? 'bg-jklu-orange'
                  : 'bg-stone-700'
              }">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 35]
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .addTo(markersLayerRef.current!);

      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.stop_id);
      });
    });

    // 2. Render Student Location ("YOU ARE HERE")
    if (studentLocation) {
      const studentIcon = L.divIcon({
        className: 'custom-student-marker',
        html: `
          <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center pointer-events-none">
            <div class="px-2 py-0.5 mb-1 rounded-full text-[9px] font-sans font-black uppercase tracking-wider bg-[#2B4A7E] text-white shadow-lg border border-white/80 animate-bounce">
              YOU ARE HERE
            </div>
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-blue-500/35 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-[#2B4A7E] border-2 border-white shadow-xl flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 35]
      });

      L.marker([studentLocation.latitude, studentLocation.longitude], {
        icon: studentIcon,
        zIndexOffset: 1000
      }).addTo(markersLayerRef.current);
    }

    // 3. Render Active Shuttles with dynamic bearing and pulse
    activeShuttles.forEach((shuttle) => {
      const shuttleIcon = L.divIcon({
        className: 'custom-shuttle-marker',
        html: `
          <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center cursor-pointer group pointer-events-auto">
            <div class="px-2 py-0.5 mb-1 rounded-lg text-[9px] font-sans font-black tracking-wider uppercase bg-jklu-orange text-white shadow-lg ring-1 ring-white/60 flex items-center gap-1 group-hover:scale-105 transition-transform">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>${shuttle.number}</span>
            </div>
            <div class="relative flex items-center justify-center">
              <div class="absolute w-9 h-9 rounded-full bg-orange-500/30 animate-ping"></div>
              <div class="w-7 h-7 rounded-2xl bg-[#141518] text-white border-2 border-white shadow-2xl flex items-center justify-center transform transition-transform group-hover:rotate-12">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 6v6" />
                  <path d="M15 6v6" />
                  <path d="M2 12h19.6" />
                  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5c-.3-1-1.1-1.8-2.1-1.8H5.7c-1 0-1.8.8-2.1 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
              </div>
            </div>
          </div>
        `,
        iconSize: [110, 48],
        iconAnchor: [55, 42]
      });

      const marker = L.marker([shuttle.location.latitude, shuttle.location.longitude], {
        icon: shuttleIcon,
        zIndexOffset: 900
      }).addTo(markersLayerRef.current!);

      marker.on('click', () => {
        if (onSelectShuttle) onSelectShuttle(shuttle.location.trip_id);
      });
    });
  }, [stops, studentLocation, activeShuttles, selectedStopId]);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Recenter to JKLU Campus / Corridor
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const center: [number, number] = centerCoords || [26.8680, 75.7200];
      mapInstanceRef.current.flyTo(center, 13, { duration: 1.2 });
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
