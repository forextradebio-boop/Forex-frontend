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
    <div className="flex flex-col lg:flex-row h-full bg-lb-panel font-sans text-lb-text">
      
      {/* Left Panel - Create Alert */}
      <div className="w-full lg:w-80 bg-lb-panel border-r border-lb-border p-6 flex flex-col relative z-20 shadow-2xl">
        <h2 className="text-xl font-black text-lb-text flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-indigo-500" /> New Price Alert
        </h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-lb-down/10 border border-lb-down/30 rounded-xl flex items-center gap-2 text-lb-down text-xs font-bold">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Trading Pair</label>
            <select 
              value={form.symbol}
              onChange={e => setForm({...form, symbol: e.target.value})}
              className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm font-bold text-lb-text focus:border-indigo-500 outline-none transition-all"
            >
              {SYMBOLS.map(sym => <option key={sym} value={sym}>{sym}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Condition</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setForm({...form, condition: 'ABOVE'})}
                className={`py-3 rounded-xl text-xs font-bold transition-all border ${form.condition === 'ABOVE' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-lb-bg border-lb-border text-lb-text-muted hover:text-lb-text'}`}
              >
                Crosses Above
              </button>
              <button 
                type="button"
                onClick={() => setForm({...form, condition: 'BELOW'})}
                className={`py-3 rounded-xl text-xs font-bold transition-all border ${form.condition === 'BELOW' ? 'bg-lb-down/10 border-lb-down/50 text-lb-down' : 'bg-lb-bg border-lb-border text-lb-text-muted hover:text-lb-text'}`}
              >
                Crosses Below
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Target Price</label>
            <input 
              type="number"
              step="0.00001"
              required
              value={form.targetPrice}
              onChange={e => setForm({...form, targetPrice: e.target.value})}
              placeholder="0.00000"
              className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm font-mono text-lb-text focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={createAlertMutation.isPending}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-lb-text font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            >
              <Plus className="w-5 h-5" />
              {createAlertMutation.isPending ? 'Creating...' : 'Set Alert'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-lb-border/50">
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-3">
            <Bell className="w-5 h-5 text-indigo-400 mt-0.5" />
            <div>
              <p className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Push Notifications</p>
              <p className="text-lb-text-muted text-xs mt-1 leading-relaxed">Alerts will trigger instantly when the market crosses your specified target price.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Active Alerts */}
      <div className="flex-1 flex flex-col bg-lb-panel">
        
        {/* Top Control Bar */}
        <div className="p-4 lg:px-6 lg:py-5 border-b border-lb-border bg-lb-panel/50 sticky top-0 z-10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lb-text-muted" />
              <input 
                type="text" 
                placeholder="Search symbol..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-lb-bg border border-lb-border rounded-xl pl-9 pr-4 py-2 text-sm text-lb-text focus:outline-none focus:border-indigo-500 w-full sm:w-48 transition-all"
              />
            </div>
            <button 
              onClick={() => setFilterActive(!filterActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterActive ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-lb-bg border-lb-border text-lb-text-muted hover:text-lb-text'}`}
            >
              Active Only
            </button>
          </div>

          <button 
            onClick={() => refetch()} 
            className={`p-2 bg-lb-bg border border-lb-border rounded-xl hover:bg-lb-panel-hover transition-colors text-lb-text-muted hover:text-lb-text ${isFetching ? 'animate-spin text-indigo-500' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {isLoading ? (
             <div className="space-y-4 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-20 bg-lb-bg rounded-2xl border border-lb-border"></div>)}
             </div>
          ) : isError ? (
            <div className="text-center p-8 text-lb-down font-bold flex flex-col items-center justify-center h-full min-h-[300px]">
              <AlertCircle className="w-10 h-10 mb-3" /> Failed to load alerts.
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-lb-text-muted min-h-[300px]">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lb-text font-bold text-lg">No Alerts Found</h3>
              <p className="text-sm mt-1 max-w-xs text-center">You have no price alerts matching these filters. Create one to get notified of market moves.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAlerts.map(alert => {
                const isAbove = alert.condition === 'ABOVE';
                const condColor = isAbove ? 'text-emerald-400' : 'text-lb-down';
                
                const statusColor = alert.status === 'ACTIVE' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10' :
                                    alert.status === 'TRIGGERED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                    'text-lb-text-muted border-lb-accent/50 bg-lb-bg';
                
                const StatusIcon = alert.status === 'ACTIVE' ? Clock :
                                   alert.status === 'TRIGGERED' ? CheckCircle2 : XCircle;

                return (
                  <div key={alert._id} className="bg-lb-panel border border-lb-border hover:border-lb-accent/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-lg">
                    
                    {/* Symbol & Condition */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-lb-border bg-lb-bg flex items-center justify-center relative">
                        {isAbove ? <ArrowUpRight className="w-6 h-6 text-emerald-400" /> : <ArrowDownRight className="w-6 h-6 text-lb-down" />}
                      </div>
                      <div>
                        <h4 className="text-lb-text font-black text-lg tracking-tight">{alert.symbol}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${condColor}`}>{alert.condition}</span>
                          <span className="text-zinc-700 text-xs">•</span>
                          <span className="text-lb-text-muted text-xs font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-lb-border/50 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-lb-text-muted font-bold uppercase tracking-widest mb-0.5">Target Price</div>
                        <div className="text-lb-text font-mono font-bold text-base">{alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 5 })}</div>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${statusColor} min-w-[90px] justify-center`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{alert.status}</span>
                      </div>

                      <button 
                        onClick={() => handleDelete(alert._id)}
                        disabled={deleteAlertMutation.isPending}
                        className="p-2 text-lb-text-muted hover:text-lb-down hover:bg-lb-down/10 rounded-lg transition-colors border border-transparent hover:border-lb-down/30"
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
