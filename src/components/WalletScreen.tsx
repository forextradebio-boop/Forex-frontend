import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import WalletCard from './WalletCard';
import DepositScreen from './DepositScreen';
import WithdrawScreen from './WithdrawScreen';
import TransactionHistoryScreen from './TransactionHistoryScreen';
import { Wallet, RefreshCw, AlertCircle, TrendingUp, Download, Upload, ArrowLeft } from 'lucide-react';

export type WalletSubTab = 'dashboard' | 'deposit' | 'withdraw' | 'transactions';

interface WalletScreenProps {
  initialTab?: WalletSubTab;
  onBack?: () => void;
}

export default function WalletScreen({ initialTab = 'dashboard', onBack }: WalletScreenProps) {
  const { data: wallet, isLoading, isError, refetch, isFetching } = useWallet();
  const [activeSubTab, setActiveSubTab] = useState<WalletSubTab>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  if (isError) {
    return (
      <div className="flex flex-col h-full bg-lb-panel items-center justify-center p-6">
        <div className="bg-lb-down/10 border border-lb-down/20 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-16 h-16 text-lb-down" />
          <div>
            <h3 className="text-lb-down font-black text-xl mb-2">Wallet Unavailable</h3>
            <p className="text-lb-text-muted text-sm">We couldn't connect to the financial server. Please try again.</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="mt-4 bg-lb-down hover:bg-lb-down/80 text-lb-text px-8 py-3 rounded-xl font-bold text-sm transition shadow-lg w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !wallet) {
    return (
      <div className="flex flex-col h-full bg-lb-panel p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8 animate-pulse">
        <div className="h-64 bg-lb-bg rounded-3xl border border-lb-border"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-lb-bg rounded-2xl border border-lb-border"></div>
          <div className="h-32 bg-lb-bg rounded-2xl border border-lb-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-lb-panel font-sans text-lb-text relative" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* Header */}
      <div className="border-b border-lb-border bg-lb-panel/80 backdrop-blur-md p-4 lg:px-8 sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg bg-lb-bg border border-lb-border text-lb-text hover:text-lb-text transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-xl font-black text-lb-text tracking-wide flex items-center gap-2">
            <Wallet className="w-5 h-5 text-lb-accent" /> Financial Dashboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-lb-bg/80 border border-lb-border/50 rounded-xl p-1.5 overflow-x-auto shadow-inner hide-scrollbar gap-1">
            <button 
              onClick={() => setActiveSubTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 active:scale-95 ${activeSubTab === 'dashboard' ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]' : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover hover:-translate-y-0.5'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveSubTab('deposit')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 active:scale-95 ${activeSubTab === 'deposit' ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]' : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover hover:-translate-y-0.5'}`}
            >
              Deposit
            </button>
            <button 
              onClick={() => setActiveSubTab('withdraw')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 active:scale-95 ${activeSubTab === 'withdraw' ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]' : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover hover:-translate-y-0.5'}`}
            >
              Withdraw
            </button>
            <button 
              onClick={() => setActiveSubTab('transactions')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 active:scale-95 ${activeSubTab === 'transactions' ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]' : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover hover:-translate-y-0.5'}`}
            >
              History
            </button>
          </div>

          <button 
            onClick={() => refetch()}
            className={`p-2 rounded-lg bg-lb-bg hover:bg-lb-panel-hover border border-lb-border text-lb-text-muted hover:text-lb-text transition-colors ${isFetching ? 'animate-spin text-lb-accent' : ''}`}
            title="Force Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full space-y-8 pt-20 md:pt-8 overflow-y-auto pb-28">
        
        {activeSubTab === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Premium Widget */}
            <WalletCard wallet={wallet} />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveSubTab('deposit')}
                className="group relative overflow-hidden bg-lb-bg/50 border border-lb-border/80 hover:border-lb-accent/50 rounded-2xl p-6 text-left transition-all hover:bg-lb-bg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-lb-accent/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-lb-accent/20 transition-colors"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-lb-text flex items-center gap-2">
                      <Download className="w-5 h-5 text-lb-accent" /> Deposit Funds
                    </h3>
                    <p className="text-sm text-lb-text-muted mt-1">Add capital to your trading account.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-lb-panel border border-lb-border flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-lb-text-muted group-hover:text-lb-text" />
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSubTab('withdraw')}
                className="group relative overflow-hidden bg-lb-bg/50 border border-lb-border/80 hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all hover:bg-lb-bg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-colors"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-lb-text flex items-center gap-2">
                      <Upload className="w-5 h-5 text-purple-400" /> Withdraw Funds
                    </h3>
                    <p className="text-sm text-lb-text-muted mt-1">Transfer equity to your bank.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-lb-panel border border-lb-border flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-lb-text-muted group-hover:text-lb-text" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : activeSubTab === 'deposit' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
            <DepositScreen />
          </div>
        ) : activeSubTab === 'withdraw' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
            <WithdrawScreen wallet={wallet} />
          </div>
        ) : activeSubTab === 'transactions' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TransactionHistoryScreen />
          </div>
        ) : null}

      </div>
    </div>
  );
}
