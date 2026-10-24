import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join specific rooms
    socket.on('join_shuttle_room', (shuttleId: string) => {
      const room = `shuttle_${shuttleId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
    });

    socket.on('join_trip_room', (tripId: string) => {
      const room = `trip_${tripId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
    });

    socket.on('join_driver_room', (driverId: string) => {
      const room = `driver_${driverId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

// Real-time broadcast helpers
export const socketEvents = {
  emitTripCreated: (trip: any) => {
    if (!io) return;
    io.emit('trip_created', { trip });
  },

  emitTripUpdated: (trip: any) => {
    if (!io) return;
    io.emit('trip_updated', { trip });
  },

  emitTripStarted: (tripId: string, trip: any) => {
    if (!io) return;
    io.emit('trip_started', { trip_id: tripId, trip });
  },

  emitTripEnded: (tripId: string, shuttleId: string, trip: any) => {
    if (!io) return;
    io.emit('trip_ended', { trip_id: tripId, shuttle_id: shuttleId, trip });
  },

  emitTripCancelled: (tripId: string) => {
    if (!io) return;
    io.emit('trip_cancelled', { trip_id: tripId });
  },

  emitRouteCreated: (route: any) => {
    if (!io) return;
    io.emit('route_created', { route });
  },

  emitRouteUpdated: (route: any) => {
    if (!io) return;
    io.emit('route_updated', { route });
  },

  emitRouteDeleted: (routeId: string) => {
    if (!io) return;
    io.emit('route_deleted', { route_id: routeId });
  },

  emitStopCreated: (stop: any) => {
    if (!io) return;
    io.emit('stop_created', { stop });
  },

  emitStopUpdated: (stop: any) => {
    if (!io) return;
    io.emit('stop_updated', { stop });
  },

  emitStopDeleted: (stopId: string) => {
    if (!io) return;
    io.emit('stop_deleted', { stop_id: stopId });
  },

  emitShuttleCreated: (shuttle: any) => {
    if (!io) return;
    io.emit('shuttle_created', { shuttle });
  },

  emitShuttleUpdated: (shuttle: any) => {
    if (!io) return;
    io.emit('shuttle_updated', { shuttle });
  },

  emitShuttleStatusChanged: (shuttleId: string, status: string) => {
    if (!io) return;
    io.emit('shuttle_status_changed', { shuttle_id: shuttleId, status });
  },

  emitLocationUpdate: (telemetry: any) => {
    if (!io) return;
    // Emit to all listeners and to specific shuttle / trip rooms
    io.emit('location_updated', telemetry);
    io.emit('shuttle_location_update', telemetry);
    if (telemetry.shuttle_id) {
      io.to(`shuttle_${telemetry.shuttle_id}`).emit('location_updated', telemetry);
    }
    if (telemetry.trip_id) {
      io.to(`trip_${telemetry.trip_id}`).emit('location_updated', telemetry);
    }
  },

  emitDriverAssigned: (driverId: string, assignment: any) => {
    if (!io) return;
    io.emit('driver_assigned', { driver_id: driverId, assignment });
    io.to(`driver_${driverId}`).emit('driver_assigned', { driver_id: driverId, assignment });
  },
};
