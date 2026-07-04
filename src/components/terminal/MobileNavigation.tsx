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
    <div className="md:hidden h-16 shrink-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 pb-safe">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-semibold ${isActive ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
