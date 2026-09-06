import {
  Student,
  Driver,
  Route,
  Stop,
  Shuttle,
  Trip,
  RouteStop,
  TripStop,
  StudentLocation,
  ShuttleLocation
} from '../types/database';

export const CURRENT_STUDENT: Student = {
  user_id: 'USR-STU-001',
  student_id: 'STU-2024-042',
  name: 'Pratham Lalwani',
  roll_no: '2024BTECH042',
  email: 'pratham.lalwani@jklu.edu.in',
  phone_number: '+91 98290 12345'
};

// Student boarding point located in Jaipur city near Mansarovar Metro
export const INITIAL_STUDENT_LOCATION: StudentLocation = {
  student_id: 'STU-2024-042',
  latitude: 26.8745,
  longitude: 75.7680,
  timestamp: new Date().toISOString(),
  location_name: 'Near Mansarovar Metro Station, Jaipur'
};

export const MOCK_DRIVERS: Driver[] = [
  {
    user_id: 'USR-DRV-001',
    driver_id: 'DRV-101',
    name: 'Ramesh Kumar',
    phone_number: '+91 94140 55210',
    license_no: 'RJ14-2018-00912',
    assigned_shuttle_id: 'SHT-01'
  },
  {
    user_id: 'USR-DRV-002',
    driver_id: 'DRV-102',
    name: 'Vikram Singh',
    phone_number: '+91 98281 77341',
    license_no: 'RJ14-2016-00482',
    assigned_shuttle_id: 'SHT-02'
  },
  {
    user_id: 'USR-DRV-003',
    driver_id: 'DRV-103',
    name: 'Rajesh Meena',
    phone_number: '+91 97845 33201',
    license_no: 'RJ14-2019-01183',
    assigned_shuttle_id: 'SHT-03'
  },
  {
    user_id: 'USR-DRV-004',
    driver_id: 'DRV-104',
    name: 'Devendra Sharma',
    phone_number: '+91 96102 99014',
    license_no: 'RJ14-2015-00774',
    assigned_shuttle_id: 'SHT-04'
  }
];

// All trips start at JKLU Campus (Origin) and end at JKLU Campus (Terminus)
export const MOCK_STOPS: Stop[] = [
  {
    stop_id: 'STOP-JKLU-START',
    stop_name: 'JKLU CAMPUS (ORIGIN)',
    latitude: 26.8373,
    longitude: 75.6499,
    description: 'JKLU Campus Departure Bus Bay • Start of Circuit'
  },
  {
    stop_id: 'STOP-MANSAROVAR',
    stop_name: 'MANSAROVAR METRO',
    latitude: 26.8732,
    longitude: 75.7668,
    description: 'Pillar 34, New Sanganer Road Transit Hub'
  },
  {
    stop_id: 'STOP-DCM',
    stop_name: 'DCM (AJMER ROAD)',
    latitude: 26.8865,
    longitude: 75.7420,
    description: 'DCM Flyover Junction & Ajmer Expressway Hub'
  },
  {
    stop_id: 'STOP-VAISHALI',
    stop_name: 'VAISHALI NAGAR',
    latitude: 26.9075,
    longitude: 75.7485,
    description: 'Amrapali Circle & Gandhi Path Junction'
  },
  {
    stop_id: 'STOP-AIRPORT',
    stop_name: 'JAIPUR AIRPORT',
    latitude: 26.8288,
    longitude: 75.8055,
    description: 'Terminal 2 Circle, Sanganer Highway'
  },
  {
    stop_id: 'STOP-MALVIYA-NAGAR',
    stop_name: 'MALVIYA NAGAR',
    latitude: 26.8540,
    longitude: 75.8150,
    description: 'Gaurav Tower (GT) / Calgiri Hospital Circle'
  },
  {
    stop_id: 'STOP-RAILWAY-STN',
    stop_name: 'RAILWAY STATION',
    latitude: 26.9190,
    longitude: 75.7885,
    description: 'Jaipur Junction North Terminal'
  },
  {
    stop_id: 'STOP-JKLU',
    stop_name: 'JKLU CAMPUS (TERMINUS)',
    latitude: 26.8373,
    longitude: 75.6499,
    is_destination: true,
    description: 'JK Lakshmipat University - Final Arrival Terminus'
  }
];

export const MOCK_ROUTES: Route[] = [
  {
    route_id: 'ROUTE-01',
    route_code: 'R-01',
    route_name: 'JKLU ⟲ MALVIYA NAGAR CIRCUIT',
    total_stops: 5,
    description: 'JKLU Campus → Malviya Nagar → Airport → DCM → JKLU Campus',
    color: '#E8590C'
  },
  {
    route_id: 'ROUTE-02',
    route_code: 'R-02',
    route_name: 'JKLU ⟲ MANSAROVAR CIRCUIT',
    total_stops: 5,
    description: 'JKLU Campus → Mansarovar Metro → Vaishali Nagar → DCM → JKLU Campus',
    color: '#2B4C7E'
  },
  {
    route_id: 'ROUTE-03',
    route_code: 'R-03',
    route_name: 'JKLU ⟲ RAILWAY STATION CIRCUIT',
    total_stops: 5,
    description: 'JKLU Campus → Railway Station → Vaishali Nagar → DCM → JKLU Campus',
    color: '#D97706'
  }
];

// RouteStops: Each circuit starts at JKLU Campus, traverses Jaipur stops, and ends at JKLU Campus
export const MOCK_ROUTE_STOPS: RouteStop[] = [
  // Route 01: JKLU Campus -> Malviya Nagar -> Airport -> DCM -> JKLU Campus
  { route_id: 'ROUTE-01', stop_id: 'STOP-JKLU-START', sequence_number: 1 },
  { route_id: 'ROUTE-01', stop_id: 'STOP-MALVIYA-NAGAR', sequence_number: 2 },
  { route_id: 'ROUTE-01', stop_id: 'STOP-AIRPORT', sequence_number: 3 },
  { route_id: 'ROUTE-01', stop_id: 'STOP-DCM', sequence_number: 4 },
  { route_id: 'ROUTE-01', stop_id: 'STOP-JKLU', sequence_number: 5 },

  // Route 02: JKLU Campus -> Mansarovar Metro -> Vaishali Nagar -> DCM -> JKLU Campus
  { route_id: 'ROUTE-02', stop_id: 'STOP-JKLU-START', sequence_number: 1 },
  { route_id: 'ROUTE-02', stop_id: 'STOP-MANSAROVAR', sequence_number: 2 },
  { route_id: 'ROUTE-02', stop_id: 'STOP-VAISHALI', sequence_number: 3 },
  { route_id: 'ROUTE-02', stop_id: 'STOP-DCM', sequence_number: 4 },
  { route_id: 'ROUTE-02', stop_id: 'STOP-JKLU', sequence_number: 5 },

  // Route 03: JKLU Campus -> Railway Station -> Vaishali Nagar -> DCM -> JKLU Campus
  { route_id: 'ROUTE-03', stop_id: 'STOP-JKLU-START', sequence_number: 1 },
  { route_id: 'ROUTE-03', stop_id: 'STOP-RAILWAY-STN', sequence_number: 2 },
  { route_id: 'ROUTE-03', stop_id: 'STOP-VAISHALI', sequence_number: 3 },
  { route_id: 'ROUTE-03', stop_id: 'STOP-DCM', sequence_number: 4 },
  { route_id: 'ROUTE-03', stop_id: 'STOP-JKLU', sequence_number: 5 },
];

export const MOCK_SHUTTLES: Shuttle[] = [
  {
    shuttle_id: 'SHT-01',
    shuttle_number: 'SHUTTLE 01',
    registration_number: 'RJ 14 PA 8842',
    capacity: 32,
    status: 'ACTIVE'
  },
  {
    shuttle_id: 'SHT-02',
    shuttle_number: 'SHUTTLE 02',
    registration_number: 'RJ 14 PA 9120',
    capacity: 32,
    status: 'ACTIVE'
  },
  {
    shuttle_id: 'SHT-03',
    shuttle_number: 'SHUTTLE 03',
    registration_number: 'RJ 14 PB 1045',
    capacity: 28,
    status: 'ACTIVE'
  },
  {
    shuttle_id: 'SHT-04',
    shuttle_number: 'SHUTTLE 04',
    registration_number: 'RJ 14 PB 4099',
    capacity: 36,
    status: 'ACTIVE'
  }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    trip_id: 'TRIP-101',
    shuttle_id: 'SHT-01',
    route_id: 'ROUTE-02',
    driver_id: 'DRV-101',
    start_time: '09:30 AM',
    end_time: null,
    running_status: 'RUNNING',
    capacity_status: 'AVAILABLE',
    speed_kmh: 42
  },
  {
    trip_id: 'TRIP-102',
    shuttle_id: 'SHT-03',
    route_id: 'ROUTE-01',
    driver_id: 'DRV-103',
    start_time: '09:45 AM',
    end_time: null,
    running_status: 'RUNNING',
    capacity_status: 'AVAILABLE',
    speed_kmh: 45
  },
  {
    trip_id: 'TRIP-103',
    shuttle_id: 'SHT-02',
    route_id: 'ROUTE-03',
    driver_id: 'DRV-102',
    start_time: '09:40 AM',
    end_time: null,
    running_status: 'RUNNING',
    capacity_status: 'FULL',
    speed_kmh: 38
  },
  {
    trip_id: 'TRIP-104',
    shuttle_id: 'SHT-04',
    route_id: 'ROUTE-02',
    driver_id: 'DRV-104',
    start_time: '11:00 AM',
    end_time: null,
    running_status: 'SCHEDULED',
    capacity_status: 'AVAILABLE',
    speed_kmh: 0
  }
];

export const INITIAL_TRIP_STOPS: TripStop[] = [
  // Trip 101 (Shuttle 01 on Route 02: JKLU Campus -> Mansarovar -> Vaishali -> DCM -> JKLU Campus)
  {
    trip_id: 'TRIP-101',
    stop_id: 'STOP-JKLU-START',
    scheduled_arrival: '09:30 AM',
    scheduled_departure: '09:35 AM',
    estimated_arrival: '09:30 AM',
    actual_arrival: '09:30 AM',
    actual_departure: '09:35 AM',
    arrival_status: 'COMPLETED'
  },
  {
    trip_id: 'TRIP-101',
    stop_id: 'STOP-MANSAROVAR',
    scheduled_arrival: '10:00 AM',
    scheduled_departure: '10:05 AM',
    estimated_arrival: '10:05 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'APPROACHING'
  },
  {
    trip_id: 'TRIP-101',
    stop_id: 'STOP-VAISHALI',
    scheduled_arrival: '10:20 AM',
    scheduled_departure: '10:23 AM',
    estimated_arrival: '10:22 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  },
  {
    trip_id: 'TRIP-101',
    stop_id: 'STOP-DCM',
    scheduled_arrival: '10:35 AM',
    scheduled_departure: '10:38 AM',
    estimated_arrival: '10:36 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  },
  {
    trip_id: 'TRIP-101',
    stop_id: 'STOP-JKLU',
    scheduled_arrival: '10:55 AM',
    scheduled_departure: '11:00 AM',
    estimated_arrival: '10:55 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  },

  // Trip 102 (Shuttle 03 on Route 01: JKLU Campus -> Malviya Nagar -> Airport -> DCM -> JKLU Campus)
  {
    trip_id: 'TRIP-102',
    stop_id: 'STOP-JKLU-START',
    scheduled_arrival: '09:45 AM',
    scheduled_departure: '09:50 AM',
    estimated_arrival: '09:45 AM',
    actual_arrival: '09:45 AM',
    actual_departure: '09:50 AM',
    arrival_status: 'COMPLETED'
  },
  {
    trip_id: 'TRIP-102',
    stop_id: 'STOP-MALVIYA-NAGAR',
    scheduled_arrival: '10:15 AM',
    scheduled_departure: '10:20 AM',
    estimated_arrival: '10:15 AM',
    actual_arrival: '10:15 AM',
    actual_departure: '10:19 AM',
    arrival_status: 'COMPLETED'
  },
  {
    trip_id: 'TRIP-102',
    stop_id: 'STOP-AIRPORT',
    scheduled_arrival: '10:32 AM',
    scheduled_departure: '10:35 AM',
    estimated_arrival: '10:33 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'APPROACHING'
  },
  {
    trip_id: 'TRIP-102',
    stop_id: 'STOP-DCM',
    scheduled_arrival: '10:48 AM',
    scheduled_departure: '10:50 AM',
    estimated_arrival: '10:48 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  },
  {
    trip_id: 'TRIP-102',
    stop_id: 'STOP-JKLU',
    scheduled_arrival: '11:05 AM',
    scheduled_departure: '11:10 AM',
    estimated_arrival: '11:04 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  },

  // Trip 103 (Shuttle 02 on Route 03: JKLU Campus -> Railway Station -> Vaishali -> DCM -> JKLU Campus)
  {
    trip_id: 'TRIP-103',
    stop_id: 'STOP-JKLU-START',
    scheduled_arrival: '09:40 AM',
    scheduled_departure: '09:45 AM',
    estimated_arrival: '09:40 AM',
    actual_arrival: '09:40 AM',
    actual_departure: '09:45 AM',
    arrival_status: 'COMPLETED'
  },
  {
    trip_id: 'TRIP-103',
    stop_id: 'STOP-RAILWAY-STN',
    scheduled_arrival: '10:20 AM',
    scheduled_departure: '10:22 AM',
    estimated_arrival: '10:20 AM',
    actual_arrival: '10:20 AM',
    actual_departure: '10:23 AM',
    arrival_status: 'COMPLETED'
  },
  {
    trip_id: 'TRIP-103',
    stop_id: 'STOP-VAISHALI',
    scheduled_arrival: '10:38 AM',
    scheduled_departure: '10:40 AM',
    estimated_arrival: '10:39 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'APPROACHING'
  },
  {
    trip_id: 'TRIP-103',
    stop_id: 'STOP-DCM',
    scheduled_arrival: '10:48 AM',
    scheduled_departure: '10:50 AM',
    estimated_arrival: '10:49 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  },
  {
    trip_id: 'TRIP-103',
    stop_id: 'STOP-JKLU',
    scheduled_arrival: '11:05 AM',
    scheduled_departure: '11:10 AM',
    estimated_arrival: '11:05 AM',
    actual_arrival: null,
    actual_departure: null,
    arrival_status: 'SCHEDULED'
  }
];

// All route polylines start at JKLU Campus and loop back to JKLU Campus
export const ROUTE_PATH_COORDINATES: Record<string, [number, number][]> = {
  'ROUTE-01': [
    [26.8373, 75.6499], // JKLU Campus Start
    [26.8480, 75.6700], // Mahapura Cut
    [26.8680, 75.7050], // 200 Feet Expressway
    [26.8560, 75.7500], // New Sanganer Bypass
    [26.8430, 75.8110], // Calgiri Marg
    [26.8540, 75.8150], // Malviya Nagar (GT)
    [26.8288, 75.8055], // Jaipur Airport Terminal 2
    [26.8320, 75.7720], // Sanganer Flyover
    [26.8865, 75.7420], // DCM (Ajmer Road)
    [26.8680, 75.7050], // 200 Feet Expressway Return
    [26.8480, 75.6700], // Mahapura Cut
    [26.8373, 75.6499]  // JKLU Campus Terminus
  ],
  'ROUTE-02': [
    [26.8373, 75.6499], // JKLU Campus Start
    [26.8480, 75.6700], // Mahapura Cut
    [26.8650, 75.7000], // Ajmer Road Expressway
    [26.8732, 75.7668], // Mansarovar Metro Station
    [26.8910, 75.7580], // Queens Road link
    [26.9075, 75.7485], // Vaishali Nagar
    [26.8865, 75.7420], // DCM (Ajmer Road)
    [26.8650, 75.7000], // Ajmer Road Return
    [26.8480, 75.6700], // Mahapura Cut
    [26.8373, 75.6499]  // JKLU Campus Terminus
  ],
  'ROUTE-03': [
    [26.8373, 75.6499], // JKLU Campus Start
    [26.8480, 75.6700], // Mahapura Cut
    [26.8650, 75.7000], // Ajmer Road Expressway
    [26.9020, 75.7680], // Civil Lines
    [26.9190, 75.7885], // Railway Station (Jaipur Junction)
    [26.9075, 75.7485], // Vaishali Nagar
    [26.8865, 75.7420], // DCM (Ajmer Road)
    [26.8650, 75.7000], // Ajmer Road Return
    [26.8480, 75.6700], // Mahapura Cut
    [26.8373, 75.6499]  // JKLU Campus Terminus
  ]
};

export const INITIAL_SHUTTLE_LOCATIONS: ShuttleLocation[] = [
  {
    shuttle_id: 'SHT-01',
    trip_id: 'TRIP-101',
    latitude: 26.8780,
    longitude: 75.7620,
    bearing: 250,
    timestamp: new Date().toISOString(),
    progress_percentage: 28,
    current_segment_index: 3
  },
  {
    shuttle_id: 'SHT-03',
    trip_id: 'TRIP-102',
    latitude: 26.8360,
    longitude: 75.7880,
    bearing: 275,
    timestamp: new Date().toISOString(),
    progress_percentage: 45,
    current_segment_index: 6
  },
  {
    shuttle_id: 'SHT-02',
    trip_id: 'TRIP-103',
    latitude: 26.8980,
    longitude: 75.7460,
    bearing: 210,
    timestamp: new Date().toISOString(),
    progress_percentage: 60,
    current_segment_index: 5
  }
];
