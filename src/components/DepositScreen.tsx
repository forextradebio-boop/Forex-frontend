import React, { useState } from 'react';
import { useCreateDeposit } from '../hooks/useDeposits';
import { QrCode, UploadCloud, CheckCircle2, Copy } from 'lucide-react';

export default function DepositScreen() {
  const depositMutation = useCreateDeposit();
  const [amount, setAmount] = useState<string>('');
  const [utr, setUtr] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !utr) return;
    
    depositMutation.mutate(
      { amount: Number(amount), utr, screenshot },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setAmount('');
          setUtr('');
          setScreenshot('');
          setTimeout(() => setIsSuccess(false), 5000);
        }
      }
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden max-w-lg w-full mx-auto">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
      
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-2xl font-black text-white">Deposit Funds</h2>
        <p className="text-zinc-500 text-sm mt-1">Scan the QR code to transfer funds securely.</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 mb-8 relative z-10">
        <div className="p-4 bg-white rounded-2xl shadow-xl">
          <QrCode className="w-32 h-32 text-black" />
        </div>
        <div className="mt-4 flex items-center gap-2 bg-zinc-900 py-2 px-4 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700 transition" onClick={() => navigator.clipboard.writeText('demo@upi')}>
          <span className="text-zinc-300 font-mono text-sm tracking-wide">demo@upi</span>
          <Copy className="w-4 h-4 text-zinc-500" />
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
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Amount (USD)</label>
          <input 
            type="number" 
            min="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">UTR / Reference Number</label>
          <input 
            type="text" 
            required
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
            placeholder="12-digit transaction ID"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Payment Screenshot (Optional URL)</label>
          <div className="relative">
            <UploadCloud className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              value={screenshot}
              onChange={(e) => setScreenshot(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
              placeholder="https://image-url..."
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={depositMutation.isPending}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-black py-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
        >
          {depositMutation.isPending ? 'Submitting...' : 'Confirm Deposit'}
        </button>
      </form>
    </div>
  );
}
