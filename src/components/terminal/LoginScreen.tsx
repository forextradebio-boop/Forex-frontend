import React, { useState } from 'react';
import { ArrowLeft, User, Lock, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onBack?: () => void;
  onLoginSuccess: () => void;
  onSubmit: (username: string, password: string) => Promise<void>;
  onRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onLoginSuccess, onSubmit, onRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(identifier, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-[110] flex flex-col animate-in slide-in-from-right font-sans">
      <div className="flex items-center p-4 bg-white shadow-sm shrink-0">
        {onBack ? (
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-600 active:bg-slate-100 rounded-full transition-colors -ml-2">
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
        <h1 className="text-xl font-bold text-slate-800 ml-2">Login</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          
          <div className="text-center mb-2">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-[15px] mt-1">Sign in to your trading account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-[17px] shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          {onRegister && (
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={onRegister}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Register
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
