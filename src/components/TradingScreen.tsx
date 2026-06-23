import React, { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, FileText, AlertCircle, Crosshair } from 'lucide-react';
import { Order } from '../types';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD'];
const ORDER_TYPES = ['BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP'];

export default function TradingScreen() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, isError, refetch } = useOrders();

  const [form, setForm] = useState({
    symbol: 'EURUSD',
    type: 'BUY',
    volume: '0.01',
    targetPrice: ''
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'PENDING' | 'HISTORY'>('OPEN');

  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/orders', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSuccessMsg("Order placed successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setForm(f => ({ ...f, targetPrice: '' })); // Reset target price
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || "Failed to place order");
      setTimeout(() => setErrorMsg(null), 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const volume = parseFloat(form.volume);
    const targetPrice = parseFloat(form.targetPrice);

    if (isNaN(volume) || volume <= 0) {
      setErrorMsg("Volume must be greater than 0");
      return;
    }
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setErrorMsg("Target Price must be greater than 0");
      return;
    }

    createOrderMutation.mutate({
      symbol: form.symbol,
      type: form.type,
      volume,
      price: targetPrice,
      status: 'PENDING' // Assuming new orders start as pending for demo
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab === 'OPEN') return order.status === 'EXECUTED';
      if (activeTab === 'PENDING') return order.status === 'PENDING';
      if (activeTab === 'HISTORY') return order.status === 'CANCELLED' || order.status === 'EXECUTED';
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab]);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#09090b] font-sans text-zinc-300">
      
      {/* Left Panel - Order Entry */}
      <div className="w-full lg:w-80 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col relative z-20 shadow-2xl">
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
          <Crosshair className="w-5 h-5 text-teal-500" /> New Order
        </h2>

        {successMsg && (
          <div className="mb-4 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center gap-2 text-teal-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Trading Pair</label>
            <select 
              value={form.symbol}
              onChange={e => setForm({...form, symbol: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-teal-500 outline-none transition-all"
            >
              {SYMBOLS.map(sym => <option key={sym} value={sym}>{sym}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Order Type</label>
            <select 
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-teal-500 outline-none transition-all"
            >
              {ORDER_TYPES.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Volume (Lots)</label>
            <input 
              type="number"
              step="0.01"
              value={form.volume}
              onChange={e => setForm({...form, volume: e.target.value})}
              placeholder="1.00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Price</label>
            <input 
              type="number"
              step="0.00001"
              value={form.targetPrice}
              onChange={e => setForm({...form, targetPrice: e.target.value})}
              placeholder="0.00000"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={createOrderMutation.isPending}
              className={`w-full py-4 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                form.type.includes('BUY') ? 'bg-teal-500 hover:bg-teal-400 text-black shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              }`}
            >
              {createOrderMutation.isPending ? 'Processing...' : `Place ${form.type.replace('_', ' ')}`}
            </button>
          </div>

        </form>
      </div>

      {/* Right Panel - Orders Book */}
      <div className="flex-1 flex flex-col bg-[#09090b]">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10 px-4">
          {(['OPEN', 'PENDING', 'HISTORY'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeTab === tab ? 'border-teal-500 text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab} Orders
            </button>
          ))}
          <div className="ml-auto flex items-center pr-2">
            <button onClick={() => refetch()} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {isLoading ? (
             <div className="space-y-4 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl border border-zinc-800"></div>)}
             </div>
          ) : isError ? (
            <div className="text-center p-8 text-rose-500 font-bold flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2" /> Failed to load order book.
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 min-h-[300px]">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No {activeTab.toLowerCase()} orders found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const isBuy = order.type.includes('BUY');
                const isSell = order.type.includes('SELL');
                const typeColor = isBuy ? 'text-teal-400' : isSell ? 'text-rose-400' : 'text-zinc-400';
                
                const statusColor = order.status === 'PENDING' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                                    order.status === 'EXECUTED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                    'text-rose-400 border-rose-400/20 bg-rose-400/10';
                
                return (
                  <div key={order._id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-800 bg-zinc-900 ${typeColor}`}>
                        {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-white font-black">{order.symbol}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>{order.type.replace('_', ' ')}</span>
                          <span className="text-zinc-700 text-xs">•</span>
                          <span className="text-zinc-500 text-xs font-mono">{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Target</div>
                        <div className="text-white font-mono font-bold">{order.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 5 })}</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Vol</div>
                        <div className="text-white font-mono font-bold">{order.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded border flex items-center justify-center min-w-[80px] ${statusColor}`}>
                        <span className="text-[9px] font-bold uppercase tracking-widest">{order.status}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
