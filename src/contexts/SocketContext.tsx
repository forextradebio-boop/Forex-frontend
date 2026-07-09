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
  const { marketEnabled } = useMarket();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (marketEnabled) {
      socketInstance.connect();
    }

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

  // Handle connection toggling when market status changes
  useEffect(() => {
    if (!mounted.current) return;
    
    if (marketEnabled) {
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
    } else {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    }
  }, [marketEnabled]);

  // Handle re-subscribing if user logs in after socket is already connected
  useEffect(() => {
    if (isConnected && user?.id && marketEnabled) {
      socketInstance.emit('subscribe', user.id);
    }
  }, [user?.id, isConnected, marketEnabled]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
