import React, { useState, useMemo } from 'react';
import { Stop, Route, ShuttleLocation } from '../../types/database';
import { ROUTE_PATH_COORDINATES } from '../../data/mockDatabase';
import { Building2, Navigation, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface MapViewProps {
  stops?: Stop[];
  studentLocation?: { latitude: number; longitude: number };
  activeShuttles?: { location: ShuttleLocation; number: string; routeId: string }[];
  highlightRouteId?: string;
  selectedStopId?: string;
  onSelectStop?: (stopId: string) => void;
  onSelectShuttle?: (tripId: string) => void;
  heightClass?: string;
  interactive?: boolean;
  centerCoords?: [number, number];
  zoomLevel?: number;
}

export const MapView: React.FC<MapViewProps> = ({
  stops = [],
  studentLocation,
  activeShuttles = [],
  highlightRouteId,
  selectedStopId,
  onSelectStop,
  onSelectShuttle,
  heightClass = 'h-72',
  interactive = true,
  centerCoords,
  zoomLevel = 1
}) => {
  const [zoom, setZoom] = useState<number>(zoomLevel);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Geo bounds around Jaipur City & JKLU Campus Terminus
  const bounds = useMemo(() => {
    return {
      minLat: 26.810,
      maxLat: 26.935,
      minLng: 75.630,
      maxLng: 75.830
    };
  }, []);

  // Project geographic lat/lng to SVG ViewBox coords (width: 800, height: 600)
  const project = (lat: number, lng: number): [number, number] => {
    const svgWidth = 800;
    const svgHeight = 600;

    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * svgWidth;
    // Invert Y because SVG coordinates increase downwards
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * svgHeight;

    return [x, y];
  };

  // Convert polyline array into SVG path 'd' attribute
  const getPathD = (coords: [number, number][]): string => {
    if (!coords || coords.length === 0) return '';
    return coords
      .map((c, i) => {
        const [x, y] = project(c[0], c[1]);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`relative w-full ${heightClass} bg-[#F4F3EE] rounded-2xl overflow-hidden border border-stone-200/90 select-none shadow-inner group`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Editorial Minimal Map SVG */}
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center'
        }}
      >
        <defs>
          {/* Subtle Grid Pattern for cartographic precision */}
          <pattern id="cartoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E3DB" strokeWidth="0.75" />
          </pattern>
        </defs>

        {/* Base Cartographic Plane */}
        <rect width="800" height="600" fill="#F4F3EE" />
        <rect width="800" height="600" fill="url(#cartoGrid)" />

        {/* Major Jaipur Arterials & Expressways (Cartographic Base) */}
        {/* Ajmer Road (NH 48 Expressway towards JKLU) */}
        <path
          d="M 520 220 L 450 250 L 360 300 L 220 420 L 80 470"
          fill="none"
          stroke="#DFDBD0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <text x="210" y="405" fill="#B3AEA3" fontSize="9" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.2">
          AJMER ROAD EXPRESSWAY (NH 48)
        </text>

        {/* 200 Feet Bypass / Ring Road */}
        <path
          d="M 640 100 L 520 220 L 420 380 L 320 520"
          fill="none"
          stroke="#E4E0D7"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <text x="490" y="340" fill="#B3AEA3" fontSize="9" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.2">
          200 FT BYPASS
        </text>

        {/* JLN Marg / Airport Corridor */}
        <path
          d="M 720 380 L 680 450 L 560 520"
          fill="none"
          stroke="#E4E0D7"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Render Route Paths */}
        {Object.entries(ROUTE_PATH_COORDINATES).map(([routeId, coords]) => {
          const isHighlighted = highlightRouteId === routeId;
          const isDimmed = highlightRouteId && highlightRouteId !== routeId;
          const strokeColor =
            routeId === 'ROUTE-01'
              ? '#E8590C'
              : routeId === 'ROUTE-02'
              ? '#2B4C7E'
              : '#D97706';

          return (
            <g key={routeId}>
              {/* Route Shadow / Casing */}
              <path
                d={getPathD(coords)}
                fill="none"
                stroke={isHighlighted ? '#FFFFFF' : '#EAE8E2'}
                strokeWidth={isHighlighted ? 6 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isDimmed ? 0.3 : 1}
              />
              {/* Main Route Line */}
              <path
                d={getPathD(coords)}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isHighlighted ? 3.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={isHighlighted ? '8 4' : 'none'}
                opacity={isDimmed ? 0.25 : 0.85}
              />
            </g>
          );
        })}

        {/* Render Shuttle Stops */}
        {stops.map((stop) => {
          const [cx, cy] = project(stop.latitude, stop.longitude);
          const isSelected = selectedStopId === stop.stop_id;
          const isDestination = stop.is_destination;

          if (isDestination) {
            // JKLU University Final Stop - Official Architectural Crest Icon
            return (
              <g
                key={stop.stop_id}
                transform={`translate(${cx}, ${cy})`}
                onClick={() => onSelectStop && onSelectStop(stop.stop_id)}
                className="cursor-pointer"
              >
                {/* Destination Halo */}
                <circle r="18" fill="#121316" fillOpacity="0.08" />
                <rect
                  x="-12"
                  y="-12"
                  width="24"
                  height="24"
                  rx="6"
                  fill="#121316"
                  stroke="#E8590C"
                  strokeWidth="1.5"
                  className="shadow-md"
                />
                <path
                  d="M -6 4 L 0 -6 L 6 4 Z M -4 4 L 4 4"
                  fill="none"
                  stroke="#FBFBF9"
                  strokeWidth="1.2"
                />
                {/* Label */}
                <g transform="translate(0, 22)">
                  <rect
                    x="-40"
                    y="-8"
                    width="80"
                    height="17"
                    rx="4"
                    fill="#121316"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#FBFBF9"
                    fontSize="9.5"
                    fontFamily="Outfit, sans-serif"
                    fontWeight="700"
                    letterSpacing="0.8"
                  >
                    JKLU CAMPUS
                  </text>
                </g>
              </g>
            );
          }

          return (
            <g
              key={stop.stop_id}
              transform={`translate(${cx}, ${cy})`}
              onClick={() => onSelectStop && onSelectStop(stop.stop_id)}
              className="cursor-pointer group/stop transition-transform hover:scale-110"
            >
              {isSelected ? (
                <>
                  <circle r="14" fill="#E8590C" fillOpacity="0.15" />
                  <circle r="6" fill="#E8590C" stroke="#FFFFFF" strokeWidth="2" />
                </>
              ) : (
                <>
                  <circle r="8" fill="#FFFFFF" stroke="#8E95A2" strokeWidth="1.5" />
                  <circle r="3.5" fill="#141518" />
                </>
              )}

              {/* Stop Name Label */}
              <g transform="translate(0, -14)">
                <rect
                  x="-36"
                  y="-8"
                  width="72"
                  height="16"
                  rx="4"
                  fill={isSelected ? '#121316' : '#FFFFFF'}
                  stroke={isSelected ? '#121316' : '#D4D2CD'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill={isSelected ? '#FBFBF9' : '#141518'}
                  fontSize="8.5"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontWeight="600"
                >
                  {stop.stop_name}
                </text>
              </g>
            </g>
          );
        })}

        {/* Render Student Location Pulsing Marker */}
        {studentLocation && (
          (() => {
            const [sx, sy] = project(studentLocation.latitude, studentLocation.longitude);
            return (
              <g key="student-loc" transform={`translate(${sx}, ${sy})`}>
                {/* Outer animated pulse ring */}
                <circle r="22" fill="#2B4C7E" fillOpacity="0.15" className="animate-pulse" />
                <circle r="12" fill="#2B4C7E" fillOpacity="0.3" />
                <circle r="6.5" fill="#2B4C7E" stroke="#FFFFFF" strokeWidth="2.5" />

                {/* You Are Here Pill */}
                <g transform="translate(0, 18)">
                  <rect
                    x="-32"
                    y="-7"
                    width="64"
                    height="14"
                    rx="7"
                    fill="#2B4C7E"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="7.5"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                    letterSpacing="0.5"
                  >
                    YOU ARE HERE
                  </text>
                </g>
              </g>
            );
          })()
        )}

        {/* Render Active Shuttles Moving along the Polyline */}
        {activeShuttles.map(({ location, number, routeId }) => {
          const [bx, by] = project(location.latitude, location.longitude);
          const isSelected = highlightRouteId === routeId;

          return (
            <g
              key={location.shuttle_id}
              transform={`translate(${bx}, ${by})`}
              onClick={() => onSelectShuttle && onSelectShuttle(location.trip_id)}
              className="cursor-pointer transition-all duration-700 ease-linear"
            >
              {/* Subtle halo */}
              <circle r="16" fill="#E8590C" fillOpacity="0.2" className="animate-ping" />

              {/* Shuttle Icon Body */}
              <g transform={`rotate(${location.bearing || 0})`}>
                <rect
                  x="-10"
                  y="-7"
                  width="20"
                  height="14"
                  rx="3.5"
                  fill="#121316"
                  stroke="#E8590C"
                  strokeWidth="1.5"
                />
                {/* Windshield */}
                <rect x="4" y="-5" width="4" height="10" rx="1.5" fill="#FBFBF9" />
                {/* Headlights */}
                <circle cx="8" cy="-5" r="1" fill="#F7B731" />
                <circle cx="8" cy="5" r="1" fill="#F7B731" />
              </g>

              {/* Shuttle Badge Label */}
              <g transform="translate(0, -18)">
                <rect
                  x="-30"
                  y="-8"
                  width="60"
                  height="15"
                  rx="4"
                  fill="#E8590C"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {number}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Map Interactive Overlay Controls */}
      {interactive && (
        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.3))}
            className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur text-stone-700 hover:bg-white shadow-subtle border border-stone-200 flex items-center justify-center transition-transform active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.3))}
            className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur text-stone-700 hover:bg-white shadow-subtle border border-stone-200 flex items-center justify-center transition-transform active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur text-stone-700 hover:bg-white shadow-subtle border border-stone-200 flex items-center justify-center transition-transform active:scale-95"
            title="Reset Map View"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map Header Overlay: Map Status */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur border border-stone-200/80 shadow-subtle text-[10px] font-mono font-medium text-stone-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>JKLU CARTOGRAPHY // REALTIME</span>
      </div>
    </div>
  );
};
