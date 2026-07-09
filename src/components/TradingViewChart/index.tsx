import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import api from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';
import { useMarket } from '../../contexts/MarketContext';

export interface ChartContainerProps {
  symbol: string;
  theme?: 'Light' | 'Dark';
}

const TIMEFRAMES = [
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
  theme = 'Dark'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState(TIMEFRAMES[0]);
  const { socket } = useSocket();
  const { marketEnabled } = useMarket();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid' as const, color: theme === 'Dark' ? '#0b0e14' : '#ffffff' },
        textColor: theme === 'Dark' ? '#A3A3A3' : '#333333',
      },
      grid: {
        vertLines: { color: theme === 'Dark' ? '#1f2937' : '#e5e7eb' },
        horzLines: { color: theme === 'Dark' ? '#1f2937' : '#e5e7eb' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: true,
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
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
          }
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Timeframe Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 bg-gradient-to-b from-lb-bg/80 to-transparent pointer-events-none">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pointer-events-auto">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setInterval(tf)}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                interval.value === tf.value
                  ? 'bg-lb-accent text-black shadow-sm'
                  : 'bg-lb-panel/80 text-lb-text-muted hover:text-lb-text hover:bg-lb-panel border border-lb-border/50'
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
