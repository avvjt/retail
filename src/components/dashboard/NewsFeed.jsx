import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, ExternalLink, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewsFeed({ theme }) {
  const [filter, setFilter] = useState('latest');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      } else {
        setNews([]);
      }
    } catch(e) {
      console.error(e);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`w-full p-6 h-full overflow-y-auto ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono">News & Narratives Feed</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Real-time headlines and catalysts from verified financial feeds
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['latest', 'trending', 'crypto', 'world'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : (isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && news.length === 0 ? (
        <div className="flex items-center justify-center p-12 text-sm text-slate-500">
          Loading market headlines...
        </div>
      ) : news.length === 0 ? (
        <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">News unavailable</p>
          <p className="text-xs mt-1">Unable to load feed at this time. Please check back shortly.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {news.map((item, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: Math.min(idx * 0.05, 0.5) }} 
              key={item.id || `news-${idx}`} 
              className={`p-4 border-l-4 rounded-r-xl border-blue-500 transition-all ${
                isDark ? 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {item.publisher || item.source || "Market News"}
                  </span>
                  {item.category && (
                    <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                      {item.category}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono">
                  {item.time ? new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ""}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 mb-1 leading-snug">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1">
                    {item.title}
                    <ExternalLink size={13} className="opacity-60 inline shrink-0" />
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              {item.summary && (
                <p className="text-xs text-slate-700 dark:text-zinc-400 mt-1 leading-relaxed">
                  {item.summary}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
