import React from 'react';
import { LayoutTemplate, Wifi, WifiOff } from 'lucide-react';

interface TerminalHeaderProps {
  isConnected: boolean;
  balance: number;
  equity: number;
  freeMargin: number;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  isConnected,
  balance,
  equity,
  freeMargin
}) => {
  const toCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b bg-white border-slate-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-blue-600" />
          <span className="font-extrabold text-sm tracking-tight text-slate-900">Antigravity Trader</span>
        </div>
        <div className={`px-2 py-1 flex items-center gap-1.5 rounded-md text-[10px] font-bold ${
          isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'LIVE' : 'CONNECTING'}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6 text-xs font-medium">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-slate-500">Balance</span>
          <span className="font-bold text-slate-900">{toCurrency(balance)}</span>
        </div>
        <div className="flex flex-col items-end leading-tight">
          <span className="text-slate-500">Equity</span>
          <span className="font-bold text-blue-600">{toCurrency(equity)}</span>
        </div>
        <div className="flex flex-col items-end leading-tight">
          <span className="text-slate-500">Free Margin</span>
          <span className="font-bold text-slate-900">{toCurrency(freeMargin)}</span>
        </div>
      </div>
    </header>
  );
};
