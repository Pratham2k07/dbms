-- ==============================================================================
-- MIGRATION 001: REAL DATABASE-DRIVEN GPS TRACKING, ROAD ROUTING & TELEMETRY
-- ==============================================================================

-- 1. Routes: Road-following geometry and road distances
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_coordinates JSONB;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC(6, 2) DEFAULT 0;

-- 2. Route Stops: Segment distances between stops
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS distance_from_prev_km NUMERIC(6, 2) DEFAULT 0;

-- 3. Trips: Daily trip lifecycle and operating date constraint
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE;

-- Add unique constraint for daily trips (route_id + trip_date + start_time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_daily_trip_per_route'
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT unique_daily_trip_per_route UNIQUE (route_id, trip_date, start_time);
  END IF;
END $$;

-- 4. Shuttle Locations: Real GPS telemetry columns & indexes
ALTER TABLE shuttle_locations ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50) REFERENCES drivers(driver_id);
ALTER TABLE shuttle_locations ADD COLUMN IF NOT EXISTS accuracy_m NUMERIC(6, 2);
ALTER TABLE shuttle_locations ADD COLUMN IF NOT EXISTS gps_timestamp TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_shuttle_loc_trip_time ON shuttle_locations (trip_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_shuttle_loc_shuttle_time ON shuttle_locations (shuttle_id, recorded_at DESC);

-- 5. Student Locations: Real student GPS telemetry columns & indexes
ALTER TABLE student_locations ADD COLUMN IF NOT EXISTS accuracy_m NUMERIC(6, 2);
ALTER TABLE student_locations ADD COLUMN IF NOT EXISTS gps_timestamp TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_student_loc_student_time ON student_locations (student_id, recorded_at DESC);

-- 6. Trip Stops: Fast indexing
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON trip_stops (trip_id, arrival_status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (running_status, trip_date);
