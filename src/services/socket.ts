import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      console.log('Connecting to socket server...');
    }
  }

  joinShuttleRoom(shuttleId: string | number) {
    if (this.socket) {
      this.socket.emit('join_shuttle_room', shuttleId);
    }
  }

  onLocationUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('location_updated', callback);
      this.socket.on('shuttle_location_update', callback);
    }
  }

  onTripStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('trip_started', callback);
    }
  }

  onTripEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('trip_ended', callback);
      this.socket.on('shuttle_tracking_disabled', callback);
    }
  }

  onStopArrival(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('stop_arrival', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
