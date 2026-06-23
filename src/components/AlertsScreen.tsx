import React, { useState, useMemo } from 'react';
import { useAlerts, useCreateAlert, useDeleteAlert } from '../hooks/useAlerts';
import { Bell, Search, AlertCircle, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD'];

export default function AlertsScreen() {
  const { data: alerts = [], isLoading, isError, refetch, isFetching } = useAlerts();
  const createAlertMutation = useCreateAlert();
  const deleteAlertMutation = useDeleteAlert();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  
  const [form, setForm] = useState({
    symbol: 'EURUSD',
    condition: 'ABOVE',
    targetPrice: ''
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const targetPrice = parseFloat(form.targetPrice);
    
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setErrorMsg("Please enter a valid target price.");
      return;
    }

    createAlertMutation.mutate({
      symbol: form.symbol,
      condition: form.condition,
      targetPrice,
      status: 'ACTIVE'
    }, {
      onSuccess: () => setForm(f => ({ ...f, targetPrice: '' })),
      onError: (err: any) => setErrorMsg(err.response?.data?.error || "Failed to create alert.")
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this price alert?")) {
      deleteAlertMutation.mutate(id);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = alert.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActive = filterActive ? alert.status === 'ACTIVE' : true;
      return matchesSearch && matchesActive;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, searchTerm, filterActive]);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#09090b] font-sans text-zinc-300">
      
      {/* Left Panel - Create Alert */}
      <div className="w-full lg:w-80 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col relative z-20 shadow-2xl">
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-indigo-500" /> New Price Alert
        </h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Trading Pair</label>
            <select 
              value={form.symbol}
              onChange={e => setForm({...form, symbol: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
            >
              {SYMBOLS.map(sym => <option key={sym} value={sym}>{sym}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Condition</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setForm({...form, condition: 'ABOVE'})}
                className={`py-3 rounded-xl text-xs font-bold transition-all border ${form.condition === 'ABOVE' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
              >
                Crosses Above
              </button>
              <button 
                type="button"
                onClick={() => setForm({...form, condition: 'BELOW'})}
                className={`py-3 rounded-xl text-xs font-bold transition-all border ${form.condition === 'BELOW' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
              >
                Crosses Below
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Price</label>
            <input 
              type="number"
              step="0.00001"
              required
              value={form.targetPrice}
              onChange={e => setForm({...form, targetPrice: e.target.value})}
              placeholder="0.00000"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={createAlertMutation.isPending}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            >
              <Plus className="w-5 h-5" />
              {createAlertMutation.isPending ? 'Creating...' : 'Set Alert'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/50">
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-3">
            <Bell className="w-5 h-5 text-indigo-400 mt-0.5" />
            <div>
              <p className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Push Notifications</p>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Alerts will trigger instantly when the market crosses your specified target price.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Active Alerts */}
      <div className="flex-1 flex flex-col bg-[#09090b]">
        
        {/* Top Control Bar */}
        <div className="p-4 lg:px-6 lg:py-5 border-b border-zinc-800 bg-zinc-950/50 sticky top-0 z-10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search symbol..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-full sm:w-48 transition-all"
              />
            </div>
            <button 
              onClick={() => setFilterActive(!filterActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterActive ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
            >
              Active Only
            </button>
          </div>

          <button 
            onClick={() => refetch()} 
            className={`p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white ${isFetching ? 'animate-spin text-indigo-500' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {isLoading ? (
             <div className="space-y-4 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-2xl border border-zinc-800"></div>)}
             </div>
          ) : isError ? (
            <div className="text-center p-8 text-rose-500 font-bold flex flex-col items-center justify-center h-full min-h-[300px]">
              <AlertCircle className="w-10 h-10 mb-3" /> Failed to load alerts.
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 min-h-[300px]">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-white font-bold text-lg">No Alerts Found</h3>
              <p className="text-sm mt-1 max-w-xs text-center">You have no price alerts matching these filters. Create one to get notified of market moves.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAlerts.map(alert => {
                const isAbove = alert.condition === 'ABOVE';
                const condColor = isAbove ? 'text-emerald-400' : 'text-rose-400';
                
                const statusColor = alert.status === 'ACTIVE' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10' :
                                    alert.status === 'TRIGGERED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                    'text-zinc-500 border-zinc-700 bg-zinc-900';
                
                const StatusIcon = alert.status === 'ACTIVE' ? Clock :
                                   alert.status === 'TRIGGERED' ? CheckCircle2 : XCircle;

                return (
                  <div key={alert._id} className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-lg">
                    
                    {/* Symbol & Condition */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center relative">
                        {isAbove ? <ArrowUpRight className="w-6 h-6 text-emerald-400" /> : <ArrowDownRight className="w-6 h-6 text-rose-400" />}
                      </div>
                      <div>
                        <h4 className="text-white font-black text-lg tracking-tight">{alert.symbol}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${condColor}`}>{alert.condition}</span>
                          <span className="text-zinc-700 text-xs">•</span>
                          <span className="text-zinc-500 text-xs font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-zinc-800/50 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Target Price</div>
                        <div className="text-white font-mono font-bold text-base">{alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 5 })}</div>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${statusColor} min-w-[90px] justify-center`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{alert.status}</span>
                      </div>

                      <button 
                        onClick={() => handleDelete(alert._id)}
                        disabled={deleteAlertMutation.isPending}
                        className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
