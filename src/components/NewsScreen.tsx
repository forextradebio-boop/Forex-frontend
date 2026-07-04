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
    <div className="flex flex-col h-full bg-[#09090b] font-sans text-zinc-300">
      
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 p-4 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">Financial News</h2>
        </div>

        <div className="flex bg-zinc-900 rounded p-1 overflow-x-auto">
          {(['LATEST', 'FOREX', 'POSITIVE', 'NEGATIVE', 'BOOKMARKS', 'RECENT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-emerald-500 text-black shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors w-48"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className={`p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ${isFetching ? 'animate-spin text-emerald-400' : ''}`}
            title="Pull to Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-4xl mx-auto w-full">
        
        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <div>
              <h3 className="text-rose-400 font-bold text-lg">Failed to load news</h3>
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
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-zinc-900/50 rounded-xl border border-zinc-800"></div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-4">
            {hasNoResults ? (
              <div className="text-center py-20 text-zinc-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{isSearchingMode ? 'No search results found.' : 'No news found.'}</p>
              </div>
            ) : (
              displayedNews.map(news => (
                <div 
                  key={news.id} 
                  onClick={() => openArticle(news)}
                  className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 rounded-xl p-5 cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => toggleBookmark(e, news.id)} className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition">
                      <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(news.id) ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    </button>
                    <button onClick={(e) => handleShare(e, news.title)} className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[140px_1fr]">
                    <div className="rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 h-44 lg:h-full">
                      {news.imageUrl ? (
                        <img src={news.imageUrl} alt={news.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-500 text-xs uppercase tracking-[0.24em] font-semibold">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                        <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400">{news.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getRelativeTime(news.publishedAt)}</span>
                        <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${news.sentiment === 'Positive' ? 'bg-teal-500/10 text-teal-200 border border-teal-500/20' : news.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-200 border border-rose-500/20' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>{news.sentiment}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-100 leading-snug group-hover:text-emerald-400 transition-colors">{news.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mt-2">{news.summary}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                        {news.relatedSymbols?.slice(0, 6).map(symbol => (
                          <span key={symbol} className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800">{symbol}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={(e) => { e.stopPropagation(); window.open(news.url, '_blank'); }} className="px-4 py-2 rounded-2xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition">
                          Open Article
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleBookmark(e, news.id); }} className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition">
                          {bookmarkedIds.has(news.id) ? 'Bookmarked' : 'Bookmark'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleShare(e, news.title); }} className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition">
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative text-left shadow-2xl">
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 bg-zinc-900 p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex justify-between items-center text-xs font-mono text-zinc-500 border-b border-zinc-800 pb-4">
              <span className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-emerald-400 font-bold">{selectedNews.source}</span>
              <span>{new Date(selectedNews.publishedAt).toLocaleString()}</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black font-sans leading-tight text-white">{selectedNews.title}</h2>
              <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4">
                <p className="text-sm text-zinc-300 leading-relaxed italic">{selectedNews.summary}</p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
              <div className="flex gap-3">
                <button 
                  onClick={(e) => toggleBookmark(e, selectedNews.id)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    bookmarkedIds.has(selectedNews.id) ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(selectedNews.id) ? 'fill-black' : ''}`} />
                  {bookmarkedIds.has(selectedNews.id) ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={(e) => handleShare(e, selectedNews.title)} 
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-sm font-bold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
              <button 
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold transition-colors"
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
