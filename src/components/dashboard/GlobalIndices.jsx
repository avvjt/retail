import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalIndices({ theme }) {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchIndices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/indices');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch indices');
      setIndices(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (dateString) => {
    if (!dateString) return "Delayed";
    const d = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const date = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month} ${date}, ${hours}:${minutes}`;
  };

  return (
    <div className={`w-full h-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            Global Indices
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Live global market performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={fetchIndices}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              theme === 'dark' 
                ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-white/10' 
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
          <AlertTriangle size={20} />
          <p>Failed to load market data: {error}</p>
        </div>
      )}

      {!loading && !error && indices.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
          <AlertTriangle size={20} />
          <p>No market data returned. This may be due to rate limiting or IP blocking by the data provider on this hosting platform.</p>
        </div>
      )}

      {loading && indices.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`h-[130px] rounded-xl animate-pulse ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {indices.map((item, i) => {
            const isPositive = item.change >= 0;
            // The image has a specific color palette for the cards
            // Positive: vibrant emerald
            // Negative: true red
            const bgClass = isPositive ? 'bg-[#3eb489]' : 'bg-[#dc2626]';
            
            return (
              <div 
                key={i} 
                className={`p-4 rounded-xl flex flex-col justify-between shadow-md text-white transition-transform hover:scale-[1.02] ${bgClass}`}
                style={{ 
                   background: isPositive 
                      ? 'linear-gradient(145deg, #46c798, #37a37a)' 
                      : 'linear-gradient(145deg, #ef4444, #b91c1c)' 
                }}
              >
                <div className="text-center">
                  <div className="font-bold text-lg leading-tight tracking-wide">{item.name}</div>
                  <div className="text-xs opacity-90 mt-1 font-mono">({formatTimestamp(item.timestamp)})</div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="text-2xl leading-none drop-shadow-sm">{item.flag}</span>
                    <span className="font-medium font-mono text-sm">
                      {isPositive ? '+' : ''}{item.changePercent?.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xl font-bold tracking-tight font-mono">
                      {item.price?.toFixed(2)}
                    </span>
                    <span className="font-medium font-mono text-sm">
                      {isPositive ? '+' : ''}{item.change?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
