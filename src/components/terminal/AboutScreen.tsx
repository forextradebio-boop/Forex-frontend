import React from 'react';
import { Info, Shield, Server, ArrowRight } from 'lucide-react';

export const AboutScreen: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-lb-bg text-lb-text p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* App Info Header */}
        <div className="bg-lb-panel border border-lb-border rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-lb-accent to-transparent opacity-50"></div>
          
          <div className="w-20 h-20 rounded-full bg-lb-accent/10 border border-lb-accent/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(20,184,166,0.15)]">
            <span className="text-3xl font-black text-lb-accent tracking-tighter">AT</span>
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-wide">Antigravity Trader</h2>
          <p className="text-lb-text-muted mt-1 font-mono text-sm">Version 1.0.0-beta</p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-lb-bg border border-lb-border rounded-full text-xs font-bold text-lb-accent">React 18</span>
            <span className="px-3 py-1 bg-lb-bg border border-lb-border rounded-full text-xs font-bold text-lb-accent">TailwindCSS</span>
            <span className="px-3 py-1 bg-lb-bg border border-lb-border rounded-full text-xs font-bold text-lb-accent">TypeScript</span>
          </div>
        </div>

        {/* Features & Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-lb-panel border border-lb-border rounded-2xl p-5 hover:border-lb-accent/30 transition-colors duration-300 group">
            <Shield className="w-8 h-8 text-lb-accent mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg text-white mb-2">Secure Trading</h3>
            <p className="text-sm text-lb-text-muted leading-relaxed">
              State-of-the-art encryption protecting your financial data and executing trades with maximum security compliance.
            </p>
          </div>
          
          <div className="bg-lb-panel border border-lb-border rounded-2xl p-5 hover:border-lb-accent/30 transition-colors duration-300 group">
            <Server className="w-8 h-8 text-lb-accent mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg text-white mb-2">Low Latency Servers</h3>
            <p className="text-sm text-lb-text-muted leading-relaxed">
              Global server infrastructure providing lightning-fast execution and real-time market data streaming.
            </p>
          </div>
        </div>

        {/* Legal & Links */}
        <div className="bg-lb-panel border border-lb-border rounded-2xl p-2">
          <a href="#" className="flex items-center justify-between p-4 hover:bg-lb-bg rounded-xl transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
              <span className="font-semibold text-lb-text group-hover:text-white transition-colors">Terms of Service</span>
            </div>
            <ArrowRight className="w-4 h-4 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
          </a>
          <a href="#" className="flex items-center justify-between p-4 hover:bg-lb-bg rounded-xl transition-colors group cursor-pointer border-t border-lb-border/50">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
              <span className="font-semibold text-lb-text group-hover:text-white transition-colors">Privacy Policy</span>
            </div>
            <ArrowRight className="w-4 h-4 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
          </a>
          <a href="#" className="flex items-center justify-between p-4 hover:bg-lb-bg rounded-xl transition-colors group cursor-pointer border-t border-lb-border/50">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
              <span className="font-semibold text-lb-text group-hover:text-white transition-colors">Licenses & Attributions</span>
            </div>
            <ArrowRight className="w-4 h-4 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
          </a>
        </div>
        
        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs font-mono text-lb-text-muted opacity-50">
            © {new Date().getFullYear()} Antigravity Trading Inc.<br/>
            All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};
