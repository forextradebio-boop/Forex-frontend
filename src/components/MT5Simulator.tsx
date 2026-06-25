import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Search, ShieldAlert,
  User, Settings, Calendar, HelpCircle, Mail, Menu, Plus,
  Edit, PlusCircle, UserPlus, Play, Info, Download, Trash,
  RefreshCw, X, ChevronRight, Check, Send, Sparkles, BookOpen,
  ArrowLeftRight, MessageSquare, Terminal, Eye, EyeOff, RotateCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('ff_theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('ff_theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

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
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // Sync quotes when symbols list changes
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
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * vol * 0.3;
        const low = Math.min(open, close) - Math.random() * vol * 0.3;

        candles.push({
          time: curTime,
          open,
          high,
          low,
          close
        });

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

          // If last candle is older than 20 seconds, roll over and start a new candle!
          if (curTime - lastCandle.time > 20000) {
            symbolCandles.push({
              time: curTime,
              open: lastCandle.close,
              high: Math.max(lastCandle.close, sym.price),
              low: Math.min(lastCandle.close, sym.price),
              close: sym.price
            });
          } else {
            // Update current candle
            lastCandle.close = sym.price;
            if (sym.price > lastCandle.high) lastCandle.high = sym.price;
            if (sym.price < lastCandle.low) lastCandle.low = sym.price;
            symbolCandles[lastIndex] = { ...lastCandle };
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
    const candles = chartData[activeSymbolClean] || [];

    // Background pitch black (MT5 style)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (candles.length === 0) {
      ctx.fillStyle = '#777777';
      ctx.font = '12px sans-serif';
      ctx.fillText("Loading chart matrix...", width / 2 - 60, height / 2);
      return;
    }

    // Grid details (standard MT5 dotted grid)
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const rightMargin = 60;
    const bottomMargin = 25;
    const plotWidth = width - rightMargin;
    const plotHeight = height - bottomMargin;

    // Draw horizontal grids
    const gridRows = 8;
    for (let i = 1; i < gridRows; i++) {
      const y = (plotHeight / gridRows) * i;
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
      ctx.moveTo(x, 0);
      ctx.lineTo(x, plotHeight);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash

    // Determine min/max values for scaling
    // We only scale based on the candles currently visible in the viewport
    const maxVisibleCandles = Math.ceil(plotWidth / candleWidth);
    const startIndex = Math.max(0, candles.length - maxVisibleCandles - dragOffset);
    const endIndex = Math.max(0, candles.length - dragOffset);
    const visibleCandles = candles.slice(startIndex, endIndex);

    if (visibleCandles.length === 0) return;

    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));

    // Pad prices range slightly
    const padding = (maxPrice - minPrice) * 0.1 || 0.001;
    minPrice -= padding;
    maxPrice += padding;

    const scaleY = (price: number) => {
      return plotHeight - ((price - minPrice) / (maxPrice - minPrice)) * plotHeight;
    };

    // Draw Price Axis Labels (Right margin)
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridRows; i++) {
      const y = (plotHeight / gridRows) * i;
      const priceVal = maxPrice - (i / gridRows) * (maxPrice - minPrice);
      ctx.fillText(priceVal.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5), plotWidth + 5, y + 4);
    }

    // Draw Time Axis Labels & Dotted Vertical grid lines at bottom
    ctx.fillStyle = '#666666';
    ctx.font = '8.5px monospace';
    ctx.textAlign = 'center';
    const timeLabelStep = Math.max(1, Math.ceil(80 / candleWidth));

    // Draw Volume Bars (Background layer)
    visibleCandles.forEach((candle, idx) => {
      const x = plotWidth - (visibleCandles.length - idx) * candleWidth;
      if (x < 0 || x > plotWidth) return;

      // Draw volume bars at the bottom (opacity green/red)
      const candleRange = candle.high - candle.low || 0.0001;
      const simVolume = Math.min(plotHeight * 0.12, (candleRange / (maxPrice - minPrice)) * plotHeight * 0.25 + 5 + (idx % 3) * 2);
      const isUp = candle.close >= candle.open;
      ctx.fillStyle = isUp ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)';
      ctx.fillRect(x + 1, plotHeight - simVolume, candleWidth - 2, simVolume);

      // Draw time labels at the bottom
      if ((startIndex + idx) % timeLabelStep === 0) {
        const date = new Date(candle.time);
        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        ctx.fillStyle = '#666666';
        ctx.fillText(timeStr, x + candleWidth / 2, plotHeight + 14);

        // draw brief vertical dotted line to align time
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, 0);
        ctx.lineTo(x + candleWidth / 2, plotHeight);
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

      // Bullish = Hollow green or solid green, Bearish = solid red
      ctx.strokeStyle = isUp ? '#00E676' : '#FF1744';
      ctx.fillStyle = isUp ? 'transparent' : '#FF1744';
      ctx.lineWidth = 1.5;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // Body
      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
      const bodyY = Math.min(yOpen, yClose);

      if (isUp) {
        // MT5 bull candle: hollow green
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 1, bodyY, candleWidth - 2, bodyHeight);
        ctx.strokeRect(x + 1, bodyY, candleWidth - 2, bodyHeight);
      } else {
        // MT5 bear candle: solid red
        ctx.fillStyle = '#FF1744';
        ctx.fillRect(x + 1, bodyY, candleWidth - 2, bodyHeight);
      }
    });

    // Draw indicators (Simulated EMA 14)
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1;
    ctx.beginPath();

    visibleCandles.forEach((candle, idx) => {
      const x = plotWidth - (visibleCandles.length - idx) * candleWidth;
      if (x < 0) return;

      // Simple SMA overlay calculation
      const candleIndex = startIndex + idx;
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, candleIndex - 14); j <= candleIndex; j++) {
        sum += candles[j].close;
        count++;
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
    ctx.strokeStyle = '#1E88E5';
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

    ctx.strokeStyle = '#FF1744';
    ctx.beginPath();
    ctx.moveTo(0, yAsk);
    ctx.lineTo(plotWidth, yAsk);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Bid tag bubble
    ctx.fillStyle = '#1E88E5';
    ctx.fillRect(plotWidth, yLive - 8, rightMargin, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(currentPrice.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5), plotWidth + 4, yLive + 3);

    // Live Ask tag bubble
    ctx.fillStyle = '#FF1744';
    ctx.fillRect(plotWidth, yAsk - 8, rightMargin, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(askPrice.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5), plotWidth + 4, yAsk + 3);

  }, [chartData, selectedSymbol, candleWidth, dragOffset, isChartLandscape]);

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
    <div className={`app-container flex flex-col items-center justify-center min-h-dvh bg-black relative font-sans select-none overflow-hidden ${isLightMode ? 'light-theme' : ''}`}>

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
      <div className="phone-shell w-full h-dvh max-h-dvh relative overflow-hidden flex flex-col bg-black text-white">

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
            <div className="w-4/5 max-w-[300px] h-full bg-[#0d0d0f] border-r border-zinc-800 flex flex-col justify-between p-4 shadow-2xl relative">
              {/* Close button */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
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
                  <div className="w-12 h-12 rounded-full bg-[#1E88E5] text-white flex items-center justify-center font-bold text-xl relative">
                    <User className="w-6 h-6" />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border border-[#0d0d0f]">
                      <Plus className="w-2.5 h-2.5 text-black" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    {authUser ? (
                      <>
                        <h4 className="font-bold text-sm text-white max-w-[170px] truncate leading-none pt-1">{authUser.fullName}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono">Server: {brokerServer}</p>
                        <p className="text-[10px] text-[#1E88E5] font-black uppercase tracking-wider">Leverage 1:500</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-sm text-white leading-tight">Login to existing account or open demo</h4>
                        <button className="mt-1 px-3 py-1 bg-[#1E88E5] hover:bg-blue-600 text-white rounded-full font-bold text-[10px] tracking-wide uppercase transition-colors">
                          Get started
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <hr className="border-zinc-800/80" />

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
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 text-zinc-300 hover:text-white transition-colors text-xs font-semibold"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-zinc-500" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${item.id === 'mailbox' ? 'bg-red-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>
                          {item.badge}
                        </span>
                      )}
                      {item.ad && (
                        <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[8px] font-bold scale-90">
                          Ads
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Currency + Finance shortcuts in drawer */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest px-1">Base Currency</p>
                <div className="grid grid-cols-4 gap-1">
                  {(['INR', 'USD', 'USDT', 'EUR', 'GBP', 'BTC', 'ETH'] as const).map(cur => (
                    <button
                      key={cur}
                      onClick={() => { handleSetCurrency(cur); }}
                      className={`py-1.5 rounded-lg text-[8px] font-extrabold transition-all ${preferredCurrency === cur
                          ? 'bg-[#1E88E5] text-white border border-[#1E88E5]'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsDrawerOpen(false); setActiveScreen('deposit'); }}
                    className="flex-1 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-extrabold hover:bg-emerald-500/25 transition-all"
                  >
                    ⬆ Deposit
                  </button>
                  <button
                    onClick={() => { setIsDrawerOpen(false); setActiveScreen('withdraw'); }}
                    className="flex-1 py-2 bg-zinc-800/80 border border-zinc-700 text-zinc-300 rounded-lg text-[9px] font-extrabold hover:bg-zinc-700 transition-all"
                  >
                    ⬇ Withdraw
                  </button>
                </div>
              </div>

              {/* Drawer footer (secure logout or APK download) */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={handleDownloadAPK}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-extrabold rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <Download className="w-4 h-4" /> Download APK app
                </button>

                {authUser && (
                  <button
                    onClick={() => {
                      if (confirm("Disconnect MT5 account session?")) {
                        logout();
                        setIsDrawerOpen(false);
                        setActiveScreen('quotes');
                      }
                    }}
                    className="w-full py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800/80 text-rose-500 font-bold rounded-lg text-xs transition-colors"
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
          <div className="absolute inset-0 top-8 bg-[#000000] z-40 flex flex-col animate-slide-up text-left">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
              <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> Market News Feed</h3>
              <button onClick={() => setIsNewsOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
              {newsList.map((n, idx) => (
                <div key={idx} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{n.category || 'MARKETS'}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{new Date().toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-xs text-white leading-snug">{n.title || n.headline}</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal">{n.summary || n.content}</p>
                </div>
              ))}
              {newsList.length === 0 && (
                <div className="text-center py-10 text-zinc-650 text-xs">No active news feeds streamed.</div>
              )}
            </main>
          </div>
        )}

        {/* Dynamic Economic Calendar overlay */}
        {isCalendarOpen && (
          <div className="absolute inset-0 top-8 bg-[#000000] z-40 flex flex-col animate-slide-up text-left">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
              <h3 className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> Economic Calendar</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {calendarList.map((event, idx) => (
                <div key={idx} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white font-mono">{event.time || '14:30'}</span>
                      <span className="text-[8px] bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.2 rounded border border-zinc-700">{event.currency || 'USD'}</span>
                    </div>
                    <p className="text-[10px] text-zinc-200 font-bold leading-tight">{event.event}</p>
                  </div>
                  <div className="text-right space-y-0.5 font-mono text-[9px]">
                    <div><span className="text-zinc-500">Actual: </span><span className="text-white font-bold">{event.actual || '-'}</span></div>
                    <div><span className="text-zinc-500">Forecast: </span><span className="text-zinc-400">{event.forecast || '-'}</span></div>
                    <div><span className="text-zinc-500">Previous: </span><span className="text-zinc-400">{event.previous || '-'}</span></div>
                  </div>
                </div>
              ))}
              {calendarList.length === 0 && (
                <div className="text-center py-10 text-zinc-650 text-xs font-semibold">No upcoming events listed.</div>
              )}
            </main>
          </div>
        )}

        {/* Dynamic Journal Console log overlay */}
        {isJournalOpen && (
          <div className="absolute inset-0 top-8 bg-[#000000] z-40 flex flex-col animate-slide-up text-left">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
              <h3 className="font-bold text-sm flex items-center gap-2"><Terminal className="w-4 h-4 text-[#1E88E5]" /> Terminal System Logs</h3>
              <button onClick={() => setIsJournalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 bg-[#050506] font-mono text-[9px] text-zinc-400 space-y-2">
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
          <div className="flex-1 flex flex-col notch-padding bg-[#050506] overflow-y-auto">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 bg-[#050506]/90 backdrop-blur z-10">
              <button onClick={() => setIsDrawerOpen(true)} className="p-1 text-zinc-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
              <h3 className="font-extrabold text-sm text-white">Settings</h3>
              <div className="w-6" />
            </header>

            <div className="p-4 space-y-6">
              {/* Profile Card */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1E88E5]/20 flex items-center justify-center text-[#1E88E5] font-bold text-xl border border-[#1E88E5]/30">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base leading-tight">{authUser?.fullName || 'Demo Account'}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{authUser?.email || 'No email attached'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase rounded-full">
                    {authUser ? 'Live Trading' : 'Simulated'}
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest px-1">Preferences</p>
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/50">

                  {/* Theme Toggle */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white">Light Theme</h5>
                        <p className="text-[10px] text-zinc-500 font-sans">Toggle bright visuals (Beta)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsLightMode(!isLightMode)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${isLightMode ? 'bg-indigo-500' : 'bg-zinc-700'}`}
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
                        <h5 className="font-bold text-sm text-white">One-Click Trading</h5>
                        <p className="text-[10px] text-zinc-500 font-sans">Bypass confirmation screens</p>
                      </div>
                    </div>
                    <button className="w-11 h-6 rounded-full relative transition-colors bg-[#1E88E5]">
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform translate-x-5" />
                    </button>
                  </div>

                  {/* Sounds */}
                  <div className="p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Play className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white">Order Sounds</h5>
                        <p className="text-[10px] text-zinc-500 font-sans">Audio cues on fills</p>
                      </div>
                    </div>
                    <button className="w-11 h-6 rounded-full relative transition-colors bg-zinc-700">
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform translate-x-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Server Info */}
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest px-1">Network</p>
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-white">Ping: <span className="text-emerald-400">12ms</span></p>
                    <p className="font-mono text-[9px] text-zinc-500">Host: {brokerServer}</p>
                  </div>
                  <RefreshCw className="w-4 h-4 text-zinc-600" />
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
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-md font-extrabold text-white">Quotes</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsDetailedMode(!isDetailedMode);
                  }}
                  className={`p-1.5 rounded transition ${isDetailedMode ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Toggle Simple/Detailed mode"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveScreen('brokers')}
                  className="p-1.5 text-zinc-400 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Symbols List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 bg-black">
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

                const bidFlashClass = bidFlash === 'up'
                  ? 'bg-blue-500/10 text-[#2196F3] transition-colors duration-150'
                  : bidFlash === 'down'
                    ? 'bg-red-500/10 text-[#F44336] transition-colors duration-150'
                    : 'text-zinc-200';

                const askFlashClass = askFlash === 'up'
                  ? 'bg-blue-500/10 text-[#2196F3] transition-colors duration-150'
                  : askFlash === 'down'
                    ? 'bg-red-500/10 text-[#F44336] transition-colors duration-150'
                    : 'text-zinc-200';

                return (
                  <div
                    key={sym.symbol}
                    onClick={() => {
                      setQuoteMenuSymbol(sym);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-zinc-950/80 cursor-pointer active:bg-zinc-900 transition-colors text-left"
                  >
                    {/* Pair Info */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm tracking-tight text-white">{sym.symbol.replace('/', '')}</h4>
                      <p className="text-[9px] text-zinc-500 font-mono">11:13:05</p>
                      {isDetailedMode && (
                        <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 font-mono">
                          <span>Spread: {spread}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Columns */}
                    <div className="flex items-center gap-5 text-right font-mono">
                      {/* Bid Column */}
                      <div className="space-y-1">
                        <div className={`px-1.5 py-0.5 rounded text-xs font-semibold flex items-baseline ${bidFlashClass}`}>
                          <span className="text-[10px] opacity-70">{parsedPrice.prefix}</span>
                          <span className="text-sm font-black leading-none">{parsedPrice.big}</span>
                          <span className="text-[9px] align-super font-semibold leading-none opacity-80">{parsedPrice.pipette}</span>
                        </div>
                        {isDetailedMode && (
                          <div className="text-[8.5px] text-zinc-500">L: {lowPrice.toFixed(isYen ? 2 : 5)}</div>
                        )}
                      </div>

                      {/* Ask Column */}
                      <div className="space-y-1">
                        <div className={`px-1.5 py-0.5 rounded text-xs font-semibold flex items-baseline ${askFlashClass}`}>
                          <span className="text-[10px] opacity-70">{parsedAsk.prefix}</span>
                          <span className="text-sm font-black leading-none">{parsedAsk.big}</span>
                          <span className="text-[9px] align-super font-semibold leading-none opacity-80">{parsedAsk.pipette}</span>
                        </div>
                        {isDetailedMode && (
                          <div className="text-[8.5px] text-zinc-500">H: {highPrice.toFixed(isYen ? 2 : 5)}</div>
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
                <div className="bg-[#0e0e11] border-t border-zinc-800 rounded-t-3xl p-4 space-y-1.5 z-10 text-left animate-slide-up">
                  <h3 className="font-black text-sm text-zinc-200 border-b border-zinc-850 pb-2 mb-2 flex items-center justify-between">
                    <span>{quoteMenuSymbol.symbol.replace('/', '')} options</span>
                    <button
                      onClick={() => setQuoteMenuSymbol(null)}
                      className="text-zinc-500 hover:text-white"
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
                    { label: 'Cancel', action: () => setQuoteMenuSymbol(null), style: 'text-zinc-500' }
                  ].map((opt, i) => (
                    <button
                      key={i}
                      onClick={opt.action}
                      className={`w-full py-3.5 hover:bg-zinc-850 px-3 rounded-lg text-xs font-bold text-zinc-300 transition-colors ${opt.style || ''}`}
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
              backgroundColor: '#000000'
            } : {}}
            className="flex-1 flex flex-col notch-padding overflow-hidden h-full"
          >
            {/* Charts Header - Improved */}
            <header className="h-14 border-b border-zinc-800/80 flex items-center justify-between px-3 bg-[#0a0a0c]/95 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white tracking-wide">{selectedSymbol}</span>
                    <span className="text-[8px] text-[#1E88E5] font-black tracking-widest bg-blue-500/15 px-1.5 py-0.5 rounded-md border border-blue-500/25">{chartTimeframe}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-zinc-500">{selectedSymbolData?.name || 'Spot currency pair'}</span>
                    {selectedSymbolData && (
                      <span className={`text-[9px] font-bold ${selectedSymbolData.price >= (selectedSymbolData.openPrice ?? selectedSymbolData.open ?? selectedSymbolData.price) ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {selectedSymbolData.price.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 3 : 5)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Timeframe Pills */}
                <div className="flex items-center gap-0.5 bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5">
                  {['M5', 'M15', 'H1', 'H4', 'D1'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition-all ${chartTimeframe === tf
                          ? 'bg-[#1E88E5] text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-200'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsChartLandscape(!isChartLandscape)}
                  className={`p-1.5 rounded-lg transition-all ${isChartLandscape ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'
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
                  className="p-1.5 rounded-lg bg-[#1E88E5]/15 text-[#1E88E5] border border-[#1E88E5]/25 hover:bg-[#1E88E5]/25 transition-all"
                  title="New order"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Live Chart Drawing Canvas Area */}
            <div
              className="flex-1 w-full relative select-none cursor-crosshair bg-black overflow-hidden"
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

              {/* One-Click Trading Panel - Improved */}
              <div className="absolute top-3 left-3 flex items-center bg-black/75 backdrop-blur-md border border-zinc-700/60 rounded-xl p-1.5 gap-1.5 shadow-2xl select-none z-10">
                {/* Sell Box */}
                <button
                  onClick={() => handleOneClickTrade('SELL')}
                  className="px-3 py-1.5 bg-gradient-to-b from-[#FF1744] to-[#c62828] hover:from-[#ff3d5a] hover:to-[#d32f2f] text-white font-extrabold rounded-lg flex flex-col items-center leading-none justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-red-900/30"
                >
                  <span className="text-[6.5px] font-sans font-bold uppercase tracking-widest opacity-80 mb-0.5">SELL</span>
                  <span className="text-[9px] font-black tabular-nums">
                    {selectedSymbolData ? selectedSymbolData.price.toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5) : '0.00000'}
                  </span>
                </button>

                {/* Lot size input */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[6px] text-zinc-600 uppercase tracking-wider">Lots</span>
                  <input
                    type="number"
                    step="0.01"
                    value={oneClickLots}
                    onChange={(e) => setOneClickLots(e.target.value)}
                    className="w-9 text-center bg-zinc-900/80 border border-zinc-700 text-zinc-100 font-bold rounded-lg py-1 px-0.5 focus:outline-none focus:border-blue-500 text-[9px]"
                  />
                </div>

                {/* Buy Box */}
                <button
                  onClick={() => handleOneClickTrade('BUY')}
                  className="px-3 py-1.5 bg-gradient-to-b from-[#1E88E5] to-[#1565c0] hover:from-[#2196f3] hover:to-[#1976d2] text-white font-extrabold rounded-lg flex flex-col items-center leading-none justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/30"
                >
                  <span className="text-[6.5px] font-sans font-bold uppercase tracking-widest opacity-80 mb-0.5">BUY</span>
                  <span className="text-[9px] font-black tabular-nums">
                    {selectedSymbolData ? (selectedSymbolData.price + (selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 0.025 : 0.00015)).toFixed(selectedSymbol.includes('JPY') || selectedSymbol.includes('RUB') ? 2 : 5) : '0.00000'}
                  </span>
                </button>
              </div>

              {/* One-Click success overlay */}
              {oneClickSuccess && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-blue-600/90 border border-blue-500 text-white font-bold text-[9px] px-3.5 py-1.5 rounded-full shadow-2xl animate-fade-in z-20 font-sans tracking-wide">
                  {oneClickSuccess}
                </div>
              )}

              {/* Float OHLC dashboard Overlay - top right, glassmorphism */}
              <div className="absolute top-3 right-3 bg-black/65 backdrop-blur-md border border-zinc-700/40 px-2.5 py-2 rounded-xl text-[8px] font-mono pointer-events-none text-left shadow-xl">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <span className="text-zinc-600">O</span><span className="text-zinc-300 tabular-nums">{(chartData[selectedSymbol]?.slice(-1)[0]?.open ?? 1.1360).toFixed(5)}</span>
                  <span className="text-zinc-600">H</span><span className="text-emerald-400 tabular-nums">{(chartData[selectedSymbol]?.slice(-1)[0]?.high ?? 1.1360).toFixed(5)}</span>
                  <span className="text-zinc-600">L</span><span className="text-red-400 tabular-nums">{(chartData[selectedSymbol]?.slice(-1)[0]?.low ?? 1.1360).toFixed(5)}</span>
                  <span className="text-zinc-600">C</span><span className="text-zinc-300 tabular-nums">{(chartData[selectedSymbol]?.slice(-1)[0]?.close ?? 1.1360).toFixed(5)}</span>
                </div>
              </div>

              {/* Canvas chart zoom adjustments controls - improved */}
              <div className="absolute right-3 bottom-5 flex flex-col gap-1 z-10">
                <button
                  onClick={() => setCandleWidth(prev => Math.min(18, prev + 1))}
                  className="w-8 h-8 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/60 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-lg flex items-center justify-center font-bold text-base transition-all active:scale-95"
                >
                  +
                </button>
                <button
                  onClick={() => setCandleWidth(prev => Math.max(3, prev - 1))}
                  className="w-8 h-8 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/60 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-lg flex items-center justify-center font-bold text-base transition-all active:scale-95"
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
              backgroundColor: '#000000'
            } : {}}
            className="flex-1 flex flex-col notch-padding overflow-hidden min-h-0"
          >
            {/* Trade Header - with Deposit/Withdraw */}
            <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="leading-none">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-extrabold text-white">Trade</h2>
                    <span className={`text-[7px] px-1.5 py-0.5 font-black uppercase tracking-widest rounded-full border ${authUser
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : 'bg-blue-500/10 border-blue-500/25 text-[#1E88E5]'
                      }`}>
                      {authUser ? 'LIVE' : 'DEMO'}
                    </span>
                    <span className="text-[7px] px-1.5 py-0.5 font-black uppercase tracking-widest rounded-full border border-zinc-700 text-zinc-400 bg-zinc-900">
                      {preferredCurrency}
                    </span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mt-0.5 font-mono">{brokerServer}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveScreen('deposit')}
                  className="px-2.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-extrabold hover:bg-emerald-500/25 transition-all flex items-center gap-1"
                >
                  <span>⬆</span> Deposit
                </button>
                <button
                  onClick={() => setActiveScreen('withdraw')}
                  className="px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 rounded-lg text-[9px] font-extrabold hover:bg-zinc-700/60 transition-all flex items-center gap-1"
                >
                  <span>⬇</span> Withdraw
                </button>
                <button
                  onClick={() => setActiveScreen('order-entry')}
                  className="p-1.5 rounded-lg bg-[#1E88E5]/15 text-[#1E88E5] border border-[#1E88E5]/25 hover:bg-[#1E88E5]/25 transition-all"
                  title="New order placement"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Main Area */}
            {!isTradeLandscape ? (
              /* PORTRAIT LAYOUT */
              <div className="flex-1 overflow-y-auto bg-black text-left">
                <div className="flex flex-col h-full">
                  {/* Real-time Account Balance Box */}
                  <div className="p-4 bg-zinc-950 border-b border-zinc-900 space-y-2 flex flex-col">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{authUser ? 'Live floating profit' : 'Demo floating profit'}</span>
                      <span className={`text-md font-black font-mono ${displayWallet.pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {displayWallet.pnl >= 0 ? '+' : ''}{toCurrency(displayWallet.pnl ?? 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-400 border-t border-zinc-900/50 pt-2 font-mono">
                      <div>Balance: <span className="text-white font-bold">{toCurrency(displayWallet.balance ?? 0)}</span></div>
                      <div>Equity: <span className="text-white font-bold">{toCurrency(liveEquity ?? 0)}</span></div>
                      <div>Free margin: <span className="text-white font-bold">{toCurrency(liveFreeMargin ?? 0)}</span></div>
                      <div>Margin level (%): <span className="text-white font-bold">{(marginLevelPercent ?? 0).toFixed(2)}%</span></div>
                    </div>
                  </div>

                  {/* Open Positions list header */}
                  <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-950/40 text-[9px] font-black text-zinc-500 uppercase tracking-widest flex justify-between items-center">
                    <span>Positions List ({activePositions.length})</span>
                    {!authUser && <span className="text-[8px] bg-blue-500/20 text-[#1E88E5] border border-blue-500/30 px-1.5 py-0.2 rounded-full font-bold uppercase">Demo Active</span>}
                  </div>

                  {/* Positions */}
                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
                    {activePositions.map((pos) => {
                      const isBuy = pos.side === 'BUY';
                      return (
                        <div
                          key={pos.id}
                          onClick={() => setPositionToClose(pos)}
                          className="p-3.5 flex items-center justify-between hover:bg-zinc-950 active:bg-zinc-900 cursor-pointer transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-white">{pos.symbol.replace('/', '')}</span>
                              <span className={`text-[8px] font-black px-1.5 rounded ${isBuy ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
                                {pos.side} {pos.size.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[9px] text-zinc-500 font-mono">
                              {pos.entryPrice.toFixed(5)} → {pos.currentPrice.toFixed(5)}
                            </div>
                          </div>

                          <div className={`font-mono text-xs font-black ${pos.pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {pos.pnl >= 0 ? '+' : ''}{toCurrency(pos.pnl)}
                          </div>
                        </div>
                      );
                    })}

                    {activePositions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-zinc-600 font-bold space-y-4">
                        <ShieldAlert className="w-10 h-10 opacity-30" />
                        <span className="text-xs">No active open positions.</span>
                        <button
                          onClick={() => setActiveScreen('deposit')}
                          className="mt-2 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-extrabold hover:bg-emerald-500/25 transition-all"
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
              <div className="flex-1 flex flex-row min-h-0 overflow-hidden bg-black text-left text-zinc-350">
                {/* Left Panel: Account Status */}
                <div className="w-[32%] min-w-[220px] border-r border-zinc-900 bg-zinc-950/40 p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-3.5">
                    {/* Server status indicator */}
                    <div className="flex items-center gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/30" />
                      <div className="leading-none space-y-1">
                        <p className="text-[10px] font-bold text-white font-mono">{brokerServer}</p>
                        <p className="text-[8px] text-zinc-500 tracking-wider">SECURE INST. SERVER</p>
                      </div>
                    </div>

                    {/* Floating P&L Card */}
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-850 p-3 rounded-2xl space-y-1 shadow-lg">
                      <span className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Unrealized profit/loss</span>
                      <h3 className={`text-xl font-black font-mono tracking-tight ${displayWallet.pnl >= 0 ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.15)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.15)]'}`}>
                        {displayWallet.pnl >= 0 ? '+' : ''}{(displayWallet.pnl ?? 0).toFixed(2)} USD
                      </h3>
                    </div>

                    {/* Metrics grid */}
                    <div className="space-y-2.5 font-mono text-[9.5px]">
                      <div className="flex justify-between items-center bg-zinc-900/20 p-2 rounded border border-zinc-900/40">
                        <span className="text-zinc-500">Balance:</span>
                        <span className="text-white font-bold">${(displayWallet.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-900/20 p-2 rounded border border-zinc-900/40">
                        <span className="text-zinc-500">Equity:</span>
                        <span className="text-zinc-100 font-bold">${(liveEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-900/20 p-2 rounded border border-zinc-900/40">
                        <span className="text-zinc-500">Free margin:</span>
                        <span className="text-zinc-100 font-bold">${(liveFreeMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-900/20 p-2 rounded border border-zinc-900/40">
                        <span className="text-zinc-500">Margin level:</span>
                        <span className={`font-bold ${marginLevelPercent >= 100 || marginLevelPercent === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(marginLevelPercent ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leverage display */}
                  <div className="text-[8.5px] font-bold text-zinc-600 bg-zinc-900/40 py-2 px-3 border border-zinc-900/80 rounded-xl text-center flex items-center justify-between font-sans">
                    <span>Leverage Account Limit</span>
                    <span className="text-[#1E88E5] font-mono">1:500</span>
                  </div>
                </div>

                {/* Right Panel: Tabular Positions Grid */}
                <div className="flex-1 p-4 bg-[#050506] flex flex-col min-h-0 overflow-y-auto">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between font-sans">
                    <span>Active trade orders ({activePositions.length})</span>
                    {!authUser && <span className="text-[8px] bg-blue-500/20 text-[#1E88E5] px-2 py-0.5 rounded border border-blue-500/20">DEMO PRACTICE MODE</span>}
                  </h3>

                  {/* Header Row */}
                  {activePositions.length > 0 ? (
                    <div className="flex flex-col min-h-0 flex-1">
                      {/* Grid header labels */}
                      <div className="grid grid-cols-8 gap-2 pb-2 text-[8px] font-bold text-zinc-500 uppercase font-mono tracking-wider border-b border-zinc-900 pl-2">
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
                      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 pl-2">
                        {activePositions.map((pos) => {
                          const isBuy = pos.side === 'BUY';
                          return (
                            <div
                              key={pos.id}
                              onClick={() => setPositionToClose(pos)}
                              className="grid grid-cols-8 gap-2 py-3 text-[10px] font-mono hover:bg-zinc-900/35 transition-colors cursor-pointer items-center pr-2"
                            >
                              <span className="font-extrabold text-white font-sans">{pos.symbol.replace('/', '')}</span>
                              <span>
                                <span className={`px-1.5 py-0.2 rounded font-black text-[8px] ${isBuy ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                                  {pos.side}
                                </span>
                              </span>
                              <span className="text-zinc-200 font-bold">{pos.size.toFixed(2)}</span>
                              <span className="text-zinc-400">{pos.entryPrice.toFixed(5)}</span>
                              <span className="text-zinc-400">{pos.currentPrice.toFixed(5)}</span>
                              <span className={pos.slPrice ? 'text-rose-400' : 'text-zinc-600'}>
                                {pos.slPrice ? pos.slPrice.toFixed(5) : '0.00000'}
                              </span>
                              <span className={pos.tpPrice ? 'text-blue-400' : 'text-zinc-600'}>
                                {pos.tpPrice ? pos.tpPrice.toFixed(5) : '0.00000'}
                              </span>
                              <span className={`text-right font-black pr-2 ${pos.pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-650 font-bold space-y-3 font-sans">
                      <ShieldAlert className="w-10 h-10 opacity-20" />
                      <span className="text-xs">No active trade positions found on broker.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rotated landscape tab navigation bar inside Trade screen container */}
            {isTradeLandscape && (
              <nav className="h-14 border-t border-zinc-900 bg-zinc-950 flex items-center justify-around text-[9px] font-bold text-zinc-500 shrink-0 select-none">
                {[
                  { id: 'quotes', icon: ArrowLeftRight, label: 'Quotes' },
                  { id: 'charts', icon: Play, rotate: -90, label: 'Charts' },
                  { id: 'trade', icon: TrendingUp, label: 'Trade' },
                  { id: 'history', icon: Clock, label: 'History' },
                  { id: 'messages', icon: MessageSquare, label: 'Messages', badge: '8' }
                ].map((tab) => {
                  const isActive = activeScreen === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveScreen(tab.id as any);
                        setIsTradeLandscape(false); // rotate back to portrait when navigating out
                      }}
                      className={`flex flex-col items-center gap-1.5 flex-1 h-full justify-center transition-colors relative ${isActive ? 'text-[#1E88E5]' : 'hover:text-zinc-350'}`}
                    >
                      <tab.icon className={`w-4 h-4 ${tab.rotate ? 'rotate-[-90deg]' : ''}`} />
                      <span>{tab.label}</span>
                      {tab.id === 'messages' && (
                        <span className="absolute top-2 right-12 bg-red-500 text-white rounded-full text-[7px] font-bold w-3 h-3 flex items-center justify-center">
                          8
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Position details & close popup modal */}
            {positionToClose && (
              <div className="absolute inset-0 bg-black/60 z-[10000] flex flex-col justify-end animate-fade-in text-left">
                <div className="absolute inset-0" onClick={() => setPositionToClose(null)} />
                <div className="bg-[#0e0e11] border-t border-zinc-800 rounded-t-3xl p-5 space-y-4 z-[10001] animate-slide-up max-w-md mx-auto w-full">
                  <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-2">
                        {positionToClose.symbol.replace('/', '')}
                        <span className={`text-[8.5px] font-black px-1.5 rounded ${positionToClose.side === 'BUY' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                          {positionToClose.side} {positionToClose.size.toFixed(2)}
                        </span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Ticket ID: {positionToClose.id}</p>
                    </div>
                    <button onClick={() => setPositionToClose(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-850 pb-3">
                    <div className="text-zinc-500">Opening price: <span className="text-white font-mono font-bold block">{positionToClose.entryPrice.toFixed(5)}</span></div>
                    <div className="text-zinc-500">Current quote price: <span className="text-white font-mono font-bold block">{positionToClose.currentPrice.toFixed(5)}</span></div>
                  </div>

                  {/* Actions list */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleCloseActivePosition}
                      className={`w-full py-4 text-center text-xs font-black rounded-xl uppercase flex items-center justify-center gap-1.5 shadow-lg transition-colors ${positionToClose.pnl >= 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/15' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/15'}`}
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
                      className="w-full py-3 hover:bg-zinc-850 text-zinc-300 font-bold rounded-xl text-xs uppercase transition-colors"
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
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1 rounded text-zinc-300 hover:text-white"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-md font-extrabold text-white">History</h2>
              </div>
              <div className="flex items-center gap-3.5">
                <button className="text-zinc-400 hover:text-white"><ArrowLeftRight className="w-4 h-4" /></button>
                <button className="text-zinc-400 hover:text-white"><Calendar className="w-4 h-4" /></button>
              </div>
            </header>

            {/* History List */}
            <div className="flex-1 overflow-y-auto bg-black text-left">
              <div className="flex flex-col h-full divide-y divide-zinc-900">
                {/* Overview Stats card */}
                <div className="p-4 bg-zinc-950/60 grid grid-cols-3 gap-4 text-center border-b border-zinc-900">
                  <div>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-0.5 font-sans">Deposits</p>
                    <p className="font-mono text-[11px] font-bold text-white">${historyStats.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-0.5 font-sans">Withdrawals</p>
                    <p className="font-mono text-[11px] font-bold text-white">${historyStats.withdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-0.5 font-sans">Net Profit</p>
                    <p className={`font-mono text-[11px] font-bold ${historyStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-450 text-rose-400'}`}>
                      {historyStats.netProfit >= 0 ? '+' : ''}${historyStats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* List items */}
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 font-sans text-xs">
                  {displayHistory.map((item, idx) => {
                    const isDeposit = item.type === 'DEPOSIT';
                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-zinc-950 transition-colors">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white flex items-center gap-1.5">
                            {isDeposit ? 'Balance Deposit' : `${item.symbol} closed position`}
                            {!isDeposit && (
                              <span className={`text-[8px] font-black px-1 rounded ${item.type === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                {item.type} {item.size?.toFixed(2)}
                              </span>
                            )}
                          </h4>
                          <p className="text-[9px] text-zinc-500 font-mono">
                            {isDeposit ? item.date : `${item.entryPrice?.toFixed(5)} → ${item.closePrice?.toFixed(5)} | ${item.date}`}
                          </p>
                        </div>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-450 text-rose-400'}`}>
                          {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {displayHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-600 font-bold space-y-3">
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
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1 rounded text-zinc-300 hover:text-white"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-md font-extrabold text-white">Mailbox</h2>
              </div>
              <button className="text-zinc-400 hover:text-white"><Trash className="w-4 h-4" /></button>
            </header>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto bg-black text-left">
              <div className="divide-y divide-zinc-900 font-sans text-xs">
                {[
                  { sender: 'Forex Factory Admin', subject: 'KYC Document Verification Required', body: 'Please upload valid government credentials to unlock standard leverages and withdraw limits.', date: 'June 25, 2026', unread: true },
                  { sender: 'MT5 Broker Host', subject: 'Leverage adjusted to 1:500', body: 'Per portfolio margins risk evaluations, your leverage configurations have been updated to 1:500.', date: 'June 24, 2026', unread: true },
                  { sender: 'Forex Factory Security', subject: 'Session Login from London, UK', body: 'We registered a secure credential verification at 14:02 UTC. If this was not you, toggle your profile passcode.', date: 'June 23, 2026', unread: false },
                  { sender: 'Liquidity Provider', subject: 'EURUSD spreads adjusted to Institutional raw limits', body: 'Raw institutional Spreads limits have been successfully benchmarked across all currencies spot pairs.', date: 'June 22, 2026', unread: false }
                ].map((mail, idx) => (
                  <div key={idx} className={`p-4 hover:bg-zinc-950 transition-colors flex items-start justify-between gap-4 cursor-pointer ${mail.unread ? 'bg-zinc-900/10' : ''}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {mail.unread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />}
                        <h4 className={`font-bold ${mail.unread ? 'text-white' : 'text-zinc-400'}`}>{mail.sender}</h4>
                      </div>
                      <p className="font-extrabold text-[10px] text-zinc-200">{mail.subject}</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-normal">{mail.body}</p>
                    </div>
                    <span className="text-[8px] text-zinc-600 shrink-0 font-mono">{mail.date}</span>
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
          <div className="flex-1 flex flex-col bg-black overflow-y-auto">
            {/* Animated gradient header */}
            <div className="relative px-5 pt-12 pb-8 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/8 via-blue-500/5 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Logo mark */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 relative">
                <span className="text-3xl font-black text-black">F</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1E88E5] rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-white text-[7px] font-black">✓</span>
                </span>
              </div>

              <h1 className="text-xl font-black text-white mb-1">Welcome to Forex Factory</h1>
              <p className="text-xs text-zinc-400 font-sans max-w-[220px] mx-auto leading-relaxed">
                Your account is ready. Choose how you want to start trading.
              </p>
            </div>

            {/* Options */}
            <div className="px-5 space-y-3 flex-1">

              {/* Demo Card */}
              <button
                onClick={() => setActiveScreen('quotes')}
                className="w-full text-left p-4 bg-[#0a0a12] border border-[#1E88E5]/30 rounded-2xl hover:border-[#1E88E5]/60 hover:bg-blue-500/5 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E88E5]/15 border border-[#1E88E5]/25 flex items-center justify-center shrink-0 group-hover:bg-[#1E88E5]/25 transition-all">
                    <span className="text-[#1E88E5] text-lg">🎮</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">Try Demo Trading</h3>
                      <span className="text-[7px] bg-[#1E88E5]/15 text-[#1E88E5] border border-[#1E88E5]/25 px-1.5 py-0.5 rounded-full font-black uppercase">FREE</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">Practice with ₹1,00,000 virtual balance. No risk. All features unlocked.</p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> ₹1,00,000 virtual</span>
                      <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Real market prices</span>
                    </div>
                  </div>
                  <span className="text-zinc-600 text-lg mt-1">›</span>
                </div>
              </button>

              {/* Real Deposit Card */}
              <button
                onClick={() => setActiveScreen('deposit')}
                className="w-full text-left p-4 bg-gradient-to-br from-emerald-500/8 to-teal-500/5 border border-emerald-500/30 rounded-2xl hover:border-emerald-500/60 hover:from-emerald-500/12 hover:to-teal-500/8 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-all">
                    <span className="text-emerald-400 text-lg">💰</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">Deposit & Trade Real</h3>
                      <span className="text-[7px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-black uppercase">LIVE</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">Fund your account and start trading real markets. Withdraw profits anytime.</p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> BTC, ETH, USDT</span>
                      <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> INR / UPI</span>
                      <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> USD, EUR</span>
                    </div>
                  </div>
                  <span className="text-zinc-600 text-lg mt-1">›</span>
                </div>
              </button>

              {/* Currency Preference */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-3">Choose Your Base Currency</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['INR', 'USD', 'USDT', 'EUR', 'GBP', 'BTC', 'ETH'] as const).map(cur => (
                    <button
                      key={cur}
                      onClick={() => handleSetCurrency(cur)}
                      className={`py-1.5 rounded-xl text-[9px] font-black transition-all ${preferredCurrency === cur
                          ? 'bg-[#1E88E5] text-white shadow-lg shadow-blue-900/30 border border-[#1E88E5]'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-zinc-600 mt-2 font-sans">Charts, balances & P&L will display in {preferredCurrency}</p>
              </div>
            </div>

            {/* Skip link */}
            <div className="text-center py-6">
              <button
                onClick={() => setActiveScreen('quotes')}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
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
            GBP: { min: '£10', address: 'Sort: 20-00-00, Acc: 12345678', network: ['Faster Payments'], icon: '£', note: 'Faster Payments, usually instant.' },
          };

          const cur = DEPOSIT_OPTIONS[depositCurrency] || DEPOSIT_OPTIONS['USDT'];
          const nets = cur.network;
          const activeNet = nets.includes(depositNetwork) ? depositNetwork : nets[0];

          const handleCopy = () => {
            navigator.clipboard.writeText(cur.address).then(() => {
              setCopiedAddress(true);
              setTimeout(() => setCopiedAddress(false), 2000);
            });
          };

          return (
            <div className="flex-1 flex flex-col bg-black min-h-0">
              {/* Header */}
              <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/90 shrink-0">
                <button onClick={() => { setActiveScreen('trade'); setDepositSubmitted(false); }} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="font-extrabold text-sm text-white">Deposit Funds</h3>
                <div className="w-7" />
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {depositSubmitted ? (
                  /* Success state */
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
                      <span className="text-3xl">✓</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base">Payment Submitted!</h3>
                    <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed">
                      Your deposit is under review. Balance will be credited within 15–30 minutes after confirmation.
                    </p>
                    <button
                      onClick={() => { setActiveScreen('trade'); setDepositSubmitted(false); }}
                      className="mt-2 px-6 py-2.5 bg-[#1E88E5] text-white text-xs font-extrabold rounded-xl"
                    >
                      Back to Trade
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Currency Selector */}
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">Select Deposit Currency</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {Object.keys(DEPOSIT_OPTIONS).map(c => (
                          <button
                            key={c}
                            onClick={() => { setDepositCurrency(c); setDepositNetwork(DEPOSIT_OPTIONS[c].network[0]); }}
                            className={`py-2 rounded-xl text-[9px] font-extrabold flex flex-col items-center gap-0.5 transition-all ${depositCurrency === c
                                ? 'bg-[#1E88E5] text-white border border-[#1E88E5] shadow-lg shadow-blue-900/30'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                              }`}
                          >
                            <span className="text-sm">{DEPOSIT_OPTIONS[c].icon}</span>
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Network selector (if multiple) */}
                    {nets.length > 1 && (
                      <div>
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">Network / Method</p>
                        <div className="flex gap-2">
                          {nets.map(n => (
                            <button
                              key={n}
                              onClick={() => setDepositNetwork(n)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${activeNet === n ? 'bg-[#1E88E5] text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Minimum & Info */}
                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Minimum Deposit</span>
                        <span className="text-sm font-black text-white font-mono">{cur.min}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-sans leading-relaxed">{cur.note}</p>
                    </div>

                    {/* QR Code (SVG placeholder styled as real QR) */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center relative">
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
                      <p className="text-[8px] text-zinc-600 font-sans">Scan QR to get address</p>
                    </div>

                    {/* Address box */}
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">
                        {depositCurrency === 'INR' ? 'UPI / Bank Details' : 'Wallet Address'}
                      </p>
                      <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700/60 rounded-xl px-3 py-3">
                        <p className="flex-1 text-[9.5px] font-mono text-zinc-200 break-all leading-relaxed">{cur.address}</p>
                        <button
                          onClick={handleCopy}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${copiedAddress ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                        >
                          {copiedAddress ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                      <p className="text-[9px] text-amber-400/80 leading-relaxed font-sans">
                        ⚠ Send only <strong>{depositCurrency}</strong> ({activeNet}) to this address. Sending wrong currency may result in permanent loss.
                      </p>
                    </div>

                    {/* Deposit Form Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 block">Deposit Amount (USD)</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 block">Transaction UTR / Hash</label>
                        <input
                          type="text"
                          value={depositUTR}
                          onChange={(e) => setDepositUTR(e.target.value)}
                          placeholder="Enter your transaction reference"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
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
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-2xl text-sm uppercase tracking-wide shadow-xl shadow-emerald-900/30 active:scale-[0.98] transition-all"
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
            <div className="flex-1 flex flex-col bg-black min-h-0">
              {/* Header */}
              <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/90 shrink-0">
                <button onClick={() => { setActiveScreen('trade'); setWithdrawSubmitted(false); setWithdrawAmount(''); setWithdrawAddress(''); }} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="font-extrabold text-sm text-white">Withdraw Funds</h3>
                <div className="w-7" />
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {withdrawSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
                      <span className="text-3xl">✓</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base">Withdrawal Requested!</h3>
                    <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed">
                      Your withdrawal request has been submitted. Processing time: {wCur.note}
                    </p>
                    <button
                      onClick={() => { setActiveScreen('trade'); setWithdrawSubmitted(false); setWithdrawAmount(''); setWithdrawAddress(''); }}
                      className="mt-2 px-6 py-2.5 bg-[#1E88E5] text-white text-xs font-extrabold rounded-xl"
                    >
                      Back to Trade
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Balance available */}
                    <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Available Balance</p>
                        <p className="text-xl font-black text-white mt-0.5">{availableBalance}</p>
                      </div>
                      <div className={`text-[9px] px-2 py-1 rounded-full font-black ${authUser ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-blue-500/15 text-[#1E88E5] border border-blue-500/25'}`}>
                        {authUser ? 'LIVE' : 'DEMO'}
                      </div>
                    </div>

                    {/* Currency Selector */}
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">Withdraw To</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.keys(WITHDRAW_OPTIONS).map(c => (
                          <button
                            key={c}
                            onClick={() => setWithdrawCurrency(c)}
                            className={`py-2 rounded-xl text-[9px] font-extrabold flex flex-col items-center gap-0.5 transition-all ${withdrawCurrency === c
                                ? 'bg-[#1E88E5] text-white border border-[#1E88E5] shadow-lg shadow-blue-900/30'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                              }`}
                          >
                            <span className="text-base">{WITHDRAW_OPTIONS[c].icon}</span>
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Min info */}
                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Minimum</span>
                      <span className="text-xs font-black text-white font-mono">{wCur.min}</span>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Amount ({withdrawCurrency})</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder={`Min ${wCur.min}`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#1E88E5]/50 placeholder:text-zinc-700"
                      />
                    </div>

                    {/* Address / Account */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{wCur.label}</label>
                      <textarea
                        value={withdrawAddress}
                        onChange={e => setWithdrawAddress(e.target.value)}
                        placeholder={wCur.placeholder}
                        rows={2}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#1E88E5]/50 placeholder:text-zinc-700 resize-none"
                      />
                    </div>

                    {/* Processing note */}
                    <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-3.5 py-2.5">
                      <p className="text-[9px] text-zinc-500 leading-relaxed font-sans">ℹ {wCur.note}</p>
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
                              currency: withdrawCurrency,
                              address: withdrawAddress
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
                      className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wide active:scale-[0.98] transition-all"
                    >
                      Submit Withdrawal Request
                    </button>

                    {/* KYC Note */}
                    <p className="text-center text-[8.5px] text-zinc-600 font-sans pb-2">
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
          <div className="flex-1 flex flex-col notch-padding text-left bg-black">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <button
                onClick={() => setActiveScreen('quotes')}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-white">Find Broker</h3>
              <div className="w-5" />
            </header>

            <div className="p-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchBroker}
                  onChange={(e) => setSearchBroker(e.target.value)}
                  placeholder="Find broker..."
                  className="w-full bg-zinc-900 border border-zinc-805 border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#1E88E5] transition-all"
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
                      className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold text-md text-[#1E88E5]">
                        {broker.logo}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white leading-tight">{broker.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{broker.desc}</p>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="text-[10px] text-zinc-500 leading-normal border-t border-zinc-900 pt-4 px-1 text-justify">
                <strong>Disclaimer Warning:</strong> The list shows simulated brokers. Always verify credentials with regulators before depositing capital to any server hosts.
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 7: BROKER LOGIN PAGE */}
        {activeScreen === 'broker-login' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-black">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <button
                onClick={() => setActiveScreen('brokers')}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-white">Link Account</h3>
              <div className="w-5" />
            </header>

            <form onSubmit={handleBrokerLogin} className="p-5 space-y-4">
              <div className="space-y-1 text-center mb-6">
                <span className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#1E88E5] flex items-center justify-center mx-auto text-xl font-bold mb-2">B</span>
                <h3 className="font-black text-sm text-white">{selectedBroker}</h3>
                <p className="text-[10px] text-zinc-500">Connecting to server: <span className="font-mono text-zinc-300 font-bold">{brokerServer}</span></p>
              </div>

              {brokerLoginError && (
                <div className="p-3 bg-red-500/15 border border-red-500/25 rounded-xl text-red-400 text-[10px] font-bold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brokerLoginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Email / Login ID</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@broker.com"
                  required
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Password passcode</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Account password key"
                  required
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Server coordinate</label>
                <select
                  value={brokerServer}
                  onChange={(e) => setBrokerServer(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-200 outline-none"
                >
                  <option value="ForexFactory-Live">ForexFactory-Live (Real accounts)</option>
                  <option value="ForexFactory-Demo">ForexFactory-Demo (Practice play)</option>
                </select>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 bg-[#1E88E5] hover:bg-blue-600 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Sign In to Server
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScreen('broker-register')}
                  className="w-full py-3 text-center text-zinc-400 hover:text-white font-bold text-xs"
                >
                  Register New Real Trading Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 8: BROKER REGISTER PAGE */}
        {activeScreen === 'broker-register' && (
          <div className="flex-1 flex flex-col notch-padding text-left bg-black">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <button
                onClick={() => setActiveScreen('broker-login')}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-white">Create Account</h3>
              <div className="w-5" />
            </header>

            <form onSubmit={handleBrokerRegister} className="p-5 space-y-3.5 overflow-y-auto max-h-[640px]">
              <div className="space-y-1 text-center mb-4">
                <h3 className="font-black text-sm text-white">Forex Factory Real registration</h3>
                <p className="text-[9px] text-zinc-500">Provide legal coordinate details to establish leverage lines.</p>
              </div>

              {brokerLoginError && (
                <div className="p-3 bg-red-500/15 border border-red-500/25 rounded-xl text-red-400 text-[10px] font-bold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brokerLoginError}</span>
                </div>
              )}

              {brokerRegisterSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Registered successfully! Redirecting to login...</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Full Name</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Legal name"
                  required
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Email Coordinating hash</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Passcode key</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Create secure password"
                  required
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Mobile coordinate</label>
                <input
                  type="text"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="+91 (555) 777-1234"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isAuthLoading || brokerRegisterSuccess}
                  className="w-full py-3.5 bg-[#1E88E5] hover:bg-blue-600 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
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
          <div className="flex-1 flex flex-col notch-padding text-left bg-black">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <button
                onClick={() => setActiveScreen('broker-login')}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-white">2FA Verification</h3>
              <div className="w-5" />
            </header>

            <form onSubmit={handleVerifyOtp} className="p-5 space-y-4">
              <div className="space-y-1 text-center mb-6">
                <span className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#1E88E5] flex items-center justify-center mx-auto text-xl font-bold mb-2">
                  <ShieldAlert className="w-6 h-6" />
                </span>
                <h3 className="font-black text-sm text-white">Security Check</h3>
                <p className="text-[10px] text-zinc-500">We sent a verification code to <span className="font-bold text-white">{authEmailContext}</span></p>
              </div>

              {brokerLoginError && (
                <div className="p-3 bg-red-500/15 border border-red-500/25 rounded-xl text-red-400 text-[10px] font-bold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brokerLoginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-3.5 text-center text-xl tracking-[0.5em] font-mono text-zinc-200 focus:outline-none focus:border-[#1E88E5]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isOtpVerifying || otpCode.length < 6}
                  className="w-full py-3.5 bg-[#1E88E5] hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
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
          <div className="flex-1 flex flex-col notch-padding text-left bg-black">
            <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80">
              <button
                onClick={() => setActiveScreen('quotes')}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h3 className="font-bold text-sm text-white">New Order ticket</h3>
              <div className="w-5" />
            </header>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[640px]">
              {orderStatusMessage && (
                <div className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 border ${orderStatusMessage.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-red-500/15 border-red-500/25 text-red-400'}`}>
                  {orderStatusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                  <span>{orderStatusMessage.text}</span>
                </div>
              )}

              {/* Symbol selector header */}
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Trading instrument</span>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-transparent text-white font-extrabold text-xs outline-none text-right font-mono"
                >
                  {symbolsData.map(sym => (
                    <option key={sym.symbol} value={sym.symbol.replace('/', '')}>{sym.symbol.replace('/', '')}</option>
                  ))}
                </select>
              </div>

              {/* Execution type selector */}
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Order type execution</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="bg-transparent text-white font-bold text-xs outline-none text-right"
                >
                  <option value="BUY">Market Execution Buy</option>
                  <option value="SELL">Market Execution Sell</option>
                  <option value="BUY_LIMIT">Pending Buy Limit</option>
                  <option value="SELL_LIMIT">Pending Sell Limit</option>
                </select>
              </div>

              {/* Lots selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Volume size (Lots)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOrderVolume(prev => Math.max(0.01, parseFloat(prev) - 0.1).toFixed(2))}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-bold text-zinc-300 rounded-lg"
                  >
                    -0.1
                  </button>
                  <button
                    onClick={() => setOrderVolume(prev => Math.max(0.01, parseFloat(prev) - 0.01).toFixed(2))}
                    className="px-2 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-bold text-zinc-300 rounded-lg"
                  >
                    -0.01
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={orderVolume}
                    onChange={(e) => setOrderVolume(e.target.value)}
                    className="flex-1 text-center bg-zinc-950 border border-zinc-900 rounded-lg py-2 font-mono text-sm font-black text-white focus:outline-none focus:border-[#1E88E5]"
                  />
                  <button
                    onClick={() => setOrderVolume(prev => (parseFloat(prev) + 0.01).toFixed(2))}
                    className="px-2 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-bold text-zinc-300 rounded-lg"
                  >
                    +0.01
                  </button>
                  <button
                    onClick={() => setOrderVolume(prev => (parseFloat(prev) + 0.1).toFixed(2))}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-bold text-zinc-300 rounded-lg"
                  >
                    +0.1
                  </button>
                </div>
              </div>

              {/* Stop Loss (SL) and Take Profit (TP) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Stop Loss (SL)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={orderSL}
                    onChange={(e) => setOrderSL(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Take Profit (TP)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={orderTP}
                    onChange={(e) => setOrderTP(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {orderType.includes('LIMIT') && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono">Target price target</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={orderTargetPrice}
                    onChange={(e) => setOrderTargetPrice(e.target.value)}
                    placeholder="Enter limit price coordinate"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
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
                  className="py-4 bg-[#FF1744] hover:bg-red-600 text-white font-extrabold rounded-xl text-xs uppercase flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-red-500/10"
                >
                  <span className="font-black">SELL</span>
                  <span className="text-[9px] font-normal font-mono opacity-80">by Market</span>
                </button>

                <button
                  onClick={() => {
                    setOrderType('BUY');
                    handlePlaceSimulatorOrder();
                  }}
                  className="py-4 bg-[#1E88E5] hover:bg-blue-600 text-white font-extrabold rounded-xl text-xs uppercase flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-blue-500/10"
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
        {['quotes', 'charts', 'trade', 'history', 'messages'].includes(activeScreen) && (
          <nav className="h-14 border-t border-zinc-900 bg-zinc-950 flex items-center justify-around text-[9px] font-bold text-zinc-500 shrink-0">
            {[
              { id: 'quotes', icon: ArrowLeftRight, label: 'Quotes' },
              { id: 'charts', icon: Play, rotate: -90, label: 'Charts' }, // rotate play icon to mimic bars/chart
              { id: 'trade', icon: TrendingUp, label: 'Trade' },
              { id: 'history', icon: Clock, label: 'History' },
              { id: 'messages', icon: MessageSquare, label: 'Messages', badge: '8' }
            ].map((tab) => {
              const isActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreen(tab.id as any)}
                  className={`flex flex-col items-center gap-1.5 flex-1 h-full justify-center transition-colors relative ${isActive ? 'text-[#1E88E5]' : 'hover:text-zinc-350'}`}
                >
                  <tab.icon className={`w-4 h-4 ${tab.rotate ? 'rotate-[-90deg]' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'messages' && (
                    <span className="absolute top-2 right-6 bg-red-500 text-white rounded-full text-[7px] font-bold w-3 h-3 flex items-center justify-center">
                      8
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

      </div>

    </div>
  );
}
