import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, ColorType } from 'lightweight-charts';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useTheme } from '../../theme';
import * as marketService from '../../services/market';

interface CrudeOilData {
  status: number;
  data: {
    chart: {
      result: Array<{
        meta: {
          currency: string;
          symbol: string;
          exchangeName: string;
          fullExchangeName: string;
          instrumentType: string;
          firstTradeDate: number;
          regularMarketTime: number;
          hasPrePostMarketData: boolean;
          regularMarketPrice: number;
          fiftyTwoWeekHigh: number;
          fiftyTwoWeekLow: number;
          regularMarketDayHigh: number;
          regularMarketDayLow: number;
          regularMarketVolume: number;
          shortName: string;
          chartPreviousClose: number;
          priceHint: number;
        };
        timestamp: number[];
        indicators: {
          quote: Array<{
            open: number[];
            high: number[];
            low: number[];
            close: number[];
            volume: number[];
          }>;
          adjclose?: Array<{
            adjclose: number[];
          }>;
        };
      }>;
      error: null | string;
    };
  };
}

interface CrudeOilChartProps {
  onBackClick?: () => void;
}

export const CrudeOilChart: React.FC<CrudeOilChartProps> = ({ onBackClick }) => {
  const { themeMode } = useTheme();
  const [data, setData] = useState<CrudeOilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  // Trading state
  const [orderVolume, setOrderVolume] = useState<string>('1');
  const [orderSL, setOrderSL] = useState<string>('');
  const [orderTP, setOrderTP] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Fetch data
  useEffect(() => {
    const fetchCrudeOilData = async () => {
      try {
        setLoading(true);
        const response = await marketService.getCrudeOilChart('CL=F', '1d', 'ytd');
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching crude oil data:', err);
        setError('Failed to fetch crude oil data');
      } finally {
        setLoading(false);
      }
    };

    fetchCrudeOilData();
    const interval = setInterval(fetchCrudeOilData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Transform raw API data into formatted candles
  const chartData = useMemo(() => {
    if (!data?.data?.chart?.result?.[0]) return null;
    const result = data.data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    
    if (!quote) return null;

    return {
      meta: result.meta,
      candles: timestamps.map((ts, idx) => ({
        timestamp: ts * 1000,
        open: quote.open[idx],
        high: quote.high[idx],
        low: quote.low[idx],
        close: quote.close[idx],
        volume: quote.volume[idx],
      })),
    };
  }, [data]);

  // Get latest candle for price display
  const latestCandle = useMemo(() => {
    if (!chartData?.candles) return null;
    return chartData.candles[chartData.candles.length - 1];
  }, [chartData]);

  // Initialize and update lightweight-charts
  useEffect(() => {
    if (!chartData?.candles || !chartContainerRef.current) return;

    if (!chartRef.current) {
      const theme = themeMode === 'dark' ? 'Dark' : 'Light';
      const chartOptions: any = {
        layout: {
          background: { type: ColorType.Solid, color: theme === 'Dark' ? '#1a1a2e' : '#ffffff' },
          textColor: theme === 'Dark' ? '#d4d4d8' : '#000000',
          fontSize: 11,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        },
        grid: {
          vertLines: { color: theme === 'Dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', style: 1 },
          horzLines: { color: theme === 'Dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: theme === 'Dark' ? '#758696' : '#9598a1',
            width: 1,
            style: 3,
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
          borderVisible: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderVisible: false,
          fixLeftEdge: false,
          rightOffset: 15,
          barSpacing: 12,
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
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: true,
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickVisible: true,
      });
      seriesRef.current = candlestickSeries;
    }

    const candleData: CandlestickData[] = chartData.candles.map((candle) => ({
      time: (Math.floor(candle.timestamp / 1000)) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    if (seriesRef.current && candleData.length > 0) {
      seriesRef.current.setData(candleData);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        chartRef.current.applyOptions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartData, themeMode]);

  const executeOrder = async (side: 'BUY' | 'SELL') => {
    try {
      setIsPlacingOrder(true);

      const volume = parseFloat(orderVolume);
      if (!volume || volume <= 0) {
        alert('Please enter a valid volume');
        setIsPlacingOrder(false);
        return;
      }

      const sl = orderSL ? parseFloat(orderSL) : undefined;
      const tp = orderTP ? parseFloat(orderTP) : undefined;

      if (sl && tp && sl >= tp) {
        alert('Stop Loss must be less than Take Profit');
        setIsPlacingOrder(false);
        return;
      }

      const response = await marketService.placeOrder({
        symbol: 'USOIL',
        type: side,
        volume: volume,
        openPrice: latestCandle?.close || 0,
        sl: sl,
        tp: tp
      });

      alert(`${side} order placed successfully!\nVolume: ${orderVolume} barrels\nPrice: $${latestCandle?.close.toFixed(2)}`);
      setOrderVolume('1');
      setOrderSL('');
      setOrderTP('');

      const refreshData = await marketService.getCrudeOilChart('CL=F', '1d', 'ytd');
      if (refreshData) {
        setData(refreshData);
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to place order';
      
      if (err.response?.status === 402) {
        alert(`❌ Insufficient Balance\n\n${errorMessage}`);
      } else if (err.response?.status === 403) {
        alert(`❌ Trading Disabled\n\n${errorMessage}`);
      } else if (err.response?.status === 400) {
        alert(`❌ Invalid Order\n\n${errorMessage}`);
      } else if (err.response?.status === 503) {
        alert(`⚠️ Market Data Unavailable\n\n${errorMessage}`);
      } else {
        alert(`❌ Order Failed\n\n${errorMessage}`);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col bg-lb-panel rounded-xl border border-lb-border p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lb-accent mx-auto mb-4"></div>
            <p className="text-lb-text-muted text-sm">Loading Crude Oil data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !chartData || !latestCandle) {
    return (
      <div className="w-full h-full flex flex-col bg-lb-panel rounded-xl border border-lb-border p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Info className="w-12 h-12 text-lb-text-muted mx-auto mb-4" />
            <p className="text-lb-text-muted text-sm">{error || 'No data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate display values
  const meta = chartData.meta;
  const previousClose = meta.chartPreviousClose;
  const change = latestCandle.close - previousClose;
  const changePercent = ((change / previousClose) * 100).toFixed(2);
  const isPositive = change >= 0;
  const highestPrice = Math.max(...chartData.candles.map(c => c.high));
  const lowestPrice = Math.min(...chartData.candles.map(c => c.low));

  // Render
  return (
    <div className="w-full h-full flex flex-col bg-lb-panel rounded-xl border border-lb-border overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-lb-border flex justify-between items-start gap-6">
        {/* Left: Price Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-lb-text">{meta.shortName}</h2>
            <span className="text-xs px-2 py-1 bg-lb-bg rounded-full text-lb-text-muted font-semibold">
              {meta.instrumentType}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-lb-text">${latestCandle.close.toFixed(2)}</span>
            <span className={`text-lg font-bold flex items-center gap-1 ${isPositive ? 'text-lb-up' : 'text-lb-down'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent}%)
            </span>
          </div>

          <div className="text-xs text-lb-text-muted">
            <span className="font-semibold">{meta.currency}</span>
            {' • '}
            <span>{meta.fullExchangeName}</span>
            {' • '}
            <span>Last Updated: {new Date(meta.regularMarketTime * 1000).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Right: Trading Panel */}
        <div className="w-72 flex flex-col gap-3">
          <div className="bg-lb-bg rounded-lg p-3">
            <div className="text-xs font-semibold text-lb-text-muted mb-2">CURRENT PRICE</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-lb-text-muted">BID</span>
                <span className="text-xl font-bold text-lb-down">${latestCandle.close.toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-lb-text-muted">ASK</span>
                <span className="text-xl font-bold text-lb-up">${(latestCandle.close + 0.01).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-lb-text-muted">Volume (Barrels)</label>
            <input
              type="number"
              value={orderVolume}
              onChange={(e) => setOrderVolume(e.target.value)}
              className="w-full px-3 py-2 bg-lb-bg border border-lb-border rounded-lg text-lb-text text-sm outline-none focus:border-lb-accent"
              placeholder="1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-lb-text-muted">Stop Loss ($)</label>
            <input
              type="number"
              value={orderSL}
              onChange={(e) => setOrderSL(e.target.value)}
              className="w-full px-3 py-2 bg-lb-bg border border-lb-border rounded-lg text-lb-text text-sm outline-none focus:border-lb-accent"
              placeholder="Not set"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-lb-text-muted">Take Profit ($)</label>
            <input
              type="number"
              value={orderTP}
              onChange={(e) => setOrderTP(e.target.value)}
              className="w-full px-3 py-2 bg-lb-bg border border-lb-border rounded-lg text-lb-text text-sm outline-none focus:border-lb-accent"
              placeholder="Not set"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => executeOrder('SELL')}
              disabled={isPlacingOrder}
              className="flex-1 bg-lb-down hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
            >
              SELL
            </button>
            <button
              onClick={() => executeOrder('BUY')}
              disabled={isPlacingOrder}
              className="flex-1 bg-lb-accent hover:bg-green-500 disabled:opacity-50 text-black font-bold py-2 px-3 rounded-lg transition-colors text-sm"
            >
              BUY
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-lb-border">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">Open</span>
          <span className="text-lg font-bold text-lb-text">${chartData.candles[0]?.open.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">High (Period)</span>
          <span className="text-lg font-bold text-lb-up">${highestPrice.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">Low (Period)</span>
          <span className="text-lg font-bold text-lb-down">${lowestPrice.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">Volume</span>
          <span className="text-lg font-bold text-lb-text">{(latestCandle.volume / 1000).toFixed(0)}K</span>
        </div>
      </div>

      {/* 52-Week Levels */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-lb-border bg-lb-bg/50">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">52-Week High</span>
          <span className="text-lg font-bold text-lb-text">${meta.fiftyTwoWeekHigh.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">52-Week Low</span>
          <span className="text-lg font-bold text-lb-text">${meta.fiftyTwoWeekLow.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">Day High</span>
          <span className="text-lg font-bold text-lb-text">${meta.regularMarketDayHigh.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-lb-text-muted mb-1">Day Low</span>
          <span className="text-lg font-bold text-lb-text">${meta.regularMarketDayLow.toFixed(2)}</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="text-xs font-semibold text-lb-text-muted mb-2">YTD Price Chart</div>
        <div ref={chartContainerRef} className="flex-1 rounded-lg bg-lb-bg"></div>
      </div>

      {/* Data Table */}
      <div className="border-t border-lb-border p-4 max-h-64 overflow-y-auto">
        <div className="text-xs font-semibold text-lb-text-muted mb-2">Recent Data (Last 10 days)</div>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-lb-bg/50">
            <tr className="text-lb-text-muted">
              <th className="text-left py-2 px-1">Date</th>
              <th className="text-right py-2 px-1">Open</th>
              <th className="text-right py-2 px-1">High</th>
              <th className="text-right py-2 px-1">Low</th>
              <th className="text-right py-2 px-1">Close</th>
              <th className="text-right py-2 px-1">Volume</th>
            </tr>
          </thead>
          <tbody>
            {chartData.candles.slice(-10).reverse().map((candle, idx) => (
              <tr key={idx} className="border-t border-lb-border/50 hover:bg-lb-bg/30 transition-colors">
                <td className="py-2 px-1 text-lb-text">{new Date(candle.timestamp).toLocaleDateString()}</td>
                <td className="text-right py-2 px-1 text-lb-text-muted font-mono">${candle.open.toFixed(2)}</td>
                <td className="text-right py-2 px-1 text-lb-up font-mono font-semibold">${candle.high.toFixed(2)}</td>
                <td className="text-right py-2 px-1 text-lb-down font-mono font-semibold">${candle.low.toFixed(2)}</td>
                <td className="text-right py-2 px-1 text-lb-text font-mono font-semibold">${candle.close.toFixed(2)}</td>
                <td className="text-right py-2 px-1 text-lb-text-muted font-mono">{(candle.volume / 1000).toFixed(0)}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
