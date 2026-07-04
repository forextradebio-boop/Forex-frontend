import React, { useState } from 'react';
import { Terminal, Clock, Settings, Layers } from 'lucide-react';
import { Position } from '../../types';

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
    <div className="h-56 shrink-0 flex flex-col border-t bg-white border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
      
      {/* Terminal Tabs */}
      <div className="flex items-center px-2 h-10 border-b border-slate-200 bg-slate-50 overflow-x-auto no-scrollbar shrink-0">
        <button 
          onClick={() => setActiveTab('open')}
          className={`px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'open' 
              ? 'border-blue-600 text-blue-700 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" /> Trade ({positions.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-blue-600 text-blue-700 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" /> History
        </button>
        <button className="px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 border-transparent text-slate-400 cursor-not-allowed">
          <Layers className="w-4 h-4" /> Exposure
        </button>
        <button className="px-4 h-full font-bold text-xs flex items-center gap-2 border-b-2 border-transparent text-slate-400 cursor-not-allowed">
          <Settings className="w-4 h-4" /> Journal
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-10 font-bold bg-slate-50 text-slate-500 shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 font-semibold">Symbol</th>
              <th className="px-4 py-2 font-semibold">Ticket</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold text-right">Volume</th>
              <th className="px-4 py-2 font-semibold text-right">Open Price</th>
              <th className="px-4 py-2 font-semibold text-right">S / L</th>
              <th className="px-4 py-2 font-semibold text-right">T / P</th>
              <th className="px-4 py-2 font-semibold text-right">Current Price</th>
              <th className="px-4 py-2 font-semibold text-right">Profit</th>
              {activeTab === 'open' && <th className="px-4 py-2 font-semibold text-center w-20">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {activeTab === 'open' && positions.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 font-bold font-sans flex items-center gap-1.5 text-slate-900">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.side === 'BUY' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  {p.symbol}
                </td>
                <td className="px-4 py-2 text-slate-400 text-[11px]">#{p.id.slice(-6)}</td>
                <td className={`px-4 py-2 font-bold ${p.side === 'BUY' ? 'text-blue-600' : 'text-red-600'}`}>{p.side}</td>
                <td className="px-4 py-2 text-right">{p.size.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{p.entryPrice.toFixed(5)}</td>
                <td className="px-4 py-2 text-right">{p.slPrice ? p.slPrice.toFixed(5) : '-'}</td>
                <td className="px-4 py-2 text-right">{p.tpPrice ? p.tpPrice.toFixed(5) : '-'}</td>
                <td className="px-4 py-2 text-right">{p.currentPrice?.toFixed(5) || p.entryPrice.toFixed(5)}</td>
                <td className={`px-4 py-2 text-right font-bold ${p.pnl && p.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {toCurrency(p.pnl || 0)}
                </td>
                <td className="px-4 py-1.5 text-center">
                  <button 
                    onClick={() => onClosePosition(p.id)} 
                    className="w-full py-1 rounded bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors font-sans text-[10px] font-bold"
                  >
                    Close
                  </button>
                </td>
              </tr>
            ))}
            {activeTab === 'history' && closedHistory.map((item, idx) => {
              if (item.type === 'DEPOSIT' || item.type === 'WITHDRAWAL') {
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-bold font-sans text-slate-500" colSpan={8}>
                      {item.type} - {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">{toCurrency(item.amount)}</td>
                  </tr>
                )
              }
              // Closed Trade
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors opacity-80">
                  <td className="px-4 py-2 font-bold font-sans flex items-center gap-1.5 text-slate-700">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.side === 'BUY' ? 'bg-blue-400' : 'bg-red-400'}`} />
                    {item.symbol}
                  </td>
                  <td className="px-4 py-2 text-slate-400 text-[11px]">#{item.id?.slice(-6) || '---'}</td>
                  <td className={`px-4 py-2 font-bold ${item.side === 'BUY' ? 'text-blue-500' : 'text-red-500'}`}>{item.side}</td>
                  <td className="px-4 py-2 text-right">{item.size?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{item.entryPrice?.toFixed(5)}</td>
                  <td className="px-4 py-2 text-right">-</td>
                  <td className="px-4 py-2 text-right">-</td>
                  <td className="px-4 py-2 text-right">{item.closePrice?.toFixed(5)}</td>
                  <td className={`px-4 py-2 text-right font-bold ${item.pnl && item.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
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
