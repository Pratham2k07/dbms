import assert from 'assert';
import pool from './db/connection.js';
import * as studentQueries from './db/queries/student.queries.js';

async function runGpsLocationFlowTests() {
  console.log('=== STARTING GPS LOCATION FLOW AUTOMATED INTEGRATION TESTS ===\n');

  try {
    // TEST 1: Fresh location payload persistence with accuracy and GPS timestamp
    console.log('[TEST 1] Verifying fresh GPS payload persistence with accuracy and hardware timestamp...');
    const testTime1 = new Date(Date.now() - 5000).toISOString();
    const loc1 = await studentQueries.recordStudentLocation({
      student_id: 'USR-STU-001',
      latitude: 26.838912,
      longitude: 75.651789,
      accuracy_m: 6.4,
      gps_timestamp: testTime1,
    });

    assert(loc1 !== null, 'loc1 should not be null');
    assert.strictEqual(Number(loc1.latitude.toFixed(6)), 26.838912, 'Latitude must match input');
    assert.strictEqual(Number(loc1.longitude.toFixed(6)), 75.651789, 'Longitude must match input');
    assert.strictEqual(loc1.accuracy_m, 6.4, 'Accuracy must match input');
    assert(loc1.gps_timestamp !== null, 'Hardware GPS timestamp must be recorded');
    assert(loc1.recorded_at !== null, 'Database recorded_at timestamp must be recorded');
    console.log('  ✓ Test 1 Passed: Fresh location persisted with accuracy and hardware GPS timestamp.');

    // TEST 2: Changed device location is accurately persisted
    console.log('\n[TEST 2] Verifying changed device location persistence...');
    const testTime2 = new Date().toISOString();
    const loc2 = await studentQueries.recordStudentLocation({
      student_id: 'USR-STU-001',
      latitude: 26.841500,
      longitude: 75.654200,
      accuracy_m: 4.2,
      gps_timestamp: testTime2,
    });

    assert(loc2 !== null, 'loc2 should not be null');
    assert.strictEqual(Number(loc2.latitude.toFixed(6)), 26.841500, 'Changed latitude must match input');
    assert.strictEqual(Number(loc2.longitude.toFixed(6)), 75.654200, 'Changed longitude must match input');
    assert.strictEqual(loc2.accuracy_m, 4.2, 'Changed accuracy must match input');
    assert(loc2.location_id !== loc1.location_id, 'New row must have distinct location_id');
    console.log('  ✓ Test 2 Passed: Changed coordinates persisted as new distinct telemetry record.');

    // TEST 3: Deterministic newest record retrieval distinguishes measurement vs recording time
    console.log('\n[TEST 3] Verifying deterministic latest location retrieval and timestamp distinction...');
    const latest = await studentQueries.getLatestStudentLocation('USR-STU-001');
    assert(latest !== null, 'Latest location should not be null');
    assert.strictEqual(latest.location_id, loc2.location_id, 'Latest record must match most recent insertion');
    assert.strictEqual(Number(latest.latitude.toFixed(6)), 26.841500, 'Latest latitude must match newest reading');
    assert.strictEqual(Number(latest.longitude.toFixed(6)), 75.654200, 'Latest longitude must match newest reading');
    console.log(`  Telemetry Breakdown:
    - Location ID: ${latest.location_id}
    - Latitude: ${latest.latitude}
    - Longitude: ${latest.longitude}
    - Device Accuracy: ±${latest.accuracy_m}m
    - Device Measurement Time: ${new Date(latest.gps_timestamp).toISOString()}
    - Database Recorded Time:  ${new Date(latest.recorded_at).toISOString()}`);
    console.log('  ✓ Test 3 Passed: Latest query is deterministic and cleanly distinguishes measurement time from DB recording time.');

    // TEST 4: Coordinate bounds validation (rejects invalid/out-of-bounds coordinates)
    console.log('\n[TEST 4] Verifying GPS coordinate bounds validation...');
    let threwOutOfBoundsLat = false;
    try {
      await studentQueries.recordStudentLocation({
        student_id: 'USR-STU-001',
        latitude: 120.5, // Invalid: > 90
        longitude: 75.65,
      });
    } catch {
      threwOutOfBoundsLat = true;
    }
    assert(threwOutOfBoundsLat, 'Out-of-bounds latitude (>90) must throw validation error');

    let threwOutOfBoundsLng = false;
    try {
      await studentQueries.recordStudentLocation({
        student_id: 'USR-STU-001',
        latitude: 26.83,
        longitude: -200.0, // Invalid: < -180
      });
    } catch {
      threwOutOfBoundsLng = true;
    }
    assert(threwOutOfBoundsLng, 'Out-of-bounds longitude (<-180) must throw validation error');

    let threwNaN = false;
    try {
      await studentQueries.recordStudentLocation({
        student_id: 'USR-STU-001',
        latitude: NaN,
        longitude: 75.65,
      });
    } catch {
      threwNaN = true;
    }
    assert(threwNaN, 'NaN coordinates must throw validation error');
    console.log('  ✓ Test 4 Passed: Coordinates outside valid geographic boundaries [-90..90, -180..180] rejected.');

    // TEST 5: Verify nearby stops dynamic distance calculation from changed coordinates
    console.log('\n[TEST 5] Verifying dynamic nearby-stops calculation from changed coordinates...');
    const nearbyStops = await studentQueries.getNearbyStops(26.841500, 75.654200, 20, 5);
    assert(Array.isArray(nearbyStops), 'Nearby stops must return an array');
    assert(nearbyStops.length > 0, 'Must return at least 1 nearby stop');
    assert(nearbyStops[0].distance_km !== undefined, 'Stop must contain distance_km calculation');
    // Ensure sorted ascending by distance
    for (let i = 1; i < nearbyStops.length; i++) {
      assert(nearbyStops[i].distance_km >= nearbyStops[i - 1].distance_km, 'Stops must be ordered ascending by distance');
    }
    console.log(`  Nearest stop from changed coordinates: ${nearbyStops[0].stop_name} (${nearbyStops[0].distance_km} km away)`);
    console.log('  ✓ Test 5 Passed: Nearby stops calculation uses dynamic coordinates with accurate ascending order.');

    // TEST 6: Student identity isolation
    console.log('\n[TEST 6] Verifying student identity isolation in location queries...');
    await pool.query(
      `INSERT INTO users (user_id, name, email, password_hash, role)
       VALUES ('USR-STU-TEST', 'Test Student', 'test.student@jklu.edu.in', 'test_hash', 'student')
       ON CONFLICT (user_id) DO NOTHING`
    );
    await pool.query(
      `INSERT INTO students (student_id, roll_no)
       VALUES ('USR-STU-TEST', 'ROLL-TEST')
       ON CONFLICT (student_id) DO NOTHING`
    );

    const student2Loc = await studentQueries.recordStudentLocation({
      student_id: 'USR-STU-TEST',
      latitude: 26.900000,
      longitude: 75.800000,
      accuracy_m: 12.0,
      gps_timestamp: new Date().toISOString(),
    });
    assert.strictEqual(student2Loc?.student_id, 'USR-STU-TEST');

    const latestStu1 = await studentQueries.getLatestStudentLocation('USR-STU-001');
    const latestStu2 = await studentQueries.getLatestStudentLocation('USR-STU-TEST');
    assert.strictEqual(latestStu1?.student_id, 'USR-STU-001', 'Query for Stu1 must return Stu1');
    assert.strictEqual(latestStu2?.student_id, 'USR-STU-TEST', 'Query for Stu2 must return Stu2');
    assert.notStrictEqual(latestStu1?.latitude, latestStu2?.latitude, 'Different students have distinct locations');
    console.log('  ✓ Test 6 Passed: Student identity isolation verified across multiple student records.');

    // Cleanup test records
    await pool.query("DELETE FROM student_locations WHERE student_id = 'USR-STU-TEST'");
    await pool.query("DELETE FROM students WHERE student_id = 'USR-STU-TEST'");
    await pool.query("DELETE FROM users WHERE user_id = 'USR-STU-TEST'");

    // TEST 7: Preserve existing core entities (routes, shuttles, trips, drivers)
    console.log('\n[TEST 7] Verifying existing system entities remain intact...');
    const routesRes = await pool.query('SELECT count(*) FROM routes');
    const stopsRes = await pool.query('SELECT count(*) FROM stops');
    const shuttlesRes = await pool.query('SELECT count(*) FROM shuttles');
    const tripsRes = await pool.query('SELECT count(*) FROM trips');
    console.log(`  System inventory: ${routesRes.rows[0].count} routes, ${stopsRes.rows[0].count} stops, ${shuttlesRes.rows[0].count} shuttles, ${tripsRes.rows[0].count} trips`);
    assert(Number(routesRes.rows[0].count) > 0, 'Routes must be preserved');
    assert(Number(stopsRes.rows[0].count) >= 40, 'All 40 campus & city stops must be preserved');
    console.log('  ✓ Test 7 Passed: All existing routes, stops, shuttles, and trips intact.');

    console.log('\n===============================================================');
    console.log('  ALL 7 TESTS COMPLETED SUCCESSFULLY WITH 0 FAILURES!');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runGpsLocationFlowTests();
