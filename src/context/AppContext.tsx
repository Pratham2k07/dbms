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
} from '../data/mockDatabase';
import { shuttleService } from '../services/shuttleService';
import { tripService } from '../services/tripService';
import { databaseService } from '../services/databaseService';

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
  const [selectedStopId, setSelectedStopId] = useState<string>('STOP-MANSAROVAR');
  const [selectedTripId, setSelectedTripId] = useState<string>('TRIP-101');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-02');

  // Core entities state
  const [student] = useState<Student>(CURRENT_STUDENT);
  const [admin] = useState<Admin>(CURRENT_ADMIN);
  const [studentLocation] = useState<StudentLocation>(INITIAL_STUDENT_LOCATION);

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

  // Dynamic live ETAs (minutes remaining)
  const [etaMap, setEtaMap] = useState<Record<string, number>>({
    'TRIP-101_STOP-MANSAROVAR': 5,
    'TRIP-101_STOP-DCM': 18,
    'TRIP-102_STOP-AIRPORT': 7,
    'TRIP-103_STOP-VAISHALI': 4,
    'TRIP-101_STOP-JKLU': 28,
    'TRIP-102_STOP-JKLU': 32
  });

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
      databaseService.updateTripRunningStatus(tripId, 'RUNNING');
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
      databaseService.updateTripRunningStatus(tripId, 'COMPLETED');
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
      const trip = trips.find((t) => t.trip_id === tripId);
      if (!trip) return;
      const nextStatus: 'AVAILABLE' | 'FULL' = trip.capacity_status === 'AVAILABLE' ? 'FULL' : 'AVAILABLE';
      databaseService.updateTripCapacity(tripId, nextStatus);
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

  // ================= ADMIN ROUTE CRUD =================
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
      triggerNotification('ROUTE DELETED', `Route ${routeId} has been removed.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  // ================= ADMIN STOP CRUD =================
  const createStop = useCallback((stopData: Stop) => {
    const res = databaseService.createStop(stopData);
    if (res.success) {
      triggerNotification('STOP CREATED', `Stop '${stopData.stop_name}' added.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const updateStop = useCallback((stopData: Stop) => {
    const res = databaseService.updateStop(stopData);
    if (res.success) {
      triggerNotification('STOP UPDATED', `Stop '${stopData.stop_name}' updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const deleteStop = useCallback((stopId: string) => {
    const res = databaseService.deleteStop(stopId);
    if (res.success) {
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
      triggerNotification('SHUTTLE ADDED', `${shuttleData.shuttle_number} added to fleet.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const updateShuttle = useCallback((shuttleData: Shuttle) => {
    const res = databaseService.updateShuttle(shuttleData);
    if (res.success) {
      triggerNotification('SHUTTLE UPDATED', `${shuttleData.shuttle_number} details updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const setShuttleStatus = useCallback((shuttleId: string, status: Shuttle['status']) => {
    databaseService.setShuttleStatus(shuttleId, status);
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
      triggerNotification('DRIVER ADDED', `Captain ${data.name} enrolled into transport system.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const updateDriver = useCallback((driverData: Driver) => {
    const res = databaseService.updateDriver(driverData);
    if (res.success) {
      triggerNotification('DRIVER UPDATED', `Captain ${driverData.name} record updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const deleteDriver = useCallback((driverId: string) => {
    const res = databaseService.deleteDriver(driverId);
    if (res.success) {
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
      triggerNotification('TRIP UPDATED', `Trip ${updatedTrip.trip_id} updated.`, 'info');
    }
    return res;
  }, [triggerNotification]);

  const cancelTrip = useCallback((tripId: string) => {
    databaseService.cancelTrip(tripId);
    triggerNotification('TRIP CANCELLED', `Trip ${tripId} has been cancelled.`, 'info');
  }, [triggerNotification]);

  const updateTripCapacity = useCallback((tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') => {
    databaseService.updateTripCapacity(tripId, capacity);
  }, []);

  const updateTripStopArrivalStatus = useCallback(
    (tripId: string, stopId: string, status: TripStop['arrival_status']) => {
      setTripStops((prev) => tripService.updateTripStopStatus(prev, tripId, stopId, status));
    },
    []
  );

  const resetSimulation = useCallback(() => {
    databaseService.resetToDefaultState();
    setEtaMap({
      'TRIP-101_STOP-MANSAROVAR': 5,
      'TRIP-101_STOP-DCM': 18,
      'TRIP-102_STOP-AIRPORT': 7,
      'TRIP-103_STOP-VAISHALI': 4,
      'TRIP-101_STOP-JKLU': 28,
      'TRIP-102_STOP-JKLU': 32
    });
    triggerNotification('SYSTEM RESET', 'Database and simulation restored to default state.', 'info');
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
