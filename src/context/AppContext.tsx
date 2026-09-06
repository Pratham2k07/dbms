import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Student,
  Driver,
  Route,
  Stop,
  Shuttle,
  Trip,
  TripStop,
  StudentLocation,
  ShuttleLocation
} from '../types/database';
import { ScreenType, TabType, AppNotification } from '../types/ui';
import {
  CURRENT_STUDENT,
  INITIAL_STUDENT_LOCATION,
  MOCK_DRIVERS,
  MOCK_ROUTES,
  MOCK_STOPS,
  MOCK_SHUTTLES,
  INITIAL_TRIPS,
  INITIAL_TRIP_STOPS,
  INITIAL_SHUTTLE_LOCATIONS
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
  currentUserRole: 'student' | 'driver';
  loginUser: (email: string, password?: string, forceRole?: 'student' | 'driver') => boolean;
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
  studentLocation: StudentLocation;
  routes: Route[];
  stops: Stop[];
  shuttles: Shuttle[];
  trips: Trip[];
  tripStops: TripStop[];
  shuttleLocations: ShuttleLocation[];
  notifications: AppNotification[];
  etaMap: Record<string, number>;

  // Simulation Controls
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  resetSimulation: () => void;

  // Operations
  handleStartTrip: (tripId: string) => void;
  handleEndTrip: (tripId: string) => void;
  handleToggleCapacity: (tripId: string) => void;
  dismissNotification: (id: string) => void;
  triggerNotification: (title: string, message: string, type: AppNotification['type']) => void;
  navigateToStopDetails: (stopId: string) => void;
  navigateToLiveTracking: (tripId: string) => void;
  navigateToRouteDetails: (routeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDriverMode, setIsDriverMode] = useState<boolean>(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'driver'>('student');

  // Selected entities
  const [selectedStopId, setSelectedStopId] = useState<string>('STOP-MANSAROVAR');
  const [selectedTripId, setSelectedTripId] = useState<string>('TRIP-101');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-02');

  // Core entities state
  const [student] = useState<Student>(CURRENT_STUDENT);
  const [driver] = useState<Driver>(MOCK_DRIVERS[0]); // Ramesh Kumar
  const [studentLocation] = useState<StudentLocation>(INITIAL_STUDENT_LOCATION);
  const [routes] = useState<Route[]>(MOCK_ROUTES);
  const [stops] = useState<Stop[]>(MOCK_STOPS);
  const [shuttles] = useState<Shuttle[]>(MOCK_SHUTTLES);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [tripStops, setTripStops] = useState<TripStop[]>(INITIAL_TRIP_STOPS);
  const [shuttleLocations, setShuttleLocations] = useState<ShuttleLocation[]>(INITIAL_SHUTTLE_LOCATIONS);

  // Dynamic live ETAs (minutes remaining)
  const [etaMap, setEtaMap] = useState<Record<string, number>>({
    'TRIP-101_STOP-MANSAROVAR': 5,
    'TRIP-101_STOP-DCM': 18,
    'TRIP-102_STOP-AIRPORT': 7,
    'TRIP-103_STOP-VAISHALI': 4,
    'TRIP-101_STOP-JKLU': 28,
    'TRIP-102_STOP-JKLU': 32
  });

  // Notification queue (empty by default, populated dynamically on transit events or alerts)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Simulation settings
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Add Notification helper
  const triggerNotification = useCallback(
    (title: string, message: string, type: AppNotification['type']) => {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
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
    setActiveTab('stops');
  }, []);

  const navigateToLiveTracking = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
    const trip = trips.find((t) => t.trip_id === tripId);
    if (trip) {
      setSelectedRouteId(trip.route_id);
    }
    setCurrentScreen('live-tracking');
    setActiveTab('track');
  }, [trips]);

  const navigateToRouteDetails = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    setCurrentScreen('route-details');
  }, []);

  // Driver operations
  const handleStartTrip = useCallback(
    (tripId: string) => {
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? tripService.startTrip(t) : t))
      );
      triggerNotification(
        'JKLU SHUTTLE',
        'Trip T-102 has commenced. Live GPS telemetry is active.',
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
        'Trip T-102 completed at JK Lakshmipat University.',
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
            const nextStatus = t.capacity_status === 'AVAILABLE' ? 'FULL' : 'AVAILABLE';
            if (nextStatus === 'FULL') {
              triggerNotification(
                'JKLU SHUTTLE',
                `Shuttle 01 has reached capacity and is currently FULL.`,
                'full'
              );
            } else {
              triggerNotification(
                'JKLU SHUTTLE',
                `Shuttle 01 capacity updated: Seats now AVAILABLE.`,
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

  const resetSimulation = useCallback(() => {
    setTrips(INITIAL_TRIPS);
    setTripStops(INITIAL_TRIP_STOPS);
    setShuttleLocations(INITIAL_SHUTTLE_LOCATIONS);
    setEtaMap({
      'TRIP-101_STOP-MANSAROVAR': 5,
      'TRIP-101_STOP-DCM': 18,
      'TRIP-102_STOP-AIRPORT': 7,
      'TRIP-103_STOP-VAISHALI': 4,
      'TRIP-101_STOP-JKLU': 28,
      'TRIP-102_STOP-JKLU': 32
    });
  }, []);

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
            0.9 * simSpeed
          );
        })
      );

      // 2. Decrement ETAs periodically (every ~8 ticks) to showcase real-time countdown
      if (tickCounter % 8 === 0) {
        setEtaMap((prev) => {
          const updated: Record<string, number> = {};
          for (const key of Object.keys(prev)) {
            const current = prev[key];
            if (current > 1) {
              updated[key] = current - 1;
            } else {
              // Loop back for continuous demonstration
              updated[key] = key.includes('TRIP-101') ? 5 : 12;
            }
          }
          return updated;
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, trips]);

  const loginUser = (email: string, _password?: string, forceRole?: 'student' | 'driver'): boolean => {
    let role: 'student' | 'driver' = 'student';
    if (forceRole) {
      role = forceRole;
    } else if (email.toLowerCase().includes('driver') || email.toLowerCase().includes('ramesh')) {
      role = 'driver';
    } else {
      role = 'student';
    }

    setIsAuthenticated(true);
    setCurrentUserRole(role);

    if (role === 'driver') {
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
        studentLocation,
        routes,
        stops,
        shuttles,
        trips,
        tripStops,
        shuttleLocations,
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
