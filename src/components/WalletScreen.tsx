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
      <div className="flex flex-col h-full bg-[#09090b] items-center justify-center p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-16 h-16 text-rose-500" />
          <div>
            <h3 className="text-rose-400 font-black text-xl mb-2">Wallet Unavailable</h3>
            <p className="text-zinc-400 text-sm">We couldn't connect to the financial server. Please try again.</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="mt-4 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition shadow-lg w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !wallet) {
    return (
      <div className="flex flex-col h-full bg-[#09090b] p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8 animate-pulse">
        <div className="h-64 bg-zinc-900 rounded-3xl border border-zinc-800"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
          <div className="h-32 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] font-sans text-zinc-300 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-4 lg:px-8 sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" /> Financial Dashboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            <button 
              onClick={() => setActiveSubTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveSubTab('deposit')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'deposit' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Deposit
            </button>
            <button 
              onClick={() => setActiveSubTab('withdraw')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'withdraw' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Withdraw
            </button>
            <button 
              onClick={() => setActiveSubTab('transactions')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'transactions' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              History
            </button>
          </div>

          <button 
            onClick={() => refetch()}
            className={`p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ${isFetching ? 'animate-spin text-blue-400' : ''}`}
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
                className="group relative overflow-hidden bg-zinc-900/50 border border-zinc-800/80 hover:border-blue-500/50 rounded-2xl p-6 text-left transition-all hover:bg-zinc-900"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Download className="w-5 h-5 text-blue-400" /> Deposit Funds
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Add capital to your trading account.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSubTab('withdraw')}
                className="group relative overflow-hidden bg-zinc-900/50 border border-zinc-800/80 hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all hover:bg-zinc-900"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-colors"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-purple-400" /> Withdraw Funds
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Transfer equity to your bank.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-zinc-400 group-hover:text-white" />
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
