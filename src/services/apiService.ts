import api from './api';

// Routes
export const getRoutes = () => api.get('/routes').then(res => res.data);
export const createRoute = (data: any) => api.post('/routes', data).then(res => res.data);
export const updateRoute = (id: string, data: any) => api.put(`/routes/${id}`, data).then(res => res.data);
export const deleteRoute = (id: string) => api.delete(`/routes/${id}`).then(res => res.data);

// Stops
export const getStops = (routeId: string) => api.get(`/routes/${routeId}/stops`).then(res => res.data);
export const getAllStops = () => api.get('/routes/stops/all').then(res => res.data);
export const createStop = (data: any) => api.post('/routes/stops', data).then(res => res.data);
export const updateStop = (id: string, data: any) => api.put(`/routes/stops/${id}`, data).then(res => res.data);
export const deleteStop = (id: string) => api.delete(`/routes/stops/${id}`).then(res => res.data);

// Shuttles
export const getShuttles = () => api.get('/shuttles').then(res => res.data);
export const createShuttle = (data: any) => api.post('/shuttles', data).then(res => res.data);
export const updateShuttle = (id: string, data: any) => api.put(`/shuttles/${id}`, data).then(res => res.data);
export const updateShuttleStatus = (id: string, status: string) => api.patch(`/shuttles/${id}/status`, { status }).then(res => res.data);
export const updateShuttleLocation = (id: string, lat: number, lng: number, options?: any) => 
  api.post(`/shuttles/${id}/location`, { lat, lng, ...options }).then(res => res.data);

// Trips
export const getTrips = () => api.get('/trips').then(res => res.data);
export const getLiveTripDetails = (tripId: string) => api.get(`/trips/${tripId}/live`).then(res => res.data);
export const startTrip = (tripId: string) => api.post(`/trips/${tripId}/start`).then(res => res.data);
export const endTrip = (tripId: string) => api.post(`/trips/${tripId}/end`).then(res => res.data);
export const createTrip = (data: any) => api.post('/trips', data).then(res => res.data);
export const updateTrip = (id: string, data: any) => api.put(`/trips/${id}`, data).then(res => res.data);
export const cancelTrip = (id: string) => api.patch(`/trips/${id}/cancel`).then(res => res.data);
export const updateTripCapacity = (id: string, capacity: string) => api.patch(`/trips/${id}/capacity`, { capacity }).then(res => res.data);
export const updateTripStopStatus = (tripId: string, stopId: string, status: string) => api.patch(`/trips/${tripId}/stops/${stopId}`, { status }).then(res => res.data);

// Drivers
export const getDrivers = () => api.get('/driver').then(res => res.data);
export const createDriver = (data: any) => api.post('/driver', data).then(res => res.data);
export const updateDriver = (id: string, data: any) => api.put(`/driver/${id}`, data).then(res => res.data);
export const deleteDriver = (id: string) => api.delete(`/driver/${id}`).then(res => res.data);
export const startShift = (shuttleId: string) => api.post('/driver/start-shift', { shuttleId }).then(res => res.data);
export const endShift = () => api.post('/driver/end-shift').then(res => res.data);
export const getDriverAssignedTrip = () => api.get('/driver/assigned-trip').then(res => res.data);
export const submitDriverLocation = (data: {
  trip_id: string;
  shuttle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  bearing?: number;
  accuracy_m?: number;
  gps_timestamp?: string;
}) => api.post('/driver/location', data).then(res => res.data);

// Students
export const recordStudentLocation = (data: {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  gps_timestamp?: string;
}) => api.post('/student/location', data).then(res => res.data);

export const getStudentNearbyStops = (params?: { lat?: number; lng?: number; radius?: number; limit?: number }) =>
  api.get('/student/nearby-stops', { params }).then(res => res.data);

export const getLatestStudentLocation = () => api.get('/student/location/latest').then(res => res.data);

export const getActiveStudentTrips = () => api.get('/student/active-trips').then(res => res.data);

// Admin Stats
export const getAdminStats = () => api.get('/admin/stats').then(res => res.data);
