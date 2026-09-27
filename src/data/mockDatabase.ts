import {
  Student,
  Driver,
  Admin,
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

export const CURRENT_ADMIN: Admin = {
  user_id: 'USR-ADM-001',
  admin_id: 'ADM-001',
  name: 'Prof. Anurag Sharma',
  email: 'admin@jklu.edu.in',
  phone_number: '+91 98290 88200',
  designation: 'Head of Campus Transit & Operations Incharge',
  department: 'JKLU Transport & Mobility Cell'
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

// All stops available in university transit database (38 Jaipur Locations + JKLU Campus)
export const MOCK_STOPS: Stop[] = [
  // --- University Terminus & Origin ---
  {
    stop_id: 'STOP-JKLU-START',
    stop_name: 'JKLU CAMPUS (ORIGIN)',
    latitude: 26.8373,
    longitude: 75.6499,
    description: 'JKLU Departure Bus Bay • University Mobility Origin'
  },
  {
    stop_id: 'STOP-JKLU',
    stop_name: 'JKLU CAMPUS (TERMINUS)',
    latitude: 26.8373,
    longitude: 75.6499,
    is_destination: true,
    description: 'JK Lakshmipat University • Final Arrival Terminus'
  },

  // --- 38 Jaipur Transit Locations ---
  {
    stop_id: 'STOP-AMER',
    stop_name: 'AMER',
    latitude: 26.9855,
    longitude: 75.8507,
    description: 'Amer Town Bus Stand & Historical Heritage Hub'
  },
  {
    stop_id: 'STOP-JAL-MAHAL',
    stop_name: 'JAL MAHAL',
    latitude: 26.9534,
    longitude: 75.8462,
    description: 'Man Sagar Lake Promenade, Amer Road'
  },
  {
    stop_id: 'STOP-KUKAS',
    stop_name: 'KUKAS',
    latitude: 27.0543,
    longitude: 75.8973,
    description: 'Kukas Industrial & Educational Zone, NH-11C'
  },
  {
    stop_id: 'STOP-AMER-FORT',
    stop_name: 'AMER FORT',
    latitude: 26.9855,
    longitude: 75.8513,
    description: 'Amer Palace Main Gate & Tourist Transit Drop'
  },
  {
    stop_id: 'STOP-DELHI-ROAD',
    stop_name: 'DELHI ROAD',
    latitude: 26.9740,
    longitude: 75.8760,
    description: 'Delhi-Jaipur Highway (NH-48) Junction'
  },
  {
    stop_id: 'STOP-JAGATPURA',
    stop_name: 'JAGATPURA',
    latitude: 26.8286,
    longitude: 75.8360,
    description: 'Jagatpura Railway Overbridge & Institutional Area'
  },
  {
    stop_id: 'STOP-PRATAP-NAGAR',
    stop_name: 'PRATAP NAGAR',
    latitude: 26.8042,
    longitude: 75.8173,
    description: 'Kumbha Marg / Haldi Ghati Marg Circle'
  },
  {
    stop_id: 'STOP-SITAPURA',
    stop_name: 'SITAPURA',
    latitude: 26.7820,
    longitude: 75.8280,
    description: 'Sitapura Industrial Area & RIICO Transit Hub'
  },
  {
    stop_id: 'STOP-MAHAL-ROAD',
    stop_name: 'MAHAL ROAD',
    latitude: 26.8150,
    longitude: 75.8450,
    description: 'Mahal Road Akshay Patra Junction'
  },
  {
    stop_id: 'STOP-MANSAROVAR',
    stop_name: 'MANSAROVAR',
    latitude: 26.8732,
    longitude: 75.7668,
    description: 'Pillar 34, New Sanganer Road & Metro Hub'
  },
  {
    stop_id: 'STOP-NEW-AATISH-MARKET',
    stop_name: 'NEW AATISH MARKET',
    latitude: 26.8820,
    longitude: 75.7590,
    description: 'New Aatish Market Metro Station Circle'
  },
  {
    stop_id: 'STOP-DURGAPURA',
    stop_name: 'DURGAPURA',
    latitude: 26.8520,
    longitude: 75.7910,
    description: 'Durgapura Elevated Road & Railway Junction'
  },
  {
    stop_id: 'STOP-MALVIYA-NAGAR',
    stop_name: 'MALVIYA NAGAR',
    latitude: 26.8540,
    longitude: 75.8150,
    description: 'Gaurav Tower (GT) / Calgiri Hospital Circle'
  },
  {
    stop_id: 'STOP-JAWAHAR-CIRCLE',
    stop_name: 'JAWAHAR CIRCLE',
    latitude: 26.8398,
    longitude: 75.8078,
    description: 'Patrika Gate & Jawahar Circle Garden'
  },
  {
    stop_id: 'STOP-AIRPORT',
    stop_name: 'JAIPUR AIRPORT',
    latitude: 26.8288,
    longitude: 75.8055,
    description: 'Terminal 2 Circle, Sanganer Highway'
  },
  {
    stop_id: 'STOP-TONK-ROAD',
    stop_name: 'TONK ROAD',
    latitude: 26.8650,
    longitude: 75.7990,
    description: 'Tonk Road Bus Bay, Gopalpura Flyover Cut'
  },
  {
    stop_id: 'STOP-WTP',
    stop_name: 'WORLD TRADE PARK',
    latitude: 26.8530,
    longitude: 75.8050,
    description: 'World Trade Park (WTP) JLN Marg Entry'
  },
  {
    stop_id: 'STOP-GAURAV-TOWER',
    stop_name: 'GAURAV TOWER',
    latitude: 26.8550,
    longitude: 75.8060,
    description: 'GT Central Retail Circle, Malviya Nagar'
  },
  {
    stop_id: 'STOP-SANGANER',
    stop_name: 'SANGANER',
    latitude: 26.8170,
    longitude: 75.7770,
    description: 'Sanganer Stadium & Bus Stand Circle'
  },
  {
    stop_id: 'STOP-C-SCHEME',
    stop_name: 'C-SCHEME',
    latitude: 26.9100,
    longitude: 75.7980,
    description: 'Statue Circle & Bhagwan Das Road Junction'
  },
  {
    stop_id: 'STOP-MI-ROAD',
    stop_name: 'MI ROAD',
    latitude: 26.9160,
    longitude: 75.8100,
    description: 'Panch Batti, Mirza Ismail (MI) Road'
  },
  {
    stop_id: 'STOP-SINDHI-CAMP',
    stop_name: 'SINDHI CAMP',
    latitude: 26.9230,
    longitude: 75.7980,
    description: 'Central Inter-State Bus Terminal (ISBT)'
  },
  {
    stop_id: 'STOP-RAILWAY-STN',
    stop_name: 'JAIPUR JUNCTION',
    latitude: 26.9190,
    longitude: 75.7885,
    description: 'Jaipur Junction Railway Station (North Terminal)'
  },
  {
    stop_id: 'STOP-CHANDPOLE',
    stop_name: 'CHANDPOLE',
    latitude: 26.9240,
    longitude: 75.8130,
    description: 'Chandpole Gate & Metro Station Entrance'
  },
  {
    stop_id: 'STOP-BANI-PARK',
    stop_name: 'BANI PARK',
    latitude: 26.9310,
    longitude: 75.7920,
    description: 'Collectorate Circle & Kanti Chandra Road'
  },
  {
    stop_id: 'STOP-PINK-CITY',
    stop_name: 'PINK CITY',
    latitude: 26.9220,
    longitude: 75.8240,
    description: 'Ajmeri Gate / Walled City Entry'
  },
  {
    stop_id: 'STOP-BAPU-BAZAAR',
    stop_name: 'BAPU BAZAAR',
    latitude: 26.9200,
    longitude: 75.8230,
    description: 'Bapu Bazaar Heritage Market Gate'
  },
  {
    stop_id: 'STOP-JOHARI-BAZAAR',
    stop_name: 'JOHARI BAZAAR',
    latitude: 26.9210,
    longitude: 75.8270,
    description: 'Sanganeri Gate to Johari Bazaar Corridor'
  },
  {
    stop_id: 'STOP-HAWA-MAHAL',
    stop_name: 'HAWA MAHAL',
    latitude: 26.9239,
    longitude: 75.8267,
    description: 'Hawa Mahal Bazaar & Badi Chaupar Transit'
  },
  {
    stop_id: 'STOP-CITY-PALACE',
    stop_name: 'CITY PALACE',
    latitude: 26.9258,
    longitude: 75.8237,
    description: 'Jalebi Chowk, City Palace Entrance'
  },
  {
    stop_id: 'STOP-JANTAR-MANTAR',
    stop_name: 'JANTAR MANTAR',
    latitude: 26.9248,
    longitude: 75.8246,
    description: 'UNESCO World Heritage Observatory Gate'
  },
  {
    stop_id: 'STOP-DCM',
    stop_name: 'DCM',
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
    stop_id: 'STOP-SODALA',
    stop_name: 'SODALA',
    latitude: 26.8970,
    longitude: 75.7720,
    description: 'Sodala Elevated Road Cut, Ajmer Road'
  },
  {
    stop_id: 'STOP-SHYAM-NAGAR',
    stop_name: 'SHYAM NAGAR',
    latitude: 26.8900,
    longitude: 75.7620,
    description: 'Shyam Nagar Metro Station, Janpath'
  },
  {
    stop_id: 'STOP-AJMER-ROAD',
    stop_name: 'AJMER ROAD',
    latitude: 26.8790,
    longitude: 75.7250,
    description: '200 Feet Bypass & Ajmer Expressway Highway Hub'
  },
  {
    stop_id: 'STOP-CIVIL-LINES',
    stop_name: 'CIVIL LINES',
    latitude: 26.9020,
    longitude: 75.7790,
    description: 'Civil Lines Metro Station & Jacob Road'
  },
  {
    stop_id: 'STOP-VIDYADHAR-NAGAR',
    stop_name: 'VIDYADHAR NAGAR',
    latitude: 26.9620,
    longitude: 75.7760,
    description: 'Central Spine Circle, Sector 2'
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
