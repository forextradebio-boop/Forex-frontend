/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Check, 
  Percent, 
  ShieldCheck, 
  AlertTriangle,
  Flame,
  Activity,
  Award,
  Bell,
  Trash2,
  Sliders,
  DollarSign,
  Briefcase,
  X,
  Settings
} from "lucide-react";
import { 
  SymbolData, 
  AssetCategory, 
  TradeSide, 
  OrderType, 
  Position, 
  Order, 
  PriceAlert,
  UserWallet
} from "../types";
import * as marketService from "../services/market";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, createOrder, updateOrder, deleteOrder, PendingOrder } from "../services/orders";
import { getWatchlist, updateWatchlist } from "../services/watchlist";
import { getAlerts, createAlert, updateAlert, deleteAlert } from "../services/alerts";

class ChartErrorBoundary extends React.Component<{children: React.ReactNode, symbolKey: string}, {hasError: boolean, retryCount: number}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.symbolKey !== this.props.symbolKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: any) {
    console.warn("TradingView widget encountered an error. Suppressing crash:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full text-zinc-500 bg-zinc-950/50 rounded border border-zinc-800/50">
          <AlertTriangle className="w-8 h-8 mb-2 text-rose-500/50 animate-pulse" />
          <p className="text-xs mb-4">Chart visualization unavailable</p>
          <button 
            onClick={() => this.setState({ hasError: false, retryCount: this.state.retryCount + 1 })}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded border border-zinc-700 transition"
          >
            Retry Connection
          </button>
        </div>
      );
    }
    return <div key={this.state.retryCount} className="w-full h-full">{this.props.children}</div>;
  }
}

interface TradingTerminalProps {
  symbols: SymbolData[];
  wallet: UserWallet;
  positions: Position[];
  orders?: Order[];
  closedHistory: any[];
  userId?: string;
  onPlaceOrder: (orderPayload: any) => Promise<any>;
  onClosePosition: (id: string) => Promise<any>;
}

export default function TradingTerminal({
  symbols,
  wallet,
  positions,
  closedHistory,
  userId,
  onPlaceOrder,
  onClosePosition
}: TradingTerminalProps) {
  // Positions State
  const [localPositions, setLocalPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // --- Watchlist Query ---
  const { data: watchlistData, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    refetchInterval: 5000
  });

  const watchlistSymbols: string[] = watchlistData?.symbols || [];

  const updateWatchlistMutation = useMutation({
    mutationFn: updateWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const handleToggleWatchlist = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const isWatched = watchlistSymbols.includes(symbol);
    const updated = isWatched
      ? watchlistSymbols.filter(s => s !== symbol)
      : [...watchlistSymbols, symbol];
    updateWatchlistMutation.mutate(updated);
  };


  // Pending Orders Query
  const { 
    data: pendingOrders = [], 
    isLoading: isLoadingOrders, 
    isError: isErrorOrders, 
    error: ordersError 
  } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  // --- Alerts Query ---
  const { data: alertsData = [], isLoading: isLoadingAlerts, isError: isErrorAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 5000
  });

  const createAlertMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  // Alerts Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);

  const handleOpenNewAlert = (symbol?: string) => {
    setEditingAlert(symbol ? { symbol } : null);
    setIsAlertModalOpen(true);
  };
  
  const handleEditAlert = (alert: any) => {
    setEditingAlert(alert);
    setIsAlertModalOpen(true);
  };

  const handleDeleteAlert = (id: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteAlertMutation.mutate(id);
    }
  };

  // Pending Order Modal State
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [editingPendingOrder, setEditingPendingOrder] = useState<PendingOrder | null>(null);
  
  const handleOpenNewPendingOrder = () => {
    setEditingPendingOrder(null);
    setIsPendingModalOpen(true);
  };
  
  const handleEditPendingOrder = (order: PendingOrder) => {
    setEditingPendingOrder(order);
    setIsPendingModalOpen(true);
  };

  const handleDeletePendingOrder = (id: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  const fetchPositions = async () => {
    setIsLoadingPositions(true);
    setPositionsError(null);
    try {
      const { getPositions } = await import('../services/trading');
      const data = await getPositions();
      const mapped = data.map((p: any) => ({
        id: p._id,
        symbol: p.symbol,
        side: p.type,
        size: p.volume,
        entryPrice: p.openPrice,
        currentPrice: p.currentPrice,
        pnl: p.pnl,
        status: p.status || 'OPEN',
        timestamp: p.createdAt || p.openTime || Date.now()
      }));
      mapped.sort((a: any, b: any) => b.timestamp - a.timestamp);
      setLocalPositions(mapped);
    } catch (err: any) {
      setPositionsError(err.response?.data?.error || "Failed to fetch positions");
    } finally {
      setIsLoadingPositions(false);
    }
  };

  // Position fetching effect
  useEffect(() => {
    if (userId) {
      fetchPositions();
    }
  }, [userId]);

  // Order Placement States
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [orderErrorMsg, setOrderErrorMsg] = useState<string | null>(null);

  // Sync real-time PNL updates from App.tsx SSE socket into localPositions
  useEffect(() => {
    if (positions.length > 0) {
      setLocalPositions(prev => {
        const updated = [...prev];
        positions.forEach(p => {
          const idx = updated.findIndex(up => up.id === p.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], pnl: p.pnl, currentPrice: p.currentPrice };
          } else {
            // New position from SSE that we haven't fetched yet
            updated.push({ ...p, timestamp: p.timestamp || Date.now() });
          }
        });
        updated.sort((a: any, b: any) => b.timestamp - a.timestamp);
        return updated;
      });
    }
  }, [positions]);

  // Navigation states
  const [selectedSymbolCode, setSelectedSymbolCode] = useState<string>("BTCUSDT");
  const [selectedCategory, setSelectedCategory] = useState<any>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeBottomTab, setActiveBottomTab] = useState<"POSITIONS" | "PENDING" | "HISTORY" | "ALERTS">("POSITIONS");

  // Indicator States
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showEMA, setShowEMA] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<string>("15m");

  // Order Ticket Configuration States
  const [tradeSide, setTradeSide] = useState<TradeSide>(TradeSide.BUY);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [limitValue, setLimitValue] = useState<string>("");
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [leverage, setLeverage] = useState<number>(10);
  const [useSL, setUseSL] = useState<boolean>(false);
  const [slValue, setSlValue] = useState<string>("");
  const [useTP, setUseTP] = useState<boolean>(false);
  const [tpValue, setTpValue] = useState<string>("");

  // Price alert inputs
  const [alertPrice, setAlertPrice] = useState<string>("");
  const [alertAbove, setAlertAbove] = useState<boolean>(true);

  // SVG Chart Crosshair hover state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Map internal symbols to TradingView compatible symbols
  const getTVSymbol = (sym: string) => {
    if (!sym) return 'BINANCE:BTCUSDT';
    const clean = sym.replace('/', '').toUpperCase();
    
    if (clean === 'BTCUSD' || clean === 'BTCUSDT') return 'BINANCE:BTCUSDT';
    if (clean === 'ETHUSD' || clean === 'ETHUSDT') return 'BINANCE:ETHUSDT';
    if (clean === 'SOLUSD' || clean === 'SOLUSDT') return 'BINANCE:SOLUSDT';
    if (clean === 'DOGEUSD' || clean === 'DOGEUSDT') return 'BINANCE:DOGEUSDT';
    
    if (clean === 'EURUSD' || clean === 'GBPUSD' || clean === 'USDJPY') return `FX_IDC:${clean}`;
    if (clean === 'XAUUSD' || clean === 'XAGUSD') return `OANDA:${clean}`;
    if (clean === 'AAPL' || clean === 'TSLA' || clean === 'NVDA' || clean === 'MSFT') return `NASDAQ:${clean}`;
    
    return clean;
  };

  // Map internal timeframes to TradingView standard interval formats
  const getTVInterval = (tf: string): any => {
    switch (tf) {
      case '5m': return '5';
      case '15m': return '15';
      case '1h': return '60';
      case '4h': return '240';
      case '1d': return 'D';
      default: return '15';
    }
  };

  // Find active single symbol metadata
  const selectedSymbol = symbols.find(s => s.symbol === selectedSymbolCode) || symbols[0];

  // Sync pricing values for ticket controls when target asset pivots
  const [chartData, setChartData] = useState<any[]>([]);

  // Intercept TradingView fetch requests to prevent crashes and console spam
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      if (url && typeof url === 'string' && url.includes('conversions_en.json')) {
        try {
          const response = await originalFetch(...args);
          if (!response.ok) throw new Error('TradingView config fetch failed');
          return response;
        } catch (error) {
          console.warn('TradingView optional config fetch failed. Using fallback mock to prevent crash.');
          return new Response(JSON.stringify({ conversions: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Update selected symbol code when symbols load
  useEffect(() => {
    if (selectedSymbol) {
      setLimitValue((selectedSymbol?.price ?? 0).toString());
      setSlValue(((selectedSymbol?.price ?? 0) * 0.95).toFixed(2));
      setTpValue(((selectedSymbol?.price ?? 0) * 1.05).toFixed(2));
      setAlertPrice((selectedSymbol?.price ?? 0).toString());
      
      // Enforce symbol max leverage bounds if needed
      if (leverage > selectedSymbol.leverageLimit) {
        setLeverage(selectedSymbol.leverageLimit);
      }

      // Fetch dynamic chart
      marketService.getChart(encodeURIComponent(selectedSymbol.symbol)).then(res => {
        // Handle array response from our recent API change
        if (Array.isArray(res)) {
          setChartData(res);
        } else if (res && res.chart) {
          setChartData(res.chart);
        }
      }).catch(() => setChartData([]));
    }
  }, [selectedSymbolCode, selectedSymbol?.price]);

  // Handle lot changes
  const adjustLotSize = (multiplier: number) => {
    const rawVal = lotSize + multiplier;
    if (rawVal >= 0.01) {
      setLotSize(parseFloat(rawVal.toFixed(2)));
    }
  };

  // Compute ticket estimated metrics
  let assetValueMultiplier = selectedSymbol ? selectedSymbol.price : 1;
  if (selectedSymbol?.category === AssetCategory.FOREX) assetValueMultiplier = selectedSymbol.price * 10000;
  else if (selectedSymbol?.category === AssetCategory.COMMODITIES) assetValueMultiplier = selectedSymbol.price * 100;
  
  const estimatedNotional = (orderType === OrderType.MARKET ? selectedSymbol.price : parseFloat(limitValue) || selectedSymbol.price) * lotSize * (selectedSymbol?.category === AssetCategory.FOREX ? 100000 : 1);
  const estimatedMargin = estimatedNotional / leverage;
  const isSufficientFunds = wallet.freeMargin >= estimatedMargin;

  // Execute order placement
  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSuccessMsg(null);
    setOrderErrorMsg(null);

    if (!selectedSymbol?.symbol) {
      setOrderErrorMsg("Invalid symbol");
      return;
    }
    if (!lotSize || lotSize <= 0) {
      setOrderErrorMsg("Volume must be greater than 0");
      return;
    }
    if (!selectedSymbol.price || selectedSymbol.price <= 0) {
      setOrderErrorMsg("Invalid asset price");
      return;
    }

    setIsPlacingOrder(true);
    try {
      if (orderType === OrderType.MARKET) {
        const { createPosition } = await import('../services/trading');
        
        const payload = {
          symbol: selectedSymbol.symbol,
          type: tradeSide,
          volume: lotSize,
          openPrice: selectedSymbol.price,
          currentPrice: selectedSymbol.price,
          sl: useSL ? parseFloat(slValue) : undefined,
          tp: useTP ? parseFloat(tpValue) : undefined
        };

        await createPosition(payload);
        setOrderSuccessMsg("Trade opened successfully!");
        await fetchPositions();
      } else {
        // Fallback for LIMIT orders
        const payload = {
          symbol: selectedSymbol.symbol,
          side: tradeSide,
          type: orderType,
          limitPrice: parseFloat(limitValue),
          size: lotSize,
          leverage,
          slPrice: useSL ? parseFloat(slValue) : undefined,
          tpPrice: useTP ? parseFloat(tpValue) : undefined
        };
        await onPlaceOrder(payload);
        setOrderSuccessMsg("Order placed successfully!");
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setOrderSuccessMsg(null), 3000);
    } catch (err: any) {
      setOrderErrorMsg(err.response?.data?.error || err.message || "Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Create alert helper
  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertPrice || isNaN(parseFloat(alertPrice))) return;

    try {
      createAlertMutation.mutate({
        symbol: selectedSymbol.symbol,
        targetPrice: parseFloat(alertPrice),
        condition: alertAbove ? 'ABOVE' : 'BELOW'
      });
      setAlertPrice((selectedSymbol?.price ?? 0).toString());
    } catch (err) {
      alert("Error generating alert.");
    }
  };

  // Filter symbols based on category selection and search
  const filteredSymbols = symbols.filter(s => {
    const matchesCat = selectedCategory === "ALL" 
      || (selectedCategory === "WATCHLIST" ? watchlistSymbols.includes(s.symbol) : s.category === selectedCategory);
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Hot symbol movers list
  const topMovers = [...symbols].map(s => {
    const pChange = ((s.price - s.openPrice) / s.openPrice) * 100;
    return { ...s, pChange };
  }).sort((a,b) => Math.abs(b.pChange) - Math.abs(a.pChange)).slice(0, 3);

  const chartHeight = 280;

  // Find if user has open position for current asset
  const activeSymbolPositions = positions.filter(p => p.symbol === selectedSymbolCode);

  return (
    <div id="trading-terminal" className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative">
      
      {/* Dynamic Asset Info Sub-Header Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 font-bold">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black font-mono tracking-tight text-white">{selectedSymbol.symbol}</h2>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest px-1.5 py-0.5 bg-zinc-800 rounded font-bold">
                {selectedSymbol.category}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[180px]">{selectedSymbol.name}</p>
          </div>
        </div>

        {/* Dynamic ticker quote updates */}
        <div className="flex items-center space-x-6 md:space-x-10">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider leading-none">Last Price</p>
            <p className={`text-xl font-mono font-black mt-1 ${selectedSymbol.price >= selectedSymbol.openPrice ? "text-emerald-400" : "text-rose-400"}`}>
              ${(selectedSymbol.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="hidden sm:block">
            <p className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider leading-none">High Today</p>
            <p className="text-sm font-mono text-zinc-300 font-bold mt-1">${(selectedSymbol.high ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="hidden sm:block">
            <p className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider leading-none">Low Today</p>
            <p className="text-sm font-mono text-zinc-300 font-bold mt-1">${(selectedSymbol.low ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="hidden md:block">
            <p className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider leading-none">Volume (24H)</p>
            <p className="text-sm font-mono text-zinc-400 font-bold mt-1">{(selectedSymbol.volume ?? 0).toLocaleString()} contracts</p>
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider leading-none">Leverages Allowed</p>
            <p className="text-sm font-mono text-emerald-400 font-extrabold mt-1">Up to 1:{selectedSymbol.leverageLimit}</p>
          </div>
        </div>
      </div>

      {/* Main Terminal Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        
        {/* Left Side: Market Watch Sidebar */}
        <div className="lg:col-span-3 border-r border-zinc-800 bg-zinc-950/20 flex flex-col h-[520px] lg:h-auto">
          {/* Search bar inside */}
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Market Watch</span>
            <div className="relative w-40">
              <Search className="absolute left-2 top-2.5 w-3 h-3 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-2 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Asset Class Categories Selector */}
          <div className="px-2 py-1.5 bg-zinc-950/60 border-b border-zinc-800 flex space-x-1 overflow-x-auto scrolling-touch">
            {(["ALL", "WATCHLIST", ...Object.keys(AssetCategory)] as const).map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-extrabold font-sans transition shrink-0 ${selectedCategory === cat ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List of elements */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 bg-zinc-950/10 relative">
            {isLoadingWatchlist && selectedCategory === "WATCHLIST" && (
              <div className="absolute inset-0 bg-zinc-950/50 flex flex-col items-center justify-center z-10 space-y-4">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="text-zinc-500 text-xs font-mono">Loading Watchlist...</span>
              </div>
            )}
            
            {filteredSymbols.map(s => {
              const change = s.price - s.openPrice;
              const pct = (change / s.openPrice) * 100;
              const isWatched = watchlistSymbols.includes(s.symbol);
              const isSelected = s.symbol === selectedSymbolCode;

              return (
                <div 
                  key={s.symbol}
                  onClick={() => setSelectedSymbolCode(s.symbol)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition ${isSelected ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-zinc-800/40'}`}
                >
                  <div className="flex items-center space-x-2.5">
                    {/* Star watch icon */}
                    <button 
                      onClick={(e) => handleToggleWatchlist(e, s.symbol)}
                      disabled={updateWatchlistMutation.isPending}
                      className={`p-1 rounded-full transition ${isWatched ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className={`font-mono text-xs ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{s.symbol}</strong>
                        <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold tracking-widest ${s.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {s.isActive ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">{s.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-xs font-bold ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      ${(s.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-[10px] font-mono mt-0.5 ${change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {change >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
            
            {filteredSymbols.length === 0 && selectedCategory === "WATCHLIST" && !isLoadingWatchlist && (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-xs font-mono font-medium">No symbols in watchlist</p>
                <p className="text-[10px] mt-1 opacity-70">Star symbols to add them here</p>
              </div>
            )}
            
            {filteredSymbols.length === 0 && selectedCategory !== "WATCHLIST" && (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">No assets match filtering.</div>
            )}
          </div>
          
          {/* Core Market Movers panel */}
          <div className="p-3 bg-zinc-950/40 border-t border-zinc-800">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2.5 flex items-center">
              <Flame className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              High Volatility Volts
            </h4>
            <div className="space-y-2">
              {topMovers.map(tm => (
                <div 
                  key={tm.symbol} 
                  onClick={() => setSelectedSymbolCode(tm.symbol)}
                  className="flex items-center justify-between text-[11px] p-2 bg-zinc-950 rounded border border-zinc-900 cursor-pointer hover:border-zinc-800 hover:bg-zinc-900/55"
                >
                  <div className="flex items-center space-x-3 text-[10px]">
                  <span className="font-mono font-extrabold text-slate-300">{tm.symbol}</span>
                  <span className="font-mono text-slate-400">${(tm.price ?? 0).toLocaleString()}</span>
                  <span className={`font-mono font-bold ${tm.pChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {tm.pChange >= 0 ? "+" : ""}{tm.pChange.toFixed(1)}%
                  </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Section: Advanced Candlestick SVG charts and metrics */}
        <div className="lg:col-span-6 flex flex-col border-r border-zinc-800 min-h-[480px] lg:min-h-0 bg-zinc-950">
          
          {/* Chart Controls Bar */}
          <div className="bg-zinc-950/20 border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center space-x-2">
              {/* Timeframes */}
              {["5m", "15m", "1h", "4h", "1d"].map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition ${timeframe === tf ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Indicator overlays checkboxes */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={showSMA}
                  onChange={() => setShowSMA(!showSMA)}
                  className="rounded accent-emerald-500" 
                />
                <span className="text-zinc-400 font-mono">SMA (7p)</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={showEMA}
                  onChange={() => setShowEMA(!showEMA)}
                  className="rounded accent-indigo-500" 
                />
                <span className="text-zinc-400 font-mono">EMA (9p)</span>
              </label>
            </div>
          </div>

          {/* Dynamic Chart */}
          <div className="flex-1 p-4 relative min-h-[280px]">
            <div className="relative h-full w-full bg-zinc-950 rounded overflow-hidden">
              {selectedSymbolCode ? (
                <ChartErrorBoundary symbolKey={selectedSymbolCode}>
                  {/* Loading Skeleton underneath */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-600 rounded-full animate-spin mb-3"></div>
                    <div className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase">Initializing Chart</div>
                  </div>
                  {/* The chart widget is absolute to sit on top of the skeleton */}
                  <div className="relative z-10 w-full h-full">
                    <AdvancedRealTimeChart 
                      theme="dark" 
                      symbol={getTVSymbol(selectedSymbolCode)} 
                      autosize
                      interval={getTVInterval(timeframe)}
                      hide_side_toolbar={false}
                    />
                  </div>
                </ChartErrorBoundary>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-800 rounded">
                  Select a symbol to view chart
                </div>
              )}
            </div>
          </div>

          {/* Quick Terminal Balance Status Bar (for instant sanity checks) */}
          <div className="bg-zinc-950 border-t border-b border-zinc-800 py-2.5 px-4 grid grid-cols-2 sm:grid-cols-5 gap-y-2 gap-x-4 text-xs font-mono backdrop-blur-sm">
            <div>
              <p className="text-zinc-500 text-[10px]">TOTAL BALANCE</p>
              <p className="text-white font-bold mt-0.5">${(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px]">EQUITY WEIGHT</p>
              <p className="text-xs text-emerald-400 font-bold mt-0.5">${(wallet?.equity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px]">MARGIN USED</p>
              <p className="text-white mt-0.5">${(wallet?.margin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px]">FREE MARGIN</p>
              <p className={`font-bold mt-0.5 ${wallet.freeMargin > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${(wallet?.freeMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">REALIZED PNL</p>
              <p className={`mt-0.5 font-bold ${wallet?.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {wallet?.pnl >= 0 ? "+" : ""}{(wallet?.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Order Ticket Side-panel */}
        <div className="lg:col-span-3 border-t lg:border-t-0 bg-zinc-950/20 flex flex-col p-4 justify-between min-h-[480px] lg:min-h-0">
          <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
            
            {/* BUY or SELL choice tabs */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button 
                type="button"
                onClick={() => setTradeSide(TradeSide.BUY)}
                className={`py-2 rounded-lg text-xs uppercase font-extrabold tracking-wider transition ${tradeSide === TradeSide.BUY ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                BUY / LONG
              </button>
              <button 
                type="button"
                onClick={() => setTradeSide(TradeSide.SELL)}
                className={`py-2 rounded-lg text-xs uppercase font-extrabold tracking-wider transition ${tradeSide === TradeSide.SELL ? 'bg-rose-500 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* MARKET / LIMIT order type choice */}
            <div className="flex border-b border-zinc-800 pb-1 gap-4">
              <button 
                type="button"
                onClick={() => setOrderType(OrderType.MARKET)}
                className={`text-xs pb-1.5 font-bold transition select-none ${orderType === OrderType.MARKET ? "border-b-2 border-emerald-450 border-emerald-400 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Market Order
              </button>
              <button 
                type="button"
                onClick={() => setOrderType(OrderType.LIMIT)}
                className={`text-xs pb-1.5 font-bold transition select-none ${orderType === OrderType.LIMIT ? "border-b-2 border-emerald-450 border-emerald-400 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Limit Pending
              </button>
            </div>

            {/* Limit price input block */}
            {orderType === OrderType.LIMIT && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Limit Activation Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            {/* Units/Lot size inputs with precise increments */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase font-mono font-bold">
                <span>Lot Size Position volume</span>
                <span className="text-emerald-400">Min 0.01 / Max 500</span>
              </div>
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <button 
                  type="button"
                  onClick={() => adjustLotSize(-0.01)}
                  className="px-3 py-2 hover:bg-zinc-800 text-zinc-400"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={lotSize}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) setLotSize(parsed);
                  }}
                  className="flex-1 bg-transparent px-2 py-2 text-center text-xs font-mono text-white focus:outline-none"
                />
                <button 
                  type="button"
                  onClick={() => adjustLotSize(0.01)}
                  className="px-3 py-2 hover:bg-zinc-800 text-zinc-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Leverage Sliders options */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono font-bold leading-none">
                <span>EXECUTION LEVERAGE</span>
                <span className="text-emerald-400 text-xs font-black">1:{leverage}</span>
              </div>
              <input 
                type="range"
                min="1"
                max={selectedSymbol.leverageLimit}
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-emerald-400 py-1"
              />
              <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                <span>1x</span>
                <span>{(selectedSymbol.leverageLimit / 2).toFixed(0)}x</span>
                <span>{selectedSymbol.leverageLimit}x max</span>
              </div>
            </div>

            {/* Stop loss and Take profits configurations check widgets */}
            <div className="space-y-3.5 pt-1 border-t border-zinc-800">
              {/* SL checkbox */}
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs text-zinc-400 cursor-pointer select-none font-medium">
                  <input 
                    type="checkbox"
                    checked={useSL}
                    onChange={() => setUseSL(!useSL)}
                    className="rounded text-emerald-400 bg-zinc-900 border-zinc-800 accent-emerald-400"
                  />
                  <span>Attach Stop-Loss (Risk Bound)</span>
                </label>
                {useSL && (
                  <input 
                    type="number"
                    step="0.01"
                    value={slValue}
                    onChange={(e) => setSlValue(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-805 border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-400"
                    placeholder="SL Price"
                  />
                )}
              </div>

              {/* TP checkbox */}
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs text-zinc-400 cursor-pointer select-none font-medium">
                  <input 
                    type="checkbox"
                    checked={useTP}
                    onChange={() => setUseTP(!useTP)}
                    className="rounded text-emerald-400 bg-zinc-900 border-zinc-800 accent-emerald-400"
                  />
                  <span>Attach Take-Profit (Goal Target)</span>
                </label>
                {useTP && (
                  <input 
                    type="number"
                    step="0.01"
                    value={tpValue}
                    onChange={(e) => setTpValue(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-805 border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-400"
                    placeholder="TP Price"
                  />
                )}
              </div>
            </div>

            {/* Sub-Card outlining calculated margin requirements */}
            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2 text-[11px] font-mono shadow-md">
              <div className="flex justify-between">
                <span className="text-zinc-500">Notional Exposure:</span>
                <span className="text-zinc-200 font-bold">${(estimatedNotional ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Required Margin:</span>
                <span className={`${isSufficientFunds ? "text-zinc-200" : "text-rose-400 font-black"} font-bold`}>
                  ${(estimatedMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-805 border-zinc-800 pt-1.5 font-bold">
                <span className="text-zinc-400">Margin Status Check:</span>
                {isSufficientFunds ? (
                  <span className="text-emerald-400 flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Ready
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center uppercase font-black tracking-wide">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Reject
                  </span>
                )}
              </div>
            </div>

            {/* Execute Submit push-button */}
            <div className="space-y-2">
              {orderSuccessMsg && (
                <div className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-2 rounded text-center font-bold">
                  {orderSuccessMsg}
                </div>
              )}
              {orderErrorMsg && (
                <div className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2 rounded text-center font-bold">
                  {orderErrorMsg}
                </div>
              )}
              <button 
                id="submit-order-payload"
                type="submit"
                disabled={!isSufficientFunds || isPlacingOrder}
                className={`w-full py-3.5 rounded font-bold transition text-xs uppercase tracking-wider ${isSufficientFunds && !isPlacingOrder ? (tradeSide === TradeSide.BUY ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 cursor-pointer' : 'bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/10 cursor-pointer') : 'bg-zinc-900 text-zinc-550 cursor-not-allowed'}`}
              >
                {isPlacingOrder ? "Processing..." : `Confirm ${tradeSide} - ${orderType} Order`}
              </button>
            </div>
            
          </form>

          {/* Quick Price Alert Generator Block */}
          <div className="bg-zinc-950 p-3.5 rounded border border-zinc-800 space-y-3 mt-4">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 flex items-center">
              <Bell className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              Quick Price Alert
            </h4>
            <form onSubmit={handleCreateAlertSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setAlertAbove(true)}
                  className={`py-1 rounded text-[10px] font-mono leading-none ${alertAbove ? 'bg-amber-400 text-black font-bold' : 'bg-zinc-900 text-zinc-500'}`}
                >
                  Price Goes Above
                </button>
                <button 
                  type="button"
                  onClick={() => setAlertAbove(false)}
                  className={`py-1 rounded text-[10px] font-mono leading-none ${!alertAbove ? 'bg-indigo-500 text-white font-bold' : 'bg-zinc-900 text-zinc-500'}`}
                >
                  Price Goes Below
                </button>
              </div>

              <div className="flex space-x-2">
                <input 
                  type="number"
                  step="0.01"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  type="submit"
                  className="px-3 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                >
                  Set
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Panel Workspace - User trades list, orders list, and history tabs */}
      <div className="border-t border-zinc-800 bg-zinc-950/20 min-h-[220px] max-h-[300px] overflow-y-auto flex flex-col z-10 font-sans">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-4 sticky top-0 z-10 justify-between items-center">
          <div className="flex space-x-6">
            {(["POSITIONS", "PENDING", "ALERTS"] as const).map(tab => {
              let count = 0;
              if (tab === "POSITIONS") count = localPositions.length;
              else if (tab === "PENDING") count = pendingOrders.length;
              else if (tab === "ALERTS") count = alertsData.length;

              return (
                <button 
                  key={tab}
                  onClick={() => {
                    setActiveBottomTab(tab);
                    if (tab === "POSITIONS") fetchPositions();
                  }}
                  className={`py-3 text-xs font-bold transition flex items-center space-x-1.5 border-b-2 select-none ${activeBottomTab === tab ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  <span>{tab}</span>
                  {count > 0 && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border border-emerald-500/20">{count}</span>}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">Account ID: {userId}</span>
        </div>

        {/* Tab content screens */}
        <div className="flex-1 p-4">
          {activeBottomTab === "POSITIONS" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Volume</th>
                    <th className="pb-2">Open Price</th>
                    <th className="pb-2">Current Price</th>
                    <th className="pb-2 text-right">Profit/Loss</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Open Time</th>
                    <th className="pb-2 text-right">Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {isLoadingPositions && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-zinc-500">Loading positions...</td>
                    </tr>
                  )}
                  {positionsError && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-rose-500">{positionsError}</td>
                    </tr>
                  )}
                  {!isLoadingPositions && !positionsError && localPositions.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/30">
                      <td className="py-2.5 text-white font-extrabold">{p.symbol}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.side === TradeSide.BUY ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {p.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-200">{p.size}</td>
                      <td className="py-2.5 text-zinc-300">${(p.entryPrice ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 text-zinc-300">${(p.currentPrice ?? 0).toLocaleString()}</td>
                      <td className={`py-2.5 text-right font-black ${p.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {p.pnl >= 0 ? "+" : ""}{(p.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'OPEN' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        {p.status === 'OPEN' ? (
                          <button 
                            onClick={async () => {
                              await onClosePosition(p.id);
                              fetchPositions();
                            }}
                            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-350 border border-rose-500/20 text-[10px] font-bold transition"
                          >
                            Close
                          </button>
                        ) : (
                          <span className="text-zinc-500 text-[10px] font-bold">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoadingPositions && !positionsError && localPositions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-zinc-500">No active positions</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeBottomTab === "PENDING" && (
            <div className="overflow-x-auto relative">
              {isLoadingOrders && (
                <div className="absolute inset-0 bg-zinc-950/50 flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              )}
              {ordersError && (
                <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center z-10 text-rose-500 text-xs">
                  <AlertTriangle className="w-6 h-6 mb-2" />
                  Failed to load pending orders
                </div>
              )}
              <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400 text-xs font-mono">Manage Active Limit & Stop Orders</span>
                <button 
                  onClick={handleOpenNewPendingOrder}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] px-3 py-1.5 rounded font-bold transition flex items-center shadow-lg shadow-emerald-500/10"
                >
                  <Plus className="w-3 h-3 mr-1" /> New Pending Order
                </button>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                    <th className="pb-2 pl-3">Order ID</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Volume</th>
                    <th className="pb-2">Target Price</th>
                    <th className="pb-2">SL / TP</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {pendingOrders.map((o: any) => (
                    <tr key={o._id} className="hover:bg-zinc-900/30">
                      <td className="py-2.5 pl-3 font-bold text-zinc-400">{o._id?.substring(0, 8)}</td>
                      <td className="py-2.5 text-white font-extrabold">{o.symbol}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.type.includes('BUY') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {o.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-200">{o.volume}</td>
                      <td className="py-2.5 text-zinc-300 font-bold">${o.price}</td>
                      <td className="py-2.5 text-zinc-400">
                        {o.sl ? `$${o.sl}` : '-'} / {o.tp ? `$${o.tp}` : '-'}
                      </td>
                      <td className="py-2.5 text-amber-500 font-bold">{o.status}</td>
                      <td className="py-2.5 pr-3 flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditPendingOrder(o)}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-bold transition"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePendingOrder(o._id)}
                          disabled={deleteOrderMutation.isPending}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 border border-zinc-800 text-[10px] font-bold transition"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingOrders && !ordersError && pendingOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-zinc-500">No pending orders. Click "New Pending Order" to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeBottomTab === "ALERTS" && (
            <div className="relative min-h-[150px] p-4">
              {isLoadingAlerts && (
                <div className="absolute inset-0 bg-zinc-950/50 flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              )}
              {isErrorAlerts && (
                <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center z-10 text-rose-500 text-xs">
                  <AlertTriangle className="w-6 h-6 mb-2" />
                  Failed to load alerts
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-400 text-xs font-mono">Manage Price Alerts</span>
                <button 
                  onClick={() => handleOpenNewAlert(selectedSymbol?.symbol)}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] px-3 py-1.5 rounded font-bold transition flex items-center shadow-lg shadow-indigo-500/10"
                >
                  <Plus className="w-3 h-3 mr-1" /> New Alert
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {alertsData.map((a: any) => (
                  <div key={a._id} className="bg-zinc-900/50 p-3 rounded border border-zinc-800 flex justify-between items-center text-xs font-mono shadow">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <strong className="text-zinc-200 font-bold">{a.symbol}</strong>
                        <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${a.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                          {a.isActive ? 'ACTIVE' : 'TRIGGERED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">On crossing ${a.targetPrice} ({a.condition === 'ABOVE' ? 'Above' : 'Below'})</p>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditAlert(a)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 transition cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAlert(a._id)}
                        disabled={deleteAlertMutation.isPending}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {!isLoadingAlerts && !isErrorAlerts && alertsData.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs font-mono">No price alerts configured. Click "New Alert" or use the right sidebar.</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Pending Order Modal */}
      {isPendingModalOpen && (
        <PendingOrderModal 
          isOpen={isPendingModalOpen} 
          onClose={() => setIsPendingModalOpen(false)} 
          order={editingPendingOrder} 
          symbols={symbols}
        />
      )}

      {/* Alert Modal */}
      {isAlertModalOpen && (
        <AlertModal 
          isOpen={isAlertModalOpen} 
          onClose={() => setIsAlertModalOpen(false)} 
          alert={editingAlert} 
          symbols={symbols}
        />
      )}
    </div>
  );
}

function PendingOrderModal({ isOpen, onClose, order, symbols }: any) {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState(order?.symbol || symbols[0]?.symbol || "EURUSD");
  const [type, setType] = useState(order?.type || "BUY_LIMIT");
  const [volume, setVolume] = useState<string>(order?.volume?.toString() || "0.1");
  const [price, setPrice] = useState<string>(order?.price?.toString() || "");
  const [sl, setSl] = useState<string>(order?.sl?.toString() || "");
  const [tp, setTp] = useState<string>(order?.tp?.toString() || "");

  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to create order");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<PendingOrder>) => updateOrder(order._id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to update order");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      symbol,
      type,
      volume: parseFloat(volume),
      price: parseFloat(price),
      sl: sl ? parseFloat(sl) : undefined,
      tp: tp ? parseFloat(tp) : undefined
    };

    if (order) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden font-sans">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/40">
          <h3 className="text-white font-bold text-sm tracking-wide">
            {order ? "Edit Pending Order" : "New Pending Order"}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded text-xs">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Symbol</label>
            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              {symbols.map((s: any) => (
                <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Order Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="BUY_LIMIT">BUY LIMIT</option>
              <option value="SELL_LIMIT">SELL LIMIT</option>
              <option value="BUY_STOP">BUY STOP</option>
              <option value="SELL_STOP">SELL STOP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Volume (Lots)</label>
              <input 
                type="number" step="0.01" required
                value={volume} onChange={(e) => setVolume(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Target Price</label>
              <input 
                type="number" step="0.00001" required
                value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Stop Loss</label>
              <input 
                type="number" step="0.00001"
                value={sl} onChange={(e) => setSl(e.target.value)}
                placeholder="Optional"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Take Profit</label>
              <input 
                type="number" step="0.00001"
                value={tp} onChange={(e) => setTp(e.target.value)}
                placeholder="Optional"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="pt-4 flex space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending}
              className={`flex-1 py-2.5 rounded text-xs font-bold transition flex items-center justify-center ${type.includes('BUY') ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20'}`}
            >
              {isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                order ? "Save Changes" : "Place Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AlertModal({ isOpen, onClose, alert, symbols }: any) {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState(alert?.symbol || symbols[0]?.symbol || "EURUSD");
  const [condition, setCondition] = useState(alert?.condition || "ABOVE");
  const [targetPrice, setTargetPrice] = useState<string>(alert?.targetPrice?.toString() || "");

  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to create alert");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateAlert(alert._id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to update alert");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!targetPrice) {
      setError("Please enter a target price");
      return;
    }

    const payload = {
      symbol,
      condition,
      targetPrice: parseFloat(targetPrice)
    };

    if (alert?._id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl shadow-black/50 w-full max-w-sm overflow-hidden font-sans">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/40">
          <h3 className="text-white font-bold text-sm tracking-wide">
            {alert?._id ? "Edit Price Alert" : "New Price Alert"}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded text-xs">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Symbol</label>
            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              {symbols.map((s: any) => (
                <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => setCondition("ABOVE")}
              className={`py-2 rounded text-xs font-mono font-bold transition ${condition === 'ABOVE' ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
            >
              ABOVE
            </button>
            <button 
              type="button"
              onClick={() => setCondition("BELOW")}
              className={`py-2 rounded text-xs font-mono font-bold transition ${condition === 'BELOW' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
            >
              BELOW
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Target Price</label>
            <input 
              type="number" step="0.00001" required
              value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending}
              className={`flex-1 py-2.5 rounded text-xs font-bold transition flex items-center justify-center bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20`}
            >
              {isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                alert?._id ? "Save Changes" : "Create Alert"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
