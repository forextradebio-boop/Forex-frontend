import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Clock, AlertCircle } from 'lucide-react';

export default function TransactionHistoryScreen() {
  const { data: transactions, isLoading, isError, refetch } = useTransactions();
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAW' | 'TRADE'>('ALL');

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <p className="text-zinc-400 text-sm">Failed to load transaction history.</p>
        <button onClick={() => refetch()} className="mt-4 text-blue-400 font-bold text-xs hover:underline">Retry</button>
      </div>
    );
  }

  const filteredData = transactions?.filter(t => filter === 'ALL' || t.type === filter) || [];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black text-white">Transaction History</h2>
        
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 overflow-x-auto hide-scrollbar">
          {['ALL', 'DEPOSIT', 'WITHDRAW', 'TRADE'].map(tab => (
            <button 
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === tab ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-zinc-900 rounded-xl border border-zinc-800"></div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-zinc-300 font-bold">No Transactions Found</h3>
          <p className="text-zinc-500 text-xs mt-1">There are no records matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredData.map(tx => {
            const isDeposit = tx.type === 'DEPOSIT';
            const isWithdraw = tx.type === 'WITHDRAW';
            const Icon = isDeposit ? ArrowDownLeft : isWithdraw ? ArrowUpRight : ArrowRightLeft;
            const iconColor = isDeposit ? 'text-teal-400' : isWithdraw ? 'text-rose-400' : 'text-blue-400';
            const bgClass = isDeposit ? 'bg-teal-500/10 border-teal-500/20' : isWithdraw ? 'bg-rose-500/10 border-rose-500/20' : 'bg-blue-500/10 border-blue-500/20';
            
            const dateStr = new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${bgClass}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide">{tx.type}</h4>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{dateStr} • {timeStr}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-black font-mono text-base ${isDeposit ? 'text-teal-400' : isWithdraw ? 'text-white' : 'text-zinc-300'}`}>
                    {isDeposit ? '+' : isWithdraw ? '-' : ''}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'APPROVED' ? 'bg-teal-500' : tx.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{tx.status}</span>
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
