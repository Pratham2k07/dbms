import { calculateHaversineDistance } from './locationService';

// Module-level cache tracking the monotonic progress index for active trips
// Key: trip_id, Value: highest completed stop index along route
const tripProgressTracker = new Map<string, number>();

export interface ProgressStopItem {
  stop_id: string;
  latitude: number | string;
  longitude: number | string;
}

export interface TripProgressionResult {
  completedIndices: Set<number>;
  completedStopIds: Set<string>;
  activeApproachingIndex: number;
  activeApproachingStopId?: string;
  highestCompletedIndex: number;
}

/**
 * Reset progress for a trip when it finishes, restarts or is cancelled
 */
export function resetTripProgress(tripId: string): void {
  tripProgressTracker.delete(tripId);
}

/**
 * Computes progressive stop passing with:
 * 1. Monotonic latching: A stop once passed CAN NEVER revert to unpassed / upcoming.
 * 2. Sequential segment testing: Only tests the immediate next stop in order,
 *    preventing jumping across loops to distant stops like DCM while between Malviya Nagar and Airport.
 * 3. Stable corridor validation: Eliminates all GPS jitter and distance fluctuations.
 */
export function computeTripProgression(
  tripId: string,
  isRunning: boolean,
  orderedStops: ProgressStopItem[],
  currentLocation?: { latitude: number | string; longitude: number | string } | null,
  tripStops?: { stop_id: string; arrival_status: string }[]
): TripProgressionResult {
  const completedIndices = new Set<number>();
  const completedStopIds = new Set<string>();

  if (!orderedStops || orderedStops.length === 0) {
    return {
      completedIndices,
      completedStopIds,
      activeApproachingIndex: -1,
      highestCompletedIndex: -1,
    };
  }

  // If not running, rely strictly on database records
  if (!isRunning) {
    let maxCompletedIdx = -1;
    orderedStops.forEach((s, idx) => {
      const ts = tripStops?.find((t) => t.stop_id === s.stop_id);
      if (ts?.arrival_status === 'COMPLETED') {
        maxCompletedIdx = Math.max(maxCompletedIdx, idx);
      }
    });

    for (let i = 0; i <= maxCompletedIdx; i++) {
      completedIndices.add(i);
      completedStopIds.add(orderedStops[i].stop_id);
    }

    return {
      completedIndices,
      completedStopIds,
      activeApproachingIndex: -1,
      highestCompletedIndex: maxCompletedIdx,
    };
  }

  // --- TRIP IS RUNNING ---
  // Origin stop (index 0) has departed
  let maxCompleted = Math.max(0, tripProgressTracker.get(tripId) ?? 0);

  // 1. Check explicit database status
  if (tripStops && tripStops.length > 0) {
    orderedStops.forEach((s, idx) => {
      const ts = tripStops.find((t) => t.stop_id === s.stop_id);
      if (ts?.arrival_status === 'COMPLETED') {
        maxCompleted = Math.max(maxCompleted, idx);
      }
    });
  }

  // 2. Process real GPS telemetry against sequential segments
  if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
    const sLat = Number(currentLocation.latitude);
    const sLng = Number(currentLocation.longitude);

    let targetIdx = maxCompleted + 1;

    while (targetIdx < orderedStops.length) {
      const targetStop = orderedStops[targetIdx];
      const distToTargetM = calculateHaversineDistance(
        sLat,
        sLng,
        Number(targetStop.latitude),
        Number(targetStop.longitude)
      );

      // If at the terminus (final stop)
      if (targetIdx === orderedStops.length - 1) {
        if (distToTargetM <= 350) {
          maxCompleted = Math.max(maxCompleted, targetIdx);
        }
        break;
      }

      // Intermediate stop: check relative to subsequent stop
      const nextStop = orderedStops[targetIdx + 1];
      const distToNextM = calculateHaversineDistance(
        sLat,
        sLng,
        Number(nextStop.latitude),
        Number(nextStop.longitude)
      );
      const segmentDistM = calculateHaversineDistance(
        Number(targetStop.latitude),
        Number(targetStop.longitude),
        Number(nextStop.latitude),
        Number(nextStop.longitude)
      );

      // Has the shuttle passed targetStop?
      // Condition A: Shuttle was within 400m of targetStop and is now closer to next stop than the total segment length
      const geofencePassed = distToTargetM <= 400 && distToNextM < segmentDistM;

      // Condition B: Shuttle is closer to nextStop than to targetStop AND inside the segment corridor
      // (corridor test prevents jumps from faraway parts of the city)
      const corridorPassed =
        distToNextM < distToTargetM &&
        distToTargetM + distToNextM <= Math.max(segmentDistM * 1.6, segmentDistM + 1200);

      if (geofencePassed || corridorPassed) {
        maxCompleted = Math.max(maxCompleted, targetIdx);
        targetIdx++;
      } else {
        // Shuttle is still heading towards targetStop
        break;
      }
    }
  }

  // Monotonically latch progress so it never decrements
  tripProgressTracker.set(tripId, maxCompleted);

  // Populate completed indices and IDs
  for (let i = 0; i <= maxCompleted; i++) {
    completedIndices.add(i);
    completedStopIds.add(orderedStops[i].stop_id);
  }

  // Determine the active approaching stop (always the immediate next stop after maxCompleted)
  let activeApproachingIndex = -1;
  let activeApproachingStopId: string | undefined;

  if (maxCompleted + 1 < orderedStops.length) {
    activeApproachingIndex = maxCompleted + 1;
    activeApproachingStopId = orderedStops[activeApproachingIndex].stop_id;
  }

  return {
    completedIndices,
    completedStopIds,
    activeApproachingIndex,
    activeApproachingStopId,
    highestCompletedIndex: maxCompleted,
  };
}

