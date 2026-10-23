import {
  Student,
  Admin,
  StudentLocation
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

// Default initial student campus coordinates (replaced dynamically when real browser GPS is granted)
export const INITIAL_STUDENT_LOCATION: StudentLocation = {
  student_id: 'USR-STU-001',
  latitude: 26.8373,
  longitude: 75.6499,
  timestamp: new Date().toISOString(),
  location_name: 'JK Lakshmipat University Campus'
};
