import React, { useState, useMemo, useCallback } from 'react';
import { useMarketStream } from '../hooks/useMarketStream';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { register, login } from '../services/auth';
import { UserWallet, Position } from '../types';

import { TerminalHeader } from './terminal/TerminalHeader';
import { MarketWatch } from './terminal/MarketWatch';
import { TradingChart } from './terminal/TradingChart';
import { OneClickTrading } from './terminal/OneClickTrading';
import { BottomTerminal } from './terminal/BottomTerminal';
import { MobileNavigation, MobileTab } from './terminal/MobileNavigation';
import ProfileScreen from './ProfileScreen';
import { MobileOrderScreen } from './terminal/MobileOrderScreen';
import { Sidebar, WalletSubTab } from './terminal/Sidebar';
import { RegisterScreen } from './terminal/RegisterScreen';
import { KYCScreen } from './terminal/KYCScreen';
import { LoginScreen } from './terminal/LoginScreen';
import WalletScreen from './WalletScreen';
import NewsScreen from './NewsScreen';
import CalendarScreen from './CalendarScreen';

interface ProTradingDashboardProps {
  wallet: UserWallet;
  positions: Position[];
  closedHistory: any[];
  userId: string;
  onPlaceOrder: (orderPayload: any) => Promise<void>;
  onClosePosition: (posId: string) => Promise<void>;
}

const ProTradingDashboard = ({
  wallet,
  positions,
  closedHistory,
  userId,
  onPlaceOrder,
  onClosePosition
}: ProTradingDashboardProps) => {
  const { isConnected } = useSocket();
  const { symbols } = useMarketStream();

  // Dashboard State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('chart');
  
  // Order State
  const [orderVolume, setOrderVolume] = useState<string>('0.10');
  const [orderSL, setOrderSL] = useState<string>('');
  const [orderTP, setOrderTP] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('ALL');
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [historySubTab, setHistorySubTab] = useState<'POSITIONS' | 'ORDERS' | 'DEALS'>('POSITIONS');
  const [historySortDesc, setHistorySortDesc] = useState(true);
  const [quoteMenuSymbol, setQuoteMenuSymbol] = useState<string | null>(null);
  const [positionMenuId, setPositionMenuId] = useState<string | null>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [isNavyTheme, setIsNavyTheme] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authFlowState, setAuthFlowState] = useState<'NONE' | 'REGISTER' | 'KYC' | 'LOGIN'>('NONE');
  const { login: setAuthState, user: authUser, logout: handleLogout } = useAuth();
  const [walletPageTab, setWalletPageTab] = useState<WalletSubTab>('dashboard');
  const [activeView, setActiveView] = useState<'terminal' | 'wallet' | 'news' | 'calendar' | 'profile'>('terminal');

  const handleRegister = async (username: string, password: string, confirmPassword: string) => {
    const response = await register({ username, password, confirmPassword });
    if (response.success && response.token && response.refreshToken && response.profile) {
      setAuthState(response.token, response.refreshToken, response.profile);
      setAuthFlowState('KYC');
    }
  };

  const handleLogin = async (username: string, password: string) => {
    const response = await login({ username, password });
    if (response.success && response.token && response.refreshToken && response.profile) {
      setAuthState(response.token, response.refreshToken, response.profile);
    }
  };

  // Live Price derived from Market Stream
  const currentSymbolData = useMemo(() => {
    return symbols.find(s => s.symbol.replace('/', '') === selectedSymbol);
  }, [symbols, selectedSymbol]);

  const liveBid = currentSymbolData?.bid || currentSymbolData?.price || 0;
  const liveAsk = currentSymbolData?.ask || currentSymbolData?.price || 0;

  // Financials
  const liveEquity = useMemo(() => {
    const activePnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    return wallet.balance + activePnl;
  }, [wallet.balance, positions]);

  const liveMargin = useMemo(() => {
    return positions.reduce((sum, p) => {
      const pPrice = p.currentPrice || p.entryPrice;
      const nominal = (p.size || 0) * 100000 * pPrice;
      return sum + (nominal / 100); // Assuming 1:100 leverage for display
    }, 0);
  }, [positions]);

  const liveFreeMargin = liveEquity - liveMargin;

  // Execution
  const executeOrder = useCallback(async (side: 'BUY' | 'SELL') => {
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);
    try {
      await onPlaceOrder({
        symbol: selectedSymbol,
        side,
        type: 'MARKET',
        size: parseFloat(orderVolume),
        slPrice: orderSL ? parseFloat(orderSL) : undefined,
        tpPrice: orderTP ? parseFloat(orderTP) : undefined,
        limitPrice: side === 'BUY' ? liveAsk : liveBid
      });
      setOrderSL('');
      setOrderTP('');
      // Switch to trade tab on mobile if order succeeds
      if (window.innerWidth < 768) {
        setActiveMobileTab('trade');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
    }
  }, [selectedSymbol, isPlacingOrder, orderVolume, orderSL, orderTP, liveAsk, liveBid, onPlaceOrder]);

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden ${isNavyTheme ? 'navy-theme bg-[#0b1120]' : 'bg-slate-100'} text-slate-900`}>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onGetStarted={() => { setIsSidebarOpen(false); setAuthFlowState('REGISTER'); }}
        onNavigateWallet={(tab) => { setWalletPageTab(tab); setActiveView('wallet'); setIsSidebarOpen(false); }}
        onNavigateProfile={() => { setActiveView('profile'); setIsSidebarOpen(false); }}
        onNavigateNews={() => { setActiveView('news'); setIsSidebarOpen(false); }}
        onNavigateCalendar={() => { setActiveView('calendar'); setIsSidebarOpen(false); }}
        userProfile={authUser ? { id: authUser.id, username: authUser.username || authUser.fullName || authUser.email || 'User' } : null}
        onLogout={() => { handleLogout(); setIsSidebarOpen(false); }}
      />
      {authFlowState === 'REGISTER' && <RegisterScreen onBack={() => setAuthFlowState('NONE')} onSubmit={handleRegister} />}
      {authFlowState === 'KYC' && <KYCScreen onBack={() => setAuthFlowState('REGISTER')} onSubmit={() => setAuthFlowState('LOGIN')} />}
      {authFlowState === 'LOGIN' && <LoginScreen onBack={() => setAuthFlowState('KYC')} onLoginSuccess={() => setAuthFlowState('NONE')} onSubmit={handleLogin} />}

      {/* WALLETS PAGE */}
      {activeView === 'wallet' && (
        <div className="flex-1 flex flex-col min-h-0">
          <WalletScreen initialTab={walletPageTab} onBack={() => setActiveView('terminal')} />
        </div>
      )}
      {activeView === 'news' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#09090b] text-zinc-300">
          <div className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-white tracking-wide">Premium Market News</h1>
          </div>
          <NewsScreen />
        </div>
      )}
      {activeView === 'calendar' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#09090b] text-zinc-300">
          <div className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-white tracking-wide">Economic Calendar</h1>
          </div>
          <CalendarScreen />
        </div>
      )}
      {activeView === 'profile' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#09090b] text-zinc-300">
          <div className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-white tracking-wide">Profile</h1>
          </div>
          <ProfileScreen />
        </div>
      )}
      {activeView === 'terminal' && (
        <>
          {/* HEADER - Hidden on mobile, Mobile has its own top bar or relies on tabs */}
      <div className="hidden md:block shrink-0">
        <TerminalHeader 
          isConnected={isConnected} 
          balance={wallet.balance} 
          equity={liveEquity} 
          freeMargin={liveFreeMargin} 
        />
      </div>

      {/* MOBILE TOP BAR (For Chart/Quotes) */}
      <div className={`md:hidden shrink-0 bg-white border-b border-slate-200 items-center justify-between px-4 shadow-sm relative ${activeMobileTab === 'trade' || activeMobileTab === 'new_order' ? 'hidden' : 'flex h-12'}`}>
         <button onClick={() => setIsSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center text-slate-700 active:bg-slate-100 rounded-full -ml-2">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
         </button>
         <span className="font-bold text-slate-800 tracking-wide capitalize absolute left-1/2 -translate-x-1/2">
           {activeMobileTab === 'quotes' && 'Quotes'}
           {activeMobileTab === 'chart' && selectedSymbol}
           {activeMobileTab === 'history' && 'History'}
           {activeMobileTab === 'profile' && 'Profile'}
         </span>
         <div className="w-9 h-9" />
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* DESKTOP LEFT: Market Watch */}
        <div className="hidden md:flex shrink-0">
          <MarketWatch selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
        </div>

        {/* MOBILE: Conditional Rendering based on Tabs */}
        {/* DESKTOP CENTER: Chart + OCT */}
        <main className={`flex-1 flex flex-col relative min-w-0 ${activeMobileTab !== 'chart' ? 'hidden md:flex' : 'flex'}`}>
          <TradingChart symbol={selectedSymbol} isNavyTheme={isNavyTheme} />
          
          {/* Desktop Overlay OCT */}
          <div className="hidden md:block absolute top-4 right-4 shadow-2xl rounded-xl z-10">
            <OneClickTrading 
              selectedSymbol={selectedSymbol}
              liveBid={liveBid} liveAsk={liveAsk}
              orderVolume={orderVolume} setOrderVolume={setOrderVolume}
              orderSL={orderSL} setOrderSL={setOrderSL}
              orderTP={orderTP} setOrderTP={setOrderTP}
              isPlacingOrder={isPlacingOrder} executeOrder={executeOrder}
            />
          </div>
        </main>

        {/* MOBILE PANELS */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden ${activeMobileTab !== 'quotes' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
           <MarketWatch selectedSymbol={selectedSymbol} onSelectSymbol={(sym) => {
             setSelectedSymbol(sym);
             setQuoteMenuSymbol(sym);
           }} />
        </div>

        <div className={`flex-1 flex flex-col bg-white overflow-y-auto ${activeMobileTab !== 'trade' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
           {/* Top Header replacement for Trade Tab */}
           <div className="p-4 pt-6 flex flex-col bg-white">
             <div className="flex justify-center items-start w-full">
               <span className="text-2xl font-bold text-blue-600 tracking-tight">{(liveEquity - wallet.balance).toFixed(2)} USD</span>
             </div>
             
             <div className="flex flex-col gap-1.5 text-[13px] mt-6 px-1">
               <div className="flex justify-between"><span className="text-slate-700">Balance:</span><span className="font-mono">{wallet.balance.toFixed(2)}</span></div>
               <div className="flex justify-between"><span className="text-slate-700">Equity:</span><span className="font-mono">{liveEquity.toFixed(2)}</span></div>
               <div className="flex justify-between"><span className="text-slate-700">Margin:</span><span className="font-mono">{liveMargin.toFixed(2)}</span></div>
               <div className="flex justify-between"><span className="text-slate-700">Free Margin:</span><span className="font-mono">{liveFreeMargin.toFixed(2)}</span></div>
               <div className="flex justify-between"><span className="text-slate-700">Margin Level (%):</span><span className="font-mono">{liveMargin > 0 ? ((liveEquity / liveMargin) * 100).toFixed(2) : '0.00'}</span></div>
             </div>
           </div>
           
           <div className="bg-slate-100 px-3 py-1.5 font-bold text-sm text-slate-800 flex justify-between items-center">
             <span>Positions</span>
             <span className="text-slate-400 tracking-widest text-lg leading-none -mt-2">...</span>
           </div>
           
           {/* Mobile Positions List */}
           <div className="flex-1 overflow-y-auto bg-white pb-32">
             {positions.map(p => (
               <div key={p.id} className="border-b border-slate-100 bg-white flex flex-col">
                 <div className="px-4 py-3 flex justify-between items-center" 
                      onClick={() => {
                        setExpandedPositionId(p.id);
                        setPositionMenuId(p.id);
                      }}>
                   <div className="flex flex-col gap-0.5">
                     <div className="flex items-baseline gap-1">
                       <span className="font-bold text-slate-900 text-[15px]">{p.symbol}</span>
                       <span className={`text-[13px] font-semibold ${p.side === 'BUY' ? 'text-blue-600' : 'text-red-500'}`}>{p.side.toLowerCase()} {p.size.toFixed(2)}</span>
                     </div>
                     <span className="text-[13px] text-slate-500 font-mono tracking-tight">{p.entryPrice.toFixed(5)} → {p.currentPrice?.toFixed(5)}</span>
                   </div>
                   <span className={`font-bold text-[19px] tracking-tight ${p.pnl && p.pnl >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                     {p.pnl?.toFixed(2) || '0.00'}
                   </span>
                 </div>
                 {expandedPositionId === p.id && (
                   <div className="px-4 pb-3 flex flex-col gap-1 text-[13px] text-slate-500 bg-slate-50/50 pt-2 border-t border-slate-50">
                     <div className="flex justify-between">
                       <span className="w-16">S/L:</span>
                       <span className="text-slate-800 flex-1">-</span>
                       <span className="w-16 text-right">Swap:</span>
                       <span className="text-slate-800 w-16 text-right">0.00</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="w-16">T/P:</span>
                       <span className="text-slate-800 flex-1">-</span>
                       <span className="w-16 text-right">Taxes:</span>
                       <span className="text-slate-800 w-16 text-right">0.00</span>
                     </div>
                     <div className="flex justify-between mt-1 pt-1 border-t border-slate-100">
                       <span>Time:</span>
                       <span className="text-slate-800">{new Date(p.timestamp).toLocaleString()}</span>
                     </div>
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>

        <div className={`flex-1 flex flex-col bg-slate-50 overflow-hidden ${activeMobileTab !== 'history' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
          {/* MT5 Style History Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-100 z-10 relative">
            <button 
              onClick={() => setHistorySortDesc(!historySortDesc)}
              className="w-8 h-8 rounded-full bg-blue-50/50 text-blue-600 flex items-center justify-center transition-transform"
              style={{ transform: historySortDesc ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
            </button>
            <div className="flex bg-slate-100/80 rounded-full p-1 text-[13px] font-semibold text-slate-600">
              <button 
                onClick={() => setHistorySubTab('POSITIONS')}
                className={`px-3 py-1 rounded-full transition-all ${historySubTab === 'POSITIONS' ? 'bg-white shadow-sm text-slate-900' : ''}`}>Positions</button>
              <button 
                onClick={() => setHistorySubTab('ORDERS')}
                className={`px-3 py-1 rounded-full transition-all ${historySubTab === 'ORDERS' ? 'bg-white shadow-sm text-slate-900' : ''}`}>Orders</button>
              <button 
                onClick={() => setHistorySubTab('DEALS')}
                className={`px-3 py-1 rounded-full transition-all ${historySubTab === 'DEALS' ? 'bg-white shadow-sm text-slate-900' : ''}`}>Deals</button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowHistoryMenu(!showHistoryMenu)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showHistoryMenu ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-700'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </button>
              {showHistoryMenu && (
                <div className="absolute top-10 right-0 bg-white shadow-xl border border-slate-100 rounded-xl w-36 py-1 z-50 text-sm font-semibold text-slate-700">
                  <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setHistoryFilter('TODAY'); setShowHistoryMenu(false); }}>Today</div>
                  <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setHistoryFilter('WEEK'); setShowHistoryMenu(false); }}>Last Week</div>
                  <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setHistoryFilter('MONTH'); setShowHistoryMenu(false); }}>Last Month</div>
                  <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setHistoryFilter('YEAR'); setShowHistoryMenu(false); }}>Last Year</div>
                  <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-blue-600" onClick={() => { setHistoryFilter('ALL'); setShowHistoryMenu(false); }}>All History</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white relative">
             {historySubTab !== 'POSITIONS' ? (
               <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm font-semibold">
                 No {historySubTab.toLowerCase()} found for this period.
               </div>
             ) : (
               <>
                 {closedHistory
                   .filter(item => {
                     if (historyFilter === 'ALL') return true;
                     const itemDate = new Date(item.timestamp);
                     const now = new Date();
                     if (historyFilter === 'TODAY') return itemDate.toDateString() === now.toDateString();
                     if (historyFilter === 'WEEK') return now.getTime() - itemDate.getTime() < 7 * 24 * 60 * 60 * 1000;
                     if (historyFilter === 'MONTH') return now.getTime() - itemDate.getTime() < 30 * 24 * 60 * 60 * 1000;
                     if (historyFilter === 'YEAR') return now.getTime() - itemDate.getTime() < 365 * 24 * 60 * 60 * 1000;
                     return true;
                   })
                   .sort((a, b) => {
                     const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                     return historySortDesc ? diff : -diff;
                   })
                   .map((item, idx) => (
               <div key={idx} className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-start bg-white">
                 {item.type === 'DEPOSIT' || item.type === 'WITHDRAWAL' ? (
                   <>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-[15px] text-slate-900">{item.type === 'DEPOSIT' ? 'Balance' : 'Withdrawal'}</span>
                      <span className="text-[13px] text-slate-400 font-mono tracking-tight">{item.id || `D-trial-USD-${new Date(item.timestamp).getTime().toString().slice(-10)}`}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-semibold text-[15px] tracking-tight text-blue-600">{item.amount.toFixed(2)}</span>
                      <span className="text-[13px] text-slate-500 font-mono tracking-tight">
                        {new Date(item.timestamp).toISOString().replace('T', ' ').slice(0, 19).replace(/-/g, '.')}
                      </span>
                    </div>
                   </>
                 ) : (
                   <>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-slate-900 text-[15px]">{item.symbol}</span>
                        <span className={`text-[13px] font-semibold ${item.side === 'BUY' ? 'text-blue-600' : 'text-red-500'}`}>{item.side?.toLowerCase()} {item.size?.toFixed(2) || '0.10'}</span>
                      </div>
                      <span className="text-[13px] text-slate-500 font-mono tracking-tight">{item.entryPrice?.toFixed(3)} → {item.closePrice?.toFixed(3)}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`font-semibold text-[15px] tracking-tight ${item.pnl && item.pnl >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {item.pnl?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-[13px] text-slate-500 font-mono tracking-tight">
                        {new Date(item.timestamp).toISOString().replace('T', ' ').slice(0, 19).replace(/-/g, '.')}
                      </span>
                    </div>
                   </>
                 )}
               </div>
             ))}
             </>
             )}

             {/* History Summary Footer */}
             <div className="px-4 py-4 bg-white flex flex-col gap-2 text-[14px]">
               <div className="flex justify-between">
                 <span className="text-slate-800">Deposit</span>
                 <span className="font-bold text-slate-900 font-mono">
                   {closedHistory.filter(h => h.type === 'DEPOSIT').reduce((s, h) => s + h.amount, 0).toFixed(2)}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-800">Profit</span>
                 <span className="font-bold text-slate-900 font-mono">
                   {closedHistory.filter(h => h.type !== 'DEPOSIT' && h.type !== 'WITHDRAWAL').reduce((s, h) => s + (h.pnl || 0), 0).toFixed(2)}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-800">Swap</span>
                 <span className="font-bold text-slate-900 font-mono">0.00</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-800">Commission</span>
                 <span className="font-bold text-slate-900 font-mono">0.00</span>
               </div>
               <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
                 <span className="text-slate-800">Balance</span>
                 <span className="font-bold text-slate-900 font-mono">
                   {(
                     closedHistory.filter(h => h.type === 'DEPOSIT').reduce((s, h) => s + h.amount, 0) + 
                     closedHistory.filter(h => h.type !== 'DEPOSIT' && h.type !== 'WITHDRAWAL').reduce((s, h) => s + (h.pnl || 0), 0) - 
                     closedHistory.filter(h => h.type === 'WITHDRAWAL').reduce((s, h) => s + h.amount, 0)
                   ).toFixed(2)}
                 </span>
               </div>
             </div>
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-[#09090b] overflow-y-auto ${activeMobileTab !== 'profile' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
          <ProfileScreen />
        </div>

      </div>

      {/* DESKTOP BOTTOM TERMINAL */}
      <div className="hidden md:block shrink-0 z-20 relative">
        <BottomTerminal positions={positions} closedHistory={closedHistory} onClosePosition={onClosePosition} />
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden shrink-0 z-30">
        <MobileNavigation activeTab={activeMobileTab} setActiveTab={setActiveMobileTab} />
      </div>

      {/* MOBILE POPUP MENU */}
      {quoteMenuSymbol && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-4 pb-8 flex flex-col gap-3 relative shadow-2xl animate-in slide-in-from-bottom-4">
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />
             <div className="font-bold text-center text-lg mb-2">{quoteMenuSymbol}: Forex</div>
             <button onClick={() => { setQuoteMenuSymbol(null); setActiveMobileTab('new_order'); }} className="py-3.5 bg-slate-100 rounded-xl font-bold text-slate-800 active:bg-slate-200 transition-colors text-center text-lg">Trade</button>
             <button onClick={() => { setQuoteMenuSymbol(null); setActiveMobileTab('chart'); }} className="py-3.5 bg-slate-100 rounded-xl font-bold text-slate-800 active:bg-slate-200 transition-colors text-center text-lg">Chart</button>
             <button onClick={() => setQuoteMenuSymbol(null)} className="py-3.5 mt-1 bg-red-50 text-red-600 rounded-xl font-bold active:bg-red-100 transition-colors text-center text-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* MOBILE ORDER SCREEN */}
      {/* POSITION MENU */}
      {positionMenuId && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 animate-in fade-in" onClick={() => { setPositionMenuId(null); setExpandedPositionId(null); }}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl mx-2 mb-4 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
             <div className="py-2.5 bg-white/60 border-b border-slate-200 text-center text-[13px] font-bold text-slate-800 flex flex-col">
               {positions.find(pos => pos.id === positionMenuId)?.symbol}
               <span className="font-normal text-slate-500 text-[11px]">{positions.find(pos => pos.id === positionMenuId)?.side === 'BUY' ? 'buy' : 'sell'} {positions.find(pos => pos.id === positionMenuId)?.size.toFixed(2)}</span>
             </div>
             <button onClick={() => { 
                onClosePosition(positionMenuId); 
                setPositionMenuId(null); 
                setExpandedPositionId(null); 
             }} className="py-4 bg-white/60 border-b border-slate-200 text-[#ff3b30] font-normal active:bg-slate-200 transition-colors text-center text-[19px]">Close position</button>
             <button onClick={() => { setPositionMenuId(null); }} className="py-4 bg-white/60 border-b border-slate-200 text-[#007aff] font-normal active:bg-slate-200 transition-colors text-center text-[19px]">Modify position</button>
             <button onClick={() => { 
                const p = positions.find(pos => pos.id === positionMenuId);
                setPositionMenuId(null); 
                if (p) setSelectedSymbol(p.symbol);
                setActiveMobileTab('new_order'); 
             }} className="py-4 bg-white/60 border-b border-slate-200 text-[#007aff] font-normal active:bg-slate-200 transition-colors text-center text-[19px]">Trade</button>
             <button onClick={() => { 
                const p = positions.find(pos => pos.id === positionMenuId);
                setPositionMenuId(null); 
                if (p) setSelectedSymbol(p.symbol);
                setActiveMobileTab('chart'); 
             }} className="py-4 bg-white/60 border-b border-slate-200 text-[#007aff] font-normal active:bg-slate-200 transition-colors text-center text-[19px]">Chart</button>
             <button onClick={() => { setPositionMenuId(null); }} className="py-4 bg-white/60 text-[#007aff] font-normal active:bg-slate-200 transition-colors text-center text-[19px]">Bulk Operations...</button>
          </div>
          <div className="bg-white rounded-2xl mx-2 mb-8 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
             <button onClick={() => { setPositionMenuId(null); setExpandedPositionId(null); }} className="py-4 bg-white text-[#007aff] font-bold active:bg-slate-200 transition-colors text-center text-[19px]">Cancel</button>
          </div>
        </div>
      )}

      {activeMobileTab === 'new_order' && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <MobileOrderScreen 
            symbol={selectedSymbol}
            onClose={() => setActiveMobileTab('quotes')}
            liveBid={liveBid}
            liveAsk={liveAsk}
            orderVolume={orderVolume} setOrderVolume={setOrderVolume}
            orderSL={orderSL} setOrderSL={setOrderSL}
            orderTP={orderTP} setOrderTP={setOrderTP}
            isPlacingOrder={isPlacingOrder} executeOrder={executeOrder}
          />
        </div>
      )}
      </>
      )}

    </div>
  );
};

export default React.memo(ProTradingDashboard);
