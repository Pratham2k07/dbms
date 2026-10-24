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
  handleStartTrip: (tripId: string) => Promise<{ success: boolean; error?: string; trip?: Trip }>;
  handleEndTrip: (tripId: string) => Promise<{ success: boolean; error?: string }>;
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
  }) => Promise<{ success: boolean; error?: string; route?: Route; trip?: Trip }>;
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
  }) => Promise<{ success: boolean; error?: string; route?: Route; trip?: Trip }>;
  updateRoute: (
    route: Route,
    stop_ids?: string[],
    newAssignedDriverId?: string,
    newAssignedShuttleId?: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  }) => Promise<{ success: boolean; error?: string; trip?: Trip }>;
  updateTrip: (trip: Trip) => Promise<{ success: boolean; error?: string; trip?: Trip }>;
  cancelTrip: (tripId: string) => Promise<void>;
  updateTripCapacity: (tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => void;
  updateTripStopArrivalStatus: (tripId: string, stopId: string, status: TripStop['arrival_status']) => void;

  updateStudentLocation: (loc: StudentLocation) => void;
  requestStudentLocation: () => Promise<void>;
  isAcquiringLocation: boolean;
  locationError: string | null;

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
  const [isAcquiringLocation, setIsAcquiringLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const updateStudentLocation = useCallback((loc: StudentLocation) => {
    setStudentLocation(loc);
  }, []);

  const requestStudentLocation = useCallback(async () => {
    setIsAcquiringLocation(true);
    setLocationError(null);
    try {
      const loc = await locationService.getCurrentLocation({ highAccuracy: true, forcePersist: true });
      setStudentLocation(loc);
      setIsAcquiringLocation(false);
    } catch (err: any) {
      console.warn('Geolocation notice:', err?.message || err);
      setLocationError(err?.message || 'Unable to obtain GPS fix from device.');
      setIsAcquiringLocation(false);
    }
  }, []);

  // Continuous live GPS tracking for student portal (listens to device movements & DevTools Sensors changes)
  useEffect(() => {
    if (currentUserRole !== 'student') return;

    const watchId = locationService.watchLocation(
      (loc) => {
        setStudentLocation(loc);
        setLocationError(null);
      },
      (err) => {
        console.warn('Student GPS telemetry watch notice:', err?.message || err);
      }
    );

    return () => {
      if (watchId !== null) {
        locationService.clearWatch(watchId);
      }
    };
  }, [currentUserRole]);

  // Hydrate last recorded location from backend database and request fresh GPS fix on mount
  useEffect(() => {
    apiService.getLatestStudentLocation()
      .then((res) => {
        if (res?.success && res.location) {
          const loc = res.location;
          setStudentLocation((prev) => {
            // Only update if fresh device GPS reading has not already overwritten it
            if (!prev.accuracy_m || prev.latitude === INITIAL_STUDENT_LOCATION.latitude) {
              const distToCampus = locationService.calculateHaversineDistance(
                Number(loc.latitude),
                Number(loc.longitude),
                26.8373,
                75.6499
              );
              return {
                student_id: loc.student_id,
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
                accuracy_m: loc.accuracy_m ? Number(loc.accuracy_m) : undefined,
                timestamp: loc.gps_timestamp || loc.recorded_at,
                location_name:
                  distToCampus < 1500
                    ? 'JKLU Campus (Last Known)'
                    : `Last Recorded Location (${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)})`,
              };
            }
            return prev;
          });
        }
      })
      .catch((err) => {
        console.warn('Backend student location check notice:', err?.message || err);
      });

    requestStudentLocation();
  }, [requestStudentLocation]);


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

    socketService.onTripCreated((data: any) => {
      if (data?.trip) {
        setTrips((prev) => {
          const exists = prev.some((t) => t.trip_id === data.trip.trip_id);
          return exists
            ? prev.map((t) => (t.trip_id === data.trip.trip_id ? { ...t, ...data.trip } : t))
            : [data.trip, ...prev];
        });
      }
    });

    socketService.onTripUpdated((data: any) => {
      if (data?.trip) {
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === data.trip.trip_id ? { ...t, ...data.trip } : t))
        );
      }
    });

    socketService.onTripCancelled((data: any) => {
      if (data?.trip_id) {
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === data.trip_id ? { ...t, running_status: 'CANCELLED' } : t))
        );
      }
    });

    socketService.onTripStarted((data: any) => {
      if (data?.trip_id) {
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === data.trip_id ? { ...t, running_status: 'RUNNING', ...(data.trip || {}) } : t))
        );
      }
    });

    socketService.onTripEnded((data: any) => {
      if (data?.trip_id) {
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === data.trip_id ? { ...t, running_status: 'COMPLETED', ...(data.trip || {}) } : t))
        );
        setShuttleLocations((prev) =>
          prev.filter((loc) => loc.trip_id !== data.trip_id && loc.shuttle_id !== data.shuttle_id)
        );
      }
    });

    socketService.onRouteCreated((data: any) => {
      if (data?.route) {
        setRoutes((prev) => {
          const exists = prev.some((r) => r.route_id === data.route.route_id);
          return exists ? prev.map((r) => (r.route_id === data.route.route_id ? data.route : r)) : [...prev, data.route];
        });
      }
    });

    socketService.onRouteUpdated((data: any) => {
      if (data?.route) {
        setRoutes((prev) =>
          prev.map((r) => (r.route_id === data.route.route_id ? { ...r, ...data.route } : r))
        );
      }
    });
  }, []);

  // ================= Hydrate Initial State from Live Supabase Database =================
  const refreshDatabaseRecords = useCallback(async () => {
    try {
      const [liveRoutes, liveShuttles, liveTrips, liveDrivers, liveStops, liveRouteStops, liveTripStops, liveLocations] = await Promise.all([
        apiService.getRoutes().catch(() => null),
        apiService.getShuttles().catch(() => null),
        apiService.getTrips().catch(() => null),
        apiService.getDrivers().catch(() => null),
        apiService.getAllStops().catch(() => null),
        apiService.getAllRouteStops().catch(() => null),
        apiService.getTripStops().catch(() => null),
        apiService.getLatestShuttleLocations().catch(() => null)
      ]);

      const normalizedStops: Stop[] | undefined =
        liveStops && Array.isArray(liveStops) && liveStops.length > 0
          ? liveStops.map((s: any) => ({
              ...s,
              latitude: Number(s.latitude),
              longitude: Number(s.longitude)
            }))
          : undefined;

      if (liveRoutes && Array.isArray(liveRoutes) && liveRoutes.length > 0) {
        const coordsMap: Record<string, [number, number][]> = {};
        const parsedRoutes = liveRoutes.map((r: any) => {
          let coords = r.route_coordinates;
          if (typeof coords === 'string') {
            try { coords = JSON.parse(coords); } catch {}
          }
          if (Array.isArray(coords) && coords.length > 0) {
            coordsMap[r.route_id] = coords;
            return { ...r, route_coordinates: coords };
          }
          return r;
        });

        // Ensure every route has pathway coordinates by connecting ordered stops if needed
        if (normalizedStops && liveRouteStops) {
          parsedRoutes.forEach((r: any) => {
            if (!coordsMap[r.route_id] || coordsMap[r.route_id].length === 0) {
              const ordered = liveRouteStops
                .filter((rs: any) => rs.route_id === r.route_id)
                .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
                .map((rs: any) => {
                  const s = normalizedStops.find((st: any) => st.stop_id === rs.stop_id);
                  return s ? [Number(s.latitude), Number(s.longitude)] as [number, number] : null;
                })
                .filter(Boolean) as [number, number][];
              if (ordered.length > 1) {
                coordsMap[r.route_id] = ordered;
                r.route_coordinates = ordered;
              }
            }
          });
        }

        setRoutes(parsedRoutes);
        if (Object.keys(coordsMap).length > 0) {
          setRouteCoordinates((prev) => ({ ...prev, ...coordsMap }));
        }
      }
      if (normalizedStops && normalizedStops.length > 0) {
        setStops(normalizedStops);
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
      if (liveTripStops && Array.isArray(liveTripStops) && liveTripStops.length > 0) {
        setTripStops(liveTripStops);
      }
      if (liveLocations && Array.isArray(liveLocations) && liveLocations.length > 0) {
        setShuttleLocations(liveLocations);
      }

      databaseService.syncFromLiveDatabase({
        routes: liveRoutes && Array.isArray(liveRoutes) ? liveRoutes : undefined,
        stops: normalizedStops,
        routeStops: liveRouteStops && Array.isArray(liveRouteStops) ? liveRouteStops : undefined,
        shuttles: liveShuttles && Array.isArray(liveShuttles) ? liveShuttles : undefined,
        trips: liveTrips && Array.isArray(liveTrips) ? liveTrips : undefined,
        drivers: liveDrivers && Array.isArray(liveDrivers) ? liveDrivers : undefined
      });
    } catch (err) {
      console.warn('Failed to refresh database records:', err);
    }
  }, []);

  // Continuous polling for real-time shuttle coordinates (vital for serverless deployments)
  useEffect(() => {
    let active = true;
    const pollTelemetry = async () => {
      try {
        const locs = await apiService.getLatestShuttleLocations();
        if (active && Array.isArray(locs) && locs.length > 0) {
          setShuttleLocations(locs);
        }
      } catch {}
    };

    const interval = setInterval(pollTelemetry, 3500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);


  // Ensure that if user is in Admin portal, the active JWT token is an admin token
  useEffect(() => {
    if (isAuthenticated && currentUserRole === 'admin') {
      const storedUser = localStorage.getItem('user');
      let roleInStorage = '';
      try {
        roleInStorage = storedUser ? JSON.parse(storedUser).role : '';
      } catch (e) {}

      if (roleInStorage !== 'admin') {
        authService.logout();
        authService.login('admin@jklu.edu.in', 'admin@jklu').catch((err) => {
          console.warn('Auto admin token sync failed:', err);
        });
      }
    }
  }, [isAuthenticated, currentUserRole]);

  useEffect(() => {
    let isMounted = true;
    refreshDatabaseRecords();
    return () => {
      isMounted = false;
    };
  }, [refreshDatabaseRecords]);


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

  // Driver & Admin operations
  const handleStartTrip = useCallback(
    async (tripId: string) => {
      try {
        const res = await apiService.startTrip(tripId);
        if (res && res.success === false) {
          const errMsg = res.error || res.message || 'Failed to start trip in database.';
          triggerNotification('START TRIP REJECTED', errMsg, 'full');
          return { success: false, error: errMsg };
        }

        databaseService.updateTripRunningStatus(tripId, 'RUNNING');
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'RUNNING', ...(res?.trip || {}) } : t))
        );

        triggerNotification(
          'JKLU SHUTTLE',
          `Trip ${tripId} has commenced. Real driver GPS telemetry is active.`,
          'info'
        );

        await refreshDatabaseRecords();
        return { success: true, trip: res?.trip };
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Database error starting trip.';
        console.error('API error in startTrip:', err);
        triggerNotification('START TRIP REJECTED', errMsg, 'full');
        return { success: false, error: errMsg };
      }
    },
    [triggerNotification, refreshDatabaseRecords]
  );

  const handleEndTrip = useCallback(
    async (tripId: string) => {
      try {
        const res = await apiService.endTrip(tripId);
        if (res && res.success === false) {
          const errMsg = res.error || res.message || 'Failed to end trip in database.';
          triggerNotification('END TRIP REJECTED', errMsg, 'full');
          return { success: false, error: errMsg };
        }

        databaseService.updateTripRunningStatus(tripId, 'COMPLETED');
        setTrips((prev) =>
          prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'COMPLETED', ...(res?.trip || {}) } : t))
        );
        // Remove shuttle from active live tracking
        setShuttleLocations((prev) => prev.filter((loc) => loc.trip_id !== tripId));

        triggerNotification(
          'JKLU SHUTTLE',
          `Trip ${tripId} completed at JK Lakshmipat University. Live tracking ended.`,
          'info'
        );

        await refreshDatabaseRecords();
        return { success: true };
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Database error ending trip.';
        console.error('API error in endTrip:', err);
        triggerNotification('END TRIP REJECTED', errMsg, 'full');
        return { success: false, error: errMsg };
      }
    },
    [triggerNotification, refreshDatabaseRecords]
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

  const createRoute = useCallback(async (routeData: {
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
    try {
      const res = await apiService.createRoute(routeData);
      const createdRoute: Route = res?.route || res;

      setRoutes((prev) => {
        const exists = prev.some((r) => r.route_id === createdRoute.route_id);
        return exists ? prev.map((r) => (r.route_id === createdRoute.route_id ? createdRoute : r)) : [...prev, createdRoute];
      });

      triggerNotification(
        'ROUTE CREATED & SAVED',
        `Route ${createdRoute.route_code} (${createdRoute.route_name}) created with ${createdRoute.total_stops} stops.`,
        'info'
      );

      await refreshDatabaseRecords();
      return { success: true, route: createdRoute };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Database error creating route';
      console.error('API error in createRoute:', err);
      triggerNotification('ROUTE CREATION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const createRouteWithAssignment = createRoute;

  const updateRoute = useCallback(async (
    updated: Route,
    stop_ids?: string[],
    newAssignedDriverId?: string,
    newAssignedShuttleId?: string
  ) => {
    try {
      await apiService.updateRoute(updated.route_id, {
        route_name: updated.route_name,
        route_code: updated.route_code,
        description: updated.description,
        color: updated.color,
        status: updated.status,
        stop_ids,
        assigned_driver_id: newAssignedDriverId,
        assigned_shuttle_id: newAssignedShuttleId
      });

      setRoutes((prev) =>
        prev.map((r) => (r.route_id === updated.route_id ? { ...r, ...updated, assigned_driver_id: newAssignedDriverId, assigned_shuttle_id: newAssignedShuttleId } : r))
      );

      triggerNotification('ROUTE UPDATED', `Route ${updated.route_code} updated successfully.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update route';
      console.error('API error in updateRoute:', err);
      triggerNotification('UPDATE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

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
  const createTrip = useCallback(async (data: {
    route_id: string;
    shuttle_id: string;
    driver_id: string;
    start_time: string;
    end_time?: string | null;
  }) => {
    try {
      const res = await apiService.createTrip(data);
      if (!res || !res.success) {
        const errMsg = res?.error || res?.message || 'Failed to schedule trip in database.';
        triggerNotification('CREATION FAILED', errMsg, 'full');
        return { success: false, error: errMsg };
      }

      const createdTrip: Trip = res.trip;
      setTrips((prev) => {
        const exists = prev.some((t) => t.trip_id === createdTrip.trip_id);
        return exists ? prev.map((t) => (t.trip_id === createdTrip.trip_id ? createdTrip : t)) : [createdTrip, ...prev];
      });

      triggerNotification(
        'TRIP SCHEDULED',
        `Trip ${createdTrip.trip_id} on ${createdTrip.route_id} scheduled for ${createdTrip.start_time}.`,
        'info'
      );

      await refreshDatabaseRecords();
      return { success: true, trip: createdTrip };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Server error creating trip.';
      console.error('API error in createTrip:', err);
      triggerNotification('CREATION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const updateTrip = useCallback(async (updatedTrip: Trip) => {
    try {
      const res = await apiService.updateTrip(updatedTrip.trip_id, updatedTrip);
      if (res && res.success === false) {
        const errMsg = res.error || res.message || 'Failed to update trip.';
        triggerNotification('UPDATE FAILED', errMsg, 'full');
        return { success: false, error: errMsg };
      }

      const tripToSave = res?.trip || updatedTrip;
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripToSave.trip_id ? tripToSave : t))
      );
      triggerNotification('TRIP UPDATED', `Trip ${tripToSave.trip_id} updated.`, 'info');
      await refreshDatabaseRecords();
      return { success: true, trip: tripToSave };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Server error updating trip.';
      console.error('API error in updateTrip:', err);
      triggerNotification('UPDATE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const cancelTrip = useCallback(async (tripId: string) => {
    try {
      await apiService.cancelTrip(tripId);
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'CANCELLED' } : t))
      );
      triggerNotification('TRIP CANCELLED', `Trip ${tripId} has been cancelled.`, 'info');
      await refreshDatabaseRecords();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to cancel trip.';
      console.error('API error in cancelTrip:', err);
      triggerNotification('CANCELLATION FAILED', errMsg, 'full');
    }
  }, [triggerNotification, refreshDatabaseRecords]);

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
    
    if (forceRole) {
      role = forceRole;
    } else if (email.toLowerCase().includes('admin')) {
      role = 'admin';
    } else if (email.toLowerCase().includes('driver') || email.toLowerCase().includes('ramesh') || email.toLowerCase().includes('vikram') || email.toLowerCase().includes('rajesh') || email.toLowerCase().includes('devendra')) {
      role = 'driver';
    } else {
      role = 'student';
    }

    try {
      let pwd = password;
      if (!pwd) {
        if (role === 'admin') pwd = 'admin@jklu';
        else if (role === 'driver') pwd = 'driver@8821';
        else pwd = 'jklu@2024';
      }
      authService.logout();
      await authService.login(email, pwd);
      socketService.connect();
      await refreshDatabaseRecords();
    } catch (e) {
      console.warn("Backend auth notice:", e);
    }

    setIsAuthenticated(true);
    setCurrentUserRole(role);

    if (role === 'admin') {
      setIsDriverMode(false);
      setCurrentScreen('admin-dashboard');
      triggerNotification('ADMIN AUTHENTICATED', 'Welcome Prof. Anurag Sharma! Admin Control Center Active.', 'info');
    } else if (role === 'driver') {
      // Find matching driver from live database drivers table
      const currentDrivers = databaseService.getState().drivers.length > 0 ? databaseService.getState().drivers : drivers;
      const matched = currentDrivers.find((d) =>
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
    authService.logout();
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
        isAcquiringLocation,
        locationError,

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
