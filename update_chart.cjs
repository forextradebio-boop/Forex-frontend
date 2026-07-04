const fs = require('fs');

const path = 'src/components/MT5Simulator.tsx';
let c = fs.readFileSync(path, 'utf8');

const startMatch = '// Canvas charting states & refs';
const endMatch = '// Helper: MT5 Price splits formatting (large pips, small pipettes)';

const startIndex = c.indexOf(startMatch);
const endIndex = c.indexOf(endMatch);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find matches');
  process.exit(1);
}

const replacement = `// TradingView Lightweight Charts states & refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: theme.chartBackground }, textColor: theme.chartText },
      grid: { vertLines: { color: theme.chartGrid }, horzLines: { color: theme.chartGrid } },
      crosshair: { mode: 1 },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    const series = chart.addCandlestickSeries({
      upColor: theme.chartCandleGreen,
      downColor: theme.chartCandleRed,
      borderVisible: false,
      wickUpColor: theme.chartCandleGreen,
      wickDownColor: theme.chartCandleRed,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    // Force resize observation
    const ro = new ResizeObserver(handleResize);
    ro.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      chart.remove();
    };
  }, [theme]);

  // Load Historical Data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedSymbol || !seriesRef.current) return;
      try {
        const res = await api.get(\`/market/chart/\${selectedSymbol.replace('/', '')}\`);
        if (res.data && Array.isArray(res.data)) {
          const formatted = res.data.map((c: any) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
          const sorted = formatted.sort((a: any, b: any) => a.time - b.time);
          const unique = sorted.filter((v: any, i: number, a: any) => i === 0 || v.time !== a[i - 1].time);
          seriesRef.current.setData(unique);
        }
      } catch (err) {
        console.error('Failed to load chart history', err);
      }
    };
    fetchHistory();
  }, [selectedSymbol]);

  // Update Chart on real-time ticks
  useEffect(() => {
    if (!symbolsData || symbolsData.length === 0 || !seriesRef.current || !selectedSymbol) return;
    const symObj = symbolsData.find(s => s.symbol.replace('/', '') === selectedSymbol.replace('/', ''));
    if (symObj && !isNaN(symObj.price)) {
      const currentPrice = symObj.price;
      const currentData = seriesRef.current.data();
      const lastCandle: any = currentData.length > 0 ? currentData[currentData.length - 1] : null;
      const currentTime = Math.floor(Date.now() / 1000) as Time;

      if (!lastCandle) {
        seriesRef.current.update({ time: currentTime, open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice });
      } else {
        if (currentTime - lastCandle.time < 60) {
          seriesRef.current.update({
            time: lastCandle.time,
            open: lastCandle.open,
            high: Math.max(lastCandle.high, currentPrice),
            low: Math.min(lastCandle.low, currentPrice),
            close: currentPrice
          });
        } else {
          seriesRef.current.update({
            time: currentTime,
            open: lastCandle.close,
            high: Math.max(lastCandle.close, currentPrice),
            low: Math.min(lastCandle.close, currentPrice),
            close: currentPrice
          });
        }
      }
    }
  }, [symbolsData, selectedSymbol]);

  `;

c = c.substring(0, startIndex) + replacement + c.substring(endIndex);

// Now replace the <canvas> element
c = c.replace(/<canvas ref=\{canvasRef\}.*?\/>/g, '<div ref={chartContainerRef} className="w-full h-full block" />');

fs.writeFileSync(path, c);
console.log('Successfully updated MT5Simulator.tsx');
