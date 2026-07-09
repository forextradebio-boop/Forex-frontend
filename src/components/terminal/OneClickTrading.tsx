import React from 'react';
import { Zap } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';

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
  oneClickEnabled: boolean;
  setOneClickEnabled: (enabled: boolean) => void;
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
  executeOrder,
  oneClickEnabled,
  setOneClickEnabled
}) => {
  const { marketEnabled } = useMarket();
  const spread = (liveAsk && liveBid) ? (liveAsk - liveBid).toFixed(5) : '-';

  return (
    <div className="bg-lb-panel border border-lb-border rounded-xl shadow-xl w-72 flex flex-col p-4 z-10 shrink-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-lb-border">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lb-text">{selectedSymbol}</span>
          <span className="text-[9px] font-bold bg-lb-bg px-1.5 py-0.5 rounded text-lb-text-muted border border-lb-border uppercase tracking-wider">1:100</span>
        </div>
        <button 
          onClick={() => setOneClickEnabled(!oneClickEnabled)}
          className="p-1 hover:bg-lb-bg rounded transition-colors"
          title={oneClickEnabled ? "One-Click Trading Enabled" : "Order Confirmation Enabled"}
        >
          {oneClickEnabled ? <Zap className="w-4 h-4 text-lb-accent" /> : <div className="w-4 h-4 rounded border-2 border-lb-text-muted flex items-center justify-center text-[9px] font-bold text-lb-text-muted">?</div>}
        </button>
      </div>

      <div className="flex justify-between items-center text-[10px] mb-3 px-1 text-lb-text-muted">
        <span>Spread: <span className="font-bold text-lb-text">{spread}</span></span>
        <span>Vol: <span className="font-bold text-lb-text">{orderVolume}</span></span>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 mb-4 bg-lb-bg rounded-lg p-1 border border-lb-border">
        <button 
          onClick={() => setOrderVolume(Math.max(0.01, parseFloat(orderVolume) - 0.01).toFixed(2))} 
          className="w-8 h-8 rounded flex items-center justify-center font-bold text-lb-text-muted hover:bg-lb-panel-hover hover:text-lb-text transition-colors"
        >
          -
        </button>
        <input 
          type="number" 
          step="0.01" 
          value={orderVolume} 
          onChange={(e) => setOrderVolume(e.target.value)}
          className="flex-1 bg-transparent text-center font-mono font-extrabold text-base outline-none text-lb-text"
        />
        <button 
          onClick={() => setOrderVolume((parseFloat(orderVolume) + 0.01).toFixed(2))} 
          className="w-8 h-8 rounded flex items-center justify-center font-bold text-lb-text-muted hover:bg-lb-panel-hover hover:text-lb-text transition-colors"
        >
          +
        </button>
      </div>

      {/* SL / TP */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-lb-text-muted">Stop Loss</label>
          <input 
            type="number" 
            step="0.00001" 
            placeholder="0.00000" 
            value={orderSL} 
            onChange={(e) => setOrderSL(e.target.value)} 
            className="w-full px-2 py-1.5 rounded-lg border border-lb-border bg-lb-bg font-mono text-xs outline-none focus:border-lb-accent focus:bg-lb-panel focus:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300 text-lb-text" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-lb-text-muted">Take Profit</label>
          <input 
            type="number" 
            step="0.00001" 
            placeholder="0.00000" 
            value={orderTP} 
            onChange={(e) => setOrderTP(e.target.value)} 
            className="w-full px-2 py-1.5 rounded-lg border border-lb-border bg-lb-bg font-mono text-xs outline-none focus:border-lb-accent focus:bg-lb-panel focus:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300 text-lb-text" 
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto relative">
        {!marketEnabled && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-lb-panel/80 backdrop-blur-[1px] rounded-xl border border-lb-border/50 cursor-not-allowed">
            <span className="text-xs font-bold text-lb-text-muted uppercase tracking-widest">Market Closed</span>
          </div>
        )}
        <button 
          onClick={() => executeOrder('SELL')}
          disabled={isPlacingOrder || liveBid === 0 || !marketEnabled}
          className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-lb-down/10 hover:bg-lb-down text-lb-down hover:text-lb-text border border-lb-down/30 hover:border-lb-down hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 group"
        >
          <span className="font-extrabold text-sm uppercase tracking-wide">Sell</span>
          <span className="font-mono text-xs mt-0.5 group-hover:text-lb-text">{liveBid > 0 ? liveBid.toFixed(5) : '0.00000'}</span>
        </button>
        <button 
          onClick={() => executeOrder('BUY')}
          disabled={isPlacingOrder || liveAsk === 0 || !marketEnabled}
          className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-lb-accent/10 hover:bg-lb-accent text-lb-accent hover:text-lb-bg border border-lb-accent/30 hover:border-lb-accent hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 group"
        >
          <span className="font-extrabold text-sm uppercase tracking-wide">Buy</span>
          <span className="font-mono text-xs mt-0.5 group-hover:text-lb-bg">{liveAsk > 0 ? liveAsk.toFixed(5) : '0.00000'}</span>
        </button>
      </div>
    </div>
  );
};
