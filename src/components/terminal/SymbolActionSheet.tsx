import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  Star, 
  FileText, 
  Activity, 
  Settings, 
  Copy, 
  X
} from 'lucide-react';
import { SymbolData } from '../../types';

interface SymbolActionSheetProps {
  visible: boolean;
  symbol: SymbolData | null;
  isFavorite: boolean;
  onClose: () => void;
  onOpenChart: (symbolObj: SymbolData) => void;
  onNewOrder: (symbolObj: SymbolData) => void;
  onFavoriteToggle: (symbolObj: SymbolData) => void;
}

export const SymbolActionSheet: React.FC<SymbolActionSheetProps> = ({
  visible,
  symbol,
  isFavorite,
  onClose,
  onOpenChart,
  onNewOrder,
  onFavoriteToggle
}) => {
  const [modalType, setModalType] = useState<'DETAILS' | 'SPECS' | 'STATS' | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Close when pressing Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [visible, onClose]);

  // Disable body scroll when open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setModalType(null); // reset modals when closing sheet
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible || !symbol) return null;

  const rawSymbol = symbol.symbol.replace('/', '');
  
  // Format helpers
  const formatPrice = (p?: number) => p != null ? p.toFixed(5) : '-';
  
  // Spread calculation
  let spread = '-';
  if (symbol.spread != null) {
      spread = symbol.spread.toFixed(1);
  } else if (symbol.ask != null && symbol.bid != null) {
      spread = (symbol.ask - symbol.bid).toFixed(5);
  }

  const getSymbolSubtitle = (sym: string) => {
    const currencyNames: Record<string, string> = {
      USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen', 
      AUD: 'Australian Dollar', CAD: 'Canadian Dollar', CHF: 'Swiss Franc', NZD: 'New Zealand Dollar',
    };
    const base = sym.slice(0, 3);
    const quote = sym.slice(3);
    const baseName = ({ XAUUSD: 'Gold', XAGUSD: 'Silver', BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum' } as Record<string, string>)[sym] || currencyNames[base] || base;
    const quoteName = currencyNames[quote] || quote;
    return `${baseName} vs ${quoteName}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSymbol);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1500);
  };

  const handleAction = (action: () => void) => {
    action();
  };

  // Generic Modal Renderer for internal popups
  const renderModal = () => {
    if (!modalType) return null;

    let title = '';
    let content = null;

    if (modalType === 'DETAILS') {
      title = 'Symbol Details';
      content = (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Symbol</span><span className="font-bold">{rawSymbol}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Description</span><span className="font-bold">{getSymbolSubtitle(rawSymbol)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Bid</span><span className="font-bold text-lb-down">{formatPrice(symbol.bid || symbol.price)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Ask</span><span className="font-bold text-lb-accent">{formatPrice(symbol.ask || symbol.price)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Spread</span><span className="font-bold">{spread}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">High</span><span className="font-bold">{formatPrice(symbol.high)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Low</span><span className="font-bold">{formatPrice(symbol.low)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Point Size</span><span className="font-bold">0.00001</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Digits</span><span className="font-bold">5</span></div>
          <div className="flex justify-between py-1"><span className="text-lb-text-muted">Trading Session</span><span className="font-bold">24/5</span></div>
        </div>
      );
    } else if (modalType === 'SPECS') {
      title = 'Contract Specifications';
      content = (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Contract Size</span><span className="font-bold">100,000</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Minimum Lot</span><span className="font-bold">0.01</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Maximum Lot</span><span className="font-bold">100.00</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Leverage</span><span className="font-bold">1:100</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Swap Long</span><span className="font-bold text-lb-down">-4.25</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Swap Short</span><span className="font-bold text-lb-accent">1.15</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Margin</span><span className="font-bold">1%</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Tick Size</span><span className="font-bold">0.00001</span></div>
          <div className="flex justify-between py-1"><span className="text-lb-text-muted">Tick Value</span><span className="font-bold">1.00 USD</span></div>
        </div>
      );
    } else if (modalType === 'STATS') {
      title = 'Market Statistics';
      content = (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Daily Change</span><span className={`font-bold ${symbol.changePercent && symbol.changePercent >= 0 ? 'text-lb-accent' : 'text-lb-down'}`}>{symbol.changePercent?.toFixed(2) || '0.00'}%</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Open</span><span className="font-bold">{formatPrice(symbol.price)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Previous Close</span><span className="font-bold">{formatPrice(symbol.price)}</span></div>
          <div className="flex justify-between py-1 border-b border-lb-border/50"><span className="text-lb-text-muted">Volume</span><span className="font-bold">{(Math.random() * 10000).toFixed(0)}</span></div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalType(null)} />
        <div className="bg-lb-panel w-full max-w-sm rounded-2xl border border-lb-border shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-lb-border bg-lb-bg/50">
            <h3 className="font-bold text-lg text-lb-text">{title}</h3>
            <button onClick={() => setModalType(null)} className="p-1 text-lb-text-muted hover:text-lb-text rounded-full hover:bg-lb-panel-hover transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-4 bg-lb-panel text-lb-text">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Bottom Sheet */}
        <div className="bg-lb-panel w-full rounded-t-[24px] border-t border-lb-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative z-10 flex flex-col overflow-hidden animate-slide-up pb-safe max-h-[85vh]">
          
          {/* Handle */}
          <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose} onTouchMove={(e) => {
              // Basic swipe down to close
              if (e.touches[0].clientY > window.innerHeight * 0.7) {
                  onClose();
              }
          }}>
            <div className="w-12 h-1.5 bg-lb-border rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 border-b border-lb-border text-center">
            <h2 className="text-2xl font-black text-lb-text tracking-wide">{rawSymbol}</h2>
            <p className="text-sm text-lb-text-muted font-medium mt-1">{getSymbolSubtitle(rawSymbol)}</p>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto px-2 py-2 text-lb-text no-scrollbar">
            
            <button 
              onClick={() => handleAction(() => { onNewOrder(symbol); onClose(); })}
              className="flex items-center w-full px-4 py-4 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-lb-accent/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-lb-accent" size={20} />
              </div>
              <span className="font-semibold text-[16px]">New Order</span>
            </button>
            
            <button 
              onClick={() => handleAction(() => { onOpenChart(symbol); onClose(); })}
              className="flex items-center w-full px-4 py-4 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-lb-bg border border-lb-border flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <BarChart2 className="text-lb-text" size={20} />
              </div>
              <span className="font-semibold text-[16px]">Open Chart</span>
            </button>

            <button 
              onClick={() => handleAction(() => { onFavoriteToggle(symbol); })}
              className="flex items-center w-full px-4 py-4 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-lb-bg border border-lb-border flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Star className={isFavorite ? "text-lb-accent fill-lb-accent" : "text-lb-text-muted"} size={20} />
              </div>
              <span className="font-semibold text-[16px]">{isFavorite ? 'Remove Favorite' : 'Add Favorite'}</span>
            </button>

            <div className="my-1 border-b border-lb-border/50 mx-4" />

            <button 
              onClick={() => setModalType('DETAILS')}
              className="flex items-center w-full px-4 py-3.5 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <FileText className="text-lb-text-muted mr-5 ml-2" size={18} />
              <span className="font-medium text-[15px] text-lb-text/90">Symbol Details</span>
            </button>

            <button 
              onClick={() => setModalType('STATS')}
              className="flex items-center w-full px-4 py-3.5 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <Activity className="text-lb-text-muted mr-5 ml-2" size={18} />
              <span className="font-medium text-[15px] text-lb-text/90">Market Statistics</span>
            </button>

            <button 
              onClick={() => setModalType('SPECS')}
              className="flex items-center w-full px-4 py-3.5 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <Settings className="text-lb-text-muted mr-5 ml-2" size={18} />
              <span className="font-medium text-[15px] text-lb-text/90">Contract Specifications</span>
            </button>

            <button 
              onClick={handleCopy}
              className="flex items-center w-full px-4 py-3.5 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group"
            >
              <Copy className="text-lb-text-muted mr-5 ml-2" size={18} />
              <span className="font-medium text-[15px] text-lb-text/90">Copy Symbol</span>
            </button>

            <div className="my-1 border-b border-lb-border/50 mx-4" />

            <button 
              onClick={onClose}
              className="flex items-center w-full px-4 py-4 rounded-xl hover:bg-lb-panel-hover active:bg-lb-panel-hover/70 transition-colors group text-lb-down"
            >
              <X className="text-lb-down mr-5 ml-2" size={20} />
              <span className="font-semibold text-[16px]">Cancel</span>
            </button>

          </div>
        </div>
      </div>
      
      {renderModal()}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] bg-lb-bg border border-lb-border text-lb-text px-4 py-2 rounded-full shadow-lg font-semibold animate-in fade-in slide-in-from-bottom-4">
          {rawSymbol} copied.
        </div>
      )}
    </>
  );
};
