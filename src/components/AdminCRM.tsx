/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Check, 
  X, 
  ShieldCheck, 
  Clock, 
  Hammer, 
  AlertTriangle, 
  Sliders, 
  Sparkles, 
  Rss, 
  VolumeX, 
  Award,
  BellRing,
  Download,
  Terminal,
  Eye,
  ChevronRight,
  FileText
} from "lucide-react";
import { 
  DashboardMetrics, 
  SymbolData, 
  KYCData, 
  WalletTransaction, 
  Position, 
  Order, 
  UserProfile,
  AssetCategory,
  KYCStatus,
  TransactionStatus
} from "../types";
import * as adminService from "../services/admin";

interface AdminCRMProps {
  userId: string;
  onRefreshAllData: () => void;
}

export default function AdminCRM({ userId, onRefreshAllData }: AdminCRMProps) {
  // CRM Navigation
  const [crmTab, setCrmTab] = useState<"METRICS" | "USERS" | "KYC" | "TRANSACTIONS" | "TRADES" | "MARKETS" | "NEWS">("METRICS");

  // Metrics state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  // Lists from server API
  const [userProfiles, setUserProfiles] = useState<{ profile: UserProfile; wallet: any }[]>([]);
  const [kycList, setKycList] = useState<(KYCData & { userEmail: string })[]>([]);
  const [transactionsList, setTransactionsList] = useState<(WalletTransaction & { userEmail: string; userName: string })[]>([]);
  const [globalTrades, setGlobalTrades] = useState<{ active: any[]; pending: any[]; closed: any[] }>({ active: [], pending: [], closed: [] });
  const [activeSymbols, setActiveSymbols] = useState<SymbolData[]>([]);

  // Sub-forms and selections
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<string>("");
  const [reviewNote, setReviewNote] = useState<string>("");

  // New Symbol Form States
  const [newSymCode, setNewSymCode] = useState<string>("");
  const [newSymName, setNewSymName] = useState<string>("");
  const [newSymCategory, setNewSymCategory] = useState<AssetCategory>(AssetCategory.CRYPTO);
  const [newSymPrice, setNewSymPrice] = useState<string>("");
  const [newSymLeverage, setNewSymLeverage] = useState<string>("100");
  const [newSymSpread, setNewSymSpread] = useState<string>("10");

  // Custom News inputs
  const [newsTitle, setNewsTitle] = useState<string>("");
  const [newsSummary, setNewsSummary] = useState<string>("");
  const [newsContent, setNewsContent] = useState<string>("");
  const [newsCat, setNewsCat] = useState<string>("global");

  // Push Notifications state
  const [notifTitle, setNotifTitle] = useState<string>("");
  const [notifContent, setNotifContent] = useState<string>("");
  const [notifUser, setNotifUser] = useState<string>("ALL");

  // Fetch all Administrative context maps
  const fetchCrmData = async () => {
    try {
      const data = await adminService.getDashboardMetrics();
      if (data) {
        const { users, deposits, kycRequests, wallets } = data;
        
        // Map data to match component expectations
        setUserProfiles(users.map((u: any) => ({
          profile: {
            id: u._id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            status: u.status,
            kycStatus: u.kycStatus
          },
          wallet: wallets.find((w: any) => w.userId._id === u._id) || { balance: 0, equity: 0 }
        })));

        setKycList(kycRequests.map((k: any) => ({
          id: k._id,
          userEmail: k.userId.email,
          fullName: k.userId.fullName,
          status: k.status,
          documents: k.documents
        })));

        setTransactionsList(deposits.map((d: any) => ({
          id: d._id,
          userEmail: d.userId.email,
          userName: d.userId.fullName,
          amount: d.amount,
          type: 'DEPOSIT',
          method: 'Bank Transfer',
          utrNumber: d.utr,
          status: d.status
        })));
        
        // Mock metrics for now to avoid errors
        setMetrics({
          totalUsers: users.length,
          onlineUsers: users.length,
          activeTraders: users.length,
          todayDeposits: deposits.reduce((acc: number, d: any) => acc + d.amount, 0),
          todayWithdrawals: 0,
          tradingVolume24h: 0
        });
      }
    } catch (err) {
      console.error("Administrative loading error.", err);
    }
  };

  useEffect(() => {
    fetchCrmData();
    const interval = setInterval(fetchCrmData, 5000);
    return () => clearInterval(interval);
  }, [crmTab]);

  // Adjust User Balance handler
  const handleAdjustBalance = async (action: "ADD" | "SUBTRACT") => {
    if (!selectedUser || !balanceAdjustAmount) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.profile.id}/adjust-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Override": "true" },
        body: JSON.stringify({ amount: balanceAdjustAmount, action })
      });
      if (res.ok) {
        alert("Balance ledger updated successfully.");
        setBalanceAdjustAmount("");
        setSelectedUser(null);
        fetchCrmData();
        onRefreshAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed modification.");
      }
    } catch {
      alert("Error processing adjustment command.");
    }
  };

  // Toggle suspension
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Override": "true" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        alert(`User profile is now set to ${nextStatus}.`);
        fetchCrmData();
      }
    } catch {
      alert("Error switching profile activity.");
    }
  };

  // Approve or Reject Deposit/Withdrawals requests
  const handleReviewTransaction = async (txId: string, status: "APPROVED" | "REJECTED") => {
    if (status === "REJECTED") return alert("Rejection not implemented yet");
    try {
      const data = await adminService.approveDeposit(txId);
      if (data) {
        alert(`Request ${status} successfully.`);
        setReviewNote("");
        fetchCrmData();
        onRefreshAllData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Review failed.");
    }
  };

  // Approve or Reject KYC compliance files
  const handleReviewKyc = async (kycId: string, status: "APPROVED" | "REJECTED") => {
    if (status === "REJECTED") return alert("Rejection not implemented yet");
    try {
      const data = await adminService.approveKyc(kycId);
      if (data) {
        alert(`KYC decision locked: ${status}`);
        setReviewNote("");
        fetchCrmData();
        onRefreshAllData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Error reviewing compliance documents.");
    }
  };

  // Emergency FORCE-CLOSE active trade position
  const handleForceClosePosition = async (posId: string) => {
    if (!window.confirm("Verify: Executing emergency Force-Close will settle position immediately at current spot rate. Proceed?")) return;
    try {
      const res = await fetch(`/api/admin/trades/force-close/${posId}`, {
        method: "POST",
        headers: { "X-Admin-Override": "true" }
      });
      if (res.ok) {
        alert("Emergent market exit settled.");
        fetchCrmData();
        onRefreshAllData();
      }
    } catch {
      alert("Verification exit failed.");
    }
  };

  // Add Custom Symbol listing
  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymCode || !newSymPrice) return;
    try {
      const res = await fetch("/api/admin/symbols", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Override": "true" },
        body: JSON.stringify({
          symbol: newSymCode,
          name: newSymName || `${newSymCode} Index`,
          category: newSymCategory,
          price: newSymPrice,
          leverageLimit: newSymLeverage,
          spread: newSymSpread
        })
      });
      if (res.ok) {
        alert("New asset added to exchange boards.");
        setNewSymCode("");
        setNewSymName("");
        setNewSymPrice("");
        fetchCrmData();
      } else {
        const err = await res.json();
        alert(err.error || "Symbol duplicate.");
      }
    } catch {
      alert("Listing failure.");
    }
  };

  // Toggle Symbol Trade Active State
  const handleToggleSymbolState = async (code: string) => {
    try {
      const res = await fetch(`/api/admin/symbols/${code}/toggle`, {
        method: "POST",
        headers: { "X-Admin-Override": "true" }
      });
      if (res.ok) {
        alert("Exchange trading bounds modified.");
        fetchCrmData();
      }
    } catch {
      alert("Failed toggling.");
    }
  };

  // Author News Articles
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) return;
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Override": "true" },
        body: JSON.stringify({
          title: newsTitle,
          summary: newsSummary,
          content: newsContent,
          category: newsCat,
          source: "Baha Executive Bulletin"
        })
      });
      if (res.ok) {
        alert("Press article published instantly.");
        setNewsTitle("");
        setNewsSummary("");
        setNewsContent("");
        fetchCrmData();
      }
    } catch {
      alert("Error.");
    }
  };

  // Dispatch Global Push alert
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifContent) return;
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Override": "true" },
        body: JSON.stringify({
          userId: notifUser,
          title: notifTitle,
          content: notifContent
        })
      });
      if (res.ok) {
        alert("System push-notification dispatched.");
        setNotifTitle("");
        setNotifContent("");
      }
    } catch {
      alert("Command failed.");
    }
  };

  return (
    <div id="super-admin-crm" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Head Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black font-sans tracking-tight text-white flex items-center">
                SUPER ADMIN EXCHANGE CONSOLE
                <span className="ml-2 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[9px] font-black rounded font-mono border border-orange-500/20">ROOT DEV CONTROL</span>
              </h1>
              <p className="text-xs text-slate-500">Global ledger reviews, KYC audits, position overrides, and ticker leverage configurations.</p>
            </div>
          </div>
        </div>

        {/* Baha CRM Tab Selector Row */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-800 overflow-x-auto scrolling-touch">
          {([
            { id: "METRICS", key: "Metrics & Charts" },
            { id: "USERS", key: "User Profiles" },
            { id: "KYC", key: "KYC Compliance Queue" },
            { id: "TRANSACTIONS", key: "Wallets Deposits Ledger" },
            { id: "TRADES", key: "Overruled Trading Terminal" },
            { id: "MARKETS", key: "Market Assets CRUD" },
            { id: "NEWS", key: "Bulletin press & Dispatch" }
          ] as const).map(tab => (
            <button 
              key={tab.id}
              onClick={() => setCrmTab(tab.id)}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition shrink-0 uppercase tracking-wider ${crmTab === tab.id ? 'bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab.key}
            </button>
          ))}
        </div>

        {/* Inside displays */}
        {crmTab === "METRICS" && metrics && (
          <div className="space-y-8">
            {/* Bento statistics grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-sm">
                <Users className="w-5 h-5 text-teal-400" />
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider pt-2">Total Accounts</p>
                <p className="text-2xl font-black font-mono text-white">{metrics.totalUsers}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-sm font-sans">
                <Activity className="w-5 h-5 text-indigo-400" />
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider pt-2">Online Trades</p>
                <p className="text-2xl font-black font-mono text-white">{metrics.onlineUsers}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-sm">
                <Award className="w-5 h-5 text-orange-400" />
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider pt-2">Active Traders</p>
                <p className="text-2xl font-black font-mono text-orange-400">{metrics.activeTraders}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-sm">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-mono text-slate-400 mt-2 uppercase tracking-wide">Deposits 24H</p>
                <p className="text-2xl font-black font-mono text-emerald-400">${(metrics?.todayDeposits ?? 0).toLocaleString()}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-sm">
                <TrendingDown className="w-5 h-5 text-rose-450" />
                <p className="text-sm font-mono text-slate-400 mt-2 uppercase tracking-wide">Withdrawals 24H</p>
                <p className="text-2xl font-black font-mono text-rose-400">${(metrics?.todayWithdrawals ?? 0).toLocaleString()}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-sm">
                <Sliders className="w-5 h-5 text-pink-400" />
                <p className="text-xs font-mono text-slate-400 mt-2 uppercase tracking-wide">Trading Volume 24H</p>
                <p className="text-lg font-black font-mono text-white">${(metrics?.tradingVolume24h ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            {/* Custom SVG Revenue History visualization Line Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1.5 text-teal-400" /> Cumulative Revenue Metrics (24H Cycles)
                  </h3>
                  <span className="text-xs text-teal-400 font-mono font-bold">+$62,400 Total</span>
                </div>
                {/* SVG Graph visual */}
                <div className="h-60 w-full bg-slate-950 rounded-xl relative p-3 flex flex-col justify-between">
                  <svg className="w-full h-44" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeDasharray="3" />
                    <polyline 
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2.5"
                      points="10,130 90,123 170,111 250,118 335,101 415,90 490,78"
                    />
                    {/* Points dot */}
                    <circle cx="490" cy="78" r="4" fill="#14b8a6" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>June 5</span>
                    <span>June 7</span>
                    <span>June 9</span>
                    <span>June 11 (Today)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center">
                    <Sliders className="w-4 h-4 mr-1.5 text-indigo-400" /> Exchange Volume Analytics (USD Millions)
                  </h3>
                  <span className="text-xs text-indigo-450 font-mono font-bold">$8.9M Peak</span>
                </div>
                {/* SVG Graph visual */}
                <div className="h-60 w-full bg-slate-950 rounded-xl relative p-3 flex flex-col justify-between">
                  <svg className="w-full h-44" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeDasharray="3" />
                    <polyline 
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                      points="10,125 90,113 170,105 250,112 335,90 415,86 490,75"
                    />
                    <circle cx="490" cy="75" r="4" fill="#6366f1" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>June 5</span>
                    <span>June 7</span>
                    <span>June 9</span>
                    <span>June 11 (Today)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {crmTab === "USERS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 cols: User Lists */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl overflow-x-auto text-left">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2 text-left">Account ID</th>
                    <th className="pb-2 text-left">Email Address</th>
                    <th className="pb-2 text-left">Total Balance</th>
                    <th className="pb-2 text-left">Role Class</th>
                    <th className="pb-2 text-left">KYC compliance</th>
                    <th className="pb-2 text-left">Account State</th>
                    <th className="pb-2 text-right">Adjust balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {userProfiles.map(u => (
                    <tr key={u.profile.id} className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-300">{u.profile.id}</td>
                      <td className="py-2.5 text-slate-200">
                        <p className="font-bold">{u.profile.fullName}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{u.profile.email}</p>
                      </td>
                      <td className="py-2.5 font-bold text-white">${(u.wallet?.balance ?? 0).toLocaleString()}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-extrabold ${u.profile.role === 'ADMIN' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}>
                          {u.profile.role}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-sans font-bold uppercase ${u.profile.kycStatus === KYCStatus.APPROVED ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {u.profile.kycStatus}
                        </span>
                      </td>
                      <td className="py-2.5 font-sans">
                        <button 
                          onClick={() => handleToggleUserStatus(u.profile.id, u.profile.status)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${u.profile.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                        >
                          {u.profile.status}
                        </button>
                      </td>
                      <td className="py-2.5 text-right">
                        <button 
                          onClick={() => setSelectedUser(u)}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] font-sans font-bold hover:bg-slate-900 text-slate-300"
                        >
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right 4 cols: Balance modify widget */}
            <div className="lg:col-span-4">
              {selectedUser ? (
                <div className="bg-slate-900 border border-orange-505 rounded-2xl p-5 space-y-4 shadow-xl border border-orange-500/20">
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-none">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Target Email:</span>
                    <strong className="text-xs text-orange-400">{selectedUser.profile.email}</strong>
                  </div>

                  <div className="space-y-1.5 text-left font-sans">
                    <label className="text-[11px] text-slate-500 font-mono uppercase font-bold">Adjustment value ($)</label>
                    <input 
                      type="number"
                      value={balanceAdjustAmount}
                      onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                      placeholder="Specify amount to adjust"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleAdjustBalance("ADD")}
                      className="py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition"
                    >
                      Credit User (+ $)
                    </button>
                    <button 
                      onClick={() => handleAdjustBalance("SUBTRACT")}
                      className="py-2.5 bg-rose-500 text-white font-bold rounded-lg text-xs hover:bg-rose-450 transition"
                    >
                      Debit User (- $)
                    </button>
                  </div>

                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="w-full py-2 bg-slate-950 text-slate-500 text-xs font-bold rounded-lg hover:text-slate-350 transition border border-slate-850"
                  >
                    Cancel Action
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-500 text-xs space-y-2">
                  <Eye className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>Click "Adjust Balance" on any user block to credit/debit active capital accounts instantly.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {crmTab === "KYC" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8: KYC List */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2">Dossier ID</th>
                    <th className="pb-2">User Email</th>
                    <th className="pb-2">Legal Declared Name</th>
                    <th className="pb-2">Doc Type</th>
                    <th className="pb-2">ID Number</th>
                    <th className="pb-2">Submitted</th>
                    <th className="pb-2 text-right font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {kycList.map(k => (
                    <tr key={k.id} className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-300">{k.id}</td>
                      <td className="py-2.5 text-slate-400">{k.userEmail}</td>
                      <td className="py-2.5 text-white font-bold">{k.fullName}</td>
                      <td className="py-2.5 text-slate-450">{k.documentType}</td>
                      <td className="py-2.5 text-slate-400">{k.documentNumber}</td>
                      <td className="py-2.5 text-slate-500">{new Date(k.submittedAt).toLocaleDateString()}</td>
                      <td className="py-2.5 text-right font-sans">
                        <button 
                          onClick={() => setSelectedUser(k)}
                          className={`px-2.5 py-1 rounded text-[10px] font-sans font-bold border transition ${k.status === KYCStatus.PENDING ? 'bg-amber-500/10 border-amber-500/35 text-amber-500 hover:bg-slate-950' : k.status === KYCStatus.APPROVED ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-455'}`}
                        >
                          {k.status} Review ID
                        </button>
                      </td>
                    </tr>
                  ))}
                  {kycList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-600 font-sans">No KYC submissions listed in the compliance pipeline.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right 4: KYC Auditor */}
            <div className="lg:col-span-4">
              {selectedUser && selectedUser.documentNumber ? (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left border-2 border-orange-500/20 shadow-2xl">
                  <div className="border-b border-slate-800 pb-3 leading-none">
                    <h4 className="text-sm font-bold text-white uppercase">{selectedUser.fullName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1.5">DOB: {selectedUser.dob}</p>
                  </div>

                  {/* Visual ID images */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Front ID scan</span>
                      <div className="h-28 bg-slate-950 rounded bg-cover bg-center border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        {selectedUser.frontImageBase64 ? (
                          <img src={selectedUser.frontImageBase64} alt="ID front" className="max-h-full max-w-full rounded" />
                        ) : (
                          <span className="text-[9px] text-slate-600 text-center">No image uploaded</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Back ID scan</span>
                      <div className="h-28 bg-slate-950 rounded bg-cover bg-center border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        {selectedUser.backImageBase64 ? (
                          <img src={selectedUser.backImageBase64} alt="ID back" className="max-h-full max-w-full rounded" />
                        ) : (
                          <span className="text-[9px] text-slate-600 text-center">No image uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-[11px] text-slate-500 font-mono uppercase font-bold">Add audit notes</label>
                    <textarea 
                      rows={2}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white"
                      placeholder="Comment if rejected or approved..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleReviewKyc(selectedUser.id, "APPROVED")}
                      className="py-2.5 bg-emerald-500 text-slate-950 font-extrabold rounded-lg text-xs"
                    >
                      Clear / Approve ID
                    </button>
                    <button 
                      onClick={() => handleReviewKyc(selectedUser.id, "REJECTED")}
                      className="py-2.5 bg-rose-500 text-white font-bold rounded-lg text-xs"
                    >
                      Reject Submission
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="w-full py-1.5 bg-slate-950 text-slate-500 text-xs font-bold rounded hover:text-slate-350"
                  >
                    Close dossier review
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-500 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>Select "Review ID" on the compliant list to view birth dates, ID hashes, and actual image files uploaded.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {crmTab === "TRANSACTIONS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8: Transactions list queue */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl overflow-x-auto text-left">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">User Email</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Method</th>
                    <th className="pb-2">UTR/Details</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactionsList.map(t => (
                    <tr key={t.id} className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-350">{t.id}</td>
                      <td className="py-2.5 text-slate-400">
                        <p className="font-bold text-white leading-none">{t.userName}</p>
                        <p className="text-[9px] text-slate-500 mt-1 truncate max-w-[140px]">{t.userEmail}</p>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-extrabold ${t.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'}`}>
                          {t.type === TransactionType.DEPOSIT ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="py-2.5 font-black text-white">${(t.amount ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 text-slate-400 font-sans">{t.method}</td>
                      <td className="py-2.5 text-slate-300 font-mono max-w-[180px] truncate">{t.utrNumber || t.details}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-sans font-bold ${t.status === TransactionStatus.APPROVED ? 'text-emerald-400' : t.status === TransactionStatus.REJECTED ? 'text-rose-450' : 'text-amber-500'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        {t.status === TransactionStatus.PENDING ? (
                          <button 
                            onClick={() => setSelectedUser(t)}
                            className="px-2 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-[10px] rounded transition"
                          >
                            Review Ledger
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-sans font-medium">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactionsList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-600 font-sans">No transaction histories reported dynamically.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right 4: Receipt Auditor */}
            <div className="lg:col-span-4">
              {selectedUser && selectedUser.amount && !selectedUser.documentNumber ? (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left border-l-4 border-orange-500 shadow-2xl">
                  <div className="border-b border-slate-800 pb-3 font-sans">
                    <h4 className="text-sm font-bold text-slate-200">Processing: {selectedUser.type} Account request</h4>
                    <p className="text-xs text-orange-400 font-mono mt-1 font-bold">Sum requested: ${selectedUser.amount}</p>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800">
                    <p className="text-slate-500">Routing Channel: <span className="text-white">{selectedUser.method}</span></p>
                    {selectedUser.utrNumber && <p className="text-slate-500">UTR Receipt No: <span className="text-emerald-400 font-bold">{selectedUser.utrNumber}</span></p>}
                    <p className="text-slate-500">Client details: <span className="text-slate-300">{selectedUser.details}</span></p>
                  </div>

                  {/* Receipt screenshot preview */}
                  {selectedUser.screenshotBase64 && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Screenshot receipt proof:</span>
                      <div className="h-44 bg-slate-950 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
                        <img src={selectedUser.screenshotBase64} alt="Screenshot receipt" className="max-h-full max-w-full rounded" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 font-sans">
                    <label className="text-[11px] text-slate-500 font-mono uppercase font-bold">Auditor response comments</label>
                    <textarea 
                      rows={2}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white"
                      placeholder="Comment for UTR approved / failed audits..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleReviewTransaction(selectedUser.id, "APPROVED")}
                      className="py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Verify / Approve Credit
                    </button>
                    <button 
                      onClick={() => handleReviewTransaction(selectedUser.id, "REJECTED")}
                      className="py-2.5 bg-rose-500 text-white font-bold rounded-lg text-xs"
                    >
                      Reject Request
                    </button>
                  </div>

                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="w-full py-1.5 bg-slate-950 text-slate-500 text-xs font-bold rounded hover:text-slate-300"
                  >
                    Cancel ledger inspection
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-500 text-xs space-y-2">
                  <Eye className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>Click "Review Ledger" to bring up destination routes, receipt photos, UTR codes and verify credits.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {crmTab === "TRADES" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left overflow-x-auto space-y-4">
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest">Global Positions Active & History Log</h3>
            
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 pb-2">
                  <th className="pb-2">Trade / Position ID</th>
                  <th className="pb-2">User Email Profile</th>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2">Lots Size</th>
                  <th className="pb-2">Opening Quote</th>
                  <th className="pb-2">Current Quote</th>
                  <th className="pb-2">Unrealized PNL</th>
                  <th className="pb-2 text-right">Administrative Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {globalTrades.active.map(p => (
                  <tr key={p.id} className="hover:bg-slate-950/20">
                    <td className="py-2.5 font-bold text-slate-300">{p.id}</td>
                    <td className="py-2.5 text-slate-400">{p.userEmail}</td>
                    <td className="py-2.5 text-white font-extrabold">{p.symbol}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${p.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'}`}>{p.side}</span>
                    </td>
                    <td className="py-2.5 text-slate-200">{p.size} lots</td>
                    <td className="py-2.5 text-slate-300">${p.entryPrice}</td>
                    <td className="py-2.5 text-slate-300">${p.currentPrice}</td>
                    <td className={`py-2.5 font-bold ${p.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {p.pnl >= 0 ? "+" : ""}{(p.pnl ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      <button 
                        onClick={() => handleForceClosePosition(p.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-[10px] font-bold"
                      >
                        Force Close Rate
                      </button>
                    </td>
                  </tr>
                ))}
                {globalTrades.active.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-600 font-sans">No live active positions open worldwide.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {crmTab === "MARKETS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Symbols Listing */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left overflow-x-auto space-y-4">
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest font-sans">Exchange Market Symbols Listings</h3>
              
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2">Token / Code</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Spot Quote ($)</th>
                    <th className="pb-2">Spread (Pips)</th>
                    <th className="pb-2">Leverage Limit</th>
                    <th className="pb-2 text-right">Halts status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeSymbols.map(s => (
                    <tr key={s.symbol}>
                      <td className="py-2.5">
                        <p className="font-extrabold text-white leading-none">{s.symbol}</p>
                        <p className="text-[9px] text-slate-500 mt-1 truncate max-w-[120px]">{s.name}</p>
                      </td>
                      <td className="py-2.5 text-slate-400 font-sans">{s.category}</td>
                      <td className="py-2.5 font-bold text-slate-200">${s.price.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-400">{s.spread}</td>
                      <td className="py-2.5 text-teal-400 font-bold">1:{s.leverageLimit}</td>
                      <td className="py-2.5 text-right font-sans">
                        <button 
                          onClick={() => handleToggleSymbolState(s.symbol)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${s.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-450 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                        >
                          {s.isActive ? 'Active Spot' : 'HALTED'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right 5: Create Form */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left">
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest pb-3 border-b border-slate-800 font-sans">List New Asset Symbol</h3>
              
              <form onSubmit={handleAddSymbol} className="space-y-4 pt-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Symbol Identifier Code</label>
                    <input 
                      type="text"
                      value={newSymCode}
                      onChange={(e) => setNewSymCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                      placeholder="e.g. RELIANCE"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Asset Label Name</label>
                    <input 
                      type="text"
                      value={newSymName}
                      onChange={(e) => setNewSymName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                      placeholder="e.g. Reliance Industries"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Initial Spot Quote ($)</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={newSymPrice}
                      onChange={(e) => setNewSymPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                      placeholder="125.50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Standard Category</label>
                    <select 
                      value={newSymCategory}
                      onChange={(e) => setNewSymCategory(e.target.value as AssetCategory)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      {Object.keys(AssetCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Leverage Bracket Maximum</label>
                    <input 
                      type="number"
                      value={newSymLeverage}
                      onChange={(e) => setNewSymLeverage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Mated Spread (Pips)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newSymSpread}
                      onChange={(e) => setNewSymSpread(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                <button 
                  id="submit-new-symbol"
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-lg transition text-xs uppercase cursor-pointer"
                >
                  Publish and List Token
                </button>
              </form>
            </div>
          </div>
        )}

        {crmTab === "NEWS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6: Write Press */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left font-sans">
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest pb-3 border-b border-slate-800">Publish Financial Breaking News</h3>
              
              <form onSubmit={handleCreateNews} className="space-y-4 pt-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">News Head Headline</label>
                  <input 
                    type="text"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                    placeholder="e.g. S&P 500 registers record liquidity sweeps..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Brief summary</label>
                  <input 
                    type="text"
                    value={newsSummary}
                    onChange={(e) => setNewsSummary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    placeholder="Brief 1-sentence synopsis."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Target sector</label>
                    <select 
                      value={newsCat}
                      onChange={(e) => setNewsCat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="crypto">Cryptos sector</option>
                      <option value="forex">Forex Spot</option>
                      <option value="stocks">US Equities</option>
                      <option value="global">Macro Global</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1" /> Article Body copy
                  </label>
                  <textarea 
                    rows={4}
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                    placeholder="Provide professional insights..."
                    required
                  />
                </div>

                <button 
                  id="submit-news-article"
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-405 text-slate-950 font-bold rounded-lg uppercase"
                >
                  Publish Breaking Story
                </button>
              </form>
            </div>

            {/* Right 6: Push dispatcher */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left font-sans">
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest pb-3 border-b border-slate-800">Dispatch Push notification banners</h3>
              
              <form onSubmit={handleDispatchNotification} className="space-y-4 pt-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Notification Title Header</label>
                  <input 
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                    placeholder="e.g. Critical margin policy adjustment..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Target Account Segment</label>
                  <select 
                    value={notifUser}
                    onChange={(e) => setNotifUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="ALL">Broad Broadcast (All Active displays)</option>
                    <option value="USER_GUEST">Pradeep / Guest Trader profile specific</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center">
                    <BellRing className="w-3.5 h-3.5 text-teal-400 mr-1" /> Alert Body Info
                  </label>
                  <textarea 
                    rows={3}
                    value={notifContent}
                    onChange={(e) => setNotifContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                    placeholder="Compliance message..."
                    required
                  />
                </div>

                <button 
                  id="submit-push-banner"
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg uppercase"
                >
                  Broadcast Push Alert
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
