import React, { useState } from 'react';
import { ArrowLeft, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface RegisterScreenProps {
  onBack: () => void;
  onSubmit: (username: string, password: string, confirmPassword: string) => Promise<void>;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 4) {
      setError('Username must be at least 4 characters');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(username, password, confirmPassword);
    } catch (err: any) {
      const serverMessage = err?.response?.data?.error || err?.message;
      setError(serverMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-[110] flex flex-col animate-in slide-in-from-right font-sans">
      <div className="flex items-center p-4 bg-lb-text shadow-sm shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-600 active:bg-slate-100 rounded-full transition-colors -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 ml-2">Create Account</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        <div className="bg-lb-text rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          
          <div className="text-center mb-2">
            <div className="w-16 h-16 bg-blue-100 text-lb-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Register</h2>
            <p className="text-lb-text-muted text-[15px] mt-1">Set up your trading credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lb-text-muted">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter a username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-slate-800 focus:outline-none focus:border-lb-accent focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lb-text-muted">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Set your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-11 text-[15px] text-slate-800 focus:outline-none focus:border-lb-accent focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-lb-text-muted hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lb-text-muted">
                  <Lock size={18} />
                </div>
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-11 text-[15px] text-slate-800 focus:outline-none focus:border-lb-accent focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-lb-text-muted hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-lb-accent hover:bg-blue-700 text-lb-text font-bold py-4 rounded-2xl text-[17px] shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Registering...' : 'Continue to KYC'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
