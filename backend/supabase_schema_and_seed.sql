-- ==============================================================================
-- JKLU SHUTTLE TRACKING & CAMPUS TRANSIT MANAGEMENT SYSTEM
-- EXACT RELATIONAL SCHEMA & SEED DATA FOR SUPABASE (POSTGRESQL)
-- Conforming strictly to the Formal EER Schema & Relational Notation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CLEANUP PREVIOUS TABLES (Reverse Dependency Order)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS student_locations CASCADE;
DROP TABLE IF EXISTS shuttle_locations CASCADE;
DROP TABLE IF EXISTS trip_stops CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS shuttles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 2. STRONG ENTITIES
-- ------------------------------------------------------------------------------

-- USERS (Superclass Entity)
CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(30),
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'driver', 'admin'))
);

-- SHUTTLES (Fleet Assets)
CREATE TABLE shuttles (
  shuttle_id VARCHAR(50) PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  capacity INT NOT NULL DEFAULT 32,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OFFLINE')),
  shuttle_number VARCHAR(50) -- UI convenience: 'SHUTTLE 01', 'SHUTTLE 02'
);

-- ROUTES (Transit Corridors)
CREATE TABLE routes (
  route_id VARCHAR(50) PRIMARY KEY,
  route_name VARCHAR(150) NOT NULL,
  total_stops INT NOT NULL DEFAULT 0,
  description TEXT,
  color VARCHAR(20) DEFAULT '#E8590C',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CANCELLED')),
  route_code VARCHAR(30) -- UI convenience: 'R-01', 'R-02', 'R-03'
);

-- STOPS (Geographic Waypoints)
CREATE TABLE stops (
  stop_id VARCHAR(50) PRIMARY KEY,
  stop_name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  is_destination BOOLEAN DEFAULT FALSE,
  description TEXT
);

-- ------------------------------------------------------------------------------
-- 3. SUBCLASSES (IS-A Specialization of USERS)
-- ------------------------------------------------------------------------------

-- STUDENTS
CREATE TABLE students (
  student_id VARCHAR(50) PRIMARY KEY,
  roll_no VARCHAR(50) UNIQUE NOT NULL,
  CONSTRAINT fk_student_user FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- DRIVERS
CREATE TABLE drivers (
  driver_id VARCHAR(50) PRIMARY KEY,
  license_no VARCHAR(50) UNIQUE NOT NULL,
  CONSTRAINT fk_driver_user FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ADMINS
CREATE TABLE admins (
  admin_id VARCHAR(50) PRIMARY KEY,
  designation VARCHAR(150),
  department VARCHAR(150),
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 4. OPERATIONAL ENTITIES
-- ------------------------------------------------------------------------------

-- TRIPS (Dispatches)
CREATE TABLE trips (
  trip_id VARCHAR(50) PRIMARY KEY,
  shuttle_id VARCHAR(50) NOT NULL REFERENCES shuttles(shuttle_id),
  route_id VARCHAR(50) NOT NULL REFERENCES routes(route_id),
  driver_id VARCHAR(50) NOT NULL REFERENCES drivers(driver_id),
  start_time VARCHAR(30) NOT NULL,
  end_time VARCHAR(30),
  running_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (running_status IN ('SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED')),
  capacity_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (capacity_status IN ('AVAILABLE', 'MODERATE', 'FULL')),
  speed_kmh NUMERIC(5, 2) DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 5. RELATIONSHIP RELATIONS (Associative Tables with Composite Keys)
-- ------------------------------------------------------------------------------

-- ROUTE_STOPS (Route Waypoints Sequence)
CREATE TABLE route_stops (
  route_id VARCHAR(50) NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_id VARCHAR(50) NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  sequence_number INT NOT NULL,
  scheduled_arrival VARCHAR(30),
  scheduled_departure VARCHAR(30),
  cumulative_distance_km NUMERIC(5, 2) DEFAULT 0,
  PRIMARY KEY (route_id, stop_id)
);

-- TRIP_STOPS (Trip Arrival & Stop Status Tracking)
CREATE TABLE trip_stops (
  trip_id VARCHAR(50) NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
  stop_id VARCHAR(50) NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  estimated_arrival VARCHAR(30),
  actual_arrival VARCHAR(30),
  actual_departure VARCHAR(30),
  arrival_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (arrival_status IN ('SCHEDULED', 'APPROACHING', 'ARRIVED', 'COMPLETED', 'SKIPPED')),
  PRIMARY KEY (trip_id, stop_id)
);

-- ------------------------------------------------------------------------------
-- 6. WEAK ENTITIES (Telemetry & Audit Records)
-- ------------------------------------------------------------------------------

-- SHUTTLE_LOCATIONS (Telemetry Stream)
CREATE TABLE shuttle_locations (
  location_id BIGSERIAL PRIMARY KEY,
  shuttle_id VARCHAR(50) NOT NULL REFERENCES shuttles(shuttle_id),
  trip_id VARCHAR(50) REFERENCES trips(trip_id) ON DELETE CASCADE,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  bearing NUMERIC(5, 2) DEFAULT 0,
  speed_kmh NUMERIC(5, 2) DEFAULT 0,
  progress_percentage NUMERIC(5, 2) DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STUDENT_LOCATIONS (Student GPS Radar History)
CREATE TABLE student_locations (
  location_id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. SEED DATA (JKLU Campus & Jaipur Metro Transit)
-- ------------------------------------------------------------------------------

-- USERS (Password for all accounts is 'password123' hashed with bcrypt)
INSERT INTO users (user_id, name, email, password_hash, phone_number, role) VALUES
  ('USR-STU-001', 'Pratham Lalwani', 'pratham.lalwani@jklu.edu.in', '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', '+91 98290 12345', 'student'),
  ('USR-ADM-001', 'Prof. Anurag Sharma', 'admin@jklu.edu.in', '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', '+91 98290 88200', 'admin'),
  ('DRV-101', 'Ramesh Kumar', 'ramesh.kumar@jklu.edu.in', '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', '+91 94140 55210', 'driver'),
  ('DRV-102', 'Vikram Singh', 'vikram.singh@jklu.edu.in', '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', '+91 98281 77341', 'driver'),
  ('DRV-103', 'Rajesh Meena', 'rajesh.meena@jklu.edu.in', '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', '+91 97845 33201', 'driver'),
  ('DRV-104', 'Devendra Sharma', 'devendra.sharma@jklu.edu.in', '$2a$10$wE0vP4uA5JmN6g4i9.rX5.zY7G9eX3K3P1Q7vE1Y7H1eW2Q3R4T5Y', '+91 96102 99014', 'driver');

-- STUDENTS
INSERT INTO students (student_id, roll_no) VALUES
  ('USR-STU-001', '2024BTECH042');

-- DRIVERS
INSERT INTO drivers (driver_id, license_no) VALUES
  ('DRV-101', 'RJ14-2018-00912'),
  ('DRV-102', 'RJ14-2016-00482'),
  ('DRV-103', 'RJ14-2019-01183'),
  ('DRV-104', 'RJ14-2015-00774');

-- ADMINS
INSERT INTO admins (admin_id, designation, department) VALUES
  ('USR-ADM-001', 'Head of Campus Transit & Operations Incharge', 'JKLU Transport & Mobility Cell');

-- SHUTTLES
INSERT INTO shuttles (shuttle_id, registration_number, capacity, status, shuttle_number) VALUES
  ('SHT-01', 'RJ 14 PA 8842', 32, 'ACTIVE', 'SHUTTLE 01'),
  ('SHT-02', 'RJ 14 PA 9120', 32, 'ACTIVE', 'SHUTTLE 02'),
  ('SHT-03', 'RJ 14 PB 1045', 28, 'ACTIVE', 'SHUTTLE 03'),
  ('SHT-04', 'RJ 14 PB 4099', 36, 'ACTIVE', 'SHUTTLE 04');

-- ROUTES
INSERT INTO routes (route_id, route_name, total_stops, description, color, status, route_code) VALUES
  ('ROUTE-01', 'JKLU ⟲ MALVIYA NAGAR CIRCUIT', 5, 'JKLU Campus → Malviya Nagar → Airport → DCM → JKLU Campus', '#E8590C', 'ACTIVE', 'R-01'),
  ('ROUTE-02', 'JKLU ⟲ MANSAROVAR CIRCUIT', 5, 'JKLU Campus → Mansarovar Metro → Vaishali Nagar → DCM → JKLU Campus', '#2B4C7E', 'ACTIVE', 'R-02'),
  ('ROUTE-03', 'JKLU ⟲ RAILWAY STATION CIRCUIT', 5, 'JKLU Campus → Railway Station → Vaishali Nagar → DCM → JKLU Campus', '#D97706', 'ACTIVE', 'R-03');

-- STOPS (Campus Origins & Jaipur Transit Nodes)
INSERT INTO stops (stop_id, stop_name, latitude, longitude, is_destination, description) VALUES
  ('STOP-JKLU-START', 'JKLU CAMPUS (ORIGIN)', 26.837300, 75.649900, FALSE, 'JKLU Departure Bus Bay • University Mobility Origin'),
  ('STOP-JKLU', 'JKLU CAMPUS (TERMINUS)', 26.837300, 75.649900, TRUE, 'JK Lakshmipat University • Final Arrival Terminus'),
  ('STOP-MANSAROVAR', 'MANSAROVAR', 26.873200, 75.766800, FALSE, 'Pillar 34, New Sanganer Road & Metro Hub'),
  ('STOP-VAISHALI', 'VAISHALI NAGAR', 26.907500, 75.748500, FALSE, 'Amrapali Circle & Gandhi Path Junction'),
  ('STOP-DCM', 'DCM', 26.886500, 75.742000, FALSE, 'DCM Flyover Junction & Ajmer Expressway Hub'),
  ('STOP-MALVIYA-NAGAR', 'MALVIYA NAGAR', 26.854000, 75.815000, FALSE, 'Gaurav Tower (GT) / Calgiri Hospital Circle'),
  ('STOP-AIRPORT', 'JAIPUR AIRPORT', 26.828800, 75.805500, FALSE, 'Terminal 2 Entrance, Sanganer'),
  ('STOP-RAILWAY-STN', 'JAIPUR JUNCTION', 26.919000, 75.788500, FALSE, 'Jaipur Junction Railway Station (North Terminal)'),
  ('STOP-SINDHI-CAMP', 'SINDHI CAMP', 26.923000, 75.799000, FALSE, 'Central Inter-State Bus Terminal (ISBT)'),
  ('STOP-AJMER-ROAD', 'AJMER ROAD', 26.879000, 75.725000, FALSE, '200 Feet Bypass & Ajmer Expressway Highway Hub'),
  ('STOP-CIVIL-LINES', 'CIVIL LINES', 26.902000, 75.779000, FALSE, 'Civil Lines Metro Station & Jacob Road'),
  ('STOP-SODALA', 'SODALA', 26.897000, 75.772000, FALSE, 'Sodala Elevated Road Cut, Ajmer Road'),
  ('STOP-SHYAM-NAGAR', 'SHYAM NAGAR', 26.890000, 75.762000, FALSE, 'Shyam Nagar Metro Station, Janpath'),
  ('STOP-NEW-AATISH-MARKET', 'NEW AATISH MARKET', 26.882000, 75.759000, FALSE, 'New Aatish Market Metro Station Circle'),
  ('STOP-DURGAPURA', 'DURGAPURA', 26.852000, 75.791000, FALSE, 'Durgapura Elevated Road & Railway Junction'),
  ('STOP-JAWAHAR-CIRCLE', 'JAWAHAR CIRCLE', 26.839800, 75.807800, FALSE, 'Patrika Gate & Jawahar Circle Garden'),
  ('STOP-JAGATPURA', 'JAGATPURA', 26.828600, 75.836000, FALSE, 'Jagatpura Railway Overbridge & Institutional Area'),
  ('STOP-PRATAP-NAGAR', 'PRATAP NAGAR', 26.804200, 75.817300, FALSE, 'Kumbha Marg / Haldi Ghati Marg Circle'),
  ('STOP-SITAPURA', 'SITAPURA', 26.782000, 75.828000, FALSE, 'Sitapura Industrial Area & RIICO Transit Hub'),
  ('STOP-MAHAL-ROAD', 'MAHAL ROAD', 26.815000, 75.845000, FALSE, 'Mahal Road Akshay Patra Junction'),
  ('STOP-TONK-PHATAK', 'TONK PHATAK', 26.882000, 75.802000, FALSE, 'Tonk Road Overbridge & Gandhi Nagar Cut'),
  ('STOP-GANDHI-NAGAR', 'GANDHI NAGAR', 26.878000, 75.808000, FALSE, 'Gandhi Nagar Railway Station (Bajaj Nagar)'),
  ('STOP-GOPALPURA', 'GOPALPURA BYPASS', 26.862000, 75.783000, FALSE, 'Gopalpura Bypass Crossing, Tonk Road Junction'),
  ('STOP-BARKAT-NAGAR', 'BARKAT NAGAR', 26.875000, 75.798000, FALSE, 'Barkat Nagar Main Market & Kisan Marg'),
  ('STOP-MAHESH-NAGAR', 'MAHESH NAGAR', 26.878000, 75.778000, FALSE, '80 Feet Road Junction, Mahesh Nagar Police Station'),
  ('STOP-BAPU-NAGAR', 'BAPU NAGAR', 26.892000, 75.812000, FALSE, 'Mangal Marg & University Commerce College Cut'),
  ('STOP-RAJASTHAN-UNI', 'RAJASTHAN UNIVERSITY', 26.898000, 75.816000, FALSE, 'RU Main Gate, JLN Marg Transit Hub'),
  ('STOP-RAMBAGH', 'RAMBAGH CIRCLE', 26.899000, 75.810000, FALSE, 'SMS Stadium & Rambagh Palace Crossing'),
  ('STOP-NARAYAN-SINGH', 'NARAYAN SINGH CIRCLE', 26.907000, 75.819000, FALSE, 'Major City Bus Concourse & JLN Marg Entry'),
  ('STOP-AJMERI-GATE', 'AJMERI GATE', 26.918000, 75.820000, FALSE, 'Walled City Entrance & MI Road Crossway'),
  ('STOP-MI-ROAD', 'MI ROAD', 26.917000, 75.811000, FALSE, 'Panch Batti & Raj Mandir Cinema Promenade'),
  ('STOP-C-SCHEME', 'C-SCHEME', 26.908000, 75.802000, FALSE, 'Ahinsa Circle, Ashok Nagar Transit Point'),
  ('STOP-VIDYADHAR-NAGAR', 'VIDYADHAR NAGAR', 26.962000, 75.776000, FALSE, 'Central Spine Circle, Sector 2'),
  ('STOP-CHANDPOLE', 'CHANDPOLE', 26.924000, 75.813000, FALSE, 'Chandpole Gate & Metro Station Entrance'),
  ('STOP-BANI-PARK', 'BANI PARK', 26.931000, 75.792000, FALSE, 'Collectorate Circle & Kanti Chandra Road'),
  ('STOP-PINK-CITY', 'PINK CITY', 26.922000, 75.824000, FALSE, 'Ajmeri Gate / Walled City Entry'),
  ('STOP-BAPU-BAZAAR', 'BAPU BAZAAR', 26.920000, 75.823000, FALSE, 'Bapu Bazaar Heritage Market Gate'),
  ('STOP-JOHARI-BAZAAR', 'JOHARI BAZAAR', 26.921000, 75.827000, FALSE, 'Sanganeri Gate to Johari Bazaar Corridor'),
  ('STOP-HAWA-MAHAL', 'HAWA MAHAL', 26.923900, 75.826700, FALSE, 'Hawa Mahal Bazaar & Badi Chaupar Transit'),
  ('STOP-CITY-PALACE', 'CITY PALACE', 26.925800, 75.823700, FALSE, 'Jalebi Chowk, City Palace Entrance');

-- ROUTE_STOPS (Ordered Stop Sequence per Circuit)
INSERT INTO route_stops (route_id, stop_id, sequence_number, scheduled_arrival, scheduled_departure, cumulative_distance_km) VALUES
  -- Route 01: JKLU Campus -> Malviya Nagar -> Airport -> DCM -> JKLU Campus
  ('ROUTE-01', 'STOP-JKLU-START', 1, '09:45 AM', '09:50 AM', 0.00),
  ('ROUTE-01', 'STOP-MALVIYA-NAGAR', 2, '10:15 AM', '10:20 AM', 18.50),
  ('ROUTE-01', 'STOP-AIRPORT', 3, '10:35 AM', '10:40 AM', 23.20),
  ('ROUTE-01', 'STOP-DCM', 4, '10:55 AM', '10:58 AM', 35.80),
  ('ROUTE-01', 'STOP-JKLU', 5, '11:15 AM', '11:20 AM', 48.00),

  -- Route 02: JKLU Campus -> Mansarovar Metro -> Vaishali Nagar -> DCM -> JKLU Campus
  ('ROUTE-02', 'STOP-JKLU-START', 1, '09:30 AM', '09:35 AM', 0.00),
  ('ROUTE-02', 'STOP-MANSAROVAR', 2, '10:00 AM', '10:05 AM', 15.20),
  ('ROUTE-02', 'STOP-VAISHALI', 3, '10:20 AM', '10:23 AM', 22.40),
  ('ROUTE-02', 'STOP-DCM', 4, '10:35 AM', '10:38 AM', 28.10),
  ('ROUTE-02', 'STOP-JKLU', 5, '10:55 AM', '11:00 AM', 40.50),

  -- Route 03: JKLU Campus -> Railway Station -> Vaishali Nagar -> DCM -> JKLU Campus
  ('ROUTE-03', 'STOP-JKLU-START', 1, '09:40 AM', '09:45 AM', 0.00),
  ('ROUTE-03', 'STOP-RAILWAY-STN', 2, '10:10 AM', '10:15 AM', 21.00),
  ('ROUTE-03', 'STOP-VAISHALI', 3, '10:30 AM', '10:33 AM', 27.50),
  ('ROUTE-03', 'STOP-DCM', 4, '10:45 AM', '10:48 AM', 33.00),
  ('ROUTE-03', 'STOP-JKLU', 5, '11:05 AM', '11:10 AM', 45.20);


