import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Eye, RefreshCw, Activity, TrendingUp, Clock, AlertTriangle, Compass } from 'lucide-react';

export default function PatternScanner({ theme }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smartApiError, setSmartApiError] = useState(null);
  const [lastScanStatus, setLastScanStatus] = useState("live");

  const fetchScannerData = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/market/scanner');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.isSmartApiError && errData.rawError) {
          setSmartApiError(errData.rawError);
        } else {
          setSmartApiError({ message: errData.error || `HTTP error ${res.status}` });
        }
        return;
      }
      const data = await res.json();
      if (data && data.observations) {
        setObservations(data.observations);
        if (data.lastScanStatus) {
          setLastScanStatus(data.lastScanStatus);
        } else {
          setLastScanStatus("live");
        }
        setSmartApiError(null);
      }
    } catch (error) {
      console.error("Failed to fetch scanner data:", error);
      setSmartApiError({ message: error.message || "Failed to contact scanner server" });
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchScannerData(true);
    // Updates every 5s for fast live updates
    const interval = setInterval(() => fetchScannerData(false), 15000);
    return () => clearInterval(interval);
  }, []);
  
  const glassCard = `rounded-2xl border p-4 sm:p-6 transition-all h-full ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]'
  }`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Real-time Freshness Header */}
      <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-black/5'}`}>
        <div className="flex flex-row items-center justify-between md:justify-start gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-semibold ${isDark ? 'bg-zinc-950/80 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f135] animate-pulse" />
            <span>Updates 5s</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:flex md:justify-end gap-2 text-xs sm:text-sm w-full md:w-auto">
          <select className={`col-span-2 md:flex-none px-2.5 py-1.5 rounded-lg border outline-none text-xs sm:text-sm ${isDark ? 'bg-black border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <option>Regime: All</option>
            <option>Regime: Indian Equity</option>
          </select>
          <select className={`col-span-1 md:flex-none px-2.5 py-1.5 rounded-lg border outline-none text-xs sm:text-sm ${isDark ? 'bg-black border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <option>Pattern: All</option>
            <option>Pattern: Structure Break</option>
          </select>
          <select className={`col-span-1 md:flex-none px-2.5 py-1.5 rounded-lg border outline-none text-xs sm:text-sm ${isDark ? 'bg-black border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <option>Score: &gt; 80</option>
            <option>Score: &gt; 60</option>
          </select>
        </div>
      </div>

      {/* Raw Error Diagnostic Block */}
      {smartApiError && (
        <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 space-y-3 font-mono text-sm">
          <div className="font-bold flex items-center gap-2 text-red-400">
            <AlertTriangle size={16} />
            <span>⚠️ Scanner Endpoint Error Response</span>
          </div>
          <pre className="p-4 rounded bg-black/80 overflow-x-auto text-xs whitespace-pre-wrap leading-relaxed max-h-[300px]">
            {JSON.stringify(smartApiError, null, 2)}
          </pre>
          <div className="text-xs text-gray-400">
            This detailed diagnostic message contains the exact raw response received from the server. Please check your credentials and session in the application settings.
          </div>
        </div>
      )}

      {/* lastScanStatus Banner */}
      {lastScanStatus && lastScanStatus !== "live" && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-sm ${
          lastScanStatus === "market_closed"
            ? isDark
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
            : lastScanStatus === "degraded" 
            ? isDark
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200" 
              : "border-amber-200 bg-amber-550/10 text-amber-800"
            : isDark
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {lastScanStatus === "market_closed" ? (
            <Clock size={18} className={isDark ? "text-emerald-400 shrink-0" : "text-emerald-600 shrink-0"} />
          ) : (
            <AlertTriangle size={18} className={lastScanStatus === "degraded" ? (isDark ? "text-amber-400" : "text-amber-600") : (isDark ? "text-red-400" : "text-red-600")} />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider">
              {lastScanStatus === "market_closed" ? "Market Closed / Session Offline" : lastScanStatus === "degraded" ? "Degraded Scan State" : "Scanner Unavailable"}:
            </span>
            {" "}
            {lastScanStatus === "market_closed"
              ? "Live session is offline. Displaying last market close prices and historical daily averages."
              : lastScanStatus === "degraded" 
              ? "Some scan instruments failed to fetch live quote/historical metrics. Showing offline or cached status for failed rows." 
              : "All scan instruments failed to load live data. Please check connection credentials and login session in settings."
            }
          </div>
        </div>
      )}

      {/* Filtered Stocks Notice */}
      {observations.some(obs => obs.status === "Filtered") && (
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          isDark ? 'bg-zinc-950/40 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-600'
        }`}>
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>
            {observations.filter(obs => obs.status === "Filtered").length} stocks filtered for low daily liquidity (average volume under 500,000 shares).
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="animate-spin text-[#c8f135]" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {observations.map((obs, i) => (
            <div key={i} className={`${glassCard} flex flex-col relative overflow-hidden ${obs.liveDataUnavailable ? 'opacity-80 border-orange-500/20' : ''}`}>
              
              {/* Row Freshness / Failure Warning Badges / Filter Notice */}
              {obs.status === "Filtered" ? (
                <div className="mb-3 p-2 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] sm:text-[11px] font-semibold flex items-start gap-1.5">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Filtered Out</div>
                    <div className="text-[9px] sm:text-[10px] opacity-80">{obs.reason || "Under 500k avg 20-day daily volume"}</div>
                  </div>
                </div>
              ) : obs.liveDataUnavailable ? (
                <div className="mb-3 p-2 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400 text-[10px] sm:text-[11px] font-semibold flex items-start gap-1.5">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">⚠️ Live data unavailable</div>
                    <div className="text-[9px] sm:text-[10px] opacity-80">Last updated: {new Date(obs.lastUpdated).toLocaleTimeString()} ({obs.failureReason})</div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 text-[9px] sm:text-[10px] font-mono text-green-400/90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                  <span>Real-time Active — Synced at {new Date(obs.lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={`font-bold text-base sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{obs.inst}</span>
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      obs.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                      obs.status === 'Filtered' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {obs.status}
                    </span>
                  </div>
                  <div className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{obs.type}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-[#c8f135]">{obs.status === "Filtered" ? "Excluded" : obs.volumeVsAvg}</div>
                  <div className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Volume vs Avg</div>
                </div>
              </div>

              {/* Advanced Price & Volume Metrics */}
              {obs.status === "Filtered" ? (
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                    <span className="block text-gray-500 uppercase font-semibold text-[9px] sm:text-[10px] mb-1">20-Day Avg Daily Volume</span>
                    <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {obs.avgDailyVolume?.toLocaleString('en-IN')} shares
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-blue-400">
                      <TrendingUp size={12} className="shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase">LTP & Change</span>
                    </div>
                    <div className={`text-xs sm:text-sm md:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex flex-wrap items-baseline gap-1`}>
                      <span>₹{obs.price > 0 ? obs.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}</span>
                      {obs.price > 0 && (
                        <span className={`text-[10px] sm:text-xs font-semibold ${obs.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ({obs.change >= 0 ? '+' : ''}{obs.change?.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[#c8f135]">
                      <Activity size={12} className="shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase">VWAP Position</span>
                    </div>
                    <div className={`text-[10px] sm:text-xs font-bold ${obs.isAboveVwap ? 'text-green-400' : 'text-orange-400'} truncate`}>
                      {obs.vwap > 0 ? (
                        <>
                          {obs.isAboveVwap ? 'Above' : 'Below'} (₹{obs.vwap?.toFixed(1)})
                        </>
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Intraday Opening Range Breakout Block */}
              {obs.status !== "Filtered" && (
                <div className={`p-2.5 sm:p-3 rounded-lg border mb-3 sm:mb-4 ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                  <div className="flex items-center justify-between border-b border-gray-500/10 pb-1.5 mb-1.5 gap-2">
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Compass size={12} className="shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Opening Range (30m)</span>
                    </div>
                    <span className={`text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${obs.orbStatus?.includes('Up') || obs.orbStatus?.includes('Positive') || obs.orbStatus?.includes('Bullish') || obs.orbStatus?.includes('Upper') ? 'bg-green-500/15 text-green-400' : obs.orbStatus?.includes('Down') || obs.orbStatus?.includes('Negative') || obs.orbStatus?.includes('Bearish') || obs.orbStatus?.includes('Lower') ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/15 text-gray-400'}`}>
                      {obs.orbStatus?.includes('Up') || obs.orbStatus?.includes('Positive') || obs.orbStatus?.includes('Bullish') || obs.orbStatus?.includes('Upper') ? 'UPPER BOUND' : obs.orbStatus?.includes('Down') || obs.orbStatus?.includes('Negative') || obs.orbStatus?.includes('Bearish') || obs.orbStatus?.includes('Lower') ? 'LOWER BOUND' : 'NEUTRAL RANGE'}
                    </span>
                  </div>
                  <div className={`text-[11px] sm:text-xs font-medium leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {obs.orbStatus || 'Consolidating within opening range'}
                  </div>
                </div>
              )}

              {/* Session OHLC Summary */}
              {obs.status !== "Filtered" && obs.price > 0 && (
                <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 p-2 rounded-lg mb-4 sm:mb-6 text-[9px] sm:text-[10px] text-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <div>
                    <span className="block text-gray-500 uppercase font-semibold text-[8px] sm:text-[9px]">Open</span>
                    <span className="font-bold">₹{obs.open?.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase font-semibold text-[8px] sm:text-[9px]">High</span>
                    <span className="font-bold text-green-500">₹{obs.high?.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase font-semibold text-[8px] sm:text-[9px]">Low</span>
                    <span className="font-bold text-red-500">₹{obs.low?.toFixed(1)}</span>
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => navigate('/dashboard/analysis')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    <Eye size={14} /> View Context
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/alerts')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold border transition-all ${isDark ? 'border-[#c8f135] text-[#c8f135] hover:bg-[#c8f135]/10' : 'border-[#a3cc20] text-[#a3cc20] hover:bg-[#a3cc20]/10'}`}
                  >
                     Review Conditions
                  </button>
                </div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 text-center italic border-t pt-2 border-gray-500/10">
                  Your trading plan and risk rules determine your action.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
