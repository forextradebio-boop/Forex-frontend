import React, { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { RefreshCw, Search, Filter, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

export default function OrdersScreen() {
  const { data: orders, isLoading, isError, refetch, isFetching } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders?.filter(order => {
      const matchesSearch = order.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-lb-panel border border-lb-border rounded-2xl h-full min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-lb-down mb-4" />
        <h3 className="text-lb-down font-bold text-lg">Failed to load orders</h3>
        <p className="text-lb-text-muted text-sm mt-1">Unable to connect to the trading engine.</p>
        <button onClick={() => refetch()} className="mt-6 px-6 py-2 bg-lb-bg hover:bg-lb-panel-hover border border-lb-accent/50 text-lb-text rounded-xl transition-colors text-sm font-bold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-lb-panel flex flex-col h-full font-sans text-lb-text">
      
      {/* Header Controls */}
      <div className="p-4 lg:p-6 border-b border-lb-border bg-lb-panel/50 sticky top-0 z-10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-lb-text flex items-center gap-2">
            <FileText className="w-5 h-5 text-lb-accent" /> Trading Orders
          </h2>
          <p className="text-xs text-lb-text-muted mt-1">Manage your active and historical positions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lb-text-muted" />
            <input 
              type="text" 
              placeholder="Search symbol..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-lb-bg border border-lb-border rounded-xl pl-9 pr-4 py-2 text-sm text-lb-text focus:outline-none focus:border-lb-accent w-full sm:w-48 transition-all"
            />
          </div>
          <button 
            onClick={() => refetch()} 
            className={`p-2 bg-lb-bg border border-lb-border rounded-xl hover:bg-lb-panel-hover transition-colors text-lb-text-muted hover:text-lb-text ${isFetching ? 'animate-spin text-lb-accent' : ''}`}
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
                ? 'bg-lb-accent/10 border-lb-accent/30 text-lb-accent' 
                : 'bg-lb-bg/50 border-lb-border/50 text-lb-text-muted hover:text-lb-text'
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
              <div key={i} className="h-20 bg-lb-bg rounded-2xl border border-lb-border"></div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 bg-lb-bg rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-lb-text font-bold text-lg">No Orders Found</h3>
            <p className="text-lb-text-muted text-sm mt-1 max-w-sm">No orders match your current filter criteria. Adjust your search or place a new trade.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOrders.map(order => {
              const isBuy = order.type.includes('BUY');
              const isSell = order.type.includes('SELL');
              const OrderIcon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : FileText;
              const typeColor = isBuy ? 'text-lb-accent' : isSell ? 'text-lb-down' : 'text-lb-text-muted';
              
              const statusColor = order.status === 'PENDING' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                                  order.status === 'EXECUTED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                  'text-lb-down border-rose-400/20 bg-rose-400/10';
              
              const StatusIcon = order.status === 'PENDING' ? Clock :
                                 order.status === 'EXECUTED' ? CheckCircle2 : XCircle;

              return (
                <div key={order._id} className="bg-lb-panel border border-lb-border hover:border-lb-accent/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-xl">
                  
                  {/* Left: Symbol & Type */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border border-lb-border bg-lb-bg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <OrderIcon className={`w-6 h-6 ${typeColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lb-text font-black text-lg tracking-tight">{order.symbol}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>{order.type.replace('_', ' ')}</span>
                        <span className="text-zinc-700 text-xs">•</span>
                        <span className="text-lb-text-muted text-xs font-mono">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-lb-border/50 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-lb-text-muted font-bold uppercase tracking-widest mb-0.5">Target Price</div>
                      <div className="text-lb-text font-mono font-bold">{order.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 5 })}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-lb-text-muted font-bold uppercase tracking-widest mb-0.5">Volume</div>
                      <div className="text-lb-text font-mono font-bold">{order.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
