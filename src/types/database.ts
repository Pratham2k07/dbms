// JKLU Shuttle Tracking System - Database Schema Types
// Formatted strictly according to the specified university DBMS model

export interface User {
  user_id: string;
  name: string;
  phone_number: string;
}

export interface Student extends User {
  student_id: string;
  roll_no: string;
  email: string;
}

export interface Driver extends User {
  driver_id: string;
  license_no: string;
  assigned_shuttle_id?: string;
}

export interface Route {
  route_id: string;
  route_name: string;
  route_code: string; // e.g., 'R-01', 'R-02'
  total_stops: number;
  description: string;
  color: string; // Subtle route line color
}

export interface Stop {
  stop_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  is_destination?: boolean; // true for JK Lakshmipat University
  description?: string;
}

export interface Shuttle {
  shuttle_id: string;
  shuttle_number: string; // e.g., 'SHUTTLE 01'
  registration_number: string; // e.g., 'RJ 14 PA 8842'
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
}

export interface Trip {
  trip_id: string;
  shuttle_id: string;
  route_id: string;
  driver_id: string;
  start_time: string;
  end_time: string | null;
  running_status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  capacity_status: 'AVAILABLE' | 'FULL';
  speed_kmh?: number;
}

export interface RouteStop {
  route_id: string;
  stop_id: string;
  sequence_number: number;
}

export interface TripStop {
  trip_id: string;
  stop_id: string;
  scheduled_arrival: string; // e.g. '10:30 AM'
  scheduled_departure: string;
  estimated_arrival: string; // e.g. '10:35 AM'
  actual_arrival: string | null;
  actual_departure: string | null;
  arrival_status: 'SCHEDULED' | 'APPROACHING' | 'ARRIVED' | 'COMPLETED' | 'SKIPPED';
}

export interface StudentLocation {
  student_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  location_name: string;
}

export interface ShuttleLocation {
  shuttle_id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  bearing: number;
  timestamp: string;
  progress_percentage: number; // 0 to 100 along the route path
  current_segment_index: number;
}
