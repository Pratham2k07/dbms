import pool from './db/connection';
import * as tripsQueries from './db/queries/trips.queries';
import * as shuttleQueries from './db/queries/shuttle.queries';
import * as studentQueries from './db/queries/student.queries';
import * as stopsQueries from './db/queries/stops.queries';
import { haversineDistanceMeters, calculateTheoreticalEtaMinutes } from './services/routing.service';

async function runGpsSystemVerification() {
  console.log('========================================================================');
  console.log('AUTOMATED VERIFICATION: REAL DATABASE-DRIVEN GPS TRACKING SYSTEM');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${title}`);
      if (detail) console.log(`       -> ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`);
      if (detail) console.error(`       -> ${detail}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Fixed Road Route Geometry & Distance Consistency
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Fixed Road Route Geometry & Distance Consistency ---');
    const routes = await stopsQueries.fetchAllRoutes();
    const r1 = routes.find((r: any) => r.route_id === 'ROUTE-01');
    const r2 = routes.find((r: any) => r.route_id === 'ROUTE-02');

    assert(Boolean(r1 && r1.route_coordinates), 'Route ROUTE-01 has persistent route_coordinates');
    const r1Coords = r1?.route_coordinates || [];
    assert(
      Array.isArray(r1Coords) && r1Coords.length > 50,
      `ROUTE-01 geometry is a real road polyline (${r1Coords.length} road coordinates, not straight line)`
    );

    const straightLineOriginTerminus = haversineDistanceMeters(26.8373, 75.6499, 26.8540, 75.8150) / 1000;
    assert(
      Number(r1?.total_distance_km) > straightLineOriginTerminus,
      `ROUTE-01 total road distance (${r1?.total_distance_km} km) reflects road geometry, exceeding straight-line distance (${straightLineOriginTerminus.toFixed(2)} km)`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Daily Trip Generation from Template & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Daily Trip Generation & Duplicate Prevention ---');
    const testDate = new Date().toISOString().slice(0, 10);
    const testTripId = `TEST-TRIP-${Date.now().toString().slice(-4)}`;

    const createRes1 = await tripsQueries.createTrip({
      trip_id: testTripId,
      route_id: 'ROUTE-02',
      shuttle_id: 'SHT-02',
      driver_id: 'DRV-102',
      start_time: '08:45 AM',
      trip_date: testDate
    });

    assert(createRes1.success, `Daily trip ${testTripId} created referencing route template and assigned shuttle/driver`);

    // Verify trip_stops were automatically populated from route_stops
    const liveDetails1 = await tripsQueries.getLiveTripDetails(testTripId);
    assert(
      Boolean(liveDetails1?.stops && liveDetails1.stops.length > 0),
      `Ordered trip_stops populated with scheduled arrival times (${liveDetails1?.stops?.length} stops)`
    );

    // Attempt to insert duplicate trip for same route, date, and start time
    const duplicateTripId = `TEST-DUP-${Date.now().toString().slice(-4)}`;
    const createRes2 = await tripsQueries.createTrip({
      trip_id: duplicateTripId,
      route_id: 'ROUTE-02',
      shuttle_id: 'SHT-03',
      driver_id: 'DRV-103',
      start_time: '08:45 AM',
      trip_date: testDate
    });

    assert(
      !createRes2.success && String(createRes2.error).includes('Duplicate trip rejected'),
      'Duplicate trip generation prevented by database constraint (same route, date, and start time)'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Driver Authorization & Trip Start
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Driver Authorization & Trip Start ---');
    // Start trip as assigned driver
    const startRes = await tripsQueries.startTripById(testTripId, 'DRV-102');
    assert(
      startRes.success && startRes.trip.running_status === 'RUNNING',
      `Trip ${testTripId} started: running_status = 'RUNNING', actual_start_time recorded`
    );

    // Reject location update from unauthorized driver
    const unauthLoc = await shuttleQueries.recordDriverGpsLocation({
      driver_id: 'DRV-101', // Assigned is DRV-102
      trip_id: testTripId,
      shuttle_id: 'SHT-02',
      latitude: 26.8732,
      longitude: 75.7668
    });
    assert(
      !unauthLoc.success && String(unauthLoc.error).includes('Unauthorized'),
      'Server-side authorization rejects GPS submission from non-assigned driver'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Real GPS Telemetry Ingestion, Map-Matching, & Stop Arrival
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Real GPS Telemetry Ingestion, Map-Matching, & Stop Arrival ---');
    // Driver DRV-102 submits real GPS coordinates at Mansarovar stop (26.873200, 75.766800)
    const gpsRes1 = await shuttleQueries.recordDriverGpsLocation({
      driver_id: 'DRV-102',
      trip_id: testTripId,
      shuttle_id: 'SHT-02',
      latitude: 26.873200,
      longitude: 75.766800,
      speed_kmh: 24,
      bearing: 85,
      accuracy_m: 4.5,
      gps_timestamp: new Date().toISOString()
    });

    assert(gpsRes1.success, 'Valid driver GPS telemetry persisted to shuttle_locations');
    assert(
      Boolean(gpsRes1.projection && gpsRes1.projection.progressPercentage > 0),
      `Vehicle map-matched to route geometry: progress = ${gpsRes1.projection?.progressPercentage}%`
    );
    assert(
      Boolean(gpsRes1.stopArrivalTriggered && gpsRes1.stopArrivalTriggered.stop_id === 'STOP-MANSAROVAR'),
      'Stop arrival at MANSAROVAR automatically detected within 75m threshold (arrival_status = ARRIVED)'
    );

    // Submit second GPS sample moving past stop (150m away)
    const gpsRes2 = await shuttleQueries.recordDriverGpsLocation({
      driver_id: 'DRV-102',
      trip_id: testTripId,
      shuttle_id: 'SHT-02',
      latitude: 26.874800,
      longitude: 75.768200,
      speed_kmh: 28,
      bearing: 88,
      accuracy_m: 3.8
    });

    const liveAfterDeparture = await tripsQueries.getLiveTripDetails(testTripId);
    const mansarovarStop = liveAfterDeparture?.stops?.find((s: any) => s.stop_id === 'STOP-MANSAROVAR');
    assert(
      mansarovarStop?.arrival_status === 'COMPLETED' && Boolean(mansarovarStop?.actual_departure),
      'Stop departure automatically detected beyond 100m (arrival_status = COMPLETED, actual_departure recorded)'
    );

    // Check theoretical ETA calculation (25 km/h formula)
    const nextStop = liveAfterDeparture?.stops?.find((s: any) => s.stop_id === 'STOP-VAISHALI');
    if (nextStop) {
      const expectedEta = Math.round((Number(nextStop.remaining_road_distance_km) / 25) * 60);
      assert(
        nextStop.theoretical_eta_minutes === expectedEta,
        `Theoretical ETA to next stop (${nextStop.theoretical_eta_minutes} mins) correctly uses road distance (${nextStop.remaining_road_distance_km} km) / 25 km/h`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: End Trip Lifecycle & Telemetry Cutoff
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: End Trip Lifecycle & Telemetry Cutoff ---');
    const endRes = await tripsQueries.endTripById(testTripId, 'DRV-102');
    assert(
      endRes.success && endRes.trip.running_status === 'COMPLETED',
      `Trip ${testTripId} ended: running_status = 'COMPLETED', actual_end_time recorded`
    );

    // Subsequent telemetry submission on completed trip must be rejected
    const postEndGps = await shuttleQueries.recordDriverGpsLocation({
      driver_id: 'DRV-102',
      trip_id: testTripId,
      shuttle_id: 'SHT-02',
      latitude: 26.8373,
      longitude: 75.6499
    });
    assert(
      !postEndGps.success && String(postEndGps.error).includes('COMPLETED'),
      'Further GPS telemetry rejected after trip completion'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Student GPS Location & Dynamic Nearby Stops
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Student GPS Location & Dynamic Nearby Stops ---');
    // Student at Mansarovar Metro (26.8732, 75.7668)
    const stuLoc1 = await studentQueries.recordStudentLocation({
      student_id: 'USR-STU-001',
      latitude: 26.8732,
      longitude: 75.7668,
      accuracy_m: 6.2
    });
    assert(Boolean(stuLoc1 && stuLoc1.location_id), 'Student real permitted GPS location recorded in student_locations');

    const nearbyAtMansarovar = await studentQueries.getNearbyStops(26.8732, 75.7668, 15, 3);
    assert(
      nearbyAtMansarovar[0]?.stop_id === 'STOP-MANSAROVAR',
      `Student at Mansarovar coordinates: nearest stop is correctly ${nearbyAtMansarovar[0]?.stop_name} (${nearbyAtMansarovar[0]?.distance_km} km)`
    );

    // Student moves to Jaipur Airport (26.8288, 75.8055)
    await studentQueries.recordStudentLocation({
      student_id: 'USR-STU-001',
      latitude: 26.8288,
      longitude: 75.8055,
      accuracy_m: 5.0
    });
    const nearbyAtAirport = await studentQueries.getNearbyStops(26.8288, 75.8055, 15, 3);
    assert(
      nearbyAtAirport[0]?.stop_id === 'STOP-AIRPORT',
      `Student at Airport coordinates: nearest stop dynamically updates to ${nearbyAtAirport[0]?.stop_name} (${nearbyAtAirport[0]?.distance_km} km)`
    );

    // Cleanup test trip
    await pool.query('DELETE FROM trips WHERE trip_id = $1', [testTripId]);
    await pool.query('DELETE FROM trips WHERE trip_id = $1', [duplicateTripId]);

  } catch (error) {
    console.error('Unexpected error in automated verification:', error);
    failed++;
  } finally {
    console.log('\n========================================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================');
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runGpsSystemVerification();
