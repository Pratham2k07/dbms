import { Stop, Shuttle, Trip, Route, TripStop, ShuttleLocation } from './database';

export type ScreenType = 
  | 'splash'
  | 'login'
  | 'location-loading'
  | 'home'
  | 'stop-details'
  | 'live-tracking'
  | 'route-details'
  | 'driver-dashboard'
  | 'profile';

export type TabType = 'home' | 'track' | 'profile';

export interface NearbyStopInfo {
  stop: Stop;
  distance_meters: number;
  walking_time_minutes: number;
  approaching_shuttles_count: number;
  is_nearest: boolean;
}

export interface UpcomingShuttleCardData {
  shuttle: Shuttle;
  trip: Trip;
  route: Route;
  trip_stop: TripStop;
  eta_minutes: number;
  estimated_time: string;
  scheduled_time: string;
  capacity_status: 'AVAILABLE' | 'FULL';
  shuttle_location?: ShuttleLocation;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'approaching' | 'full' | 'delay' | 'info';
  timestamp: string;
  read: boolean;
  shuttle_number?: string;
  stop_name?: string;
}

export interface SimulationConfig {
  isRunning: boolean;
  speedMultiplier: number; // 1x, 2x, 4x
  autoAdvanceETAs: boolean;
}
