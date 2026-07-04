import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import * as marketService from '../services/market';
import { SymbolData } from '../types';

export function useMarketStream(initialSymbols: SymbolData[] = []) {
  const { socket } = useSocket();
  const [symbols, setSymbols] = useState<SymbolData[]>(initialSymbols);

  useEffect(() => {
    const fetchWatchList = async () => {
      try {
        const syms = await marketService.getWatch();
        if (syms?.length) {
          setSymbols(syms);
        }
      } catch (err) {
        console.error('Error loading market watch payloads.', err);
      }
    };
    fetchWatchList();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMarketUpdate = (data: SymbolData[]) => {
      if (data?.length) {
        setSymbols((current) => {
          const updateMap = new Map(data.map((item) => [item.symbol, item]));
          const merged = current.map((item) => updateMap.get(item.symbol) ?? item);
          const added = data.filter((item) => !current.some((currentItem) => currentItem.symbol === item.symbol));
          return [...merged, ...added];
        });
      }
    };

    socket.on('market:update', handleMarketUpdate);
    socket.on('prices', handleMarketUpdate);

    return () => {
      socket.off('market:update', handleMarketUpdate);
      socket.off('prices', handleMarketUpdate);
    };
  }, [socket]);

  return { symbols, setSymbols };
}
