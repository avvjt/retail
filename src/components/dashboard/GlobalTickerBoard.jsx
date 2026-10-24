import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function GlobalTickerBoard({ theme }) {
  const [indices, setIndices] = useState([]);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await fetch('/api/indices');
        const data = await res.json();
        setIndices(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!indices || indices.length === 0) return null;

  return (
    <div className={`w-full overflow-hidden border-b ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'} py-2 px-4 flex items-center shadow-sm`}>
      <div className="flex items-center text-xs text-gray-500 mr-4 font-medium whitespace-nowrap">
        <Clock className="w-3 h-3 mr-1" />
        Data Delayed (~15m)
      </div>
      <div className="flex-1 overflow-x-auto no-scrollbar flex space-x-6 items-center">
        {indices.map((idx, i) => {
          const isUp = idx.change >= 0;
          return (
            <div key={i} className="flex items-center space-x-2 whitespace-nowrap">
              <span className={`font-semibold text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                {idx.shortName || idx.symbol}
              </span>
              <span className={`text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {idx.price?.toFixed(2)}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isUp ? (theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (theme === 'dark' ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700')}`}>
                {isUp ? '+' : ''}{idx.changePercent?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
