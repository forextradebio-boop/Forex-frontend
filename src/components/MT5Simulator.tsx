import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Search, ShieldAlert,
  User, Settings, Calendar, HelpCircle, Mail, Menu, Plus,
  Edit, PlusCircle, UserPlus, Play, Info, Download, Trash,
  RefreshCw, X, ChevronRight, Check, Send, Sparkles, BookOpen,
  ArrowLeftRight, MessageSquare, Terminal, Eye, EyeOff, RotateCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme';
import { SymbolData, Position, UserWallet } from '../types';
import api from '../api/axios';
import * as tradingService from '../services/trading';
import * as walletService from '../services/wallet';
import { getNews } from '../services/newsService';
import { getEconomicCalendar } from '../services/calendarService';
import * as depositService from '../services/deposit';
import * as withdrawService from '../services/withdraw';
interface MT5SimulatorProps {
  symbols: SymbolData[];
  wallet: UserWallet;
  positions: Position[];
  closedHistory: any[];
  userId: string;
  onPlaceOrder: (payload: any) => Promise<void>;
  onClosePosition: (id: string) => Promise<void>;
  onBackToDesktop?: () => void;
}

// Simulated historic candle data type
interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function MT5Simulator({
  symbols: initialSymbols,
  wallet,
  positions,
  closedHistory,
  userId,
  onPlaceOrder,
  onClosePosition,
  onBackToDesktop
}: MT5SimulatorProps) {
  const { user: authUser, login: setLogin, logout } = useAuth();

  // Navigation Screens
  // quotes, charts, trade, history, messages, brokers, broker-login, broker-register, order-entry, close-position-confirm, welcome, deposit, withdraw, otp-verify
  const [activeScreen, setActiveScreen] = useState<'quotes' | 'charts' | 'trade' | 'history' | 'messages' | 'brokers' | 'broker-login' | 'broker-register' | 'order-entry' | 'close-position-confirm' | 'welcome' | 'deposit' | 'withdraw' | 'otp-verify' | 'settings'>('quotes');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isChartLandscape, setIsChartLandscape] = useState<boolean>(false);
  const [isTradeLandscape, setIsTradeLandscape] = useState<boolean>(false);

  // Reset trade landscape orientation when leaving the trade screen (starts portrait by default)
  useEffect(() => {
    if (activeScreen !== 'trade') {
      setIsTradeLandscape(false);
    }
  }, [activeScreen]);

  // Demo Account States (Used when not logged in to a real backend account)
  const [demoPositions, setDemoPositions] = useState<any[]>(() => {
    const saved = localStorage.getItem('forexfactory_demo_positions');
    return saved ? JSON.parse(saved) : [];
  });

  const [demoHistory, setDemoHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('forexfactory_demo_history');
    return saved ? JSON.parse(saved) : [
      { id: 'dep1', type: 'DEPOSIT', amount: 100000.00, date: 'June 25, 2026', status: 'APPROVED', symbol: 'USD' }
    ];
  });

  const [demoBalance, setDemoBalance] = useState<number>(() => {
    const saved = localStorage.getItem('forexfactory_demo_balance');
    return saved ? parseFloat(saved) : 100000.00;
  });

  useEffect(() => {
    localStorage.setItem('forexfactory_demo_positions', JSON.stringify(demoPositions));
  }, [demoPositions]);

  useEffect(() => {
    localStorage.setItem('forexfactory_demo_history', JSON.stringify(demoHistory));
  }, [demoHistory]);

  useEffect(() => {
    localStorage.setItem('forexfactory_demo_balance', demoBalance.toString());
  }, [demoBalance]);

  // Quotes screen states
  const [isDetailedMode, setIsDetailedMode] = useState<boolean>(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [quoteMenuSymbol, setQuoteMenuSymbol] = useState<SymbolData | null>(null);

  // Broker states
  const [searchBroker, setSearchBroker] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('Forex Factory');
  const [brokerServer, setBrokerServer] = useState<string>('ForexFactory-Live');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [registerName, setRegisterName] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [registerPhone, setRegisterPhone] = useState<string>('');
  const [brokerLoginError, setBrokerLoginError] = useState<string | null>(null);
  const [brokerRegisterSuccess, setBrokerRegisterSuccess] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // OTP Verification states
  const [otpCode, setOtpCode] = useState<string>('');
  const [authEmailContext, setAuthEmailContext] = useState<string>('');
  const [isOtpVerifying, setIsOtpVerifying] = useState<boolean>(false);

  // Deposit form states
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositUTR, setDepositUTR] = useState<string>('');

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 1800);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Order Placement Screen states
  const [orderType, setOrderType] = useState<'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT'>('BUY');
  const [orderVolume, setOrderVolume] = useState<string>('0.10');
  const [orderSL, setOrderSL] = useState<string>('');
  const [orderTP, setOrderTP] = useState<string>('');
  const [orderTargetPrice, setOrderTargetPrice] = useState<string>('');
  const [orderStatusMessage, setOrderStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // One-Click Trading states
  const [oneClickLots, setOneClickLots] = useState<string>('0.10');
  const [oneClickSuccess, setOneClickSuccess] = useState<string | null>(null);

  // Preferred Currency state (persisted in localStorage)
  type PreferredCurrency = 'USD' | 'USDT' | 'INR' | 'BTC' | 'ETH' | 'EUR' | 'GBP';
  const [preferredCurrency, setPreferredCurrency] = useState<PreferredCurrency>(() => {
    return (localStorage.getItem('ff_preferred_currency') as PreferredCurrency) || 'USD';
  });

  // Deposit screen states
  const [depositCurrency, setDepositCurrency] = useState<string>('USDT');
  const [depositNetwork, setDepositNetwork] = useState<string>('TRC20');
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [depositSubmitted, setDepositSubmitted] = useState<boolean>(false);

  // Withdraw screen states
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>('INR');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawSubmitted, setWithdrawSubmitted] = useState<boolean>(false);

  // Settings & Theme
  const { theme, isLightMode, setIsLightMode } = useTheme();

  // Currency conversion rates (mock, realistic as of 2026)
  const FX_RATES: Record<string, number> = {
    USD: 1,
    USDT: 1,
    INR: 84.50,
    EUR: 0.92,
    GBP: 0.79,
    BTC: 0.0000138,  // 1 USD = 0.0000138 BTC (i.e., 1 BTC ≈ $72,500)
    ETH: 0.000357,   // 1 USD = 0.000357 ETH (i.e., 1 ETH ≈ $2,800)
  };

  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', USDT: '₮', INR: '₹', EUR: '€', GBP: '£', BTC: '₿', ETH: 'Ξ'
  };

  // Convert a USD amount to preferredCurrency
  const toCurrency = (usdAmount: number, decimals = 2): string => {
    const rate = FX_RATES[preferredCurrency] ?? 1;
    const converted = usdAmount * rate;
    const sym = CURRENCY_SYMBOLS[preferredCurrency] ?? '';
    if (preferredCurrency === 'BTC') return `${sym}${converted.toFixed(8)}`;
    if (preferredCurrency === 'ETH') return `${sym}${converted.toFixed(6)}`;
    return `${sym}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // Persist currency preference
  const handleSetCurrency = (cur: PreferredCurrency) => {
    setPreferredCurrency(cur);
    localStorage.setItem('ff_preferred_currency', cur);
  };

  // Position closure confirmation state
  const [positionToClose, setPositionToClose] = useState<Position | null>(null);

  // General news and economics overlays
  const [isNewsOpen, setIsNewsOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [calendarList, setCalendarList] = useState<any[]>([]);

  // Default fallback mock symbols list when server endpoints are blocked/failed
  const defaultMockSymbols = useMemo(() => [
    { symbol: 'EURUSD', price: 1.13619, openPrice: 1.13591, name: 'Euro vs US Dollar', category: 'FOREX' },
    { symbol: 'GBPUSD', price: 1.31864, openPrice: 1.31582, name: 'Pound vs US Dollar', category: 'FOREX' },
    { symbol: 'USDCHF', price: 0.81097, openPrice: 0.81049, name: 'US Dollar vs Swiss Franc', category: 'FOREX' },
    { symbol: 'USDJPY', price: 161.822, openPrice: 161.558, name: 'US Dollar vs Japanese Yen', category: 'FOREX' },
    { symbol: 'USDCNH', price: 6.80428, openPrice: 6.81639, name: 'US Dollar vs Chinese Yuan', category: 'FOREX' },
    { symbol: 'USDRUB', price: 73.594, openPrice: 74.325, name: 'US Dollar vs Russian Ruble', category: 'FOREX' },
    { symbol: 'AUDUSD', price: 0.69005, openPrice: 0.69079, name: 'Australian Dollar vs US Dollar', category: 'FOREX' },
    { symbol: 'NZDUSD', price: 0.56466, openPrice: 0.56656, name: 'New Zealand Dollar vs US Dollar', category: 'FOREX' },
    { symbol: 'USDCAD', price: 1.42306, openPrice: 1.42436, name: 'US Dollar vs Canadian Dollar', category: 'FOREX' },
    { symbol: 'USDSEK', price: 9.71950, openPrice: 9.76261, name: 'US Dollar vs Swedish Krona', category: 'FOREX' },
    { symbol: 'BTCUSD', price: 68420.50, openPrice: 66800.00, name: 'Bitcoin vs US Dollar', category: 'CRYPTO' },
    { symbol: 'ETHUSD', price: 3450.25, openPrice: 3380.00, name: 'Ethereum vs US Dollar', category: 'CRYPTO' },
    { symbol: 'AAPL', price: 189.20, openPrice: 187.50, name: 'Apple Inc.', category: 'STOCKS' },
    { symbol: 'TSLA', price: 175.40, openPrice: 179.80, name: 'Tesla Inc.', category: 'STOCKS' }
  ], []);

  // Real-time flash & ticks tracking
  const [symbolsData, setSymbolsData] = useState<SymbolData[]>(() => {
    return initialSymbols && initialSymbols.length > 0 ? initialSymbols : defaultMockSymbols;
  });
  const [prevSymbolsData, setPrevSymbolsData] = useState<Record<string, number>>({});
  const [tickDirections, setTickDirections] = useState<Record<string, { bid: 'up' | 'down' | null; ask: 'up' | 'down' | null }>>({});

  // Canvas charting states & refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<string>('M15');
  const [chartData, setChartData] = useState<Record<string, ChartCandle[]>>({});
  const [candleWidth, setCandleWidth] = useState<number>(6); // Zoom level
  // Chart rendering constants for premium MT5 style
  const CANDLE_MIN_WIDTH = 8; // Narrower candle bodies for mobile-style MT5 charts
  const CANDLE_MAX_WIDTH = 12; // Maximum body width to keep candles slim
  const CANDLE_SPACING = 10; // Space between candles for a compact view
  const CANDLE_BODY_PADDING = 4; // Inner padding used to center the body inside the candle slot
  const WICK_LINE_WIDTH = 1; // Thinner wick for crisp chart style
  const RIGHT_OFFSET_CANDLES = 8; // Small right-side offset to keep the latest candle just off-screen
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // Sync quotes when symbols list changes

  const toNumberPrice = (value: any): number | null => {
    if (value === null || value === undefined) return null;
    const normalized = typeof value === 'number' ? value : Number(value);
    if (typeof normalized !== 'number' || isNaN(normalized) || !isFinite(normalized)) return null;
    return normalized;
  };

  const isValidCandle = (c: any): c is ChartCandle => {
    if (!c) return false;
    const open = toNumberPrice(c.open);
    const high = toNumberPrice(c.high);
    const low = toNumberPrice(c.low);
    const close = toNumberPrice(c.close);
    if (open === null || high === null || low === null || close === null) return false;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return false;
    if (low > open || low > close) return false;
    if (high < open || high < close) return false;
    if (high < low) return false;
    return true;
  };

  const isLargeJump = (previousClose: number, nextPrice: number) => {
    if (previousClose <= 0) return false;
    return Math.abs(nextPrice - previousClose) / previousClose > 0.03;
  };

  const isExtremeOutlier = (averageClose: number, price: number) => {
    if (averageClose <= 0) return false;
    return Math.abs(price - averageClose) / averageClose > 0.05;
  };

  const logInvalidCandle = (symbol: string, prev: ChartCandle | null, tick: number | null, computed: ChartCandle | null, reason: string) => {
    console.warn(`[CHART] INVALID OHLC DETECTED for ${symbol}: ${reason}`);
    if (prev) console.warn('Previous OHLC', prev);
    console.warn('Incoming Tick', tick);
    if (computed) console.warn('Computed OHLC', computed);
  };
  useEffect(() => {
    if (initialSymbols && initialSymbols.length > 0) {
      setSymbolsData(initialSymbols);
    }
  }, [initialSymbols]);

  // Local simulated ticks when server is offline or not sending price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSymbolsData(prev => {
        return prev.map(s => {
          // 40% chance to update a symbol on each tick interval (makes ticks feel natural)
          if (Math.random() > 0.4) return s;

          const isYen = s.symbol.includes('JPY') || s.symbol.includes('RUB');
          const isCrypto = s.symbol.includes('BTC') || s.symbol.includes('ETH');
          const changePercent = (Math.random() - 0.5) * (isCrypto ? 0.0008 : 0.00012);
          const newPrice = s.price * (1 + changePercent);

          return {
            ...s,
            price: newPrice
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle Tick Flashes on Quote updates
  useEffect(() => {
    const newDirections = { ...tickDirections };
    let hasChanges = false;

    symbolsData.forEach(sym => {
      const prevPrice = prevSymbolsData[sym.symbol];
      const currentPrice = sym.price;

      if (prevPrice !== undefined && prevPrice !== currentPrice) {
        hasChanges = true;
        const dir = currentPrice > prevPrice ? 'up' : 'down';

        newDirections[sym.symbol] = {
          bid: dir,
          ask: dir
        };

        // Reset directions back to null after 550ms
        setTimeout(() => {
          setTickDirections(prev => {
            const copy = { ...prev };
            if (copy[sym.symbol]) {
              copy[sym.symbol] = { bid: null, ask: null };
            }
            return copy;
          });
        }, 550);
      }
    });

    if (hasChanges) {
      setTickDirections(newDirections);
    }

    // Save current prices as previous for next comparison
    const priceMap: Record<string, number> = {};
    symbolsData.forEach(sym => {
      priceMap[sym.symbol] = sym.price;
    });
    setPrevSymbolsData(priceMap);
  }, [symbolsData]);


  // Load News & Economic Calendar
  useEffect(() => {
    const loadDrawerFeeds = async () => {
      try {
        const news = await getNews();
        if (news?.news) setNewsList(news.news);

        const cal = await getEconomicCalendar();
        if (cal?.calendar) setCalendarList(cal.calendar);
      } catch (err) {
        console.warn("Failed loading drawer feeds", err);
      }
    };
    loadDrawerFeeds();
  }, []);

  // Fetch or Generate Chart data for symbols
  useEffect(() => {
    // Generate initial historical candles for all known symbols
    const initialChartData: Record<string, ChartCandle[]> = {};
    const defaultPairs = ['EURUSD', 'GBPUSD', 'USDCHF', 'USDJPY', 'USDCNH', 'USDRUB', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDSEK', 'BTCUSD', 'ETHUSD', 'AAPL', 'TSLA'];

    defaultPairs.forEach(pair => {
      const symObj = symbolsData.find(s => s.symbol === pair || s.symbol === pair.replace('USD', '/USD'));
      let basePrice = (symObj && !isNaN(symObj.price)) ? symObj.price : 1.1360;

      const candles: ChartCandle[] = [];
      let curTime = Date.now() - 50 * 60 * 1000; // 50 intervals ago

      for (let i = 0; i < 60; i++) {
        const vol = basePrice * 0.0015;
        const change = (Math.random() - 0.5) * vol;
        const open = Number(basePrice);
        const close = Number(basePrice + change);
        const high = Number(Math.max(open, close) + Math.random() * vol * 0.3);
        const low = Number(Math.min(open, close) - Math.random() * vol * 0.3);
        const candle: ChartCandle = {
          time: curTime,
          open,
          high,
          low,
          close
        };

        if (!isValidCandle(candle)) {
          console.warn(`[CHART] dropped invalid historical candle for ${pair}`, candle);
        } else {
          candles.push(candle);
        }

        basePrice = close;
        curTime += 15000; // 15 seconds intervals for responsive simulator
      }
      initialChartData[pair] = candles;
    });

    setChartData(initialChartData);
  }, []);

  // Feed Socket / Props Ticks into Candlestick Chart in real-time
  useEffect(() => {
    if (symbolsData.length === 0) return;

    setChartData(prevData => {
      const updated = { ...prevData };

      symbolsData.forEach(sym => {
        const standardSymbol = sym.symbol.replace('/', ''); // unify e.g. EUR/USD -> EURUSD
        const symbolCandles = updated[standardSymbol];

        if (symbolCandles && symbolCandles.length > 0) {
          const lastIndex = symbolCandles.length - 1;
          const lastCandle = symbolCandles[lastIndex];
          const curTime = Date.now();
          const currentPrice = toNumberPrice(sym.price);

          if (currentPrice === null) {
            console.warn(`[CHART] Skipping tick with invalid price for ${standardSymbol}`, sym.price);
            return;
          }

          if (!isValidCandle(lastCandle)) {
            logInvalidCandle(standardSymbol, lastCandle, currentPrice, null, 'previous candle invalid');
            return;
          }

          const previousClose = lastCandle.close;
          const diffPct = previousClose > 0 ? Math.abs(currentPrice - previousClose) / previousClose : 0;
          if (isLargeJump(previousClose, currentPrice)) {
            logInvalidCandle(standardSymbol, lastCandle, currentPrice, null, `POSSIBLE BAD DATA (${(diffPct * 100).toFixed(2)}% jump)`);
            return;
          }

          if (curTime - lastCandle.time > 20000) {
            const newCandle: ChartCandle = {
              time: curTime,
              open: previousClose,
              high: Math.max(previousClose, currentPrice),
              low: Math.min(previousClose, currentPrice),
              close: currentPrice
            };
            if (!isValidCandle(newCandle)) {
              logInvalidCandle(standardSymbol, lastCandle, currentPrice, newCandle, 'new candle invalid');
              return;
            }
            symbolCandles.push(newCandle);
          } else {
            const updatedCandle: ChartCandle = { ...lastCandle };
            updatedCandle.close = currentPrice;
            updatedCandle.high = Math.max(updatedCandle.high, currentPrice);
            updatedCandle.low = Math.min(updatedCandle.low, currentPrice);

            if (!isValidCandle(updatedCandle)) {
              logInvalidCandle(standardSymbol, lastCandle, currentPrice, updatedCandle, 'updated candle invalid');
              return;
            }

            symbolCandles[lastIndex] = updatedCandle;
          }
          updated[standardSymbol] = [...symbolCandles];
        }
      });

      return updated;
    });
  }, [symbolsData]);

  // Render Canvas Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle dynamic viewport sizing and layout rotated sizes
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const width = canvas.width;
    const height = canvas.height;

    // Fetch active candles
    const activeSymbolClean = selectedSymbol.replace('/', '');
    const rawCandles = chartData[activeSymbolClean] || [];
    const candles = rawCandles.filter(isValidCandle);
    const invalidCount = rawCandles.length - candles.length;

    if (invalidCount > 0) {
      console.warn(`[CHART] ignored ${invalidCount} invalid candles for ${activeSymbolClean}`);
      console.debug('Last 20 raw candles', rawCandles.slice(-20));
    }

    // Background (Modern deep dark or Soft Light Theme)
    ctx.fillStyle = theme.chartBackground;
    ctx.fillRect(0, 0, width, height);

    if (candles.length === 0) {
      ctx.fillStyle = theme.chartText;
      ctx.font = '12px sans-serif';
      ctx.fillText("Loading chart matrix...", width / 2 - 60, height / 2);
      return;
    }

    // Grid details (Modern subtle grid)
    ctx.strokeStyle = theme.chartGrid;
    ctx.lineWidth = 1;
    ctx.setLineDash(isLightMode ? [2, 4] : []);

    const rightMargin = 60;
    const topMargin = height * 0.12; // 12% top margin
    const bottomMargin = height * 0.18; // 18% bottom margin (more room for time labels and footer overlay)
    const plotWidth = width - rightMargin;
    const plotHeight = height - topMargin - bottomMargin;

    // Draw horizontal grids
    const gridRows = 8;
    for (let i = 1; i < gridRows; i++) {
      const y = topMargin + (plotHeight / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();
    }

    // Draw vertical grids
    const gridCols = 6;
    for (let i = 1; i < gridCols; i++) {
      const x = (plotWidth / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, topMargin);
      ctx.lineTo(x, topMargin + plotHeight);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash

    // Determine min/max values for scaling
    // We only scale based on the candles currently visible in the viewport
    const maxVisibleCandles = Math.max(1, Math.floor(plotWidth / (CANDLE_MIN_WIDTH + CANDLE_SPACING)));
    const candleWidth = Math.min(CANDLE_MAX_WIDTH, Math.max(CANDLE_MIN_WIDTH, Math.floor(plotWidth / Math.max(1, maxVisibleCandles + 1))));
    const startIndex = Math.max(0, candles.length - maxVisibleCandles - dragOffset - RIGHT_OFFSET_CANDLES);
    const endIndex = Math.max(0, candles.length - dragOffset);
    const visibleCandles = candles.slice(startIndex, endIndex);

    if (visibleCandles.length === 0) return;

    const averageClose = visibleCandles.reduce((sum, c) => sum + c.close, 0) / visibleCandles.length;
    const scaleCandles = visibleCandles.filter(c => !isExtremeOutlier(averageClose, c.close));
    const candlesForScale = scaleCandles.length >= Math.max(5, visibleCandles.length - 1) ? scaleCandles : visibleCandles;

    let minPrice = Math.min(...candlesForScale.map(c => c.low));
    let maxPrice = Math.max(...candlesForScale.map(c => c.high));

    // Pad prices range slightly
    const padding = (maxPrice - minPrice) * 0.05 || 0.001;
    minPrice -= padding;
    maxPrice += padding;

    const scaleY = (price: number) => {
      // Include top margin offset
      return topMargin + (plotHeight - ((price - minPrice) / (maxPrice - minPrice)) * plotHeight);
    };

    // Draw Price Axis Labels (Right margin)
    ctx.fillStyle = theme.chartText;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridRows; i++) {
      const y = topMargin + (plotHeight / gridRows) * i;
      const priceVal = maxPrice - (i / gridRows) * (maxPrice - minPrice);
      ctx.fillText(priceVal.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5), plotWidth + 5, y + 4);
    }

    // Draw Time Axis Labels & Dotted Vertical grid lines at bottom
    ctx.fillStyle = theme.chartText;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    const timeLabelStep = visibleCandles.length <= 8 ? 1 : Math.ceil(visibleCandles.length / 8);

    // Draw Volume Bars (Background layer)
    visibleCandles.forEach((candle, idx) => {
      const x = plotWidth - (visibleCandles.length - idx) * candleWidth;
      if (x < 0 || x > plotWidth) return;

      // Draw volume bars at the bottom (opacity green/red)
      const candleRange = candle.high - candle.low || 0.0001;
      const simVolume = Math.min(plotHeight * 0.12, (candleRange / (maxPrice - minPrice)) * plotHeight * 0.25 + 5 + (idx % 3) * 2);
      const isUp = candle.close >= candle.open;
      ctx.fillStyle = isUp ? `${theme.chartCandleGreen}33` : `${theme.chartCandleRed}33`;
      // Volume bars positioned within plot area plus top margin
      ctx.fillRect(x + 1, topMargin + plotHeight - simVolume, candleWidth - 2, simVolume);

      // Draw time labels at the bottom (below plot area)
      if ((startIndex + idx) % timeLabelStep === 0) {
        const date = new Date(candle.time);
        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        ctx.fillStyle = theme.chartText;
        ctx.fillText(timeStr, x + candleWidth / 2, topMargin + plotHeight + 18);

        // draw brief vertical dotted line to align time
        ctx.strokeStyle = theme.chartGrid;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, topMargin + plotHeight - 6);
        ctx.lineTo(x + candleWidth / 2, topMargin + plotHeight + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw Candlesticks
    visibleCandles.forEach((candle, idx) => {
      const x = plotWidth - (visibleCandles.length - idx) * candleWidth;

      if (x < 0 || x > plotWidth) return;

      const yOpen = scaleY(candle.open);
      const yClose = scaleY(candle.close);
      const yHigh = scaleY(candle.high);
      const yLow = scaleY(candle.low);

      const isUp = candle.close >= candle.open;

      // Modern TradingView Style Solid Candles
      ctx.strokeStyle = isUp ? theme.chartCandleGreen : theme.chartCandleRed;
      ctx.fillStyle = isUp ? theme.chartCandleGreen : theme.chartCandleRed;
      ctx.lineWidth = WICK_LINE_WIDTH;

      // Fix crispness by aligning to half-pixel
      const midX = Math.floor(x + candleWidth / 2) + 0.5;
      const candleBodyW = Math.max(2, candleWidth - CANDLE_BODY_PADDING);
      const bodyX = Math.floor(x + (candleWidth - candleBodyW) / 2) + 0.5;

      // Wick
      ctx.beginPath();
      ctx.moveTo(midX, yHigh);
      ctx.lineTo(midX, yLow);
      ctx.stroke();

      // Body
      const bodyHeight = Math.max(2, Math.abs(yOpen - yClose));
      const bodyY = Math.min(yOpen, yClose);

      ctx.fillStyle = isUp ? theme.chartCandleGreen : theme.chartCandleRed;
      ctx.fillRect(bodyX, bodyY, candleBodyW, bodyHeight);

      // Add a subtle outline to sharper candles
      ctx.strokeStyle = isUp ? theme.chartCandleGreen : theme.chartCandleRed;
      ctx.lineWidth = 1;
      ctx.strokeRect(bodyX, bodyY, candleBodyW, bodyHeight);
    });

    // Draw indicators (Simulated EMA 14)
    ctx.strokeStyle = theme.primaryBlue;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    visibleCandles.forEach((candle, idx) => {
      // Add a small gap so the last candle never touches the right edge
      const GAP_RIGHT = 6; // px
      const x = plotWidth - (visibleCandles.length - idx) * candleWidth - GAP_RIGHT;
      if (x < 0) return;

      // Simple SMA overlay calculation
      const candleIndex = startIndex + idx;
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, candleIndex - 14); j <= candleIndex; j++) {
        const c = candles[j];
        if (isValidCandle(c)) {
          sum += c.close;
          count++;
        }
      }
      if (count === 0) {
        // No valid candles in window – skip drawing this point
        return;
      }
      const ema = sum / count;

      if (idx === 0) {
        ctx.moveTo(x + candleWidth / 2, scaleY(ema));
      } else {
        ctx.lineTo(x + candleWidth / 2, scaleY(ema));
      }
    });
    ctx.stroke();

    // Draw Live Ask/Bid current price line labels
    const currentPrice = candles[candles.length - 1].close;
    const yLive = scaleY(currentPrice);

    // Bid line (gray/blue dashed)
    ctx.strokeStyle = theme.primaryBlue;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yLive);
    ctx.lineTo(plotWidth, yLive);
    ctx.stroke();

    // Ask line (red dashed)
    const isYen = selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB');
    const rawSpread = isYen ? 0.025 : 0.00015;
    const askPrice = currentPrice + rawSpread;
    const yAsk = scaleY(askPrice);

    ctx.strokeStyle = theme.danger;
    ctx.beginPath();
    ctx.moveTo(0, yAsk);
    ctx.lineTo(plotWidth, yAsk);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Bid tag bubble
    ctx.fillStyle = theme.primaryBlue;
    ctx.fillRect(plotWidth, yLive - 8, rightMargin, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(currentPrice.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5), plotWidth + 4, yLive + 3);

    // Live Ask tag bubble
    ctx.fillStyle = theme.danger;
    ctx.fillRect(plotWidth, yAsk - 8, rightMargin, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(askPrice.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5), plotWidth + 4, yAsk + 3);

    // Draw active trade entry markers for selected symbol
    const currentActivePositions = authUser
      ? positions
      : demoPositions.map(pos => {
        const currentSym = symbolsData.find(s => s.symbol.replace('/', '') === pos.symbol);
        const currentPrice = currentSym ? currentSym.price : pos.entryPrice;
        const posPnl = pos.side === 'BUY'
          ? (currentPrice - pos.entryPrice) * pos.size * 100000
          : (pos.entryPrice - currentPrice) * pos.size * 100000;
        return {
          ...pos,
          currentPrice,
          pnl: posPnl
        };
      });
    const entryPositions = currentActivePositions.filter(pos => pos.symbol.replace('/', '') === selectedSymbol);

    entryPositions.forEach(pos => {
      const entryY = scaleY(pos.entryPrice);
      const markerColor = pos.side === 'BUY' ? theme.primaryBlue : theme.danger;
      ctx.strokeStyle = markerColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(plotWidth - 16, entryY);
      ctx.lineTo(plotWidth, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      const markerTagY = Math.min(Math.max(entryY - 8, topMargin), topMargin + plotHeight - 16);
      ctx.fillStyle = markerColor;
      ctx.fillRect(plotWidth, markerTagY, rightMargin, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${pos.side} ${pos.entryPrice.toFixed(isYen ? 2 : 5)}`, plotWidth + 4, markerTagY + 11);

      // right-margin arrow marker, inside margin area only
      ctx.fillStyle = markerColor;
      ctx.beginPath();
      ctx.moveTo(plotWidth + 10, entryY);
      ctx.lineTo(plotWidth + 18, entryY - 5);
      ctx.lineTo(plotWidth + 18, entryY + 5);
      ctx.closePath();
      ctx.fill();
    });

  }, [chartData, selectedSymbol, candleWidth, dragOffset, isChartLandscape, theme, isLightMode, authUser, positions, demoPositions, symbolsData]);

  // Handle chart dragging (mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const candlesMoved = Math.round(deltaX / candleWidth);
    if (candlesMoved !== 0) {
      setDragOffset(prev => Math.max(0, prev + candlesMoved));
      setDragStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle chart dragging (touch) — prevent page scroll while interacting
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    const candlesMoved = Math.round(deltaX / candleWidth);
    if (candlesMoved !== 0) {
      setDragOffset(prev => Math.max(0, prev + candlesMoved));
      setDragStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Helper: MT5 Price splits formatting (large pips, small pipettes)
  const parseMT5Price = (price: number | undefined) => {
    if (price === undefined) return { prefix: '0.00', big: '00', pipette: '0' };

    const isYen = selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB');
    const decimalPlaces = isYen ? 3 : 5;
    const str = price.toFixed(decimalPlaces);

    if (decimalPlaces === 5) {
      // "1.13619" -> "1.13", "61", "9"
      return {
        prefix: str.substring(0, 4), // "1.13"
        big: str.substring(4, 6),    // "61"
        pipette: str.substring(6)      // "9"
      };
    } else {
      // JPY "161.822" -> "161.", "82", "2"
      return {
        prefix: str.substring(0, 4), // "161."
        big: str.substring(4, 6),    // "82"
        pipette: str.substring(6)      // "2"
      };
    }
  };

  // Spread calculation for Quotes List
  const calculateSpread = (symbol: string, currentPrice: number) => {
    const isYen = symbol.includes('JPY') || symbol.includes('RUB');
    const rawSpread = isYen ? 0.025 : 0.00015;
    const spreadInPips = rawSpread * (isYen ? 100 : 10000);
    return Math.round(spreadInPips);
  };

  // Download Mock APK File
  const handleDownloadAPK = () => {
    // Generate a simulated APK file block download
    const dummySize = 1024 * 1024 * 1.5; // 1.5MB mock binary
    const buffer = new ArrayBuffer(dummySize);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < dummySize; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }

    const blob = new Blob([buffer], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forex-factory.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Secure Broker Sign-in Logic
  const handleBrokerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsAuthLoading(true);
    setBrokerLoginError(null);

    try {
      const { data } = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      if (data && data.otpRequired) {
        setAuthEmailContext(data.userId);
        // Pre-fill demo OTP if available to make testing easier
        if (data.demoOtp) {
          setOtpCode(data.demoOtp);
        }
        setBrokerLoginError(null);
        setActiveScreen('otp-verify');
      } else if (data && data.token) {
        setLogin(data.token, data.refreshToken, data.profile);
        setBrokerLoginError(null);
        setActiveScreen('trade');
        // Clear login form
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setBrokerLoginError("Unrecognized account metrics or server mismatch.");
      }
    } catch (err: any) {
      setBrokerLoginError(err.response?.data?.error || "Error connecting to MT5 verification host.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Broker Account Registration
  const handleBrokerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) return;

    setIsAuthLoading(true);
    setBrokerLoginError(null);

    try {
      const { data } = await api.post('/auth/register', {
        fullName: registerName,
        email: registerEmail,
        password: registerPassword,
        phone: registerPhone
      });

      setBrokerRegisterSuccess(true);
      setTimeout(() => {
        setBrokerRegisterSuccess(false);
        if (data && data.otpRequired) {
          setAuthEmailContext(data.userId);
          if (data.demoOtp) {
            setOtpCode(data.demoOtp);
          }
          setActiveScreen('otp-verify');
        } else {
          setActiveScreen('welcome'); // Fallback if no OTP required
        }
      }, 1800);
    } catch (err: any) {
      setBrokerLoginError(err.response?.data?.error || "Registration system credentials rejected.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // OTP Verification Logic
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !authEmailContext) return;

    setIsOtpVerifying(true);
    setBrokerLoginError(null);

    try {
      const { data } = await api.post('/auth/verify-2fa', {
        userId: authEmailContext,
        code: otpCode
      });

      if (data && data.token) {
        setLogin(data.token, data.refreshToken, data.profile);
        setBrokerLoginError(null);
        setActiveScreen('welcome'); // Or 'trade' depending on preference
        // Clear auth states
        setOtpCode('');
        setAuthEmailContext('');
      } else {
        setBrokerLoginError("Failed to verify OTP.");
      }
    } catch (err: any) {
      setBrokerLoginError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // Place Quick Order
  const handlePlaceSimulatorOrder = async () => {
    const size = parseFloat(orderVolume);
    if (isNaN(size) || size <= 0) {
      setOrderStatusMessage({ text: "Invalid Volume lots format.", type: 'error' });
      return;
    }

    const currentSym = symbolsData.find(s => s.symbol.replace('/', '') === selectedSymbol);
    const livePrice = currentSym ? currentSym.price : 1.1360;

    try {
      const slNum = orderSL ? parseFloat(orderSL) : undefined;
      const tpNum = orderTP ? parseFloat(orderTP) : undefined;

      await onPlaceOrder({
        symbol: selectedSymbol,
        side: orderType,
        size: size,
        type: 'MARKET',
        limitPrice: livePrice,
        slPrice: slNum,
        tpPrice: tpNum
      });

      setOrderStatusMessage({ text: `Order placed successfully! Position open.`, type: 'success' });

      // Reset inputs & direct to Trade Screen
      setTimeout(() => {
        setOrderStatusMessage(null);
        setActiveScreen('trade');
        setOrderSL('');
        setOrderTP('');
      }, 1500);

    } catch (err: any) {
      setOrderStatusMessage({ text: err.message || "Order placement failed.", type: 'error' });
    }
  };

  // One-Click Trading execution logic
  const handleOneClickTrade = async (side: 'BUY' | 'SELL') => {
    const size = parseFloat(oneClickLots);
    if (isNaN(size) || size <= 0) {
      alert("Invalid Volume lots format.");
      return;
    }

    const currentSym = symbolsData.find(s => s.symbol.replace('/', '') === selectedSymbol);
    const livePrice = currentSym ? currentSym.price : 1.1360;

    try {
      if (!authUser) {
        // Guest user: place demo position
        const isYen = selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB');
        const rawSpread = isYen ? 0.025 : 0.00015;
        const entryPrice = side === 'BUY' ? livePrice + rawSpread : livePrice;

        const newPos = {
          id: 'demo_' + Math.random().toString(36).substr(2, 9),
          symbol: selectedSymbol,
          side: side,
          size: size,
          entryPrice: entryPrice,
          currentPrice: entryPrice,
          pnl: 0,
          date: new Date().toLocaleDateString()
        };

        setDemoPositions(prev => [...prev, newPos]);
        setOneClickSuccess(`One-Click ${side} ${size} lots placed!`);
        setTimeout(() => setOneClickSuccess(null), 2500);
      } else {
        // Authenticated user: call backend order
        const isYen = selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB');
        const rawSpread = isYen ? 0.025 : 0.00015;
        const limitPrice = side === 'BUY' ? livePrice + rawSpread : livePrice;

        await onPlaceOrder({
          symbol: selectedSymbol,
          side: side,
          size: size,
          type: 'MARKET',
          limitPrice: limitPrice
        });

        setOneClickSuccess(`One-Click ${side} ${size} lots placed!`);
        setTimeout(() => setOneClickSuccess(null), 2500);
      }
    } catch (err: any) {
      alert(err.message || "Quick Trade placement failed.");
    }
  };

  // Position liquidation close execution
  const handleCloseActivePosition = async () => {
    if (!positionToClose) return;

    try {
      await onClosePosition(positionToClose.id);
      setActiveScreen('trade');
      setPositionToClose(null);
    } catch (err) {
      alert("Error closing position. Verify network state.");
    }
  };

  // Demo floating PnL calculation based on symbolsData ticks
  const demoPnl = useMemo(() => {
    return demoPositions.reduce((acc, pos) => {
      const currentSym = symbolsData.find(s => s.symbol.replace('/', '') === pos.symbol);
      const currentPrice = currentSym ? currentSym.price : pos.entryPrice;
      const diff = pos.side === 'BUY' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
      // Contract size is 100,000 for standard lots
      const rawProfit = diff * pos.size * 100000;
      return acc + rawProfit;
    }, 0);
  }, [demoPositions, symbolsData]);

  // Compute live totals dynamically for either real backend wallet or local demo
  const liveEquity = useMemo(() => {
    if (authUser) {
      if (!wallet) return 0;
      const floatingPnl = positions.reduce((acc, p) => acc + (p.pnl || 0), 0);
      return wallet.balance + floatingPnl;
    } else {
      return demoBalance + demoPnl;
    }
  }, [authUser, wallet, positions, demoBalance, demoPnl]);

  const liveFreeMargin = useMemo(() => {
    if (authUser) {
      if (!wallet) return 0;
      const floatingPnl = positions.reduce((acc, p) => acc + (p.pnl || 0), 0);
      const marginUsed = positions.reduce((acc, p) => acc + (p.size * 1000), 0);
      return (wallet.balance + floatingPnl) - marginUsed;
    } else {
      const marginUsed = demoPositions.reduce((acc, p) => acc + (p.size * 1000), 0);
      return (demoBalance + demoPnl) - marginUsed;
    }
  }, [authUser, wallet, positions, demoPositions, demoBalance, demoPnl]);

  const marginLevelPercent = useMemo(() => {
    const marginUsed = authUser
      ? positions.reduce((acc, p) => acc + (p.size * 1000), 0)
      : demoPositions.reduce((acc, p) => acc + (p.size * 1000), 0);
    if (marginUsed === 0) return 0;
    return (liveEquity / marginUsed) * 100;
  }, [authUser, positions, demoPositions, liveEquity]);

  // Map active positions list (bridges live prices for the demo list)
  const activePositions = useMemo(() => {
    if (authUser) return positions;
    return demoPositions.map(pos => {
      const currentSym = symbolsData.find(s => s.symbol.replace('/', '') === pos.symbol);
      const currentPrice = currentSym ? currentSym.price : pos.entryPrice;
      const posPnl = pos.side === 'BUY'
        ? (currentPrice - pos.entryPrice) * pos.size * 100000
        : (pos.entryPrice - currentPrice) * pos.size * 100000;
      return {
        ...pos,
        currentPrice,
        pnl: posPnl
      };
    });
  }, [authUser, positions, demoPositions, symbolsData]);

  const displayWallet = useMemo(() => {
    if (authUser) {
      return {
        balance: wallet?.balance ?? 0,
        pnl: wallet?.pnl ?? 0
      };
    } else {
      return {
        balance: demoBalance,
        pnl: demoPnl
      };
    }
  }, [authUser, wallet, demoBalance, demoPnl]);

  const displayHistory = useMemo(() => {
    if (authUser) {
      return closedHistory || [];
    } else {
      return demoHistory;
    }
  }, [authUser, closedHistory, demoHistory]);

  const historyStats = useMemo(() => {
    let netProfit = 0;
    let deposits = 100000; // Default demo deposit
    let withdrawals = 0;

    displayHistory.forEach(item => {
      if (item.type === 'DEPOSIT') {
        deposits += item.amount;
      } else if (item.type === 'WITHDRAWAL') {
        withdrawals += item.amount;
      } else {
        netProfit += (item.amount || item.pnl || 0);
      }
    });

    return { netProfit, deposits, withdrawals };
  }, [displayHistory]);

  const selectedSymbolData = useMemo(() => {
    return symbolsData.find(s => s.symbol.replace('/', '') === selectedSymbol) ||
      defaultMockSymbols.find(s => s.symbol.replace('/', '') === selectedSymbol);
  }, [selectedSymbol, symbolsData, defaultMockSymbols]);

  return (
    <div className={`app-container flex flex-col items-center justify-center min-h-dvh relative font-sans select-none overflow-hidden ${isLightMode ? 'bg-[#F2F2F7] light-theme' : 'bg-black'}`}>

      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Simulator Control Panel (Header options) */}
      <div className="desktop-only-control-panel hidden w-full max-w-sm items-center justify-between mb-3 px-1 text-zinc-400 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-zinc-200">MT5 Web Terminal simulator</span>
        </div>
        {onBackToDesktop && (
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDesktop}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold text-xs"
            >
              <Terminal className="w-3.5 h-3.5" /> Portal View
            </button>
          </div>
        )}
      </div>

      {/* Main Mock Phone Shell */}
      <div className={`phone-shell w-full h-dvh max-h-dvh relative overflow-hidden flex flex-col ${isLightMode ? 'bg-[#FFFFFF] text-[#000000]' : 'bg-black text-white'}`}>

        {/* Dynamic Notch / Island on phone screen (Only visible on desktop/mockup view) */}
        <div className="desktop-only-notch hidden absolute top-0 inset-x-0 h-8 bg-[#000000] z-50 items-center justify-between px-6 pointer-events-none">
          <span className="text-[10px] font-bold font-mono tracking-tighter">1:56</span>
          <div className="w-24 h-4 bg-black rounded-full mx-auto flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 ml-4" />
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold font-mono">
            <span>5G</span>
            <div className="w-4 h-2 border border-white rounded-sm flex items-center p-0.5"><div className="w-full h-full bg-white rounded-sm" /></div>
          </div>
        </div>

        {/* ---------------- DRAWERS & GLOBAL OVERLAYS ---------------- */}

        {/* Left Side Hamburger Drawer */}
        {isDrawerOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex animate-fade-in text-left">
            <div className="w-4/5 max-w-[300px] h-full flex flex-col justify-between p-4 shadow-2xl relative bg-[var(--theme-secondary-background)] border-r border-[var(--theme-border)]">
              {/* Close button */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute top-4 right-4 text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                {/* Header info */}
                <div
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveScreen(authUser ? 'trade' : 'brokers');
                  }}
                  className="pt-6 flex items-start gap-3 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--theme-primary-blue)] text-white flex items-center justify-center font-bold text-xl relative">
                    <User className="w-6 h-6" />
                    <span className="absolute -bottom-1 -right-1 bg-[var(--theme-success)] rounded-full p-1 border border-[var(--theme-secondary-background)]">
                      <Plus className="w-2.5 h-2.5 text-white" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    {authUser ? (
                      <>
                        <h4 className="font-bold text-sm max-w-[170px] truncate leading-none pt-1 text-[var(--theme-primary-text)]">{authUser.fullName}</h4>
                        <p className="text-[10px] font-mono text-[var(--theme-secondary-text)]">Server: {brokerServer}</p>
                        <p className="text-[10px] text-[var(--theme-primary-blue)] font-black uppercase tracking-wider">Leverage 1:500</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-sm leading-tight text-[var(--theme-primary-text)]">Login to existing account or open demo</h4>
                        <button className="mt-1 px-3 py-1 bg-[var(--theme-primary-blue)] hover:opacity-90 text-white rounded-full font-bold text-[10px] tracking-wide uppercase transition-colors">
                          Get started
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <hr className="border-[var(--theme-border)]" />

                {/* Main links list */}
                <nav className="space-y-1">
                  {[
                    { id: 'trade', icon: TrendingUp, label: 'Trade' },
                    { id: 'news', icon: BookOpen, label: 'News', badge: newsList.length ? 'New' : '' },
                    { id: 'mailbox', icon: Mail, label: 'Mailbox', badge: '8' },
                    { id: 'journal', icon: Terminal, label: 'Journal' },
                    { id: 'settings', icon: Settings, label: 'Settings' },
                    { id: 'calendar', icon: Calendar, label: 'Economic calendar', ad: true },
                    { id: 'community', icon: UserPlus, label: 'Traders Community' },
                    { id: 'mql5', icon: Send, label: 'MQL5 Algo Trading' },
                    { id: 'guide', icon: HelpCircle, label: 'User guide' },
                    { id: 'about', icon: Info, label: 'About' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsDrawerOpen(false);
                        if (item.id === 'trade') setActiveScreen('trade');
                        else if (item.id === 'mailbox') setActiveScreen('messages');
                        else if (item.id === 'news') setIsNewsOpen(true);
                        else if (item.id === 'calendar') setIsCalendarOpen(true);
                        else if (item.id === 'journal') setIsJournalOpen(true);
                        else if (item.id === 'about') setActiveScreen('quotes'); // fallback, or show version modal
                        else if (item.id === 'settings') setActiveScreen('settings');
                        else {
                          alert(`${item.label} screen simulation`);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-xs font-semibold hover:bg-[var(--theme-border)]/40 text-[var(--theme-primary-text)]"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-[var(--theme-secondary-text)]" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${item.id === 'mailbox' ? 'bg-[var(--theme-danger)] text-white' : 'bg-[var(--theme-primary-blue)]/20 text-[var(--theme-primary-blue)]'}`}>
                          {item.badge}
                        </span>
                      )}
                      {item.ad && (
                        <span className="px-1.5 py-0.2 bg-[var(--theme-primary-blue)]/20 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/30 rounded-full text-[8px] font-bold scale-90">
                          Ads
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Drawer footer (secure logout only) */}
              <div className="space-y-3 pt-4 border-t border-[var(--theme-border)]">
                {authUser && (
                  <button
                    onClick={() => {
                      if (confirm("Disconnect MT5 account session?")) {
                        logout();
                        setIsDrawerOpen(false);
                        setActiveScreen('quotes');
                      }
                    }}
                    className="w-full py-2 border border-[var(--theme-danger)]/30 bg-[var(--theme-danger)]/5 text-[var(--theme-danger)] hover:bg-[var(--theme-danger)]/15 font-bold rounded-lg text-xs transition-colors"
                  >
                    Disconnect Server
                  </button>
                )}
              </div>
            </div>

            {/* Click to close backdrop */}
            <div className="flex-1 h-full" onClick={() => setIsDrawerOpen(false)} />
          </div>
        )}

        {/* Dynamic News overlay inside simulator */}
        {isNewsOpen && (
          <div className="absolute inset-0 top-8 z-40 flex flex-col animate-slide-up text-left bg-[var(--theme-background)] text-[var(--theme-primary-text)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <h3 className="font-bold text-sm flex items-center gap-2 text-[var(--theme-primary-text)]"><BookOpen className="w-4 h-4 text-[var(--theme-success)]" /> Market News Feed</h3>
              <button onClick={() => setIsNewsOpen(false)} className="transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><X className="w-5 h-5" /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
              {newsList.map((n, idx) => (
                <div key={idx} className="border border-[var(--theme-border)] rounded-[18px] p-4 space-y-2 bg-[var(--theme-card-background)] shadow-[var(--theme-card-shadow)] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-[var(--theme-success)] uppercase tracking-widest bg-[var(--theme-success)]/10 px-2 py-0.5 rounded border border-[var(--theme-success)]/20">{n.category || 'MARKETS'}</span>
                    <span className="text-[9px] font-mono text-[var(--theme-secondary-text)]">{new Date().toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-xs leading-snug text-[var(--theme-primary-text)]">{n.title || n.headline}</h4>
                  <p className="text-[10px] leading-normal text-[var(--theme-secondary-text)]">{n.summary || n.content}</p>
                </div>
              ))}
              {newsList.length === 0 && (
                <div className="text-center py-10 text-xs text-[var(--theme-muted-text)]">No active news feeds streamed.</div>
              )}
            </main>
          </div>
        )}

        {/* Dynamic Economic Calendar overlay */}
        {isCalendarOpen && (
          <div className="absolute inset-0 top-8 z-40 flex flex-col animate-slide-up text-left bg-[var(--theme-background)] text-[var(--theme-primary-text)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <h3 className="font-bold text-sm flex items-center gap-2 text-[var(--theme-primary-text)]"><Calendar className="w-4 h-4 text-[var(--theme-primary-blue)]" /> Economic Calendar</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><X className="w-5 h-5" /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {calendarList.map((event, idx) => (
                <div key={idx} className="border border-[var(--theme-border)] rounded-[18px] p-4 flex items-center justify-between gap-4 bg-[var(--theme-card-background)] shadow-[var(--theme-card-shadow)] transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-[var(--theme-primary-text)]">{event.time || '14:30'}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded border bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] border-[var(--theme-border)]">{event.currency || 'USD'}</span>
                    </div>
                    <p className="text-[10px] font-bold leading-tight text-[var(--theme-primary-text)]">{event.event}</p>
                  </div>
                  <div className="text-right space-y-0.5 font-mono text-[9px]">
                    <div><span className="text-[9px] text-[var(--theme-secondary-text)]">Actual: </span><span className="font-bold text-[var(--theme-primary-text)]">{event.actual || '-'}</span></div>
                    <div><span className="text-[9px] text-[var(--theme-secondary-text)]">Forecast: </span><span className="text-[var(--theme-secondary-text)]">{event.forecast || '-'}</span></div>
                    <div><span className="text-[9px] text-[var(--theme-secondary-text)]">Previous: </span><span className="text-[var(--theme-secondary-text)]">{event.previous || '-'}</span></div>
                  </div>
                </div>
              ))}
              {calendarList.length === 0 && (
                <div className="text-center py-10 text-xs font-semibold text-[var(--theme-muted-text)]">No upcoming events listed.</div>
              )}
            </main>
          </div>
        )}

        {/* Dynamic Journal Console log overlay */}
        {isJournalOpen && (
          <div className="absolute inset-0 top-8 z-40 flex flex-col animate-slide-up text-left bg-[var(--theme-background)] text-[var(--theme-primary-text)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <h3 className="font-bold text-sm flex items-center gap-2 text-[var(--theme-primary-text)]"><Terminal className="w-4 h-4 text-[var(--theme-primary-blue)]" /> Terminal System Logs</h3>
              <button onClick={() => setIsJournalOpen(false)} className="transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><X className="w-5 h-5" /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 font-mono text-[9px] space-y-2 bg-[var(--theme-secondary-background)] text-[var(--theme-primary-text)]">
              <div>[system] Initiating Forex Factory trading engine modules...</div>
              <div>[system] Connecting to primary WebSocket host: ws://localhost:8000</div>
              <div>[socket] WebSocket stream handshaked. Session active.</div>
              <div>[price-engine] Standard quotes loaded successfully.</div>
              {authUser && <div>[account] Linked client: {authUser.fullName} (ID: {authUser.id})</div>}
              <div>[analytics] Spreads raw benchmarked at Institutional spreads limits.</div>
              <div>[system] All simulator systems running normally. Ready.</div>
            </main>
          </div>
        )}

        {/* ---------------- SETTINGS SCREEN ---------------- */}
        {activeScreen === 'settings' && (
          <div className="flex-1 flex flex-col notch-padding overflow-y-auto bg-[var(--theme-secondary-background)]">
            <header className="h-12 border-b flex items-center justify-between px-4 sticky top-0 backdrop-blur z-10 bg-[var(--theme-secondary-background)]/90 border-[var(--theme-border)]">
              <button onClick={() => setIsDrawerOpen(true)} className="p-1 text-[var(--theme-primary-blue)] hover:opacity-85">
                <Menu className="w-5 h-5" />
              </button>
              <h3 className="font-extrabold text-sm text-[var(--theme-primary-text)]">Settings</h3>
              <div className="w-6" />
            </header>

            <div className="p-4 space-y-6">
              {/* Profile Card */}
              <div className="rounded-[18px] p-4 flex items-center gap-4 bg-[var(--theme-card-background)] border border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                <div className="w-14 h-14 rounded-full bg-[var(--theme-primary-blue)]/10 flex items-center justify-center text-[var(--theme-primary-blue)] font-bold text-xl border border-[var(--theme-primary-blue)]/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base leading-tight text-[var(--theme-primary-text)]">{authUser?.fullName || 'Demo Account'}</h4>
                  <p className="text-[10px] font-mono mt-0.5 text-[var(--theme-secondary-text)]">{authUser?.email || 'No email attached'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-[var(--theme-success)]/15 border border-[var(--theme-success)]/30 text-[var(--theme-success)] text-[8px] font-black uppercase rounded-full">
                    {authUser ? 'Live Trading' : 'Simulated'}
                  </span>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest px-1 text-[var(--theme-secondary-text)]">Base Currency</p>
                  <div className="grid grid-cols-4 gap-1 mt-2">
                    {(['INR', 'USD', 'USDT', 'EUR', 'GBP', 'BTC', 'ETH'] as const).map(cur => (
                      <button
                        key={cur}
                        onClick={() => { handleSetCurrency(cur); }}
                        className={`py-2 rounded-lg text-[9px] font-extrabold transition-all border ${preferredCurrency === cur
                          ? 'bg-[var(--theme-primary-blue)] text-white border-[var(--theme-primary-blue)]'
                          : 'bg-[var(--theme-background)] text-[var(--theme-secondary-text)] border-[var(--theme-border)] hover:border-[var(--theme-secondary-text)]'
                          }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveScreen('deposit')}
                    className="flex-1 py-3 rounded-[18px] text-[10px] font-extrabold transition-all bg-[var(--theme-success)]/15 border border-[var(--theme-success)]/30 text-[var(--theme-success)] hover:bg-[var(--theme-success)]/25"
                  >
                    ⬆ Deposit
                  </button>
                  <button
                    onClick={() => setActiveScreen('withdraw')}
                    className="flex-1 py-3 rounded-[18px] text-[10px] font-extrabold transition-all bg-[var(--theme-secondary-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]"
                  >
                    ⬇ Withdraw
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest px-1 text-[var(--theme-secondary-text)]">Preferences</p>
                <div className="rounded-[18px] divide-y bg-[var(--theme-card-background)] border border-[var(--theme-border)] divide-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">

                  {/* Theme Toggle */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-[var(--theme-primary-text)]">Light Theme</h5>
                        <p className="text-[10px] font-sans text-[var(--theme-secondary-text)]">Toggle bright visuals (Beta)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsLightMode(!isLightMode)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${isLightMode ? 'bg-[var(--theme-success)]' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isLightMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* One Click Trading */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-[var(--theme-primary-text)]">One-Click Trading</h5>
                        <p className="text-[10px] font-sans text-[var(--theme-secondary-text)]">Bypass confirmation screens</p>
                      </div>
                    </div>
                    <button className="w-11 h-6 rounded-full relative transition-colors bg-[var(--theme-primary-blue)]">
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform translate-x-5" />
                    </button>
                  </div>

                  {/* Sounds */}
                  <div className="p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)]">
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-[var(--theme-primary-text)]">Order Sounds</h5>
                        <p className="text-[10px] font-sans text-[var(--theme-secondary-text)]">Audio cues on fills</p>
                      </div>
                    </div>
                    <button className="w-11 h-6 rounded-full relative transition-colors bg-[var(--theme-border)]">
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform translate-x-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Server Info */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest px-1 text-[var(--theme-secondary-text)]">Network</p>
                <div className="rounded-[18px] p-4 flex items-center justify-between bg-[var(--theme-card-background)] border border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-[var(--theme-primary-text)]">Ping: <span className="text-[var(--theme-success)]">12ms</span></p>
                    <p className="font-mono text-[9px] text-[var(--theme-secondary-text)]">Host: {brokerServer}</p>
                  </div>
                  <RefreshCw className="w-4 h-4 text-[var(--theme-secondary-text)]" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---------------- PRIMARY SCREENS VIEWPORT ---------------- */}

        {/* SCREEN 1: QUOTES VIEW */}
        {activeScreen === 'quotes' && (
          <div className="flex-1 flex flex-col notch-padding overflow-hidden min-h-0">
            {/* Quotes Header */}
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <div className="flex items-center w-[60px]">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1 rounded transition text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-md font-bold flex-1 text-center text-[var(--theme-primary-text)]">Quotes</h2>
              <div className="flex items-center justify-end gap-3 w-[60px]">
                <button
                  onClick={() => {
                    setIsDetailedMode(!isDetailedMode);
                  }}
                  className={`p-1 rounded transition ${isDetailedMode ? 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)]' : 'text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]'}`}
                  title="Toggle Simple/Detailed mode"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveScreen('brokers')}
                  className="p-1 transition text-[var(--theme-primary-text)] hover:opacity-85"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Symbols List */}
            <div className="flex-1 overflow-y-auto divide-y bg-[var(--theme-background)] divide-[var(--theme-border)]">
              {symbolsData.map((sym) => {
                const isYen = sym.symbol.includes('JPY') || sym.symbol.includes('RUB');
                const parsedPrice = parseMT5Price(sym.price);

                // Spread & L/H price mocks
                const spread = calculateSpread(sym.symbol, sym.price);
                const rawSpread = isYen ? 0.025 : 0.00015;
                const askPrice = sym.price + rawSpread;
                const parsedAsk = parseMT5Price(askPrice);

                const baseForHighLow = sym.openPrice ?? sym.open ?? sym.price;
                const lowPrice = sym.low ?? (baseForHighLow * 0.998);
                const highPrice = sym.high ?? (baseForHighLow * 1.002);

                const bidFlash = tickDirections[sym.symbol]?.bid;
                const askFlash = tickDirections[sym.symbol]?.ask;

                // In premium theme, colors flash softly on backgrounds using success/danger/primaryBlue tokens.
                const bidFlashClass = bidFlash === 'up'
                  ? 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] transition-colors duration-150 rounded px-1'
                  : bidFlash === 'down'
                    ? 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] transition-colors duration-150 rounded px-1'
                    : 'text-[var(--theme-primary-text)]';

                const askFlashClass = askFlash === 'up'
                  ? 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] transition-colors duration-150 rounded px-1'
                  : askFlash === 'down'
                    ? 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] transition-colors duration-150 rounded px-1'
                    : 'text-[var(--theme-primary-text)]';

                return (
                  <div
                    key={sym.symbol}
                    onClick={() => {
                      setQuoteMenuSymbol(sym);
                    }}
                    className="p-4 flex items-center justify-between cursor-pointer transition-colors text-left bg-[var(--theme-card-background)] hover:bg-[#F9FAFB] active:bg-[var(--theme-secondary-background)] border-b border-[var(--theme-border)]"
                  >
                    {/* Pair Info */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xl tracking-tight text-[var(--theme-primary-text)]">{sym.symbol.replace('/', '')}</h4>
                      <p className="text-[12px] font-sans text-[var(--theme-secondary-text)]">11:13:05</p>
                      {isDetailedMode && (
                        <div className="flex items-center gap-1.5 text-[11px] font-sans text-[var(--theme-secondary-text)]">
                          <span>Spread: {spread}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Columns */}
                    <div className="flex items-center gap-5 text-right font-sans">
                      {/* Bid Column */}
                      <div className="space-y-1">
                        <div className={`px-2 py-1.5 rounded text-lg font-semibold flex items-end gap-[3px] ${bidFlashClass}`}>
                          <span className="text-[18px] leading-none">{parsedPrice.prefix}</span>
                          <span className="text-[34px] font-black leading-none">{parsedPrice.big}</span>
                          <span className="text-[16px] align-super font-semibold leading-none">{parsedPrice.pipette}</span>
                        </div>
                        {isDetailedMode && (
                          <div className="text-[10px] text-[var(--theme-secondary-text)]">L: {lowPrice.toFixed(isYen ? 2 : 5)}</div>
                        )}
                      </div>

                      {/* Ask Column */}
                      <div className="space-y-1">
                        <div className={`px-2 py-1.5 rounded text-lg font-semibold flex items-end gap-[3px] ${askFlashClass}`}>
                          <span className="text-[18px] leading-none">{parsedAsk.prefix}</span>
                          <span className="text-[34px] font-black leading-none">{parsedAsk.big}</span>
                          <span className="text-[16px] align-super font-semibold leading-none">{parsedAsk.pipette}</span>
                        </div>
                        {isDetailedMode && (
                          <div className="text-[10px] text-[var(--theme-secondary-text)]">H: {highPrice.toFixed(isYen ? 2 : 5)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom menu popup sheet for quotes pair */}
            {quoteMenuSymbol && (
              <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end animate-fade-in">
                <div
                  className="absolute inset-0"
                  onClick={() => setQuoteMenuSymbol(null)}
                />
                <div className="border-t rounded-t-3xl p-4 space-y-1.5 z-10 text-left animate-slide-up bg-[var(--theme-background)] border-[var(--theme-border)]">
                  <h3 className="font-black text-sm border-b pb-2 mb-2 flex items-center justify-between text-[var(--theme-primary-text)] border-[var(--theme-border)]">
                    <span>{quoteMenuSymbol.symbol.replace('/', '')} options</span>
                    <button
                      onClick={() => setQuoteMenuSymbol(null)}
                      className="text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </h3>
                  {[
                    {
                      label: 'New order', action: () => {
                        setSelectedSymbol(quoteMenuSymbol.symbol.replace('/', ''));
                        setQuoteMenuSymbol(null);
                        if (!authUser) {
                          setActiveScreen('brokers');
                        } else {
                          setActiveScreen('order-entry');
                        }
                      }
                    },
                    {
                      label: 'Chart', action: () => {
                        setSelectedSymbol(quoteMenuSymbol.symbol.replace('/', ''));
                        setQuoteMenuSymbol(null);
                        setActiveScreen('charts');
                      }
                    },
                    {
                      label: 'Properties', action: () => {
                        alert(`Symbol: ${quoteMenuSymbol.symbol}\nName: ${quoteMenuSymbol.name}\nCategory: ${quoteMenuSymbol.category}`);
                        setQuoteMenuSymbol(null);
                      }
                    },
                    { label: 'Cancel', action: () => setQuoteMenuSymbol(null), style: 'text-[var(--theme-secondary-text)]' }
                  ].map((opt, i) => (
                    <button
                      key={i}
                      onClick={opt.action}
                      className={`w-full py-3.5 px-3 rounded-[14px] text-xs font-bold transition-colors hover:bg-[var(--theme-secondary-background)] text-[var(--theme-primary-text)] ${opt.style || ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 2: LIVE CHARTS VIEW */}
        {activeScreen === 'charts' && (
          <div
            style={isChartLandscape ? {
              transform: 'rotate(90deg)',
              transformOrigin: 'center',
              width: '100vh',
              height: '100vw',
              position: 'fixed' as const,
              top: '50%',
              left: '50%',
              marginTop: '-50vw',
              marginLeft: '-50vh',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column' as const,
              backgroundColor: 'var(--theme-background)'
            } : {}}
            className="flex-1 flex flex-col notch-padding overflow-hidden h-full"
          >
            {/* Charts Header - Improved */}
            <header className="h-14 border-b flex items-center justify-between px-3 flex-shrink-0 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 rounded-lg transition-all text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-wide text-[var(--theme-primary-text)]">{selectedSymbol}</span>
                    <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-md border bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] border-[var(--theme-border)]">{chartTimeframe}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-[var(--theme-secondary-text)]">{selectedSymbolData?.name || 'Spot currency pair'}</span>
                    {selectedSymbolData && (
                      <span className={`text-[9px] font-bold ${(selectedSymbolData.price || 0) >= (selectedSymbolData.openPrice ?? selectedSymbolData.open ?? selectedSymbolData.price ?? 0) ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                        {(selectedSymbolData.price || 0).toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 3 : 5)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Timeframe Pills */}
                <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-[var(--theme-secondary-background)] border border-[var(--theme-border)]">
                  {['M5', 'M15', 'H1', 'H4', 'D1'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition-all ${chartTimeframe === tf
                        ? 'bg-[var(--theme-primary-blue)] text-white shadow-sm'
                        : 'text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsChartLandscape(!isChartLandscape)}
                  className={`p-1.5 rounded-lg transition-all ${isChartLandscape
                    ? 'bg-[var(--theme-primary-blue)]/15 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/30'
                    : 'text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40'
                    }`}
                  title="Rotate Chart"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (!authUser) {
                      setActiveScreen('brokers');
                    } else {
                      setActiveScreen('order-entry');
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[var(--theme-primary-blue)]/15 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/25 hover:bg-[var(--theme-primary-blue)]/25 transition-all"
                  title="New order"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Live Chart Drawing Canvas Area */}
            <div
              className="flex-1 w-full relative select-none cursor-crosshair overflow-hidden bg-[var(--theme-background)]"
              style={{ touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <canvas ref={canvasRef} className="w-full h-full block" />

              {/* One-Click Trading Panel - Improved and Bottom Positioned */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center backdrop-blur-xl rounded-[18px] p-2 gap-3 select-none z-10 w-[90%] max-w-[340px] justify-between bg-[var(--theme-card-background)] border border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                {/* Sell Box */}
                <button
                  onClick={() => handleOneClickTrade('SELL')}
                  className="flex-1 min-w-[100px] py-2.5 bg-[var(--theme-danger)] hover:opacity-95 text-white font-extrabold rounded-[16px] flex flex-col items-center leading-none justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-[var(--theme-danger)]/15 border border-[var(--theme-danger)]/20"
                >
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest opacity-90 mb-1">SELL</span>
                  <span className="text-[14px] font-black tabular-nums">
                    {selectedSymbolData ? (selectedSymbolData.price || 0).toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5) : '0.00000'}
                  </span>
                </button>

                {/* Lot size input */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-[var(--theme-secondary-text)]">Lots</span>
                  <input
                    type="number"
                    step="0.01"
                    value={oneClickLots}
                    onChange={(e) => setOneClickLots(e.target.value)}
                    className="w-16 text-center font-black rounded-lg py-1.5 focus:outline-none focus:border-[var(--theme-primary-blue)] text-[12px] bg-[var(--theme-secondary-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)]"
                  />
                </div>

                {/* Buy Box */}
                <button
                  onClick={() => handleOneClickTrade('BUY')}
                  className="flex-1 min-w-[100px] py-2.5 bg-[var(--theme-success)] hover:opacity-95 text-white font-extrabold rounded-[16px] flex flex-col items-center leading-none justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-[var(--theme-success)]/15 border border-[var(--theme-success)]/20"
                >
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest opacity-90 mb-1">BUY</span>
                  <span className="text-[14px] font-black tabular-nums">
                    {selectedSymbolData ? ((selectedSymbolData.price || 0) + (selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 0.025 : 0.00015)).toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5) : '0.00000'}
                  </span>
                </button>
              </div>

              {/* One-Click success overlay */}
              {oneClickSuccess && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-[var(--theme-primary-blue)] text-white font-bold text-[9px] px-3.5 py-1.5 rounded-full shadow-2xl animate-fade-in z-20 font-sans tracking-wide">
                  {oneClickSuccess}
                </div>
              )}

              {/* Float OHLC dashboard Overlay - top left, glassmorphism */}
              <div className="absolute top-3 left-3 px-2.5 py-2 rounded-xl text-[8px] font-mono pointer-events-none text-left shadow-xl z-10 bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)]">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <span className="text-[var(--theme-secondary-text)]">O</span><span className="tabular-nums text-[var(--theme-primary-text)]">{(chartData[selectedSymbol]?.slice(-1)[0]?.open ?? 1.1360).toFixed(5)}</span>
                  <span className="text-[var(--theme-secondary-text)]">H</span><span className="text-[var(--theme-success)] tabular-nums">{(chartData[selectedSymbol]?.slice(-1)[0]?.high ?? 1.1360).toFixed(5)}</span>
                  <span className="text-[var(--theme-secondary-text)]">L</span><span className="text-[var(--theme-danger)] tabular-nums">{(chartData[selectedSymbol]?.slice(-1)[0]?.low ?? 1.1360).toFixed(5)}</span>
                  <span className="text-[var(--theme-secondary-text)]">C</span><span className="tabular-nums text-[var(--theme-primary-text)]">{(chartData[selectedSymbol]?.slice(-1)[0]?.close ?? 1.1360).toFixed(5)}</span>
                </div>
              </div>

              {/* Canvas chart zoom adjustments controls - improved */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-10">
                <button
                  onClick={() => setCandleWidth(prev => Math.min(18, prev + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition-all active:scale-95 bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:border-[var(--theme-secondary-text)] shadow-sm"
                >
                  +
                </button>
                <button
                  onClick={() => setCandleWidth(prev => Math.max(3, prev - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition-all active:scale-95 bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:border-[var(--theme-secondary-text)] shadow-sm"
                >
                  −
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: ACCOUNT BALANCE & OPEN POSITIONS VIEW */}
        {activeScreen === 'trade' && (
          <div
            style={isTradeLandscape ? {
              transform: 'rotate(90deg)',
              transformOrigin: 'center',
              width: '100vh',
              height: '100vw',
              position: 'fixed' as const,
              top: '50%',
              left: '50%',
              marginTop: '-50vw',
              marginLeft: '-50vh',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column' as const,
              backgroundColor: 'var(--theme-background)'
            } : {}}
            className="flex-1 flex flex-col notch-padding overflow-hidden min-h-0"
          >
            {/* Trade Header - with Deposit/Withdraw */}
            <header className="h-14 border-b flex items-center justify-between px-3 shrink-0 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 rounded-lg transition-all text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
                <div className="leading-none">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-extrabold text-[var(--theme-primary-text)]">Trade</h2>
                    <span className={`text-[7px] px-1.5 py-0.5 font-black uppercase tracking-widest rounded-full border ${authUser
                      ? 'bg-[var(--theme-success)]/10 border-[var(--theme-success)]/25 text-[var(--theme-success)]'
                      : 'bg-[var(--theme-primary-blue)]/10 border-[var(--theme-primary-blue)]/25 text-[var(--theme-primary-blue)]'
                      }`}>
                      {authUser ? 'LIVE' : 'DEMO'}
                    </span>
                    <span className="text-[7px] px-1.5 py-0.5 font-black uppercase tracking-widest rounded-full border border-[var(--theme-border)] text-[var(--theme-secondary-text)] bg-[var(--theme-secondary-background)]">
                      {preferredCurrency}
                    </span>
                  </div>
                  <p className="text-[8px] mt-0.5 font-mono text-[var(--theme-secondary-text)]">{brokerServer}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveScreen('order-entry')}
                  className="p-1.5 rounded-lg bg-[var(--theme-primary-blue)]/15 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/25 hover:bg-[var(--theme-primary-blue)]/25 transition-all"
                  title="New order placement"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Main Area */}
            {!isTradeLandscape ? (
              /* PORTRAIT LAYOUT */
              <div className="flex-1 overflow-y-auto text-left bg-[var(--theme-background)]">
                <div className="flex flex-col h-full">
                  {/* Real-time Account Balance Box */}
                  <div className="p-4 border-b space-y-2 flex flex-col bg-[var(--theme-background)] border-[var(--theme-border)]">
                    <div className="flex flex-col gap-2">
                      <span className="text-[12px] text-[var(--theme-secondary-text)] font-bold uppercase tracking-wider">{authUser ? 'Live floating profit' : 'Demo floating profit'}</span>
                      <span className={`text-2xl font-black font-mono ${displayWallet.pnl >= 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                        {displayWallet.pnl >= 0 ? '+' : ''}{toCurrency(displayWallet.pnl ?? 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[12px] border-t pt-3 font-mono text-[var(--theme-secondary-text)] border-[var(--theme-border)]">
                      <div>Balance: <span className="font-bold text-[var(--theme-primary-text)]">{toCurrency(displayWallet.balance ?? 0)}</span></div>
                      <div>Equity: <span className="font-bold text-[var(--theme-primary-text)]">{toCurrency(liveEquity ?? 0)}</span></div>
                      <div>Free margin: <span className="font-bold text-[var(--theme-primary-text)]">{toCurrency(liveFreeMargin ?? 0)}</span></div>
                      <div>Margin level (%): <span className="font-bold text-[var(--theme-primary-text)]">{(marginLevelPercent ?? 0).toFixed(2)}%</span></div>
                    </div>
                  </div>

                  {/* Open Positions list header */}
                  <div className="px-4 py-3 border-b text-[10px] font-black uppercase tracking-widest flex justify-between items-center bg-[var(--theme-secondary-background)] border-[var(--theme-border)] text-[var(--theme-secondary-text)]">
                    <span className="text-[11px]">Positions List ({activePositions.length})</span>
                    {!authUser && <span className="text-[8px] border px-1.5 py-0.2 rounded-full font-bold uppercase bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] border-[var(--theme-primary-blue)]/30">Demo Active</span>}
                  </div>

                  {/* Positions */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--theme-border)]">
                    {activePositions.map((pos) => {
                      const isBuy = pos.side === 'BUY';
                      return (
                        <div
                          key={pos.id}
                          onClick={() => setPositionToClose(pos)}
                          className="p-4 flex items-center justify-between cursor-pointer transition-colors bg-[var(--theme-card-background)] hover:bg-[#F9FAFB] active:bg-[var(--theme-secondary-background)] border-b border-[var(--theme-border)]"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-[var(--theme-primary-text)]">{pos.symbol.replace('/', '')}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isBuy ? 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/25' : 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] border border-[var(--theme-danger)]/25'}`}>
                                {pos.side} {pos.size.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[var(--theme-secondary-text)]">
                              {pos.entryPrice.toFixed(5)} → {pos.currentPrice.toFixed(5)}
                            </div>
                          </div>

                          <div className={`font-mono text-xs font-black ${pos.pnl >= 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                            {pos.pnl >= 0 ? '+' : ''}{toCurrency(pos.pnl)}
                          </div>
                        </div>
                      );
                    })}

                    {activePositions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-zinc-650 font-bold space-y-4">
                        <ShieldAlert className="w-10 h-10 opacity-30" />
                        <span className="text-xs">No active open positions.</span>
                        <button
                          onClick={() => setActiveScreen('deposit')}
                          className="mt-2 px-5 py-2.5 bg-[var(--theme-success)]/15 border border-[var(--theme-success)]/30 text-[var(--theme-success)] rounded-[14px] text-[10px] font-extrabold hover:bg-[var(--theme-success)]/25 transition-all"
                        >
                          ⬆ Fund Account to Start Trading
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* LANDSCAPE SPLIT VIEW */
              <div className="flex-1 flex flex-row min-h-0 overflow-hidden text-left bg-[var(--theme-background)] text-[var(--theme-primary-text)]">
                {/* Left Panel: Account Status */}
                <div className="w-[32%] min-w-[220px] border-r p-4 space-y-4 flex flex-col justify-between overflow-y-auto bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                  <div className="space-y-3.5">
                    {/* Server status indicator */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--theme-success)] animate-pulse shadow-lg shadow-emerald-500/30" />
                      <div className="leading-none space-y-1">
                        <p className="text-[10px] font-bold font-mono text-[var(--theme-primary-text)]">{brokerServer}</p>
                        <p className="text-[8px] tracking-wider text-[var(--theme-secondary-text)]">SECURE INST. SERVER</p>
                      </div>
                    </div>

                    {/* Floating P&L Card */}
                    <div className="p-3 rounded-[18px] space-y-1 shadow-[var(--theme-card-shadow)] border bg-[var(--theme-card-background)] border-[var(--theme-border)]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[var(--theme-secondary-text)]">Unrealized profit/loss</span>
                      <h3 className={`text-xl font-black font-mono tracking-tight ${displayWallet.pnl >= 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                        {displayWallet.pnl >= 0 ? '+' : ''}{(displayWallet.pnl ?? 0).toFixed(2)} USD
                      </h3>
                    </div>

                    {/* Metrics grid */}
                    <div className="space-y-2.5 font-mono text-[9.5px]">
                      <div className="flex justify-between items-center p-2 rounded border bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                        <span className="text-[var(--theme-secondary-text)]">Balance:</span>
                        <span className="font-bold text-[var(--theme-primary-text)]">${(displayWallet.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded border bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                        <span className="text-[var(--theme-secondary-text)]">Equity:</span>
                        <span className="font-bold text-[var(--theme-primary-text)]">${(liveEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded border bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                        <span className="text-[var(--theme-secondary-text)]">Free margin:</span>
                        <span className="font-bold text-[var(--theme-primary-text)]">${(liveFreeMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded border bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                        <span className="text-[var(--theme-secondary-text)]">Margin level:</span>
                        <span className={`font-bold ${marginLevelPercent >= 100 || marginLevelPercent === 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                          {(marginLevelPercent ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leverage display */}
                  <div className="text-[8.5px] font-bold py-2 px-3 border rounded-xl text-center flex items-center justify-between font-sans bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-secondary-text)]">
                    <span>Leverage Account Limit</span>
                    <span className="text-[var(--theme-primary-blue)] font-mono">1:500</span>
                  </div>
                </div>

                {/* Right Panel: Tabular Positions Grid */}
                <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto bg-[var(--theme-background)]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center justify-between font-sans text-[var(--theme-secondary-text)]">
                    <span>Active trade orders ({activePositions.length})</span>
                    {!authUser && <span className="text-[8px] px-2 py-0.5 rounded border bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] border-[var(--theme-primary-blue)]/20">DEMO PRACTICE MODE</span>}
                  </h3>

                  {/* Header Row */}
                  {activePositions.length > 0 ? (
                    <div className="flex flex-col min-h-0 flex-1">
                      {/* Grid header labels */}
                      <div className="grid grid-cols-8 gap-2 pb-2 text-[8px] font-bold uppercase font-mono tracking-wider border-b pl-2 text-[var(--theme-secondary-text)] border-[var(--theme-border)]">
                        <span>Symbol</span>
                        <span>Type</span>
                        <span>Lots</span>
                        <span>Open Price</span>
                        <span>Current</span>
                        <span>Stop Loss</span>
                        <span>Take Profit</span>
                        <span className="text-right pr-4">Profit</span>
                      </div>

                      {/* Grid values mapping */}
                      <div className="flex-1 overflow-y-auto divide-y pl-2 divide-[var(--theme-border)] bg-[var(--theme-background)]">
                        {activePositions.map((pos) => {
                          const isBuy = pos.side === 'BUY';
                          return (
                            <div
                              key={pos.id}
                              onClick={() => setPositionToClose(pos)}
                              className="grid grid-cols-8 gap-2 py-3 text-[10px] font-mono transition-colors cursor-pointer items-center pr-2 hover:bg-[#F9FAFB] active:bg-[var(--theme-secondary-background)] text-[var(--theme-primary-text)] border-b border-[var(--theme-border)]"
                            >
                              <span className="font-extrabold font-sans text-[var(--theme-primary-text)]">{pos.symbol.replace('/', '')}</span>
                              <span>
                                <span className={`px-1.5 py-0.2 rounded font-black text-[8px] ${isBuy ? 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/10' : 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] border border-[var(--theme-danger)]/10'}`}>
                                  {pos.side}
                                </span>
                              </span>
                              <span className="font-bold text-[var(--theme-primary-text)]">{pos.size.toFixed(2)}</span>
                              <span className="text-[var(--theme-secondary-text)]">{pos.entryPrice.toFixed(5)}</span>
                              <span className="text-[var(--theme-secondary-text)]">{pos.currentPrice.toFixed(5)}</span>
                              <span className={pos.slPrice ? 'text-[var(--theme-danger)]' : 'text-[var(--theme-muted-text)]'}>
                                {pos.slPrice ? pos.slPrice.toFixed(5) : '0.00000'}
                              </span>
                              <span className={pos.tpPrice ? 'text-[var(--theme-primary-blue)]' : 'text-[var(--theme-muted-text)]'}>
                                {pos.tpPrice ? pos.tpPrice.toFixed(5) : '0.00000'}
                              </span>
                              <span className={`text-right font-black pr-2 ${pos.pnl >= 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                                {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-[var(--theme-secondary-text)] font-bold space-y-3 font-sans">
                      <ShieldAlert className="w-10 h-10 opacity-20" />
                      <span className="text-xs">No active trade positions found on broker.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rotated landscape tab navigation bar inside Trade screen container */}
            {isTradeLandscape && (
              <nav className={`h-14 border-t flex items-center justify-around text-[9px] font-bold shrink-0 select-none ${isLightMode ? 'bg-[#FFFFFF] border-[#E5E5E5] text-[#8E8E93]' : 'bg-zinc-950 border-zinc-900 text-zinc-500'}`}>
                {[
                  { id: 'quotes', icon: ArrowLeftRight, label: 'Quotes' },
                  { id: 'charts', icon: Play, rotate: -90, label: 'Charts' },
                  { id: 'trade', icon: TrendingUp, label: 'Trade' },
                  { id: 'history', icon: Clock, label: 'History' },
                  { id: 'settings', icon: MessageSquare, label: 'Settings' }
                ].map((tab) => {
                  const isActive = activeScreen === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveScreen(tab.id as any);
                        setIsTradeLandscape(false);
                      }}
                      className={`flex flex-col items-center gap-1.5 h-full justify-center transition-colors relative px-4 rounded-xl ${isActive ? (isLightMode ? 'text-[#007AFF] bg-[#E3F2FD] my-1' : 'text-[#1E88E5]') : (isLightMode ? 'text-[#8E8E93] hover:text-[#333333]' : 'text-zinc-500 hover:text-zinc-350')}`}
                    >
                      <tab.icon className={`w-4 h-4 ${tab.rotate ? 'rotate-[-90deg]' : ''}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Position details & close popup modal */}
            {positionToClose && (
              <div className="absolute inset-0 bg-black/60 z-[10000] flex flex-col justify-end animate-fade-in text-left">
                <div className="absolute inset-0" onClick={() => setPositionToClose(null)} />
                <div className="bg-[var(--theme-background)] border-t border-[var(--theme-border)] rounded-t-3xl p-5 space-y-4 z-[10001] animate-slide-up max-w-md mx-auto w-full">
                  <div className="flex justify-between items-start border-b border-[var(--theme-border)] pb-3">
                    <div>
                      <h4 className="font-black text-sm text-[var(--theme-primary-text)] flex items-center gap-2">
                        {positionToClose.symbol.replace('/', '')}
                        <span className={`text-[8.5px] font-black px-1.5 rounded ${positionToClose.side === 'BUY' ? 'bg-[var(--theme-primary-blue)]/15 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/20' : 'bg-[var(--theme-danger)]/15 text-[var(--theme-danger)] border border-[var(--theme-danger)]/20'}`}>
                          {positionToClose.side} {positionToClose.size.toFixed(2)}
                        </span>
                      </h4>
                      <p className="text-[10px] text-[var(--theme-secondary-text)] font-mono mt-0.5">Ticket ID: {positionToClose.id}</p>
                    </div>
                    <button onClick={() => setPositionToClose(null)} className="text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-[var(--theme-border)] pb-3">
                    <div className="text-[var(--theme-secondary-text)]">Opening price: <span className="text-[var(--theme-primary-text)] font-mono font-bold block">{positionToClose.entryPrice.toFixed(5)}</span></div>
                    <div className="text-[var(--theme-secondary-text)]">Current quote price: <span className="text-[var(--theme-primary-text)] font-mono font-bold block">{positionToClose.currentPrice.toFixed(5)}</span></div>
                  </div>

                  {/* Actions list */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleCloseActivePosition}
                      className={`w-full py-4 text-center text-xs font-black rounded-xl uppercase flex items-center justify-center gap-1.5 shadow-lg transition-colors ${positionToClose.pnl >= 0 ? 'bg-[var(--theme-success)] hover:opacity-90 text-white shadow-[var(--theme-success)]/15 border border-[var(--theme-success)]/20' : 'bg-[var(--theme-danger)] hover:opacity-90 text-white shadow-[var(--theme-danger)]/15 border border-[var(--theme-danger)]/20'}`}
                    >
                      Close position (Profit/Loss: {positionToClose.pnl >= 0 ? '+' : ''}{positionToClose.pnl.toFixed(2)})
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSymbol(positionToClose.symbol.replace('/', ''));
                        setPositionToClose(null);
                        setIsTradeLandscape(false); // rotate back to portrait
                        setActiveScreen('charts');
                      }}
                      className="w-full py-3 hover:bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] font-bold rounded-xl text-xs uppercase transition-colors"
                    >
                      Show chart
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 4: TRANSACTION & TRADES HISTORY VIEW */}
        {activeScreen === 'history' && (
          <div className="flex-1 flex flex-col notch-padding overflow-hidden min-h-0">
            {/* History Header */}
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1 rounded transition text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-md font-bold text-[var(--theme-primary-text)]">History</h2>
              </div>
              <div className="flex items-center gap-3.5">
                <button className="text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><ArrowLeftRight className="w-4 h-4" /></button>
                <button className="text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><Calendar className="w-4 h-4" /></button>
              </div>
            </header>

            {/* History List */}
            <div className="flex-1 overflow-y-auto text-left bg-[var(--theme-background)]">
              <div className="flex flex-col h-full divide-y divide-[var(--theme-border)]">
                {/* Overview Stats card */}
                <div className="p-4 grid grid-cols-3 gap-4 text-center border-b bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-black mb-0.5 font-sans text-[var(--theme-secondary-text)]">Deposits</p>
                    <p className="font-mono text-[11px] font-bold text-[var(--theme-primary-text)]">${historyStats.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-black mb-0.5 font-sans text-[var(--theme-secondary-text)]">Withdrawals</p>
                    <p className="font-mono text-[11px] font-bold text-[var(--theme-primary-text)]">${historyStats.withdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-black mb-0.5 font-sans text-[var(--theme-secondary-text)]">Net Profit</p>
                    <p className={`font-mono text-[11px] font-bold ${historyStats.netProfit >= 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                      {historyStats.netProfit >= 0 ? '+' : ''}${historyStats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* List items */}
                <div className="flex-1 overflow-y-auto divide-y font-sans text-xs divide-[var(--theme-border)] bg-[var(--theme-background)]">
                  {displayHistory.map((item, idx) => {
                    const isDeposit = item.type === 'DEPOSIT';
                    return (
                      <div key={idx} className="p-4 flex items-center justify-between transition-colors bg-[var(--theme-card-background)] hover:bg-[#F9FAFB] active:bg-[var(--theme-secondary-background)] border-b border-[var(--theme-border)]">
                        <div className="space-y-1">
                          <h4 className="font-bold flex items-center gap-1.5 text-[var(--theme-primary-text)]">
                            {isDeposit ? 'Balance Deposit' : `${item.symbol} closed position`}
                            {!isDeposit && (
                              <span className={`text-[8px] font-black px-1 rounded ${item.type === 'BUY' ? 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)]' : 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)]'}`}>
                                {item.type} {item.size?.toFixed(2)}
                              </span>
                            )}
                          </h4>
                          <p className="text-[9px] font-mono text-[var(--theme-secondary-text)]">
                            {isDeposit ? item.date : `${item.entryPrice?.toFixed(5)} → ${item.closePrice?.toFixed(5)} | ${item.date}`}
                          </p>
                        </div>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}`}>
                          {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {displayHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--theme-secondary-text)] font-bold space-y-3">
                      <ShieldAlert className="w-10 h-10 opacity-30" />
                      <span className="text-xs">No historical trades to display.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 5: MESSAGES / MAILBOX VIEW */}
        {activeScreen === 'messages' && (
          <div className="flex-1 flex flex-col notch-padding overflow-hidden min-h-0">
            {/* Messages Header */}
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1 rounded text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-md font-extrabold text-[var(--theme-primary-text)]">Mailbox</h2>
              </div>
              <button className="text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"><Trash className="w-4 h-4" /></button>
            </header>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto text-left bg-[var(--theme-background)]">
              <div className="divide-y font-sans text-xs divide-[var(--theme-border)]">
                {[
                  { sender: 'Forex Factory Admin', subject: 'KYC Document Verification Required', body: 'Please upload valid government credentials to unlock standard leverages and withdraw limits.', date: 'June 25, 2026', unread: true },
                  { sender: 'MT5 Broker Host', subject: 'Leverage adjusted to 1:500', body: 'Per portfolio margins risk evaluations, your leverage configurations have been updated to 1:500.', date: 'June 24, 2026', unread: true },
                  { sender: 'Forex Factory Security', subject: 'Session Login from London, UK', body: 'We registered a secure credential verification at 14:02 UTC. If this was not you, toggle your profile passcode.', date: 'June 23, 2026', unread: false },
                  { sender: 'Liquidity Provider', subject: 'EURUSD spreads adjusted to Institutional raw limits', body: 'Raw institutional Spreads limits have been successfully benchmarked across all currencies spot pairs.', date: 'June 22, 2026', unread: false }
                ].map((mail, idx) => (
                  <div key={idx} className={`p-4 transition-colors flex items-start justify-between gap-4 cursor-pointer ${mail.unread ? 'bg-[var(--theme-secondary-background)] hover:bg-[var(--theme-border)]/30' : 'hover:bg-[var(--theme-secondary-background)]'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {mail.unread && <span className="w-1.5 h-1.5 bg-[var(--theme-primary-blue)] rounded-full shrink-0" />}
                        <h4 className={`font-bold ${mail.unread ? 'text-[var(--theme-primary-text)]' : 'text-[var(--theme-secondary-text)]'}`}>{mail.sender}</h4>
                      </div>
                      <p className="font-extrabold text-[10px] text-[var(--theme-primary-text)]">{mail.subject}</p>
                      <p className="text-[10px] leading-relaxed font-normal text-[var(--theme-secondary-text)]">{mail.body}</p>
                    </div>
                    <span className="text-[8px] shrink-0 font-mono text-[var(--theme-muted-text)]">{mail.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SCREEN: WELCOME / ONBOARDING (Post Registration)       */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeScreen === 'welcome' && (
          <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--theme-background)]">
            {/* Animated gradient header */}
            <div className="relative px-5 pt-12 pb-8 text-center overflow-hidden bg-[var(--theme-secondary-background)] border-b border-[var(--theme-border)]">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/8 via-blue-500/5 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Logo mark */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--theme-primary-blue)] flex items-center justify-center shadow-lg relative">
                <span className="text-3xl font-black text-white">F</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--theme-success)] rounded-full border-2 border-[var(--theme-card-background)] flex items-center justify-center">
                  <span className="text-white text-[7px] font-black">✓</span>
                </span>
              </div>

              <h1 className="text-xl font-black mb-1 text-[var(--theme-primary-text)]">Welcome to Forex Factory</h1>
              <p className="text-xs font-sans max-w-[220px] mx-auto leading-relaxed text-[var(--theme-secondary-text)]">
                Your account is ready. Choose how you want to start trading.
              </p>
            </div>

            {/* Options */}
            <div className="px-5 space-y-3 flex-1 mt-4">

              {/* Demo Card */}
              <button
                onClick={() => setActiveScreen('quotes')}
                className="w-full text-left p-4 rounded-[18px] transition-all active:scale-[0.98] group bg-[var(--theme-card-background)] border border-[var(--theme-border)] shadow-[var(--theme-card-shadow)] hover:border-[var(--theme-primary-blue)]/60 hover:bg-[#F9FAFB]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary-blue)]/10 border border-[var(--theme-primary-blue)]/25 flex items-center justify-center shrink-0 group-hover:bg-[var(--theme-primary-blue)]/25 transition-all">
                    <span className="text-lg">🎮</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[var(--theme-primary-text)]">Try Demo Trading</h3>
                      <span className="text-[7px] bg-[var(--theme-primary-blue)]/15 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/25 px-1.5 py-0.5 rounded-full font-black uppercase">FREE</span>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-relaxed text-[var(--theme-secondary-text)]">Practice with ₹1,00,000 virtual balance. No risk. All features unlocked.</p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-[var(--theme-secondary-text)]">
                      <span className="flex items-center gap-1"><span className="text-[var(--theme-success)]">✓</span> ₹1,00,000 virtual</span>
                      <span className="flex items-center gap-1"><span className="text-[var(--theme-success)]">✓</span> Real market prices</span>
                    </div>
                  </div>
                  <span className="text-zinc-650 text-lg mt-1">›</span>
                </div>
              </button>

              {/* Real Deposit Card */}
              <button
                onClick={() => setActiveScreen('deposit')}
                className="w-full text-left p-4 rounded-[18px] transition-all active:scale-[0.98] group bg-[var(--theme-card-background)] border border-[var(--theme-border)] shadow-[var(--theme-card-shadow)] hover:border-[var(--theme-success)]/60 hover:bg-[#F9FAFB]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--theme-success)]/10 border border-[var(--theme-success)]/25 flex items-center justify-center shrink-0 group-hover:bg-[var(--theme-success)]/25 transition-all">
                    <span className="text-lg">💰</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[var(--theme-primary-text)]">Deposit & Trade Real</h3>
                      <span className="text-[7px] bg-[var(--theme-success)]/15 text-[var(--theme-success)] border border-[var(--theme-success)]/25 px-1.5 py-0.5 rounded-full font-black uppercase">LIVE</span>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-relaxed text-[var(--theme-secondary-text)]">Fund your account and start trading real markets. Withdraw profits anytime.</p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-[var(--theme-secondary-text)]">
                      <span className="flex items-center gap-1"><span className="text-[var(--theme-success)]">✓</span> BTC, ETH, USDT</span>
                      <span className="flex items-center gap-1"><span className="text-[var(--theme-success)]">✓</span> INR / UPI</span>
                      <span className="flex items-center gap-1"><span className="text-[var(--theme-success)]">✓</span> USD, EUR</span>
                    </div>
                  </div>
                  <span className="text-zinc-650 text-lg mt-1">›</span>
                </div>
              </button>

              {/* Currency Preference */}
              <div className="p-4 border rounded-[18px] bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)]">
                <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-[var(--theme-secondary-text)]">Choose Your Base Currency</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['INR', 'USD', 'USDT', 'EUR', 'GBP', 'BTC', 'ETH'] as const).map(cur => (
                    <button
                      key={cur}
                      onClick={() => handleSetCurrency(cur)}
                      className={`py-1.5 rounded-xl text-[9px] font-black transition-all ${preferredCurrency === cur
                        ? 'bg-[var(--theme-primary-blue)] text-white shadow-md border border-[var(--theme-primary-blue)]'
                        : 'bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-border)]/40'
                        }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] mt-2 font-sans text-[var(--theme-secondary-text)]">Charts, balances & P&L will display in {preferredCurrency}</p>
              </div>
            </div>

            {/* Skip link */}
            <div className="text-center py-6">
              <button
                onClick={() => setActiveScreen('quotes')}
                className="text-[10px] text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] transition-colors"
              >
                Skip for now →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SCREEN: DEPOSIT                                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeScreen === 'deposit' && (() => {
          // Deposit config per currency
          const DEPOSIT_OPTIONS: Record<string, { min: string; address: string; network: string[]; icon: string; note: string }> = {
            BTC: { min: '0.001 BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: ['Bitcoin'], icon: '₿', note: 'Bitcoin Mainnet only. Min 1 confirmation.' },
            ETH: { min: '0.01 ETH', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', network: ['ERC20'], icon: 'Ξ', note: 'Ethereum network (ERC20). Avoid BSC.' },
            USDT: { min: '10 USDT', address: 'TBFRVdJZy2RuBhLBJgpJzqFRBQEzDCkVKt', network: ['TRC20', 'ERC20'], icon: '₮', note: 'TRC20 recommended (lower fees).' },
            INR: { min: '₹500', address: 'forex@upi', network: ['UPI', 'IMPS'], icon: '₹', note: 'UPI instant. IMPS 1-4 hrs. Bank: HDFC 4090XXXX.' },
            USD: { min: '$10', address: 'forex.factory.wire@bank.pro', network: ['Wire', 'Card'], icon: '$', note: 'Bank wire 1-3 days. Card instant.' },
            EUR: { min: '€10', address: 'IBAN: DE89 3704 0044 0532 0130 00', network: ['SEPA'], icon: '€', note: 'SEPA transfer 1-2 business days.' },
            GBP: { min: '£10', address: 'Sort: 20-00-00, Acc: 12345678', network: ['Faster Payments'], icon: '£', note: 'Faster Payments. Usually instant.' },
          };

          const cur = DEPOSIT_OPTIONS[depositCurrency] || DEPOSIT_OPTIONS['INR'];

          return (
            <div className="flex-1 flex flex-col min-h-0 bg-[var(--theme-background)]">
              {/* Header */}
              <header className="h-12 border-b flex items-center justify-between px-4 shrink-0 bg-[var(--theme-background)] border-[var(--theme-border)]">
                <button onClick={() => { setActiveScreen('trade'); setDepositSubmitted(false); }} className="p-1 rounded-lg transition text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="font-extrabold text-sm text-[var(--theme-primary-text)]">Deposit Funds</h3>
                <div className="w-7" />
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {depositSubmitted ? (
                  /* Success state */
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-success)]/15 border-2 border-[var(--theme-success)]/40 flex items-center justify-center">
                      <span className="text-3xl text-[var(--theme-success)]">✓</span>
                    </div>
                    <h3 className="font-extrabold text-base text-[var(--theme-primary-text)]">Payment Submitted!</h3>
                    <p className="text-xs max-w-[200px] leading-relaxed text-[var(--theme-secondary-text)]">
                      Your deposit is under review. Balance will be credited within 15–30 minutes after confirmation.
                    </p>
                    <button
                      onClick={() => { setActiveScreen('trade'); setDepositSubmitted(false); }}
                      className="mt-2 px-6 py-2.5 bg-[var(--theme-primary-blue)] text-white text-xs font-extrabold rounded-[14px]"
                    >
                      Back to Trade
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Currency Selector */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-[var(--theme-secondary-text)]">Select Deposit Currency</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {Object.keys(DEPOSIT_OPTIONS).map(c => (
                          <button
                            key={c}
                            onClick={() => { setDepositCurrency(c); setDepositNetwork(DEPOSIT_OPTIONS[c].network[0]); }}
                            className={`py-2 rounded-xl text-[9px] font-extrabold flex flex-col items-center gap-0.5 transition-all ${depositCurrency === c
                              ? 'bg-[var(--theme-primary-blue)] text-white border border-[var(--theme-primary-blue)] shadow-lg shadow-blue-900/10'
                              : 'bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-border)]/40'
                              }`}
                          >
                            <span className="text-sm">{DEPOSIT_OPTIONS[c].icon}</span>
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Network selector (if multiple) */}
                    {cur.network.length > 1 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-[var(--theme-secondary-text)]">Network / Method</p>
                        <div className="flex gap-2">
                          {cur.network.map(n => (
                            <button
                              key={n}
                              onClick={() => setDepositNetwork(n)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${depositNetwork === n
                                ? 'bg-[var(--theme-primary-blue)] text-white'
                                : 'bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-border)]/40'
                                }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Minimum & Info */}
                    <div className="rounded-2xl p-3.5 space-y-2 border bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-widest font-black text-[var(--theme-secondary-text)]">Minimum Deposit</span>
                        <span className="text-sm font-black font-mono text-[var(--theme-primary-text)]">{cur.min}</span>
                      </div>
                      <p className="text-[9px] font-sans leading-relaxed text-[var(--theme-secondary-text)]">{cur.note}</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center relative border border-[var(--theme-border)] shadow-sm">
                        {/* SVG QR pattern (decorative) */}
                        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white" />
                          {/* QR corner squares */}
                          <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="5" />
                          <rect x="12" y="12" width="16" height="16" fill="black" />
                          <rect x="65" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="5" />
                          <rect x="72" y="12" width="16" height="16" fill="black" />
                          <rect x="5" y="65" width="30" height="30" fill="none" stroke="black" strokeWidth="5" />
                          <rect x="12" y="72" width="16" height="16" fill="black" />
                          {/* Center currency label */}
                          <text x="50" y="53" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1E88E5">{depositCurrency}</text>
                          {/* Dot pattern - deterministic based on currency */}
                          {[42, 46, 50, 54, 58].map(x => [42, 46, 50, 54, 58].map(y => {
                            const seed = (x * 7 + y * 13 + depositCurrency.charCodeAt(0)) % 3;
                            return seed > 0 ? <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" fill="black" opacity="0.7" /> : null;
                          }))}
                        </svg>
                      </div>
                      <p className="text-[8px] font-sans text-[var(--theme-secondary-text)]">Scan QR to get address</p>
                    </div>

                    {/* Address box */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-[var(--theme-secondary-text)]">
                        {depositCurrency === 'INR' ? 'UPI / Bank Details' : 'Wallet Address'}
                      </p>
                      <div className="flex items-center gap-2 border rounded-xl px-3 py-3 bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                        <p className="flex-1 text-[9.5px] font-mono break-all leading-relaxed text-[var(--theme-primary-text)]">{cur.address}</p>
                        <button
                          onClick={() => handleCopy(cur.address)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${copiedAddress
                            ? 'bg-[var(--theme-success)] text-white'
                            : 'bg-[var(--theme-border)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/80'
                            }`}
                        >
                          {copiedAddress ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-xl px-3.5 py-2.5 border bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400">
                      <p className="text-[9px] leading-relaxed font-sans">
                        ⚠ Send only <strong>{depositCurrency}</strong> ({depositNetwork}) to this address. Sending wrong currency may result in permanent loss.
                      </p>
                    </div>

                    {/* Deposit Form Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-[var(--theme-secondary-text)]">Deposit Amount (USD)</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)] focus:border-[var(--theme-primary-blue)]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-[var(--theme-secondary-text)]">Transaction UTR / Hash</label>
                        <input
                          type="text"
                          value={depositUTR}
                          onChange={(e) => setDepositUTR(e.target.value)}
                          placeholder="Enter your transaction reference"
                          className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)] focus:border-[var(--theme-primary-blue)]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (!depositAmount || !depositUTR) {
                          alert("Please enter amount and UTR/Hash");
                          return;
                        }
                        if (authUser) {
                          try {
                            await depositService.createDeposit({
                              amount: parseFloat(depositAmount),
                              utr: depositUTR,
                              currency: depositCurrency,
                              network: depositNetwork
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }
                        setDepositSubmitted(true);
                      }}
                      className="w-full py-4 bg-[var(--theme-success)] hover:opacity-90 text-white font-extrabold rounded-[14px] text-sm uppercase tracking-wide shadow-lg shadow-[var(--theme-success)]/10 active:scale-[0.98] transition-all border border-[var(--theme-success)]/20"
                    >
                      I Have Sent Payment ✓
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SCREEN: WITHDRAW                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeScreen === 'withdraw' && (() => {
          const WITHDRAW_OPTIONS: Record<string, { min: string; icon: string; placeholder: string; label: string; note: string }> = {
            INR: { min: '₹500', icon: '₹', placeholder: 'UPI ID or Bank A/C + IFSC', label: 'UPI / Bank Account', note: 'Processed in 1-4 business hours. IMPS/NEFT.' },
            USDT: { min: '10 USDT', icon: '₮', placeholder: 'TRC20 wallet address', label: 'USDT Wallet (TRC20)', note: 'Minimum 10 USDT. TRC20 network.' },
            BTC: { min: '0.001', icon: '₿', placeholder: 'Bitcoin wallet address (bc1...)', label: 'Bitcoin Address', note: '1 confirmation required. ~30 min.' },
            ETH: { min: '0.01', icon: 'Ξ', placeholder: '0x... Ethereum address', label: 'ETH Wallet (ERC20)', note: 'ERC20 only. Check network before submitting.' },
            USD: { min: '$10', icon: '$', placeholder: 'Bank SWIFT / Wire details', label: 'Bank Wire (USD)', note: 'International wire 1-3 business days.' },
            EUR: { min: '€10', icon: '€', placeholder: 'IBAN + BIC/SWIFT code', label: 'SEPA / EUR Wire', note: 'SEPA transfer. EU banks 1-2 days.' },
          };

          const wCur = WITHDRAW_OPTIONS[withdrawCurrency] || WITHDRAW_OPTIONS['INR'];
          const availableBalance = toCurrency(demoBalance + demoPnl);

          return (
            <div className="flex-1 flex flex-col min-h-0 bg-[var(--theme-background)]">
              {/* Header */}
              <header className="h-12 border-b flex items-center justify-between px-4 shrink-0 bg-[var(--theme-background)] border-[var(--theme-border)]">
                <button onClick={() => { setActiveScreen('trade'); setWithdrawSubmitted(false); setWithdrawAmount(''); setWithdrawAddress(''); }} className="p-1 rounded-lg transition text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="font-extrabold text-sm text-[var(--theme-primary-text)]">Withdraw Funds</h3>
                <div className="w-7" />
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {withdrawSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-success)]/15 border-2 border-[var(--theme-success)]/40 flex items-center justify-center">
                      <span className="text-3xl text-[var(--theme-success)]">✓</span>
                    </div>
                    <h3 className="font-extrabold text-base text-[var(--theme-primary-text)]">Withdrawal Requested!</h3>
                    <p className="text-xs max-w-[200px] leading-relaxed text-[var(--theme-secondary-text)]">
                      Your withdrawal request has been submitted. Processing time: {wCur.note}
                    </p>
                    <button
                      onClick={() => { setActiveScreen('trade'); setWithdrawSubmitted(false); setWithdrawAmount(''); setWithdrawAddress(''); }}
                      className="mt-2 px-6 py-2.5 bg-[var(--theme-primary-blue)] text-white text-xs font-extrabold rounded-[14px]"
                    >
                      Back to Trade
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Balance available */}
                    <div className="border rounded-2xl p-4 flex items-center justify-between bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest font-black text-[var(--theme-secondary-text)]">Available Balance</p>
                        <p className="text-xl font-black mt-0.5 text-[var(--theme-primary-text)]">{availableBalance}</p>
                      </div>
                      <div className={`text-[9px] px-2 py-1 rounded-full font-black ${authUser ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] border border-[var(--theme-success)]/20' : 'bg-[var(--theme-primary-blue)]/10 text-[var(--theme-primary-blue)] border border-[var(--theme-primary-blue)]/20'}`}>
                        {authUser ? 'LIVE' : 'DEMO'}
                      </div>
                    </div>

                    {/* Currency Selector */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-[var(--theme-secondary-text)]">Withdraw To</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.keys(WITHDRAW_OPTIONS).map(c => (
                          <button
                            key={c}
                            onClick={() => setWithdrawCurrency(c)}
                            className={`py-2 rounded-xl text-[9px] font-extrabold flex flex-col items-center gap-0.5 transition-all ${withdrawCurrency === c
                              ? 'bg-[var(--theme-primary-blue)] text-white border border-[var(--theme-primary-blue)] shadow-lg shadow-blue-900/10'
                              : 'bg-[var(--theme-secondary-background)] text-[var(--theme-secondary-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-border)]/40'
                              }`}
                          >
                            <span className="text-base">{WITHDRAW_OPTIONS[c].icon}</span>
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Min info */}
                    <div className="border rounded-xl p-3 flex justify-between items-center bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                      <span className="text-[9px] uppercase tracking-widest font-black text-[var(--theme-secondary-text)]">Minimum</span>
                      <span className="text-xs font-black font-mono text-[var(--theme-primary-text)]">{wCur.min}</span>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-secondary-text)]">Amount ({withdrawCurrency})</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder={`Min ${wCur.min}`}
                        className="w-full border rounded-xl px-3 py-3 text-xs font-mono focus:outline-none bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)] focus:border-[var(--theme-primary-blue)]"
                      />
                    </div>

                    {/* Address / Account */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-secondary-text)]">{wCur.label}</label>
                      <textarea
                        value={withdrawAddress}
                        onChange={e => setWithdrawAddress(e.target.value)}
                        placeholder={wCur.placeholder}
                        rows={2}
                        className="w-full border rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none resize-none bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)] focus:border-[var(--theme-primary-blue)]"
                      />
                    </div>

                    {/* Processing note */}
                    <div className="border rounded-xl px-3.5 py-2.5 bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                      <p className="text-[9px] leading-relaxed font-sans text-[var(--theme-secondary-text)]">ℹ {wCur.note}</p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={async () => {
                        if (!withdrawAmount || !withdrawAddress) {
                          alert('Please fill in amount and destination details.');
                          return;
                        }
                        if (authUser) {
                          try {
                            await withdrawService.createWithdrawal({
                              amount: parseFloat(withdrawAmount) || 0,
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        } else {
                          // Simulate demo withdrawal reduction
                          setDemoBalance(prev => prev - (parseFloat(withdrawAmount) || 0));
                        }
                        setWithdrawSubmitted(true);
                      }}
                      className="w-full py-4 font-extrabold rounded-[14px] text-sm uppercase tracking-wide active:scale-[0.98] transition-all bg-[var(--theme-primary-blue)] text-white hover:opacity-90 border border-[var(--theme-primary-blue)]/20"
                    >
                      Submit Withdrawal Request
                    </button>

                    {/* KYC Note */}
                    <p className="text-center text-[8.5px] font-sans pb-2 text-[var(--theme-secondary-text)]">
                      Withdrawals require KYC verification. Processing 09:00–18:00 IST on business days.
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* SCREEN 6: BROKERS SEARCH LIST */}
        {activeScreen === 'brokers' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-[var(--theme-background)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <button
                onClick={() => setActiveScreen('quotes')}
                className="p-1 rounded transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-[var(--theme-primary-text)]">Find Broker</h3>
              <div className="w-5" />
            </header>

            <div className="p-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--theme-secondary-text)]" />
                <input
                  type="text"
                  value={searchBroker}
                  onChange={(e) => setSearchBroker(e.target.value)}
                  placeholder="Find broker..."
                  className="w-full border rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] transition-all bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              {/* List of brokers */}
              <div className="space-y-2">
                {[
                  { name: 'Forex Factory', logo: 'F', desc: 'Secure institutional white label server', server: 'ForexFactory-Live' },
                  { name: 'MetaQuotes-Demo', logo: 'M', desc: 'MetaQuotes Software default simulator', server: 'MetaQuotes-Demo' },
                  { name: 'IC Markets Live', logo: 'I', desc: 'Global retail spot broker services', server: 'ICMarkets-Live' },
                  { name: 'OctaFX Live Server', logo: 'O', desc: 'Octa Markets brokerage services', server: 'OctaFX-Real' }
                ]
                  .filter(b => b.name.toLowerCase().includes(searchBroker.toLowerCase()))
                  .map((broker) => (
                    <button
                      key={broker.name}
                      onClick={() => {
                        setSelectedBroker(broker.name);
                        setBrokerServer(broker.server);
                        setActiveScreen('broker-login');
                      }}
                      className="w-full p-4 rounded-[18px] border transition-all flex items-center gap-3 text-left bg-[var(--theme-card-background)] border-[var(--theme-border)] shadow-[var(--theme-card-shadow)] hover:bg-[#F9FAFB] active:bg-[var(--theme-secondary-background)]"
                    >
                      <div className="w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-md text-[var(--theme-primary-blue)] bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                        {broker.logo}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs leading-tight text-[var(--theme-primary-text)]">{broker.name}</h4>
                        <p className="text-[10px] mt-0.5 leading-snug text-[var(--theme-secondary-text)]">{broker.desc}</p>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="text-[10px] text-[var(--theme-secondary-text)] leading-normal border-t border-[var(--theme-border)] pt-4 px-1 text-justify">
                <strong>Disclaimer Warning:</strong> The list shows simulated brokers. Always verify credentials with regulators before depositing capital to any server hosts.
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 7: BROKER LOGIN PAGE */}
        {activeScreen === 'broker-login' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-[var(--theme-background)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <button
                onClick={() => setActiveScreen('brokers')}
                className="p-1 rounded transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-[var(--theme-primary-text)]">Link Account</h3>
              <div className="w-5" />
            </header>

            <form onSubmit={handleBrokerLogin} className="p-5 space-y-4">
              <div className="space-y-1 text-center mb-6">
                <span className="w-12 h-12 rounded-2xl bg-[var(--theme-primary-blue)]/10 border border-[var(--theme-primary-blue)]/20 text-[var(--theme-primary-blue)] flex items-center justify-center mx-auto text-xl font-bold mb-2">B</span>
                <h3 className="font-black text-sm text-[var(--theme-primary-text)]">{selectedBroker}</h3>
                <p className="text-[10px] text-[var(--theme-secondary-text)]">Connecting to server: <span className="font-mono font-bold text-[var(--theme-primary-text)]">{brokerServer}</span></p>
              </div>

              {brokerLoginError && (
                <div className="p-3 bg-[var(--theme-danger)]/15 border border-[var(--theme-danger)]/25 rounded-xl text-[var(--theme-danger)] text-[10px] font-bold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brokerLoginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Email / Login ID</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@broker.com"
                  required
                  className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Password passcode</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Account password key"
                  required
                  className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Server coordinate</label>
                <select
                  value={brokerServer}
                  onChange={(e) => setBrokerServer(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)]"
                >
                  <option value="ForexFactory-Live">ForexFactory-Live (Real accounts)</option>
                  <option value="ForexFactory-Demo">ForexFactory-Demo (Practice play)</option>
                </select>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 bg-[var(--theme-primary-blue)] hover:opacity-90 text-white font-extrabold rounded-[14px] text-xs uppercase flex items-center justify-center gap-1.5 transition-colors border border-[var(--theme-primary-blue)]/20"
                >
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Sign In to Server
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScreen('broker-register')}
                  className="w-full py-3 text-center font-bold text-xs text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)]"
                >
                  Register New Real Trading Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 8: BROKER REGISTER PAGE */}
        {activeScreen === 'broker-register' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-[var(--theme-background)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <button
                onClick={() => setActiveScreen('broker-login')}
                className="p-1 rounded transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-[var(--theme-primary-text)]">Create Account</h3>
              <div className="w-5" />
            </header>

            <form onSubmit={handleBrokerRegister} className="p-5 space-y-3.5 overflow-y-auto max-h-[640px]">
              <div className="space-y-1 text-center mb-4">
                <h3 className="font-black text-sm text-[var(--theme-primary-text)]">Forex Factory Real registration</h3>
                <p className="text-[9px] text-[var(--theme-secondary-text)]">Provide legal coordinate details to establish leverage lines.</p>
              </div>

              {brokerLoginError && (
                <div className="p-3 bg-[var(--theme-danger)]/15 border border-[var(--theme-danger)]/25 rounded-xl text-[var(--theme-danger)] text-[10px] font-bold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brokerLoginError}</span>
                </div>
              )}

              {brokerRegisterSuccess && (
                <div className="p-3 bg-[var(--theme-success)]/15 border border-[var(--theme-success)]/25 rounded-xl text-[var(--theme-success)] text-[10px] font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Registered successfully! Redirecting to login...</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase font-mono text-[var(--theme-secondary-text)]">Full Name</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Legal name"
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase font-mono text-[var(--theme-secondary-text)]">Email Coordinating hash</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase font-mono text-[var(--theme-secondary-text)]">Passcode key</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Create secure password"
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase font-mono text-[var(--theme-secondary-text)]">Mobile coordinate</label>
                <input
                  type="text"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="+91 (555) 777-1234"
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isAuthLoading || brokerRegisterSuccess}
                  className="w-full py-3.5 bg-[var(--theme-primary-blue)] hover:opacity-90 text-white font-extrabold rounded-[14px] text-xs uppercase flex items-center justify-center gap-1.5 transition-colors border border-[var(--theme-primary-blue)]/20"
                >
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Register & Establish server
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 8.5: OTP VERIFICATION PAGE */}
        {activeScreen === 'otp-verify' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-[var(--theme-background)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <button
                onClick={() => setActiveScreen('broker-login')}
                className="p-1 rounded transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-[var(--theme-primary-text)]">2FA Verification</h3>
              <div className="w-5" />
            </header>

            <form onSubmit={handleVerifyOtp} className="p-5 space-y-4">
              <div className="space-y-1 text-center mb-6">
                <span className="w-12 h-12 rounded-2xl bg-[var(--theme-primary-blue)]/10 border border-[var(--theme-primary-blue)]/20 text-[var(--theme-primary-blue)] flex items-center justify-center mx-auto text-xl font-bold mb-2">
                  <ShieldAlert className="w-6 h-6" />
                </span>
                <h3 className="font-black text-sm text-[var(--theme-primary-text)]">Security Check</h3>
                <p className="text-[10px] text-[var(--theme-secondary-text)]">We sent a verification code to <span className="font-bold text-[var(--theme-primary-text)]">{authEmailContext}</span></p>
              </div>

              {brokerLoginError && (
                <div className="p-3 bg-[var(--theme-danger)]/15 border border-[var(--theme-danger)]/25 rounded-xl text-[var(--theme-danger)] text-[10px] font-bold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brokerLoginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full border rounded-xl px-3 py-3.5 text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isOtpVerifying || otpCode.length < 6}
                  className="w-full py-3.5 bg-[var(--theme-primary-blue)] hover:opacity-90 disabled:bg-[var(--theme-border)] disabled:text-[var(--theme-secondary-text)] text-white font-extrabold rounded-[14px] text-xs uppercase flex items-center justify-center gap-1.5 transition-colors border border-[var(--theme-primary-blue)]/20"
                >
                  {isOtpVerifying && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Verify & Access Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 9: ORDER PLACEMENT TICKET SCREEN */}
        {activeScreen === 'order-entry' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-[var(--theme-background)]">
            <header className="h-12 border-b flex items-center justify-between px-4 bg-[var(--theme-background)] border-[var(--theme-border)]">
              <button
                onClick={() => setActiveScreen('quotes')}
                className="p-1 rounded transition-colors text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-[var(--theme-primary-text)]">New Order ticket</h3>
              <div className="w-5" />
            </header>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[640px]">
              {orderStatusMessage && (
                <div className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 border ${orderStatusMessage.type === 'success' ? 'bg-[var(--theme-success)]/10 border-[var(--theme-success)]/20 text-[var(--theme-success)]' : 'bg-[var(--theme-danger)]/10 border-[var(--theme-danger)]/20 text-[var(--theme-danger)]'}`}>
                  {orderStatusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                  <span>{orderStatusMessage.text}</span>
                </div>
              )}

              {/* Symbol selector header */}
              <div className="flex justify-between items-center p-3 rounded-xl border bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-secondary-text)]">Trading instrument</span>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-transparent font-extrabold text-xs outline-none text-right font-mono text-[var(--theme-primary-text)]"
                >
                  {symbolsData.map(sym => (
                    <option key={sym.symbol} value={sym.symbol.replace('/', '')} className="text-[var(--theme-primary-text)] bg-[var(--theme-background)]">{sym.symbol.replace('/', '')}</option>
                  ))}
                </select>
              </div>

              {/* Execution type selector */}
              <div className="flex justify-between items-center p-3 rounded-xl border bg-[var(--theme-secondary-background)] border-[var(--theme-border)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-secondary-text)]">Order type execution</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="bg-transparent font-bold text-xs outline-none text-right text-[var(--theme-primary-text)]"
                >
                  <option value="BUY" className="text-[var(--theme-primary-text)] bg-[var(--theme-background)]">Market Execution Buy</option>
                  <option value="SELL" className="text-[var(--theme-primary-text)] bg-[var(--theme-background)]">Market Execution Sell</option>
                  <option value="BUY_LIMIT" className="text-[var(--theme-primary-text)] bg-[var(--theme-background)]">Pending Buy Limit</option>
                  <option value="SELL_LIMIT" className="text-[var(--theme-primary-text)] bg-[var(--theme-background)]">Pending Sell Limit</option>
                </select>
              </div>

              {/* Lots selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Volume size (Lots)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOrderVolume(prev => Math.max(0.01, parseFloat(prev) - 0.1).toFixed(2))}
                    className="px-3 py-2 border hover:bg-opacity-80 text-xs font-bold rounded-lg bg-[var(--theme-secondary-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                  >
                    -0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderVolume(prev => Math.max(0.01, parseFloat(prev) - 0.01).toFixed(2))}
                    className="px-2 py-2 border hover:bg-opacity-80 text-xs font-bold rounded-lg bg-[var(--theme-secondary-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                  >
                    -0.01
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={orderVolume}
                    onChange={(e) => setOrderVolume(e.target.value)}
                    className="flex-1 text-center border rounded-lg py-2 font-mono text-sm font-black focus:outline-none focus:border-[var(--theme-primary-blue)] bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)]"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderVolume(prev => (parseFloat(prev) + 0.01).toFixed(2))}
                    className="px-2 py-2 border hover:bg-opacity-80 text-xs font-bold rounded-lg bg-[var(--theme-secondary-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                  >
                    +0.01
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderVolume(prev => (parseFloat(prev) + 0.1).toFixed(2))}
                    className="px-3 py-2 border hover:bg-opacity-80 text-xs font-bold rounded-lg bg-[var(--theme-secondary-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-border)]/40"
                  >
                    +0.1
                  </button>
                </div>
              </div>

              {/* Stop Loss (SL) and Take Profit (TP) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Stop Loss (SL)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={orderSL}
                    onChange={(e) => setOrderSL(e.target.value)}
                    placeholder="0.00000"
                    className="w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--theme-danger)]/50 bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Take Profit (TP)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={orderTP}
                    onChange={(e) => setOrderTP(e.target.value)}
                    placeholder="0.00000"
                    className="w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--theme-primary-blue)]/50 bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                  />
                </div>
              </div>

              {orderType.includes('LIMIT') && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="text-[9px] font-black uppercase tracking-widest font-mono text-[var(--theme-secondary-text)]">Target price target</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={orderTargetPrice}
                    onChange={(e) => setOrderTargetPrice(e.target.value)}
                    placeholder="Enter limit price coordinate"
                    className="w-full border rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[var(--theme-success)]/50 bg-[var(--theme-card-background)] border-[var(--theme-border)] text-[var(--theme-primary-text)] placeholder-[var(--theme-muted-text)]"
                  />
                </div>
              )}

              {/* Instant Execution Buttons */}
              <div className="pt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setOrderType('SELL');
                    handlePlaceSimulatorOrder();
                  }}
                  className="py-4 bg-[var(--theme-danger)] hover:opacity-90 text-white font-extrabold rounded-[14px] text-xs uppercase flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-[var(--theme-danger)]/15 active:scale-[0.98] transition-all border border-[var(--theme-danger)]/20"
                >
                  <span className="font-black">SELL</span>
                  <span className="text-[9px] font-normal font-mono opacity-80">by Market</span>
                </button>

                <button
                  onClick={() => {
                    setOrderType('BUY');
                    handlePlaceSimulatorOrder();
                  }}
                  className="py-4 bg-[var(--theme-primary-blue)] hover:opacity-90 text-white font-extrabold rounded-[14px] text-xs uppercase flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-[var(--theme-primary-blue)]/15 active:scale-[0.98] transition-all border border-[var(--theme-primary-blue)]/20"
                >
                  <span className="font-black">BUY</span>
                  <span className="text-[9px] font-normal font-mono opacity-80">by Market</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- NAVIGATION BOTTOM TAB BAR ---------------- */}

        {/* Navigation bottom bar menu (Visible on main views) */}
        {['quotes', 'charts', 'trade', 'history', 'settings'].includes(activeScreen) && (
          <nav className="h-14 flex items-center justify-around text-[9px] font-bold shrink-0 border-t bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-secondary-text)]">
            {[
              { id: 'quotes', icon: ArrowLeftRight, label: 'Quotes' },
              { id: 'charts', icon: Play, rotate: -90, label: 'Chart' },
              { id: 'trade', icon: TrendingUp, label: 'Trade' },
              { id: 'history', icon: Clock, label: 'History' },
              { id: 'settings', icon: User, label: 'Settings' }
            ].map((tab) => {
              const isActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreen(tab.id as any)}
                  className={`flex flex-col items-center gap-1.5 justify-center transition-colors relative w-[60px] h-10 rounded-full ${isActive ? 'text-[var(--theme-primary-blue)] bg-[var(--theme-primary-blue)]/10' : 'text-[var(--theme-secondary-text)] hover:text-[var(--theme-primary-blue)]'}`}
                >
                  <tab.icon className={`w-4 h-4 ${tab.rotate ? 'rotate-[-90deg]' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

      </div>

    </div>
  );
}
