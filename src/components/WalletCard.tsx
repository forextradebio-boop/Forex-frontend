import React from 'react';
import { UserWallet } from '../types';

interface Props {
  wallet: UserWallet;
}

export default function WalletCard({ wallet }: Props) {
  // Sanitize near-zero negative floating point numbers to exactly 0
  const sanitizeValue = (val: number, allowNegative: boolean = false) => {
    if (Math.abs(val) < 0.005) return 0;
    if (!allowNegative && val < 0) return 0;
    return val;
  };

  const balance = sanitizeValue(wallet.balance);
  const equity = sanitizeValue(wallet.equity);
  const margin = sanitizeValue(wallet.margin);
  const freeMargin = sanitizeValue(wallet.freeMargin);
  const pnl = sanitizeValue(wallet.pnl, true);

  const formatMoney = (val: number) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isProfit = pnl > 0;
  const isLoss = pnl < 0;

  return (
    <div className="bg-lb-panel border border-lb-border rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 ${isProfit ? 'bg-lb-accent' : isLoss ? 'bg-lb-down' : 'bg-lb-accent/100'}`}></div>

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* Main Balance Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="text-lb-text-muted font-bold uppercase tracking-widest text-xs mb-2">Account Balance</div>
            <div className="text-4xl md:text-6xl font-black text-lb-text tracking-tighter flex items-baseline gap-2">
              <span className="text-lb-text-muted font-medium text-3xl">$</span>
              {formatMoney(balance)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lb-text-muted font-bold uppercase tracking-widest text-xs mb-2">Unrealized PnL</div>
            <div className={`text-2xl md:text-3xl font-black tracking-tight ${isProfit ? 'text-lb-accent drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : isLoss ? 'text-lb-down drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-lb-text'}`}>
              {isProfit ? '+' : ''}{formatMoney(pnl)}
            </div>
          </div>
        </div>

        <div className="h-px bg-zinc-800/50 w-full my-2"></div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-lb-bg/40 border border-lb-border/50 rounded-2xl p-4 transition-colors hover:bg-lb-bg/80">
            <div className="text-lb-text-muted font-bold uppercase tracking-wider text-[10px] mb-1">Equity</div>
            <div className="text-xl font-bold text-lb-text flex items-baseline gap-1">
              <span className="text-lb-text-muted text-sm">$</span>{formatMoney(equity)}
            </div>
          </div>

          <div className="bg-lb-bg/40 border border-lb-border/50 rounded-2xl p-4 transition-colors hover:bg-lb-bg/80">
            <div className="text-lb-text-muted font-bold uppercase tracking-wider text-[10px] mb-1">Margin Used</div>
            <div className="text-xl font-bold text-lb-text flex items-baseline gap-1">
              <span className="text-lb-text-muted text-sm">$</span>{formatMoney(margin)}
            </div>
          </div>

          <div className="bg-lb-bg/40 border border-lb-border/50 rounded-2xl p-4 transition-colors hover:bg-lb-bg/80">
            <div className="text-lb-text-muted font-bold uppercase tracking-wider text-[10px] mb-1">Free Margin</div>
            <div className="text-xl font-bold text-lb-text flex items-baseline gap-1">
              <span className="text-lb-text-muted text-sm">$</span>{formatMoney(freeMargin)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
