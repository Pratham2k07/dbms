import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Student,
  Driver,
  Admin,
  Route,
  Stop,
  Shuttle,
  Trip,
  TripStop,
  RouteStop,
  StudentLocation,
  ShuttleLocation
} from '../types/database';
import { ScreenType, TabType, AppNotification } from '../types/ui';
import {
  CURRENT_STUDENT,
  CURRENT_ADMIN,
  INITIAL_STUDENT_LOCATION,
  MOCK_DRIVERS,
  MOCK_ROUTES,
  MOCK_STOPS,
  MOCK_ROUTE_STOPS,
  MOCK_SHUTTLES,
  INITIAL_TRIPS,
  INITIAL_TRIP_STOPS,
  INITIAL_SHUTTLE_LOCATIONS,
  ROUTE_PATH_COORDINATES
} from '../data/mockDatabase';
import { shuttleService } from '../services/shuttleService';
import { tripService } from '../services/tripService';

interface AppContextType {
  // Navigation & Screen states
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDriverMode: boolean;
  setIsDriverMode: (val: boolean) => void;

  // Authentication State
  isAuthenticated: boolean;
  currentUserRole: 'student' | 'driver' | 'admin';
  loginUser: (email: string, password?: string, forceRole?: 'student' | 'driver' | 'admin') => boolean;
  logoutUser: () => void;

  // Selected Entities
  selectedStopId: string;
  setSelectedStopId: (id: string) => void;
  selectedTripId: string;
  setSelectedTripId: (id: string) => void;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;

  // Data Store
  student: Student;
  driver: Driver;
  admin: Admin;
  studentLocation: StudentLocation;
  routes: Route[];
  stops: Stop[];
  routeStops: RouteStop[];
  shuttles: Shuttle[];
  drivers: Driver[];
  trips: Trip[];
  tripStops: TripStop[];
  shuttleLocations: ShuttleLocation[];
  routeCoordinates: Record<string, [number, number][]>;
  notifications: AppNotification[];
  etaMap: Record<string, number>;

  // Simulation Controls
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  resetSimulation: () => void;

  // Driver Operations
  handleStartTrip: (tripId: string) => void;
  handleEndTrip: (tripId: string) => void;
  handleToggleCapacity: (tripId: string) => void;

  // Admin CRUD & Management
  createRoute: (routeData: {
    route_id: string;
    route_name: string;
    route_code: string;
    description: string;
    color: string;
    stop_ids: string[];
  }) => { success: boolean; error?: string };
  updateRoute: (route: Route, stop_ids?: string[]) => { success: boolean; error?: string };
  deleteRoute: (routeId: string) => { success: boolean; error?: string };

  createStop: (stopData: Stop) => { success: boolean; error?: string };
  updateStop: (stop: Stop) => { success: boolean; error?: string };
  deleteStop: (stopId: string) => { success: boolean; error?: string };
  assignStopToRoute: (routeId: string, stopId: string, sequenceNumber?: number) => void;
  removeStopFromRoute: (routeId: string, stopId: string) => void;
  reorderRouteStops: (routeId: string, stopIdsInOrder: string[]) => void;

  createShuttle: (shuttle: Shuttle) => { success: boolean; error?: string };
  updateShuttle: (shuttle: Shuttle) => { success: boolean; error?: string };
  setShuttleStatus: (shuttleId: string, status: Shuttle['status']) => void;

  createDriver: (data: {
    name: string;
    phone_number: string;
    license_no: string;
    assigned_shuttle_id?: string;
  }) => { success: boolean; error?: string };
  updateDriver: (driver: Driver) => { success: boolean; error?: string };
  deleteDriver: (driverId: string) => { success: boolean; error?: string };

  createTrip: (data: {
    route_id: string;
    shuttle_id: string;
    driver_id: string;
    start_time: string;
    end_time?: string | null;
  }) => { success: boolean; error?: string; trip?: Trip };
  updateTrip: (trip: Trip) => { success: boolean; error?: string };
  cancelTrip: (tripId: string) => void;
  updateTripCapacity: (tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => void;
  updateTripStopArrivalStatus: (tripId: string, stopId: string, status: TripStop['arrival_status']) => void;

  // General Notification Helpers & Navigation
  dismissNotification: (id: string) => void;
  triggerNotification: (title: string, message: string, type: AppNotification['type']) => void;
  navigateToStopDetails: (stopId: string) => void;
  navigateToLiveTracking: (tripId: string) => void;
  navigateToRouteDetails: (routeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDriverMode, setIsDriverMode] = useState<boolean>(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'driver' | 'admin'>('student');

  // Selected entities
  const [selectedStopId, setSelectedStopId] = useState<string>('STOP-MANSAROVAR');
  const [selectedTripId, setSelectedTripId] = useState<string>('TRIP-101');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-02');

  // Core entities state
  const [student] = useState<Student>(CURRENT_STUDENT);
  const [driver] = useState<Driver>(MOCK_DRIVERS[0]); // Ramesh Kumar
  const [admin] = useState<Admin>(CURRENT_ADMIN);
  const [studentLocation] = useState<StudentLocation>(INITIAL_STUDENT_LOCATION);

  // Relational tables managed with state for full CRUD
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES);
  const [stops, setStops] = useState<Stop[]>(MOCK_STOPS);
  const [routeStops, setRouteStops] = useState<RouteStop[]>(MOCK_ROUTE_STOPS);
  const [shuttles, setShuttles] = useState<Shuttle[]>(MOCK_SHUTTLES);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [tripStops, setTripStops] = useState<TripStop[]>(INITIAL_TRIP_STOPS);
  const [shuttleLocations, setShuttleLocations] = useState<ShuttleLocation[]>(INITIAL_SHUTTLE_LOCATIONS);
  const [routeCoordinates, setRouteCoordinates] = useState<Record<string, [number, number][]>>(ROUTE_PATH_COORDINATES);

  // Dynamic live ETAs (minutes remaining)
  const [etaMap, setEtaMap] = useState<Record<string, number>>({
    'TRIP-101_STOP-MANSAROVAR': 5,
    'TRIP-101_STOP-DCM': 18,
    'TRIP-102_STOP-AIRPORT': 7,
    'TRIP-103_STOP-VAISHALI': 4,
    'TRIP-101_STOP-JKLU': 28,
    'TRIP-102_STOP-JKLU': 32
  });

  // Notification queue
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Simulation settings
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Add Notification helper
  const triggerNotification = useCallback(
    (title: string, message: string, type: AppNotification['type']) => {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        message,
        type,
        timestamp: 'Just now',
        read: false
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Quick navigation helpers
  const navigateToStopDetails = useCallback((stopId: string) => {
    setSelectedStopId(stopId);
    setCurrentScreen('stop-details');
    setActiveTab('home');
  }, []);

  const navigateToLiveTracking = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
    const trip = trips.find((t) => t.trip_id === tripId);
    if (trip) {
      setSelectedRouteId(trip.route_id);
    }
    if (currentUserRole === 'admin') {
      setCurrentScreen('admin-live-tracking');
    } else {
      setCurrentScreen('live-tracking');
      setActiveTab('track');
    }
  }, [trips, currentUserRole]);

  const navigateToRouteDetails = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    if (currentUserRole === 'admin') {
      setCurrentScreen('admin-routes');
    } else {
      setCurrentScreen('route-details');
    }
  }, [currentUserRole]);

  // Driver operations
  const handleStartTrip = useCallback(
    (tripId: string) => {
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? tripService.startTrip(t) : t))
      );
      triggerNotification(
        'JKLU SHUTTLE',
        `Trip ${tripId} has commenced. Live GPS telemetry is active.`,
        'info'
      );
    },
    [triggerNotification]
  );

  const handleEndTrip = useCallback(
    (tripId: string) => {
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? tripService.endTrip(t) : t))
      );
      triggerNotification(
        'JKLU SHUTTLE',
        `Trip ${tripId} completed at JK Lakshmipat University.`,
        'info'
      );
    },
    [triggerNotification]
  );

  const handleToggleCapacity = useCallback(
    (tripId: string) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.trip_id === tripId) {
            const nextStatus: 'AVAILABLE' | 'FULL' = t.capacity_status === 'AVAILABLE' ? 'FULL' : 'AVAILABLE';
            if (nextStatus === 'FULL') {
              triggerNotification(
                'JKLU SHUTTLE',
                `Shuttle capacity updated: Seats are now FULL.`,
                'full'
              );
            } else {
              triggerNotification(
                'JKLU SHUTTLE',
                `Shuttle capacity updated: Seats now AVAILABLE.`,
                'info'
              );
            }
            return tripService.updateCapacity(t, nextStatus);
          }
          return t;
        })
      );
    },
    [triggerNotification]
  );

  // ================= ADMIN ROUTE CRUD =================
  const createRoute = useCallback((routeData: {
    route_id: string;
    route_name: string;
    route_code: string;
    description: string;
    color: string;
    stop_ids: string[];
  }) => {
    const cleanId = routeData.route_id.trim().toUpperCase();
    const cleanCode = routeData.route_code.trim().toUpperCase();

    if (!cleanId || !routeData.route_name.trim()) {
      return { success: false, error: 'Route ID and Route Name are required.' };
    }
    if (routes.some(r => r.route_id.toUpperCase() === cleanId)) {
      return { success: false, error: `Route ID '${cleanId}' already exists.` };
    }
    if (routes.some(r => r.route_code.toUpperCase() === cleanCode)) {
      return { success: false, error: `Route Code '${cleanCode}' already exists.` };
    }
    if (!routeData.stop_ids || routeData.stop_ids.length < 2) {
      return { success: false, error: 'A route must have at least 2 stops.' };
    }

    const newRoute: Route = {
      route_id: cleanId,
      route_name: routeData.route_name.trim(),
      route_code: cleanCode,
      total_stops: routeData.stop_ids.length,
      description: routeData.description.trim() || 'University Transit Route',
      color: routeData.color || '#2B4A7E'
    };

    const newRouteStops: RouteStop[] = routeData.stop_ids.map((stopId, idx) => ({
      route_id: cleanId,
      stop_id: stopId,
      sequence_number: idx + 1
    }));

    // Build polyline coordinates from the ordered stops
    const coords: [number, number][] = [];
    routeData.stop_ids.forEach((sid) => {
      const st = stops.find((s) => s.stop_id === sid);
      if (st) {
        coords.push([st.latitude, st.longitude]);
      }
    });

    setRoutes((prev) => [...prev, newRoute]);
    setRouteStops((prev) => [...prev, ...newRouteStops]);
    if (coords.length > 0) {
      setRouteCoordinates((prev) => ({
        ...prev,
        [cleanId]: coords
      }));
    }

    triggerNotification(
      'ROUTE CREATED',
      `Route ${newRoute.route_code} (${newRoute.route_name}) created with ${newRoute.total_stops} stops.`,
      'info'
    );
    return { success: true };
  }, [routes, stops, triggerNotification]);

  const updateRoute = useCallback((updated: Route, stop_ids?: string[]) => {
    setRoutes((prev) => prev.map((r) => (r.route_id === updated.route_id ? updated : r)));
    if (stop_ids && stop_ids.length > 0) {
      const newRouteStops: RouteStop[] = stop_ids.map((stopId, idx) => ({
        route_id: updated.route_id,
        stop_id: stopId,
        sequence_number: idx + 1
      }));
      setRouteStops((prev) => [
        ...prev.filter((rs) => rs.route_id !== updated.route_id),
        ...newRouteStops
      ]);
      const coords: [number, number][] = [];
      stop_ids.forEach((sid) => {
        const st = stops.find((s) => s.stop_id === sid);
        if (st) coords.push([st.latitude, st.longitude]);
      });
      if (coords.length > 0) {
        setRouteCoordinates((prev) => ({ ...prev, [updated.route_id]: coords }));
      }
    }
    triggerNotification('ROUTE UPDATED', `Route ${updated.route_code} updated successfully.`, 'info');
    return { success: true };
  }, [stops, triggerNotification]);

  const deleteRoute = useCallback((routeId: string) => {
    // Check if referenced by active or scheduled trips
    const activeTrip = trips.find(
      (t) => t.route_id === routeId && (t.running_status === 'RUNNING' || t.running_status === 'SCHEDULED')
    );
    if (activeTrip) {
      return {
        success: false,
        error: `Cannot delete Route ${routeId}: Trip ${activeTrip.trip_id} is currently ${activeTrip.running_status}. Complete or cancel the trip first.`
      };
    }
    setRoutes((prev) => prev.filter((r) => r.route_id !== routeId));
    setRouteStops((prev) => prev.filter((rs) => rs.route_id !== routeId));
    triggerNotification('ROUTE DELETED', `Route ${routeId} has been removed.`, 'info');
    return { success: true };
  }, [trips, triggerNotification]);

  // ================= ADMIN STOP CRUD =================
  const createStop = useCallback((stopData: Stop) => {
    const cleanId = stopData.stop_id.trim().toUpperCase();
    if (stops.some((s) => s.stop_id.toUpperCase() === cleanId)) {
      return { success: false, error: `Stop ID '${cleanId}' already exists.` };
    }
    const newStop: Stop = {
      ...stopData,
      stop_id: cleanId,
      latitude: Number(stopData.latitude),
      longitude: Number(stopData.longitude)
    };
    setStops((prev) => [...prev, newStop]);
    triggerNotification('STOP CREATED', `Stop '${newStop.stop_name}' added.`, 'info');
    return { success: true };
  }, [stops, triggerNotification]);

  const updateStop = useCallback((stopData: Stop) => {
    setStops((prev) => prev.map((s) => (s.stop_id === stopData.stop_id ? stopData : s)));
    triggerNotification('STOP UPDATED', `Stop '${stopData.stop_name}' updated.`, 'info');
    return { success: true };
  }, [triggerNotification]);

  const deleteStop = useCallback((stopId: string) => {
    const isUsed = routeStops.some((rs) => rs.stop_id === stopId);
    if (isUsed) {
      return {
        success: false,
        error: `Cannot delete Stop ${stopId}: It is assigned to one or more active routes. Remove it from those routes first.`
      };
    }
    setStops((prev) => prev.filter((s) => s.stop_id !== stopId));
    triggerNotification('STOP DELETED', `Stop ${stopId} has been removed.`, 'info');
    return { success: true };
  }, [routeStops, triggerNotification]);

  const assignStopToRoute = useCallback((routeId: string, stopId: string, sequenceNumber?: number) => {
    setRouteStops((prev) => {
      const existing = prev.filter((rs) => rs.route_id === routeId);
      const nextSeq = sequenceNumber ?? existing.length + 1;
      const updated = [...existing, { route_id: routeId, stop_id: stopId, sequence_number: nextSeq }]
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map((item, idx) => ({ ...item, sequence_number: idx + 1 }));
      return [...prev.filter((rs) => rs.route_id !== routeId), ...updated];
    });
    setRoutes((prev) =>
      prev.map((r) => (r.route_id === routeId ? { ...r, total_stops: r.total_stops + 1 } : r))
    );
    triggerNotification('STOP ASSIGNED', `Stop added to Route ${routeId}.`, 'info');
  }, [triggerNotification]);

  const removeStopFromRoute = useCallback((routeId: string, stopId: string) => {
    setRouteStops((prev) => {
      const remaining = prev
        .filter((rs) => !(rs.route_id === routeId && rs.stop_id === stopId))
        .filter((rs) => rs.route_id === routeId)
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map((item, idx) => ({ ...item, sequence_number: idx + 1 }));
      return [...prev.filter((rs) => rs.route_id !== routeId), ...remaining];
    });
    setRoutes((prev) =>
      prev.map((r) => (r.route_id === routeId ? { ...r, total_stops: Math.max(1, r.total_stops - 1) } : r))
    );
    triggerNotification('STOP REMOVED', `Stop removed from Route ${routeId}.`, 'info');
  }, [triggerNotification]);

  const reorderRouteStops = useCallback((routeId: string, stopIdsInOrder: string[]) => {
    const newRouteStops: RouteStop[] = stopIdsInOrder.map((stopId, idx) => ({
      route_id: routeId,
      stop_id: stopId,
      sequence_number: idx + 1
    }));
    setRouteStops((prev) => [
      ...prev.filter((rs) => rs.route_id !== routeId),
      ...newRouteStops
    ]);
  }, []);

  // ================= ADMIN SHUTTLE CRUD =================
  const createShuttle = useCallback((shuttleData: Shuttle) => {
    const cleanId = shuttleData.shuttle_id.trim().toUpperCase();
    if (shuttles.some((s) => s.shuttle_id.toUpperCase() === cleanId)) {
      return { success: false, error: `Shuttle ID '${cleanId}' already exists.` };
    }
    const newShuttle: Shuttle = {
      ...shuttleData,
      shuttle_id: cleanId,
      capacity: Number(shuttleData.capacity) || 32
    };
    setShuttles((prev) => [...prev, newShuttle]);
    triggerNotification('SHUTTLE ADDED', `${newShuttle.shuttle_number} added to fleet.`, 'info');
    return { success: true };
  }, [shuttles, triggerNotification]);

  const updateShuttle = useCallback((shuttleData: Shuttle) => {
    setShuttles((prev) => prev.map((s) => (s.shuttle_id === shuttleData.shuttle_id ? shuttleData : s)));
    triggerNotification('SHUTTLE UPDATED', `${shuttleData.shuttle_number} details updated.`, 'info');
    return { success: true };
  }, [triggerNotification]);

  const setShuttleStatus = useCallback((shuttleId: string, status: Shuttle['status']) => {
    setShuttles((prev) => prev.map((s) => (s.shuttle_id === shuttleId ? { ...s, status } : s)));
    triggerNotification('FLEET STATUS UPDATED', `Shuttle ${shuttleId} status changed to ${status}.`, 'info');
  }, [triggerNotification]);

  // ================= ADMIN DRIVER CRUD =================
  const createDriver = useCallback((data: {
    name: string;
    phone_number: string;
    license_no: string;
    assigned_shuttle_id?: string;
  }) => {
    const newId = `DRV-${Date.now().toString().slice(-3)}`;
    const newDriver: Driver = {
      user_id: `USR-${newId}`,
      driver_id: newId,
      name: data.name.trim(),
      phone_number: data.phone_number.trim(),
      license_no: data.license_no.trim(),
      assigned_shuttle_id: data.assigned_shuttle_id
    };
    setDrivers((prev) => [...prev, newDriver]);
    triggerNotification('DRIVER ADDED', `Captain ${data.name} enrolled into transport system.`, 'info');
    return { success: true };
  }, [triggerNotification]);

  const updateDriver = useCallback((driverData: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.driver_id === driverData.driver_id ? driverData : d)));
    triggerNotification('DRIVER UPDATED', `Captain ${driverData.name} record updated.`, 'info');
    return { success: true };
  }, [triggerNotification]);

  const deleteDriver = useCallback((driverId: string) => {
    const activeTrip = trips.find((t) => t.driver_id === driverId && t.running_status === 'RUNNING');
    if (activeTrip) {
      return { success: false, error: 'Cannot remove driver while operating an active trip.' };
    }
    setDrivers((prev) => prev.filter((d) => d.driver_id !== driverId));
    triggerNotification('DRIVER REMOVED', `Driver ${driverId} deactivated.`, 'info');
    return { success: true };
  }, [trips, triggerNotification]);

  // ================= ADMIN TRIP MANAGEMENT =================
  const createTrip = useCallback((data: {
    route_id: string;
    shuttle_id: string;
    driver_id: string;
    start_time: string;
    end_time?: string | null;
  }) => {
    // 1. Validate shuttle status
    const targetShuttle = shuttles.find((s) => s.shuttle_id === data.shuttle_id);
    if (!targetShuttle) {
      return { success: false, error: 'Selected shuttle does not exist.' };
    }
    if (targetShuttle.status === 'MAINTENANCE') {
      return { success: false, error: `Shuttle ${targetShuttle.shuttle_number} is in MAINTENANCE and cannot be assigned to a new trip.` };
    }
    if (targetShuttle.status === 'OFFLINE') {
      return { success: false, error: `Shuttle ${targetShuttle.shuttle_number} is OFFLINE and cannot be assigned to a new trip.` };
    }

    // 2. Validate shuttle not already running another trip
    const shuttleInUse = trips.find(
      (t) => t.shuttle_id === data.shuttle_id && t.running_status === 'RUNNING'
    );
    if (shuttleInUse) {
      return { success: false, error: `Shuttle ${targetShuttle.shuttle_number} is already operating Trip ${shuttleInUse.trip_id}.` };
    }

    // 3. Validate driver availability
    const driverInUse = trips.find(
      (t) => t.driver_id === data.driver_id && t.running_status === 'RUNNING'
    );
    if (driverInUse) {
      const drv = drivers.find((d) => d.driver_id === data.driver_id);
      return { success: false, error: `Driver ${drv?.name || data.driver_id} is already operating Trip ${driverInUse.trip_id}.` };
    }

    // 4. Generate new Trip ID
    const newTripId = `TRIP-${Date.now().toString().slice(-3)}`;
    const newTrip: Trip = {
      trip_id: newTripId,
      shuttle_id: data.shuttle_id,
      route_id: data.route_id,
      driver_id: data.driver_id,
      start_time: data.start_time,
      end_time: data.end_time || null,
      running_status: 'SCHEDULED',
      capacity_status: 'AVAILABLE',
      speed_kmh: 0
    };

    // 5. Automatically create Trip_Stop records from Route_Stop sequence!
    const sequenceStops = routeStops
      .filter((rs) => rs.route_id === data.route_id)
      .sort((a, b) => a.sequence_number - b.sequence_number);

    const newTripStops: TripStop[] = sequenceStops.map((rs, index) => {
      const offsetMin = index * 15;
      const [hourStr, minuteStrWithPeriod] = data.start_time.split(':');
      const hour = parseInt(hourStr) || 9;
      const parts = minuteStrWithPeriod ? minuteStrWithPeriod.split(' ') : ['00', 'AM'];
      const minute = parseInt(parts[0]) || 0;
      const period = parts[1] || 'AM';

      const totalMinutes = minute + offsetMin;
      const addHours = Math.floor(totalMinutes / 60);
      const finalMinute = totalMinutes % 60;
      let finalHour = hour + addHours;
      let finalPeriod = period;
      if (finalHour > 12) {
        finalHour -= 12;
        if (period === 'AM') finalPeriod = 'PM';
      }

      const formattedTime = `${String(finalHour).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')} ${finalPeriod}`;

      return {
        trip_id: newTripId,
        stop_id: rs.stop_id,
        scheduled_arrival: formattedTime,
        scheduled_departure: formattedTime,
        estimated_arrival: formattedTime,
        actual_arrival: null,
        actual_departure: null,
        arrival_status: 'SCHEDULED'
      };
    });

    // 6. Setup initial shuttle location for this trip so it can be tracked
    const originStop = stops.find((s) => s.stop_id === (sequenceStops[0]?.stop_id || 'STOP-JKLU-START'));
    const initialLoc: ShuttleLocation = {
      shuttle_id: data.shuttle_id,
      trip_id: newTripId,
      latitude: originStop?.latitude || 26.8373,
      longitude: originStop?.longitude || 75.6499,
      bearing: 90,
      timestamp: new Date().toISOString(),
      progress_percentage: 0,
      current_segment_index: 0
    };

    setTrips((prev) => [newTrip, ...prev]);
    setTripStops((prev) => [...prev, ...newTripStops]);
    setShuttleLocations((prev) => {
      const filtered = prev.filter((sl) => sl.shuttle_id !== data.shuttle_id);
      return [...filtered, initialLoc];
    });

    triggerNotification(
      'TRIP SCHEDULED',
      `Trip ${newTripId} on ${data.route_id} scheduled for ${data.start_time}.`,
      'info'
    );

    return { success: true, trip: newTrip };
  }, [shuttles, trips, drivers, routeStops, stops, triggerNotification]);

  const updateTrip = useCallback((updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => (t.trip_id === updatedTrip.trip_id ? updatedTrip : t)));
    triggerNotification('TRIP UPDATED', `Trip ${updatedTrip.trip_id} updated.`, 'info');
    return { success: true };
  }, [triggerNotification]);

  const cancelTrip = useCallback((tripId: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'CANCELLED', speed_kmh: 0 } : t))
    );
    triggerNotification('TRIP CANCELLED', `Trip ${tripId} has been cancelled.`, 'info');
  }, [triggerNotification]);

  const updateTripCapacity = useCallback((tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => {
    setTrips((prev) => prev.map((t) => (t.trip_id === tripId ? { ...t, capacity_status: capacity } : t)));
  }, []);

  const updateTripStopArrivalStatus = useCallback(
    (tripId: string, stopId: string, status: TripStop['arrival_status']) => {
      setTripStops((prev) => tripService.updateTripStopStatus(prev, tripId, stopId, status));
    },
    []
  );

  const resetSimulation = useCallback(() => {
    setRoutes(MOCK_ROUTES);
    setStops(MOCK_STOPS);
    setRouteStops(MOCK_ROUTE_STOPS);
    setShuttles(MOCK_SHUTTLES);
    setDrivers(MOCK_DRIVERS);
    setTrips(INITIAL_TRIPS);
    setTripStops(INITIAL_TRIP_STOPS);
    setShuttleLocations(INITIAL_SHUTTLE_LOCATIONS);
    setRouteCoordinates(ROUTE_PATH_COORDINATES);
    setEtaMap({
      'TRIP-101_STOP-MANSAROVAR': 5,
      'TRIP-101_STOP-DCM': 18,
      'TRIP-102_STOP-AIRPORT': 7,
      'TRIP-103_STOP-VAISHALI': 4,
      'TRIP-101_STOP-JKLU': 28,
      'TRIP-102_STOP-JKLU': 32
    });
    triggerNotification('SYSTEM RESET', 'Database and simulation restored to original state.', 'info');
  }, [triggerNotification]);

  // Real-time Timer-based simulation loop: smooth GPS movement and ETA decrement
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = Math.max(250, Math.floor(1200 / simSpeed));
    let tickCounter = 0;

    const interval = setInterval(() => {
      tickCounter++;

      // 1. Smoothly interpolate GPS coordinates for all running shuttles
      setShuttleLocations((prevLocations) =>
        prevLocations.map((loc) => {
          const trip = trips.find((t) => t.trip_id === loc.trip_id);
          if (!trip || trip.running_status !== 'RUNNING') return loc;

          return shuttleService.advanceShuttleLocation(
            loc,
            trip.route_id,
            0.9 * simSpeed,
            routeCoordinates
          );
        })
      );

      // 2. Decrement ETAs periodically
      if (tickCounter % 8 === 0) {
        setEtaMap((prev) => {
          const updated: Record<string, number> = {};
          for (const key of Object.keys(prev)) {
            const current = prev[key];
            if (current > 1) {
              updated[key] = current - 1;
            } else {
              updated[key] = key.includes('TRIP-101') ? 5 : 12;
            }
          }
          return updated;
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, trips, routeCoordinates]);

  const loginUser = (email: string, _password?: string, forceRole?: 'student' | 'driver' | 'admin'): boolean => {
    let role: 'student' | 'driver' | 'admin' = 'student';
    if (email.toLowerCase().includes('admin')) {
      role = 'admin';
    } else if (forceRole) {
      role = forceRole;
    } else if (email.toLowerCase().includes('driver') || email.toLowerCase().includes('ramesh')) {
      role = 'driver';
    } else {
      role = 'student';
    }

    setIsAuthenticated(true);
    setCurrentUserRole(role);

    if (role === 'admin') {
      setIsDriverMode(false);
      setCurrentScreen('admin-dashboard');
      triggerNotification('ADMIN AUTHENTICATED', 'Welcome Prof. Anurag Sharma! Admin Control Center Active.', 'info');
    } else if (role === 'driver') {
      setIsDriverMode(true);
      setCurrentScreen('driver-dashboard');
      triggerNotification('DRIVER AUTHENTICATED', 'Welcome Captain Ramesh Kumar! Driver Dashboard Active.', 'info');
    } else {
      setIsDriverMode(false);
      setCurrentScreen('home');
      triggerNotification('STUDENT AUTHENTICATED', 'Welcome Pratham Lalwani! Student Portal Active.', 'info');
    }
    return true;
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    setIsDriverMode(false);
    setCurrentScreen('login');
    triggerNotification('LOGGED OUT', 'You have signed out of JKLU Shuttle.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        activeTab,
        setActiveTab,
        isDriverMode,
        setIsDriverMode,
        isAuthenticated,
        currentUserRole,
        loginUser,
        logoutUser,
        selectedStopId,
        setSelectedStopId,
        selectedTripId,
        setSelectedTripId,
        selectedRouteId,
        setSelectedRouteId,
        student,
        driver,
        admin,
        studentLocation,
        routes,
        stops,
        routeStops,
        shuttles,
        drivers,
        trips,
        tripStops,
        shuttleLocations,
        routeCoordinates,
        notifications,
        etaMap,
        isSimulating,
        setIsSimulating,
        simSpeed,
        setSimSpeed,
        resetSimulation,
        handleStartTrip,
        handleEndTrip,
        handleToggleCapacity,
        createRoute,
        updateRoute,
        deleteRoute,
        createStop,
        updateStop,
        deleteStop,
        assignStopToRoute,
        removeStopFromRoute,
        reorderRouteStops,
        createShuttle,
        updateShuttle,
        setShuttleStatus,
        createDriver,
        updateDriver,
        deleteDriver,
        createTrip,
        updateTrip,
        cancelTrip,
        updateTripCapacity,
        updateTripStopArrivalStatus,
        dismissNotification,
        triggerNotification,
        navigateToStopDetails,
        navigateToLiveTracking,
        navigateToRouteDetails
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
