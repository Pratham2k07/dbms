import https from 'https';

export interface RouteGeometryResult {
  success: boolean;
  coordinates: [number, number][];
  total_distance_km: number;
  stopDistances: {
    stop_id: string;
    distance_from_prev_km: number;
    cumulative_distance_km: number;
  }[];
  source: 'osrm' | 'geodesic_fallback';
}

export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getRoadRouteGeometry(
  stops: { stop_id: string; latitude: number | string; longitude: number | string }[]
): Promise<RouteGeometryResult> {
  if (!stops || stops.length < 2) {
    return {
      success: false,
      coordinates: stops ? stops.map((s) => [Number(s.latitude), Number(s.longitude)]) : [],
      total_distance_km: 0,
      stopDistances: stops
        ? stops.map((s) => ({ stop_id: s.stop_id, distance_from_prev_km: 0, cumulative_distance_km: 0 }))
        : [],
      source: 'geodesic_fallback',
    };
  }

  // Format OSRM coordinates: lon,lat;lon,lat;...
  const coordsParam = stops.map((s) => `${Number(s.longitude)},${Number(s.latitude)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=false`;

  try {
    const rawData = await new Promise<string>((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'JKLUShuttleSystem/2.0 (University Mobility Transport Operations)',
          },
          timeout: 4000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OSRM request timed out'));
      });
    });

    const parsed = JSON.parse(rawData);
    if (parsed.code === 'Ok' && parsed.routes && parsed.routes.length > 0) {
      const route = parsed.routes[0];
      // Convert OSRM [lon, lat] -> Leaflet [lat, lon]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [Number(lat.toFixed(6)), Number(lon.toFixed(6))]
      );
      const total_distance_km = Number((route.distance / 1000).toFixed(2));

      const stopDistances: RouteGeometryResult['stopDistances'] = [];
      let cumulative = 0;

      for (let i = 0; i < stops.length; i++) {
        if (i === 0) {
          stopDistances.push({
            stop_id: stops[i].stop_id,
            distance_from_prev_km: 0,
            cumulative_distance_km: 0,
          });
        } else {
          const leg = route.legs && route.legs[i - 1];
          const distKm = leg ? Number((leg.distance / 1000).toFixed(2)) : 0;
          cumulative = Number((cumulative + distKm).toFixed(2));
          stopDistances.push({
            stop_id: stops[i].stop_id,
            distance_from_prev_km: distKm,
            cumulative_distance_km: cumulative,
          });
        }
      }

      return {
        success: true,
        coordinates,
        total_distance_km,
        stopDistances,
        source: 'osrm',
      };
    }
  } catch (err) {
    console.warn('[ROUTING] OSRM live routing failed, using geodesic road interpolation:', err);
  }

  // Geodesic fallback
  return buildGeodesicFallback(stops);
}

function buildGeodesicFallback(
  stops: { stop_id: string; latitude: number | string; longitude: number | string }[]
): RouteGeometryResult {
  const coordinates: [number, number][] = [];
  const stopDistances: RouteGeometryResult['stopDistances'] = [];
  let totalMeters = 0;

  for (let i = 0; i < stops.length; i++) {
    const curr = stops[i];
    if (i === 0) {
      coordinates.push([Number(curr.latitude), Number(curr.longitude)]);
      stopDistances.push({
        stop_id: curr.stop_id,
        distance_from_prev_km: 0,
        cumulative_distance_km: 0,
      });
    } else {
      const prev = stops[i - 1];
      const legMeters = haversineDistanceMeters(
        Number(prev.latitude),
        Number(prev.longitude),
        Number(curr.latitude),
        Number(curr.longitude)
      );
      totalMeters += legMeters;

      // Fine step interpolation between sequential stops for smooth pathway
      const steps = 15;
      for (let step = 1; step <= steps; step++) {
        const frac = step / steps;
        const lat = Number(prev.latitude) + (Number(curr.latitude) - Number(prev.latitude)) * frac;
        const lon = Number(prev.longitude) + (Number(curr.longitude) - Number(prev.longitude)) * frac;
        coordinates.push([Number(lat.toFixed(6)), Number(lon.toFixed(6))]);
      }

      stopDistances.push({
        stop_id: curr.stop_id,
        distance_from_prev_km: Number((legMeters / 1000).toFixed(2)),
        cumulative_distance_km: Number((totalMeters / 1000).toFixed(2)),
      });
    }
  }

  return {
    success: true,
    coordinates,
    total_distance_km: Number((totalMeters / 1000).toFixed(2)),
    stopDistances,
    source: 'geodesic_fallback',
  };
}

export function projectVehicleOnRoute(
  vehicleLat: number,
  vehicleLng: number,
  routeCoordinates: [number, number][],
  totalDistanceKm: number = 0
): {
  projectedLat: number;
  projectedLng: number;
  distanceFromStartKm: number;
  progressPercentage: number;
  distanceToRouteMeters: number;
} {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return {
      projectedLat: vehicleLat,
      projectedLng: vehicleLng,
      distanceFromStartKm: 0,
      progressPercentage: 0,
      distanceToRouteMeters: 0,
    };
  }

  let minDistanceMeters = Infinity;
  let bestProjected: [number, number] = routeCoordinates[0];
  let distanceAlongPolylineMeters = 0;
  let bestDistanceAlongMeters = 0;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const p1 = routeCoordinates[i];
    const p2 = routeCoordinates[i + 1];

    const segLengthMeters = haversineDistanceMeters(p1[0], p1[1], p2[0], p2[1]);

    const dx = p2[1] - p1[1];
    const dy = p2[0] - p1[0];
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((vehicleLng - p1[1]) * dx + (vehicleLat - p1[0]) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projLat = p1[0] + t * dy;
    const projLng = p1[1] + t * dx;

    const distToSeg = haversineDistanceMeters(vehicleLat, vehicleLng, projLat, projLng);

    if (distToSeg < minDistanceMeters) {
      minDistanceMeters = distToSeg;
      bestProjected = [Number(projLat.toFixed(6)), Number(projLng.toFixed(6))];
      bestDistanceAlongMeters = distanceAlongPolylineMeters + t * segLengthMeters;
    }

    distanceAlongPolylineMeters += segLengthMeters;
  }

  const distanceFromStartKm = Number((bestDistanceAlongMeters / 1000).toFixed(2));
  const totalKm = totalDistanceKm > 0 ? totalDistanceKm : Number((distanceAlongPolylineMeters / 1000).toFixed(2));
  const progressPercentage = totalKm > 0 ? Number(Math.min(100, Math.max(0, (distanceFromStartKm / totalKm) * 100)).toFixed(1)) : 0;

  return {
    projectedLat: bestProjected[0],
    projectedLng: bestProjected[1],
    distanceFromStartKm,
    progressPercentage,
    distanceToRouteMeters: Math.round(minDistanceMeters),
  };
}

export function calculateTheoreticalEtaMinutes(
  remainingDistanceKm: number,
  averageSpeedKmh: number = 25
): number {
  if (remainingDistanceKm <= 0) return 0;
  const speed = averageSpeedKmh > 0 ? averageSpeedKmh : 25;
  const hours = remainingDistanceKm / speed;
  return Math.max(1, Math.round(hours * 60));
}
