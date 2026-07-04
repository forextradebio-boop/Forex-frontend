import React from 'react';
import { Zap } from 'lucide-react';

interface OneClickTradingProps {
  selectedSymbol: string;
  liveBid: number;
  liveAsk: number;
  orderVolume: string;
  setOrderVolume: (vol: string) => void;
  orderSL: string;
  setOrderSL: (sl: string) => void;
  orderTP: string;
  setOrderTP: (tp: string) => void;
  isPlacingOrder: boolean;
  executeOrder: (side: 'BUY' | 'SELL') => void;
}

export const OneClickTrading: React.FC<OneClickTradingProps> = ({
  selectedSymbol,
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
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-72 flex flex-col p-4 z-10 shrink-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <span className="font-extrabold text-slate-900">{selectedSymbol}</span>
        <Zap className="w-4 h-4 text-amber-500" />
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-lg p-1 border border-slate-200">
        <button 
          onClick={() => setOrderVolume(Math.max(0.01, parseFloat(orderVolume) - 0.01).toFixed(2))} 
          className="w-8 h-8 rounded flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          -
        </button>
        <input 
          type="number" 
          step="0.01" 
          value={orderVolume} 
          onChange={(e) => setOrderVolume(e.target.value)}
          className="flex-1 bg-transparent text-center font-mono font-extrabold text-base outline-none text-slate-900"
        />
        <button 
          onClick={() => setOrderVolume((parseFloat(orderVolume) + 0.01).toFixed(2))} 
          className="w-8 h-8 rounded flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          +
        </button>
      </div>

      {/* SL / TP */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500">Stop Loss</label>
          <input 
            type="number" 
            step="0.00001" 
            placeholder="0.00000" 
            value={orderSL} 
            onChange={(e) => setOrderSL(e.target.value)} 
            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-900" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500">Take Profit</label>
          <input 
            type="number" 
            step="0.00001" 
            placeholder="0.00000" 
            value={orderTP} 
            onChange={(e) => setOrderTP(e.target.value)} 
            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-900" 
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button 
          onClick={() => executeOrder('SELL')}
          disabled={isPlacingOrder || liveBid === 0}
          className="flex flex-col items-center justify-center py-2 rounded-lg bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 transition-all disabled:opacity-50 group"
        >
          <span className="font-extrabold text-sm uppercase tracking-wide">Sell</span>
          <span className="font-mono text-xs mt-0.5 group-hover:text-red-100">{liveBid > 0 ? liveBid.toFixed(5) : '0.00000'}</span>
        </button>
        <button 
          onClick={() => executeOrder('BUY')}
          disabled={isPlacingOrder || liveAsk === 0}
          className="flex flex-col items-center justify-center py-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 transition-all disabled:opacity-50 group"
        >
          <span className="font-extrabold text-sm uppercase tracking-wide">Buy</span>
          <span className="font-mono text-xs mt-0.5 group-hover:text-blue-100">{liveAsk > 0 ? liveAsk.toFixed(5) : '0.00000'}</span>
        </button>
      </div>
    </div>
  );
};
