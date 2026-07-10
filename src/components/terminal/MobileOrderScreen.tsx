import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';

interface MobileOrderScreenProps {
  symbol: string;
  onClose: () => void;
  liveBid: number;
  liveAsk: number;
  orderVolume: string;
  setOrderVolume: (v: string) => void;
  orderSL: string;
  setOrderSL: (v: string) => void;
  orderTP: string;
  setOrderTP: (v: string) => void;
  isPlacingOrder: boolean;
  executeOrder: (side: 'BUY' | 'SELL') => void;
  oneClickEnabled: boolean;
  setOneClickEnabled: (enabled: boolean) => void;
  walletBalance?: number;
  liveEquity?: number;
  liveFreeMargin?: number;
  liveMargin?: number;
}

export const MobileOrderScreen: React.FC<MobileOrderScreenProps> = ({
  symbol,
  onClose,
  liveBid,
  liveAsk,
  orderVolume,
  setOrderVolume,
  orderSL,
  setOrderSL,
  orderTP,
  setOrderTP,
  isPlacingOrder,
  executeOrder,
  oneClickEnabled,
  setOneClickEnabled,
  walletBalance = 0,
  liveEquity = 0,
  liveFreeMargin = 0,
  liveMargin = 0
}) => {
  const { marketEnabled } = useMarket();

  // Highlight flash state for bid/ask changes
  const [bidColor, setBidColor] = useState('text-lb-down');
  const [askColor, setAskColor] = useState('text-lb-accent');
  
  useEffect(() => {
    setBidColor('text-red-400');
    const timer = setTimeout(() => setBidColor('text-lb-down'), 150);
    return () => clearTimeout(timer);
  }, [liveBid]);

  useEffect(() => {
    setAskColor('text-teal-400');
    const timer = setTimeout(() => setAskColor('text-lb-accent'), 150);
    return () => clearTimeout(timer);
  }, [liveAsk]);

  const normalizeSymbol = (symbolValue: string) => symbolValue.replace(/m$/i, '').toUpperCase();

  const getSymbolLabel = (symbolValue: string) => {
    const raw = normalizeSymbol(symbolValue);
    const special = {
      XAUUSD: 'XAU/USD',
      XAGUSD: 'XAG/USD',
      BTCUSD: 'BTC/USD',
      ETHUSD: 'ETH/USD',
    } as Record<string, string>;
    if (special[raw]) return special[raw];
    return raw.replace(/^([A-Z]{3})([A-Z]{3})$/, '$1/$2') || raw;
  };

  const getSymbolSubtitle = (symbolValue: string) => {
    const raw = normalizeSymbol(symbolValue);
    const currencyNames: Record<string, string> = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      AUD: 'Australian Dollar',
      CAD: 'Canadian Dollar',
      CHF: 'Swiss Franc',
      NZD: 'New Zealand Dollar',
    };
    const base = raw.slice(0, 3);
    const quote = raw.slice(3);
    const baseName = ({ XAUUSD: 'Gold', XAGUSD: 'Silver', BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum' } as Record<string, string>)[raw] || currencyNames[base] || base;
    const quoteName = currencyNames[quote] || quote;
    return `${baseName} vs ${quoteName}`;
  };

  const displaySymbol = getSymbolLabel(symbol);
  const displaySubtitle = getSymbolSubtitle(symbol);

  const adjustVolume = (amount: number) => {
    const current = parseFloat(orderVolume) || 0;
    const next = Math.max(0.01, current + amount);
    setOrderVolume(next.toFixed(2));
  };

  const stepSL = (amount: number) => {
    const current = orderSL ? parseFloat(orderSL) : liveBid;
    const step = liveBid > 10 ? 0.01 : 0.0001;
    const adjust = liveBid > 10 ? amount * 100 : amount; 
    setOrderSL((current + adjust * step).toFixed(step === 0.01 ? 2 : 5));
  };

  const stepTP = (amount: number) => {
    const current = orderTP ? parseFloat(orderTP) : liveAsk;
    const step = liveAsk > 10 ? 0.01 : 0.0001;
    const adjust = liveAsk > 10 ? amount * 100 : amount;
    setOrderTP((current + adjust * step).toFixed(step === 0.01 ? 2 : 5));
  };

  const renderPriceLarge = (price: number, colorClass: string) => {
    if (!price) return <span className={`text-4xl font-mono ${colorClass}`}>-</span>;
    const pStr = price.toFixed(5);
    const main = pStr.slice(0, -2);
    const pip = pStr.slice(-2, -1);
    const pipette = pStr.slice(-1);
    
    return (
      <span className={`flex items-baseline font-mono tracking-tighter ${colorClass}`}>
        <span className="text-3xl font-light">{main}</span>
        <span className="text-[44px] font-bold leading-none">{pip}</span>
        <span className="text-xl font-medium mb-4 ml-[1px]">{pipette}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-lb-bg z-50 flex flex-col font-sans overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-lb-panel relative shrink-0 shadow-md z-10 border-b border-lb-border">
        <button onClick={onClose} className="w-10 h-10 relative z-20 bg-lb-bg rounded-full flex items-center justify-center text-lb-text hover:bg-lb-panel-hover active:scale-95 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center -ml-10">
          <div className="flex items-center gap-1 font-bold text-[19px] text-lb-text tracking-tight">
            {displaySymbol}
          </div>
          <span className="text-[12px] text-lb-text-muted">{displaySubtitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        
        {/* Execution Type Selector */}
        <div className="mx-4 mt-4 px-4 py-3.5 flex justify-between items-center bg-lb-panel rounded-xl border border-lb-border shadow-sm active:bg-lb-panel-hover cursor-pointer">
          <span className="font-semibold text-[16px] text-lb-text">Market Execution</span>
          <ChevronDown className="w-5 h-5 text-lb-text-muted" />
        </div>

        {/* Volume Selector - MT5 Style */}
        <div className="mx-4 mt-3 flex justify-between items-center bg-lb-panel rounded-xl border border-lb-border p-2 shadow-sm">
          <div className="flex gap-1">
            <button onClick={() => adjustVolume(-0.1)} className="px-2 py-2 text-lb-accent font-bold text-[15px] active:scale-95 transition-transform bg-lb-bg rounded-lg w-12 text-center">-0.1</button>
            <button onClick={() => adjustVolume(-0.01)} className="px-2 py-2 text-lb-accent font-bold text-[15px] active:scale-95 transition-transform bg-lb-bg rounded-lg w-12 text-center">-0.01</button>
          </div>
          <input 
            type="number" 
            value={orderVolume} 
            onChange={e => setOrderVolume(e.target.value)}
            className="w-20 text-center font-bold text-[22px] outline-none bg-transparent text-lb-text font-mono"
            step="0.01"
            min="0.01"
          />
          <div className="flex gap-1">
            <button onClick={() => adjustVolume(0.01)} className="px-2 py-2 text-lb-accent font-bold text-[15px] active:scale-95 transition-transform bg-lb-bg rounded-lg w-12 text-center">+0.01</button>
            <button onClick={() => adjustVolume(0.1)} className="px-2 py-2 text-lb-accent font-bold text-[15px] active:scale-95 transition-transform bg-lb-bg rounded-lg w-12 text-center">+0.1</button>
          </div>
        </div>

        {/* Big Prices (Bid / Ask) */}
        <div className="flex items-center justify-between px-6 py-6 mt-2">
          <div className="flex flex-col items-center flex-1">
            <span className="text-[12px] text-lb-text-muted mb-1 font-semibold tracking-wider">BID</span>
            {renderPriceLarge(liveBid, bidColor)}
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[12px] text-lb-text-muted mb-1 font-semibold tracking-wider">ASK</span>
            {renderPriceLarge(liveAsk, askColor)}
          </div>
        </div>

        {/* Stop Loss / Take Profit */}
        <div className="mx-4 mt-2 flex gap-3">
          {/* Stop Loss Block */}
          <div className="flex-1 bg-lb-panel rounded-xl border border-lb-border p-3 flex flex-col shadow-sm">
            <span className="text-lb-text-muted font-bold text-[12px] uppercase tracking-wider text-center mb-2">Stop Loss</span>
            <div className="flex items-center justify-between bg-lb-bg rounded-lg p-1">
              <button onClick={() => stepSL(-1)} className="w-8 h-8 flex items-center justify-center text-lb-down font-bold text-xl active:bg-lb-panel rounded-md transition-colors">-</button>
              <input 
                type="number" 
                placeholder="Not set" 
                value={orderSL}
                onChange={e => setOrderSL(e.target.value)}
                className="w-full text-center text-lb-text font-bold text-[16px] outline-none bg-transparent placeholder-lb-text-muted/40 font-mono"
              />
              <button onClick={() => stepSL(1)} className="w-8 h-8 flex items-center justify-center text-lb-down font-bold text-xl active:bg-lb-panel rounded-md transition-colors">+</button>
            </div>
          </div>
          
          {/* Take Profit Block */}
          <div className="flex-1 bg-lb-panel rounded-xl border border-lb-border p-3 flex flex-col shadow-sm">
            <span className="text-lb-text-muted font-bold text-[12px] uppercase tracking-wider text-center mb-2">Take Profit</span>
            <div className="flex items-center justify-between bg-lb-bg rounded-lg p-1">
              <button onClick={() => stepTP(-1)} className="w-8 h-8 flex items-center justify-center text-lb-accent font-bold text-xl active:bg-lb-panel rounded-md transition-colors">-</button>
              <input 
                type="number" 
                placeholder="Not set" 
                value={orderTP}
                onChange={e => setOrderTP(e.target.value)}
                className="w-full text-center text-lb-text font-bold text-[16px] outline-none bg-transparent placeholder-lb-text-muted/40 font-mono"
              />
              <button onClick={() => stepTP(1)} className="w-8 h-8 flex items-center justify-center text-lb-accent font-bold text-xl active:bg-lb-panel rounded-md transition-colors">+</button>
            </div>
          </div>
        </div>

        {/* Fill Policy / Deviation */}
        <div className="mx-4 mt-4 mb-2 flex justify-between px-2 text-[12px] text-lb-text-muted font-medium">
          <span>Deviation: <span className="text-lb-text">0</span></span>
          <span>Fill Policy: <span className="text-lb-text">Fill or Kill</span></span>
        </div>

        {/* Execution Buttons */}
        <div className="flex px-4 gap-3 mt-4 relative">
          {!marketEnabled && (
            <div className="absolute inset-0 z-10 mx-4 flex items-center justify-center bg-lb-bg/80 backdrop-blur-sm rounded-xl border border-lb-border cursor-not-allowed">
              <span className="text-[15px] font-bold text-lb-text-muted uppercase tracking-widest">Market is Closed</span>
            </div>
          )}
          <button 
            onClick={() => executeOrder('SELL')}
            disabled={isPlacingOrder || !marketEnabled}
            className="flex-1 bg-[#d93043] text-white py-4 rounded-xl font-bold text-[17px] active:scale-95 shadow-[0_4px_10px_rgba(217,48,67,0.3)] transition-transform disabled:opacity-50 flex flex-col items-center justify-center leading-tight"
          >
            <span>SELL</span>
            <span className="text-[11px] font-normal opacity-80 uppercase tracking-widest mt-0.5">by Market</span>
          </button>
          <button 
            onClick={() => executeOrder('BUY')}
            disabled={isPlacingOrder || !marketEnabled}
            className="flex-1 bg-[#007aff] text-white py-4 rounded-xl font-bold text-[17px] active:scale-95 shadow-[0_4px_10px_rgba(0,122,255,0.3)] transition-transform disabled:opacity-50 flex flex-col items-center justify-center leading-tight"
          >
            <span>BUY</span>
            <span className="text-[11px] font-normal opacity-80 uppercase tracking-widest mt-0.5">by Market</span>
          </button>
        </div>

        {/* Account Details Footer */}
        <div className="mx-4 mt-6 bg-lb-panel rounded-xl border border-lb-border p-4 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-lb-text-muted font-medium">Balance:</span>
            <span className="text-lb-text font-bold font-mono">{walletBalance.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-lb-text-muted font-medium">Equity:</span>
            <span className="text-lb-text font-bold font-mono">{liveEquity.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-lb-text-muted font-medium">Margin:</span>
            <span className="text-lb-text font-bold font-mono">{liveMargin.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-lb-text-muted font-medium">Free Margin:</span>
            <span className="text-lb-text font-bold font-mono">{liveFreeMargin.toFixed(2)} USD</span>
          </div>
        </div>

      </div>
    </div>
  );
};

