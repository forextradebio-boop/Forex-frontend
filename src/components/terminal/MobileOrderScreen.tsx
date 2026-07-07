import React from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';

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
  executeOrder
}) => {

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

  return (
    <div className="fixed inset-0 bg-lb-bg z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-lb-border bg-lb-panel relative shrink-0">
        <button onClick={onClose} className="w-10 h-10 bg-lb-bg rounded-full flex items-center justify-center text-lb-text hover:bg-lb-panel-hover active:scale-95 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 font-bold text-lg text-lb-text">
            {displaySymbol} <ChevronDown className="w-4 h-4 text-lb-text-muted" />
          </div>
          <span className="text-[11px] text-lb-text-muted">{displaySubtitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Execution Type */}
        <div className="px-4 py-4 flex justify-between items-center border-b border-lb-border bg-lb-panel mt-2">
          <span className="font-semibold text-[17px] text-lb-text">Market Execution</span>
          <ChevronDown className="w-5 h-5 text-lb-text-muted" />
        </div>

        {/* Volume Selector */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-lb-border bg-lb-panel">
          <button onClick={() => adjustVolume(-0.5)} className="text-lb-accent font-bold text-[17px] active:scale-95 transition-transform">-0.5</button>
          <button onClick={() => adjustVolume(-0.1)} className="text-lb-accent font-bold text-[17px] active:scale-95 transition-transform">-0.1</button>
          <input 
            type="number" 
            value={orderVolume} 
            onChange={e => setOrderVolume(e.target.value)}
            className="w-20 text-center font-bold text-xl outline-none bg-transparent text-lb-text"
          />
          <button onClick={() => adjustVolume(0.1)} className="text-lb-accent font-bold text-[17px] active:scale-95 transition-transform">+0.1</button>
          <button onClick={() => adjustVolume(0.5)} className="text-lb-accent font-bold text-[17px] active:scale-95 transition-transform">+0.5</button>
        </div>

        {/* Stop Loss / Take Profit */}
        <div className="flex flex-col border-b border-lb-border bg-lb-panel mt-2">
          <div className="flex items-center justify-between px-4 py-4 border-b border-lb-border">
            <span className="text-lb-text-muted font-medium text-[15px] w-28">Stop Loss</span>
            <button onClick={() => {
              const step = liveBid > 10 ? 0.01 : 0.0001;
              const current = orderSL ? parseFloat(orderSL) : liveBid;
              setOrderSL((current - step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-lb-accent font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-lb-accent/10 active:scale-95 rounded-full transition-all">-</button>
            <input 
              type="number" 
              placeholder="not set" 
              value={orderSL}
              onChange={e => setOrderSL(e.target.value)}
              className="flex-1 text-center text-lb-text font-medium text-[16px] outline-none bg-transparent placeholder-lb-text-muted/50 focus:text-lb-accent transition-colors"
            />
            <button onClick={() => {
              const step = liveBid > 10 ? 0.01 : 0.0001;
              const current = orderSL ? parseFloat(orderSL) : liveBid;
              setOrderSL((current + step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-lb-accent font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-lb-accent/10 active:scale-95 rounded-full transition-all">+</button>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-lb-text-muted font-medium text-[15px] w-28">Take Profit</span>
            <button onClick={() => {
              const step = liveAsk > 10 ? 0.01 : 0.0001;
              const current = orderTP ? parseFloat(orderTP) : liveAsk;
              setOrderTP((current - step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-lb-accent font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-lb-accent/10 active:scale-95 rounded-full transition-all">-</button>
            <input 
              type="number" 
              placeholder="not set" 
              value={orderTP}
              onChange={e => setOrderTP(e.target.value)}
              className="flex-1 text-center text-lb-text font-medium text-[16px] outline-none bg-transparent placeholder-lb-text-muted/50 focus:text-lb-accent transition-colors"
            />
            <button onClick={() => {
              const step = liveAsk > 10 ? 0.01 : 0.0001;
              const current = orderTP ? parseFloat(orderTP) : liveAsk;
              setOrderTP((current + step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-lb-accent font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-lb-accent/10 active:scale-95 rounded-full transition-all">+</button>
          </div>
        </div>

        {/* Fill Policy */}
        <div className="flex justify-between items-center px-4 py-4 border-b border-lb-border bg-lb-panel mt-2">
          <span className="text-lb-text-muted font-medium text-[15px]">Fill Policy</span>
          <span className="text-lb-text-muted font-medium text-[15px]">Fill or Kill</span>
        </div>

        {/* Prices */}
        <div className="flex items-center justify-between px-10 py-6">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light text-lb-down font-mono tracking-tighter">
              {liveBid.toFixed(5).slice(0, -2)}<span className="text-[42px] font-medium">{liveBid.toFixed(5).slice(-2)}</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light text-lb-accent font-mono tracking-tighter">
              {liveAsk.toFixed(5).slice(0, -2)}<span className="text-[42px] font-medium">{liveAsk.toFixed(5).slice(-2)}</span>
            </span>
          </div>
        </div>

        {/* Execution Buttons */}
        <div className="flex px-4 gap-4 mb-4">
          <button 
            onClick={() => executeOrder('SELL')}
            disabled={isPlacingOrder}
            className="flex-1 bg-lb-down/10 text-lb-down border border-lb-down/30 hover:border-lb-down py-4 rounded-xl font-bold text-[17px] active:scale-95 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            Sell by Market
          </button>
          <button 
            onClick={() => executeOrder('BUY')}
            disabled={isPlacingOrder}
            className="flex-1 bg-lb-accent/10 text-lb-accent border border-lb-accent/30 hover:border-lb-accent py-4 rounded-xl font-bold text-[17px] active:scale-95 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            Buy by Market
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-8 text-center mt-2">
          <p className="text-[12px] text-lb-text-muted leading-snug">
            Attention! The trade will be executed at market conditions, difference with requested price may be significant!
          </p>
        </div>
      </div>
    </div>
  );
};
