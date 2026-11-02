-- ==============================================================================
-- MIGRATION 002: PERFORMANCE INDEXES AND COMPREHENSIVE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. PERFORMANCE INDEXES
-- Index for rapid retrieval of latest shuttle locations (queried by live tracking every 3.5s)
CREATE INDEX IF NOT EXISTS idx_shuttle_locations_shuttle_time 
  ON shuttle_locations (shuttle_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_shuttle_locations_trip_id 
  ON shuttle_locations (trip_id);

-- Index for trips by driver and running status (queried on driver login and dashboard)
CREATE INDEX IF NOT EXISTS idx_trips_driver_status 
  ON trips (driver_id, running_status);

CREATE INDEX IF NOT EXISTS idx_trips_route_id 
  ON trips (route_id);

CREATE INDEX IF NOT EXISTS idx_trips_shuttle_id 
  ON trips (shuttle_id);

CREATE INDEX IF NOT EXISTS idx_trips_running_status 
  ON trips (running_status);

-- Indexes for route and trip stops lookups
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_id 
  ON route_stops (stop_id);

CREATE INDEX IF NOT EXISTS idx_trip_stops_stop_id 
  ON trip_stops (stop_id);

-- Indexes for driver assignments and notifications
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_read 
  ON driver_notifications (driver_id, read_status);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver_status 
  ON driver_assignments (driver_id, status);

-- Index for student location lookups
CREATE INDEX IF NOT EXISTS idx_student_locations_student_time 
  ON student_locations (student_id, recorded_at DESC);


-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS (already enabled, ensure consistent state)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shuttles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shuttle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplicate conflicts
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Policy 1: PUBLIC / READ-ONLY TRANSIT DATA (Routes, Stops, Shuttles, Trips, Locations)
-- Anyone (students, public campus transit viewers, drivers, admins) can view public transit info
CREATE POLICY p_routes_select ON routes FOR SELECT USING (true);
CREATE POLICY p_stops_select ON stops FOR SELECT USING (true);
CREATE POLICY p_route_stops_select ON route_stops FOR SELECT USING (true);
CREATE POLICY p_shuttles_select ON shuttles FOR SELECT USING (true);
CREATE POLICY p_trips_select ON trips FOR SELECT USING (true);
CREATE POLICY p_trip_stops_select ON trip_stops FOR SELECT USING (true);
CREATE POLICY p_shuttle_locations_select ON shuttle_locations FOR SELECT USING (true);

-- Policy 2: ADMIN & SERVICE ROLE FULL MANAGEMENT (Routes, Stops, Route_Stops, Shuttles)
CREATE POLICY p_routes_admin_all ON routes FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_stops_admin_all ON stops FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_route_stops_admin_all ON route_stops FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_shuttles_admin_all ON shuttles FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

-- Policy 3: TRIPS & TRIP STOPS MANAGEMENT
CREATE POLICY p_trips_all ON trips FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_trip_stops_all ON trip_stops FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

-- Policy 4: SHUTTLE LOCATIONS INSERT
CREATE POLICY p_shuttle_locations_insert ON shuttle_locations FOR INSERT 
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

-- Policy 5: STUDENT LOCATIONS
CREATE POLICY p_student_locations_select ON student_locations FOR SELECT 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_student_locations_insert ON student_locations FOR INSERT 
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

-- Policy 6: USERS & ROLES
CREATE POLICY p_users_select ON users FOR SELECT USING (true);
CREATE POLICY p_users_all ON users FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_students_select ON students FOR SELECT USING (true);
CREATE POLICY p_students_all ON students FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_drivers_select ON drivers FOR SELECT USING (true);
CREATE POLICY p_drivers_all ON drivers FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_admins_select ON admins FOR SELECT USING (true);
CREATE POLICY p_admins_all ON admins FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

-- Policy 7: DRIVER NOTIFICATIONS & ASSIGNMENTS
CREATE POLICY p_driver_notifications_select ON driver_notifications FOR SELECT USING (true);
CREATE POLICY p_driver_notifications_all ON driver_notifications FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

CREATE POLICY p_driver_assignments_select ON driver_assignments FOR SELECT USING (true);
CREATE POLICY p_driver_assignments_all ON driver_assignments FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR current_user = 'postgres');

