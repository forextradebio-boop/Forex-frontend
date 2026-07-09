import React, { useState } from 'react';
import { Terminal, Clock, Settings, Layers } from 'lucide-react';
import { Position } from '../../types';

const formatPrice = (price: number | undefined | null) => {
  if (price == null) return '-';
  return price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 5 }).replace(/,/g, ' ');
};

interface BottomTerminalProps {
  positions: Position[];
  closedHistory: any[];
  onClosePosition: (id: string) => void;
}

export const BottomTerminal: React.FC<BottomTerminalProps> = ({
  positions,
  closedHistory,
  onClosePosition
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const toCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="h-56 shrink-0 flex flex-col border-t bg-lb-panel border-lb-border z-20">
      
      {/* Terminal Tabs */}
      <div className="flex items-center px-2 h-10 border-b border-lb-border bg-lb-bg overflow-x-auto no-scrollbar shrink-0">
        <button 
          onClick={() => setActiveTab('open')}
          className={`px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'open' 
              ? 'border-lb-accent text-lb-accent bg-lb-panel' 
              : 'border-transparent text-lb-text-muted hover:text-lb-text'
          }`}
        >
          <Terminal className="w-4 h-4" /> Trade ({positions.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-lb-accent text-lb-accent bg-lb-panel' 
              : 'border-transparent text-lb-text-muted hover:text-lb-text'
          }`}
        >
          <Clock className="w-4 h-4" /> History
        </button>
        <button className="px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 border-transparent text-lb-text-muted/50 cursor-not-allowed">
          <Layers className="w-4 h-4" /> Exposure
        </button>
        <button className="px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 border-transparent text-lb-text-muted/50 cursor-not-allowed">
          <Settings className="w-4 h-4" /> Journal
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-lb-panel">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-10 font-bold bg-lb-bg text-lb-text-muted shadow-sm border-b border-lb-border">
            <tr>
              <th className="px-4 py-2 font-semibold">Symbol</th>
              <th className="px-4 py-2 font-semibold">Ticket</th>
              <th className="px-4 py-2 font-semibold">Time</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold text-right">Volume</th>
              <th className="px-4 py-2 font-semibold text-right">Price</th>
              <th className="px-4 py-2 font-semibold text-right">S / L</th>
              <th className="px-4 py-2 font-semibold text-right">T / P</th>
              <th className="px-4 py-2 font-semibold text-right">Price</th>
              <th className="px-4 py-2 font-semibold text-right">Swap</th>
              <th className="px-4 py-2 font-semibold text-right">Profit</th>
              {activeTab === 'open' && <th className="px-4 py-2 font-semibold text-center w-20">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-lb-border font-mono text-lb-text">
            {activeTab === 'open' && positions.map(p => (
              <tr key={p.id} className="hover:bg-lb-panel-hover transition-colors">
                <td className="px-4 py-2 font-bold font-sans flex items-center gap-1.5 text-lb-text">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.side === 'BUY' ? 'bg-lb-accent' : 'bg-lb-down'}`} />
                  {p.symbol}
                </td>
                <td className="px-4 py-2 text-lb-text-muted text-[11px]">#{p.id.slice(-6)}</td>
                <td className="px-4 py-2 text-lb-text-muted text-[11px]">{new Date(p.timestamp || Date.now()).toLocaleString().replace(',', '')}</td>
                <td className={`px-4 py-2 font-bold ${p.side === 'BUY' ? 'text-lb-accent' : 'text-lb-down'}`}>{p.side?.toLowerCase()}</td>
                <td className="px-4 py-2 text-right">{p.size.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{formatPrice(p.entryPrice)}</td>
                <td className="px-4 py-2 text-right">{formatPrice(p.slPrice) !== '-' ? formatPrice(p.slPrice) : '0.00000'}</td>
                <td className="px-4 py-2 text-right">{formatPrice(p.tpPrice) !== '-' ? formatPrice(p.tpPrice) : '0.00000'}</td>
                <td className="px-4 py-2 text-right">{formatPrice(p.currentPrice || p.entryPrice)}</td>
                <td className="px-4 py-2 text-right">0.00</td>
                <td className={`px-4 py-2 text-right font-bold ${p.pnl && p.pnl >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                  {toCurrency(p.pnl || 0)}
                </td>
                <td className="px-4 py-1.5 text-center">
                  <button 
                    onClick={() => onClosePosition(p.id)} 
                    className="w-full py-1 rounded bg-lb-bg hover:bg-lb-down/10 text-lb-text-muted hover:text-lb-down border border-transparent hover:border-lb-down/30 transition-colors font-sans text-[10px] font-bold"
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
            {activeTab === 'history' && closedHistory.map((item, idx) => {
              if (item.historyType === 'transaction') {
                return (
                  <tr key={idx} className="hover:bg-lb-panel-hover transition-colors">
                    <td className="px-4 py-2 font-bold font-sans text-lb-text-muted" colSpan={7}>
                      {item.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} • {item.description || 'Wallet transaction'}
                      <div className="text-[11px] text-lb-text-muted mt-1">{new Date(item.entryDate).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-lb-text">{toCurrency(item.amount)}</td>
                  </tr>
                )
              }

              return (
                <tr key={idx} className="hover:bg-lb-panel-hover transition-colors opacity-90">
                  <td className="px-4 py-2 font-bold font-sans flex items-center gap-1.5 text-lb-text">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.side === 'BUY' ? 'bg-lb-accent' : 'bg-lb-down'}`} />
                    {item.symbol}
                  </td>
                  <td className="px-4 py-2 text-lb-text-muted text-[11px]">#{item.id?.slice(-6) || '---'}</td>
                  <td className="px-4 py-2 text-lb-text-muted text-[11px]">{new Date(item.timestamp || item.entryDate || Date.now()).toLocaleString().replace(',', '')}</td>
                  <td className={`px-4 py-2 font-bold ${item.side === 'BUY' ? 'text-lb-accent' : 'text-lb-down'}`}>{item.side?.toLowerCase()}</td>
                  <td className="px-4 py-2 text-right">{item.size?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.entryPrice)}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.slPrice) !== '-' ? formatPrice(item.slPrice) : '0.00000'}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.tpPrice) !== '-' ? formatPrice(item.tpPrice) : '0.00000'}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.closePrice)}</td>
                  <td className="px-4 py-2 text-right">0.00</td>
                  <td className={`px-4 py-2 text-right font-bold ${item.pnl && item.pnl >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                    {toCurrency(item.pnl || 0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
