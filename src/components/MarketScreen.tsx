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
import { 
  useTickers, 
  useForex, 
  useCrypto, 
  useMetals, 
  useTopGainers, 
  useTopLosers 
} from '../hooks/useMarket';
import { MarketTicker } from '../types';

type MarketTab = 'OVERVIEW' | 'FOREX' | 'CRYPTO' | 'METALS';

export default function MarketScreen() {
  const [activeTab, setActiveTab] = useState<MarketTab>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data Hooks
  const { data: tickers, isLoading: isTickersLoading, isError: isTickersError, refetch: refetchTickers, isFetching: isTickersFetching } = useTickers();
  const { data: topGainers, isLoading: isGainersLoading } = useTopGainers();
  const { data: topLosers, isLoading: isLosersLoading } = useTopLosers();

  const handleRefresh = () => {
    refetchTickers();
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

  const isGlobalLoading = isTickersLoading;
  const isGlobalError = isTickersError;

  return (
    <div className="flex flex-col h-full bg-black font-sans text-zinc-300">
      
      {/* Header & Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-950 p-4 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">Markets</h2>
        </div>

        <div className="flex bg-zinc-900 rounded p-1">
          {(['OVERVIEW', 'FOREX', 'CRYPTO', 'METALS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${
                activeTab === tab 
                  ? 'bg-emerald-500 text-black shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors w-48"
            />
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ${isTickersFetching ? 'animate-spin text-emerald-400' : ''}`}
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
          <div className="bg-rose-500/10 border border-rose-500/20 rounded p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <div>
              <h3 className="text-rose-400 font-bold text-lg">Connection Lost</h3>
              <p className="text-zinc-400 text-sm mt-1">Failed to fetch live market data from the server.</p>
            </div>
            <button 
              onClick={handleRefresh}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded font-bold text-sm transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isGlobalLoading && !isGlobalError && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-zinc-900/50 rounded-lg border border-zinc-800"></div>
            <div className="h-64 bg-zinc-900/50 rounded-lg border border-zinc-800"></div>
          </div>
        )}

        {/* Success State */}
        {!isGlobalLoading && !isGlobalError && (
          <>
            {/* Overview Widgets */}
            {activeTab === 'OVERVIEW' && !searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                
                {/* Top Gainers */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                    Top Gainers
                  </h3>
                  {isGainersLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-zinc-900 rounded animate-pulse"></div>)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topGainers?.map(ticker => (
                        <TickerMiniCard key={`gainer-${ticker.symbol}`} ticker={ticker} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Losers */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center mb-4">
                    <TrendingDown className="w-4 h-4 text-rose-500 mr-2" />
                    Top Losers
                  </h3>
                  {isLosersLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-zinc-900 rounded animate-pulse"></div>)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topLosers?.map(ticker => (
                        <TickerMiniCard key={`loser-${ticker.symbol}`} ticker={ticker} />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Main Ticker Table */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                  <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-4 font-semibold tracking-wider">Instrument</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Price</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Change</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Bid</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Ask</th>
                      <th className="p-4 font-semibold tracking-wider text-right">Spread</th>
                      <th className="p-4 font-semibold tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredTickers.length > 0 ? (
                      filteredTickers.map(ticker => (
                        <TickerTableRow key={ticker.symbol} ticker={ticker} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500">
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
    <div className="flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800/80 rounded border border-zinc-800/50 transition cursor-pointer">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {ticker.symbol.substring(0, 3)}
        </div>
        <div>
          <h4 className="font-bold text-white text-xs">{ticker.symbol}</h4>
          <span className="text-[10px] text-zinc-500">{ticker.category}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm text-white">{ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
        <div className={`font-mono text-xs flex items-center justify-end mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isUp ? '+' : ''}{ticker.changePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function TickerTableRow({ ticker }: { ticker: MarketTicker }) {
  const isUp = ticker.changePercent >= 0;

  return (
    <tr className="hover:bg-zinc-900/50 transition-colors group">
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-bold text-white">{ticker.symbol}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{ticker.category}</div>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
        </span>
      </td>
      <td className="p-4 text-right">
        <div className={`flex flex-col items-end ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span className="font-bold">{isUp ? '+' : ''}{ticker.changePercent.toFixed(2)}%</span>
          <span className="text-[10px] opacity-80">{isUp ? '+' : ''}{ticker.change.toFixed(4)}</span>
        </div>
      </td>
      <td className="p-4 text-right text-zinc-300">
        {ticker.bid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
      </td>
      <td className="p-4 text-right text-zinc-300">
        {ticker.ask.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
      </td>
      <td className="p-4 text-right text-zinc-500">
        {ticker.spread.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 5 })}
      </td>
      <td className="p-4 text-center">
        <button className="bg-zinc-800 hover:bg-emerald-500 hover:text-black text-zinc-400 p-2 rounded transition-colors group-hover:opacity-100 opacity-0 focus:opacity-100">
          <ArrowRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
