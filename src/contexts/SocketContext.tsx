import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api/config';
import { useAuth } from './AuthContext';
import { useMarket } from './MarketContext';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

// Create singleton outside component to prevent double-connect in StrictMode
const socketInstance = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socketInstance.connected);
  const { user } = useAuth();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    socketInstance.connect();

    const onConnect = () => {
      setIsConnected(true);
      if (user?.id) {
        socketInstance.emit('subscribe', user.id);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    return () => {
      mounted.current = false;
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, []); // Only bind events once

  // Handle re-subscribing if user logs in after socket is already connected
  useEffect(() => {
    if (isConnected && user?.id) {
      socketInstance.emit('subscribe', user.id);
    }
  }, [user?.id, isConnected]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
