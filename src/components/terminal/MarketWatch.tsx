import React, { useMemo, useState } from 'react';
import { Search, TrendingUp, Star } from 'lucide-react';
import { useMarketStream } from '../../hooks/useMarketStream';

interface MarketWatchProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const MarketWatch = React.memo(({ selectedSymbol, onSelectSymbol }: MarketWatchProps) => {
  const { symbols } = useMarketStream();
  const [search, setSearch] = useState('');

  const filteredSymbols = useMemo(() => {
    if (!search) return symbols;
    return symbols.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()));
  }, [symbols, search]);

  return (
    <aside className="w-full md:w-80 flex-1 md:flex-none md:h-full min-h-0 flex flex-col border-r bg-lb-panel border-lb-border">
      <div className="p-2 border-b border-lb-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-lb-text-muted" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-2 text-xs bg-lb-bg border border-lb-border rounded-xl outline-none focus:border-lb-accent focus:shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all text-lb-text placeholder:text-lb-text-muted"
          />
        </div>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-[30px_1fr_70px_70px] gap-2 px-2 py-1.5 border-b border-lb-border bg-lb-bg text-[11px] font-bold text-lb-text-muted uppercase tracking-wider">
        <div className="flex justify-center"><Star className="w-3 h-3" /></div>
        <div>Symbol</div>
        <div className="text-right">Bid</div>
        <div className="text-right">Ask</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredSymbols.map(sym => {
          const rawSymbol = sym.symbol.replace('/', '');
          const isSelected = selectedSymbol === rawSymbol;
          const spread = sym.spread ? sym.spread.toFixed(1) : ((sym.ask || 0) - (sym.bid || 0)).toFixed(5);
          const isPositive = (sym.changePercent || 0) >= 0;
          
          return (
            <div 
              key={sym.symbol} 
              onClick={() => onSelectSymbol(rawSymbol)}
              className={`group flex flex-col cursor-pointer border-b transition-all duration-300 ${
                isSelected 
                  ? 'bg-lb-accent/10 border-l-2 border-l-lb-accent border-y border-lb-accent/30 shadow-[0_0_15px_rgba(20,184,166,0.05)] scale-[1.02] rounded-r-lg my-1' 
                  : 'border-lb-border hover:bg-lb-panel-hover border-l-2 border-l-transparent'
              }`}
            >
              <div className="grid grid-cols-[30px_1fr_70px_70px] gap-2 px-2 py-2.5 items-center">
                <div className="flex justify-center text-lb-text-muted hover:text-lb-accent transition-colors">
                  <Star className="w-4 h-4" />
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-[14px] font-extrabold ${isSelected ? 'text-lb-accent' : 'text-lb-text'}`}>
                    {rawSymbol}
                  </span>
                  <span className={`text-[11px] font-bold mt-0.5 ${isPositive ? 'text-lb-accent' : 'text-lb-down'}`}>
                    {isPositive ? '+' : ''}{(sym.changePercent || 0).toFixed(2)}%
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`text-[14px] font-mono font-bold tracking-tight ${isPositive ? 'text-lb-accent' : 'text-lb-down'}`}>
                    {sym.bid?.toFixed(5) || sym.price?.toFixed(5)}
                  </span>
                  <span className="text-[10px] text-lb-text-muted font-mono mt-0.5">
                    L: {sym.low?.toFixed(5) || '0.00000'}
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`text-[14px] font-mono font-bold tracking-tight ${isPositive ? 'text-lb-accent' : 'text-lb-down'}`}>
                    {sym.ask?.toFixed(5) || sym.price?.toFixed(5)}
                  </span>
                  <span className="text-[10px] text-lb-text-muted font-mono mt-0.5">
                    H: {sym.high?.toFixed(5) || '0.00000'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
});
