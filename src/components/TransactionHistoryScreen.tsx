import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Clock, AlertCircle } from 'lucide-react';

export default function TransactionHistoryScreen() {
  const { data: transactions, isLoading, isError, refetch } = useTransactions();
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAW' | 'TRADE'>('ALL');

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-lb-panel border border-lb-border rounded-2xl">
        <AlertCircle className="w-10 h-10 text-lb-down mb-2" />
        <p className="text-lb-text-muted text-sm">Failed to load transaction history.</p>
        <button onClick={() => refetch()} className="mt-4 text-lb-accent font-bold text-xs hover:underline">Retry</button>
      </div>
    );
  }

  const filteredData = transactions?.filter(t => filter === 'ALL' || t.type === filter) || [];

  return (
    <div className="bg-lb-panel border border-lb-border rounded-3xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black text-lb-text">Transaction History</h2>
        
        <div className="flex bg-lb-bg/80 border border-lb-border/50 rounded-xl p-1.5 overflow-x-auto shadow-inner hide-scrollbar gap-1">
          {['ALL', 'DEPOSIT', 'WITHDRAW', 'TRADE'].map(tab => (
            <button 
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all duration-300 active:scale-95 ${filter === tab ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]' : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover hover:-translate-y-0.5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-lb-bg rounded-xl border border-lb-border"></div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-lb-bg flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lb-text font-bold">No Transactions Found</h3>
          <p className="text-lb-text-muted text-xs mt-1">There are no records matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredData.map(tx => {
            const isDeposit = tx.type === 'DEPOSIT';
            const isWithdraw = tx.type === 'WITHDRAW';
            const Icon = isDeposit ? ArrowDownLeft : isWithdraw ? ArrowUpRight : ArrowRightLeft;
            const iconColor = isDeposit ? 'text-lb-accent' : isWithdraw ? 'text-lb-down' : 'text-lb-accent';
            const bgClass = isDeposit ? 'bg-lb-accent/10 border-lb-accent/20' : isWithdraw ? 'bg-lb-down/10 border-lb-down/20' : 'bg-lb-accent/10 border-lb-accent/20';
            
            const dateStr = new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-lb-bg/50 hover:bg-lb-bg border border-lb-border/80 rounded-xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${bgClass}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <h4 className="text-lb-text font-bold text-sm tracking-wide">{tx.type}</h4>
                    <div className="text-[10px] text-lb-text-muted font-mono mt-0.5">{dateStr} • {timeStr}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-black font-mono text-base ${isDeposit ? 'text-lb-accent' : isWithdraw ? 'text-lb-text' : 'text-lb-text'}`}>
                    {isDeposit ? '+' : isWithdraw ? '-' : ''}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'APPROVED' ? 'bg-lb-accent' : tx.status === 'REJECTED' ? 'bg-lb-down' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className="text-[10px] font-bold text-lb-text-muted uppercase tracking-wider">{tx.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
