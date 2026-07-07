import React, { useMemo } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface TradingChartProps {
  symbol: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
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
    <div className="w-full h-full min-h-[300px] flex-1 bg-lb-panel border-b border-lb-border">
      {isMounted && (
        <AdvancedRealTimeChart
          symbol={tvSymbol}
          theme="dark"
          width="100%"
          height="100%"
          allow_symbol_change={false}
          save_image={false}
          hide_side_toolbar={true}
          toolbar_bg="#18181b"
          backgroundColor="#09090b"
          enable_publishing={false}
          hide_top_toolbar={false}
        />
      )}
    </div>
  );
};
