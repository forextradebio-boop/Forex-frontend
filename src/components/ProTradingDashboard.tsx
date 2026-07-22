import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme } from '../theme';
import { useMarketStream } from '../hooks/useMarketStream';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { register, login } from '../services/auth';
import { UserWallet, Position } from '../types';

import { TerminalHeader } from './terminal/TerminalHeader';
import { MarketWatch } from './terminal/MarketWatch';
import { TradingViewChart, TIMEFRAMES } from './TradingViewChart';
import { OneClickTrading } from './terminal/OneClickTrading';
import { BottomTerminal } from './terminal/BottomTerminal';
import { MobileNavigation, MobileTab } from './terminal/MobileNavigation';
import { SymbolActionSheet } from './terminal/SymbolActionSheet';
import ProfileScreen from './ProfileScreen';
import { MobileOrderScreen } from './terminal/MobileOrderScreen';
import { Sidebar, WalletSubTab } from './terminal/Sidebar';
import { RegisterScreen } from './terminal/RegisterScreen';
import { KYCScreen } from './terminal/KYCScreen';
import { LoginScreen } from './terminal/LoginScreen';
import WalletScreen from './WalletScreen';
import NewsScreen from './NewsScreen';
import CalendarScreen from './CalendarScreen';
import { AboutScreen } from './terminal/AboutScreen';
import { FilePlus } from 'lucide-react';

const formatPrice = (price: number | undefined | null) => {
  if (price == null) return '-';
  return price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 5 }).replace(/,/g, ' ');
};

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
  const { themeMode, setThemeMode } = useTheme();

  // Dashboard State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [chartInterval, setChartInterval] = useState<string>('15m');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('chart');
  const [actionSheetSymbol, setActionSheetSymbol] = useState<any | null>(null);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  
  // Order State
  const [orderVolume, setOrderVolume] = useState<string>('0.10');
  const [orderSL, setOrderSL] = useState<string>('');
  const [orderTP, setOrderTP] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [oneClickEnabled, setOneClickEnabled] = useState<boolean>(() => {
    return localStorage.getItem('forex_one_click') !== 'false';
  });
  const [pendingOrder, setPendingOrder] = useState<{side: 'BUY'|'SELL'} | null>(null);

  useEffect(() => {
    localStorage.setItem('forex_one_click', String(oneClickEnabled));
  }, [oneClickEnabled]);
  const [historyFilter, setHistoryFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('ALL');
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [historySubTab, setHistorySubTab] = useState<'POSITIONS' | 'ORDERS' | 'DEALS'>('POSITIONS');
  const [historySortDesc, setHistorySortDesc] = useState(true);
  const [positionMenuId, setPositionMenuId] = useState<string | null>(null);
  const [closeConfirmationPositionId, setCloseConfirmationPositionId] = useState<string | null>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [isClosingPosition, setIsClosingPosition] = useState(false);
  const { login: setAuthState, user: authUser, logout: handleLogout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authFlowState, setAuthFlowState] = useState<'NONE' | 'REGISTER' | 'KYC' | 'LOGIN'>(authUser ? 'NONE' : 'LOGIN');

  useEffect(() => {
    if (authUser && authFlowState === 'LOGIN') {
      setAuthFlowState('NONE');
    } else if (!authUser && authFlowState === 'NONE') {
      setAuthFlowState('LOGIN');
    }
  }, [authUser, authFlowState]);
  const [walletPageTab, setWalletPageTab] = useState<WalletSubTab>('dashboard');
  const [activeView, setActiveView] = useState<'terminal' | 'wallet' | 'news' | 'calendar' | 'profile' | 'about'>('terminal');

  const handleRegister = async (username: string, password: string, confirmPassword: string) => {
    const response = await register({ username, password, confirmPassword });
    const token = response?.token;
    const refreshToken = response?.refreshToken;
    const profile = response?.profile;

    if (token && refreshToken && profile) {
      setAuthState(token, refreshToken, profile);
      setAuthFlowState('KYC');
      return;
    }

    throw new Error(response?.error || 'Registration failed. Please try again.');
  };

  const handleLogin = async (username: string, password: string) => {
    const response = await login({ username, password });
    if (response.success && response.token && response.refreshToken && response.profile) {
      setAuthState(response.token, response.refreshToken, response.profile);
      return;
    }
    throw new Error(response?.error || 'Login failed. Please try again.');
  };

  // Live Price derived from Market Stream
  const currentSymbolData = useMemo(() => {
    return symbols.find(s => s.symbol.replace('/', '') === selectedSymbol);
  }, [symbols, selectedSymbol]);

  const liveBid = currentSymbolData?.bid || currentSymbolData?.price || 0;
  const liveAsk = currentSymbolData?.ask || currentSymbolData?.price || 0;

  const liveEquity = wallet.equity ?? wallet.balance;
  const liveMargin = wallet.usedMargin ?? 0;
  const liveFreeMargin = wallet.freeMargin ?? wallet.balance;

  const parseHistoryDate = (value: any, fallback?: any) => {
    const date = new Date(value ?? fallback ?? Date.now());
    if (Number.isNaN(date.getTime())) {
      return new Date(fallback ?? Date.now());
    }
    return date;
  };

  const executeOrderBackend = useCallback(async (side: 'BUY' | 'SELL') => {
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
      if (window.innerWidth < 768) {
        setActiveMobileTab('trade');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
      setPendingOrder(null);
    }
  }, [selectedSymbol, isPlacingOrder, orderVolume, orderSL, orderTP, liveAsk, liveBid, onPlaceOrder]);

  const executeOrder = useCallback((side: 'BUY' | 'SELL') => {
    const vol = parseFloat(orderVolume);
    if (isNaN(vol) || vol <= 0) {
      alert('Invalid Volume');
      return;
    }
    
    if (oneClickEnabled) {
      executeOrderBackend(side);
    } else {
      setPendingOrder({ side });
    }
  }, [orderVolume, oneClickEnabled, executeOrderBackend]);


  // Filtered History for Mobile List & Footer
  const filteredHistory = useMemo(() => {
    return closedHistory.filter(item => {
      // Filter out non-approved deposits and withdrawals
      if ((item.type === 'DEPOSIT' || item.type === 'WITHDRAWAL' || item.type === 'WITHDRAW') && item.status !== 'APPROVED') {
        return false;
      }

      if (historyFilter === 'ALL') return true;
      const itemDate = parseHistoryDate(item.timestamp ?? item.entryDate);
      const now = new Date();
      if (historyFilter === 'TODAY') return itemDate.toDateString() === now.toDateString();
      if (historyFilter === 'WEEK') return now.getTime() - itemDate.getTime() < 7 * 24 * 60 * 60 * 1000;
      if (historyFilter === 'MONTH') return now.getTime() - itemDate.getTime() < 30 * 24 * 60 * 60 * 1000;
      if (historyFilter === 'YEAR') return now.getTime() - itemDate.getTime() < 365 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [closedHistory, historyFilter]);

  // Calculate footer totals using the filtered list (simulating MT5 period totals)
  const historyProfit = filteredHistory.filter(h => h.historyType === 'trade').reduce((s, h) => s + (Number(h.pnl) || 0), 0);
  const historyWithdrawal = filteredHistory.filter(h => ((h.type === 'WITHDRAWAL' || h.type === 'WITHDRAW') && h.status === 'APPROVED') || (h.type === 'ADMIN_ADJUSTMENT' && h.amount < 0)).reduce((s, h) => s + Math.abs(Number(h.amount) || 0), 0);
  let historyDeposit = filteredHistory.filter(h => (h.type === 'DEPOSIT' && h.status === 'APPROVED') || (h.type === 'ADMIN_ADJUSTMENT' && h.amount > 0)).reduce((s, h) => s + (Number(h.amount) || 0), 0);
  
  // Backwards compatibility for testing: If filter is ALL, but no deposit is recorded and they have a wallet balance.
  if (historyFilter === 'ALL' && historyDeposit === 0 && (wallet.balance || 0) > 0) {
    historyDeposit = (wallet.balance || 0) - historyProfit + historyWithdrawal;
  }
  
  const historyBalance = historyDeposit + historyProfit - historyWithdrawal;

  return (
    <div className="h-[100dvh] w-full flex flex-col font-sans overflow-hidden bg-lb-bg text-lb-text">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onGetStarted={() => { setIsSidebarOpen(false); setAuthFlowState('REGISTER'); }}
        onNavigateWallet={(tab) => { setWalletPageTab(tab); setActiveView('wallet'); setIsSidebarOpen(false); }}
        onNavigateProfile={() => { setActiveView('profile'); setIsSidebarOpen(false); }}
        onNavigateNews={() => { setActiveView('news'); setIsSidebarOpen(false); }}
        onNavigateCalendar={() => { setActiveView('calendar'); setIsSidebarOpen(false); }}
        onNavigateAbout={() => { setActiveView('about'); setIsSidebarOpen(false); }}
        userProfile={authUser ? { id: authUser.id, username: authUser.username || authUser.fullName || authUser.email || 'User' } : null}
        onLogout={() => { handleLogout(); setIsSidebarOpen(false); }}
      />
      {authFlowState === 'REGISTER' && <RegisterScreen onBack={() => setAuthFlowState('LOGIN')} onSubmit={handleRegister} />}
      {authFlowState === 'KYC' && <KYCScreen onBack={() => setAuthFlowState('REGISTER')} onSubmit={() => setAuthFlowState('NONE')} />}
      {authFlowState === 'LOGIN' && (
        <LoginScreen
          onLoginSuccess={() => setAuthFlowState('NONE')}
          onSubmit={handleLogin}
          onRegister={() => setAuthFlowState('REGISTER')}
        />
      )}

      {/* WALLETS PAGE */}
      {activeView === 'wallet' && (
        <div className="flex-1 flex flex-col min-h-0">
          <WalletScreen initialTab={walletPageTab} onBack={() => setActiveView('terminal')} />
        </div>
      )}
      {activeView === 'news' && (
        <div className="flex-1 flex flex-col min-h-0 bg-lb-bg text-lb-text">
          <div className="border-b border-lb-border bg-lb-panel/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-lb-panel hover:bg-lb-panel-hover border border-lb-border rounded-xl text-lb-text transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-lb-text tracking-wide">Premium Market News</h1>
          </div>
          <NewsScreen />
        </div>
      )}
      {activeView === 'calendar' && (
        <div className="flex-1 flex flex-col min-h-0 bg-lb-bg text-lb-text">
          <div className="border-b border-lb-border bg-lb-panel/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-lb-panel hover:bg-lb-panel-hover border border-lb-border rounded-xl text-lb-text transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-lb-text tracking-wide">Economic Calendar</h1>
          </div>
          <CalendarScreen />
        </div>
      )}
      {activeView === 'profile' && (
        <div className="flex-1 flex flex-col min-h-0 bg-lb-bg text-lb-text">
          <div className="border-b border-lb-border bg-lb-panel/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-lb-panel hover:bg-lb-panel-hover border border-lb-border rounded-xl text-lb-text transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-lb-text tracking-wide">Profile</h1>
          </div>
          <ProfileScreen />
        </div>
      )}
      {activeView === 'about' && (
        <div className="flex-1 flex flex-col min-h-0 bg-lb-bg text-lb-text">
          <div className="border-b border-lb-border bg-lb-panel/90 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between gap-4">
            <button onClick={() => setActiveView('terminal')} className="px-4 py-2 bg-lb-panel hover:bg-lb-panel-hover border border-lb-border rounded-xl text-lb-text transition">
              Back to Terminal
            </button>
            <h1 className="text-lg font-black text-lb-text tracking-wide">About</h1>
          </div>
          <AboutScreen />
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
      <div className={`md:hidden shrink-0 bg-lb-panel border-b border-lb-border items-center justify-between px-3 shadow-sm relative z-30 ${activeMobileTab === 'trade' || activeMobileTab === 'new_order' ? 'hidden' : 'flex h-12'}`}>
         <div className="flex items-center gap-4">
           <button onClick={() => setIsSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center text-lb-text active:bg-lb-panel-hover rounded-full">
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
           </button>
           {activeMobileTab === 'chart' && (
             <div className="flex items-center gap-4 text-lb-text">
               <button className="flex items-center justify-center p-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
               <button className="flex items-center justify-center p-1 text-lb-text font-serif italic font-bold">f</button>
               <div className="relative">
                 <button onClick={() => setShowTimeframeMenu(!showTimeframeMenu)} className="flex items-center gap-0.5 p-1 font-bold">
                   M{chartInterval.replace('m', '')} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                 </button>
                 {showTimeframeMenu && (
                   <div className="absolute top-10 left-0 bg-lb-panel shadow-xl border border-lb-border rounded-xl w-32 py-1 z-50 text-sm font-semibold text-lb-text">
                     {TIMEFRAMES.map(tf => (
                       <div key={tf.value} className={`px-4 py-2 hover:bg-lb-panel-hover cursor-pointer ${chartInterval === tf.value ? 'text-lb-accent' : ''}`} onClick={() => { setChartInterval(tf.value); setShowTimeframeMenu(false); }}>
                         {tf.label}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}
         </div>
         {activeMobileTab !== 'chart' && (
           <span className="font-bold text-lb-text tracking-wide capitalize absolute left-1/2 -translate-x-1/2">
             {activeMobileTab === 'quotes' && 'Quotes'}
             {activeMobileTab === 'history' && 'History'}
             {activeMobileTab === 'profile' && 'Profile'}
           </span>
         )}
         <div className="flex items-center">
           {activeMobileTab === 'chart' && (
             <button 
               onClick={() => setActiveMobileTab('new_order')} 
               className="text-lb-accent bg-transparent p-2 rounded-full transition-all active:scale-95"
               title="New Order"
             >
               <FilePlus className="w-5 h-5" strokeWidth={2} />
             </button>
           )}
         </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* DESKTOP LEFT: Market Watch */}
        <div className="hidden md:flex shrink-0">
          <MarketWatch 
            selectedSymbol={selectedSymbol} 
            onSelectSymbol={setSelectedSymbol} 
            onLongPressSymbol={setActionSheetSymbol}
          />
        </div>

        {/* MOBILE: Conditional Rendering based on Tabs */}
        {/* DESKTOP CENTER: Chart + OCT */}
        <main className={`flex-1 flex flex-col relative min-w-0 ${activeMobileTab !== 'chart' ? 'hidden md:flex' : 'flex'}`}>
          <TradingViewChart symbol={selectedSymbol} theme={themeMode === 'navy' ? 'Dark' : 'Light'} intervalValue={chartInterval} />
          
          {/* Desktop Overlay OCT */}
          <div className="hidden md:block absolute top-4 right-4 shadow-2xl rounded-xl z-10">
            <OneClickTrading 
              selectedSymbol={selectedSymbol}
              liveBid={liveBid} liveAsk={liveAsk}
              orderVolume={orderVolume} setOrderVolume={setOrderVolume}
              orderSL={orderSL} setOrderSL={setOrderSL}
              orderTP={orderTP} setOrderTP={setOrderTP}
              isPlacingOrder={isPlacingOrder} executeOrder={executeOrder}
              oneClickEnabled={oneClickEnabled} setOneClickEnabled={setOneClickEnabled}
            />
          </div>
        </main>

        {/* MOBILE PANELS */}
        <div className={`flex-1 flex flex-col bg-lb-bg overflow-hidden ${activeMobileTab !== 'quotes' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
           <MarketWatch 
             selectedSymbol={selectedSymbol} 
             onSelectSymbol={(sym) => {
               setSelectedSymbol(sym);
               setActiveMobileTab('chart');
             }} 
             onLongPressSymbol={setActionSheetSymbol}
           />
        </div>

        <div className={`flex-1 flex flex-col bg-lb-bg overflow-hidden ${activeMobileTab !== 'trade' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
           {/* Top Header replacement for Trade Tab */}
           <div className="p-4 pt-6 flex flex-col bg-lb-panel mx-4 mt-4 rounded-2xl shadow-lg border border-lb-border">
             <div className="flex justify-center items-start w-full">
               <span className={`text-3xl font-bold tracking-tight ${(liveEquity - wallet.balance) >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                 {(liveEquity - wallet.balance).toFixed(2)} USD
               </span>
             </div>
             
             <div className="flex flex-col gap-1.5 text-[13px] mt-6 px-1">
               <div className="flex justify-between"><span className="text-lb-text-muted">Balance:</span><span className="font-mono text-lb-text">{wallet.balance.toFixed(2)} USD</span></div>
               <div className="flex justify-between"><span className="text-lb-text-muted">Equity:</span><span className="font-mono text-lb-text">{liveEquity.toFixed(2)} USD</span></div>
               <div className="flex justify-between"><span className="text-lb-text-muted">Margin:</span><span className="font-mono text-lb-text">{liveMargin.toFixed(2)} USD</span></div>
               <div className="flex justify-between"><span className="text-lb-text-muted">Free Margin:</span><span className="font-mono text-lb-text">{liveFreeMargin.toFixed(2)} USD</span></div>
               <div className="flex justify-between"><span className="text-lb-text-muted">Margin Level (%):</span><span className="font-mono text-lb-text">{wallet.marginLevel ? wallet.marginLevel.toFixed(2) : (liveMargin > 0 ? ((liveEquity / liveMargin) * 100).toFixed(2) : 'Unlimited')}</span></div>
             </div>
           </div>
           
           <div className="px-4 py-3 mt-4 font-bold text-sm text-lb-text flex justify-between items-center">
             <span>Positions</span>
             <span className="text-lb-text-muted tracking-widest text-lg leading-none -mt-2">...</span>
           </div>
           
           {/* Mobile Positions List */}
           <div className="flex-1 overflow-y-auto bg-lb-bg pb-32 px-4 flex flex-col gap-2">
             {positions.map(p => (
               <div key={p.id} className="bg-lb-panel border border-lb-border rounded-2xl flex flex-col overflow-hidden shrink-0">
                 <div className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-lb-panel-hover transition" 
                      onClick={() => {
                        setExpandedPositionId(p.id);
                        setPositionMenuId(p.id);
                      }}>
                   <div className="flex flex-col gap-0.5">
                     <div className="flex items-baseline gap-1">
                       <span className="font-bold text-lb-text text-[15px]">{p.symbol}</span>
                       <span className={`text-[12px] px-1.5 py-0.5 rounded ${p.side === 'BUY' ? 'bg-lb-accent/10 text-lb-accent' : 'bg-lb-down/10 text-lb-down'}`}>{p.side.toLowerCase()} {p.size.toFixed(2)}</span>
                     </div>
                     <span className="text-[13px] text-lb-text-muted font-mono tracking-tight">{formatPrice(p.entryPrice)} → {formatPrice(p.currentPrice)}</span>
                   </div>
                   <span className={`font-bold text-[19px] tracking-tight ${p.pnl && p.pnl >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                     {p.pnl?.toFixed(2) || '0.00'}
                   </span>
                 </div>
                 {expandedPositionId === p.id && (
                   <div className="px-4 pb-3 flex flex-col gap-1 text-[13px] text-lb-text-muted bg-lb-bg/50 pt-2 border-t border-lb-border">
                     <div className="flex justify-between">
                       <span className="w-16">S/L:</span>
                       <span className="text-lb-text flex-1">-</span>
                       <span className="w-16 text-right">Swap:</span>
                       <span className="text-lb-text w-16 text-right">0.00</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="w-16">T/P:</span>
                       <span className="text-lb-text flex-1">-</span>
                       <span className="w-16 text-right">Taxes:</span>
                       <span className="text-lb-text w-16 text-right">0.00</span>
                     </div>
                     <div className="flex justify-between mt-1 pt-1 border-t border-lb-border">
                       <span>Time:</span>
                       <span className="text-lb-text">{new Date(p.timestamp).toLocaleString()}</span>
                     </div>
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>

        <div className={`flex-1 flex flex-col bg-lb-bg overflow-hidden ${activeMobileTab !== 'history' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
          {/* MT5 Style History Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-lb-panel border-b border-lb-border z-10 relative">
            <button 
              onClick={() => setHistorySortDesc(!historySortDesc)}
              className="w-8 h-8 rounded-full bg-lb-accent/10 text-lb-accent flex items-center justify-center transition-transform"
              style={{ transform: historySortDesc ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
            </button>
            <div className="flex bg-lb-bg rounded-full p-1 text-[13px] font-semibold text-lb-text-muted">
              <button 
                onClick={() => setHistorySubTab('POSITIONS')}
                className={`px-3 py-1 rounded-full transition-all ${historySubTab === 'POSITIONS' ? 'bg-lb-panel shadow-sm text-lb-text' : ''}`}>Positions</button>
              <button 
                onClick={() => setHistorySubTab('ORDERS')}
                className={`px-3 py-1 rounded-full transition-all ${historySubTab === 'ORDERS' ? 'bg-lb-panel shadow-sm text-lb-text' : ''}`}>Orders</button>
              <button 
                onClick={() => setHistorySubTab('DEALS')}
                className={`px-3 py-1 rounded-full transition-all ${historySubTab === 'DEALS' ? 'bg-lb-panel shadow-sm text-lb-text' : ''}`}>Deals</button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowHistoryMenu(!showHistoryMenu)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showHistoryMenu ? 'bg-lb-accent/20 text-lb-accent' : 'bg-lb-bg text-lb-text-muted'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </button>
              {showHistoryMenu && (
                <div className="absolute top-10 right-0 bg-lb-panel shadow-xl border border-lb-border rounded-xl w-36 py-1 z-50 text-sm font-semibold text-lb-text">
                  <div className="px-4 py-2 hover:bg-lb-panel-hover cursor-pointer" onClick={() => { setHistoryFilter('TODAY'); setShowHistoryMenu(false); }}>Today</div>
                  <div className="px-4 py-2 hover:bg-lb-panel-hover cursor-pointer" onClick={() => { setHistoryFilter('WEEK'); setShowHistoryMenu(false); }}>Last Week</div>
                  <div className="px-4 py-2 hover:bg-lb-panel-hover cursor-pointer" onClick={() => { setHistoryFilter('MONTH'); setShowHistoryMenu(false); }}>Last Month</div>
                  <div className="px-4 py-2 hover:bg-lb-panel-hover cursor-pointer" onClick={() => { setHistoryFilter('YEAR'); setShowHistoryMenu(false); }}>Last Year</div>
                  <div className="px-4 py-2 hover:bg-lb-panel-hover cursor-pointer text-lb-accent" onClick={() => { setHistoryFilter('ALL'); setShowHistoryMenu(false); }}>All History</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-lb-bg relative pb-32">
             {historySubTab !== 'POSITIONS' ? (
               <div className="flex flex-col items-center justify-center h-48 text-lb-text-muted text-sm font-semibold">
                 No {historySubTab.toLowerCase()} found for this period.
               </div>
             ) : (
               <div className="flex flex-col gap-2 p-4">
                 {filteredHistory
                   .sort((a, b) => {
                     const diff = parseHistoryDate(b.timestamp ?? b.entryDate).getTime() - parseHistoryDate(a.timestamp ?? a.entryDate).getTime();
                     return historySortDesc ? diff : -diff;
                   })
                   .map((item, idx) => {
                     const historyDate = parseHistoryDate(item.timestamp ?? item.entryDate);
                      return <div key={idx} className="px-4 py-3 rounded-2xl border border-lb-border flex justify-between items-start bg-lb-panel shrink-0">
                          {item.type === 'DEPOSIT' || item.type === 'WITHDRAWAL' || item.type === 'WITHDRAW' || item.type === 'ADMIN_ADJUSTMENT' ? (
                            <>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-[15px] text-lb-text">
                                  {item.type === 'ADMIN_ADJUSTMENT' ? (item.amount > 0 ? 'Admin Credit' : 'Admin Debit') : (item.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal')}
                                </span>
                                <span className="text-[13px] text-lb-text-muted font-mono tracking-tight">{item.id || `TX-${historyDate.getTime().toString().slice(-10)}`}</span>
                                {item.status && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'APPROVED' ? 'bg-lb-accent' : item.status === 'REJECTED' ? 'bg-lb-down' : 'bg-amber-500 animate-pulse'}`}></div>
                                    <span className="text-[10px] font-bold text-lb-text-muted uppercase tracking-wider">{item.status}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={`font-semibold text-[15px] tracking-tight ${item.amount >= 0 && (item.type === 'DEPOSIT' || item.type === 'ADMIN_ADJUSTMENT') ? 'text-lb-accent' : 'text-lb-down'}`}>
                                  {item.amount > 0 && (item.type === 'DEPOSIT' || item.type === 'ADMIN_ADJUSTMENT') ? '+' : ''}{item.type === 'WITHDRAWAL' || item.type === 'WITHDRAW' ? '-' : ''}{Math.abs(item.amount).toFixed(2)}
                                </span>
                                <span className="text-[13px] text-lb-text-muted font-mono tracking-tight">
                                  {historyDate.toISOString().replace('T', ' ').slice(0, 19).replace(/-/g, '.')}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-semibold text-lb-text text-[15px]">{item.symbol}</span>
                                  <span className={`text-[12px] px-1.5 py-0.5 rounded ${item.side === 'BUY' ? 'bg-lb-accent/10 text-lb-accent' : 'bg-lb-down/10 text-lb-down'}`}>{item.side?.toLowerCase()} {item.size?.toFixed(2) || '0.10'}</span>
                                </div>
                                <span className="text-[13px] text-lb-text-muted font-mono tracking-tight">{formatPrice(item.entryPrice || item.openPrice)} → {formatPrice(item.closePrice)}</span>
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={`font-semibold text-[15px] tracking-tight ${item.pnl && item.pnl >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                                  {item.pnl?.toFixed(2) || '0.00'}
                                </span>
                                <span className="text-[13px] text-lb-text-muted font-mono tracking-tight">
                                  {historyDate.toISOString().replace('T', ' ').slice(0, 19).replace(/-/g, '.')}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                    })}
               </div>
             )}

             {/* History Summary Footer (only show if not ORDERS) */}
             {historySubTab !== 'ORDERS' && (
               <div className="border-t border-lb-border bg-lb-panel/50 p-4 shrink-0">
                 <div className="flex justify-between mb-1">
                   <span className="text-lb-text-muted">Profit</span>
                   <span className={`font-bold font-mono ${historyProfit >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>
                     {historyProfit.toFixed(2)}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-lb-text-muted">Deposit</span>
                   <span className="font-bold text-lb-text font-mono">
                     {historyDeposit.toFixed(2)}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-lb-text-muted">Withdrawal</span>
                   <span className="font-bold text-lb-text font-mono">
                     {historyWithdrawal.toFixed(2)}
                   </span>
                 </div>
                 <div className="flex justify-between border-t border-lb-border pt-2 mt-1">
                   <span className="text-lb-text-muted">Balance</span>
                   <span className="font-bold text-lb-text font-mono">
                     {historyBalance.toFixed(2)}
                   </span>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-lb-panel overflow-y-auto ${activeMobileTab !== 'profile' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
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

      {/* MOBILE POPUP MENU FOR POSITIONS */}
      {/* POSITION MENU */}
      {positionMenuId && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 animate-in fade-in" onClick={() => { setPositionMenuId(null); setExpandedPositionId(null); }}>
          <div className="bg-lb-panel/95 backdrop-blur-md rounded-2xl mx-2 mb-4 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 border border-lb-border" onClick={e => e.stopPropagation()}>
             <div className="py-2.5 bg-lb-panel/60 border-b border-lb-border text-center text-[13px] font-bold text-lb-text flex flex-col">
               {positions.find(pos => pos.id === positionMenuId)?.symbol}
               <span className="font-normal text-lb-text-muted text-[11px]">{positions.find(pos => pos.id === positionMenuId)?.side === 'BUY' ? 'buy' : 'sell'} {positions.find(pos => pos.id === positionMenuId)?.size.toFixed(2)}</span>
             </div>
             <button onClick={() => { 
                setCloseConfirmationPositionId(positionMenuId);
                setPositionMenuId(null);
                setExpandedPositionId(null);
             }} className="py-4 bg-lb-panel/60 border-b border-lb-border text-lb-down font-normal active:bg-lb-panel-hover transition-colors text-center text-[19px]">Close position</button>
             <button onClick={() => { setPositionMenuId(null); }} className="py-4 bg-lb-panel/60 border-b border-lb-border text-lb-accent font-normal active:bg-lb-panel-hover transition-colors text-center text-[19px]">Modify position</button>
             <button onClick={() => { 
                const p = positions.find(pos => pos.id === positionMenuId);
                setPositionMenuId(null); 
                if (p) setSelectedSymbol(p.symbol);
                setActiveMobileTab('new_order'); 
             }} className="py-4 bg-lb-panel/60 border-b border-lb-border text-lb-accent font-normal active:bg-lb-panel-hover transition-colors text-center text-[19px]">Trade</button>
             <button onClick={() => { 
                const p = positions.find(pos => pos.id === positionMenuId);
                setPositionMenuId(null); 
                if (p) setSelectedSymbol(p.symbol);
                setActiveMobileTab('chart'); 
             }} className="py-4 bg-lb-panel/60 border-b border-lb-border text-lb-accent font-normal active:bg-lb-panel-hover transition-colors text-center text-[19px]">Chart</button>
             <button onClick={() => { setPositionMenuId(null); }} className="py-4 bg-lb-panel/60 text-lb-accent font-normal active:bg-lb-panel-hover transition-colors text-center text-[19px]">Bulk Operations...</button>
          </div>
          <div className="bg-lb-panel border border-lb-border rounded-2xl mx-2 mb-8 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
             <button onClick={() => { setPositionMenuId(null); setExpandedPositionId(null); }} className="py-4 bg-lb-panel text-lb-accent font-bold active:bg-lb-panel-hover transition-colors text-center text-[19px]">Cancel</button>
          </div>
        </div>
      )}

      {closeConfirmationPositionId && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-2 py-4">
          <div className="w-full max-w-lg bg-lb-panel rounded-t-3xl shadow-2xl p-4 overflow-hidden border border-lb-border" onClick={e => e.stopPropagation()}>
            {(() => {
              const position = positions.find(pos => pos.id === closeConfirmationPositionId);
              const marketPrice = typeof liveBid === 'number' && typeof liveAsk === 'number' ? `${liveBid.toFixed(5)} / ${liveAsk.toFixed(5)}` : '- / -';
              const positionSize = position?.size != null ? position.size.toFixed(2) : '-';
              const positionPnl = position?.pnl != null ? position.pnl.toFixed(2) : '0.00';
              const positionPnlClass = position?.pnl != null && position.pnl >= 0 ? 'text-lb-accent' : 'text-lb-down';

              return (
                <>
                  <div className="text-center mb-3">
                    <div className="text-sm text-lb-text-muted uppercase tracking-[0.2em] mb-2">Close Position</div>
                    <div className="text-xl font-bold text-lb-text">
                      {position?.symbol || 'Position'}
                    </div>
                    <div className="text-sm text-lb-text-muted mt-1">
                      {position?.side?.toLowerCase() || ''} {positionSize} by Market
                    </div>
                  </div>
                  <div className="rounded-3xl border border-lb-border bg-lb-bg p-4 mb-4">
                    <div className="flex items-center justify-between text-sm text-lb-text-muted mb-2">
                      <span>Market Price</span>
                      <span className="font-semibold text-lb-text">{marketPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-lb-text-muted mb-2">
                      <span>Close Price</span>
                      <span className="font-semibold text-lb-text">{position?.currentPrice != null ? position.currentPrice.toFixed(5) : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-lb-text-muted">
                      <span>Profit</span>
                      <span className={`font-semibold ${positionPnlClass}`}>
                        {positionPnl}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
            <button
              onClick={async () => {
                setIsClosingPosition(true);
                try {
                  await onClosePosition(closeConfirmationPositionId);
                } catch (error) {
                  console.error('Close position failed', error);
                } finally {
                  setIsClosingPosition(false);
                  setCloseConfirmationPositionId(null);
                }
              }}
              disabled={isClosingPosition}
              className="w-full py-4 rounded-3xl bg-lb-down text-lb-text font-bold text-lg mb-3 disabled:opacity-60"
            >
              {isClosingPosition ? 'Closing...' : 'Close by Market'}
            </button>
            <button
              onClick={() => setCloseConfirmationPositionId(null)}
              className="w-full py-4 rounded-3xl bg-lb-bg text-lb-text font-bold text-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

            {activeMobileTab === 'new_order' && (
        <div className="md:hidden">
          <MobileOrderScreen 
            symbol={selectedSymbol}
            onClose={() => setActiveMobileTab('chart')}
            liveBid={liveBid} liveAsk={liveAsk}
            orderVolume={orderVolume} setOrderVolume={setOrderVolume}
            orderSL={orderSL} setOrderSL={setOrderSL}
            orderTP={orderTP} setOrderTP={setOrderTP}
            isPlacingOrder={isPlacingOrder} executeOrder={executeOrder}
            oneClickEnabled={oneClickEnabled} setOneClickEnabled={setOneClickEnabled}
            walletBalance={wallet.balance}
            liveEquity={liveEquity}
            liveFreeMargin={liveFreeMargin}
            liveMargin={liveMargin}
          />
        </div>
      )}

      {/* ACTION SHEET */}
      <SymbolActionSheet
        visible={!!actionSheetSymbol}
        symbol={actionSheetSymbol}
        isFavorite={(() => {
          try {
            const favs = JSON.parse(localStorage.getItem('forex_favorites') || '[]');
            return actionSheetSymbol ? favs.includes(actionSheetSymbol.symbol.replace('/', '')) : false;
          } catch(e) { return false; }
        })()}
        onClose={() => setActionSheetSymbol(null)}
        onOpenChart={(sym) => {
          setSelectedSymbol(sym.symbol.replace('/', ''));
          setActiveMobileTab('chart');
        }}
        onNewOrder={(sym) => {
          setSelectedSymbol(sym.symbol.replace('/', ''));
          setActiveMobileTab('new_order');
        }}
        onFavoriteToggle={(sym) => {
          const raw = sym.symbol.replace('/', '');
          try {
            const favs = JSON.parse(localStorage.getItem('forex_favorites') || '[]');
            const newFavs = favs.includes(raw) ? favs.filter((s: string) => s !== raw) : [...favs, raw];
            localStorage.setItem('forex_favorites', JSON.stringify(newFavs));
            window.dispatchEvent(new Event('favoritesUpdated'));
          } catch(e) {}
        }}
      />

      {/* ORDER CONFIRMATION MODAL */}
      {pendingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm bg-lb-panel rounded-2xl shadow-2xl p-6 border border-lb-border flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">Confirm Order</h3>
            <p className="text-sm text-lb-text-muted text-center mb-6">
              You are about to place a <span className={`font-bold ${pendingOrder.side === 'BUY' ? 'text-lb-accent' : 'text-lb-down'}`}>{pendingOrder.side}</span> order for <span className="font-bold text-lb-text">{orderVolume} {selectedSymbol}</span>.
            </p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setPendingOrder(null)}
                className="flex-1 py-3 rounded-xl bg-lb-bg text-lb-text font-bold active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={() => executeOrderBackend(pendingOrder.side)}
                disabled={isPlacingOrder}
                className={`flex-1 py-3 rounded-xl font-bold active:scale-95 transition-transform text-white disabled:opacity-50 ${pendingOrder.side === 'BUY' ? 'bg-lb-accent text-black' : 'bg-lb-down text-white'}`}
              >
                {isPlacingOrder ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
};

export default React.memo(ProTradingDashboard);
