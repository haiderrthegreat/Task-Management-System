import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = async (token?: string) => {
  try {
    const t = token ?? (await AsyncStorage.getItem('token')) ?? undefined;

    if (!t) return null;

    if (socket) {
      return socket;
    }

    socket = io('http://172.16.29.39:3000', {
      auth: { token: t },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      // connected
    });

    socket.on('connect_error', () => {
      // ignore for now
    });

    return socket;
  } catch (err) {
    return null;
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { initSocket, getSocket, disconnectSocket };
