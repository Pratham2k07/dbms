import { Trip, TripStop } from '../types/database';

export const tripService = {
  startTrip(trip: Trip): Trip {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      ...trip,
      running_status: 'RUNNING',
      start_time: timeStr,
      end_time: null,
      speed_kmh: 36
    };
  },

  endTrip(trip: Trip): Trip {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      ...trip,
      running_status: 'COMPLETED',
      end_time: timeStr,
      speed_kmh: 0
    };
  },

  updateCapacity(trip: Trip, capacity_status: 'AVAILABLE' | 'FULL'): Trip {
    return {
      ...trip,
      capacity_status
    };
  },

  updateTripStopStatus(
    tripStops: TripStop[],
    tripId: string,
    stopId: string,
    newStatus: TripStop['arrival_status']
  ): TripStop[] {
    return tripStops.map((ts) => {
      if (ts.trip_id === tripId && ts.stop_id === stopId) {
        return {
          ...ts,
          arrival_status: newStatus,
          actual_arrival: newStatus === 'COMPLETED' ? ts.actual_arrival || 'Just now' : ts.actual_arrival
        };
      }
      return ts;
    });
  }
};
