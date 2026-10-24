import React, { useState, useEffect } from 'react';
import { Layers, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';

interface SectorItem {
  name: string;
  code: string;
  price?: number;
  changePct: number;
  marketCapWeight: number;
  topGainers: string;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export default function SectorHeatmap({ isDark }: { isDark: boolean }) {
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GAINERS' | 'LOSERS'>('ALL');

  const fetchSectors = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/market/sectors');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSectors(data);
        } else {
          setSectors([]);
        }
      } else {
        setSectors([]);
      }
    } catch (err) {
      console.error('Failed to fetch sector index data:', err);
      setSectors([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSectors();
    const interval = setInterval(() => {
      fetchSectors(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = sectors.filter(s => {
    if (activeFilter === 'GAINERS') return s.changePct > 0;
    if (activeFilter === 'LOSERS') return s.changePct < 0;
    return true;
  });

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-500/10">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="text-blue-500 h-5 w-5" />
            <h3 className={`text-md font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              NSE Sectoral Rotation & Institutional Money Flow
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time heat distribution across primary NSE sectors and leading index constituents.
          </p>
        </div>

        {/* Filter Chips & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'GAINERS', 'LOSERS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDark
                      ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchSectors(true)}
            disabled={isRefreshing || loading}
            className={`p-1.5 rounded-lg border transition-all ${
              isDark ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            title="Refresh Sectors"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && sectors.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`p-4 rounded-xl border h-28 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`} />
          ))}
        </div>
      ) : sectors.length === 0 ? (
        <div className={`p-8 rounded-xl border text-center flex flex-col items-center justify-center gap-2 ${
          isDark ? 'bg-slate-900/30 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <AlertCircle size={20} className="text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Data unavailable</span>
          <span className="text-[11px] text-slate-400">Sector index quotes could not be loaded from exchange feed.</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-8 rounded-xl border text-center text-xs font-semibold ${
          isDark ? 'bg-slate-900/30 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          No sectors found matching current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filtered.map((sec) => {
            const isUp = sec.changePct >= 0;
            return (
              <div
                key={sec.code}
                className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex flex-col justify-between ${
                  isUp
                    ? (isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50/70 border-emerald-200')
                    : (isDark ? 'bg-rose-500/10 border-rose-500/25' : 'bg-rose-50/70 border-rose-200')
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {sec.name}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-extrabold px-2 py-0.5 rounded-md ${
                    isUp 
                      ? 'text-emerald-400 bg-emerald-500/20' 
                      : 'text-rose-400 bg-rose-500/20'
                  }`}>
                    {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {isUp ? '+' : ''}{sec.changePct.toFixed(2)}%
                  </span>
                </div>

                {/* Progress Weight Bar */}
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 my-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.max(15, Math.abs(sec.changePct) * 45))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Weight: {sec.marketCapWeight}%</span>
                  <span className="truncate max-w-[130px] font-mono text-[10px] opacity-80" title={sec.topGainers}>
                    {sec.topGainers}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
