import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let heartbeatInterval = null;
let reconnectAttempts = 0;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      forceNew: true,
      multiplex: false
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      reconnectAttempts = 0;
      startHeartbeat();
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      stopHeartbeat();
      
      // Auto reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      reconnectAttempts++;
      console.error(`Connection error (attempt ${reconnectAttempts}):`, error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      reconnectAttempts = 0;
    });

    socket.on('pong', () => {
      console.log('💓 Heartbeat pong received');
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  return socket;
};

const startHeartbeat = () => {
  stopHeartbeat();
  
  // Send ping every 10 seconds to keep connection alive
  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('ping');
      console.log('💓 Sending heartbeat ping');
    }
  }, 10000);
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  stopHeartbeat();
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

// Keep connection alive function
export const keepAlive = () => {
  if (socket && socket.connected) {
    socket.emit('ping');
  }
};