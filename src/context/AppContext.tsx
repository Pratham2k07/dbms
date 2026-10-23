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
  ShuttleLocation,
  DriverAssignment,
  DriverNotification
} from '../types/database';
import { ScreenType, TabType, AppNotification } from '../types/ui';
import {
  CURRENT_STUDENT,
  CURRENT_ADMIN,
  INITIAL_STUDENT_LOCATION
} from '../data/userProfiles';
import { shuttleService } from '../services/shuttleService';
import { tripService } from '../services/tripService';
import { databaseService } from '../services/databaseService';
import * as authService from '../services/authService';
import * as apiService from '../services/apiService';
import { socketService } from '../services/socket';
import { locationService } from '../services/locationService';


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
  loginUser: (email: string, password?: string, forceRole?: 'student' | 'driver' | 'admin') => Promise<boolean>;
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
  driverAssignments: DriverAssignment[];
  driverNotifications: DriverNotification[];
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
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (driverId: string) => void;

  // Admin CRUD & Management
  createRoute: (routeData: {
    route_id: string;
    route_name: string;
    route_code: string;
    description: string;
    color: string;
    stop_ids: string[];
    assigned_shuttle_id?: string;
    assigned_driver_id?: string;
    start_time?: string;
    instructions?: string;
  }) => { success: boolean; error?: string; route?: Route; trip?: Trip };
  createRouteWithAssignment: (routeData: {
    route_id: string;
    route_name: string;
    route_code: string;
    description: string;
    color: string;
    stop_ids: string[];
    assigned_shuttle_id?: string;
    assigned_driver_id?: string;
    start_time?: string;
    instructions?: string;
  }) => { success: boolean; error?: string; route?: Route; trip?: Trip };
  updateRoute: (
    route: Route,
    stop_ids?: string[],
    newAssignedDriverId?: string,
    newAssignedShuttleId?: string
  ) => { success: boolean; error?: string };
  cancelRoute: (routeId: string) => { success: boolean; error?: string };
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

  updateStudentLocation: (loc: StudentLocation) => void;
  requestStudentLocation: () => Promise<void>;

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
  const [activeDriverId, setActiveDriverId] = useState<string>('DRV-101');

  // Selected entities
  const [selectedStopId, setSelectedStopId] = useState<string>('STOP-JKLU');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-01');

  // Core entities state
  const [student] = useState<Student>(CURRENT_STUDENT);
  const [admin] = useState<Admin>(CURRENT_ADMIN);
  const [studentLocation, setStudentLocation] = useState<StudentLocation>(INITIAL_STUDENT_LOCATION);

  const updateStudentLocation = useCallback((loc: StudentLocation) => {
    setStudentLocation(loc);
  }, []);

  const requestStudentLocation = useCallback(async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      setStudentLocation(loc);
    } catch (err) {
      console.warn('Geolocation permission not granted:', err);
    }
  }, []);


  // Central Database synchronized state
  const initialDb = databaseService.getState();
  const [routes, setRoutes] = useState<Route[]>(initialDb.routes);
  const [stops, setStops] = useState<Stop[]>(initialDb.stops);
  const [routeStops, setRouteStops] = useState<RouteStop[]>(initialDb.routeStops);
  const [shuttles, setShuttles] = useState<Shuttle[]>(initialDb.shuttles);
  const [drivers, setDrivers] = useState<Driver[]>(initialDb.drivers);
  const [trips, setTrips] = useState<Trip[]>(initialDb.trips);
  const [tripStops, setTripStops] = useState<TripStop[]>(initialDb.tripStops);
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>(initialDb.driverAssignments);
  const [driverNotifications, setDriverNotifications] = useState<DriverNotification[]>(initialDb.driverNotifications);
  const [shuttleLocations, setShuttleLocations] = useState<ShuttleLocation[]>(initialDb.shuttleLocations);
  const [routeCoordinates, setRouteCoordinates] = useState<Record<string, [number, number][]>>(initialDb.routeCoordinates);

  // Computed active driver object
  const driver: Driver = drivers.find((d) => d.driver_id === activeDriverId) || drivers[0] || initialDb.drivers[0];

  // Dynamic live ETAs (minutes remaining) calculated strictly from active GPS telemetry
  const [etaMap, setEtaMap] = useState<Record<string, number>>({});

  // Notification queue (In-app toasts)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Simulation settings
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Toast Notification helper
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

  // ================= Real-Time Synchronization Listener =================
  useEffect(() => {
    const unsubscribe = databaseService.subscribe((event, freshState) => {
      setRoutes(freshState.routes);
      setStops(freshState.stops);
      setRouteStops(freshState.routeStops);
      setShuttles(freshState.shuttles);
      setDrivers(freshState.drivers);
      setTrips(freshState.trips);
      setTripStops(freshState.tripStops);
      setDriverAssignments(freshState.driverAssignments);
      setDriverNotifications(freshState.driverNotifications);
      setShuttleLocations(freshState.shuttleLocations);
      setRouteCoordinates(freshState.routeCoordinates);

      if (event.action === 'ROUTE_CREATED') {
        const rName = event.payload?.route?.route_name || 'New Route';
        triggerNotification('REALTIME DISPATCH', `Route ${event.payload?.route?.route_code || ''} (${rName}) created and synchronized.`, 'info');
      } else if (event.action === 'ROUTE_CANCELLED') {
        triggerNotification('ROUTE CANCELLED', `Route ${event.payload?.routeId || ''} cancelled. Approaching shuttles updated.`, 'full');
      } else if (event.action === 'TRIP_STATUS_CHANGED') {
        const trip = event.payload?.trip as Trip | undefined;
        if (trip) {
          triggerNotification('LIVE TRIP UPDATE', `Trip ${trip.trip_id} status changed to ${trip.running_status}.`, 'info');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [triggerNotification]);

  // ================= WebSocket Live Tracking Listener =================
  useEffect(() => {
    socketService.connect();

    // Ingest real GPS telemetry broadcasts from backend
    socketService.onLocationUpdated((data: any) => {
      if (!data) return;

      const targetId = data.shuttle_id || `SHT-${data.id}`;
      const targetTripId = data.trip_id;

      setShuttleLocations((prev) => {
        const existingIdx = prev.findIndex(
          (loc) => loc.shuttle_id === targetId || (targetTripId && loc.trip_id === targetTripId)
        );

        const newEntry: ShuttleLocation = {
          shuttle_id: targetId,
          trip_id: targetTripId || '',
          latitude: Number(data.latitude || data.lat),
          longitude: Number(data.longitude || data.lng),
          bearing: Number(data.bearing || 0),
          speed_kmh: Number(data.speed_kmh || 0),
          accuracy_m: data.accuracy_m ? Number(data.accuracy_m) : undefined,
          progress_percentage: Number(data.progress_percentage || 0),
          distance_remaining_km: data.distance_remaining_km !== undefined ? Number(data.distance_remaining_km) : undefined,
          timestamp: data.timestamp || new Date().toISOString()
        };

        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = newEntry;
          return updated;
        }
        return [...prev, newEntry];
      });

      // Update theoretical ETAs dynamically
      if (data.current_or_next_stop && data.trip_id) {
        const stopId = data.current_or_next_stop.stop_id;
        const etaMins =
          data.current_or_next_stop.theoretical_eta_minutes ??
          Math.max(1, Math.round(((data.distance_remaining_km || 0) / 25) * 60));
        setEtaMap((prev) => ({
          ...prev,
          [`${data.trip_id}_${stopId}`]: etaMins
        }));
      }
    });

    socketService.onTripStarted((data: any) => {
      if (data?.trip_id) {
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === data.trip_id ? { ...t, running_status: 'RUNNING' } : t))
        );
      }
    });

    socketService.onTripEnded((data: any) => {
      if (data?.trip_id) {
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === data.trip_id ? { ...t, running_status: 'COMPLETED' } : t))
        );
        setShuttleLocations((prev) =>
          prev.filter((loc) => loc.trip_id !== data.trip_id && loc.shuttle_id !== data.shuttle_id)
        );
      }
    });
  }, []);

  // ================= Hydrate Initial State from Live Supabase Database =================
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiService.getRoutes().catch(() => null),
      apiService.getShuttles().catch(() => null),
      apiService.getTrips().catch(() => null),
      apiService.getDrivers().catch(() => null),
      apiService.getAllStops().catch(() => null),
      apiService.getAllRouteStops().catch(() => null)
    ]).then(([liveRoutes, liveShuttles, liveTrips, liveDrivers, liveStops, liveRouteStops]) => {
      if (!isMounted) return;
      if (liveRoutes && Array.isArray(liveRoutes) && liveRoutes.length > 0) {
        setRoutes(liveRoutes);
        // Hydrate real road geometry from database
        const coordsMap: Record<string, [number, number][]> = {};
        liveRoutes.forEach((r: any) => {
          if (r.route_coordinates && Array.isArray(r.route_coordinates)) {
            coordsMap[r.route_id] = r.route_coordinates;
          }
        });
        if (Object.keys(coordsMap).length > 0) {
          setRouteCoordinates((prev) => ({ ...prev, ...coordsMap }));
        }
      }
      if (liveStops && Array.isArray(liveStops) && liveStops.length > 0) {
        setStops(liveStops);
      }
      if (liveRouteStops && Array.isArray(liveRouteStops) && liveRouteStops.length > 0) {
        setRouteStops(liveRouteStops);
      }
      if (liveShuttles && Array.isArray(liveShuttles) && liveShuttles.length > 0) {
        setShuttles(liveShuttles);
      }
      if (liveTrips && Array.isArray(liveTrips) && liveTrips.length > 0) {
        setTrips(liveTrips);
      }
      if (liveDrivers && Array.isArray(liveDrivers) && liveDrivers.length > 0) {
        setDrivers(liveDrivers);
      }

      databaseService.syncFromLiveDatabase({
        routes: liveRoutes && Array.isArray(liveRoutes) ? liveRoutes : undefined,
        stops: liveStops && Array.isArray(liveStops) ? liveStops : undefined,
        routeStops: liveRouteStops && Array.isArray(liveRouteStops) ? liveRouteStops : undefined,
        shuttles: liveShuttles && Array.isArray(liveShuttles) ? liveShuttles : undefined,
        trips: liveTrips && Array.isArray(liveTrips) ? liveTrips : undefined,
        drivers: liveDrivers && Array.isArray(liveDrivers) ? liveDrivers : undefined
      });
    });
    return () => {
      isMounted = false;
    };
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
    async (tripId: string) => {
      databaseService.updateTripRunningStatus(tripId, 'RUNNING');
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'RUNNING' } : t))
      );
      try {
        await apiService.startTrip(tripId);
      } catch (err) {
        console.warn('API error in startTrip:', err);
      }

      triggerNotification(
        'JKLU SHUTTLE',
        `Trip ${tripId} has commenced. Real driver GPS telemetry is active.`,
        'info'
      );
    },
    [triggerNotification]
  );

  const handleEndTrip = useCallback(
    async (tripId: string) => {
      databaseService.updateTripRunningStatus(tripId, 'COMPLETED');
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'COMPLETED' } : t))
      );
      // Remove shuttle from active live tracking
      setShuttleLocations((prev) => prev.filter((loc) => loc.trip_id !== tripId));
      try {
        await apiService.endTrip(tripId);
      } catch (err) {
        console.warn('API error in endTrip:', err);
      }

      triggerNotification(
        'JKLU SHUTTLE',
        `Trip ${tripId} completed at JK Lakshmipat University. Live tracking ended.`,
        'info'
      );
    },
    [triggerNotification]
  );


  const handleToggleCapacity = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.trip_id === tripId);
      if (!trip) return;
      const nextStatus: 'AVAILABLE' | 'FULL' = trip.capacity_status === 'AVAILABLE' ? 'FULL' : 'AVAILABLE';
      databaseService.updateTripCapacity(tripId, nextStatus);
      
      // Async hit backend
      apiService.updateTripCapacity(tripId, nextStatus).catch(err => console.warn('API error', err));

      triggerNotification(
        'CAPACITY UPDATED',
        `Shuttle capacity updated: Seats now ${nextStatus}.`,
        nextStatus === 'FULL' ? 'full' : 'info'
      );
    },
    [trips, triggerNotification]
  );

  const markNotificationAsRead = useCallback((notificationId: string) => {
    databaseService.markNotificationAsRead(notificationId);
  }, []);

  const markAllNotificationsAsRead = useCallback((driverId: string) => {
    databaseService.markAllNotificationsAsRead(driverId);
  }, []);

  const createRoute = useCallback((routeData: {
    route_id: string;
    route_name: string;
    route_code: string;
    description: string;
    color: string;
    stop_ids: string[];
    assigned_shuttle_id?: string;
    assigned_driver_id?: string;
    start_time?: string;
    instructions?: string;
  }) => {
    const res = databaseService.createRouteWithAssignment(routeData);
    if (res.success && res.route) {
      // Async hit backend with generated trip_id if assigned
      apiService.createRoute({
        ...routeData,
        trip_id: res.trip?.trip_id
      }).catch(err => console.warn('API error in createRoute:', err));

      triggerNotification(
        'ROUTE CREATED & SAVED',
        `Route ${res.route.route_code} (${res.route.route_name}) created with ${res.route.total_stops} stops.`,
        'info'
      );
    }
    return res;
  }, [triggerNotification]);

  const createRouteWithAssignment = createRoute;

  const updateRoute = useCallback((
    updated: Route,
    stop_ids?: string[],
    newAssignedDriverId?: string,
    newAssignedShuttleId?: string
  ) => {
    const res = databaseService.updateRoute(updated, stop_ids, newAssignedDriverId, newAssignedShuttleId);
    if (res.success) {
      // Async hit backend
      apiService.updateRoute(updated.route_id, { updated, stop_ids }).catch(err => console.warn('API error', err));

      triggerNotification('ROUTE UPDATED', `Route ${updated.route_code} updated successfully.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const cancelRoute = useCallback((routeId: string) => {
    const res = databaseService.cancelRoute(routeId);
    if (res.success) {
      triggerNotification('ROUTE CANCELLED', `Route ${routeId} cancelled by admin dispatch.`, 'full');
    }
    return res;
  }, [triggerNotification]);

  const deleteRoute = useCallback((routeId: string) => {
    const res = databaseService.deleteRoute(routeId);
    if (res.success) {
      // Async hit backend
      apiService.deleteRoute(routeId).catch(err => console.warn('API error', err));

      triggerNotification('ROUTE DELETED', `Route ${routeId} has been removed.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  // ================= ADMIN STOP CRUD =================
  const createStop = useCallback((stopData: Stop) => {
    const res = databaseService.createStop(stopData);
    if (res.success) {
      apiService.createStop(stopData).catch(err => console.warn('API error in createStop:', err));
      triggerNotification('STOP CREATED', `Stop '${stopData.stop_name}' added.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const updateStop = useCallback((stopData: Stop) => {
    const res = databaseService.updateStop(stopData);
    if (res.success) {
      apiService.updateStop(stopData.stop_id, stopData).catch(err => console.warn('API error in updateStop:', err));
      triggerNotification('STOP UPDATED', `Stop '${stopData.stop_name}' updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const deleteStop = useCallback((stopId: string) => {
    const res = databaseService.deleteStop(stopId);
    if (res.success) {
      apiService.deleteStop(stopId).catch(err => console.warn('API error in deleteStop:', err));
      triggerNotification('STOP DELETED', `Stop ${stopId} has been removed.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const assignStopToRoute = useCallback((routeId: string, stopId: string, sequenceNumber?: number) => {
    const existingStops = routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => rs.stop_id);
    const updatedIds = [...existingStops];
    if (sequenceNumber && sequenceNumber <= updatedIds.length) {
      updatedIds.splice(sequenceNumber - 1, 0, stopId);
    } else {
      updatedIds.push(stopId);
    }
    const targetRoute = routes.find((r) => r.route_id === routeId);
    if (targetRoute) {
      databaseService.updateRoute(targetRoute, updatedIds);
      triggerNotification('STOP ASSIGNED', `Stop added to Route ${routeId}.`, 'info');
    }
  }, [routeStops, routes, triggerNotification]);

  const removeStopFromRoute = useCallback((routeId: string, stopId: string) => {
    const existingStops = routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => rs.stop_id);
    const remaining = existingStops.filter((id) => id !== stopId);
    const targetRoute = routes.find((r) => r.route_id === routeId);
    if (targetRoute) {
      databaseService.updateRoute(targetRoute, remaining);
      triggerNotification('STOP REMOVED', `Stop removed from Route ${routeId}.`, 'info');
    }
  }, [routeStops, routes, triggerNotification]);

  const reorderRouteStops = useCallback((routeId: string, stopIdsInOrder: string[]) => {
    const targetRoute = routes.find((r) => r.route_id === routeId);
    if (targetRoute) {
      databaseService.updateRoute(targetRoute, stopIdsInOrder);
    }
  }, [routes]);

  // ================= ADMIN SHUTTLE CRUD =================
  const createShuttle = useCallback((shuttleData: Shuttle) => {
    const res = databaseService.createShuttle(shuttleData);
    if (res.success) {
      apiService.createShuttle(shuttleData).catch(err => console.warn('API error in createShuttle:', err));
      triggerNotification('SHUTTLE ADDED', `${shuttleData.shuttle_number} added to fleet.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const updateShuttle = useCallback((shuttleData: Shuttle) => {
    const res = databaseService.updateShuttle(shuttleData);
    if (res.success) {
      apiService.updateShuttle(shuttleData.shuttle_id, shuttleData).catch(err => console.warn('API error in updateShuttle:', err));
      triggerNotification('SHUTTLE UPDATED', `${shuttleData.shuttle_number} details updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const setShuttleStatus = useCallback((shuttleId: string, status: Shuttle['status']) => {
    databaseService.setShuttleStatus(shuttleId, status);
    apiService.updateShuttleStatus(shuttleId, status).catch(err => console.warn('API error in updateShuttleStatus:', err));
    triggerNotification('FLEET STATUS UPDATED', `Shuttle ${shuttleId} status changed to ${status}.`, 'info');
  }, [triggerNotification]);

  // ================= ADMIN DRIVER CRUD =================
  const createDriver = useCallback((data: {
    name: string;
    phone_number: string;
    license_no: string;
    assigned_shuttle_id?: string;
  }) => {
    const res = databaseService.createDriver(data);
    if (res.success) {
      apiService.createDriver(data).catch(err => console.warn('API error in createDriver:', err));
      triggerNotification('DRIVER ADDED', `Captain ${data.name} enrolled into transport system.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const updateDriver = useCallback((driverData: Driver) => {
    const res = databaseService.updateDriver(driverData);
    if (res.success) {
      apiService.updateDriver(driverData.driver_id, driverData).catch(err => console.warn('API error in updateDriver:', err));
      triggerNotification('DRIVER UPDATED', `Captain ${driverData.name} record updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const deleteDriver = useCallback((driverId: string) => {
    const res = databaseService.deleteDriver(driverId);
    if (res.success) {
      apiService.deleteDriver(driverId).catch(err => console.warn('API error in deleteDriver:', err));
      triggerNotification('DRIVER REMOVED', `Driver ${driverId} deactivated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  // ================= ADMIN TRIP MANAGEMENT =================
  const createTrip = useCallback((data: {
    route_id: string;
    shuttle_id: string;
    driver_id: string;
    start_time: string;
    end_time?: string | null;
  }) => {
    const res = databaseService.createTrip(data);
    if (res.success && res.trip) {
      apiService.createTrip({
        ...data,
        trip_id: res.trip.trip_id
      }).catch(err => console.warn('API error in createTrip:', err));
      triggerNotification(
        'TRIP SCHEDULED',
        `Trip ${res.trip.trip_id} on ${data.route_id} scheduled for ${data.start_time}.`,
        'info'
      );
    }
    return res;
  }, [triggerNotification]);

  const updateTrip = useCallback((updatedTrip: Trip) => {
    const res = databaseService.updateTrip(updatedTrip);
    if (res.success) {
      apiService.updateTrip(updatedTrip.trip_id, updatedTrip).catch(err => console.warn('API error in updateTrip:', err));
      triggerNotification('TRIP UPDATED', `Trip ${updatedTrip.trip_id} updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const cancelTrip = useCallback((tripId: string) => {
    databaseService.cancelTrip(tripId);
    apiService.cancelTrip(tripId).catch(err => console.warn('API error in cancelTrip:', err));
    triggerNotification('TRIP CANCELLED', `Trip ${tripId} has been cancelled.`, 'info');
  }, [triggerNotification]);

  const updateTripCapacity = useCallback((tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => {
    databaseService.updateTripCapacity(tripId, capacity);
    apiService.updateTripCapacity(tripId, capacity).catch(err => console.warn('API error in updateTripCapacity:', err));
  }, []);

  const updateTripStopArrivalStatus = useCallback(
    (tripId: string, stopId: string, status: TripStop['arrival_status']) => {
      setTripStops((prev) => tripService.updateTripStopStatus(prev, tripId, stopId, status));
    },
    []
  );

  const resetSimulation = useCallback(() => {
    databaseService.resetToDefaultState();
    setEtaMap({});
    triggerNotification('SYSTEM RESET', 'Database state reset to clean database defaults.', 'info');
  }, [triggerNotification]);

  // Real-time tracking is driven strictly by live database telemetry and GPS broadcasts.
  // Fake movement loops and simulation intervals have been decommissioned.

  const loginUser = async (email: string, password?: string, forceRole?: 'student' | 'driver' | 'admin'): Promise<boolean> => {
    let role: 'student' | 'driver' | 'admin' = 'student';
    
    try {
      await authService.login(email, password || 'password123');
      socketService.connect();
    } catch (e) {
      console.warn("Backend auth notice:", e);
    }

    if (forceRole) {
      role = forceRole;
    } else if (email.toLowerCase().includes('admin')) {
      role = 'admin';
    } else if (email.toLowerCase().includes('driver') || email.toLowerCase().includes('ramesh') || email.toLowerCase().includes('vikram') || email.toLowerCase().includes('rajesh') || email.toLowerCase().includes('devendra')) {
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
      // Find matching driver from drivers table
      const matched = drivers.find((d) =>
        email.toLowerCase().includes(d.name.toLowerCase().split(' ')[0]) ||
        email.toLowerCase().includes(d.driver_id.toLowerCase())
      );
      if (matched) {
        setActiveDriverId(matched.driver_id);
      } else {
        setActiveDriverId('DRV-101');
      }
      setIsDriverMode(true);
      setCurrentScreen('driver-dashboard');
      const activeDrv = matched || driver;
      triggerNotification('DRIVER AUTHENTICATED', `Welcome Captain ${activeDrv.name}! Driver Portal Active.`, 'info');
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
    setCurrentUserRole('student');
    setCurrentScreen('login');
    if (typeof window !== 'undefined') {
      if (window.location.hash || window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new Event('popstate'));
      }
    }
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
        driverAssignments,
        driverNotifications,
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
        markNotificationAsRead,
        markAllNotificationsAsRead,
        createRoute,
        createRouteWithAssignment,
        updateRoute,
        cancelRoute,
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
        updateStudentLocation,
        requestStudentLocation,

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
