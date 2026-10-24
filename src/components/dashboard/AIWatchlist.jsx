import React, { useState, useEffect } from 'react';
import { Search, Star, Zap, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function AIWatchlist({ theme }) {
  const isDark = theme === 'dark';
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzingSymbol, setAnalyzingSymbol] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSentimentList();
  }, []);

  const fetchSentimentList = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/watchlist/sentiment', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load watchlist sentiment ratings');
      const data = await res.json();
      setWatchlist(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch watchlist records.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymbol = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    const symbol = searchQuery.toUpperCase().trim();
    setSearchQuery('');
    setAnalyzingSymbol(symbol);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/watchlist/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol })
      });

      if (!res.ok) throw new Error('Failed to generate sentiment for this ticker');
      const newScore = await res.json();
      
      setWatchlist(prev => {
        // filter out older analysis of same symbol
        const filtered = prev.filter(item => item.symbol !== symbol);
        return [newScore, ...filtered];
      });
    } catch (err) {
      console.error(err);
      setError(`Failed to analyze sentiment for "${symbol}".`);
    } finally {
      setAnalyzingSymbol(null);
    }
  };

  const handleRefresh = async (symbol) => {
    setAnalyzingSymbol(symbol);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/watchlist/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol })
      });

      if (!res.ok) throw new Error('Failed to update sentiment');
      const updatedScore = await res.json();

      setWatchlist(prev => prev.map(item => item.symbol === symbol ? updatedScore : item));
    } catch (err) {
      console.error(err);
      setError(`Failed to refresh sentiment for "${symbol}".`);
    } finally {
      setAnalyzingSymbol(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 30) return isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-500/10';
    if (score <= -30) return isDark ? 'text-red-400 bg-red-500/10' : 'text-red-700 bg-red-500/10';
    return isDark ? 'text-yellow-400 bg-yellow-500/10' : 'text-yellow-700 bg-yellow-500/10';
  };

  const getScoreLabel = (score) => {
    if (score >= 60) return 'High Inflow 📈';
    if (score >= 20) return 'Moderate Inflow 🔼';
    if (score <= -60) return 'High Outflow 📉';
    if (score <= -20) return 'Moderate Outflow 🔽';
    return 'Net Neutral ↔️';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Section */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className={isDark ? 'text-[#c8f135]' : 'text-yellow-500'} size={24} fill={isDark ? '#c8f135' : '#eab308'} />
              <h2 className="text-xl font-bold">AI Sentiment Watchlist</h2>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Connect to live Gemini AI analysis scanning news, public media, and filings for stock signals.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleAddSymbol} className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search & Add NSE Ticker (e.g. RELIANCE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                isDark 
                  ? 'bg-white/5 border border-white/10 text-white focus:border-white/25' 
                  : 'bg-white border border-gray-200 text-gray-900 focus:border-gray-400 shadow-sm'
              }`}
            />
            <Search className="absolute left-3.5 top-3 text-gray-400" size={14} />
          </form>
        </div>
      </div>

      {analyzingSymbol && (
        <div className={`p-4 rounded-2xl border text-center text-xs flex items-center justify-center gap-2 font-bold animate-pulse ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-black/5'}`}>
          <RefreshCw size={14} className="animate-spin text-[#c8f135]" />
          Gemini NLP engine is analyzing real-time media feeds for {analyzingSymbol}...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">No tickers added to your watchlist yet.</p>
          <p className="text-xs text-gray-500">Search and enter an Indian ticker symbol above to start analyzing news sentiment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {watchlist.map((item) => {
            const label = getScoreLabel(item.score);
            const badgeStyle = getScoreColor(item.score);
            const normalizedPct = ((item.score + 100) / 200) * 100; // -100..100 map to 0..100%

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-lg font-bold block">{item.symbol}</span>
                      <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRefresh(item.symbol)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                        title="Rerun Gemini analysis"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Summary Analysis text */}
                  <p className={`text-xs leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.summary || `Current market positioning index of ${item.score} based on institutional accumulator signals.`}
                  </p>
                </div>

                {/* Score Scale Slider Visual */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                    <span>Outflow (-100)</span>
                    <span className={`text-xs font-mono font-extrabold ${item.score > 0 ? 'text-emerald-500' : item.score < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {item.score > 0 ? '+' : ''}{item.score}
                    </span>
                    <span>Inflow (+100)</span>
                  </div>
                  <div className={`h-2 rounded-full w-full relative ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        item.score >= 30 ? 'bg-emerald-500' : item.score <= -30 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${normalizedPct}%` }}
                    />
                    <div 
                      className={`absolute w-3 h-3 rounded-full bg-white border border-black shadow -top-0.5 transition-all duration-1000`}
                      style={{ left: `calc(${normalizedPct}% - 6px)` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className={`p-4 rounded-xl border text-center text-xs ${isDark ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-gray-100 border-black/5 text-gray-500'}`}>
        Educational information, not investment advice.
      </div>
    </div>
  );
}
