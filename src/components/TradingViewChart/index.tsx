import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import api from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';
import { useMarket } from '../../contexts/MarketContext';

export interface ChartContainerProps {
  symbol: string;
  theme?: 'Light' | 'Dark';
  intervalValue?: string;
}

export const TIMEFRAMES = [
  { label: '1m', value: '1m', seconds: 60 },
  { label: '5m', value: '5m', seconds: 300 },
  { label: '15m', value: '15m', seconds: 900 },
  { label: '30m', value: '30m', seconds: 1800 },
  { label: '1H', value: '1h', seconds: 3600 },
  { label: '4H', value: '4h', seconds: 14400 },
  { label: '1D', value: '1d', seconds: 86400 },
  { label: '1W', value: '1wk', seconds: 604800 },
  { label: '1M', value: '1mo', seconds: 2592000 },
];

export const TradingViewChart: React.FC<ChartContainerProps> = ({
  symbol = 'EURUSD',
  theme = 'Dark',
  intervalValue = '15m'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const interval = TIMEFRAMES.find(t => t.value === intervalValue) || TIMEFRAMES[2];
  const { socket } = useSocket();
  const { marketEnabled } = useMarket();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid' as const, color: theme === 'Dark' ? '#000000' : '#ffffff' },
        textColor: theme === 'Dark' ? '#BDBDBD' : '#64748B',
        fontSize: 11,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
      },
      grid: {
        vertLines: { color: theme === 'Dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', style: 1 }, // Thin dotted/dashed MT5 grid
        horzLines: { color: theme === 'Dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', style: 1 },
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: theme === 'Dark' ? '#758696' : '#9598a1',
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: theme === 'Dark' ? '#363a45' : '#131722',
        },
        horzLine: {
          color: theme === 'Dark' ? '#758696' : '#9598a1',
          width: 1,
          style: 3,
          labelBackgroundColor: theme === 'Dark' ? '#363a45' : '#131722',
        },
      },
      rightPriceScale: {
        autoScale: true,
        alignLabels: true,
        borderVisible: true,
        borderColor: theme === 'Dark' ? '#2b2b43' : '#e0e3eb',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        borderColor: theme === 'Dark' ? '#2b2b43' : '#e0e3eb',
        fixLeftEdge: false,
        rightOffset: 15,
        barSpacing: 12, // Increased for wider candles
        minBarSpacing: 5,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      autoSize: true,
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: theme === 'Dark' ? '#26A69A' : '#10B981',
      downColor: theme === 'Dark' ? '#EF5350' : '#EF4444',
      borderVisible: true,
      borderUpColor: theme === 'Dark' ? '#26A69A' : '#10B981',
      borderDownColor: theme === 'Dark' ? '#EF5350' : '#EF4444',
      wickUpColor: theme === 'Dark' ? '#26A69A' : '#10B981',
      wickDownColor: theme === 'Dark' ? '#EF5350' : '#EF4444',
      wickVisible: true,
    });
    seriesRef.current = candlestickSeries;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/market/chart/${symbol}?interval=${interval.value}`);
        if (response.data && Array.isArray(response.data)) {
          const formattedData: CandlestickData[] = response.data.map((bar: any) => ({
            time: (typeof bar.time === 'number' && bar.time > 9999999999 ? Math.floor(bar.time / 1000) : (typeof bar.time === 'number' ? bar.time : Math.floor(Date.parse(bar.time) / 1000))) as Time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          })).sort((a, b) => (a.time as number) - (b.time as number));

          // Ensure unique times
          const uniqueData: CandlestickData[] = [];
          const times = new Set();
          for (const d of formattedData) {
            if (!times.has(d.time)) {
              times.add(d.time);
              uniqueData.push(d);
            }
          }
          
          if (uniqueData.length > 0) {
            candlestickSeries.setData(uniqueData);
            chart.timeScale().fitContent();
          }
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, theme, interval]);

  // Live updates
  useEffect(() => {
    if (!socket || !seriesRef.current) return;
    
    const handleMarketUpdate = (updates: any[]) => {
      updates.forEach((update) => {
        if (update.symbol.replace('/', '') === symbol) {
          const tradePrice = update.price || update.bid;
          const timestamp = update.timestamp || Date.now();
          const tickTime = Math.floor(timestamp / 1000);
          
          // Snap to current interval candle
          const candleTime = (tickTime - (tickTime % interval.seconds)) as Time;
          
          const bar = {
            time: candleTime,
            open: update.open || tradePrice,
            high: update.high || tradePrice,
            low: update.low || tradePrice,
            close: tradePrice,
          };
          
          try {
            seriesRef.current?.update(bar);
          } catch (e) {
            // Usually happens if the time is older than the last bar
          }
        }
      });
    };

    socket.on('market:update', handleMarketUpdate);
    socket.on('prices', handleMarketUpdate);

    return () => {
      socket.off('market:update', handleMarketUpdate);
      socket.off('prices', handleMarketUpdate);
    };
  }, [socket, symbol, interval]);

  const getSubtitle = (sym: string) => {
    if (sym.includes('XAU')) return 'Gold vs US Dollar';
    if (sym.includes('XAG')) return 'Silver vs US Dollar';
    if (sym.includes('BTC')) return 'Bitcoin vs US Dollar';
    if (sym.includes('EURUSD')) return 'Euro vs US Dollar';
    if (sym.includes('GBPUSD')) return 'British Pound vs US Dollar';
    if (sym.includes('USDJPY')) return 'US Dollar vs Japanese Yen';
    if (sym.includes('USDCAD')) return 'US Dollar vs Canadian Dollar';
    return 'Forex Pair';
  };
  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {/* MT5 Mobile Top-Left Info Text */}
      <div className="absolute top-1 left-2 z-10 pointer-events-none flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-bold text-[#2962FF]">{symbol}m</span>
          <span className="text-[10px] font-bold text-gray-300">▼ {interval.value.toUpperCase()}</span>
        </div>
        <span className="text-[10px] font-medium text-white">{getSubtitle(symbol)}</span>
      </div>

      {/* Hidden Timeframe Controls for Desktop / Or moved elsewhere */}
      <div className="hidden md:flex absolute top-0 right-16 z-20 gap-1 p-2 pointer-events-none">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pointer-events-auto backdrop-blur-sm bg-lb-bg/40 p-1 rounded border border-lb-border/50">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all duration-300 ${
                interval.value === tf.value
                  ? 'bg-lb-up/20 text-lb-up'
                  : 'bg-transparent text-lb-text-muted hover:text-lb-text'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-lb-bg/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lb-accent"></div>
        </div>
      )}
      {!marketEnabled && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-lb-bg/60 backdrop-blur-sm">
          <div className="bg-lb-panel/90 border border-lb-border px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-lb-down/10 flex items-center justify-center border border-lb-down/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-lb-down" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <h2 className="text-xl font-black text-lb-text tracking-wide">Market is currently closed.</h2>
            <p className="text-sm text-lb-text-muted font-medium text-center">Live price updates and trading are disabled.</p>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
