import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Star } from 'lucide-react';
import { useMarketStream } from '../../hooks/useMarketStream';
import { MarketTicker } from '../../types';

interface MarketWatchProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onLongPressSymbol?: (symbolObj: SymbolData) => void;
}

const PriceFlashCell = React.memo(({ price, isAsk }: { price: number; isAsk?: boolean }) => {
  const prevPrice = useRef(price);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (price > prevPrice.current) {
      setFlashClass('flash-up');
    } else if (price < prevPrice.current) {
      setFlashClass('flash-down');
    }
    prevPrice.current = price;

    const timer = setTimeout(() => setFlashClass(''), 500);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <span className={`px-1 rounded font-mono font-bold tracking-tight ${flashClass}`}>
      {price.toFixed(5)}
    </span>
  );
});

export const MarketWatch = React.memo(({ selectedSymbol, onSelectSymbol, onLongPressSymbol }: MarketWatchProps) => {
  const { symbols } = useMarketStream();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Favorites');
  const [favorites, setFavorites] = useState<string[]>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadFavs = () => {
      const savedFavs = localStorage.getItem('forex_favorites');
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
        } catch (e) {}
      }
    };
    loadFavs();
    window.addEventListener('favoritesUpdated', loadFavs);
    return () => window.removeEventListener('favoritesUpdated', loadFavs);
  }, []);

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(symbol);
      const newFavs = isFav ? prev.filter(s => s !== symbol) : [...prev, symbol];
      localStorage.setItem('forex_favorites', JSON.stringify(newFavs));
      window.dispatchEvent(new Event('favoritesUpdated'));
      return newFavs;
    });
  };

  const categories = ['Favorites', 'Forex', 'Metals', 'Crypto', 'Indices', 'Commodities'];

  const filteredSymbols = useMemo(() => {
    let filtered = symbols;
    
    // Apply Category Filter
    if (activeCategory === 'Favorites') {
      filtered = filtered.filter(s => favorites.includes(s.symbol.replace('/', '')));
    } else {
      filtered = filtered.filter(s => (s.category || '').toUpperCase() === activeCategory.toUpperCase());
    }

    // Apply Search Filter
    if (search) {
      filtered = filtered.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()));
    }
    
    return filtered;
  }, [symbols, search, activeCategory, favorites]);

  return (
    <aside className="w-full md:w-80 flex-1 md:flex-none md:h-full min-h-0 flex flex-col border-r bg-lb-panel border-lb-border">
      <div className="p-2 border-b border-lb-border flex flex-col gap-2">
        <div className="flex overflow-x-auto no-scrollbar gap-1 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-lb-accent text-black shadow-sm' 
                  : 'bg-lb-bg text-lb-text-muted hover:text-lb-text border border-lb-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-lb-text-muted" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-lb-bg border border-lb-border rounded-lg outline-none focus:border-lb-accent transition-all text-lb-text placeholder:text-lb-text-muted"
          />
        </div>
      </div>
      
      {/* Table Body - Advanced View MT5 Style */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredSymbols.length === 0 ? (
          <div className="p-4 text-center text-xs text-lb-text-muted">
            {activeCategory === 'Favorites' ? 'No favorites added yet.' : 'No symbols found.'}
          </div>
        ) : (
          filteredSymbols.map(sym => {
            const rawSymbol = sym.symbol.replace('/', '');
            const isSelected = selectedSymbol === rawSymbol;
            let spread = '-';
            if (sym.spread != null) {
                spread = sym.spread.toFixed(1);
            } else if (sym.ask != null && sym.bid != null) {
                spread = (sym.ask - sym.bid).toFixed(5);
            }
            const isPositive = (sym.changePercent || 0) >= 0;
            const isFav = favorites.includes(rawSymbol);
            
            return (
              <div 
                key={sym.symbol} 
                onMouseDown={() => {
                  if (onLongPressSymbol) {
                    longPressTimer.current = setTimeout(() => {
                      longPressTimer.current = null;
                      onLongPressSymbol(sym);
                    }, 400);
                  }
                }}
                onMouseUp={() => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                    onSelectSymbol(rawSymbol);
                  }
                }}
                onMouseLeave={() => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                }}
                onTouchStart={() => {
                  if (onLongPressSymbol) {
                    longPressTimer.current = setTimeout(() => {
                      longPressTimer.current = null;
                      onLongPressSymbol(sym);
                    }, 400);
                  }
                }}
                onTouchEnd={(e) => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                    onSelectSymbol(rawSymbol);
                    e.preventDefault(); // Prevent ghost click
                  }
                }}
                onTouchMove={() => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                }}
                className={`group flex flex-col cursor-pointer border-b transition-colors duration-150 ${
                  isSelected 
                    ? 'bg-lb-accent/10 border-l-2 border-l-lb-accent border-b-lb-border' 
                    : 'border-lb-border hover:bg-lb-panel-hover border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex flex-col p-2 pl-1 gap-1">
                  
                  {/* Top Row: Symbol, Time/Spread, Status */}
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => toggleFavorite(e, rawSymbol)} className="p-1">
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-lb-accent text-lb-accent' : 'text-lb-text-muted'}`} />
                      </button>
                      <span className={`text-[14px] font-extrabold ${isSelected ? 'text-lb-accent' : 'text-lb-text'}`}>
                        {rawSymbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-lb-text-muted">
                      <span>{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                      <span className="font-bold">Spread: <span className="text-lb-text">{spread}</span></span>
                    </div>
                  </div>

                  {/* Middle Row: Bid / Ask / Change */}
                  <div className="flex justify-between items-baseline px-1">
                    <span className={`text-[11px] font-bold ${isPositive ? 'text-lb-accent' : 'text-lb-down'}`}>
                      {isPositive ? '+' : ''}{(sym.changePercent || 0).toFixed(2)}%
                    </span>
                    <div className="flex gap-4 items-baseline">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-lb-text-muted">Bid</span>
                        <span className={`text-[15px] ${isPositive ? 'text-lb-accent' : 'text-lb-down'}`}>
                          <PriceFlashCell price={sym.bid || sym.price || 0} />
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-lb-text-muted">Ask</span>
                        <span className={`text-[15px] ${isPositive ? 'text-lb-accent' : 'text-lb-down'}`}>
                          <PriceFlashCell price={sym.ask || sym.price || 0} isAsk={true} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Low / High */}
                  <div className="flex justify-between items-center px-1 text-[10px] text-lb-text-muted">
                    <span>L: {sym.low?.toFixed(5) || '0.00000'}</span>
                    <span>H: {sym.high?.toFixed(5) || '0.00000'}</span>
                  </div>
                  
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
});
