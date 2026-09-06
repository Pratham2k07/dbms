# JKLU Shuttle — University Shuttle Tracking System

**An official-style digital transit service for JK Lakshmipat University (JKLU)**  
*Campus Mobility, Real-Time Telemetry & Relational DBMS Architecture*

---

## 🚌 Overview

**JKLU Shuttle** is a mobile-first university shuttle tracking system engineered specifically for students, faculty, and shuttle drivers of **JK Lakshmipat University (JKLU)** in Jaipur, Rajasthan.

Inspired by the editorial, minimal, and authoritative design language of the [official JKLU website](https://jklu.edu.in/), the application translates an institutional academic identity into a high-precision real-time transportation service.

### Core Student Principle: No Destination Search
### 🛣️ Arterial Corridors & Circuits (Start & End at JKLU Campus)
Every trip operates as a designated university transport circuit that **departs from JKLU Campus and terminates back at JKLU Campus**:
* **Route 01 (`R-01`)**: **JKLU Campus (Origin)** $\longrightarrow$ Malviya Nagar $\longrightarrow$ Jaipur Airport $\longrightarrow$ DCM (Ajmer Road) $\longrightarrow$ **JKLU Campus (Terminus)**
* **Route 02 (`R-02`)**: **JKLU Campus (Origin)** $\longrightarrow$ Mansarovar Metro $\longrightarrow$ Vaishali Nagar $\longrightarrow$ DCM (Ajmer Road) $\longrightarrow$ **JKLU Campus (Terminus)**
* **Route 03 (`R-03`)**: **JKLU Campus (Origin)** $\longrightarrow$ Railway Station $\longrightarrow$ Vaishali Nagar $\longrightarrow$ DCM (Ajmer Road) $\longrightarrow$ **JKLU Campus (Terminus)**

> **Shared Transit Hubs**: **DCM (Ajmer Road)** is shared across all 3 routes, and **Vaishali Nagar** is shared across Route 02 and Route 03. Both the departure bay and the arrival terminus are located at **JKLU Campus**.

Therefore, students are never asked *"Where do you want to go?"*. Instead, the system automatically detects:

$$\text{CURRENT LOCATION} \longrightarrow \text{NEAREST STOPS} \longrightarrow \text{UPCOMING SHUTTLES} \longrightarrow \text{LIVE TRACKING}$$

---

## 🎨 Visual Identity & Design Philosophy

- **Color Palette**:
  - **Background**: Warm Off-White (`#FBFBF9`, `#F4F3EE`)
  - **Primary Text & Structure**: Deep Charcoal / Near Black (`#121316`, `#141518`)
  - **Institutional Accent**: Curated Warm JKLU Orange (`#E8590C`, `#D9480F`)
  - **Technology Accent**: Academic Slate & Muted Blue (`#2B4C7E`, `#343A40`)
  - **Status Indicators**: Professional Muted Green (`#2B8A3E`), Amber (`#D97706`), and Full Red (`#C92A2A`)
- **Typography**: Editorial typography using Google Fonts (**Outfit**, **Plus Jakarta Sans**, and **JetBrains Mono**). Numbers are treated as bold visual design elements (e.g. `05 MIN`, `01 MAIN GATE`).
- **Layout**: Generous whitespace, clean hairline dividers, custom vector cartography (avoiding generic Google Maps styling), and expandable bottom sheets.

---

## 📱 The 8 Screens & User Journey

1. **Splash Screen (`SplashScreen.tsx`)**:
   - Institutional JKLU emblem + minimal shuttle geometric emblem.
   - Animated SVG route drawing with shuttle travelling along the path.
   - Smooth automatic transition into Location Loading.
2. **Location Loading Screen (`LocationLoadingScreen.tsx`)**:
   - Editorial heading: *"FINDING YOUR LOCATION"*.
   - Animated geometric map grid showing the student's GPS coordinate appearing and radiating connecting lines to nearby stops.
3. **Home / Nearby Stops (`HomeScreen.tsx`)**:
   - Student greeting: *"Good morning, Pratham. Find the fastest way to your next ride."*
   - Current Location card: *📍 Near University Hostel*.
   - Large interactive vector map displaying the student's pulsing marker, stop pins, and moving shuttles with direction bearings.
   - Ordered Nearby Stops list sorted by geographic distance (Haversine calculation), walking times, and approaching shuttle counts.
4. **Stop Details (`StopDetailsScreen.tsx`)**:
   - Focused stop view (`MAIN GATE`, distance & walk time).
   - Mini clean vector map highlighting student, selected stop, and approaching fleet.
   - Upcoming Shuttles list with dominant visual ETA (`05 MIN`), estimated vs scheduled arrival times, and capacity badge (`● AVAILABLE` / `● FULL`).
5. **Live Shuttle Tracking (`LiveTrackingScreen.tsx`)** *(Signature Screen)*:
   - Occupies ~60% of the viewport with a live map following the exact route polyline.
   - Shuttle smoothly interpolates coordinates along road segments.
   - University final stop indicated by an architectural JKLU Campus crest.
   - Expandable Bottom Sheet with dominant ETA (`05 MIN`), speed telemetry, driver assignment, and vertical route timeline.
6. **Route Details (`RouteDetailsScreen.tsx`)**:
   - Route corridor metadata (Route ID `R-02`, Total Stops, Active Fleet count).
   - Sequential stop list with shared stop badges (`Shared: R-01, R-03`).
   - Route tabs to inspect Route 01, Route 02, and Route 03 with shared stops.
7. **Driver Dashboard (`DriverDashboardScreen.tsx`)**:
   - Clean, focused driver interface (authenticated for Ramesh Kumar).
   - Current assignment: Trip `T-102`, Shuttle `SHUTTLE 01`, Route `CITY CENTER → JKLU`.
   - Primary action: `START TRIP` $\rightarrow$ `TRIP IN PROGRESS` $\rightarrow$ `END TRIP`.
   - Real-time Capacity management: `MARK AS FULL` / `MARK AS AVAILABLE` with instant live reflection across all student screens.
   - Driver GPS telemetry status: Broadcasts high-precision coordinates.
8. **Student Profile (`ProfileScreen.tsx`)**:
   - Profile identity: Pratham Lalwani (Roll No: `2024BTECH042`, `pratham.lalwani@jklu.edu.in`).
   - Preferences: High-Precision Location toggle, Approaching Alerts toggle.
   - University Transport Desk helpline popup (`+91 141 710 7500`).
   - Faculty viva & demonstration tools: Trigger arrival alerts, reset simulation, replay splash screen, switch to driver mode.

---

## 🗄️ Database Model (Relational DBMS Architecture)

The system adheres strictly to the university transportation database schema:

```
USERS (user_id, name, phone_number)
  ├── STUDENT (student_id, roll_no, email) [IS-A USER]
  └── DRIVER (driver_id, license_no)       [IS-A USER]

ROUTE (route_id, route_name, route_code, total_stops, description, color)
  ├── TRIPS (1-to-Many)
  └── ROUTE_STOP (route_id, stop_id, sequence_number)
        └── STOP (stop_id, stop_name, latitude, longitude, is_destination)

SHUTTLE (shuttle_id, shuttle_number, registration_number, capacity, status)
  └── operates TRIP

TRIP (trip_id, shuttle_id, route_id, driver_id, start_time, end_time, running_status, capacity_status, speed_kmh)
  ├── TRIP_STOP (trip_id, stop_id, scheduled_arrival, estimated_arrival, arrival_status)
  └── SHUTTLE_LOCATION (latitude, longitude, bearing, progress_percentage, timestamp)

STUDENT_LOCATION (student_id, latitude, longitude, timestamp, location_name)
```

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Typography**: Google Fonts (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*)
- **Icons**: Lucide React
- **Architecture**:
  - `src/types/database.ts` & `src/types/ui.ts` — strict DBMS & UI typing
  - `src/data/mockDatabase.ts` — realistic Jaipur / JKLU campus transit data
  - `src/services/locationService.ts` — Haversine distance & pedestrian walk time algorithms
  - `src/services/shuttleService.ts` — smooth polyline GPS interpolation & bearing calculations
  - `src/services/tripService.ts` — trip lifecycle & driver capacity states
  - `src/services/routeService.ts` — corridor resolution & shared stop mappings
  - `src/context/AppContext.tsx` — centralized reactive state provider with live simulation loop

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

On desktop screens, the application presents a dual view:
- **Left**: Faculty Demonstration & DBMS Overview Panel (Screen jumper, mobile viewport switcher: 375px, 390px, 412px, 430px).
- **Center**: High-fidelity mobile device container mimicking native iOS / Android execution.
