/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Globe, 
  Zap, 
  DollarSign, 
  Smartphone, 
  ArrowRight, 
  CheckCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { SymbolData } from "../types";

interface LandingPageProps {
  symbols: SymbolData[];
  onStartTrading: () => void;
  onNavigate: (tab: string) => void;
}

export default function LandingPage({ symbols, onStartTrading, onNavigate }: LandingPageProps) {
  // Compute movers
  const sortedSymbols = [...symbols].map(s => {
    const pctChange = ((s.price - s.openPrice) / s.openPrice) * 100;
    return { ...s, pctChange };
  });

  const gainers = [...sortedSymbols].sort((a, b) => b.pctChange - a.pctChange).slice(0, 4);
  const losers = [...sortedSymbols].sort((a, b) => a.pctChange - b.pctChange).slice(0, 4);

  return (
    <div id="landing-page" className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      {/* Dynamic Upper Ticker Row */}
      <div className="bg-slate-900 border-b border-slate-800 py-2.5 overflow-hidden">
        <div className="flex space-x-12 animate-scroll whitespace-nowrap min-w-full">
          {symbols.concat(symbols).map((s, idx) => {
            const change = s.price - s.openPrice;
            const pct = (change / s.openPrice) * 100;
            return (
              <div 
                key={idx} 
                className="inline-flex items-center space-x-2 text-xs border-r border-slate-800 pr-12 cursor-pointer hover:bg-slate-800 p-1 rounded transition duration-150"
                onClick={onStartTrading}
              >
                <span className="font-mono font-bold text-slate-200">{s.symbol}</span>
                <span className="font-mono text-slate-400">${(s.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className={`font-mono flex items-center ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pct >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Head Banner */}
      <div className="relative pt-24 pb-20 px-4 md:px-8 border-b border-slate-970 bg-radial-gradient">
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 mr-1" />
              ULTRA LOW LATENCY MULTI-ASSET BROKERAGE
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-sans leading-tight tracking-tight text-white">
              The Trade Station for <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">Professional</span> Execution
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-xl font-normal leading-relaxed">
              Access Crypto, Forex, Commodities, Indices, and US Stocks from one single high-octane trading terminal. Integrated margin engine, charts, and instant deposits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                id="hero-cta-trading"
                onClick={onStartTrading}
                className="px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-teal-500/20 text-center flex items-center justify-center cursor-pointer"
              >
                Launch Advanced Terminal
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button 
                id="hero-cta-features"
                onClick={() => onNavigate("news")}
                className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-semibold transition duration-200 text-center cursor-pointer"
              >
                Explore Market News
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-900/80">
              <div>
                <p className="text-2xl md:text-3xl font-extrabold font-mono text-white">$4.8B+</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Daily Exchange Volume</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold font-mono text-white">&lt; 15ms</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Instant Match Speed</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold font-mono text-white">0.0 Pips</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Raw Institutional Spreads</p>
              </div>
            </div>
          </div>

          {/* Floating UI Elements Mockup Frame */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-500 opacity-20 blur-xl" />
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                </div>
                <div className="px-3 py-1 bg-slate-950 rounded-lg text-xs font-mono text-teal-400 font-bold border border-slate-800">
                  BTCUSDT LIVE CONTRACT
                </div>
              </div>

              {/* Inside Mock Mini Chart */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-mono">Spot Reference Price</p>
                    <p className="text-3xl font-black font-mono text-white">$68,420.50</p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-500/15 text-emerald-400 rounded-md text-xs font-mono font-bold">
                    +2.45% Today
                  </span>
                </div>

                <div className="h-32 w-full bg-slate-950 rounded-xl relative overflow-hidden p-2 flex items-end">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:12px_12px]" />
                  <div className="w-full h-full flex items-end justify-between space-x-1 pt-4">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const heights = [40, 52, 45, 62, 70, 55, 68, 85, 78, 92, 88, 105, 98, 115, 120, 110];
                      const isUp = i === 0 || heights[i] >= heights[i-1];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div 
                            className={`w-full rounded-sm ${isUp ? 'bg-emerald-500/70' : 'bg-rose-500/70'}`}
                            style={{ height: `${(heights[i] / 120) * 100}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={onStartTrading}
                    className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-sm transition"
                  >
                    Quick Long Symbol
                  </button>
                  <button 
                    onClick={onStartTrading}
                    className="w-full py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-sm transition"
                  >
                    Quick Short Symbol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Gainers & Losers Grid section */}
      <div className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Daily Institutional Sentiment</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Track assets registering high-amplitude percentage movements over the past 24-hours.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Gainers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Top Market Gainers
            </h3>
            <div className="space-y-4">
              {gainers.map((s, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition"
                  onClick={onStartTrading}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 font-mono text-xs font-bold w-12 text-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-mono font-bold text-white text-sm">{s.symbol}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-slate-100 font-bold">${(s.price ?? 0).toLocaleString()}</p>
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      +{s.pctChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" />
              Top Market Losers
            </h3>
            <div className="space-y-4">
              {losers.map((s, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition"
                  onClick={onStartTrading}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400 font-mono text-xs font-bold w-12 text-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-mono font-bold text-white text-sm">{s.symbol}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-slate-100 font-bold">${(s.price ?? 0).toLocaleString()}</p>
                    <span className="text-xs text-rose-400 font-mono font-semibold">
                      {s.pctChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Features Panel Section */}
      <div className="bg-slate-900/50 border-t border-b border-slate-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Why Seasoned Asset Managers Select Forex Factory Pro</h2>
            <p className="text-slate-400 text-sm">We provide high-tech pipelines to institutional liquidity pools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Fully Segregated Wallets</h3>
              <p className="text-slate-400 text-sm">
                Assets are settled inside physically secure, tier-1 partner accounts. Automatic KYC and real UTR tracking guarantee pristine transaction histories.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Comprehensive Multi-Asset Portal</h3>
              <p className="text-slate-400 text-sm">
                Liquidate contracts on spot gold, indices, cryptos, and mega-cap tech stocks directly using up to 1:500 leverages optimized to standard contracts.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time Terminal Match Speed</h3>
              <p className="text-slate-400 text-sm">
                No delayed quote data on free tiers. High-performance matching loops trigger price target hits and stop-outs instantly within fractions of a microsecond.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Smartphone Promotional Panel */}
      <div className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-teal-950/60 via-indigo-950/40 to-slate-900/80 border border-teal-500/20 rounded-3xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6">
            <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-full text-xs font-extrabold uppercase font-mono tracking-wider">
              Download App - Coming Soon
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">The Terminal Experience, Folded Into Your Pocket</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Track global pricing matrices and adjust stops while away from your multimonitor setup. High-speed charts, notification alerts, economic events calendar, and bank ledger uploads will be fully operable.
            </p>
            <div className="flex flex-wrap gap-4 select-none">
              <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-teal-400" />
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 uppercase leading-none font-mono">Download from</p>
                  <p className="text-xs font-bold text-white font-sans leading-tight">Apple Store</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 uppercase leading-none font-mono">Get it on</p>
                  <p className="text-xs font-bold text-white font-sans leading-tight">Google Play</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center">
            {/* Cell Phone mockup container visual */}
            <div className="w-64 h-96 bg-slate-950 border-4 border-slate-800 rounded-[30px] p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="h-4 w-28 bg-slate-800 rounded-full mx-auto" />
              <div className="space-y-2 mt-4">
                <div className="h-6 w-1/2 bg-slate-900 rounded-md" />
                <div className="h-24 w-full bg-slate-900 rounded-lg flex items-center justify-center text-slate-700 text-[10px]">
                  Canvas Chart Preview
                </div>
                <div className="h-10 w-full bg-emerald-500/20 border border-emerald-500/30 rounded-md flex items-center justify-center font-bold text-emerald-400 text-xs">
                  Active Long Position +$180.20
                </div>
              </div>
              <div className="h-8 w-8 bg-slate-800 rounded-full mx-auto mt-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Standard Corporate Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4 md:px-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            <div className="space-y-3">
              <h4 className="text-slate-300 font-bold text-sm tracking-wide">Forex Factory</h4>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                High performance execution infrastructure for worldwide contracts. Supported by multi-asset margin engine and real-time ledger verification.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-slate-300 font-bold text-sm">Assets</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><a onClick={onStartTrading} className="hover:text-teal-400 cursor-pointer">Crypto Core Coins</a></li>
                <li><a onClick={onStartTrading} className="hover:text-teal-400 cursor-pointer">Global Currencies Spot</a></li>
                <li><a onClick={onStartTrading} className="hover:text-teal-400 cursor-pointer">Precious Commodities</a></li>
                <li><a onClick={onStartTrading} className="hover:text-teal-400 cursor-pointer">Industrial S&P Indices</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-slate-300 font-bold text-sm">Legal Protocols</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><a className="hover:text-teal-400 cursor-pointer">AML Declaration policy</a></li>
                <li><a className="hover:text-teal-400 cursor-pointer">OTC Leverage Risk Warning</a></li>
                <li><a className="hover:text-teal-400 cursor-pointer">Terms of Service agreement</a></li>
                <li><a className="hover:text-teal-400 cursor-pointer">Data encryption standards</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-slate-300 font-bold text-sm">Client Channels</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><a onClick={() => onNavigate("news")} className="hover:text-teal-400 cursor-pointer">Global Financial Feed</a></li>
                <li><a onClick={() => onNavigate("news")} className="hover:text-teal-400 cursor-pointer">Economic Event Timers</a></li>
                <li><a onClick={onStartTrading} className="hover:text-teal-400 cursor-pointer">OTC Deposit Hub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 text-center space-y-4">
            <p className="max-w-4xl mx-auto text-[10px] leading-relaxed">
              <strong>OTC LEVERAGE RISK WARNING:</strong> Trading contracts for difference (CFD), foreign Spot markets, commodities, and digital currencies carries excessive risk of immediate margin liquidation. Leverages up to 1:500 multiply profit scope alongside compounding stop-losses. Carefully verify your KYC credentials, and do not commit capital that falls outside of risk limits.
            </p>
            <p className="text-[11px] text-slate-600">
              © 2026 Forex Factory Pro Ltd. All rights reserved. Secured by Nginx edge nodes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
