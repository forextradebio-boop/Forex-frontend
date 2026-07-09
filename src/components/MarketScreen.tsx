import React, { useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle,
  Activity,
  Globe,
  Bitcoin,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useMarketStream } from '../hooks/useMarketStream';
import { MarketTicker } from '../types';

type MarketTab = 'OVERVIEW' | 'FOREX' | 'CRYPTO' | 'METALS';

export default function MarketScreen() {
  const [activeTab, setActiveTab] = useState<MarketTab>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data Hooks
  const { symbols: tickers } = useMarketStream();
  
  const topGainers = React.useMemo(() => {
    return [...tickers].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5);
  }, [tickers]);

  const topLosers = React.useMemo(() => {
    return [...tickers].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5);
  }, [tickers]);

  const handleRefresh = () => {
    // No-op for socket stream
  };

  const getFilteredData = (): MarketTicker[] => {
    if (!tickers) return [];
    let data = tickers;
    if (activeTab === 'FOREX') data = data.filter(t => t.category === 'FOREX');
    if (activeTab === 'CRYPTO') data = data.filter(t => t.category === 'CRYPTO');
    if (activeTab === 'METALS') data = data.filter(t => t.category === 'METALS');

    if (searchQuery) {
      data = data.filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return data;
  };

  const filteredTickers = getFilteredData();

  const isGlobalLoading = tickers.length === 0;
  const isGlobalError = false;

  return (
    <div className="flex flex-col h-full bg-black font-sans text-lb-text">
      
      {/* Header & Tabs */}
      <div className="border-b border-lb-border bg-lb-panel p-4 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-lb-text tracking-wide">Markets</h2>
        </div>

        <div className="flex bg-lb-bg rounded p-1">
          {(['OVERVIEW', 'FOREX', 'CRYPTO', 'METALS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${
                activeTab === tab 
                  ? 'bg-emerald-500 text-black shadow-sm' 
                  : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover'
              }`}
            >
              {tab === 'OVERVIEW' && <Globe className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'FOREX' && <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'CRYPTO' && <Bitcoin className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'METALS' && <Layers className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-lb-text-muted" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-lb-bg border border-lb-border rounded-full pl-9 pr-4 py-1.5 text-xs text-lb-text focus:outline-none focus:border-emerald-500 transition-colors w-48"
            />
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-2 rounded bg-lb-bg border border-lb-border text-lb-text-muted hover:text-lb-text transition-colors`}
            title="Pull to Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        
        {/* Error State */}
        {isGlobalError && (
          <div className="bg-lb-down/10 border border-lb-down/20 rounded p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-lb-down" />
            <div>
              <h3 className="text-lb-down font-bold text-lg">Connection Lost</h3>
              <p className="text-lb-text-muted text-sm mt-1">Failed to fetch live market data from the server.</p>
            </div>
            <button 
              onClick={handleRefresh}
              className="bg-lb-down hover:bg-lb-down/80 text-lb-text px-6 py-2 rounded font-bold text-sm transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isGlobalLoading && !isGlobalError && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-lb-bg/50 rounded-lg border border-lb-border"></div>
            <div className="h-64 bg-lb-bg/50 rounded-lg border border-lb-border"></div>
          </div>
        )}

        {/* Success State */}
        {!isGlobalLoading && !isGlobalError && (
          <>
            {/* Overview Widgets */}
            {activeTab === 'OVERVIEW' && !searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                
                {/* Top Gainers */}
                <div className="bg-lb-panel border border-lb-border rounded-lg p-4">
                  <h3 className="text-sm font-bold text-lb-text flex items-center mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                    Top Gainers
                  </h3>
                  {tickers.length === 0 ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-lb-bg rounded animate-pulse"></div>)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topGainers.map(ticker => (
                        <TickerMiniCard key={`gainer-${ticker.symbol}`} ticker={ticker as any} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Losers */}
                <div className="bg-lb-panel border border-lb-border rounded-lg p-4">
                  <h3 className="text-sm font-bold text-lb-text flex items-center mb-4">
                    <TrendingDown className="w-4 h-4 text-lb-down mr-2" />
                    Top Losers
                  </h3>
                  {tickers.length === 0 ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-lb-bg rounded animate-pulse"></div>)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topLosers.map(ticker => (
                        <TickerMiniCard key={`loser-${ticker.symbol}`} ticker={ticker as any} />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Main Ticker Table */}
            <div className="bg-lb-panel border border-lb-border rounded-lg overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                  <thead className="bg-lb-bg/80 text-lb-text-muted border-b border-lb-border">
                    <tr>
                      <th className="p-4 font-semibold tracking-wider">Instrument</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Price</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Change</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Bid</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Ask</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Spread</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Status</th>
                      <th className="p-4 font-semibold tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredTickers.length > 0 ? (
                      filteredTickers.map(ticker => (
                        <TickerTableRow key={ticker.symbol} ticker={ticker as any} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-lb-text-muted">
                          No markets found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

const DollarSign = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

function TickerMiniCard({ ticker }: { ticker: MarketTicker }) {
  const isUp = ticker.changePercent >= 0;
  return (
    <div className="flex items-center justify-between p-3 bg-lb-bg/50 hover:bg-lb-panel-hover/80 rounded border border-lb-border/50 transition cursor-pointer">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-lb-down/20 text-lb-down'}`}>
          {ticker.symbol.substring(0, 3)}
        </div>
        <div>
          <h4 className="font-bold text-lb-text text-xs">{ticker.symbol}</h4>
          <span className="text-[10px] text-lb-text-muted">{ticker.category}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm text-lb-text">{(ticker.price || ticker.bid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
        <div className={`font-mono text-xs flex items-center justify-end mt-0.5 ${isUp ? 'text-emerald-400' : 'text-lb-down'}`}>
          {isUp ? '+' : ''}{(ticker.changePercent || 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function TickerTableRow({ ticker }: { ticker: MarketTicker }) {
  const isUp = ticker.changePercent >= 0;

  return (
    <tr className="hover:bg-lb-bg/50 transition-colors group">
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-bold text-lb-text">{ticker.symbol}</div>
            <div className="text-[10px] text-lb-text-muted mt-0.5">{ticker.category}</div>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-lb-down'}`}>
          {(ticker.price || ticker.bid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
        </span>
      </td>
      <td className="p-4 text-right">
        <div className={`flex flex-col items-end ${isUp ? 'text-emerald-400' : 'text-lb-down'}`}>
          <span className="font-bold">{isUp ? '+' : ''}{(ticker.changePercent || 0).toFixed(2)}%</span>
          <span className="text-[10px] opacity-80">{isUp ? '+' : ''}{(ticker.change || 0).toFixed(4)}</span>
        </div>
      </td>
      <td className="p-4 text-right text-lb-text">
        {(ticker.bid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
      </td>
      <td className="p-4 text-right text-lb-text">
        {(ticker.ask || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
      </td>
      <td className="p-4 text-right text-lb-text-muted">
        {(ticker.spread || ((ticker.ask || 0) - (ticker.bid || 0))).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 5 })}
      </td>
      <td className="p-4 text-right text-lb-text-muted">
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ticker.marketStatus === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-lb-text-muted/20 text-lb-text-muted'}`}>
          {ticker.marketStatus || 'OPEN'}
        </span>
      </td>
      <td className="p-4 text-center">
        <button className="bg-zinc-800 hover:bg-emerald-500 hover:text-black text-lb-text-muted p-2 rounded transition-colors group-hover:opacity-100 opacity-0 focus:opacity-100">
          <ArrowRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
