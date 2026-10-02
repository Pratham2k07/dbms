import {
  Route,
  Stop,
  RouteStop,
  Shuttle,
  Driver,
  Trip,
  TripStop,
  ShuttleLocation,
  DriverAssignment,
  DriverNotification
} from '../types/database';
import {
  MOCK_ROUTES,
  MOCK_STOPS,
  MOCK_ROUTE_STOPS,
  MOCK_SHUTTLES,
  MOCK_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_TRIP_STOPS,
  INITIAL_SHUTTLE_LOCATIONS,
  ROUTE_PATH_COORDINATES
} from '../data/mockDatabase';

const STORAGE_KEY = 'JKLU_SHUTTLE_DATABASE_V2';
const CHANNEL_NAME = 'JKLU_SHUTTLE_REALTIME_SYNC';

export interface DatabaseState {
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
  version: number;
}

export type RealtimeAction =
  | 'ROUTE_CREATED'
  | 'ROUTE_UPDATED'
  | 'ROUTE_CANCELLED'
  | 'ROUTE_DELETED'
  | 'TRIP_CREATED'
  | 'TRIP_UPDATED'
  | 'TRIP_CANCELLED'
  | 'TRIP_STATUS_CHANGED'
  | 'CAPACITY_CHANGED'
  | 'DRIVER_ASSIGNED'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'DATABASE_RESET';

export interface RealtimeEvent {
  eventId: string;
  action: RealtimeAction;
  table: string;
  payload?: any;
  timestamp: string;
  sourceTabId: string;
}

type Subscriber = (event: RealtimeEvent, state: DatabaseState) => void;

class CentralDatabaseService {
  private state: DatabaseState;
  private subscribers: Set<Subscriber> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private tabId: string;
  private lastProcessedEventIds: Set<string> = new Set();

  constructor() {
    this.tabId = `tab-${Math.random().toString(36).substring(2, 9)}`;
    this.state = this.loadInitialState();

    // Setup cross-window Real-time BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (messageEvent) => {
          const event: RealtimeEvent = messageEvent.data;
          this.handleIncomingRealtimeEvent(event);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }

    // Fallback: listen to window 'storage' events for cross-tab sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (storageEvent) => {
        if (storageEvent.key === STORAGE_KEY && storageEvent.newValue) {
          try {
            const parsed = JSON.parse(storageEvent.newValue);
            this.state = parsed;
            const fallbackEvent: RealtimeEvent = {
              eventId: `storage-${Date.now()}`,
              action: 'DATABASE_RESET',
              table: 'All',
              timestamp: new Date().toISOString(),
              sourceTabId: 'external'
            };
            this.notifySubscribers(fallbackEvent);
          } catch (e) {
            console.error('Storage sync parse error:', e);
          }
        }
      });
    }
  }

  private loadInitialState(): DatabaseState {
    if (typeof window === 'undefined') {
      return this.generateDefaultSeedState();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.routes) && Array.isArray(parsed.driverNotifications)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored database state, initializing seed data:', e);
    }

    const defaultState = this.generateDefaultSeedState();
    this.saveStateToStorage(defaultState);
    return defaultState;
  }

  private generateDefaultSeedState(): DatabaseState {
    // Initial seeded driver assignments
    const initialAssignments: DriverAssignment[] = [
      {
        assignment_id: 'ASG-01',
        driver_id: 'DRV-101', // Ramesh Kumar
        route_id: 'ROUTE-01',
        trip_id: 'TRIP-101',
        shuttle_id: 'SHT-01',
        assigned_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'ACTIVE',
        notes: 'Regular Morning Service via Malviya Nagar & Jaipur Airport'
      },
      {
        assignment_id: 'ASG-02',
        driver_id: 'DRV-102', // Vikram Singh
        route_id: 'ROUTE-02',
        trip_id: 'TRIP-102',
        shuttle_id: 'SHT-02',
        assigned_at: new Date(Date.now() - 7200000).toISOString(),
        status: 'ACTIVE',
        notes: 'Campus Express via Mansarovar Metro & DCM'
      },
      {
        assignment_id: 'ASG-03',
        driver_id: 'DRV-103', // Rajesh Meena
        route_id: 'ROUTE-03',
        trip_id: 'TRIP-103',
        shuttle_id: 'SHT-03',
        assigned_at: new Date(Date.now() - 10800000).toISOString(),
        status: 'ACTIVE',
        notes: 'City Circuit via Railway Station & Vaishali Nagar'
      }
    ];

    // Initial driver notifications stored in database so drivers see past assignments
    const initialNotifications: DriverNotification[] = [
      {
        notification_id: 'NOTIF-01',
        recipient_driver_id: 'DRV-101',
        title: 'Assigned: Route 01 (Campus ↔ Malviya Nagar)',
        message: 'You are assigned to Route 01 with Shuttle 01 (RJ 14 PA 8842). Scheduled departure: 09:30 AM.',
        type: 'ASSIGNMENT_NEW',
        related_route_id: 'ROUTE-01',
        related_trip_id: 'TRIP-101',
        related_shuttle_id: 'SHT-01',
        route_name: 'Malviya Nagar & Airport Corridor',
        stops_preview: ['JKLU Campus (Origin)', 'Malviya Nagar', 'Jaipur Airport', 'DCM (Ajmer Road)', 'JKLU Campus (Terminus)'],
        scheduled_time: '09:30 AM',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read_status: false
      },
      {
        notification_id: 'NOTIF-02',
        recipient_driver_id: 'DRV-102',
        title: 'Assigned: Route 02 (Campus ↔ Mansarovar)',
        message: 'You are assigned to Route 02 with Shuttle 02 (RJ 14 PA 9104). Scheduled departure: 10:00 AM.',
        type: 'ASSIGNMENT_NEW',
        related_route_id: 'ROUTE-02',
        related_trip_id: 'TRIP-102',
        related_shuttle_id: 'SHT-02',
        route_name: 'Mansarovar Metro Corridor',
        stops_preview: ['JKLU Campus (Origin)', 'Mansarovar Metro', 'Vaishali Nagar', 'DCM (Ajmer Road)', 'JKLU Campus (Terminus)'],
        scheduled_time: '10:00 AM',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        read_status: false
      },
      {
        notification_id: 'NOTIF-03',
        recipient_driver_id: 'DRV-103',
        title: 'Assigned: Route 03 (Campus ↔ Railway Station)',
        message: 'You are assigned to Route 03 with Shuttle 03 (RJ 14 PA 7721). Scheduled departure: 10:45 AM.',
        type: 'ASSIGNMENT_NEW',
        related_route_id: 'ROUTE-03',
        related_trip_id: 'TRIP-103',
        related_shuttle_id: 'SHT-03',
        route_name: 'Railway Station Corridor',
        stops_preview: ['JKLU Campus (Origin)', 'Railway Station', 'Vaishali Nagar', 'DCM (Ajmer Road)', 'JKLU Campus (Terminus)'],
        scheduled_time: '10:45 AM',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        read_status: false
      }
    ];

    // Seed routes with assigned driver and shuttle
    const enrichedRoutes: Route[] = MOCK_ROUTES.map((r) => {
      if (r.route_id === 'ROUTE-01') {
        return { ...r, assigned_shuttle_id: 'SHT-01', assigned_driver_id: 'DRV-101', status: 'ACTIVE' };
      }
      if (r.route_id === 'ROUTE-02') {
        return { ...r, assigned_shuttle_id: 'SHT-02', assigned_driver_id: 'DRV-102', status: 'ACTIVE' };
      }
      if (r.route_id === 'ROUTE-03') {
        return { ...r, assigned_shuttle_id: 'SHT-03', assigned_driver_id: 'DRV-103', status: 'ACTIVE' };
      }
      return { ...r, status: 'ACTIVE' };
    });

    return {
      routes: enrichedRoutes,
      stops: MOCK_STOPS,
      routeStops: MOCK_ROUTE_STOPS,
      shuttles: MOCK_SHUTTLES,
      drivers: MOCK_DRIVERS,
      trips: INITIAL_TRIPS,
      tripStops: INITIAL_TRIP_STOPS,
      driverAssignments: initialAssignments,
      driverNotifications: initialNotifications,
      shuttleLocations: INITIAL_SHUTTLE_LOCATIONS,
      routeCoordinates: ROUTE_PATH_COORDINATES,
      version: 2
    };
  }

  private saveStateToStorage(stateToSave: DatabaseState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save database state to localStorage:', e);
    }
  }

  private handleIncomingRealtimeEvent(event: RealtimeEvent) {
    // Prevent duplicate event handling from same or loopback tabs
    if (this.lastProcessedEventIds.has(event.eventId)) return;
    this.lastProcessedEventIds.add(event.eventId);
    if (this.lastProcessedEventIds.size > 200) {
      const arr = Array.from(this.lastProcessedEventIds);
      this.lastProcessedEventIds = new Set(arr.slice(arr.length - 100));
    }

    if (event.sourceTabId === this.tabId) return;

    // Reload latest state from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to refresh state from storage on realtime event:', e);
    }

    this.notifySubscribers(event);
  }

  private broadcastEvent(action: RealtimeAction, table: string, payload?: any) {
    const eventId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.lastProcessedEventIds.add(eventId);

    const event: RealtimeEvent = {
      eventId,
      action,
      table,
      payload,
      timestamp: new Date().toISOString(),
      sourceTabId: this.tabId
    };

    // Save to storage before broadcasting so other tabs immediately read fresh data
    this.saveStateToStorage(this.state);

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (e) {
        console.warn('BroadcastChannel postMessage error:', e);
      }
    }

    this.notifySubscribers(event);
  }

  private notifySubscribers(event: RealtimeEvent) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event, this.state);
      } catch (err) {
        console.error('Database subscriber callback error:', err);
      }
    });
  }

  // ================= Public Subscription API =================
  public subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // ================= Transactions: Route Creation & Assignment =================
  /**
   * Atomic Transaction:
   * 1. Validates Route ID, Code, Stops, Shuttle status, Driver availability
   * 2. Inserts Route
   * 3. Inserts RouteStops
   * 4. If Shuttle & Driver assigned, creates Trip + TripStops + DriverAssignment
   * 5. Creates reliable DriverNotification stored in DB
   * 6. Commits to storage and broadcasts in real-time
   */
  public createRouteWithAssignment(params: {
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
  }): { success: boolean; error?: string; route?: Route; trip?: Trip } {
    const cleanId = params.route_id.trim().toUpperCase();
    const cleanCode = params.route_code.trim().toUpperCase();

    if (!cleanId || !params.route_name.trim()) {
      return { success: false, error: 'Route ID and Route Name are required.' };
    }
    if (this.state.routes.some((r) => r.route_id.toUpperCase() === cleanId)) {
      return { success: false, error: `Route ID '${cleanId}' already exists in database.` };
    }
    if (this.state.routes.some((r) => r.route_code.toUpperCase() === cleanCode)) {
      return { success: false, error: `Route Code '${cleanCode}' already exists.` };
    }
    if (!params.stop_ids || params.stop_ids.length < 2) {
      return { success: false, error: 'A route must have at least 2 stops in its circuit.' };
    }

    // Shuttle validations
    if (params.assigned_shuttle_id) {
      const shuttle = this.state.shuttles.find((s) => s.shuttle_id === params.assigned_shuttle_id);
      if (!shuttle) {
        return { success: false, error: 'Selected shuttle does not exist.' };
      }
      if (shuttle.status === 'MAINTENANCE') {
        return { success: false, error: `Shuttle ${shuttle.shuttle_number} is in MAINTENANCE and cannot be assigned.` };
      }
      if (shuttle.status === 'OFFLINE') {
        return { success: false, error: `Shuttle ${shuttle.shuttle_number} is OFFLINE and cannot be assigned.` };
      }
      const conflictingTrip = this.state.trips.find(
        (t) => t.shuttle_id === params.assigned_shuttle_id && t.running_status === 'RUNNING'
      );
      if (conflictingTrip) {
        return { success: false, error: `Shuttle ${shuttle.shuttle_number} is already running Trip ${conflictingTrip.trip_id}.` };
      }
    }

    // Driver validations
    if (params.assigned_driver_id) {
      const driver = this.state.drivers.find((d) => d.driver_id === params.assigned_driver_id);
      if (!driver) {
        return { success: false, error: 'Selected driver does not exist.' };
      }
      const conflictingDriverTrip = this.state.trips.find(
        (t) => t.driver_id === params.assigned_driver_id && t.running_status === 'RUNNING'
      );
      if (conflictingDriverTrip) {
        return { success: false, error: `Driver ${driver.name} is already operating Trip ${conflictingDriverTrip.trip_id}.` };
      }
    }

    const now = new Date().toISOString();

    // 1. Create Route
    const newRoute: Route = {
      route_id: cleanId,
      route_name: params.route_name.trim(),
      route_code: cleanCode,
      total_stops: params.stop_ids.length,
      description: params.description.trim() || 'University Designated Transit Corridor',
      color: params.color || '#2B4A7E',
      assigned_shuttle_id: params.assigned_shuttle_id || undefined,
      assigned_driver_id: params.assigned_driver_id || undefined,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now
    };

    // 2. Create Route_Stops sequence
    const newRouteStops: RouteStop[] = params.stop_ids.map((stopId, idx) => ({
      route_id: cleanId,
      stop_id: stopId,
      sequence_number: idx + 1
    }));

    // 3. Polyline Coordinates
    const coords: [number, number][] = [];
    const orderedStopNames: string[] = [];
    params.stop_ids.forEach((sid) => {
      const st = this.state.stops.find((s) => s.stop_id === sid);
      if (st) {
        coords.push([st.latitude, st.longitude]);
        orderedStopNames.push(st.stop_name);
      } else {
        orderedStopNames.push(sid);
      }
    });

    let newTrip: Trip | undefined;
    let newTripStops: TripStop[] = [];
    let newAssignment: DriverAssignment | undefined;
    let newNotification: DriverNotification | undefined;

    // 4. Create Trip & Driver Assignment if shuttle & driver are specified
    if (params.assigned_shuttle_id && params.assigned_driver_id) {
      const departureTime = params.start_time || '10:30 AM';
      const tripId = `TRIP-${Date.now().toString().slice(-3)}`;

      newTrip = {
        trip_id: tripId,
        shuttle_id: params.assigned_shuttle_id,
        route_id: cleanId,
        driver_id: params.assigned_driver_id,
        start_time: departureTime,
        end_time: null,
        running_status: 'SCHEDULED',
        capacity_status: 'AVAILABLE',
        speed_kmh: 0,
        created_at: now,
        updated_at: now
      };

      // Generate Trip Stops
      newTripStops = params.stop_ids.map((sid, idx) => {
        const offsetMin = idx * 12;
        const [hourStr, minuteStrWithPeriod] = departureTime.split(':');
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
        const timeStr = `${String(finalHour).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')} ${finalPeriod}`;

        return {
          trip_id: tripId,
          stop_id: sid,
          scheduled_arrival: timeStr,
          scheduled_departure: timeStr,
          estimated_arrival: timeStr,
          actual_arrival: null,
          actual_departure: null,
          arrival_status: 'SCHEDULED'
        };
      });

      // 5. Create Driver Assignment record
      newAssignment = {
        assignment_id: `ASG-${Date.now().toString().slice(-4)}`,
        driver_id: params.assigned_driver_id,
        route_id: cleanId,
        trip_id: tripId,
        shuttle_id: params.assigned_shuttle_id,
        assigned_at: now,
        status: 'ACTIVE',
        notes: params.instructions || 'Assigned during route creation by Admin Operations'
      };

      // 6. Create Database Notification for Driver
      const shuttleObj = this.state.shuttles.find((s) => s.shuttle_id === params.assigned_shuttle_id);
      const shuttleLabel = shuttleObj ? `${shuttleObj.shuttle_number} (${shuttleObj.registration_number})` : params.assigned_shuttle_id;

      newNotification = {
        notification_id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipient_driver_id: params.assigned_driver_id,
        title: `New Assignment: ${newRoute.route_code} — ${newRoute.route_name}`,
        message: `You have been assigned to Route ${newRoute.route_code} with ${shuttleLabel}. Scheduled departure: ${departureTime}. Ordered stops: ${orderedStopNames.join(' → ')}.`,
        type: 'ASSIGNMENT_NEW',
        related_route_id: cleanId,
        related_trip_id: tripId,
        related_shuttle_id: params.assigned_shuttle_id,
        route_name: newRoute.route_name,
        stops_preview: orderedStopNames,
        scheduled_time: departureTime,
        created_at: now,
        read_status: false
      };
    }

    // Set initial shuttle location if trip created
    let newLocations = this.state.shuttleLocations;
    if (newTrip && params.assigned_shuttle_id) {
      const firstStop = this.state.stops.find((s) => s.stop_id === params.stop_ids[0]);
      const initialLoc: ShuttleLocation = {
        shuttle_id: params.assigned_shuttle_id,
        trip_id: newTrip.trip_id,
        latitude: firstStop?.latitude || 26.8373,
        longitude: firstStop?.longitude || 75.6499,
        bearing: 90,
        timestamp: now,
        progress_percentage: 0,
        current_segment_index: 0
      };
      newLocations = [...newLocations.filter((l) => l.shuttle_id !== params.assigned_shuttle_id), initialLoc];
    }

    // Atomic State Update
    this.state = {
      ...this.state,
      routes: [...this.state.routes, newRoute],
      routeStops: [...this.state.routeStops, ...newRouteStops],
      routeCoordinates: coords.length > 0 ? { ...this.state.routeCoordinates, [cleanId]: coords } : this.state.routeCoordinates,
      trips: newTrip ? [newTrip, ...this.state.trips] : this.state.trips,
      tripStops: newTripStops.length > 0 ? [...this.state.tripStops, ...newTripStops] : this.state.tripStops,
      driverAssignments: newAssignment ? [newAssignment, ...this.state.driverAssignments] : this.state.driverAssignments,
      driverNotifications: newNotification ? [newNotification, ...this.state.driverNotifications] : this.state.driverNotifications,
      shuttleLocations: newLocations
    };

    this.broadcastEvent('ROUTE_CREATED', 'Routes', { route: newRoute, trip: newTrip, notification: newNotification });
    return { success: true, route: newRoute, trip: newTrip };
  }

  // ================= Route Updating & Driver Replacement =================
  public updateRoute(
    updatedRoute: Route,
    stopIds?: string[],
    newAssignedDriverId?: string,
    newAssignedShuttleId?: string
  ): { success: boolean; error?: string } {
    const existing = this.state.routes.find((r) => r.route_id === updatedRoute.route_id);
    if (!existing) {
      return { success: false, error: 'Route not found.' };
    }

    const now = new Date().toISOString();
    const previousDriverId = existing.assigned_driver_id;
    const finalDriverId = newAssignedDriverId !== undefined ? newAssignedDriverId : updatedRoute.assigned_driver_id;
    const finalShuttleId = newAssignedShuttleId !== undefined ? newAssignedShuttleId : updatedRoute.assigned_shuttle_id;

    const modifiedRoute: Route = {
      ...existing,
      ...updatedRoute,
      assigned_driver_id: finalDriverId,
      assigned_shuttle_id: finalShuttleId,
      total_stops: stopIds ? stopIds.length : (existing.total_stops || (stopIds || []).length),
      updated_at: now
    };

    let newRouteStops = this.state.routeStops;
    let newCoordinates = this.state.routeCoordinates;
    let orderedStopNames: string[] = [];

    if (stopIds && stopIds.length >= 2) {
      newRouteStops = [
        ...this.state.routeStops.filter((rs) => rs.route_id !== updatedRoute.route_id),
        ...stopIds.map((sid, idx) => ({
          route_id: updatedRoute.route_id,
          stop_id: sid,
          sequence_number: idx + 1
        }))
      ];

      const coords: [number, number][] = [];
      stopIds.forEach((sid) => {
        const st = this.state.stops.find((s) => s.stop_id === sid);
        if (st) {
          coords.push([st.latitude, st.longitude]);
          orderedStopNames.push(st.stop_name);
        }
      });
      if (coords.length > 0) {
        newCoordinates = {
          ...newCoordinates,
          [updatedRoute.route_id]: coords
        };
      }
    } else {
      const existingStops = this.state.routeStops
        .filter((rs) => rs.route_id === updatedRoute.route_id)
        .sort((a, b) => a.sequence_number - b.sequence_number);
      existingStops.forEach((rs) => {
        const st = this.state.stops.find((s) => s.stop_id === rs.stop_id);
        if (st) orderedStopNames.push(st.stop_name);
      });
    }

    const newNotifications: DriverNotification[] = [...this.state.driverNotifications];
    const newAssignments: DriverAssignment[] = [...this.state.driverAssignments];

    // Check if Driver changed or was replaced
    if (finalDriverId && finalDriverId !== previousDriverId) {
      // 1. Inform PREVIOUS driver that assignment has changed
      if (previousDriverId) {
        const prevDriverNotif: DriverNotification = {
          notification_id: `NOTIF-${Date.now()}-prev-${Math.random().toString(36).substring(2, 5)}`,
          recipient_driver_id: previousDriverId,
          title: `Assignment Replaced: ${modifiedRoute.route_code}`,
          message: `Your assignment on Route ${modifiedRoute.route_code} (${modifiedRoute.route_name}) has been updated. You are no longer assigned to this route.`,
          type: 'ASSIGNMENT_REMOVED',
          related_route_id: modifiedRoute.route_id,
          route_name: modifiedRoute.route_name,
          created_at: now,
          read_status: false
        };
        newNotifications.unshift(prevDriverNotif);

        // Update previous driver assignment record status
        const prevAsgIndex = newAssignments.findIndex(
          (a) => a.driver_id === previousDriverId && a.route_id === modifiedRoute.route_id && a.status === 'ACTIVE'
        );
        if (prevAsgIndex !== -1) {
          newAssignments[prevAsgIndex] = {
            ...newAssignments[prevAsgIndex],
            status: 'REPLACED',
            updated_at: now
          };
        }
      }

      // 2. Inform NEWLY assigned driver
      const shuttleObj = this.state.shuttles.find((s) => s.shuttle_id === finalShuttleId);
      const shuttleLabel = shuttleObj ? `${shuttleObj.shuttle_number} (${shuttleObj.registration_number})` : (finalShuttleId || 'Assigned Shuttle');

      const newDriverNotif: DriverNotification = {
        notification_id: `NOTIF-${Date.now()}-new-${Math.random().toString(36).substring(2, 5)}`,
        recipient_driver_id: finalDriverId,
        title: `New Assignment: ${modifiedRoute.route_code} — ${modifiedRoute.route_name}`,
        message: `You have been assigned as the primary operator for Route ${modifiedRoute.route_code} with ${shuttleLabel}. Stops: ${orderedStopNames.join(' → ')}.`,
        type: 'ASSIGNMENT_NEW',
        related_route_id: modifiedRoute.route_id,
        related_shuttle_id: finalShuttleId,
        route_name: modifiedRoute.route_name,
        stops_preview: orderedStopNames,
        created_at: now,
        read_status: false
      };
      newNotifications.unshift(newDriverNotif);

      // Create new DriverAssignment
      newAssignments.unshift({
        assignment_id: `ASG-${Date.now().toString().slice(-4)}`,
        driver_id: finalDriverId,
        route_id: modifiedRoute.route_id,
        shuttle_id: finalShuttleId || 'SHT-01',
        assigned_at: now,
        status: 'ACTIVE',
        notes: `Assigned on route update`
      });
    }

    // Update active/scheduled trips on this route to reflect driver and shuttle changes
    const updatedTrips = this.state.trips.map((t) => {
      if (t.route_id === modifiedRoute.route_id && (t.running_status === 'SCHEDULED' || t.running_status === 'RUNNING')) {
        return {
          ...t,
          driver_id: finalDriverId || t.driver_id,
          shuttle_id: finalShuttleId || t.shuttle_id,
          updated_at: now
        };
      }
      return t;
    });

    this.state = {
      ...this.state,
      routes: this.state.routes.map((r) => (r.route_id === modifiedRoute.route_id ? modifiedRoute : r)),
      routeStops: newRouteStops,
      routeCoordinates: newCoordinates,
      trips: updatedTrips,
      driverAssignments: newAssignments,
      driverNotifications: newNotifications
    };

    this.broadcastEvent('ROUTE_UPDATED', 'Routes', { route: modifiedRoute });
    return { success: true };
  }

  // ================= Route Cancellation & Deletion =================
  public cancelRoute(routeId: string): { success: boolean; error?: string } {
    const route = this.state.routes.find((r) => r.route_id === routeId);
    if (!route) {
      return { success: false, error: 'Route not found.' };
    }

    const now = new Date().toISOString();

    // Notify assigned driver
    const newNotifications = [...this.state.driverNotifications];
    if (route.assigned_driver_id) {
      newNotifications.unshift({
        notification_id: `NOTIF-${Date.now()}-cancel-${Math.random().toString(36).substring(2, 5)}`,
        recipient_driver_id: route.assigned_driver_id,
        title: `Route Cancelled: ${route.route_code}`,
        message: `Route ${route.route_code} (${route.route_name}) has been cancelled by Admin Dispatch. Do not operate this route.`,
        type: 'TRIP_CANCELLED',
        related_route_id: routeId,
        route_name: route.route_name,
        created_at: now,
        read_status: false
      });
    }

    // Cancel all active or scheduled trips on this route so students immediately see them removed!
    const updatedTrips = this.state.trips.map((t) => {
      if (t.route_id === routeId && (t.running_status === 'RUNNING' || t.running_status === 'SCHEDULED')) {
        return {
          ...t,
          running_status: 'CANCELLED' as const,
          speed_kmh: 0,
          updated_at: now
        };
      }
      return t;
    });

    const updatedRoutes = this.state.routes.map((r) =>
      r.route_id === routeId ? { ...r, status: 'CANCELLED' as const, updated_at: now } : r
    );

    this.state = {
      ...this.state,
      routes: updatedRoutes,
      trips: updatedTrips,
      driverNotifications: newNotifications
    };

    this.broadcastEvent('ROUTE_CANCELLED', 'Routes', { routeId });
    return { success: true };
  }

  public deleteRoute(routeId: string): { success: boolean; error?: string } {
    const activeTrip = this.state.trips.find(
      (t) => t.route_id === routeId && t.running_status === 'RUNNING'
    );
    if (activeTrip) {
      return {
        success: false,
        error: `Cannot delete Route ${routeId}: Trip ${activeTrip.trip_id} is currently RUNNING. End or cancel the trip first.`
      };
    }

    this.state = {
      ...this.state,
      routes: this.state.routes.filter((r) => r.route_id !== routeId),
      routeStops: this.state.routeStops.filter((rs) => rs.route_id !== routeId),
      trips: this.state.trips.filter((t) => t.route_id !== routeId)
    };

    this.broadcastEvent('ROUTE_DELETED', 'Routes', { routeId });
    return { success: true };
  }

  // ================= Driver Trip Operations =================
  public updateTripRunningStatus(
    tripId: string,
    newStatus: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED'
  ): { success: boolean; error?: string } {
    const trip = this.state.trips.find((t) => t.trip_id === tripId);
    if (!trip) {
      return { success: false, error: 'Trip not found.' };
    }

    const now = new Date().toISOString();
    const updatedTrip: Trip = {
      ...trip,
      running_status: newStatus,
      end_time: newStatus === 'COMPLETED' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : trip.end_time,
      speed_kmh: newStatus === 'RUNNING' ? 24 : 0,
      updated_at: now
    };

    // If completed or cancelled, update trip stops
    let updatedTripStops = this.state.tripStops;
    if (newStatus === 'COMPLETED') {
      updatedTripStops = this.state.tripStops.map((ts) =>
        ts.trip_id === tripId ? { ...ts, arrival_status: 'COMPLETED' as const, actual_arrival: ts.scheduled_arrival } : ts
      );
    }

    this.state = {
      ...this.state,
      trips: this.state.trips.map((t) => (t.trip_id === tripId ? updatedTrip : t)),
      tripStops: updatedTripStops
    };

    this.broadcastEvent('TRIP_STATUS_CHANGED', 'Trips', { trip: updatedTrip });
    return { success: true };
  }

  public updateTripCapacity(tripId: string, capacity: 'AVAILABLE' | 'MODERATE' | 'FULL') {
    this.state = {
      ...this.state,
      trips: this.state.trips.map((t) => (t.trip_id === tripId ? { ...t, capacity_status: capacity } : t))
    };
    this.broadcastEvent('CAPACITY_CHANGED', 'Trips', { tripId, capacity });
  }

  // ================= Notifications API =================
  public markNotificationAsRead(notificationId: string) {
    this.state = {
      ...this.state,
      driverNotifications: this.state.driverNotifications.map((n) =>
        n.notification_id === notificationId ? { ...n, read_status: true } : n
      )
    };
    this.broadcastEvent('NOTIFICATION_READ', 'DriverNotifications', { notificationId });
  }

  public markAllNotificationsAsRead(driverId: string) {
    this.state = {
      ...this.state,
      driverNotifications: this.state.driverNotifications.map((n) =>
        n.recipient_driver_id === driverId ? { ...n, read_status: true } : n
      )
    };
    this.broadcastEvent('NOTIFICATION_READ', 'DriverNotifications', { driverId, all: true });
  }

  public getNotificationsForDriver(driverId: string): DriverNotification[] {
    return this.state.driverNotifications
      .filter((n) => n.recipient_driver_id === driverId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ================= Direct Trip Management =================
  public createTrip(params: {
    route_id: string;
    shuttle_id: string;
    driver_id: string;
    start_time: string;
    end_time?: string | null;
  }): { success: boolean; error?: string; trip?: Trip } {
    const targetShuttle = this.state.shuttles.find((s) => s.shuttle_id === params.shuttle_id);
    if (!targetShuttle) return { success: false, error: 'Selected shuttle does not exist.' };
    if (targetShuttle.status === 'MAINTENANCE' || targetShuttle.status === 'OFFLINE') {
      return { success: false, error: `Shuttle ${targetShuttle.shuttle_number} is ${targetShuttle.status}.` };
    }

    const runningShuttle = this.state.trips.find(
      (t) => t.shuttle_id === params.shuttle_id && t.running_status === 'RUNNING'
    );
    if (runningShuttle) {
      return { success: false, error: `Shuttle ${targetShuttle.shuttle_number} is already operating Trip ${runningShuttle.trip_id}.` };
    }

    const runningDriver = this.state.trips.find(
      (t) => t.driver_id === params.driver_id && t.running_status === 'RUNNING'
    );
    if (runningDriver) {
      const d = this.state.drivers.find((drv) => drv.driver_id === params.driver_id);
      return { success: false, error: `Driver ${d?.name || params.driver_id} is already operating Trip ${runningDriver.trip_id}.` };
    }

    const now = new Date().toISOString();
    const newTripId = `TRIP-${Date.now().toString().slice(-3)}`;
    const newTrip: Trip = {
      trip_id: newTripId,
      shuttle_id: params.shuttle_id,
      route_id: params.route_id,
      driver_id: params.driver_id,
      start_time: params.start_time,
      end_time: params.end_time || null,
      running_status: 'SCHEDULED',
      capacity_status: 'AVAILABLE',
      speed_kmh: 0,
      created_at: now,
      updated_at: now
    };

    const sequenceStops = this.state.routeStops
      .filter((rs) => rs.route_id === params.route_id)
      .sort((a, b) => a.sequence_number - b.sequence_number);

    const orderedStopNames: string[] = [];
    const newTripStops: TripStop[] = sequenceStops.map((rs, index) => {
      const offsetMin = index * 12;
      const [hourStr, minuteStrWithPeriod] = params.start_time.split(':');
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
      const timeStr = `${String(finalHour).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')} ${finalPeriod}`;

      const st = this.state.stops.find((s) => s.stop_id === rs.stop_id);
      if (st) orderedStopNames.push(st.stop_name);

      return {
        trip_id: newTripId,
        stop_id: rs.stop_id,
        scheduled_arrival: timeStr,
        scheduled_departure: timeStr,
        estimated_arrival: timeStr,
        actual_arrival: null,
        actual_departure: null,
        arrival_status: 'SCHEDULED'
      };
    });

    const routeObj = this.state.routes.find((r) => r.route_id === params.route_id);
    const newNotification: DriverNotification = {
      notification_id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient_driver_id: params.driver_id,
      title: `Scheduled Trip: ${newTripId} (${routeObj?.route_code || params.route_id})`,
      message: `You are scheduled to operate Trip ${newTripId} with Shuttle ${targetShuttle.shuttle_number}. Departure: ${params.start_time}.`,
      type: 'ASSIGNMENT_NEW',
      related_route_id: params.route_id,
      related_trip_id: newTripId,
      related_shuttle_id: params.shuttle_id,
      route_name: routeObj?.route_name,
      stops_preview: orderedStopNames,
      scheduled_time: params.start_time,
      created_at: now,
      read_status: false
    };

    const firstStop = this.state.stops.find((s) => s.stop_id === sequenceStops[0]?.stop_id);
    const initialLoc: ShuttleLocation = {
      shuttle_id: params.shuttle_id,
      trip_id: newTripId,
      latitude: firstStop?.latitude || 26.8373,
      longitude: firstStop?.longitude || 75.6499,
      bearing: 90,
      timestamp: now,
      progress_percentage: 0,
      current_segment_index: 0
    };

    this.state = {
      ...this.state,
      trips: [newTrip, ...this.state.trips],
      tripStops: [...this.state.tripStops, ...newTripStops],
      driverNotifications: [newNotification, ...this.state.driverNotifications],
      shuttleLocations: [...this.state.shuttleLocations.filter((l) => l.shuttle_id !== params.shuttle_id), initialLoc]
    };

    this.broadcastEvent('TRIP_CREATED', 'Trips', { trip: newTrip, notification: newNotification });
    return { success: true, trip: newTrip };
  }

  public updateTrip(updatedTrip: Trip): { success: boolean; error?: string } {
    const existing = this.state.trips.find((t) => t.trip_id === updatedTrip.trip_id);
    if (!existing) return { success: false, error: 'Trip not found.' };

    const now = new Date().toISOString();
    const finalTrip = { ...updatedTrip, updated_at: now };

    // If driver changed on this trip, notify both drivers
    const newNotifications = [...this.state.driverNotifications];
    if (updatedTrip.driver_id !== existing.driver_id) {
      const routeObj = this.state.routes.find((r) => r.route_id === updatedTrip.route_id);
      const shuttleObj = this.state.shuttles.find((s) => s.shuttle_id === updatedTrip.shuttle_id);

      // Notify old driver
      newNotifications.unshift({
        notification_id: `NOTIF-${Date.now()}-unassign-${Math.random().toString(36).substring(2, 5)}`,
        recipient_driver_id: existing.driver_id,
        title: `Trip Reassigned: ${updatedTrip.trip_id}`,
        message: `You have been unassigned from Trip ${updatedTrip.trip_id} on ${routeObj?.route_code || updatedTrip.route_id}.`,
        type: 'ASSIGNMENT_REMOVED',
        related_trip_id: updatedTrip.trip_id,
        related_route_id: updatedTrip.route_id,
        created_at: now,
        read_status: false
      });

      // Notify new driver
      newNotifications.unshift({
        notification_id: `NOTIF-${Date.now()}-newdrv-${Math.random().toString(36).substring(2, 5)}`,
        recipient_driver_id: updatedTrip.driver_id,
        title: `Trip Assigned: ${updatedTrip.trip_id}`,
        message: `You have been assigned to Trip ${updatedTrip.trip_id} with Shuttle ${shuttleObj?.shuttle_number || updatedTrip.shuttle_id}. Departure: ${updatedTrip.start_time}.`,
        type: 'ASSIGNMENT_NEW',
        related_trip_id: updatedTrip.trip_id,
        related_route_id: updatedTrip.route_id,
        created_at: now,
        read_status: false
      });
    }

    this.state = {
      ...this.state,
      trips: this.state.trips.map((t) => (t.trip_id === finalTrip.trip_id ? finalTrip : t)),
      driverNotifications: newNotifications
    };

    this.broadcastEvent('TRIP_UPDATED', 'Trips', { trip: finalTrip });
    return { success: true };
  }

  public cancelTrip(tripId: string): { success: boolean; error?: string } {
    return this.updateTripRunningStatus(tripId, 'CANCELLED');
  }

  // ================= Stop, Shuttle, Driver CRUD =================
  public createStop(stopData: Stop): { success: boolean; error?: string } {
    const cleanId = stopData.stop_id.trim().toUpperCase();
    if (this.state.stops.some((s) => s.stop_id.toUpperCase() === cleanId)) {
      return { success: false, error: `Stop ID '${cleanId}' already exists.` };
    }
    const newStop: Stop = {
      ...stopData,
      stop_id: cleanId,
      latitude: Number(stopData.latitude),
      longitude: Number(stopData.longitude)
    };
    this.state = {
      ...this.state,
      stops: [...this.state.stops, newStop]
    };
    this.broadcastEvent('DATABASE_RESET', 'Stops', { stop: newStop });
    return { success: true };
  }

  public updateStop(stopData: Stop): { success: boolean; error?: string } {
    this.state = {
      ...this.state,
      stops: this.state.stops.map((s) => (s.stop_id === stopData.stop_id ? stopData : s))
    };
    this.broadcastEvent('DATABASE_RESET', 'Stops', { stop: stopData });
    return { success: true };
  }

  public deleteStop(stopId: string): { success: boolean; error?: string } {
    const isUsed = this.state.routeStops.some((rs) => rs.stop_id === stopId);
    if (isUsed) {
      return { success: false, error: `Cannot delete Stop ${stopId}: Assigned to active routes.` };
    }
    this.state = {
      ...this.state,
      stops: this.state.stops.filter((s) => s.stop_id !== stopId)
    };
    this.broadcastEvent('DATABASE_RESET', 'Stops', { stopId });
    return { success: true };
  }

  public createShuttle(shuttleData: Shuttle): { success: boolean; error?: string } {
    const cleanId = shuttleData.shuttle_id.trim().toUpperCase();
    if (this.state.shuttles.some((s) => s.shuttle_id.toUpperCase() === cleanId)) {
      return { success: false, error: `Shuttle ID '${cleanId}' already exists.` };
    }
    const newShuttle: Shuttle = {
      ...shuttleData,
      shuttle_id: cleanId,
      capacity: Number(shuttleData.capacity) || 32
    };
    this.state = {
      ...this.state,
      shuttles: [...this.state.shuttles, newShuttle]
    };
    this.broadcastEvent('DATABASE_RESET', 'Shuttles', { shuttle: newShuttle });
    return { success: true };
  }

  public updateShuttle(shuttleData: Shuttle): { success: boolean; error?: string } {
    this.state = {
      ...this.state,
      shuttles: this.state.shuttles.map((s) => (s.shuttle_id === shuttleData.shuttle_id ? shuttleData : s))
    };
    this.broadcastEvent('DATABASE_RESET', 'Shuttles', { shuttle: shuttleData });
    return { success: true };
  }

  public setShuttleStatus(shuttleId: string, status: Shuttle['status']) {
    this.state = {
      ...this.state,
      shuttles: this.state.shuttles.map((s) => (s.shuttle_id === shuttleId ? { ...s, status } : s))
    };
    this.broadcastEvent('DATABASE_RESET', 'Shuttles', { shuttleId, status });
  }

  public createDriver(data: {
    name: string;
    phone_number: string;
    license_no: string;
    assigned_shuttle_id?: string;
  }): { success: boolean; error?: string } {
    const newId = `DRV-${Date.now().toString().slice(-3)}`;
    const newDriver: Driver = {
      user_id: `USR-${newId}`,
      driver_id: newId,
      name: data.name.trim(),
      phone_number: data.phone_number.trim(),
      license_no: data.license_no.trim(),
      assigned_shuttle_id: data.assigned_shuttle_id
    };
    this.state = {
      ...this.state,
      drivers: [...this.state.drivers, newDriver]
    };
    this.broadcastEvent('DATABASE_RESET', 'Drivers', { driver: newDriver });
    return { success: true };
  }

  public updateDriver(driverData: Driver): { success: boolean; error?: string } {
    this.state = {
      ...this.state,
      drivers: this.state.drivers.map((d) => (d.driver_id === driverData.driver_id ? driverData : d))
    };
    this.broadcastEvent('DATABASE_RESET', 'Drivers', { driver: driverData });
    return { success: true };
  }

  public deleteDriver(driverId: string): { success: boolean; error?: string } {
    const activeTrip = this.state.trips.find(
      (t) => t.driver_id === driverId && t.running_status === 'RUNNING'
    );
    if (activeTrip) {
      return { success: false, error: 'Cannot remove driver while operating an active trip.' };
    }
    this.state = {
      ...this.state,
      drivers: this.state.drivers.filter((d) => d.driver_id !== driverId)
    };
    this.broadcastEvent('DATABASE_RESET', 'Drivers', { driverId });
    return { success: true };
  }

  // ================= State Reset =================
  public resetToDefaultState(): DatabaseState {
    const defaultState = this.generateDefaultSeedState();
    this.state = defaultState;
    this.saveStateToStorage(defaultState);
    this.broadcastEvent('DATABASE_RESET', 'All');
    return defaultState;
  }
}

export const databaseService = new CentralDatabaseService();
