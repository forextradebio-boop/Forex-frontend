import React, { useState } from 'react';
import { ArrowLeft, User, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onBack?: () => void;
  onLoginSuccess: () => void;
  onSubmit: (username: string, password: string) => Promise<void>;
  onRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onLoginSuccess, onSubmit, onRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 bg-lb-bg z-[110] flex flex-col animate-in slide-in-from-right font-sans">
      <div className="flex items-center p-4 bg-lb-panel shadow-sm shrink-0">
        {onBack ? (
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-lb-text-muted active:bg-lb-panel-hover rounded-full transition-colors -ml-2">
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
        <h1 className="text-xl font-bold text-lb-text ml-2">Login</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        <div className="bg-lb-panel rounded-3xl p-6 shadow-xl shadow-black/5 flex flex-col gap-6">
          
          <div className="text-center mb-2">
            <div className="w-16 h-16 bg-lb-accent/10 text-lb-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-bold text-lb-text tracking-tight">Welcome Back</h2>
            <p className="text-lb-text-muted text-[15px] mt-1">Sign in to your trading account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-lb-text ml-1">Email / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lb-text-muted">
                  <User size={18} />
                </div>
                  <input 
                    type="text" 
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all font-medium placeholder:text-lb-text-muted/60"
                  />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-lb-text ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lb-text-muted">
                  <Lock size={18} />
                </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-2xl py-3.5 pl-11 pr-11 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all font-medium placeholder:text-lb-text-muted/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-lb-text-muted hover:text-lb-text"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
            </div>

            {error && <p className="text-sm text-lb-down font-medium">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-lb-accent hover:opacity-90 text-white font-bold py-4 rounded-2xl text-[17px] shadow-lg shadow-lb-accent/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          {onRegister && (
            <div className="mt-4 text-center">
              <p className="text-sm text-lb-text-muted">Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={onRegister}
                  className="font-semibold text-lb-accent hover:opacity-80"
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
