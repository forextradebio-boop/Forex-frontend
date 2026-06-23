import React, { useState, useEffect } from "react";
import api from "./api/axios";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Terminal,
  Activity,
  Compass,
  Wallet,
  User,
  Bell,
  ShieldCheck,
  LogIn,
  LogOut,
  Lock,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Menu,
  X,
  CreditCard
} from "lucide-react";

import {
  UserProfile,
  SymbolData,
  UserWallet,
  Position,
  Order,
  PriceAlert,
  MarketNews,
  EconomicEvent,
  KYCStatus,
  TransactionType,
  KYCData,
  WalletTransaction,
  AssetCategory
} from "./types";

// Import modules
import LandingPage from "./components/LandingPage";
import TradingTerminal from "./components/TradingTerminal";
import WalletScreen from "./components/WalletScreen";
import AdminCRM from "./components/AdminCRM";
import NewsScreen from "./components/NewsScreen";
import MarketScreen from "./components/MarketScreen";
import CalendarScreen from "./components/CalendarScreen";
import ProfileScreen from "./components/ProfileScreen";
import { useAuth } from "./contexts/AuthContext";
import { io } from "socket.io-client";
import * as walletService from "./services/wallet";
import * as tradingService from "./services/trading";
import * as watchlistService from "./services/watchlist";
import * as alertsService from "./services/alerts";
import * as depositService from "./services/deposit";
import * as kycService from "./services/kyc";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"landing" | "market" | "trading" | "wallet" | "news" | "calendar" | "profile" | "admin">("landing");

  // Authentication states
  const { user: userProfile, login: setLogin, logout, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER" | "2FA">("LOGIN");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [twoFaCode, setTwoFaCode] = useState<string>("");
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Live updates states (synced from SSE or polling)
  const [symbols, setSymbols] = useState<SymbolData[]>([]);
  const [walletMetrics, setWalletMetrics] = useState<UserWallet>({ balance: 0, equity: 0, margin: 0, freeMargin: 0, pnl: 0 });
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [closedHistory, setClosedHistory] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  // General news and economics
  const [globalNews, setGlobalNews] = useState<MarketNews[]>([]);
  const [economicCalendar, setEconomicCalendar] = useState<EconomicEvent[]>([]);

  // Notifications bell states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  // Role overriding for instant developer preview swapper
  const [isAdminModeOverride, setIsAdminModeOverride] = useState<boolean>(false);

  // Sync pricing data via SSE stream on component mount
  useEffect(() => {
    const fetchStaticMetadata = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

        const catRes = await fetch(`${API_BASE}/market/symbols`);
        if (catRes.ok) {
          const symJson = await catRes.json();
          setSymbols(symJson.symbols || []);
        }

        const newsRes = await fetch(`${API_BASE}/news`);
        if (newsRes.ok) {
          const nJson = await newsRes.json();
          setGlobalNews(nJson.news || []);
        }

        const calRes = await fetch(`${API_BASE}/economic-calendar`);
        if (calRes.ok) {
          const cJson = await calRes.json();
          setEconomicCalendar(cJson.calendar || []);
        }
      } catch (err) {
        console.error("Error loading server startup payloads.", err);
      }
    };

    fetchStaticMetadata();

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000");

    socket.on("prices", (data: any[]) => {
      if (data?.length) {
        setSymbols(data);
      }
    });

    if (userProfile?.id) {
      socket.on(`pnl_${userProfile.id}`, (positions: any[]) => {
        setActivePositions(
          positions.map((p: any) => ({
            id: p._id,
            symbol: p.symbol,
            side: p.type,
            size: p.volume,
            entryPrice: p.openPrice,
            currentPrice: p.currentPrice,
            pnl: p.pnl,
            slPrice: p.sl,
            tpPrice: p.tp
          }))
        );
      });

      socket.on(`wallet_${userProfile.id}`, (wallet: any) => {
        setWalletMetrics(wallet);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [userProfile?.id]);

  // Fetch individual user states (balances, open positions, history)
  // Global unauthorized handler
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      setActiveTab("landing");
      setAuthTab("LOGIN");
      setShowAuthModal(true);
      showToast("Session expired. Please log in again.", "error");
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const fetchClientPortfolioStats = async () => {
    if (!userProfile) return;
    try {
      // Wallet
      const walletData = await walletService.getWallet();
      if (walletData) {
        setWalletMetrics(walletData);
      }

      // Positions
      const posData = await tradingService.getPositions();
      if (posData) {
        setActivePositions(posData.map((p: any) => ({
          id: p._id,
          symbol: p.symbol,
          side: p.type,
          size: p.volume,
          entryPrice: p.openPrice,
          currentPrice: p.currentPrice,
          pnl: p.pnl,
          slPrice: p.sl,
          tpPrice: p.tp
        })));
      }
    } catch (err) {
      console.error("Error synchronizing client ledger portfolios.", err);
    }
  };

  // Keep client stats in sync initially
  useEffect(() => {
    fetchClientPortfolioStats();
  }, [userProfile]);

  // Handle Order entry placements
  const handlePlaceOrder = async (orderPayload: any) => {
    try {
      if (orderPayload.type === 'MARKET') {
        const res = await tradingService.createPosition({
          symbol: orderPayload.symbol,
          type: orderPayload.side,
          volume: orderPayload.size,
          openPrice: orderPayload.limitPrice || 0, // Fallback, will be overridden by real market price
          sl: orderPayload.slPrice,
          tp: orderPayload.tpPrice
        });
        if (res) fetchClientPortfolioStats();
        // We do not handle limit orders here anymore. Pending Orders are handled inside TradingTerminal.
      }
    } catch (err: any) {
      alert(`Reject logic: ${err.response?.data?.error || err.message}`);
      throw err;
    }
  };

  // Close Active Position manually
  const handleClosePosition = async (posId: string) => {
    try {
      await tradingService.closePosition(posId);
      fetchClientPortfolioStats();
    } catch (err) {
      alert("Error liquidating.");
    }
  };

  // Submit deposit details
  const handleDeposit = async (payload: any) => {
    try {
      await depositService.createDeposit({
        amount: payload.amount,
        utr: payload.utr
      });
      fetchClientPortfolioStats();
    } catch (err: any) {
      throw err.response?.data?.error || "Deposit failed.";
    }
  };

  // Removed mock handleWithdraw checks
  // Clear all alerts notifications
  const handleClearNotifications = async () => {
    const curUserId = userProfile ? userProfile.id : "USER_GUEST";
    try {
      await api.post("/notifications/clear-all", null, {
        headers: { "X-User-Id": curUserId }
      });
      fetchClientPortfolioStats();
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  // Handle Withdrawal Request
  const handleWithdrawalRequest = async (amount: number, bankId: string) => {
    try {
      const res = await api.post("/wallet/withdraw", {
        amount,
        bankId
      });
      if (res.data) {
        fetchClientPortfolioStats();
      }
    } catch (error) {
      console.error("Failed to request withdrawal", error);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;

    setIsLoginLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: emailInput, password: passwordInput });

      if (data && data.otpRequired) {
        setPendingUserId(data.userId);
        setTwoFaCode(data.demoOtp || "123456");
        setAuthTab("2FA");
        setIsLoginLoading(false);
        return;
      }

      if (data && data.token) {
        setLogin(data.token, data.refreshToken, data.profile);
        setShowAuthModal(false);
        setEmailInput("");
        setPasswordInput("");

        showToast("Login successful!", "success");

        // Auto navigate to terminal
        setActiveTab("trading");
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Error connecting credentials services.", "error");
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handle Registration submission
  // const handleRegisterSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!emailInput || !passwordInput || !nameInput) return;

  //   try {
  //     const { data } = await api.post("/auth/register", {
  //       email: emailInput,
  //       password: passwordInput,
  //       fullName: nameInput,
  //       phone: phoneInput
  //     });
  //     if (data && data.token) {
  //       setLogin(data.token, data.profile);
  //       setAuthTab("2FA");
  //     }
  //   } catch (err: any) {
  //     alert(err.response?.data?.error || "Registration system offline.");
  //   }
  // };
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("REGISTER BUTTON CLICKED");

    console.log({
      nameInput,
      emailInput,
      passwordInput,
      phoneInput
    });

    if (!emailInput || !passwordInput || !nameInput) {
      console.log("VALIDATION FAILED");
      return;
    }

    try {
      console.log("CALLING REGISTER API...");

      const { data } = await api.post("/auth/register", {
        email: emailInput,
        password: passwordInput,
        fullName: nameInput,
        phone: phoneInput
      });

      console.log("REGISTER SUCCESS:", data);

      if (data && data.otpRequired) {
        setPendingUserId(data.userId);
        setTwoFaCode(data.demoOtp || "123456");
        setAuthTab("2FA");
      }
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      console.error("RESPONSE:", err.response);
      console.error("DATA:", err.response?.data);

      alert(
        err.response?.data?.error ||
        err.message ||
        "Registration system offline."
      );
    }
  };

  // Handle simulated 2FA validation
  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!twoFaCode || twoFaCode.length !== 6) return;

    try {
      const res = await api.post("/auth/verify-2fa", {
        userId: pendingUserId || userProfile?.id,
        code: twoFaCode
      });

      console.log("VERIFY RESPONSE =>", res.data);

      if (res.data?.success) {

        // Always save token if backend returned it
        if (res.data.token) {
          console.log("SAVING TOKEN =>", res.data.token);

          setLogin(
            res.data.token,
            res.data.refreshToken,
            res.data.profile
          );

          console.log(
            "TOKEN AFTER SAVE =>",
            localStorage.getItem("token")
          );
        }

        showToast(
          "Mobile OTP / 2FA Approved! Profile activated under Baha guidelines.",
          "success"
        );

        setShowAuthModal(false);
        setTwoFaCode("");
        setPendingUserId("");
        setActiveTab("trading");
      }

    } catch (error: any) {
      showToast(
        error.response?.data?.error ||
        "2FA verification timeout check or invalid code.",
        "error"
      );
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await api.post("/auth/resend-otp", {
        userId: pendingUserId || userProfile?.id
      });
      if (res.data && res.data.success) {
        setTwoFaCode(res.data.demoOtp || "123456");
        showToast(`New OTP generated: ${res.data.demoOtp}`, "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to resend OTP.", "error");
    }
  };

  // Logo switch or Logout
  const handleLogout = () => {
    logout();
    setActiveTab("landing");
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden">

      {/* Top Main Navigation Header */}
      <header className="h-14 border-b border-zinc-805 border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 shrink-0 shadow-md">
        <div className="flex items-center space-x-6">

          {/* Logo Brand Title */}
          <div
            onClick={() => setActiveTab("landing")}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition select-none"
          >
            <div className="w-8 h-8 rounded bg-emerald-500 text-black flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase leading-none">Baha Markets</h1>
              <span className="text-[9px] text-emerald-400 tracking-widest font-mono uppercase font-black">Pro Terminal</span>
            </div>
          </div>

          {/* Navigation Tab Links selection */}
          <nav className="hidden md:flex items-center space-x-1.5 text-xs uppercase tracking-wide font-extrabold text-zinc-400">
            <button
              onClick={() => setActiveTab("landing")}
              className={`px-3 py-2 rounded transition ${activeTab === "landing" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Portal Home
            </button>
            <button
              onClick={() => setActiveTab("market")}
              className={`px-3 py-2 rounded transition ${activeTab === "market" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveTab("trading")}
              className={`px-3 py-2 rounded transition ${activeTab === "trading" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Trading Terminal
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-3 py-2 rounded transition ${activeTab === "wallet" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Deposit & KYC
            </button>
            <button
              onClick={() => setActiveTab("news")}
              className={`px-3 py-2 rounded transition ${activeTab === "news" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Financial News
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-3 py-2 rounded transition ${activeTab === "calendar" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-3 py-2 rounded transition ${activeTab === "profile" ? 'bg-zinc-800 text-white font-black' : 'hover:bg-zinc-850 hover:text-white'}`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Global Control blocks containing user actions, swappers, and alerts */}
        <div className="flex items-center space-x-6">

          {/* Real-time statistics block */}
          <div className="hidden lg:flex items-center space-x-6 text-right">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Total Equity</span>
              <span className="font-mono text-xs font-bold text-emerald-400">${(walletMetrics?.equity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Unrealized P/L</span>
              <p className={`font-mono text-[10px] font-bold ${walletMetrics?.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {walletMetrics?.pnl >= 0 ? "+" : ""}{(walletMetrics?.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Free Margin</span>
              <span className="font-mono text-xs font-bold text-zinc-300">${(walletMetrics?.freeMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* CRITICAL ROLE SWAPPER BLOCK (Simulating Guest vs Admin) */}
          <button
            id="role-swapper-toggle"
            onClick={() => {
              const target = !isAdminModeOverride;
              setIsAdminModeOverride(target);
              if (target) {
                setActiveTab("admin");
              } else {
                setActiveTab("trading");
              }
            }}
            className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border text-[11px] font-extrabold tracking-tight transition shadow-sm cursor-pointer ${isAdminModeOverride ? 'bg-orange-500/15 border-orange-500/30 text-orange-400 shadow-orange-500/10' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-350'}`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            {isAdminModeOverride ? "CRM SUPER ADMIN IS ON" : "TOGGLE CRM ADMIN MODE"}
          </button>

          {/* Active alerts notification Bell */}
          <div className="relative">
            <button
              id="notification-bell"
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-250 transition"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded bg-orange-400 animate-ping" />
              )}
            </button>

            {/* Notification logs panel */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2.5 w-80 bg-zinc-950 border border-zinc-800 p-4 rounded z-50 shadow-2xl space-y-3.5 text-left font-sans">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center">
                    <Bell className="w-4 h-4 mr-1.5 text-emerald-400 animate-bounce" /> Push alerts log
                  </h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearNotifications}
                      className="text-[10px] text-zinc-500 hover:text-emerald-400 font-bold transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800 text-[11px] font-mono">
                  {notifications.map(n => (
                    <div key={n.id} className="py-2 space-y-1">
                      <p className="font-extrabold text-zinc-200 leading-tight">{n.title}</p>
                      <p className="text-[10px] text-zinc-400 leading-snug font-sans">{n.content}</p>
                      <span className="text-[9px] text-zinc-500">{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-6 text-zinc-605">No new alerts dispatched.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authentication session card buttons */}
          {userProfile ? (
            <div className="flex items-center space-x-3 bg-zinc-950 pl-3 pr-1.5 py-1 rounded border border-zinc-800 max-w-[190px] truncate">
              <div className="text-left hidden sm:block">
                <p className="text-[10px] font-bold text-white leading-none truncate max-w-[80px]">{userProfile.fullName}</p>
                <p className="text-[8px] font-mono text-zinc-500 tracking-wider leading-none mt-1 truncate max-w-[80px]">{userProfile.email}</p>
              </div>
              <button
                id="header-logout-button"
                onClick={handleLogout}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded text-rose-450 text-rose-400 transition"
                title="Settle out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="header-login-button"
              onClick={() => {
                setAuthTab("LOGIN");
                setShowAuthModal(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded transition flex items-center cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Sign In
            </button>
          )}

        </div>
      </header>

      {/* Main viewport area routing screen */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {activeTab === "landing" && (
          <LandingPage
            symbols={symbols}
            onStartTrading={() => {
              if (!userProfile) {
                setShowAuthModal(true);
                return;
              }
              setActiveTab("trading");
            }}
            onNavigate={(tab: any) => setActiveTab(tab)}
          />
        )}

        {activeTab === "market" && (
          <MarketScreen />
        )}

        {activeTab === "trading" && (
          <TradingTerminal
            symbols={symbols}
            wallet={walletMetrics}
            positions={activePositions}
            closedHistory={closedHistory}
            userId={userProfile?.id || "USER_GUEST"}
            onPlaceOrder={handlePlaceOrder}
            onClosePosition={handleClosePosition}
          />
        )}

        {activeTab === "wallet" && (
          <WalletScreen />
        )}

        {activeTab === "news" && (
          <NewsScreen />
        )}

        {activeTab === "calendar" && (
          <CalendarScreen />
        )}

        {activeTab === "profile" && (
          <ProfileScreen />
        )}

        {activeTab === "admin" && (
          <AdminCRM
            userId={userProfile?.id || "USER_ADMIN"}
            onRefreshAllData={fetchClientPortfolioStats}
          />
        )}
      </main>

      {/* Interactive Authentication login popup Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-3xl p-6 relative text-left shadow-2xl font-sans">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {authTab === "LOGIN" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-center mb-6">
                  <h3 className="text-lg font-black text-white uppercase">Secure Session Sign-In</h3>
                  <p className="text-xs text-slate-500">Input registered email credentials below.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-mono font-bold uppercase">Email coordinate identifier</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200"
                    placeholder="name@market.pro"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-mono font-bold uppercase">Profile passcode</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200"
                    placeholder="Account password"
                    required
                  />
                </div>

                <button
                  id="submit-login"
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center justify-center gap-2"
                >
                  {isLoginLoading && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>}
                  {isLoginLoading ? "Signing In..." : "Secure Sign-In"}
                </button>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-500">Need an account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthTab("REGISTER")}
                    className="text-[11px] text-teal-400 font-extrabold hover:underline"
                  >
                    Register here
                  </button>
                </div>
              </form>
            )}

            {authTab === "REGISTER" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1 text-center mb-6">
                  <h3 className="text-lg font-black text-white uppercase">Create Trader Profile</h3>
                  <p className="text-xs text-slate-500">Join Baha Markets multiasset terminals today.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold font-mono">Full Legal Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    placeholder="e.g. Pradeep Kumar"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold font-mono">Email Coordinating hash</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    placeholder="user@trading.pro"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold font-mono">Password Key</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    placeholder="Verify secure digits"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold font-mono">Mobile Otp Coordinates</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    placeholder="+91 (555) 777-1234"
                  />
                </div>

                <button
                  id="submit-register"
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Publish profile credentials
                </button>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-500">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => setAuthTab("LOGIN")}
                    className="text-[11px] text-teal-400 font-bold hover:underline"
                  >
                    Login here
                  </button>
                </div>
              </form>
            )}

            {authTab === "2FA" && (
              <form onSubmit={handle2FaSubmit} className="space-y-4 font-sans text-center">
                <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto text-teal-400 mb-2">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-white uppercase">2FA Code OTP Check</h3>
                  <p className="text-xs text-slate-500">We simulation-mailed a 6-digit cryptographic verification key. Enter it below to register.<br /><br /><span className="text-emerald-400 font-bold">Demo OTP: 123456</span></p>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono font-bold tracking-widest text-teal-400"
                  placeholder="e.g. 192834"
                  required
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Verify Verification Token
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[11px] text-zinc-400 hover:text-teal-400 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-sm font-bold animate-pulse ${toast.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
          }`}>
          {toast.message}
        </div>
      )}

    </div>
  );
}
