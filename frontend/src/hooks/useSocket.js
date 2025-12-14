import { useEffect, useState, useRef } from 'react';
import { getSocket, keepAlive as socketKeepAlive } from '../utils/socket';
import { SOCKET_EVENTS } from '../constants/game';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socketInstance = getSocket();
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const handleConnect = () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const handleDisconnect = (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      // Try to reconnect after 1 second
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            console.log('Attempting to reconnect...');
            socketRef.current.connect();
          }
        }, 1000);
      }
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    };

    const handleReconnect = () => {
      console.log('✅ Socket reconnected');
      setIsConnected(true);
      // Trigger a reconnect event that the parent can listen to
      if (socketRef.current) {
        socketRef.current.emit('socket_reconnected');
      }
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('reconnect', handleReconnect);

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      if (socketRef.current) {
        const connected = socketRef.current.connected;
        setIsConnected(connected);
        
        if (!connected) {
          console.log('Connection lost, attempting to reconnect...');
          socketRef.current.connect();
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(connectionCheck);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('reconnect', handleReconnect);
    };
  }, []);

  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      console.log('Manual connect triggered');
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Manual disconnect triggered');
      socketRef.current.disconnect();
    }
  };

  const emit = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event} - socket not connected`);
      // Try to reconnect
      connect();
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const keepAlive = () => {
    socketKeepAlive();
  };

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
    keepAlive,
  };
};