import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Bookmark, 
  Share2, 
  Clock, 
  X,
  History
} from 'lucide-react';
import { useNews, useForexNews, useSearchNews } from '../hooks/useNews';
import { NewsItem } from '../types';

export default function NewsScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useNews();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'LATEST' | 'FOREX' | 'POSITIVE' | 'NEGATIVE' | 'BOOKMARKS' | 'RECENT'>('LATEST');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { data: searchData, isFetching: isSearching } = useSearchNews(searchQuery);
  const { data: forexData } = useForexNews(activeTab === 'FOREX');
  
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);

  // Load local state
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('forexfactory_news_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarkedIds(new Set(JSON.parse(savedBookmarks)));
      } catch(e) {}
    }
    const savedRecents = localStorage.getItem('forexfactory_news_recents');
    if (savedRecents) {
      try {
        setRecentNews(JSON.parse(savedRecents));
      } catch(e) {}
    }
  }, []);

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      localStorage.setItem('forexfactory_news_bookmarks', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleShare = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, text: `Check out this news: ${title}` }).catch(() => {});
    } else {
      alert(`Shared: ${title}`); // Fallback
    }
  };

  const openArticle = (news: NewsItem) => {
    setSelectedNews(news);
    setRecentNews(prev => {
      const filtered = prev.filter(n => n.id !== news.id);
      const updated = [news, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem('forexfactory_news_recents', JSON.stringify(updated));
      return updated;
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference === 0) {
        const hoursDiff = Math.round((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60));
        if (hoursDiff === 0) return 'Just now';
        return rtf.format(hoursDiff, 'hour');
    }
    return rtf.format(daysDifference, 'day');
  };

  const latestNews = data?.news || [];
  const forexNews = forexData?.news || [];
  const searchNews = searchData?.news || [];
  
  const sourceNews = searchQuery.trim().length > 2 ? searchNews : latestNews;
  let displayedNews = sourceNews;

  if (activeTab === 'FOREX') {
    displayedNews = forexNews;
  } else if (activeTab === 'POSITIVE') {
    displayedNews = sourceNews.filter(n => n.sentiment === 'Positive');
  } else if (activeTab === 'NEGATIVE') {
    displayedNews = sourceNews.filter(n => n.sentiment === 'Negative');
  } else if (activeTab === 'BOOKMARKS') {
    displayedNews = sourceNews.filter(n => bookmarkedIds.has(n.id));
  } else if (activeTab === 'RECENT') {
    displayedNews = recentNews;
  }

  const isSearchingMode = searchQuery.trim().length > 2;
  const hasNoResults = !displayedNews.length && !isLoading && !isError;

  return (
    <div className="flex flex-col h-full bg-lb-panel font-sans text-lb-text">
      
      {/* Header */}
      <div className="border-b border-lb-border bg-lb-panel/90 backdrop-blur-xl p-4 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-lb-accent/10 rounded-xl border border-lb-accent/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <FileText className="w-5 h-5 text-lb-accent" />
          </div>
          <h2 className="text-xl font-black text-lb-text tracking-wide">Financial News</h2>
        </div>

        <div className="flex bg-lb-bg/80 border border-lb-border/50 rounded-xl p-1.5 overflow-x-auto shadow-inner hide-scrollbar gap-1">
          {(['LATEST', 'FOREX', 'POSITIVE', 'NEGATIVE', 'BOOKMARKS', 'RECENT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 flex items-center whitespace-nowrap active:scale-95 ${
                activeTab === tab 
                  ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]' 
                  : 'text-lb-text-muted hover:text-lb-text hover:bg-lb-panel-hover hover:-translate-y-0.5'
              }`}
            >
              {tab === 'BOOKMARKS' && <Bookmark className="w-3.5 h-3.5 mr-1.5" />}
              {tab === 'RECENT' && <History className="w-3.5 h-3.5 mr-1.5" />}
              {tab === 'FOREX' ? 'Forex' : tab === 'POSITIVE' ? 'Positive' : tab === 'NEGATIVE' ? 'Negative' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-lb-text-muted" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-lb-bg border border-lb-border rounded-full pl-9 pr-4 py-2 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all w-48 focus:w-64"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className={`p-2.5 rounded-xl bg-lb-bg border border-lb-border text-lb-text-muted hover:text-lb-accent hover:border-lb-accent/50 hover:shadow-[0_0_15px_rgba(20,184,166,0.2)] active:scale-95 transition-all ${isFetching ? 'animate-spin text-lb-accent' : ''}`}
            title="Pull to Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-4xl mx-auto w-full">
        
        {isError && (
          <div className="bg-lb-down/10 border border-lb-down/20 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-lb-down" />
            <div>
              <h3 className="text-lb-down font-bold text-lg">Failed to load news</h3>
              <p className="text-lb-text-muted text-sm mt-1">Please check your connection and try again.</p>
            </div>
            <button 
              onClick={() => refetch()}
              className="bg-lb-down hover:bg-lb-down/80 text-lb-text px-6 py-2 rounded font-bold text-sm transition"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && !isError && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-lb-bg/50 rounded-xl border border-lb-border"></div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-4">
            {hasNoResults ? (
              <div className="text-center py-20 text-lb-text-muted">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{isSearchingMode ? 'No search results found.' : 'No news found.'}</p>
              </div>
            ) : (
              displayedNews.map(news => (
                <div 
                  key={news.id} 
                  onClick={() => openArticle(news)}
                  className="bg-lb-panel border border-lb-border hover:border-lb-accent/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(20,184,166,0.08)]"
                >
                  <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                    <button onClick={(e) => toggleBookmark(e, news.id)} className="p-2 rounded-full bg-lb-bg hover:bg-lb-panel-hover text-lb-text-muted hover:text-lb-accent hover:scale-110 active:scale-95 transition-all">
                      <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(news.id) ? 'fill-lb-accent text-lb-accent' : ''}`} />
                    </button>
                    <button onClick={(e) => handleShare(e, news.title)} className="p-2 rounded-full bg-lb-bg hover:bg-lb-panel-hover text-lb-text-muted hover:text-lb-accent hover:scale-110 active:scale-95 transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[140px_1fr]">
                    <div className="rounded-3xl overflow-hidden bg-lb-bg border border-lb-border h-44 lg:h-full">
                      {news.imageUrl ? (
                        <img src={news.imageUrl} alt={news.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lb-text-muted text-xs uppercase tracking-[0.24em] font-semibold">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-lb-text-muted">
                        <span className="px-2.5 py-1 rounded-lg bg-lb-bg border border-lb-border text-lb-accent tracking-wide">{news.source}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{getRelativeTime(news.publishedAt)}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${news.sentiment === 'Positive' ? 'bg-lb-accent/10 text-lb-accent border border-lb-accent/20' : news.sentiment === 'Negative' ? 'bg-lb-down/10 text-lb-down border border-lb-down/20' : 'bg-lb-panel-hover text-lb-text border border-lb-border'}`}>{news.sentiment}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-lb-text leading-snug group-hover:text-lb-accent transition-colors duration-300">{news.title}</h3>
                        <p className="text-sm text-lb-text-muted leading-relaxed line-clamp-3 mt-3">{news.summary}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold text-lb-text-muted uppercase tracking-wider">
                        {news.relatedSymbols?.slice(0, 6).map(symbol => (
                          <span key={symbol} className="px-2 py-1 rounded-md bg-lb-bg border border-lb-border">{symbol}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); window.open(news.url, '_blank'); }} className="px-5 py-2.5 rounded-xl bg-lb-accent text-lb-bg text-xs font-black hover:bg-lb-accent/80 hover:shadow-[0_0_15px_rgba(20,184,166,0.4)] hover:scale-105 active:scale-95 transition-all">
                          Open Article
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleBookmark(e, news.id); }} className={`px-5 py-2.5 rounded-xl border text-xs font-bold hover:scale-105 active:scale-95 transition-all ${bookmarkedIds.has(news.id) ? 'bg-lb-accent/10 border-lb-accent/30 text-lb-accent' : 'bg-lb-bg border-lb-border text-lb-text hover:border-lb-accent/30 hover:text-lb-accent'}`}>
                          {bookmarkedIds.has(news.id) ? 'Bookmarked' : 'Bookmark'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleShare(e, news.title); }} className="px-5 py-2.5 rounded-xl bg-lb-bg border border-lb-border text-xs font-bold text-lb-text hover:border-lb-accent/30 hover:text-lb-accent hover:scale-105 active:scale-95 transition-all">
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-lb-panel border border-lb-border rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative text-left shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-8 duration-300">
            {/* Subtle inner glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-lb-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 bg-lb-bg p-2 rounded-full border border-lb-border text-lb-text-muted hover:text-lb-accent hover:scale-110 active:scale-95 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex justify-between items-center text-xs font-mono text-lb-text-muted border-b border-lb-border pb-4 relative z-10">
              <span className="px-3 py-1 bg-lb-bg rounded-lg border border-lb-border text-lb-accent font-black tracking-wide">{selectedNews.source}</span>
              <span className="font-bold">{new Date(selectedNews.publishedAt).toLocaleString()}</span>
            </div>

            <div className="space-y-4 relative z-10">
              <h2 className="text-2xl md:text-3xl font-black font-sans leading-tight text-lb-text">{selectedNews.title}</h2>
              <div className="bg-lb-accent/5 border border-lb-accent/20 rounded-2xl p-5 shadow-inner">
                <p className="text-[15px] text-lb-text/90 leading-relaxed italic">{selectedNews.summary}</p>
              </div>
            </div>

            <div className="border-t border-lb-border pt-6 flex items-center justify-between relative z-10 mt-6">
              <div className="flex gap-3">
                <button 
                  onClick={(e) => toggleBookmark(e, selectedNews.id)} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105 active:scale-95 ${
                    bookmarkedIds.has(selectedNews.id) ? 'bg-lb-accent text-lb-bg shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-lb-bg text-lb-text hover:text-lb-accent border border-lb-border hover:border-lb-accent/30'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(selectedNews.id) ? 'fill-lb-bg' : ''}`} />
                  {bookmarkedIds.has(selectedNews.id) ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={(e) => handleShare(e, selectedNews.title)} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-lb-bg text-lb-text border border-lb-border hover:border-lb-accent/30 hover:text-lb-accent rounded-xl text-sm font-black transition-all hover:scale-105 active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
              <button 
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2.5 bg-lb-panel-hover hover:bg-lb-bg border border-lb-border text-lb-text rounded-xl text-sm font-black transition-all hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
