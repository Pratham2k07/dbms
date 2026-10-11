import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      console.log('Connecting to socket server...');
    }
  }

  joinShuttleRoom(shuttleId: number) {
    if (this.socket) {
      this.socket.emit('join_shuttle_room', shuttleId);
    }
  }

  onLocationUpdated(callback: (data: { id: number; lat: number; lng: number }) => void) {
    if (this.socket) {
      this.socket.on('location_updated', callback);
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
