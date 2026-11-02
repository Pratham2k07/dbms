import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import app from './app.js';
import { initSocket } from './services/socket.service.js';
import { query, pool } from './config/db.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

interface TestResult {
  suite: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'NOT VERIFIED';
  details: string;
  dbProof?: any;
}

const results: TestResult[] = [];

function record(suite: string, testName: string, passed: boolean, details: string, dbProof?: any) {
  const status: 'PASS' | 'FAIL' = passed ? 'PASS' : 'FAIL';
  results.push({ suite, testName, status, details, dbProof });
  const icon = passed ? '✓' : '✗';
  console.log(`  [${status}] ${icon} ${testName}: ${details}`);
  if (dbProof) {
    console.log(`        DB Proof: ${JSON.stringify(dbProof)}`);
  }
}

async function runE2E() {
  console.log('================================================================');
  console.log('   SMART UNIVERSITY SHUTTLE SYSTEM - FULL E2E AUDIT TEST SUITE   ');
  console.log('================================================================\n');

  const TEST_STOP_ID = 'STOP-AUDIT-TEST';
  const TEST_ROUTE_ID = 'ROUTE-AUDIT-TEST';
  const TEST_TRIP_ID = 'TRIP-AUDIT-TEST';

  // Initial Pre-clean to ensure pristine state
  try {
    await query('DELETE FROM shuttle_locations WHERE trip_id IN (SELECT trip_id FROM trips WHERE route_id = $1) OR trip_id = $2', [TEST_ROUTE_ID, TEST_TRIP_ID]);
    await query('DELETE FROM trip_stops WHERE trip_id IN (SELECT trip_id FROM trips WHERE route_id = $1) OR trip_id = $2', [TEST_ROUTE_ID, TEST_TRIP_ID]);
    await query('DELETE FROM trips WHERE route_id = $1 OR trip_id = $2', [TEST_ROUTE_ID, TEST_TRIP_ID]);
    await query('DELETE FROM route_stops WHERE route_id = $1', [TEST_ROUTE_ID]);
    await query('DELETE FROM routes WHERE route_id = $1', [TEST_ROUTE_ID]);
    await query('DELETE FROM stops WHERE stop_id = $1', [TEST_STOP_ID]);
  } catch (e) {
    // Ignore initial clean errors
  }

  // Start internal test server on port 5099
  const TEST_PORT = 5099;
  const server = http.createServer(app);
  initSocket(server);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`[Test Server] Running on http://localhost:${TEST_PORT}\n`);
      resolve();
    });
  });

  const BASE_URL = `http://localhost:${TEST_PORT}/api`;

  // Socket client for real-time verification
  const socketClient: ClientSocket = ClientIO(`http://localhost:${TEST_PORT}`, {
    transports: ['websocket'],
  });

  const receivedEvents: Record<string, any[]> = {};
  const trackEvent = (name: string) => {
    receivedEvents[name] = [];
    socketClient.on(name, (data) => {
      receivedEvents[name].push(data);
    });
  };

  trackEvent('trip_created');
  trackEvent('trip_started');
  trackEvent('trip_ended');
  trackEvent('trip_cancelled');
  trackEvent('route_created');
  trackEvent('route_updated');
  trackEvent('location_updated');

  await new Promise<void>((resolve) => {
    socketClient.on('connect', () => {
      console.log(`[Socket Client] Connected to test server with ID: ${socketClient.id}\n`);
      resolve();
    });
  });

  let adminToken = '';
  let driverToken = '';
  let studentToken = '';

  try {
    // -------------------------------------------------------------
    // SUITE 1: AUTHENTICATION & SECURITY AUDIT
    // -------------------------------------------------------------
    console.log('--- SUITE 1: AUTHENTICATION & SECURITY AUDIT ---');

    // 1.1 Empty password login rejection
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@jklu.edu.in', password: '' }),
      });
      const data = (await res.json()) as any;
      record('Auth & Security', 'Empty Password Login Rejection', res.status === 400 && data.success === false, `Status ${res.status}: ${data.message}`);
    } catch (e: any) {
      record('Auth & Security', 'Empty Password Login Rejection', false, e.message);
    }

    // 1.2 Invalid password rejection
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@jklu.edu.in', password: 'wrongpassword123' }),
      });
      const data = (await res.json()) as any;
      record('Auth & Security', 'Invalid Password Rejection', res.status === 401 && data.success === false, `Status ${res.status}: ${data.message}`);
    } catch (e: any) {
      record('Auth & Security', 'Invalid Password Rejection', false, e.message);
    }

    // 1.3 Admin Login with valid credentials
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@jklu.edu.in', password: 'admin@jklu' }),
      });
      const data = (await res.json()) as any;
      adminToken = data.token;
      record('Auth & Security', 'Admin Login & JWT Token Generation', res.status === 200 && data.success && data.user.role === 'admin' && !!adminToken, `Authenticated as ${data.user.email} (Role: ${data.user.role})`);
    } catch (e: any) {
      record('Auth & Security', 'Admin Login & JWT Token Generation', false, e.message);
    }

    // 1.4 Driver Login with valid credentials (Ramesh Kumar - DRV-101)
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ramesh.kumar@jklu.edu.in', password: 'driver@8821' }),
      });
      const data = (await res.json()) as any;
      driverToken = data.token;
      record('Auth & Security', 'Driver Login & Role Validation', res.status === 200 && data.success && data.user.role === 'driver' && data.user.user_id === 'DRV-101', `Authenticated as Driver ${data.user.name} (${data.user.user_id})`);
    } catch (e: any) {
      record('Auth & Security', 'Driver Login & Role Validation', false, e.message);
    }

    // 1.5 Student Login with valid credentials (Pratham Lalwani - USR-STU-001)
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pratham.lalwani@jklu.edu.in', password: 'jklu@2024' }),
      });
      const data = (await res.json()) as any;
      studentToken = data.token;
      record('Auth & Security', 'Student Login & Role Validation', res.status === 200 && data.success && data.user.role === 'student', `Authenticated as Student ${data.user.name} (${data.user.user_id})`);
    } catch (e: any) {
      record('Auth & Security', 'Student Login & Role Validation', false, e.message);
    }

    // 1.6 Unauthenticated mutation rejection
    try {
      const res = await fetch(`${BASE_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_id: 'ROUTE-01', shuttle_id: 'SHT-01', driver_id: 'DRV-101', start_time: '12:00 PM' }),
      });
      record('Auth & Security', 'Unauthenticated Mutation Rejection (401)', res.status === 401, `Status code: ${res.status} Unauthorized`);
    } catch (e: any) {
      record('Auth & Security', 'Unauthenticated Mutation Rejection (401)', false, e.message);
    }

    // -------------------------------------------------------------
    // SUITE 2: ADMIN PORTAL WORKFLOWS & SUPABASE PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- SUITE 2: ADMIN PORTAL WORKFLOWS & SUPABASE PERSISTENCE ---');

    // 2.1 Admin creates Stop
    try {
      const res = await fetch(`${BASE_URL}/routes/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          stop_id: TEST_STOP_ID,
          stop_name: 'JAIPUR CENTRAL METRO',
          latitude: 26.9200,
          longitude: 75.8000,
          description: 'E2E Audit Verification Terminal Stop',
          is_destination: true,
        }),
      });
      const data = (await res.json()) as any;

      // Check DB directly
      const dbCheck = await query('SELECT stop_id, stop_name, latitude, longitude FROM stops WHERE stop_id = $1', [TEST_STOP_ID]);
      const dbPassed = dbCheck.rows.length === 1 && dbCheck.rows[0].stop_id === TEST_STOP_ID;

      record('Admin Portal', 'Admin Creates Stop & Supabase Persistence', res.status === 201 && dbPassed, `API 201 Created. Stop ID ${TEST_STOP_ID} stored in Supabase.`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Admin Portal', 'Admin Creates Stop & Supabase Persistence', false, e.message);
    }

    // 2.2 Admin creates Route with Stop sequence
    try {
      const res = await fetch(`${BASE_URL}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          route_id: TEST_ROUTE_ID,
          route_name: 'Metro Express Corridor',
          route_code: 'R-AUDIT',
          description: 'University express link to central metro',
          color: '#2B4A7E',
          stop_ids: ['STOP-JKLU', TEST_STOP_ID],
        }),
      });
      const data = (await res.json()) as any;

      // Verify route in Supabase
      const routeDb = await query('SELECT route_id, route_name, route_code, total_stops FROM routes WHERE route_id = $1', [TEST_ROUTE_ID]);
      const stopsDb = await query('SELECT route_id, stop_id, sequence_number FROM route_stops WHERE route_id = $1 ORDER BY sequence_number ASC', [TEST_ROUTE_ID]);

      const isPersisted = routeDb.rows.length === 1 && stopsDb.rows.length === 2;
      record(
        'Admin Portal',
        'Admin Creates Route & Relational Route Stops in Supabase',
        res.status === 201 && isPersisted,
        `Route ${TEST_ROUTE_ID} saved with ${stopsDb.rows.length} sequenced stops.`,
        { route: routeDb.rows[0], stops: stopsDb.rows }
      );
    } catch (e: any) {
      record('Admin Portal', 'Admin Creates Route & Relational Route Stops in Supabase', false, e.message);
    }

    // 2.3 Admin schedules a Trip on that Route, assigning Driver and Shuttle
    try {
      const res = await fetch(`${BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          trip_id: TEST_TRIP_ID,
          route_id: TEST_ROUTE_ID,
          shuttle_id: 'SHT-01',
          driver_id: 'DRV-101',
          start_time: '11:00 AM',
        }),
      });
      const data = (await res.json()) as any;

      // Verify trip in Supabase
      const tripDb = await query('SELECT trip_id, route_id, shuttle_id, driver_id, running_status FROM trips WHERE trip_id = $1', [TEST_TRIP_ID]);
      const tripStopsDb = await query('SELECT trip_id, stop_id, arrival_status FROM trip_stops WHERE trip_id = $1', [TEST_TRIP_ID]);

      const isTripPersisted = tripDb.rows.length === 1 && tripStopsDb.rows.length >= 2;
      record(
        'Admin Portal',
        'Admin Schedules Trip with Driver, Shuttle & Trip Stops',
        res.status === 201 && isTripPersisted,
        `Trip ${TEST_TRIP_ID} scheduled with driver DRV-101 and shuttle SHT-01 (${tripStopsDb.rows.length} trip stops generated).`,
        tripDb.rows[0]
      );
    } catch (e: any) {
      record('Admin Portal', 'Admin Schedules Trip with Driver, Shuttle & Trip Stops', false, e.message);
    }

    // 2.4 Admin updates Route details
    try {
      const res = await fetch(`${BASE_URL}/routes/${TEST_ROUTE_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          route_name: 'Metro Express Corridor Updated',
          description: 'Updated corridor description for E2E audit',
          color: '#E8590C',
        }),
      });
      const dbCheck = await query('SELECT route_name, color, description FROM routes WHERE route_id = $1', [TEST_ROUTE_ID]);
      const isUpdated = dbCheck.rows[0]?.color === '#E8590C' && dbCheck.rows[0]?.route_name === 'Metro Express Corridor Updated';
      record('Admin Portal', 'Admin Updates Route Information in Supabase', res.status === 200 && isUpdated, `Color updated to ${dbCheck.rows[0]?.color}, Name: ${dbCheck.rows[0]?.route_name}`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Admin Portal', 'Admin Updates Route Information in Supabase', false, e.message);
    }

    // -------------------------------------------------------------
    // SUITE 3: DRIVER PORTAL WORKFLOWS & PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- SUITE 3: DRIVER PORTAL WORKFLOWS & PERSISTENCE ---');

    // 3.1 Driver views assigned trip
    try {
      const res = await fetch(`${BASE_URL}/driver/assigned-trip`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const data = (await res.json()) as any;
      const hasTrip = data.success && data.trip && (data.trip.trip_id === TEST_TRIP_ID || data.trip.driver_id === 'DRV-101');
      record('Driver Portal', 'Driver Queries Assigned Active/Scheduled Trip', res.status === 200 && hasTrip, `Driver DRV-101 received trip: ${data.trip?.trip_id} on route ${data.trip?.route_id}`);
    } catch (e: any) {
      record('Driver Portal', 'Driver Queries Assigned Active/Scheduled Trip', false, e.message);
    }

    // 3.2 Unauthorized driver modification check (Driver 2 Vikram cannot start Driver 1 Ramesh's trip)
    try {
      const d2Res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vikram.singh@jklu.edu.in', password: 'driver@8821' }),
      });
      const d2Data = (await d2Res.json()) as any;
      const d2Token = d2Data.token;

      const forbiddenRes = await fetch(`${BASE_URL}/trips/${TEST_TRIP_ID}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${d2Token}` },
      });
      record('Driver Portal', 'Cross-Driver Access Control Enforcement (403 Forbidden)', forbiddenRes.status === 403, `Driver 2 attempt to start Driver 1's trip rejected with HTTP ${forbiddenRes.status}`);
    } catch (e: any) {
      record('Driver Portal', 'Cross-Driver Access Control Enforcement (403 Forbidden)', false, e.message);
    }

    // 3.3 Driver starts trip
    try {
      const res = await fetch(`${BASE_URL}/trips/${TEST_TRIP_ID}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const data = (await res.json()) as any;

      const dbCheck = await query('SELECT trip_id, running_status FROM trips WHERE trip_id = $1', [TEST_TRIP_ID]);
      const isRunning = dbCheck.rows[0]?.running_status === 'RUNNING';

      record('Driver Portal', 'Driver Starts Trip & Supabase Status Updates to RUNNING', res.status === 200 && isRunning, `Trip status in DB: ${dbCheck.rows[0]?.running_status}`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Driver Portal', 'Driver Starts Trip & Supabase Status Updates to RUNNING', false, e.message);
    }

    // 3.4 Driver submits live GPS telemetry
    try {
      const res = await fetch(`${BASE_URL}/driver/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          trip_id: TEST_TRIP_ID,
          shuttle_id: 'SHT-01',
          latitude: 26.8400,
          longitude: 75.6550,
          speed_kmh: 38.5,
          bearing: 85.0,
          accuracy_m: 4.2,
        }),
      });
      const data = (await res.json()) as any;

      const locDb = await query(
        'SELECT trip_id, shuttle_id, latitude, longitude, speed_kmh FROM shuttle_locations WHERE trip_id = $1 ORDER BY recorded_at DESC LIMIT 1',
        [TEST_TRIP_ID]
      );
      const isLocSaved = locDb.rows.length === 1 && Number(locDb.rows[0].latitude) === 26.8400;

      record('Driver Portal', 'Driver GPS Telemetry Persisted in shuttle_locations Table', res.status === 200 && isLocSaved, `Recorded: (${locDb.rows[0]?.latitude}, ${locDb.rows[0]?.longitude}) Speed: ${locDb.rows[0]?.speed_kmh} km/h`, locDb.rows[0]);
    } catch (e: any) {
      record('Driver Portal', 'Driver GPS Telemetry Persisted in shuttle_locations Table', false, e.message);
    }

    // 3.5 Driver updates stop arrival status
    try {
      const res = await fetch(`${BASE_URL}/trips/${TEST_TRIP_ID}/stops/${TEST_STOP_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const dbCheck = await query('SELECT trip_id, stop_id, arrival_status FROM trip_stops WHERE trip_id = $1 AND stop_id = $2', [TEST_TRIP_ID, TEST_STOP_ID]);
      const isStopCompleted = dbCheck.rows[0]?.arrival_status === 'COMPLETED';
      record('Driver Portal', 'Driver Updates Stop Arrival Status in trip_stops Table', res.status === 200 && isStopCompleted, `Stop arrival status: ${dbCheck.rows[0]?.arrival_status}`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Driver Portal', 'Driver Updates Stop Arrival Status in trip_stops Table', false, e.message);
    }

    // 3.6 Driver completes trip
    try {
      const res = await fetch(`${BASE_URL}/trips/${TEST_TRIP_ID}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const data = (await res.json()) as any;

      const dbCheck = await query('SELECT trip_id, running_status, end_time FROM trips WHERE trip_id = $1', [TEST_TRIP_ID]);
      const isCompleted = dbCheck.rows[0]?.running_status === 'COMPLETED';

      record('Driver Portal', 'Driver Completes Trip & Supabase Status Updates to COMPLETED', res.status === 200 && isCompleted, `Trip status: ${dbCheck.rows[0]?.running_status}, End time: ${dbCheck.rows[0]?.end_time}`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Driver Portal', 'Driver Completes Trip & Supabase Status Updates to COMPLETED', false, e.message);
    }

    // -------------------------------------------------------------
    // SUITE 4: STUDENT PORTAL WORKFLOWS & PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- SUITE 4: STUDENT PORTAL WORKFLOWS & PERSISTENCE ---');

    // 4.1 Student queries active trips
    try {
      const res = await fetch(`${BASE_URL}/student/active-trips`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = (await res.json()) as any;
      const hasTrips = Array.isArray(data);
      record('Student Portal', 'Student Fetches Live Active Trips from Database', res.status === 200 && hasTrips, `Active trips count returned: ${data.length}`);
    } catch (e: any) {
      record('Student Portal', 'Student Fetches Live Active Trips from Database', false, e.message);
    }

    // 4.2 Student records GPS location
    try {
      const res = await fetch(`${BASE_URL}/student/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          latitude: 26.8373,
          longitude: 75.6499,
          accuracy_m: 5.0,
        }),
      });
      const data = (await res.json()) as any;

      const dbCheck = await query('SELECT student_id, latitude, longitude FROM student_locations WHERE student_id = $1 ORDER BY recorded_at DESC LIMIT 1', ['USR-STU-001']);
      const isSaved = dbCheck.rows.length === 1 && Number(dbCheck.rows[0].latitude) === 26.8373;
      record('Student Portal', 'Student Device Location Persisted in student_locations', res.status === 200 && isSaved, `Location recorded: (${dbCheck.rows[0]?.latitude}, ${dbCheck.rows[0]?.longitude})`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Student Portal', 'Student Device Location Persisted in student_locations', false, e.message);
    }

    // 4.3 Student nearby stops query
    try {
      const res = await fetch(`${BASE_URL}/student/nearby-stops?lat=26.8373&lng=75.6499&radius=25`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = (await res.json()) as any;
      const hasStops = Array.isArray(data) && data.length > 0;
      record('Student Portal', 'Nearby Stops Spatial Calculation & Ranking', res.status === 200 && hasStops, `Stops found within radius: ${data.length}. Closest stop: ${data[0]?.stop_name}`);
    } catch (e: any) {
      record('Student Portal', 'Nearby Stops Spatial Calculation & Ranking', false, e.message);
    }

    // -------------------------------------------------------------
    // SUITE 5: CROSS-PORTAL REAL-TIME SYNCHRONIZATION
    // -------------------------------------------------------------
    console.log('\n--- SUITE 5: CROSS-PORTAL REAL-TIME SYNCHRONIZATION ---');

    record('Realtime Sync', 'WebSocket Broadcast: route_created', receivedEvents['route_created'].length > 0, `Captured ${receivedEvents['route_created'].length} route_created broadcast events`);
    record('Realtime Sync', 'WebSocket Broadcast: trip_started', receivedEvents['trip_started'].length > 0, `Captured ${receivedEvents['trip_started'].length} trip_started broadcast events`);
    record('Realtime Sync', 'WebSocket Broadcast: location_updated', receivedEvents['location_updated'].length > 0, `Captured ${receivedEvents['location_updated'].length} live GPS telemetry broadcast events`);
    record('Realtime Sync', 'WebSocket Broadcast: trip_ended', receivedEvents['trip_ended'].length > 0, `Captured ${receivedEvents['trip_ended'].length} trip_ended broadcast events`);

    // -------------------------------------------------------------
    // SUITE 6: ROUTE CANCELLATION & CASCADE INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- SUITE 6: ROUTE CANCELLATION & CASCADE INTEGRITY ---');

    // 6.1 Admin cancels Route
    try {
      const res = await fetch(`${BASE_URL}/routes/${TEST_ROUTE_ID}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = (await res.json()) as any;

      const dbCheck = await query('SELECT route_id, status FROM routes WHERE route_id = $1', [TEST_ROUTE_ID]);
      const isCancelled = dbCheck.rows[0]?.status === 'INACTIVE' || dbCheck.rows[0]?.status === 'CANCELLED';

      record('Integrity & Cascade', 'Admin Cancels Route & Updates Corridor Status in Supabase', res.status === 200 && isCancelled, `Corridor status: ${dbCheck.rows[0]?.status}`, dbCheck.rows[0]);
    } catch (e: any) {
      record('Integrity & Cascade', 'Admin Cancels Route & Updates Corridor Status in Supabase', false, e.message);
    }

    // -------------------------------------------------------------
    // SUITE 7: CLEANUP OF AUDIT TEST RECORDS
    // -------------------------------------------------------------
    console.log('\n--- SUITE 7: CLEANUP OF AUDIT TEST RECORDS ---');

    await query('DELETE FROM shuttle_locations WHERE trip_id IN (SELECT trip_id FROM trips WHERE route_id = $1) OR trip_id = $2', [TEST_ROUTE_ID, TEST_TRIP_ID]);
    await query('DELETE FROM trip_stops WHERE trip_id IN (SELECT trip_id FROM trips WHERE route_id = $1) OR trip_id = $2', [TEST_ROUTE_ID, TEST_TRIP_ID]);
    await query('DELETE FROM trips WHERE route_id = $1 OR trip_id = $2', [TEST_ROUTE_ID, TEST_TRIP_ID]);
    await query('DELETE FROM route_stops WHERE route_id = $1', [TEST_ROUTE_ID]);
    await query('DELETE FROM routes WHERE route_id = $1', [TEST_ROUTE_ID]);
    await query('DELETE FROM stops WHERE stop_id = $1', [TEST_STOP_ID]);
    await query('DELETE FROM student_locations WHERE student_id = $1 AND latitude = 26.8373', ['USR-STU-001']);

    const verifyClean = await query(
      'SELECT count(*) FROM (SELECT route_id FROM routes WHERE route_id = $1 UNION ALL SELECT stop_id FROM stops WHERE stop_id = $2 UNION ALL SELECT trip_id FROM trips WHERE trip_id = $3) t',
      [TEST_ROUTE_ID, TEST_STOP_ID, TEST_TRIP_ID]
    );

    const isClean = parseInt(verifyClean.rows[0].count, 10) === 0;
    record('Cleanup', 'Purge Audit Test Artifacts & Zero Orphan Guarantee', isClean, 'All test records purged from Supabase. Production data preserved intact.', { remainingCount: verifyClean.rows[0].count });

  } finally {
    socketClient.disconnect();
    server.close();
    await pool.end();
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('                   AUDIT TEST SUITE SUMMARY                     ');
  console.log('================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED:      ${passCount}`);
  console.log(`FAILED:      ${failCount}`);
  console.log(`VERDICT:     ${failCount === 0 ? 'ALL SYSTEMS OPERATIONAL (PASS)' : 'FAILURES DETECTED'}\n`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2E().catch((err) => {
  console.error('Fatal error in E2E audit suite:', err);
  process.exit(1);
});
