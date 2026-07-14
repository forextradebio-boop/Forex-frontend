import React from 'react';
import { User, Activity, BookOpen, Mail, Book, Calendar, Users, TrendingUp, HelpCircle, Info, ChevronRight, X, LogOut, Download, Upload, RefreshCw, Power, Sun, Moon, Settings, Bell, Globe } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { useTheme } from '../../theme';

export type WalletSubTab = 'dashboard' | 'deposit' | 'withdraw' | 'transactions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onNavigateWallet?: (tab: WalletSubTab) => void;
  onNavigateProfile?: () => void;
  onNavigateNews: () => void;
  onNavigateCalendar?: () => void;
  onNavigateAbout?: () => void;
  userProfile?: {
    id: string;
    username: string;
    email?: string;
  } | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onGetStarted, onNavigateWallet, onNavigateProfile, onNavigateNews, onNavigateCalendar, onNavigateAbout, userProfile, onLogout }) => {
  const { marketEnabled, toggleMarket } = useMarket();
  const { themeMode, setThemeMode } = useTheme();

  if (!isOpen) return null;

  const isAuthenticated = !!userProfile;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-4/5 max-w-[320px] bg-lb-bg text-lb-text h-full flex flex-col shadow-2xl animate-in slide-in-from-left">
        
        {/* Header Section */}
        <div className="p-6 pb-8 border-b border-lb-border flex flex-col gap-4 bg-lb-panel shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-lb-accent/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-lb-accent/10 border border-lb-accent/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                <User className="text-lb-accent w-6 h-6" />
                {isAuthenticated && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-lb-accent rounded-full border-2 border-lb-panel shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-pulse"></div>}
              </div>
              <div className="flex flex-col">
                {isAuthenticated ? (
                  <>
                    <span className="text-[12px] font-bold text-lb-text-muted uppercase tracking-widest">Account</span>
                    <span className="text-[16px] font-black text-lb-text">{userProfile.username}</span>
                  </>
                ) : (
                  <span className="text-[15px] font-bold leading-tight text-lb-text/90">Login to existing<br/>account or open demo</span>
                )}
              </div>
            </div>
          </div>
          {isAuthenticated ? (
            <button 
              onClick={() => { onClose(); onLogout?.(); }}
              className="relative z-10 bg-lb-down/10 border border-lb-down/30 hover:bg-lb-down hover:text-white text-lb-down font-bold py-2 px-6 rounded-xl w-max text-sm mt-2 transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <button 
              onClick={() => { onClose(); onGetStarted(); }}
              className="relative z-10 bg-lb-accent hover:bg-lb-accent/80 text-lb-bg font-black py-2.5 px-8 rounded-xl w-max text-sm mt-2 transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] hover:scale-105 active:scale-95"
            >
              Get started
            </button>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col px-2 gap-0.5">
            {/* Market Status Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-lb-accent/10 active:bg-lb-accent/20 rounded-xl transition-all duration-300 w-full group mb-2 border border-lb-border/50 bg-lb-bg/50">
              <div className="flex items-center gap-4">
                <div className={`transition-colors duration-300 ${marketEnabled ? 'text-lb-accent' : 'text-lb-down'}`}>
                  <Power size={20} />
                </div>
                <span className="text-[14px] font-bold text-lb-text/80 group-hover:text-lb-text transition-all duration-300">Market Status</span>
              </div>
              <button 
                onClick={toggleMarket}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${marketEnabled ? 'bg-lb-accent' : 'bg-lb-border'}`}
              >
                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${marketEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <MenuItem icon={<Activity size={20} />} label="Trade" onClick={() => console.log('Trade clicked')} />
            <MenuItem icon={<BookOpen size={20} />} label="News" onClick={() => { onClose(); onNavigateNews?.(); }} />
            <MenuItem icon={<Download size={20} />} label="Deposit" onClick={() => { onClose(); onNavigateWallet?.('deposit'); }} />
            <MenuItem icon={<Upload size={20} />} label="Withdraw" onClick={() => { onClose(); onNavigateWallet?.('withdraw'); }} />
            <MenuItem icon={<RefreshCw size={20} />} label="Currency Converter" onClick={() => { onClose(); onNavigateWallet?.('dashboard'); }} />
            <MenuItem icon={<User size={20} />} label="Profile" onClick={() => { onClose(); onNavigateProfile?.(); }} />
            <MenuItem icon={<Calendar size={20} />} label="Economic calendar" isAds onClick={() => { onClose(); onNavigateCalendar?.(); }} />
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-lb-accent/10 active:bg-lb-accent/20 rounded-xl transition-all duration-300 w-full group my-1 border border-lb-border/50 bg-lb-bg/50">
              <div className="flex items-center gap-4">
                <div className="text-lb-accent transition-colors duration-300">
                  {themeMode === 'white' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <span className="text-[14px] font-bold text-lb-text/80 group-hover:text-lb-text transition-all duration-300">
                  {themeMode === 'white' ? 'Light Theme' : 'Dark Theme'}
                </span>
              </div>
              <button 
                onClick={() => setThemeMode(themeMode === 'white' ? 'navy' : 'white')}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${themeMode === 'navy' ? 'bg-lb-accent' : 'bg-lb-border'}`}
              >
                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${themeMode === 'navy' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* <MenuItem icon={<Globe size={20} />} label="Language" onClick={() => {}} />
            <MenuItem icon={<Bell size={20} />} label="Notifications" badge="3" onClick={() => {}} />
            <MenuItem icon={<Settings size={20} />} label="Settings" onClick={() => {}} />
            <MenuItem icon={<Info size={20} />} label="About" onClick={() => { onClose(); onNavigateAbout?.(); }} /> */}
          </div>
        </div>

      </div>
    </div>
  );
};

const MenuItem = ({ icon, label, badge, isAds, onClick }: { icon: React.ReactNode, label: string, badge?: string, isAds?: boolean, onClick?: () => void }) => (
  <button 
    type="button"
    onClick={onClick}
    className="flex items-center justify-between px-4 py-3.5 hover:bg-lb-accent/10 active:bg-lb-accent/20 rounded-xl transition-all duration-300 text-left w-full group cursor-pointer hover:shadow-[0_0_15px_rgba(20,184,166,0.05)] hover:scale-[1.02] active:scale-95 border border-transparent hover:border-lb-accent/20 relative overflow-hidden"
  >
    {/* Left accent bar on hover */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-lb-accent rounded-r-full transition-all duration-300 group-hover:h-1/2"></div>
    
    <div className="flex items-center gap-4">
      <div className="text-lb-text-muted group-hover:text-lb-accent transition-colors duration-300">
        {icon}
      </div>
      <span className="text-[14px] font-bold text-lb-text/80 group-hover:text-lb-text group-hover:tracking-wide transition-all duration-300">{label}</span>
    </div>
    <div className="flex gap-2 items-center">
      {isAds && <span className="text-[9px] font-black text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.2)]">Premium</span>}
      {badge && <span className="bg-lb-accent text-lb-bg text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(20,184,166,0.4)]">{badge}</span>}
    </div>
  </button>
);
