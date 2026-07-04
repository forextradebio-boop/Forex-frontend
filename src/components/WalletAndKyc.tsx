/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  QrCode, 
  Wallet, 
  Share2, 
  Upload, 
  UserCheck, 
  Info,
  Calendar,
  AlertCircle,
  Trash2
} from "lucide-react";
import { 
  WalletTransaction, 
  KYCData, 
  KYCStatus, 
  TransactionStatus, 
  TransactionType, 
  UserWallet 
} from "../types";
import { getWallet } from "../services/wallet";
import { getDeposits } from "../services/deposit";
import { createWithdrawal, getWithdrawals } from "../services/withdraw";
import { getKyc, submitKyc } from "../services/kyc";

export interface WalletAndKycProps {
  userId: string;
  onDeposit: (p: any) => Promise<void>;
}

export default function WalletAndKyc({ 
  userId, 
  onDeposit 
}: WalletAndKycProps) {
  // Navigation tabs: WALLET vs KYC
  const [activeSegment, setActiveSegment] = useState<"WALLET" | "KYC">("WALLET");
  const [walletTab, setWalletTab] = useState<"DEPOSIT" | "WITHDRAW" | "LEDGER" | "WITHDRAW_HISTORY">("DEPOSIT");

  // Wallet API state
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchWalletData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) {
          setWalletError("Unauthorized. Please log in.");
          setWalletLoading(false);
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return;
      }

      try {
        setWalletLoading(true);
        setWalletError(null);
        const data = await getWallet();
        if (mounted) {
          // Verify frontend mapping matches backend response
          setWallet(data.wallet ? data.wallet : data);
        }
      } catch (err) {
        if (mounted) {
          setWalletError("Failed to fetch wallet data.");
        }
      } finally {
        if (mounted) {
          setWalletLoading(false);
        }
      }
    };
    
    fetchWalletData();
    return () => { mounted = false; };
  }, []);

  // Deposit States
  const [depositAmount, setDepositAmount] = useState<string>("500");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [depositPending, setDepositPending] = useState<boolean>(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawPending, setWithdrawPending] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // KYC Submission Wizard States
  const [kycDocType, setKycDocType] = useState<"AADHAAR" | "PAN" | "PASSPORT">("PAN");
  const [kycFullName, setKycFullName] = useState<string>("");
  const [kycDob, setKycDob] = useState<string>("");
  const [kycDocNumber, setKycDocNumber] = useState<string>("");
  const [kycFrontImage, setKycFrontImage] = useState<string>("");
  const [kycBackImage, setKycBackImage] = useState<string>("");
  const [kycPendingSubmit, setKycPendingSubmit] = useState<boolean>(false);

  // Drag and drop helper states
  const [dragOverIndex, setDragOverIndex] = useState<"FRONT" | "BACK" | null>(null);

  // Drag and Drop files callback
  const handleDragOver = (e: React.DragEvent, id: "FRONT" | "BACK") => {
    e.preventDefault();
    setDragOverIndex(id);
  };

  const handleDrop = (e: React.DragEvent, id: "FRONT" | "BACK") => {
    e.preventDefault();
    setDragOverIndex(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (id === "FRONT") setKycFrontImage(base64String);
        else if (id === "BACK") setKycBackImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ledger States
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // Withdrawal History States
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [withdrawHistoryLoading, setWithdrawHistoryLoading] = useState<boolean>(true);
  const [withdrawHistoryError, setWithdrawHistoryError] = useState<string | null>(null);

  // KYC Backend States
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [kycLoading, setKycLoading] = useState<boolean>(true);
  const [kycError, setKycError] = useState<string | null>(null);

  const fetchLedger = async () => {
    try {
      setLedgerLoading(true);
      setLedgerError(null);
      const data = await getDeposits();
      const arr = Array.isArray(data) ? data : data.deposits || [];
      const sorted = arr.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLedgerData(sorted);
    } catch (err) {
      setLedgerError("Failed to fetch ledger transactions.");
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchWithdrawalsHistory = async () => {
    try {
      setWithdrawHistoryLoading(true);
      setWithdrawHistoryError(null);
      const data = await getWithdrawals();
      const arr = Array.isArray(data) ? data : data.withdrawals || [];
      const sorted = arr.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawHistory(sorted);
    } catch (err) {
      setWithdrawHistoryError("Failed to fetch withdrawal history.");
    } finally {
      setWithdrawHistoryLoading(false);
    }
  };

  const fetchKycStatus = async () => {
    try {
      setKycLoading(true);
      setKycError(null);
      const data = await getKyc();
      setKycStatus(data.kyc || data);
    } catch (err) {
      setKycError("Failed to fetch KYC status.");
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchWithdrawalsHistory();
    fetchKycStatus();
  }, []);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    
    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setDepositError("Amount must be greater than 0.");
      return;
    }
    if (!utrNumber || utrNumber.length < 12) {
      setDepositError("UTR Number must be at least 12 characters.");
      return;
    }

    setDepositPending(true);
    try {
      await onDeposit({
        amount: parsedAmount,
        utr: utrNumber
      });
      alert(`Success! Deposit request of $${parsedAmount} submitted.`);
      setDepositAmount("500");
      setUtrNumber("");
      fetchLedger(); // Refresh ledger automatically
      setWalletTab("LEDGER");
    } catch (err: any) {
      setDepositError(err || "Deposit request failed.");
    } finally {
      setDepositPending(false);
    }
  };

  // Submit Withdrawal Request
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    const parsedAmount = parseFloat(withdrawAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setWithdrawError("Specify a valid withdrawal quantity.");
      return;
    }

    setWithdrawPending(true);
    try {
      // Fetch fresh wallet data to verify margin
      const freshData = await getWallet();
      const freshWallet = freshData.wallet ? freshData.wallet : freshData;
      setWallet(freshWallet);

      if (parsedAmount > (freshWallet?.freeMargin ?? 0)) {
        setWithdrawError("Insufficient free margin");
        setWithdrawPending(false);
        return;
      }

      await createWithdrawal({
        amount: parsedAmount,
        currency: 'USD',
        method: 'BANK'
      });
      alert(`Success! Withdrawal request of $${parsedAmount} submitted. Admin review pending.`);
      setWithdrawAmount("");
      
      // Refresh wallet after successful withdrawal
      const afterWithdraw = await getWallet();
      setWallet(afterWithdraw.wallet ? afterWithdraw.wallet : afterWithdraw);
      
      // Refresh withdrawal history
      fetchWithdrawalsHistory();
      setWalletTab("WITHDRAW_HISTORY");
      
    } catch (err: any) {
      setWithdrawError(err?.response?.data?.error || err.message || "Withdrawal action rejected.");
    } finally {
      setWithdrawPending(false);
    }
  };

  // Submit KYC verification packet
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFullName || !kycDocNumber || !kycDob) {
      alert("Fields cannot be left blank during identity declarations.");
      return;
    }
    if (!kycFrontImage) {
      alert("Upload document scans back/front visuals for validation!");
      return;
    }

    setKycPendingSubmit(true);
    try {
      await submitKyc({
        documentType: kycDocType,
        documentNumber: kycDocNumber,
        fullName: kycFullName,
        dob: kycDob,
        documents: [kycFrontImage, kycBackImage].filter(Boolean)
      });
      alert("KYC submitted successfully");
      
      // Refresh KYC status
      fetchKycStatus();
      
    } catch (err: any) {
      alert(err.response?.data?.error || "KYC submission failed.");
    } finally {
      setKycPendingSubmit(false);
    }
  };

  return (
    <div id="wallet-kyc" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Toggle Head Header Row */}
        <div className="flex border-b border-slate-900 pb-0 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveSegment("WALLET")}
              className={`pb-4 text-sm font-extrabold transition flex items-center space-x-2 border-b-2 tracking-wide cursor-pointer select-none ${activeSegment === "WALLET" ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet Ledger & Deposits</span>
            </button>
            <button 
              onClick={() => setActiveSegment("KYC")}
              className={`pb-4 text-sm font-extrabold transition flex items-center space-x-2 border-b-2 tracking-wide cursor-pointer select-none ${activeSegment === "KYC" ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <UserCheck className="w-4 h-4" />
              <span>KYC Identity Verification</span>
            </button>
          </div>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">KYC Stat: <strong className="text-teal-400">{kycStatus?.status || "UNSUBMITTED"}</strong></span>
        </div>

        {activeSegment === "WALLET" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 4 cols: Wallet metrics Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-mono tracking-wider font-extrabold uppercase">Premium Wallet Card</span>
                  <div className="px-2 py-0.5 bg-teal-450/15 border border-teal-500/20 text-teal-400 text-[10px] font-bold rounded uppercase tracking-wide">Standard Portfolio</div>
                </div>

                {walletLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : walletError ? (
                  <div className="py-12 flex justify-center items-center flex-col text-rose-400 space-y-2">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-xs font-bold">{walletError}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 mt-8">
                      <p className="text-slate-500 text-xs uppercase font-mono font-bold font-mono">Wallet Balance</p>
                      <p className="text-3xl font-black font-mono tracking-tight text-white">${(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-mono">Equity</span>
                        <strong className="text-sm font-mono text-teal-400 font-extrabold">${(wallet?.equity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-mono">Used Margin</span>
                        <strong className="text-sm font-mono text-slate-100 font-bold">${(wallet?.margin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-mono">Free Margin</span>
                        <strong className="text-sm font-mono text-slate-100 font-bold">${(wallet?.freeMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-mono">Profit & Loss</span>
                        <strong className={`text-sm font-mono font-bold ${(wallet?.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {(wallet?.pnl ?? 0) >= 0 ? "+" : ""}{(wallet?.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right 8 cols: Deposits and Withdrawal worksheets */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
              {/* Secondary Navigation buttons */}
              <div className="flex border-b border-slate-800 pb-0 mb-6 gap-6">
                <button 
                  onClick={() => setWalletTab("DEPOSIT")}
                  className={`pb-3 text-xs font-extrabold tracking-wider transition uppercase select-none ${walletTab === "DEPOSIT" ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Request Deposit Option
                </button>
                <button 
                  onClick={() => setWalletTab("WITHDRAW")}
                  className={`pb-3 text-xs font-extrabold tracking-wider transition uppercase select-none ${walletTab === "WITHDRAW" ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Brokerage Withdrawal
                </button>
                <button 
                  onClick={() => setWalletTab("LEDGER")}
                  className={`pb-3 text-xs font-extrabold tracking-wider transition uppercase select-none ${walletTab === "LEDGER" ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Ledger Transactions
                </button>
                <button 
                  onClick={() => setWalletTab("WITHDRAW_HISTORY")}
                  className={`pb-3 text-xs font-extrabold tracking-wider transition uppercase select-none ${walletTab === "WITHDRAW_HISTORY" ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Withdrawal History
                </button>
              </div>

              {walletTab === "DEPOSIT" && (
                <form onSubmit={handleDepositSubmit} className="space-y-6 text-left">
                  {depositError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                      <span>{depositError}</span>
                    </div>
                  )}

                  {/* Step 1 */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">Step 1: Enter Deposit Amount ($)</label>
                    <input 
                      type="number"
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-400"
                      placeholder="500"
                    />
                  </div>

                  {/* Step 2 & 3 */}
                  <div className="space-y-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[11px] text-slate-500 uppercase font-mono font-bold text-center mb-2">Step 2 & 3: Scan UPI QR & Make Payment</p>
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-36 h-36 bg-white p-3 rounded-xl flex items-center justify-center border-4 border-teal-500">
                        <div className="w-full h-full bg-slate-900 flex flex-col justify-center items-center text-white p-1 rounded">
                          <span className="font-extrabold text-[9px] text-teal-400">SCAN TO PAY</span>
                          <span className="font-black text-sm tracking-widest text-emerald-400">UPI QR</span>
                          <span className="text-[7px] text-slate-500">BHIM, PAYTM, G-PAY</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-mono">Merchant VPA</p>
                        <p className="text-xs text-white font-bold font-mono select-all bg-slate-950 px-2 py-1 rounded border border-slate-800 mt-1">forexfactory.merchants@axl</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">Step 4: Enter 12-Digit UTR Number</label>
                    <input 
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-400"
                      placeholder="e.g. 123456789012"
                    />
                  </div>

                  {/* Step 5 */}
                  <button 
                    id="submit-deposit-action"
                    type="submit"
                    disabled={depositPending || !depositAmount || !utrNumber}
                    className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition flex items-center justify-center text-xs uppercase cursor-pointer"
                  >
                    {depositPending ? "Submitting Request..." : "Step 5: Submit Request"}
                  </button>
                </form>
              )}

              {walletTab === "WITHDRAW" && (
                <form onSubmit={handleWithdrawalSubmit} className="space-y-6 text-left">
                  {withdrawError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-3 rounded-xl flex items-center text-xs">
                      <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <p>{withdrawError}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">Withdraw Amount ($)</label>
                    <input 
                      type="number"
                      min="1"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-400"
                      placeholder="Specify amount"
                    />
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs border border-slate-800 font-mono">
                      <span className="text-slate-500">Free margin max</span>
                      <strong className="text-teal-400">${(wallet?.freeMargin ?? 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <button 
                    id="submit-withdraw-action"
                    type="submit"
                    disabled={withdrawPending || !withdrawAmount}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-450 text-white font-bold rounded-xl transition text-xs uppercase cursor-pointer"
                  >
                    {withdrawPending ? "Encrypting Routing locks..." : "Confirm Withdrawal Settlement"}
                  </button>
                </form>
              )}

              {walletTab === "LEDGER" && (
                <div className="overflow-x-auto text-left font-mono text-xs">
                  {ledgerLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400 font-sans text-[11px]">Loading transactions...</span>
                    </div>
                  ) : ledgerError ? (
                    <div className="text-center py-10">
                      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
                      <p className="text-rose-450 font-sans text-xs">{ledgerError}</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800 pb-2">
                          <th className="pb-2 text-left">UTR Number</th>
                          <th className="pb-2 text-left">Amount</th>
                          <th className="pb-2 text-left">Status</th>
                          <th className="pb-2 text-right">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {ledgerData.map(t => (
                          <tr key={t._id} className="hover:bg-slate-950/20">
                            <td className="py-2.5 font-bold text-slate-300">{t.utr}</td>
                            <td className="py-2.5 font-bold text-slate-200">
                              ${(t.amount ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 font-sans">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase 
                                ${t.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' 
                                : t.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-450' 
                                : 'bg-amber-500/15 text-amber-500'}`}>
                                {t.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {t.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                                {t.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-slate-500">
                              {t.createdAt ? (
                                new Date(t.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                }) + ", " + new Date(t.createdAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                }).toUpperCase()
                              ) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                        {ledgerData.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-slate-600 font-sans">
                              <Info className="w-6 h-6 mx-auto mb-2 opacity-30" />
                              No transactions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {walletTab === "WITHDRAW_HISTORY" && (
                <div className="overflow-x-auto text-left font-mono text-xs">
                  {withdrawHistoryLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400 font-sans text-[11px]">Loading withdrawal history...</span>
                    </div>
                  ) : withdrawHistoryError ? (
                    <div className="text-center py-10">
                      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
                      <p className="text-rose-450 font-sans text-xs">{withdrawHistoryError}</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800 pb-2">
                          <th className="pb-2 text-left">Amount</th>
                          <th className="pb-2 text-left">Status</th>
                          <th className="pb-2 text-right">Request Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {withdrawHistory.map(t => (
                          <tr key={t._id} className="hover:bg-slate-950/20">
                            <td className="py-2.5 font-bold text-slate-200">
                              ${(t.amount ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 font-sans">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase 
                                ${t.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' 
                                : t.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-450' 
                                : 'bg-amber-500/15 text-amber-500'}`}>
                                {t.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {t.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                                {t.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-slate-500">
                              {t.createdAt ? (
                                new Date(t.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                }) + ", " + new Date(t.createdAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                }).toUpperCase()
                              ) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                        {withdrawHistory.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center py-10 text-slate-600 font-sans">
                              <Info className="w-6 h-6 mx-auto mb-2 opacity-30" />
                              No withdrawal requests found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {activeSegment === "KYC" && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            {kycLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 font-sans text-xs">Loading KYC Status...</span>
              </div>
            ) : kycError ? (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3 opacity-50" />
                <p className="text-rose-450 font-sans text-sm font-bold">{kycError}</p>
              </div>
            ) : kycStatus?.status === 'APPROVED' ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{kycStatus.fullName || 'User'} Portfolio Fully Verified!</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">Your identity has been fully approved. Withdrawal blockades have been removed completely.</p>
                  <p className="text-emerald-400/80 text-[10px] font-mono mt-2 block">Documents uploaded: {kycStatus.documents?.length || 0}</p>
                </div>
                {kycStatus.adminNotes && (
                  <p className="p-3 bg-slate-950 rounded-lg text-xs font-mono max-w-sm mx-auto text-slate-500 border border-slate-850">Admin Note: "{kycStatus.adminNotes}"</p>
                )}
              </div>
            ) : kycStatus?.status === 'PENDING' ? (
              <div className="text-center space-y-4 py-8 font-sans">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Clock className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-white">Identity Review Pending validation</h3>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">Admin compliance desks have received your ID documents. We review files within minutes of submission.</p>
                  <p className="text-amber-500/80 text-[10px] font-mono mt-2 block">Documents uploaded: {kycStatus.documents?.length || 0}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-left text-slate-400 font-mono max-w-md mx-auto">
                  <p>Document type: <span className="text-white font-bold">{kycStatus.documentType || 'N/A'}</span></p>
                  <p>Document No: <span className="text-white font-bold">{kycStatus.documentNumber || 'N/A'}</span></p>
                  <p>Full legal name: <span className="text-white font-bold">{kycStatus.fullName || 'N/A'}</span></p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="space-y-6 text-left font-sans">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-white">KYC Document Upload Wizard</h3>
                  <p className="text-xs text-slate-400">Complete standard account compliance checks to activate ultimate leverage brackets.</p>
                  <p className="text-slate-500 text-[10px] font-mono mt-2 block">Status: {kycStatus?.status || 'UNSUBMITTED'}</p>
                </div>

                {kycStatus?.status === 'REJECTED' && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Prior Submission Rejected by Complying desks</p>
                      <p className="text-slate-400 mt-1">Reason: "{kycStatus.adminNotes || "Details illegible"}"</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(["PAN", "AADHAAR", "PASSPORT"] as const).map(type => (
                    <button 
                      key={type}
                      type="button"
                      onClick={() => setKycDocType(type)}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${kycDocType === type ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400'}`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>{type} Card ID</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">Full Name (Matching ID)</label>
                    <input 
                      type="text"
                      value={kycFullName}
                      onChange={(e) => setKycFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      placeholder="e.g. Pradeep Kumar"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">Document ID Number</label>
                    <input 
                      type="text"
                      value={kycDocNumber}
                      onChange={(e) => setKycDocNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                      placeholder={kycDocType === "PAN" ? "PAN-ABCDE1234F" : kycDocType === "AADHAAR" ? "12-Digit UID Code" : "Passport serial code"}
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Birth Date (DOB)
                    </label>
                    <input 
                      type="date"
                      value={kycDob}
                      onChange={(e) => setKycDob(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* ID visuals scans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front visual upload */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">ID Scan FRONT visuals</label>
                    <div 
                      onDragOver={(e) => handleDragOver(e, "FRONT")}
                      onDrop={(e) => handleDrop(e, "FRONT")}
                      className={`h-36 rounded-xl border-dashed border-2 flex flex-col justify-center items-center p-3 cursor-pointer select-none transition ${dragOverIndex === "FRONT" ? 'border-teal-500 bg-teal-500/5' : 'border-slate-800 bg-slate-950 hover:bg-slate-900/60'}`}
                    >
                      {kycFrontImage ? (
                        <div className="relative w-full h-full flex justify-center items-center">
                          <img src={kycFrontImage} alt="ID Front preview" className="max-h-full rounded max-w-[150px]" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              setKycFrontImage("");
                            }}
                            className="absolute top-1 right-1 bg-slate-950/80 p-1 rounded-full border border-slate-805 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Upload className="w-6 h-6 text-slate-600 mx-auto" />
                          <p className="text-[10px] text-slate-400">Front Visual Scan</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back visual upload if needed */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-500 uppercase font-mono font-bold">ID Scan BACK details</label>
                    <div 
                      onDragOver={(e) => handleDragOver(e, "BACK")}
                      onDrop={(e) => handleDrop(e, "BACK")}
                      className={`h-36 rounded-xl border-dashed border-2 flex flex-col justify-center items-center p-3 cursor-pointer select-none transition ${dragOverIndex === "BACK" ? 'border-teal-500 bg-teal-500/5' : 'border-slate-800 bg-slate-950 hover:bg-slate-900/60'}`}
                    >
                      {kycBackImage ? (
                        <div className="relative w-full h-full flex justify-center items-center">
                          <img src={kycBackImage} alt="ID Back preview" className="max-h-full rounded max-w-[150px]" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              setKycBackImage("");
                            }}
                            className="absolute top-1 right-1 bg-slate-950/80 p-1 rounded-full border border-slate-805 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Upload className="w-6 h-6 text-slate-600 mx-auto" />
                          <p className="text-[10px] text-slate-400">Back Visual Scan</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-[10px] text-slate-400 leading-relaxed flex items-start">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                  <span>Administrative rules: Submitting mock, blank, or low quality photos will trigger automatic rejected rulings. Compliance audits matches DOB and full registered legal names strictly.</span>
                </div>

                <button 
                  id="submit-kyc-action"
                  type="submit"
                  disabled={kycPendingSubmit || !kycDocNumber || kycStatus?.status === 'PENDING'}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl transition text-xs uppercase cursor-pointer disabled:opacity-50"
                >
                  {kycPendingSubmit ? "Securing compliant dossiers..." : "Submit Identity Dossier for verification"}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
