import React, { useState, useEffect } from 'react';
import { useCreateDeposit } from '../hooks/useDeposits';
import { usePaymentSettings } from '../hooks/usePaymentSettings';
import { useWallet } from '../hooks/useWallet';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { QrCode, UploadCloud, CheckCircle2, Copy, Building2, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import api from '../api/axios';

const depositCurrencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'USDT', label: 'USDT - Tether' },
];

export default function DepositScreen() {
  const { data: paymentSettings, isLoading: loadingSettings } = usePaymentSettings();
  const { data: wallet } = useWallet();
  const [amount, setAmount] = useState<string>(() => sessionStorage.getItem('prefillDepositAmount') || '');
  const [currency, setCurrency] = useState<string>('INR');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NETBANKING'>('UPI');
  const [utr, setUtr] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: exchangeRateData } = useExchangeRate();
  const currentRate = exchangeRateData?.currentRate || 85;

  // Handle dynamic defaults based on settings
  useEffect(() => {
    if (paymentSettings?.settings) {
      if (paymentSettings.settings.upiEnabled) {
        setPaymentMethod('UPI');
      } else if (paymentSettings.settings.bankEnabled) {
        setPaymentMethod('NETBANKING');
      }
    }
    return () => sessionStorage.removeItem('prefillDepositAmount');
  }, [paymentSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !utr) return;
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('currency', currency);
      formData.append('paymentMethod', paymentMethod);
      formData.append('utr', utr);
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      await api.post('/api/deposits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsSuccess(true);
      setAmount('');
      setCurrency('USD');
      setUtr('');
      setScreenshotFile(null);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Deposit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSettings) {
    return <div className="text-center py-20 text-lb-text-muted">Loading settings...</div>;
  }

  const settings = paymentSettings?.settings || {};
  const isAllDisabled = !settings.upiEnabled && !settings.bankEnabled;

  if (isAllDisabled) {
    return (
      <div className="bg-lb-panel border border-lb-border rounded-2xl p-6 shadow-2xl relative overflow-hidden max-w-lg w-full mx-auto mt-16 md:mt-0 pt-24 md:pt-6 text-center">
        <h2 className="text-xl font-bold text-lb-text">Deposits are currently disabled</h2>
        <p className="text-lb-text-muted mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  return (
    <div className="bg-lb-panel border border-lb-border rounded-2xl p-6 shadow-2xl relative overflow-hidden max-w-lg w-full mx-auto mt-16 md:mt-0 pt-24 md:pt-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-lb-accent/10 blur-3xl rounded-full"></div>
      
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-black text-lb-text tracking-tight">Premium Deposit Portal</h2>
        <p className="text-lb-text-muted text-sm mt-1 max-w-xl mx-auto">Choose your preferred method, upload your UTR and screenshot, and send the request for admin approval.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mb-8 relative z-10">
        <div className="bg-lb-panel border border-lb-border rounded-3xl p-6 shadow-2xl">
          <div className="mb-6 p-5 rounded-3xl border border-lb-border bg-lb-bg/90">
            <p className="text-xs uppercase tracking-[0.3em] text-lb-text-muted font-semibold">Current Wallet Balance</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-lb-text">${wallet?.balance?.toFixed(2) ?? '0.00'}</p>
                <p className="text-[10px] text-lb-text-muted mt-1 font-bold">≈ ₹{((wallet?.balance || 0) * currentRate).toFixed(2)}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-lb-text-muted font-semibold mt-1">Available balance</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-lb-accent">${wallet?.equity?.toFixed(2) ?? '0.00'}</p>
                <p className="text-[10px] text-lb-text-muted mt-1 font-bold">≈ ₹{((wallet?.equity || 0) * currentRate).toFixed(2)}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-lb-text-muted font-semibold mt-1">Equity</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-lb-accent font-semibold">Payment method</p>
              <p className="text-lb-text text-sm mt-1">Select how you want to fund your account.</p>
            </div>
            <div className="inline-flex rounded-full border border-lb-border bg-lb-bg/70 p-1">
              {settings.upiEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition ${paymentMethod === 'UPI' ? 'bg-lb-accent/100 text-lb-text shadow-lg shadow-lb-accent/20' : 'text-lb-text-muted hover:text-lb-text'}`}
                >
                  UPI
                </button>
              )}
              {settings.bankEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition ${paymentMethod === 'NETBANKING' ? 'bg-lb-accent/100 text-lb-text shadow-lg shadow-lb-accent/20' : 'text-lb-text-muted hover:text-lb-text'}`}
                >
                  Netbanking
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-lb-border bg-lb-bg/90 p-6 space-y-5">
            {paymentMethod === 'UPI' && settings.upiEnabled && (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-5 bg-white rounded-3xl shadow-xl">
                    {settings.qrImage ? (
                      <img src={`${api.defaults.baseURL?.replace('/api', '')}${settings.qrImage}`} alt="UPI QR" className="h-36 w-36 object-contain" />
                    ) : settings.qrCodeUrl ? (
                      <img src={settings.qrCodeUrl} alt="UPI QR" className="h-36 w-36 object-contain" />
                    ) : (
                      <QrCode className="w-36 h-36 text-slate-200" />
                    )}
                  </div>
                  <p className="text-sm text-lb-text-muted">Scan this QR code to pay using UPI.</p>
                  
                  {settings.merchantName && (
                    <div className="text-center">
                      <p className="text-xs text-lb-text-muted uppercase tracking-wider">Merchant</p>
                      <p className="font-semibold text-lb-text">{settings.merchantName}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => settings.upiId && navigator.clipboard.writeText(settings.upiId)}
                    className="inline-flex items-center gap-2 rounded-full bg-lb-panel border border-lb-border px-4 py-2 text-sm text-lb-text hover:border-lb-accent hover:text-lb-text transition"
                  >
                    <span>{settings.upiId || 'Not configured'}</span>
                    <Copy className="w-4 h-4 text-lb-text-muted" />
                  </button>
                </div>
              </>
            )}

            {paymentMethod === 'NETBANKING' && settings.bankEnabled && (
              <div className="space-y-4 text-slate-100">
                <div className="flex items-center gap-3 text-lb-text font-semibold uppercase tracking-[0.18em] text-xs">
                  <Building2 className="w-4 h-4 text-lb-accent" />
                  Bank transfer details
                </div>
                <div className="grid gap-3 text-sm text-lb-text">
                  <div className="rounded-2xl bg-lb-panel border border-lb-border p-4">
                    <p className="text-lb-text-muted text-xs uppercase tracking-[0.2em]">Account holder</p>
                    <p className="mt-1 text-lb-text font-semibold">{settings.accountHolder || 'Not configured'}</p>
                  </div>
                  <div className="rounded-2xl bg-lb-panel border border-lb-border p-4">
                    <p className="text-lb-text-muted text-xs uppercase tracking-[0.2em]">Bank name</p>
                    <p className="mt-1 text-lb-text font-semibold">{settings.bankName || 'Not configured'}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-lb-panel border border-lb-border p-4">
                      <p className="text-lb-text-muted text-xs uppercase tracking-[0.2em]">Account number</p>
                      <p className="mt-1 text-lb-text font-semibold">{settings.accountNumber || settings.bankAccount || 'Not configured'}</p>
                    </div>
                    <div className="rounded-2xl bg-lb-panel border border-lb-border p-4">
                      <p className="text-lb-text-muted text-xs uppercase tracking-[0.2em]">IFSC</p>
                      <p className="mt-1 text-lb-text font-semibold">{settings.ifsc || settings.ifscCode || 'Not configured'}</p>
                    </div>
                  </div>
                  {settings.branch && (
                    <div className="rounded-2xl bg-lb-panel border border-lb-border p-4">
                      <p className="text-lb-text-muted text-xs uppercase tracking-[0.2em]">Branch</p>
                      <p className="mt-1 text-lb-text font-semibold">{settings.branch}</p>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-lb-border bg-lb-panel p-4 text-lb-text-muted text-sm">
                  Transfer using your netbanking app and paste the UTR/transaction reference below.
                </div>
              </div>
            )}
            
            {settings.instructions && (
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm flex gap-3">
                <Info className="w-5 h-5 shrink-0" />
                <p>{settings.instructions}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-lb-panel border border-lb-border rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-2xl bg-lb-accent/10 text-lb-accent p-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-lb-text-muted font-semibold">Secure transfer</p>
              <p className="text-lb-text font-semibold">Your deposit request is sent to admin review.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-lb-bg border border-lb-border rounded-2xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/30 transition-all"
              >
                {depositCurrencies.map((item) => (
                  <option key={item.value} value={item.value} className="bg-lb-panel text-lb-text">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Amount</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-lb-bg border border-lb-border rounded-2xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/30 transition-all font-mono"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">UTR / Reference Number</label>
              <input
                type="text"
                required
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full bg-lb-bg border border-lb-border rounded-2xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/30 transition-all font-mono"
                placeholder="Enter transfer reference"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Payment Screenshot (Optional)</label>
              <div className="relative border border-lb-border bg-lb-bg rounded-2xl p-4 text-center cursor-pointer hover:border-lb-accent transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="mx-auto w-6 h-6 text-lb-text-muted mb-2" />
                <p className="text-xs text-lb-text font-medium">
                  {screenshotFile ? screenshotFile.name : 'Click or drag to upload screenshot'}
                </p>
                <p className="text-[10px] text-lb-text-muted mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

           
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm text-center">
          {errorMsg}
        </div>
      )}

      {isSuccess && (
        <div className="mb-6 p-4 bg-lb-accent/10 border border-lb-accent/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-lb-accent" />
          <div>
            <p className="text-lb-accent font-bold text-sm">Deposit Request Submitted</p>
            <p className="text-lb-accent/70 text-xs mt-0.5">Your funds will reflect shortly after verification.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-gradient-to-r from-lb-accent via-lb-accent/80 to-lb-accent py-4 text-sm font-black text-lb-bg hover:brightness-110 transition shadow-2xl shadow-lb-accent/20 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Confirm Deposit'}
        </button>
      </form>
    </div>
  );
}

