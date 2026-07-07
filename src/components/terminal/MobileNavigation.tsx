import React from 'react';
import { ArrowUpDown, BarChart2, Briefcase, Clock, User } from 'lucide-react';

export type MobileTab = 'quotes' | 'chart' | 'trade' | 'history' | 'profile' | 'new_order';

interface MobileNavigationProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, setActiveTab }) => {
  
  const navItems: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'quotes', label: 'Quotes', icon: <ArrowUpDown className="w-5 h-5" /> },
    { id: 'chart', label: 'Chart', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'trade', label: 'Trade', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden h-[72px] shrink-0 bg-lb-panel/90 backdrop-blur-xl border-t border-lb-border flex items-center justify-around px-2 pb-safe relative z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-[20%] h-full gap-1.5 transition-all duration-400 group relative ${
              isActive ? 'text-lb-accent scale-105' : 'text-lb-text-muted hover:text-lb-text hover:-translate-y-1 active:scale-95'
            }`}
          >
            {/* Animated top indicator */}
            <div className={`absolute top-0 w-[40%] h-1 rounded-b-full bg-lb-accent shadow-[0_2px_10px_rgba(20,184,166,0.8)] transition-all duration-300 origin-top ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`} />

            <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-lb-accent/15 shadow-[0_0_20px_rgba(20,184,166,0.2)] scale-110' : 'bg-transparent group-hover:bg-lb-panel-hover'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'opacity-100 tracking-wider' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
