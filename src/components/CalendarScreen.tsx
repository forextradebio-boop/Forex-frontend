import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Calendar as CalendarIcon,
  Bell,
  Clock,
  MapPin,
  AlertTriangle,
  X,
  Filter
} from 'lucide-react';
import { useEconomicCalendar } from '../hooks/useCalendar';
import { EconomicEvent } from '../types';

type DateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';
type ImpactFilter = 'ALL' | 'High' | 'Medium' | 'Low';

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
  EU: '🇪🇺',
  JP: '🇯🇵',
  CA: '🇨🇦',
  AU: '🇦🇺',
  CH: '🇨🇭',
  CN: '🇨🇳',
  NZ: '🇳🇿'
};

const getFlag = (countryCode: string) => FLAG_MAP[countryCode] || '🌍';

export default function CalendarScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useEconomicCalendar();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');

  // Modal & Notifications
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);
  const [reminders, setReminders] = useState<Record<string, number>>({});
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('baha_calendar_reminders');
    if (saved) {
      try { setReminders(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveReminder = (eventId: string, minutesBefore: number) => {
    const newReminders = { ...reminders, [eventId]: minutesBefore };
    setReminders(newReminders);
    localStorage.setItem('baha_calendar_reminders', JSON.stringify(newReminders));
    setShowToast(`Reminder set for ${minutesBefore} minutes before event.`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const clearReminder = (eventId: string) => {
    const newReminders = { ...reminders };
    delete newReminders[eventId];
    setReminders(newReminders);
    localStorage.setItem('baha_calendar_reminders', JSON.stringify(newReminders));
    setShowToast(`Reminder cleared.`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const allEvents = data?.calendar || [];

  // Derived state for filters
  const availableCountries = useMemo(() => {
    const countries = new Set(allEvents.map(e => e.country));
    return Array.from(countries).sort();
  }, [allEvents]);

  // Filtering Logic
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Day calculation helpers
    const getWeekBoundaries = () => {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    };

    const getMonthBoundaries = () => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    };

    return allEvents.filter(ev => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!ev.event.toLowerCase().includes(query) && !ev.country.toLowerCase().includes(query)) return false;
      }
      
      // Impact
      if (impactFilter !== 'ALL' && ev.impact !== impactFilter) return false;
      
      // Country
      if (countryFilter !== 'ALL' && ev.country !== countryFilter) return false;

      // Date
      if (dateFilter !== 'ALL') {
        const evDate = new Date(ev.date);
        const evDay = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());

        if (dateFilter === 'TODAY') {
          if (evDay.getTime() !== today.getTime()) return false;
        } else if (dateFilter === 'THIS_WEEK') {
          const { start, end } = getWeekBoundaries();
          if (evDay < start || evDay > end) return false;
        } else if (dateFilter === 'THIS_MONTH') {
          const { start, end } = getMonthBoundaries();
          if (evDay < start || evDay > end) return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents, searchQuery, impactFilter, countryFilter, dateFilter]);

  // Group by Date for display
  const groupedEvents = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {};
    filteredEvents.forEach(ev => {
      const d = new Date(ev.date);
      const dateKey = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  return (
    <div className="flex flex-col h-full bg-[#09090b] font-sans text-zinc-300 relative">
      
      {/* Toast */}
      {showToast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-500 text-black px-4 py-2 rounded shadow-lg font-bold text-sm animate-bounce">
          {showToast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-4 sticky top-0 z-10 space-y-4">
        
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Economic Calendar</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors w-48"
              />
            </div>
            <button 
              onClick={() => refetch()}
              className={`p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ${isFetching ? 'animate-spin text-indigo-400' : ''}`}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          
          <div className="flex bg-zinc-900 rounded p-1">
            {(['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1 rounded transition-colors ${
                  dateFilter === f ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-zinc-900 rounded p-1 border border-zinc-800">
            <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2" />
            <select 
              value={impactFilter} 
              onChange={e => setImpactFilter(e.target.value as ImpactFilter)}
              className="bg-transparent text-zinc-300 border-none outline-none text-xs font-bold py-1 px-2 cursor-pointer"
            >
              <option value="ALL">All Impacts</option>
              <option value="High">High Impact</option>
              <option value="Medium">Medium Impact</option>
              <option value="Low">Low Impact</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-900 rounded p-1 border border-zinc-800">
            <Globe className="w-3.5 h-3.5 text-zinc-500 ml-2" />
            <select 
              value={countryFilter} 
              onChange={e => setCountryFilter(e.target.value)}
              className="bg-transparent text-zinc-300 border-none outline-none text-xs font-bold py-1 px-2 cursor-pointer max-w-[120px]"
            >
              <option value="ALL">All Countries</option>
              {availableCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-5xl mx-auto w-full">
        
        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <div>
              <h3 className="text-rose-400 font-bold text-lg">Failed to load calendar</h3>
              <p className="text-zinc-400 text-sm mt-1">Please check your connection and try again.</p>
            </div>
            <button 
              onClick={() => refetch()}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded font-bold text-sm transition"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && !isError && (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-48 bg-zinc-900 rounded"></div>
                <div className="h-16 bg-zinc-900/50 rounded-xl border border-zinc-800"></div>
                <div className="h-16 bg-zinc-900/50 rounded-xl border border-zinc-800"></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-8">
            {Object.keys(groupedEvents).length > 0 ? (
              Object.keys(groupedEvents).map(dateKey => (
                <div key={dateKey} className="space-y-3">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest sticky top-[120px] bg-[#09090b] py-2 z-0 border-b border-zinc-800/50">
                    {dateKey}
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                      <tbody className="divide-y divide-zinc-800/50">
                        {groupedEvents[dateKey].map(ev => {
                          const dateObj = new Date(ev.date);
                          const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                          const hasReminder = !!reminders[ev.id];
                          
                          return (
                            <tr 
                              key={ev.id} 
                              onClick={() => setSelectedEvent(ev)}
                              className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                            >
                              <td className="p-4 w-24 text-zinc-400 font-bold">{timeStr}</td>
                              <td className="p-4 w-20">
                                <span className="text-lg" title={ev.country}>{getFlag(ev.country)}</span>
                                <span className="ml-2 text-xs text-zinc-500 font-bold">{ev.country}</span>
                              </td>
                              <td className="p-4 w-24">
                                <ImpactBadge impact={ev.impact} />
                              </td>
                              <td className="p-4 font-sans font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors truncate max-w-[300px]">
                                {ev.event}
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition"
                                >
                                  <Bell className={`w-4 h-4 ${hasReminder ? 'fill-indigo-400 text-indigo-400' : ''}`} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-zinc-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No economic events found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 md:p-8 space-y-6 relative text-left shadow-2xl">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 bg-zinc-900 p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-3 text-xs font-mono border-b border-zinc-800 pb-4">
              <span className="text-2xl">{getFlag(selectedEvent.country)}</span>
              <div>
                <div className="font-bold text-zinc-200">{selectedEvent.country}</div>
                <div className="text-zinc-500">Economic Release</div>
              </div>
            </div>

            <div className="space-y-4">
              <ImpactBadge impact={selectedEvent.impact} />
              <h2 className="text-2xl font-black font-sans leading-tight text-white">{selectedEvent.event}</h2>
              
              <div className="flex items-center gap-4 text-sm font-mono text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2 text-indigo-400" /> {new Date(selectedEvent.date).toLocaleDateString()}</div>
                <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-indigo-400" /> {new Date(selectedEvent.date).toLocaleTimeString()}</div>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                This event represents a scheduled economic indicator release or central bank announcement for {selectedEvent.country}. 
                An impact rating of "{selectedEvent.impact}" suggests {selectedEvent.impact === 'High' ? 'significant' : selectedEvent.impact === 'Medium' ? 'moderate' : 'minor'} potential market volatility upon release.
              </p>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase flex items-center"><Bell className="w-3.5 h-3.5 mr-1.5" /> Notifications</h4>
              
              {reminders[selectedEvent.id] ? (
                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg">
                  <span className="text-sm font-bold text-indigo-400">Reminder set ({reminders[selectedEvent.id]}m before)</span>
                  <button onClick={() => clearReminder(selectedEvent.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1 bg-rose-500/10 rounded">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => saveReminder(selectedEvent.id, 15)} className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors">15m Before</button>
                  <button onClick={() => saveReminder(selectedEvent.id, 30)} className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors">30m Before</button>
                  <button onClick={() => saveReminder(selectedEvent.id, 60)} className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors">1h Before</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ImpactBadge({ impact }: { impact: 'High' | 'Medium' | 'Low' }) {
  if (impact === 'High') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-3 h-3 mr-1" /> High</span>;
  }
  if (impact === 'Medium') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">Medium</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Low</span>;
}
