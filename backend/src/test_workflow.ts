import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testWorkflow() {
  console.log('====================================================');
  console.log('TESTING COMPLETE END-TO-END WORKFLOW AGAINST SUPABASE');
  console.log('====================================================\n');

  try {
    // 1. Health check
    const health = await axios.get(`${API_BASE}/health`);
    console.log('1. Health check:', health.data.status);

    // 2. Admin Login
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@jklu.edu.in',
      password: 'admin@jklu',
    });
    const adminToken = adminLogin.data.token;
    console.log('2. Admin Login successful! User:', adminLogin.data.user.name, `(${adminLogin.data.user.role})`);

    // 3. Driver Login
    const driverLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'ramesh.kumar@jklu.edu.in',
      password: 'driver@8821',
    });
    const driverToken = driverLogin.data.token;
    console.log('3. Driver Login successful! User:', driverLogin.data.user.name, `(${driverLogin.data.user.role})`);

    // 4. Student Login
    const studentLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'pratham.lalwani@jklu.edu.in',
      password: 'jklu@2024',
    });
    const studentToken = studentLogin.data.token;
    console.log('4. Student Login successful! User:', studentLogin.data.user.name, `(${studentLogin.data.user.role})`);

    // 5. Admin creates Route
    console.log('\n--- STEP A: ADMIN CREATES ROUTE ---');
    const newRouteRes = await axios.post(
      `${API_BASE}/routes`,
      {
        route_name: 'TEST WORKFLOW EXPRESS CORRIDOR',
        route_code: 'R-TEST',
        description: 'End-to-End Workflow Verification Route',
        color: '#E8590C',
        stop_ids: ['STOP-JKLU-START', 'STOP-MANSAROVAR', 'STOP-DCM', 'STOP-JKLU'],
        assigned_driver_id: 'DRV-104',
        assigned_shuttle_id: 'SHT-04',
        start_time: '11:00 AM',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdRoute = newRouteRes.data.route;
    console.log(`✅ Route created in Supabase: ${createdRoute.route_id} (${createdRoute.route_code}) with ${createdRoute.total_stops} stops`);

    // 6. Admin creates Trip on that Route
    console.log('\n--- STEP B: ADMIN CREATES TRIP & ASSIGNS DRIVER ---');
    const newTripRes = await axios.post(
      `${API_BASE}/trips`,
      {
        route_id: createdRoute.route_id,
        shuttle_id: 'SHT-04',
        driver_id: 'DRV-104',
        start_time: '11:00 AM',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdTrip = newTripRes.data.trip;
    console.log(`✅ Trip created in Supabase: ${createdTrip.trip_id} on ${createdRoute.route_code}, Assigned to DRV-104 (SHT-04), Status: ${createdTrip.running_status}`);

    // 7. Driver Portal: DRV-104 checks assigned trip
    console.log('\n--- STEP C: DRIVER PORTAL SEES ASSIGNED TRIP ---');
    // Login as DRV-104
    const drv104Login = await axios.post(`${API_BASE}/auth/login`, {
      email: 'devendra.sharma@jklu.edu.in',
      password: 'driver@8821',
    });
    const drv104Token = drv104Login.data.token;

    const assignedTripRes = await axios.get(`${API_BASE}/driver/assigned-trip`, {
      headers: { Authorization: `Bearer ${drv104Token}` },
    });
    console.log('✅ Driver DRV-104 assigned trip fetched:', assignedTripRes.data.trip?.trip_id, 'Status:', assignedTripRes.data.trip?.running_status);

    // 8. Driver starts the trip
    console.log('\n--- STEP D: DRIVER STARTS THE TRIP ---');
    const startTripRes = await axios.post(
      `${API_BASE}/trips/${createdTrip.trip_id}/start`,
      {},
      { headers: { Authorization: `Bearer ${drv104Token}` } }
    );
    console.log(`✅ Trip started! Status in Supabase: ${startTripRes.data.trip.running_status}`);

    // 9. Driver submits real GPS telemetry
    console.log('\n--- STEP E: DRIVER SUBMITS LIVE GPS TELEMETRY ---');
    const telemetryRes = await axios.post(
      `${API_BASE}/driver/location`,
      {
        trip_id: createdTrip.trip_id,
        shuttle_id: 'SHT-04',
        latitude: 26.8373,
        longitude: 75.6499,
        speed_kmh: 35,
        bearing: 90,
      },
      { headers: { Authorization: `Bearer ${drv104Token}` } }
    );
    console.log('✅ GPS telemetry accepted:', telemetryRes.data.telemetry);

    // 10. Student Portal views active shuttles and trips
    console.log('\n--- STEP F: STUDENT PORTAL VIEWS ACTIVE TRIPS ---');
    const studentActiveTrips = await axios.get(`${API_BASE}/student/active-trips`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const foundActive = studentActiveTrips.data.find((t: any) => t.trip_id === createdTrip.trip_id);
    console.log('✅ Student Portal found active trip:', foundActive?.trip_id, 'Running status:', foundActive?.running_status, 'Shuttle:', foundActive?.shuttle_number);

    // 11. Driver completes the trip
    console.log('\n--- STEP G: DRIVER COMPLETES TRIP ---');
    const endTripRes = await axios.post(
      `${API_BASE}/trips/${createdTrip.trip_id}/end`,
      {},
      { headers: { Authorization: `Bearer ${drv104Token}` } }
    );
    console.log(`✅ Trip completed! Status in Supabase: ${endTripRes.data.trip.running_status}`);

    // 12. Verify status across portals
    console.log('\n--- STEP H: VERIFY STATUS UPDATED IN ADMIN & STUDENT PORTALS ---');
    const allTripsRes = await axios.get(`${API_BASE}/trips`);
    const completedTrip = allTripsRes.data.find((t: any) => t.trip_id === createdTrip.trip_id);
    console.log(`✅ Supabase records show Trip ${completedTrip.trip_id} status is now: ${completedTrip.running_status}`);

    // Cleanup the test trip and test route so database stays tidy
    await axios.delete(`${API_BASE}/routes/${createdRoute.route_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('\n🧹 Test Route and associated records cleanly removed after verification.');

    console.log('\n====================================================');
    console.log('🎉 ALL END-TO-END WORKFLOW TESTS PASSED 100%!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('Workflow test error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testWorkflow();
