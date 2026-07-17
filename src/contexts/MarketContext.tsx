import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from './SocketContext';

interface PlatformStatus {
  globalTradingStatus: 'ON' | 'OFF';
  globalGraphStatus: 'LIVE' | 'PAUSED';
  globalMarketStatus: 'OPEN' | 'CLOSED' | 'MAINTENANCE' | 'HOLIDAY';
}

interface MarketContextValue {
  platformStatus: PlatformStatus;
}

const defaultStatus: PlatformStatus = {
  globalTradingStatus: 'ON',
  globalGraphStatus: 'LIVE',
  globalMarketStatus: 'OPEN',
};

const MarketContext = createContext<MarketContextValue>({
  platformStatus: defaultStatus,
});

export const useMarket = () => useContext(MarketContext);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>(defaultStatus);
  const { socket } = useSocket();

  useEffect(() => {
    // Initial fetch
    api.get('/market/platform-status').then(res => {
      setPlatformStatus({
        globalTradingStatus: res.data.globalTradingStatus || 'ON',
        globalGraphStatus: res.data.globalGraphStatus || 'LIVE',
        globalMarketStatus: res.data.globalMarketStatus || 'OPEN',
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handlePlatformUpdate = (settings: any) => {
      setPlatformStatus({
        globalTradingStatus: settings.globalTradingStatus || 'ON',
        globalGraphStatus: settings.globalGraphStatus || 'LIVE',
        globalMarketStatus: settings.globalMarketStatus || 'OPEN',
      });
    };

    socket.on('PLATFORM_STATUS_UPDATED', handlePlatformUpdate);
    return () => {
      socket.off('PLATFORM_STATUS_UPDATED', handlePlatformUpdate);
    };
  }, [socket]);

  return (
    <MarketContext.Provider value={{ platformStatus }}>
      {children}
    </MarketContext.Provider>
  );
};
