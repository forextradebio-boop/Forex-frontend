import React, { useMemo } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { useTheme } from '../../theme';

interface TradingChartProps {
  symbol: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  const { themeMode } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Format symbol for TradingView (Basic mapping)
  const tvSymbol = useMemo(() => {
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return `BINANCE:${symbol}`;
    }
    if (symbol === 'XAUUSD') return 'OANDA:XAUUSD';
    return `FX:${symbol}`;
  }, [symbol]);

  return (
    <div className="w-full h-full min-h-[300px] flex-1 bg-[var(--theme-secondary-background)] border-b" style={{ borderColor: 'var(--theme-border-color)' }}>
      {isMounted && (
        <AdvancedRealTimeChart
        symbol={tvSymbol}
        theme={themeMode === 'navy' ? 'dark' : 'light'}
        width="100%"
        height="100%"
        allow_symbol_change={false}
        save_image={false}
        hide_side_toolbar={true}
        toolbar_bg="#ffffff"
        enable_publishing={false}
        hide_top_toolbar={false}
      />
      )}
    </div>
  );
};
