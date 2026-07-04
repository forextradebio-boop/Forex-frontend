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
    <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-white relative shrink-0">
        <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-100 absolute left-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 font-bold text-lg text-slate-900">
            {displaySymbol} <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-500">{displaySubtitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Execution Type */}
        <div className="px-4 py-4 flex justify-between items-center border-b border-slate-100">
          <span className="font-semibold text-[17px] text-slate-900">Market Execution</span>
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </div>

        {/* Volume Selector */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
          <button onClick={() => adjustVolume(-0.5)} className="text-blue-600 font-bold text-[17px] active:opacity-50">-0.5</button>
          <button onClick={() => adjustVolume(-0.1)} className="text-blue-600 font-bold text-[17px] active:opacity-50">-0.1</button>
          <input 
            type="number" 
            value={orderVolume} 
            onChange={e => setOrderVolume(e.target.value)}
            className="w-20 text-center font-bold text-xl outline-none bg-transparent"
          />
          <button onClick={() => adjustVolume(0.1)} className="text-blue-600 font-bold text-[17px] active:opacity-50">+0.1</button>
          <button onClick={() => adjustVolume(0.5)} className="text-blue-600 font-bold text-[17px] active:opacity-50">+0.5</button>
        </div>

        {/* Stop Loss / Take Profit */}
        <div className="flex flex-col border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-50">
            <span className="text-slate-600 font-medium text-[15px] w-28">Stop Loss</span>
            <button onClick={() => {
              const step = liveBid > 10 ? 0.01 : 0.0001;
              const current = orderSL ? parseFloat(orderSL) : liveBid;
              setOrderSL((current - step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-blue-600 font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-blue-50 rounded-full transition-colors">-</button>
            <input 
              type="number" 
              placeholder="not set" 
              value={orderSL}
              onChange={e => setOrderSL(e.target.value)}
              className="flex-1 text-center text-slate-800 font-medium text-[16px] outline-none bg-transparent placeholder-slate-300"
            />
            <button onClick={() => {
              const step = liveBid > 10 ? 0.01 : 0.0001;
              const current = orderSL ? parseFloat(orderSL) : liveBid;
              setOrderSL((current + step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-blue-600 font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-blue-50 rounded-full transition-colors">+</button>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-slate-600 font-medium text-[15px] w-28">Take Profit</span>
            <button onClick={() => {
              const step = liveAsk > 10 ? 0.01 : 0.0001;
              const current = orderTP ? parseFloat(orderTP) : liveAsk;
              setOrderTP((current - step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-blue-600 font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-blue-50 rounded-full transition-colors">-</button>
            <input 
              type="number" 
              placeholder="not set" 
              value={orderTP}
              onChange={e => setOrderTP(e.target.value)}
              className="flex-1 text-center text-slate-800 font-medium text-[16px] outline-none bg-transparent placeholder-slate-300"
            />
            <button onClick={() => {
              const step = liveAsk > 10 ? 0.01 : 0.0001;
              const current = orderTP ? parseFloat(orderTP) : liveAsk;
              setOrderTP((current + step).toFixed(step === 0.01 ? 2 : 5));
            }} className="text-blue-600 font-bold text-2xl w-8 h-8 flex items-center justify-center active:bg-blue-50 rounded-full transition-colors">+</button>
          </div>
        </div>

        {/* Fill Policy */}
        <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100">
          <span className="text-slate-600 font-medium text-[15px]">Fill Policy</span>
          <span className="text-slate-600 font-medium text-[15px]">Fill or Kill</span>
        </div>

        {/* Prices */}
        <div className="flex items-center justify-between px-10 py-6">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light text-blue-600 font-mono tracking-tighter">
              {liveBid.toFixed(5).slice(0, -2)}<span className="text-[42px] font-medium">{liveBid.toFixed(5).slice(-2)}</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light text-blue-600 font-mono tracking-tighter">
              {liveAsk.toFixed(5).slice(0, -2)}<span className="text-[42px] font-medium">{liveAsk.toFixed(5).slice(-2)}</span>
            </span>
          </div>
        </div>

        {/* Execution Buttons */}
        <div className="flex px-4 gap-4 mb-4">
          <button 
            onClick={() => executeOrder('SELL')}
            disabled={isPlacingOrder}
            className="flex-1 bg-[#ef5350] text-white py-4 rounded-sm font-semibold text-[17px] active:bg-[#d32f2f] transition-colors disabled:opacity-50"
          >
            Sell by Market
          </button>
          <button 
            onClick={() => executeOrder('BUY')}
            disabled={isPlacingOrder}
            className="flex-1 bg-[#4285f4] text-white py-4 rounded-sm font-semibold text-[17px] active:bg-[#1967d2] transition-colors disabled:opacity-50"
          >
            Buy by Market
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-8 text-center">
          <p className="text-[13px] text-slate-600 leading-snug">
            Attention! The trade will be executed at market conditions, difference with requested price may be significant!
          </p>
        </div>
      </div>
    </div>
  );
};
