import React, { createContext, useContext, useState, useEffect } from 'react';

interface MarketContextValue {
  marketEnabled: boolean;
  enableMarket: () => void;
  disableMarket: () => void;
  toggleMarket: () => void;
}

const MarketContext = createContext<MarketContextValue>({
  marketEnabled: true,
  enableMarket: () => {},
  disableMarket: () => {},
  toggleMarket: () => {}
});

export const useMarket = () => useContext(MarketContext);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketEnabled, setMarketEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('market_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('market_enabled', String(marketEnabled));
  }, [marketEnabled]);

  const enableMarket = () => setMarketEnabled(true);
  const disableMarket = () => setMarketEnabled(false);
  const toggleMarket = () => setMarketEnabled(prev => !prev);

  return (
    <MarketContext.Provider value={{ marketEnabled, enableMarket, disableMarket, toggleMarket }}>
      {children}
    </MarketContext.Provider>
  );
};
