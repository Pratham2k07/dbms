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

export interface Admin extends User {
  admin_id: string;
  email: string;
  designation: string;
  department: string;
}

export interface Route {
  route_id: string;
  route_name: string;
  route_code: string; // e.g., 'R-01', 'R-02'
  total_stops: number;
  description: string;
  color: string; // Subtle route line color
  assigned_shuttle_id?: string;
  assigned_driver_id?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  created_at?: string;
  updated_at?: string;
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
  capacity_status: 'AVAILABLE' | 'MODERATE' | 'FULL';
  speed_kmh?: number;
  created_at?: string;
  updated_at?: string;
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

export interface DriverAssignment {
  assignment_id: string;
  driver_id: string;
  route_id: string;
  trip_id?: string;
  shuttle_id: string;
  assigned_at: string;
  updated_at?: string;
  status: 'ACTIVE' | 'REPLACED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
}

export interface DriverNotification {
  notification_id: string;
  recipient_driver_id: string; // foreign key to Driver.driver_id
  title: string;
  message: string;
  type: 'ASSIGNMENT_NEW' | 'ASSIGNMENT_UPDATED' | 'ASSIGNMENT_REMOVED' | 'TRIP_CANCELLED' | 'GENERAL';
  related_route_id?: string;
  related_trip_id?: string;
  related_shuttle_id?: string;
  route_name?: string;
  stops_preview?: string[];
  scheduled_time?: string;
  created_at: string;
  read_status: boolean;
}
