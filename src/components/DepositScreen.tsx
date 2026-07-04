import React, { useState } from 'react';
import { useCreateDeposit } from '../hooks/useDeposits';
import { usePaymentSettings } from '../hooks/usePaymentSettings';
import { useWallet } from '../hooks/useWallet';
import { QrCode, UploadCloud, CheckCircle2, Copy, Building2, ArrowRight, ShieldCheck } from 'lucide-react';

const depositCurrencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'USDT', label: 'USDT - Tether' },
];

const paymentMethods = [
  { value: 'UPI', label: 'UPI' },
  { value: 'NETBANKING', label: 'Netbanking' },
];

export default function DepositScreen() {
  const depositMutation = useCreateDeposit();
  const { data: paymentSettings, isLoading: loadingSettings } = usePaymentSettings();
  const { data: wallet } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NETBANKING'>('UPI');
  const [utr, setUtr] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !utr) return;
    
    depositMutation.mutate(
      { amount: Number(amount), currency, paymentMethod, utr, screenshot },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setAmount('');
          setCurrency('USD');
          setPaymentMethod('UPI');
          setUtr('');
          setScreenshot('');
          setTimeout(() => setIsSuccess(false), 5000);
        }
      }
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden max-w-lg w-full mx-auto mt-16 md:mt-0 pt-24 md:pt-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
      
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-black text-white tracking-tight">Premium Deposit Portal</h2>
        <p className="text-zinc-400 text-sm mt-1 max-w-xl mx-auto">Choose UPI or Netbanking, upload your UTR and screenshot, and send the request for admin approval.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mb-8 relative z-10">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="mb-6 p-5 rounded-3xl border border-slate-800 bg-slate-900/90">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">Current Wallet Balance</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-white">${wallet?.balance?.toFixed(2) ?? '0.00'}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold mt-1">Available balance</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-teal-400">${wallet?.equity?.toFixed(2) ?? '0.00'}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold mt-1">Equity</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300 font-semibold">Payment method</p>
              <p className="text-white text-sm mt-1">Select how you want to fund your account.</p>
            </div>
            <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/70 p-1">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as 'UPI' | 'NETBANKING')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition ${paymentMethod === method.value ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-5">
            {paymentMethod === 'UPI' ? (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-5 bg-white rounded-3xl shadow-xl">
                    {paymentSettings?.settings?.qrCodeUrl ? (
                      <img src={paymentSettings.settings.qrCodeUrl} alt="UPI QR" className="h-36 w-36 object-contain" />
                    ) : (
                      <QrCode className="w-36 h-36 text-slate-900" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">Scan this QR code to pay using UPI.</p>
                    <button
                    type="button"
                    onClick={() => paymentSettings?.settings?.upiId && navigator.clipboard.writeText(paymentSettings.settings.upiId)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-blue-500 hover:text-white transition"
                  >
                    <span>{paymentSettings?.settings?.upiId || 'Not configured'}</span>
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-slate-100">
                <div className="flex items-center gap-3 text-slate-300 font-semibold uppercase tracking-[0.18em] text-xs">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Bank transfer details
                </div>
                <div className="grid gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Account holder</p>
                    <p className="mt-1 text-white font-semibold">{paymentSettings?.settings?.accountHolder || 'Not configured'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Bank name</p>
                    <p className="mt-1 text-white font-semibold">{paymentSettings?.settings?.bankName || 'Not configured'}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                      <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Account number</p>
                      <p className="mt-1 text-white font-semibold">{paymentSettings?.settings?.bankAccount || 'Not configured'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                      <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">IFSC</p>
                      <p className="mt-1 text-white font-semibold">{paymentSettings?.settings?.ifscCode || 'Not configured'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400 text-sm">
                  Transfer using your netbanking app and paste the UTR/transaction reference below. The admin will verify the transaction before crediting your wallet.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-2xl bg-blue-500/10 text-blue-300 p-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Secure transfer</p>
              <p className="text-white font-semibold">Your deposit request is sent to admin review.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                {depositCurrencies.map((item) => (
                  <option key={item.value} value={item.value} className="bg-slate-950 text-white">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UTR / Reference Number</label>
              <input
                type="text"
                required
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                placeholder="Enter transfer reference"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Screenshot (optional)</label>
              <div className="relative">
                <UploadCloud className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={screenshot}
                  onChange={(e) => setScreenshot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                  placeholder="https://image-url..."
                />
              </div>
            </div>

           
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-teal-400" />
          <div>
            <p className="text-teal-400 font-bold text-sm">Deposit Request Submitted</p>
            <p className="text-teal-400/70 text-xs mt-0.5">Your funds will reflect shortly after verification.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <button 
          type="submit"
          disabled={depositMutation.isPending}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-teal-400 py-4 text-sm font-black text-slate-950 hover:brightness-110 transition shadow-2xl shadow-cyan-500/20"
        >
          {depositMutation.isPending ? 'Submitting...' : 'Confirm Deposit'}
        </button>
      </form>
    </div>
  );
}
