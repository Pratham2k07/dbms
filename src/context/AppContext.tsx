import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
import { routeService } from '../services/routeService';


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
  refreshDatabaseRecords: () => Promise<void>;

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
  cancelRoute: (routeId: string) => Promise<{ success: boolean; error?: string }>;
  deleteRoute: (routeId: string) => Promise<{ success: boolean; error?: string }>;

  createStop: (stopData: Stop) => Promise<{ success: boolean; error?: string }>;
  updateStop: (stop: Stop) => Promise<{ success: boolean; error?: string }>;
  deleteStop: (stopId: string) => Promise<{ success: boolean; error?: string }>;
  assignStopToRoute: (routeId: string, stopId: string, sequenceNumber?: number) => Promise<void>;
  removeStopFromRoute: (routeId: string, stopId: string) => Promise<void>;
  reorderRouteStops: (routeId: string, stopIdsInOrder: string[]) => void;

  createShuttle: (shuttle: Shuttle) => Promise<{ success: boolean; error?: string }>;
  updateShuttle: (shuttle: Shuttle) => Promise<{ success: boolean; error?: string }>;
  setShuttleStatus: (shuttleId: string, status: Shuttle['status']) => Promise<void>;

  createDriver: (data: {
    name: string;
    phone_number: string;
    license_no: string;
    assigned_shuttle_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateDriver: (driver: Driver) => Promise<{ success: boolean; error?: string }>;
  deleteDriver: (driverId: string) => Promise<{ success: boolean; error?: string }>;

  createTrip: (data: {
    route_id: string;
    shuttle_id: string;
    driver_id: string;
    start_time: string;
    end_time?: string | null;
  }) => Promise<{ success: boolean; error?: string; trip?: Trip }>;
  updateTrip: (trip: Trip) => Promise<{ success: boolean; error?: string; trip?: Trip }>;
  cancelTrip: (tripId: string) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<{ success: boolean; error?: string }>;
  updateTripCapacity: (tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => void;
  updateTripStopArrivalStatus: (tripId: string, stopId: string, status: TripStop['arrival_status']) => Promise<void>;

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

const getStoredAuth = () => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null as any, role: 'student' as const, token: null as string | null };
  }
  try {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    if (token && userRaw) {
      const user = JSON.parse(userRaw);
      const role =
        (user.role as 'student' | 'driver' | 'admin') ||
        (localStorage.getItem('currentUserRole') as 'student' | 'driver' | 'admin') ||
        'student';
      return { isAuthenticated: true, user, role, token };
    }
  } catch (e) {
    console.warn('Error reading stored session:', e);
  }
  return { isAuthenticated: false, user: null as any, role: 'student' as const, token: null as string | null };
};

const getInitialScreen = (auth: ReturnType<typeof getStoredAuth>): ScreenType => {
  if (!auth.isAuthenticated) {
    return 'login';
  }
  if (typeof window === 'undefined') {
    return auth.role === 'admin' ? 'admin-dashboard' : auth.role === 'driver' ? 'driver-dashboard' : 'home';
  }
  const savedScreen = localStorage.getItem('currentScreen') as ScreenType;
  if (savedScreen && savedScreen !== 'login') {
    if (auth.role === 'admin') {
      if (savedScreen.startsWith('admin-')) return savedScreen;
      return 'admin-dashboard';
    }
    if (auth.role === 'driver') {
      return 'driver-dashboard';
    }
    if (['home', 'live-tracking', 'route-details', 'stop-details', 'profile'].includes(savedScreen)) {
      return savedScreen;
    }
    return 'home';
  }
  if (auth.role === 'admin') return 'admin-dashboard';
  if (auth.role === 'driver') return 'driver-dashboard';
  return 'home';
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = useMemo(() => getStoredAuth(), []);
  const initialScreen = useMemo(() => getInitialScreen(initialAuth), [initialAuth]);

  // Navigation state
  const [currentScreen, setCurrentScreenState] = useState<ScreenType>(initialScreen);
  const [activeTab, setActiveTab] = useState<TabType>(() => (initialScreen === 'live-tracking' ? 'track' : 'home'));
  const [isDriverMode, setIsDriverMode] = useState<boolean>(
    initialAuth.isAuthenticated && initialAuth.role === 'driver'
  );

  const setCurrentScreen = useCallback((screen: ScreenType) => {
    setCurrentScreenState(screen);
    if (typeof window !== 'undefined') {
      if (screen === 'login') {
        localStorage.removeItem('currentScreen');
      } else {
        localStorage.setItem('currentScreen', screen);
      }
    }
  }, []);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'driver' | 'admin'>(initialAuth.role);
  const [activeDriverId, setActiveDriverId] = useState<string>(() => {
    if (initialAuth.role === 'driver' && initialAuth.user?.user_id) {
      return initialAuth.user.user_id;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeDriverId');
      if (saved) return saved;
    }
    return 'USR-002';
  });

  // Selected entities
  const [selectedStopId, setSelectedStopId] = useState<string>('STOP-JKLU');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('R-01');

  // Core entities state
  const [student, setStudent] = useState<Student>(() => {
    if (initialAuth.user && initialAuth.role === 'student') {
      return {
        ...CURRENT_STUDENT,
        student_id: initialAuth.user.user_id || CURRENT_STUDENT.student_id,
        name: initialAuth.user.name || CURRENT_STUDENT.name,
        email: initialAuth.user.email || CURRENT_STUDENT.email,
        roll_no: initialAuth.user.roll_no || CURRENT_STUDENT.roll_no,
        phone_number: initialAuth.user.phone_number || CURRENT_STUDENT.phone_number,
      };
    }
    return CURRENT_STUDENT;
  });

  const [admin, setAdmin] = useState<Admin>(() => {
    if (initialAuth.user && initialAuth.role === 'admin') {
      return {
        ...CURRENT_ADMIN,
        admin_id: initialAuth.user.user_id || CURRENT_ADMIN.admin_id,
        name: initialAuth.user.name || CURRENT_ADMIN.name,
        email: initialAuth.user.email || CURRENT_ADMIN.email,
        designation: initialAuth.user.designation || CURRENT_ADMIN.designation,
        department: initialAuth.user.department || CURRENT_ADMIN.department,
      };
    }
    return CURRENT_ADMIN;
  });
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
  const driver: Driver = useMemo(() => {
    const match = drivers.find((d) => d.driver_id === activeDriverId);
    if (match) return match;
    return {
      driver_id: activeDriverId,
      user_id: activeDriverId,
      license_no: initialAuth.user?.license_no || 'RJ14-2018-08912',
      name: (initialAuth.role === 'driver' && initialAuth.user?.name) || 'Ramesh Kumar',
      phone_number: (initialAuth.role === 'driver' && initialAuth.user?.phone_number) || '+91 98290 88210',
      assigned_shuttle_id: 'SHT-01',
    };
  }, [drivers, activeDriverId, initialAuth]);

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
      if (freshState.shuttleLocations && freshState.shuttleLocations.length > 0) {
        setShuttleLocations(freshState.shuttleLocations);
      }
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

      databaseService.updateShuttleLocation({
        shuttle_id: targetId,
        trip_id: targetTripId || '',
        latitude: Number(data.latitude || data.lat),
        longitude: Number(data.longitude || data.lng),
        bearing: Number(data.bearing || 0),
        speed_kmh: Number(data.speed_kmh || 0),
        progress_percentage: Number(data.progress_percentage || 0),
        timestamp: data.timestamp || new Date().toISOString()
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

      if (data.upcoming_stops && Array.isArray(data.upcoming_stops) && data.trip_id) {
        setEtaMap((prev) => {
          const next = { ...prev };
          for (const st of data.upcoming_stops) {
            if (st.stop_id && st.theoretical_eta_minutes !== undefined) {
              next[`${data.trip_id}_${st.stop_id}`] = st.theoretical_eta_minutes;
            }
          }
          return next;
        });
      }

      // Update stop arrival & completion statuses dynamically from live telemetry
      if (data.trip_id && data.stops_status && typeof data.stops_status === "object") {
        setTripStops((prev) =>
          prev.map((ts) => {
            if (ts.trip_id === data.trip_id && data.stops_status[ts.stop_id]) {
              return { ...ts, arrival_status: data.stops_status[ts.stop_id] };
            }
            return ts;
          })
        );
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

    socketService.onTripDeleted((data: any) => {
      if (data?.trip_id) {
        setTrips((prev) => prev.filter((t) => t.trip_id !== data.trip_id));
        setTripStops((prev) => prev.filter((ts) => ts.trip_id !== data.trip_id));
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

    socketService.onRouteDeleted((data: any) => {
      if (data?.route_id) {
        setRoutes((prev) => prev.filter((r) => r.route_id !== data.route_id));
      }
    });

    socketService.onStopCreated((data: any) => {
      if (data?.stop) {
        setStops((prev) => {
          const exists = prev.some((s) => s.stop_id === data.stop.stop_id);
          return exists ? prev.map((s) => (s.stop_id === data.stop.stop_id ? data.stop : s)) : [...prev, data.stop];
        });
      }
    });

    socketService.onStopUpdated((data: any) => {
      if (data?.stop) {
        setStops((prev) => prev.map((s) => (s.stop_id === data.stop.stop_id ? { ...s, ...data.stop } : s)));
      }
    });

    socketService.onStopDeleted((data: any) => {
      if (data?.stop_id) {
        setStops((prev) => prev.filter((s) => s.stop_id !== data.stop_id));
      }
    });

    socketService.onShuttleCreated((data: any) => {
      if (data?.shuttle) {
        setShuttles((prev) => {
          const exists = prev.some((s) => s.shuttle_id === data.shuttle.shuttle_id);
          return exists ? prev.map((s) => (s.shuttle_id === data.shuttle.shuttle_id ? data.shuttle : s)) : [...prev, data.shuttle];
        });
      }
    });

    socketService.onShuttleUpdated((data: any) => {
      if (data?.shuttle) {
        setShuttles((prev) => prev.map((s) => (s.shuttle_id === data.shuttle.shuttle_id ? { ...s, ...data.shuttle } : s)));
      }
    });

    socketService.onShuttleStatusChanged((data: any) => {
      if (data?.shuttle_id && data?.status) {
        setShuttles((prev) => prev.map((s) => (s.shuttle_id === data.shuttle_id ? { ...s, status: data.status } : s)));
      }
    });

    socketService.onDriverAssigned(() => {
      refreshDatabaseRecords();
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

        // Ensure every route has pathway coordinates by connecting ordered stops if needed and trimmed at terminus
        if (normalizedStops && liveRouteStops) {
          parsedRoutes.forEach((r: any) => {
            const currentRouteStops = liveRouteStops
              .filter((rs: any) => rs.route_id === r.route_id)
              .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
              .map((rs: any) => normalizedStops.find((st: any) => st.stop_id === rs.stop_id))
              .filter(Boolean);

            const dynCoords = routeService.getDynamicRouteCoordinates(r, currentRouteStops, coordsMap);
            if (dynCoords && dynCoords.length > 0) {
              coordsMap[r.route_id] = dynCoords;
              r.route_coordinates = dynCoords;
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
      if (liveTrips && Array.isArray(liveTrips)) {
        setTrips(liveTrips);
      }
      if (liveDrivers && Array.isArray(liveDrivers) && liveDrivers.length > 0) {
        setDrivers(liveDrivers);
      }
      if (liveTripStops && Array.isArray(liveTripStops)) {
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
        drivers: liveDrivers && Array.isArray(liveDrivers) ? liveDrivers : undefined,
        shuttleLocations: liveLocations && Array.isArray(liveLocations) ? liveLocations : undefined
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
          databaseService.syncFromLiveDatabase({ shuttleLocations: locs });
        }
      } catch {}
    };

    const interval = setInterval(pollTelemetry, 3500);

    // Periodic background DB sync (every 4s) so changes in MySQL Workbench or terminal sync to UI
    const syncInterval = setInterval(() => {
      refreshDatabaseRecords();
    }, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);


  // Ensure role consistency for admin sessions
  useEffect(() => {
    if (isAuthenticated && currentUserRole === 'admin') {
      const storedUser = localStorage.getItem('user');
      let roleInStorage = '';
      try {
        roleInStorage = storedUser ? JSON.parse(storedUser).role : '';
      } catch (e) {}

      if (roleInStorage && roleInStorage !== 'admin') {
        logoutUser();
      }
    }
  }, [isAuthenticated, currentUserRole]);

  // Validate active session on initial load
  useEffect(() => {
    if (initialAuth.isAuthenticated) {
      authService.getMe().then((res) => {
        if (!res || !res.success) {
          console.warn('Stored JWT session is no longer valid. Signing out.');
          logoutUser();
        } else if (res.user) {
          try {
            localStorage.setItem('user', JSON.stringify(res.user));
          } catch {}
          if (res.user.role === 'student') {
            setStudent((prev) => ({
              ...prev,
              student_id: res.user.user_id || prev.student_id,
              name: res.user.name || prev.name,
              email: res.user.email || prev.email,
              phone_number: res.user.phone_number || prev.phone_number,
            }));
          } else if (res.user.role === 'admin') {
            setAdmin((prev) => ({
              ...prev,
              admin_id: res.user.user_id || prev.admin_id,
              name: res.user.name || prev.name,
              email: res.user.email || prev.email,
            }));
          }
        }
      }).catch(() => {
        // Network offline, retain cached session
      });
    }
  }, []);

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

  const cancelRoute = useCallback(async (routeId: string) => {
    try {
      await apiService.cancelRoute(routeId);
      databaseService.cancelRoute(routeId);
      setRoutes((prev) => prev.map((r) => (r.route_id === routeId ? { ...r, status: 'INACTIVE' } : r)));
      triggerNotification('ROUTE CANCELLED', `Route ${routeId} cancelled by admin dispatch.`, 'full');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to cancel route in database';
      triggerNotification('CANCEL FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const deleteRoute = useCallback(async (routeId: string) => {
    try {
      await apiService.deleteRoute(routeId);
      databaseService.deleteRoute(routeId);
      setRoutes((prev) => prev.filter((r) => r.route_id !== routeId));
      triggerNotification('ROUTE DELETED', `Route ${routeId} has been removed.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete route in database';
      triggerNotification('DELETE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  // ================= ADMIN STOP CRUD =================
  const createStop = useCallback(async (stopData: Stop) => {
    try {
      await apiService.createStop(stopData);
      databaseService.createStop(stopData);
      setStops((prev) => {
        const exists = prev.some((s) => s.stop_id === stopData.stop_id);
        return exists ? prev.map((s) => (s.stop_id === stopData.stop_id ? stopData : s)) : [...prev, stopData];
      });
      triggerNotification('STOP CREATED', `Stop '${stopData.stop_name}' added.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create stop in database';
      triggerNotification('STOP CREATION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const updateStop = useCallback(async (stopData: Stop) => {
    try {
      await apiService.updateStop(stopData.stop_id, stopData);
      databaseService.updateStop(stopData);
      setStops((prev) => prev.map((s) => (s.stop_id === stopData.stop_id ? stopData : s)));
      triggerNotification('STOP UPDATED', `Stop '${stopData.stop_name}' updated.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update stop in database';
      triggerNotification('STOP UPDATE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const deleteStop = useCallback(async (stopId: string) => {
    try {
      await apiService.deleteStop(stopId);
      databaseService.deleteStop(stopId);
      setStops((prev) => prev.filter((s) => s.stop_id !== stopId));
      triggerNotification('STOP DELETED', `Stop ${stopId} has been removed.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete stop in database';
      triggerNotification('STOP DELETE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const assignStopToRoute = useCallback(async (routeId: string, stopId: string, sequenceNumber?: number) => {
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
      try {
        await apiService.updateRoute(routeId, { stop_ids: updatedIds });
      } catch (err) {
        console.warn('Backend updateRoute failed in assignStopToRoute:', err);
      }
      triggerNotification('STOP ASSIGNED', `Stop added to Route ${routeId}.`, 'info');
      await refreshDatabaseRecords();
    }
  }, [routeStops, routes, triggerNotification, refreshDatabaseRecords]);

  const removeStopFromRoute = useCallback(async (routeId: string, stopId: string) => {
    const existingStops = routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((rs) => rs.stop_id);
    const remaining = existingStops.filter((id) => id !== stopId);
    const targetRoute = routes.find((r) => r.route_id === routeId);
    if (targetRoute) {
      databaseService.updateRoute(targetRoute, remaining);
      try {
        await apiService.updateRoute(routeId, { stop_ids: remaining });
      } catch (err) {
        console.warn('Backend updateRoute failed in removeStopFromRoute:', err);
      }
      triggerNotification('STOP REMOVED', `Stop removed from Route ${routeId}.`, 'info');
      await refreshDatabaseRecords();
    }
  }, [routeStops, routes, triggerNotification, refreshDatabaseRecords]);

  const reorderRouteStops = useCallback((routeId: string, stopIdsInOrder: string[]) => {
    const targetRoute = routes.find((r) => r.route_id === routeId);
    if (targetRoute) {
      databaseService.updateRoute(targetRoute, stopIdsInOrder);
    }
  }, [routes]);

  // ================= ADMIN SHUTTLE CRUD =================
  const createShuttle = useCallback(async (shuttleData: Shuttle) => {
    try {
      await apiService.createShuttle(shuttleData);
      databaseService.createShuttle(shuttleData);
      setShuttles((prev) => {
        const exists = prev.some((s) => s.shuttle_id === shuttleData.shuttle_id);
        return exists ? prev.map((s) => (s.shuttle_id === shuttleData.shuttle_id ? shuttleData : s)) : [...prev, shuttleData];
      });
      triggerNotification('SHUTTLE ADDED', `${shuttleData.shuttle_number} added to fleet.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create shuttle in database';
      triggerNotification('SHUTTLE CREATION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const updateShuttle = useCallback(async (shuttleData: Shuttle) => {
    try {
      await apiService.updateShuttle(shuttleData.shuttle_id, shuttleData);
      databaseService.updateShuttle(shuttleData);
      setShuttles((prev) => prev.map((s) => (s.shuttle_id === shuttleData.shuttle_id ? shuttleData : s)));
      triggerNotification('SHUTTLE UPDATED', `${shuttleData.shuttle_number} details updated.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update shuttle in database';
      triggerNotification('SHUTTLE UPDATE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const setShuttleStatus = useCallback(async (shuttleId: string, status: Shuttle['status']) => {
    try {
      await apiService.updateShuttleStatus(shuttleId, status);
      databaseService.setShuttleStatus(shuttleId, status);
      setShuttles((prev) => prev.map((s) => (s.shuttle_id === shuttleId ? { ...s, status } : s)));
      triggerNotification('FLEET STATUS UPDATED', `Shuttle ${shuttleId} status changed to ${status}.`, 'info');
      await refreshDatabaseRecords();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update shuttle status';
      triggerNotification('STATUS UPDATE FAILED', errMsg, 'full');
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  // ================= ADMIN DRIVER CRUD =================
  const createDriver = useCallback(async (data: {
    name: string;
    phone_number: string;
    license_no: string;
    assigned_shuttle_id?: string;
  }) => {
    try {
      await apiService.createDriver(data);
      databaseService.createDriver(data);
      triggerNotification('DRIVER ADDED', `Captain ${data.name} enrolled into transport system.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create driver in database';
      triggerNotification('DRIVER CREATION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const updateDriver = useCallback(async (driverData: Driver) => {
    try {
      await apiService.updateDriver(driverData.driver_id, driverData);
      databaseService.updateDriver(driverData);
      setDrivers((prev) => prev.map((d) => (d.driver_id === driverData.driver_id ? driverData : d)));
      triggerNotification('DRIVER UPDATED', `Captain ${driverData.name} record updated.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update driver in database';
      triggerNotification('DRIVER UPDATE FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const deleteDriver = useCallback(async (driverId: string) => {
    try {
      await apiService.deleteDriver(driverId);
      databaseService.deleteDriver(driverId);
      setDrivers((prev) => prev.filter((d) => d.driver_id !== driverId));
      triggerNotification('DRIVER REMOVED', `Driver ${driverId} deactivated.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete driver in database';
      triggerNotification('DRIVER DELETION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

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

  
  const deleteTrip = useCallback(async (tripId: string) => {
    try {
      await apiService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.trip_id !== tripId));
      setTripStops((prev) => prev.filter((ts) => ts.trip_id !== tripId));
      triggerNotification('TRIP DELETED', `Trip ${tripId} removed from database.`, 'info');
      await refreshDatabaseRecords();
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete trip.';
      console.error('API error in deleteTrip:', err);
      triggerNotification('DELETION FAILED', errMsg, 'full');
      return { success: false, error: errMsg };
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const cancelTrip = useCallback(async (tripId: string) => {
    try {
      await apiService.cancelTrip(tripId);
      databaseService.cancelTrip(tripId);
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? { ...t, running_status: 'CANCELLED' } : t))
      );
      triggerNotification('TRIP CANCELLED', `Trip ${tripId} has been cancelled.`, 'info');
      await refreshDatabaseRecords();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to cancel trip.';
      console.error('API error in cancelTrip:', err);
      triggerNotification('CANCELLATION FAILED', errMsg, 'full');
    }
  }, [triggerNotification, refreshDatabaseRecords]);

  const updateTripCapacity = useCallback((tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => {
    databaseService.updateTripCapacity(tripId, capacity);
    apiService.updateTripCapacity(tripId, capacity).catch(err => console.warn('API error in updateTripCapacity:', err));
  }, []);

  const updateTripStopArrivalStatus = useCallback(
    async (tripId: string, stopId: string, status: TripStop['arrival_status']) => {
      setTripStops((prev) => tripService.updateTripStopStatus(prev, tripId, stopId, status));
      try {
        await apiService.updateTripStopStatus(tripId, stopId, status);
      } catch (err) {
        console.warn('API error in updateTripStopStatus:', err);
      }
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
    let role: 'student' | 'driver' | 'admin' = forceRole || 'student';

    // University standard demo credentials fallback if not provided
    let pwd = password;
    if (!pwd) {
      if (email.toLowerCase().includes('admin')) {
        role = 'admin';
        pwd = 'admin@jklu';
      } else if (
        email.toLowerCase().includes('driver') ||
        email.toLowerCase().includes('ramesh') ||
        email.toLowerCase().includes('vikram') ||
        email.toLowerCase().includes('rajesh') ||
        email.toLowerCase().includes('devendra')
      ) {
        role = 'driver';
        pwd = 'driver@8821';
      } else {
        role = 'student';
        pwd = 'jklu@2024';
      }
    }

    try {
      authService.logout();
      const loginRes = await authService.login(email, pwd);

      if (loginRes?.user?.role) {
        role = loginRes.user.role as 'student' | 'driver' | 'admin';
      }

      socketService.connect();
      await refreshDatabaseRecords();

      setIsAuthenticated(true);
      setCurrentUserRole(role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUserRole', role);
      }

      if (role === 'admin') {
        setIsDriverMode(false);
        setCurrentScreen('admin-dashboard');
        if (loginRes?.user) {
          setAdmin((prev) => ({
            ...prev,
            admin_id: loginRes.user.user_id || prev.admin_id,
            name: loginRes.user.name || prev.name,
            email: loginRes.user.email || prev.email,
            designation: loginRes.user.designation || prev.designation,
            department: loginRes.user.department || prev.department,
          }));
        }
        triggerNotification('ADMIN AUTHENTICATED', `Welcome ${loginRes?.user?.name || 'Administrator'}! Admin Control Center Active.`, 'info');
      } else if (role === 'driver') {
        const assignedDriverId = loginRes?.user?.user_id || 'USR-002';
        setActiveDriverId(assignedDriverId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeDriverId', assignedDriverId);
        }
        setIsDriverMode(true);
        setCurrentScreen('driver-dashboard');
        triggerNotification('DRIVER AUTHENTICATED', `Welcome Captain ${loginRes?.user?.name || 'Driver'}! Driver Portal Active.`, 'info');
      } else {
        setIsDriverMode(false);
        setCurrentScreen('home');
        if (loginRes?.user) {
          setStudent((prev) => ({
            ...prev,
            student_id: loginRes.user.user_id || prev.student_id,
            name: loginRes.user.name || prev.name,
            email: loginRes.user.email || prev.email,
            roll_no: loginRes.user.roll_no || prev.roll_no,
            phone_number: loginRes.user.phone_number || prev.phone_number,
          }));
        }
        triggerNotification('STUDENT AUTHENTICATED', `Welcome ${loginRes?.user?.name || 'Student'}! Student Portal Active.`, 'info');
      }
      return true;
    } catch (e: any) {
      console.warn('Backend auth failed:', e);
      const errMsg = e?.response?.data?.message || e?.message || 'Login failed. Invalid credentials.';
      triggerNotification('AUTHENTICATION FAILED', errMsg, 'full');
      setIsAuthenticated(false);
      return false;
    }
  };

  const logoutUser = () => {
    authService.logout();
    setIsAuthenticated(false);
    setIsDriverMode(false);
    setCurrentUserRole('student');
    setCurrentScreen('login');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('currentScreen');
      localStorage.removeItem('activeDriverId');
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
        refreshDatabaseRecords,
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
        deleteTrip,
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
