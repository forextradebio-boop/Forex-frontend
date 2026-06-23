import React, { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { RefreshCw, Search, Filter, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

export default function OrdersScreen() {
  const { data: orders, isLoading, isError, refetch, isFetching } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const matchesSearch = order.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-950 border border-zinc-800 rounded-2xl h-full min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-rose-400 font-bold text-lg">Failed to load orders</h3>
        <p className="text-zinc-500 text-sm mt-1">Unable to connect to the trading engine.</p>
        <button onClick={() => refetch()} className="mt-6 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl transition-colors text-sm font-bold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] flex flex-col h-full font-sans text-zinc-300">
      
      {/* Header Controls */}
      <div className="p-4 lg:p-6 border-b border-zinc-800 bg-zinc-950/50 sticky top-0 z-10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Trading Orders
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Manage your active and historical positions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search symbol..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-full sm:w-48 transition-all"
            />
          </div>
          <button 
            onClick={() => refetch()} 
            className={`p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white ${isFetching ? 'animate-spin text-blue-500' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 lg:px-6 flex overflow-x-auto hide-scrollbar gap-2">
        {['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'].map(tab => (
          <button 
            key={tab}
            onClick={() => setStatusFilter(tab as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === tab 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-white font-bold text-lg">No Orders Found</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm">No orders match your current filter criteria. Adjust your search or place a new trade.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOrders.map(order => {
              const isBuy = order.type.includes('BUY');
              const isSell = order.type.includes('SELL');
              const OrderIcon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : FileText;
              const typeColor = isBuy ? 'text-teal-400' : isSell ? 'text-rose-400' : 'text-zinc-400';
              
              const statusColor = order.status === 'PENDING' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                                  order.status === 'EXECUTED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                  'text-rose-400 border-rose-400/20 bg-rose-400/10';
              
              const StatusIcon = order.status === 'PENDING' ? Clock :
                                 order.status === 'EXECUTED' ? CheckCircle2 : XCircle;

              return (
                <div key={order._id} className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-xl">
                  
                  {/* Left: Symbol & Type */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <OrderIcon className={`w-6 h-6 ${typeColor}`} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg tracking-tight">{order.symbol}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>{order.type.replace('_', ' ')}</span>
                        <span className="text-zinc-700 text-xs">•</span>
                        <span className="text-zinc-500 text-xs font-mono">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-zinc-800/50 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Target Price</div>
                      <div className="text-white font-mono font-bold">{order.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 5 })}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Volume</div>
                      <div className="text-white font-mono font-bold">{order.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${statusColor}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{order.status}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
