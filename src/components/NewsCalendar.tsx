/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, 
  Clock, 
  MapPin, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Briefcase,
  ChevronDown,
  Globe,
  X
} from "lucide-react";
import { MarketNews, EconomicEvent } from "../types";

interface NewsCalendarProps {
  news: MarketNews[];
  calendar: EconomicEvent[];
}

export default function NewsCalendar({ news, calendar }: NewsCalendarProps) {
  // Navigation tabs: News list vs Economic Timers
  const [newsCategory, setNewsCategory] = useState<"all" | "stocks" | "forex" | "crypto" | "global">("all");
  const [impactFilter, setImpactFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [selectedNews, setSelectedNews] = useState<MarketNews | null>(null);

  // Filters
  const filteredNews = news.filter(n => {
    return newsCategory === "all" || n.category === newsCategory;
  });

  const filteredCalendar = calendar.filter(ev => {
    const normalizedImpact = ev.impact?.toUpperCase?.() ?? 'LOW';
    return impactFilter === 'ALL' || normalizedImpact === impactFilter;
  });

  return (
    <div id="news-calendar" className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* head */}
        <div className="border-b border-zinc-800 pb-5 text-left space-y-1">
          <h1 className="text-xl font-black font-sans text-white">FINANCIAL INTELLIGENCE HUB</h1>
          <p className="text-xs text-zinc-500">Global market events, central bank calendars, and institutional micro-research desks.</p>
        </div>

        {/* Master Double-Column view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: breaking Financial news stories */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-805 border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-emerald-500" /> Direct Exchange Bulletins
              </h3>
              
              {/* Category selector row */}
              <div className="flex bg-zinc-900 p-1 rounded border border-zinc-800 text-[10px] uppercase font-bold shrink-0">
                {(["all", "stocks", "forex", "crypto", "global"] as const).map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setNewsCategory(cat)}
                    className={`px-2.5 py-1 rounded transition select-none cursor-pointer ${newsCategory === cat ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-zinc-250 hover:text-zinc-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stories Grid */}
            <div className="space-y-4">
              {filteredNews.map(story => (
                <div 
                  key={story.id}
                  onClick={() => setSelectedNews(story)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-teal-500/40 transition cursor-pointer text-left space-y-3"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold">
                    <span className="px-2 py-0.5 bg-slate-950 rounded uppercase tracking-wider text-teal-400 border border-slate-850">{story.category}</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(story.publishedAt).toLocaleTimeString()}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 hover:text-teal-400 transition leading-snug">{story.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed truncate max-w-full">{story.summary}</p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-sans border-t border-slate-950 pt-2.5">
                    <span>Source: <strong>{story.source}</strong></span>
                    <span className="text-teal-400 font-extrabold flex items-center">Read Articles <ChevronDown className="w-3 h-3 ml-1 transform -rotate-90" /></span>
                  </div>
                </div>
              ))}
              {filteredNews.length === 0 && (
                <div className="text-center py-20 text-slate-600 text-xs">No press updates published in this segment.</div>
              )}
            </div>
          </div>

          {/* Right Column: economic calendar events */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400 flex items-center">
                <Globe className="w-4 h-4 mr-1.5" /> Economic Events Calendar
              </h3>

              {/* Impact selector */}
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] uppercase font-bold shrink-0">
                {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map(imp => (
                  <button 
                    key={imp}
                    onClick={() => setImpactFilter(imp)}
                    className={`px-2 py-1 rounded transition select-none cursor-pointer ${impactFilter === imp ? 'bg-indigo-505 bg-indigo-500 text-white font-black' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {imp}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Events List */}
            <div className="space-y-3">
              {filteredCalendar.map(ev => {
                const normalizedImpact = ev.impact?.toUpperCase?.() ?? 'LOW';
                const isHigh = normalizedImpact === 'HIGH';
                const isMed = normalizedImpact === 'MEDIUM';

                return (
                  <div key={ev.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex justify-between items-center gap-4 text-left">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-white font-bold">{ev.time}</span>
                        <div className="inline-flex items-center px-1.5 py-0.2 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 font-bold leading-none uppercase">
                          <MapPin className="w-2.5 h-2.5 mr-1 text-slate-500" />
                          {ev.country} ({ev.currency})
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 font-sans font-bold leading-tight">{ev.event}</p>

                      <div className="grid grid-cols-3 gap-x-3 text-[10px] font-mono text-slate-500">
                        <p>Act: <span className="text-slate-200 font-bold">{ev.actual || "Pending"}</span></p>
                        <p>Fore: <span className="text-slate-450">{ev.forecast || "--"}</span></p>
                        <p>Prev: <span className="text-slate-450">{ev.previous || "--"}</span></p>
                      </div>
                    </div>

                    <span className={`px-2 py-1 rounded text-[9px] font-mono font-bold font-sans uppercase shrink-0 ${isHigh ? 'bg-rose-500/10 text-rose-455 text-rose-400 border border-rose-500/25' : isMed ? 'bg-amber-500/10 text-amber-550 text-amber-500' : 'bg-slate-950 text-slate-500'}`}>
                      {ev.impact}
                    </span>
                  </div>
                );
              })}
              {filteredCalendar.length === 0 && (
                <div className="text-center py-20 text-slate-600 text-xs">No Scheduled events match filters.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Article reading overlay modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative text-left">
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 bg-slate-950 p-2 rounded-full border border-slate-850 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-b border-slate-805 pb-3">
              <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-850 text-teal-400 font-bold uppercase">{selectedNews.category}</span>
              <span>Source: <strong>{selectedNews.source}</strong></span>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-black font-sans leading-snug text-white">{selectedNews.title}</h2>
              <p className="text-xs text-teal-400 font-mono italic bg-slate-950 p-3 rounded-xl border border-slate-850">"{selectedNews.summary}"</p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedNews.content}</p>
            </div>

            <div className="border-t border-slate-900 pt-4 text-center">
              <button 
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition border border-slate-850"
              >
                Close Article Reader
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
