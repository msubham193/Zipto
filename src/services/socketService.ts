import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same origin as the REST API, minus the /api suffix, on the `booking` namespace.
const API_URL = 'https://api.ridezipto.com/api';
const SOCKET_URL = `${API_URL.replace(/\/api\/?$/, '')}/booking`;

export interface DriverLocation {
  bookingId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  ts: number;
}

let socket: Socket | null = null;
let driverLocationCb: ((loc: DriverLocation) => void) | null = null;

const attachListeners = () => {
  if (!socket) return;
  socket.off('driver_location');
  socket.on('driver_location', (raw: any) => {
    if (
      raw &&
      typeof raw.latitude === 'number' &&
      typeof raw.longitude === 'number'
    ) {
      driverLocationCb?.(raw as DriverLocation);
    }
  });
};

/**
 * Connect (or reuse) the customer's booking socket. Pulls the JWT from storage.
 * Reconnects automatically; safe to call repeatedly.
 */
export const connectSocket = async (): Promise<void> => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) return;

  if (socket) {
    socket.auth = { token: `Bearer ${token}` };
    if (!socket.connected) socket.connect();
    attachListeners();
    return;
  }

  socket = io(SOCKET_URL, {
    path: '/socket.io',
    auth: { token: `Bearer ${token}` },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
  });

  socket.on('connect', attachListeners);

  // On forced disconnect (expired JWT), refresh token from storage and reconnect.
  socket.on('disconnect', async (reason) => {
    if (reason === 'io server disconnect') {
      const fresh = await AsyncStorage.getItem('auth_token');
      if (fresh && socket) {
        socket.auth = { token: `Bearer ${fresh}` };
        socket.connect();
      }
    }
  });

  attachListeners();
};

/** Subscribe to live driver-location updates. Returns an unsubscribe fn. */
export const onDriverLocation = (cb: (loc: DriverLocation) => void): (() => void) => {
  driverLocationCb = cb;
  attachListeners();
  return () => {
    driverLocationCb = null;
  };
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  driverLocationCb = null;
};

export const isSocketConnected = (): boolean => !!socket && socket.connected;
