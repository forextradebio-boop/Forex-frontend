import React, { useState } from 'react';
import { useCreateWithdrawal } from '../hooks/useWithdrawals';
import { useKyc } from '../hooks/useKyc';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WithdrawScreenProps {
  wallet?: {
    balance?: number;
    freeMargin?: number;
  };
}

export default function WithdrawScreen({ wallet }: WithdrawScreenProps) {
  const { data: kyc } = useKyc();
  const withdrawMutation = useCreateWithdrawal();
  
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR'>('USD');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBalance = wallet?.freeMargin || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (numAmount > availableBalance) {
      setError('Insufficient balance available for withdrawal.');
      return;
    }
    if (!kyc?.accountNumber || !kyc?.ifscCode || !kyc?.bankName || !kyc?.accountHolderName) {
      setError('Your withdrawal payout details are missing. Complete KYC first.');
      return;
    }
    
    withdrawMutation.mutate(
      {
        amount: numAmount,
        currency,
        method: 'BANK',
        bankDetails: {
          accountHolderName: kyc.accountHolderName,
          bankName: kyc.bankName,
          accountNumber: kyc.accountNumber,
          ifscCode: kyc.ifscCode,
        }
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setAmount('');
          setTimeout(() => setIsSuccess(false), 5000);
        },
        onError: (err: any) => {
          setError(err.response?.data?.error || 'Withdrawal failed');
        }
      }
    );
  };

  return (
    <div className="bg-lb-panel border border-lb-border rounded-2xl p-6 shadow-2xl relative overflow-hidden max-w-lg w-full mx-auto">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
      
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-2xl font-black text-lb-text">Withdraw Funds</h2>
        <p className="text-lb-text-muted text-sm mt-1">Transfer equity securely to your registered bank account.</p>
      </div>

      <div className="bg-lb-bg/50 border border-lb-border/50 rounded-2xl p-6 mb-8 relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-4 border-b border-lb-border/50">
          <div className="text-xs text-lb-text-muted font-bold uppercase tracking-widest">Account Balance</div>
          <div className="text-lg font-black text-lb-text flex items-baseline gap-1">
            <span className="text-lb-text-muted text-sm">$</span>
            {(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-purple-400 font-bold uppercase tracking-widest">Free Margin (Available)</div>
          <div className="text-2xl font-black text-lb-text flex items-baseline gap-1">
            <span className="text-purple-500 text-lg">$</span>
            {availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-lb-down/10 border border-lb-down/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-lb-down" />
          <p className="text-lb-down font-bold text-sm">{error}</p>
        </div>
      )}

      {isSuccess && (
        <div className="mb-6 p-4 bg-lb-accent/10 border border-lb-accent/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-lb-accent" />
          <div>
            <p className="text-lb-accent font-bold text-sm">Withdrawal Requested</p>
            <p className="text-lb-accent/70 text-xs mt-0.5">Your funds have been deducted and are being processed.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-3 bg-lb-bg/70 border border-lb-border rounded-3xl p-4">
          <div className="text-xs text-lb-text-muted uppercase tracking-[0.2em] font-bold">Saved Withdrawal Payout</div>
          <div className="grid gap-2 text-sm text-lb-text">
            <div className="flex justify-between items-center text-lb-text">
              <span>Account Holder</span>
              <strong>{kyc?.accountHolderName || 'Not configured'}</strong>
            </div>
            <div className="flex justify-between items-center text-lb-text">
              <span>Bank</span>
              <strong>{kyc?.bankName || 'Not configured'}</strong>
            </div>
            <div className="flex justify-between items-center text-lb-text">
              <span>Account No.</span>
              <strong>{kyc?.accountNumber || 'Not configured'}</strong>
            </div>
            <div className="flex justify-between items-center text-lb-text">
              <span>IFSC</span>
              <strong>{kyc?.ifscCode || 'Not configured'}</strong>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'INR' | 'EUR')} className="w-full bg-lb-bg border border-lb-border rounded-xl px-3 py-3 text-sm text-lb-text focus:outline-none">
            <option value="USD">USD - US Dollar</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Withdrawal Amount</label>
          <input 
            type="number" 
            min="1"
            max={availableBalance}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-4 text-lg text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 transition-all font-mono text-center"
            placeholder="0.00"
          />
        </div>
      </div>

      <button 
        type="button"
        onClick={() => setAmount(availableBalance.toString())}
        className="w-full py-2 bg-lb-bg hover:bg-lb-panel-hover border border-lb-border text-lb-text-muted font-bold text-xs rounded-lg transition-colors"
      >
        Withdraw Max Amount
      </button>

      <button 
        type="submit"
        disabled={withdrawMutation.isPending || availableBalance <= 0 || Number(amount) > availableBalance}
        className="w-full mt-4 bg-lb-accent hover:bg-lb-accent/90 disabled:opacity-50 text-lb-bg font-black py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]"
      >
        <Upload className="w-5 h-5" />
        {withdrawMutation.isPending ? 'Processing...' : 'Confirm Withdrawal'}
      </button>
      </form>
    </div>
  );
}

