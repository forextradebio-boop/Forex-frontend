import React from 'react';
import { User, Activity, BookOpen, Mail, Book, Calendar, Users, TrendingUp, HelpCircle, Info, ChevronRight, X, LogOut, Download, Upload } from 'lucide-react';

export type WalletSubTab = 'dashboard' | 'deposit' | 'withdraw' | 'transactions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onNavigateWallet?: (tab: WalletSubTab) => void;
  onNavigateProfile?: () => void;
  onNavigateNews: () => void;
  onNavigateCalendar?: () => void;
  userProfile?: {
    id: string;
    username: string;
    email?: string;
  } | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onGetStarted, onNavigateWallet, onNavigateProfile, onNavigateNews, onNavigateCalendar, userProfile, onLogout }) => {
  if (!isOpen) return null;

  const isAuthenticated = !!userProfile;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-4/5 max-w-[320px] bg-black text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left">
        
        {/* Header Section */}
        <div className="p-6 pb-8 border-b border-white/10 flex flex-col gap-4 bg-[#0a0a0a]">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center relative shadow-lg">
                <User className="text-white w-6 h-6" />
                {isAuthenticated && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black"></div>}
              </div>
              <div className="flex flex-col">
                {isAuthenticated ? (
                  <>
                    <span className="text-[13px] font-semibold text-white/70 uppercase tracking-wider">Account</span>
                    <span className="text-[15px] font-bold text-white">{userProfile.username}</span>
                  </>
                ) : (
                  <span className="text-[15px] font-medium leading-tight text-white/90">Login to existing<br/>account or open demo</span>
                )}
              </div>
            </div>
          </div>
          {isAuthenticated ? (
            <button 
              onClick={() => { onClose(); onLogout?.(); }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full w-max text-sm mt-2 transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <button 
              onClick={() => { onClose(); onGetStarted(); }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full w-max text-sm mt-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              Get started
            </button>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col px-2 gap-0.5">
            <MenuItem icon={<Activity size={20} />} label="Trade" onClick={() => console.log('Trade clicked')} />
            <MenuItem icon={<BookOpen size={20} />} label="News" onClick={() => { onClose(); onNavigateNews(); }} />
            <MenuItem icon={<Mail size={20} />} label="Mailbox" badge="8" onClick={() => console.log('Mailbox clicked')} />
            <MenuItem icon={<Book size={20} />} label="Journal" onClick={() => console.log('Journal clicked')} />
            <MenuItem icon={<Download size={20} />} label="Deposit" onClick={() => { onClose(); onNavigateWallet?.('deposit'); }} />
            <MenuItem icon={<Upload size={20} />} label="Withdraw" onClick={() => { onClose(); onNavigateWallet?.('withdraw'); }} />
            <MenuItem icon={<User size={20} />} label="Profile" onClick={() => { onClose(); onNavigateProfile?.(); }} />
            <MenuItem icon={<Calendar size={20} />} label="Economic calendar" isAds onClick={() => { onClose(); onNavigateCalendar?.(); }} />
            <MenuItem icon={<Users size={20} />} label="Traders Community" onClick={() => console.log('Traders Community clicked')} />
            <MenuItem icon={<TrendingUp size={20} />} label="MQL5 Algo Trading" onClick={() => console.log('MQL5 Algo Trading clicked')} />
            <MenuItem icon={<HelpCircle size={20} />} label="User guide" onClick={() => console.log('User guide clicked')} />
            <MenuItem icon={<Info size={20} />} label="About" onClick={() => console.log('About clicked')} />
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
    className="flex items-center justify-between px-4 py-3 hover:bg-white/10 active:bg-white/20 rounded-lg transition-all text-left w-full group cursor-pointer duration-200"
  >
    <div className="flex items-center gap-3">
      <div className="text-white/60 group-hover:text-white/80 transition-colors">
        {icon}
      </div>
      <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors">{label}</span>
    </div>
    <div className="flex gap-1.5 items-center">
      {isAds && <span className="text-[9px] font-bold text-orange-400 px-1.5 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10">Premium</span>}
      {badge && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{badge}</span>}
    </div>
  </button>
);
