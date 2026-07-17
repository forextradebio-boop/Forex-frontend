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

  const historyWithBalance = React.useMemo(() => {
    if (activeTab !== 'history') return [];
    
    // Sort oldest first
    const sorted = [...closedHistory].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.entryDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.entryDate || b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    let currentBalance = 0;
    
    return sorted.map(item => {
      if (item.historyType === 'transaction') {
        if (item.type === 'DEPOSIT' && item.status === 'APPROVED') currentBalance += item.amount;
        else if ((item.type === 'WITHDRAWAL' || item.type === 'WITHDRAW') && item.status === 'APPROVED') currentBalance -= Math.abs(item.amount);
        else if (item.type === 'ADMIN_ADJUSTMENT') currentBalance += item.amount;
      } else {
        currentBalance += (item.pnl || 0) + (item.swap || 0) + (item.commission || 0);
      }
      return { ...item, runningBalance: currentBalance };
    }).reverse();
  }, [closedHistory, activeTab]);

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
      <div className="flex-1 overflow-auto bg-lb-panel">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-10 font-bold bg-lb-bg text-lb-text-muted shadow-sm border-b border-lb-border">
            <tr>
              {activeTab === 'open' ? (
                <>
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
                  <th className="px-4 py-2 font-semibold text-center w-20">Action</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2 font-semibold">Time</th>
                  <th className="px-4 py-2 font-semibold">Ticket</th>
                  <th className="px-4 py-2 font-semibold">Symbol</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold text-right">Volume</th>
                  <th className="px-4 py-2 font-semibold text-right">Open Price</th>
                  <th className="px-4 py-2 font-semibold text-right">Close Price</th>
                  <th className="px-4 py-2 font-semibold text-right">S / L</th>
                  <th className="px-4 py-2 font-semibold text-right">T / P</th>
                  <th className="px-4 py-2 font-semibold text-right">Swap</th>
                  <th className="px-4 py-2 font-semibold text-right">Profit</th>
                  <th className="px-4 py-2 font-semibold text-right text-lb-accent">Balance</th>
                </>
              )}
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
            {activeTab === 'history' && historyWithBalance.map((item, idx) => {
              if (item.historyType === 'transaction') {
                return (
                  <tr key={idx} className="hover:bg-lb-panel-hover transition-colors">
                    <td className="px-4 py-2 text-lb-text-muted text-[11px]">{new Date(item.entryDate || item.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-lb-text-muted text-[11px]">#{item.id?.slice(-6) || '---'}</td>
                    <td className="px-4 py-2 font-bold font-sans text-lb-text-muted" colSpan={8}>
                      {item.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} • {item.description || 'Wallet transaction'}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-lb-text">{toCurrency(item.amount)}</td>
                    <td className="px-4 py-2 text-right font-bold text-lb-accent">{toCurrency(item.runningBalance)}</td>
                  </tr>
                )
              }

              return (
                <tr key={idx} className="hover:bg-lb-panel-hover transition-colors opacity-90">
                  <td className="px-4 py-2 text-lb-text-muted text-[11px]">{new Date(item.timestamp || item.entryDate || item.createdAt || Date.now()).toLocaleString().replace(',', '')}</td>
                  <td className="px-4 py-2 text-lb-text-muted text-[11px]">#{item.id?.slice(-6) || '---'}</td>
                  <td className="px-4 py-2 font-bold font-sans flex items-center gap-1.5 text-lb-text">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.side === 'BUY' ? 'bg-lb-accent' : 'bg-lb-down'}`} />
                    {item.symbol}
                  </td>
                  <td className={`px-4 py-2 font-bold ${item.side === 'BUY' ? 'text-lb-accent' : 'text-lb-down'}`}>{item.side?.toLowerCase()}</td>
                  <td className="px-4 py-2 text-right">{item.size?.toFixed(2) || item.volume?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.entryPrice || item.openPrice)}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.closePrice)}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.slPrice || item.sl) !== '-' ? formatPrice(item.slPrice || item.sl) : '0.00000'}</td>
                  <td className="px-4 py-2 text-right">{formatPrice(item.tpPrice || item.tp) !== '-' ? formatPrice(item.tpPrice || item.tp) : '0.00000'}</td>
                  <td className="px-4 py-2 text-right">0.00</td>
                  <td className={`px-4 py-2 text-right font-bold ${item.pnl && item.pnl >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                    {toCurrency(item.pnl || 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-lb-accent">{toCurrency(item.runningBalance)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
