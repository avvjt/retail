import React, { useState, useEffect } from 'react';
import { 
  Radar, Play, AlertCircle, Settings, CheckCircle2, FileText, Activity, 
  Search, Clock, TrendingUp, TrendingDown, Layers, ArrowUpRight, BarChart2,
  Sparkles, ShieldCheck, RefreshCw, Zap
} from 'lucide-react';
import { notifyUserOfAlert } from '../../utils/notifications';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_WATCHLISTS = {
  niftyCore: {
    label: "NIFTY Bluechips",
    symbols: ['RELIANCE.NS', 'HDFCBANK.NS', 'INFY.NS', 'TCS.NS', 'ICICIBANK.NS']
  },
  momentum: {
    label: "High Momentum",
    symbols: ['TATAMOTORS.NS', 'SBIN.NS', 'JSWSTEEL.NS', 'MARUTI.NS', 'ONGC.NS']
  },
  indicesCrypto: {
    label: "Indices & Crypto",
    symbols: ['^NSEI', '^NSEBANK', 'BTC-USD', 'ETH-USD']
  }
};

export default function CoreScanner({ theme }) {
  const isDark = theme === 'dark';
  const [configs, setConfigs] = useState([]);
  const [results, setResults] = useState([]);
  const [skippedSymbols, setSkippedSymbols] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  
  const [watchlist, setWatchlist] = useState(['RELIANCE.NS', 'HDFCBANK.NS', 'INFY.NS', 'BTC-USD']);
  const [newSymbol, setNewSymbol] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [lastRunDate, setLastRunDate] = useState(null);
  
  const latestData = React.useRef({ configs, watchlist, scanning, lastRunDate });
  useEffect(() => {
    latestData.current = { configs, watchlist, scanning, lastRunDate };
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/scanner/configs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (!newSymbol.trim() || newSymbol.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/scanner/search?q=${encodeURIComponent(newSymbol)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (e) {}
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [newSymbol]);

  const handleSelectSymbol = (sym) => {
    if (!watchlist.includes(sym)) {
      setWatchlist([...watchlist, sym]);
    }
    setNewSymbol('');
    setShowDropdown(false);
  };

  const applyPreset = (presetKey) => {
    const preset = PRESET_WATCHLISTS[presetKey];
    if (preset) {
      setWatchlist([...preset.symbols]);
    }
  };

  const runScan = async (configId, isAutomated = false) => {
    setScanning(true);
    setScanError(null);
    try {
      const currentWatchlist = latestData.current ? latestData.current.watchlist : watchlist;
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/scanner/scan/${configId}`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbols: currentWatchlist })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setResults(data.results || []);
        setSkippedSymbols(data.skipped || []);
        setHasScanned(true);
        if (isAutomated) {
           notifyUserOfAlert({
              id: `scan-complete-${Date.now()}`,
              title: '✅ Scheduled Scan Complete',
              observation: `Automated scanner analyzed ${currentWatchlist.length} symbols and discovered ${(data.results || []).length} qualifying setups.`,
              severity: 'Medium',
              category: 'Scanner',
              time: new Date().toLocaleTimeString()
           });
        }
      } else {
        setScanError(data.error || "An unknown error occurred during scanning.");
      }
    } catch(e) {
      setScanError(e.message || "Network error occurred.");
    }
    setScanning(false);
  };
  
  const latestRunScan = React.useRef(runScan);
  useEffect(() => {
    latestRunScan.current = runScan;
  });

  useEffect(() => {
    if (!isScheduled || !scheduleTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return; // Weekdays only

      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMin = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMin}`;
      const currentDate = now.toDateString();

      if (currentTime === scheduleTime && lastRunDate !== currentDate) {
        if (!latestData.current.scanning) {
           setLastRunDate(currentDate);
           const configIdToRun = latestData.current.configs.length > 0 ? latestData.current.configs[0].id : 1;
           latestRunScan.current(configIdToRun, true);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isScheduled, scheduleTime, lastRunDate]);

  const handleRunScanner = () => {
    const configIdToRun = configs.length > 0 ? configs[0].id : 1;
    runScan(configIdToRun);
  };

  const handleAskCopilot = (sym, setupName) => {
    const prompt = `Perform institutional quant analysis for ${sym}. It flagged setup "${setupName || 'Quantitative Breakout'}". What is the precise entry trigger, stop loss, and risk-to-reward target?`;
    if (typeof window.openAlphaCopilot === 'function') {
      window.openAlphaCopilot(prompt);
    } else {
      window.dispatchEvent(new CustomEvent('open_copilot_ask', { detail: prompt }));
    }
  };

  return (
    <div className={`w-full p-4 sm:p-6 h-full overflow-y-auto ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      <AnimatePresence>
        {scanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white"
          >
            <Radar className="w-16 h-16 text-emerald-400 mb-6 animate-[spin_2.5s_linear_infinite]" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 text-center px-4">Live Multi-Factor Scanner Active</h2>
            <p className="text-emerald-400 font-mono text-xs sm:text-sm animate-pulse text-center max-w-md px-6">
              Fetching real-time order ticks, computing relative volume (RVOL), moving average structures & institutional liquidity...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-5 border-black/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Radar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Core Scanner Engine</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Live Real-Time
            </span>
          </div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Quantitative screening powered by live Yahoo Finance & Angel One SmartAPI tick feeds
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Scheduling toggle */}
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${isDark ? 'border-white/10 bg-[#141414]' : 'border-black/10 bg-white shadow-sm'}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
                <div className={`block w-9 h-5 rounded-full transition-colors ${isScheduled ? 'bg-emerald-500' : (isDark ? 'bg-white/10' : 'bg-gray-300')}`}></div>
                <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isScheduled ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Daily Auto-Scan</span>
            </label>
            {isScheduled && (
              <div className="flex items-center gap-1 border-l pl-3 border-current border-opacity-20">
                <Clock className="w-3.5 h-3.5 opacity-60 text-emerald-500" />
                <input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className={`text-xs bg-transparent border-none focus:outline-none font-mono ${isDark ? 'text-white' : 'text-black'}`}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                />
              </div>
            )}
          </div>

          <button 
            onClick={handleRunScanner}
            disabled={scanning}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className={`w-4 h-4 mr-1.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Running Live Scan...' : 'Scan Watchlist Now'}
          </button>
        </div>
      </div>

      {/* Target Watchlist & Quick Presets */}
      <div className={`w-full mb-6 p-4 rounded-2xl border ${isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Target Instruments & Watchlist</h3>
          
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-500 font-semibold mr-1">Presets:</span>
            {Object.entries(PRESET_WATCHLISTS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  isDark 
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300' 
                    : 'border-black/10 bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Watchlist Chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {watchlist.map(sym => (
            <div 
              key={sym} 
              className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                isDark 
                  ? 'bg-black/60 border-white/10 text-gray-200' 
                  : 'bg-gray-50 border-black/10 text-gray-800'
              }`}
            >
              <span>{sym}</span>
              <button 
                onClick={() => setWatchlist(w => w.filter(s => s !== sym))} 
                className="ml-2 w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500/20 text-red-400 text-xs"
                title="Remove symbol"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {/* Symbol Search Bar */}
        <div className="relative flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Type ticker or name (e.g. RELIANCE, SBIN, TCS, BTC)..."
              className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border transition-all ${
                isDark 
                  ? 'bg-black/50 border-white/10 text-white focus:border-emerald-400' 
                  : 'bg-white border-black/10 text-black focus:border-emerald-500'
              } focus:outline-none`}
            />
            {showDropdown && searchResults.length > 0 && (
              <div className={`absolute z-50 top-full mt-1 w-full max-h-64 overflow-y-auto rounded-xl border shadow-2xl ${
                isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-black/10'
              }`}>
                {searchResults.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectSymbol(item.symbol)}
                    className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${
                      isDark ? 'hover:bg-white/10 border-b border-white/5' : 'hover:bg-gray-100 border-b border-gray-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold font-mono text-xs">{item.symbol}</div>
                      <div className="text-[11px] opacity-70 truncate">{item.name}</div>
                    </div>
                    <div className="text-[10px] font-bold opacity-60 px-2 py-0.5 rounded border border-current">
                      {item.exchange}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (newSymbol.trim()) {
                handleSelectSymbol(newSymbol.trim());
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              isDark ? 'bg-white/10 hover:bg-white/15 border-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 border-black/10 text-black'
            }`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Error alert */}
      {scanError && (
        <div className="p-4 mb-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Skipped symbols notice */}
      {skippedSymbols.length > 0 && (
        <div className={`p-4 mb-6 rounded-xl border text-xs flex items-center gap-2 ${
          isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-amber-400/50 bg-amber-50 text-amber-800'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Skipped (no live data): {skippedSymbols.join(', ')}</span>
        </div>
      )}

      {/* Scanner Results List */}
      <div className="w-full">
        <div className={`w-full border rounded-2xl p-4 sm:p-6 ${isDark ? 'border-white/10 bg-[#121212]' : 'border-black/10 bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black flex items-center text-sm sm:text-base tracking-tight">
              <Activity className="w-4 h-4 mr-2 text-emerald-400" /> 
              Real-Time Scan Output & Factor Ratings ({results.length})
            </h2>
            {results.length > 0 && (
              <span className="text-[10px] text-gray-400 font-mono">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {results.length === 0 && !scanning && (
            <div className="text-sm opacity-60 flex flex-col items-center justify-center py-16 text-center">
              <Radar className="w-12 h-12 mb-3 text-emerald-500/40 animate-pulse" />
              {hasScanned ? (
                <p className="font-bold text-sm">No live data available right now.</p>
              ) : (
                <>
                  <p className="font-bold text-sm">Ready to scan live market data.</p>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">
                    Click "Scan Watchlist Now" to evaluate trend strength, volume expansion, risk-reward ratios, and price action across your watchlist.
                  </p>
                </>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            {results.map((r, idx) => {
              const breakdown = r.scoreBreakdown || {};
              const price = breakdown.price;
              const changePct = breakdown.changePct ?? 0;
              const isPositive = changePct >= 0;
              const rvol = breakdown.rvol;
              const currencySym = breakdown.currency === 'USD' ? '$' : '₹';

              const factorRatings = [
                { label: 'Trend Strength', val: breakdown.trend, color: 'text-blue-400' },
                { label: 'Volume (RVOL)', val: breakdown.volume, color: 'text-emerald-400' },
                { label: 'Catalyst / Volatility', val: breakdown.catalyst, color: 'text-purple-400' },
                { label: 'Risk / Reward', val: breakdown.rr, color: 'text-amber-400' },
                { label: 'Cleanliness', val: breakdown.cleanliness, color: 'text-teal-400' },
              ];

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.08 }} 
                  key={r.id || idx} 
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isDark 
                      ? 'border-white/10 bg-black/40 hover:border-emerald-500/40' 
                      : 'border-black/10 bg-gray-50/80 hover:border-emerald-500/40'
                  }`}
                >
                  {/* Top Row: Symbol, Price, Change, Overall Score & Setup Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-black text-lg sm:text-xl font-mono">{r.symbol}</h3>
                        
                        {price !== undefined && (
                          <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black">
                            <span>{currencySym}{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center ${
                              isPositive 
                                ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                                : (isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-700')
                            }`}>
                              {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
                            </span>
                          </div>
                        )}

                        {breakdown.setupType && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {breakdown.setupType}
                          </span>
                        )}
                      </div>

                      {/* Technical Key Data Line */}
                      <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 mt-1 flex-wrap">
                        <span>RVOL: <b className="text-emerald-400">{rvol !== null && rvol !== undefined ? `${rvol}x` : '—'}</b></span>
                        {breakdown.dayLow !== undefined && breakdown.dayHigh !== undefined && (
                          <span>Range: {currencySym}{breakdown.dayLow} - {currencySym}{breakdown.dayHigh}</span>
                        )}
                        {breakdown.support && (
                          <span>Support: {currencySym}{breakdown.support}</span>
                        )}
                        {breakdown.resistance && (
                          <span>Resistance: {currencySym}{breakdown.resistance}</span>
                        )}
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-xl border text-center ${
                        r.score >= 8 
                          ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800')
                          : r.score >= 6
                          ? (isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-800')
                          : (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-800')
                      }`}>
                        <div className="text-[9px] uppercase tracking-widest font-bold opacity-70">Conviction</div>
                        <div className="text-base sm:text-lg font-black">{r.score}/10</div>
                      </div>

                      {r.riskPassed && (
                        <div className="hidden sm:flex items-center text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          Risk Pass
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 5-Factor Quantitative Score Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3.5">
                    {factorRatings.map((f, fIdx) => (
                      <div 
                        key={fIdx} 
                        className={`p-2.5 rounded-xl border ${
                          isDark ? 'bg-black/30 border-white/5' : 'bg-white border-black/5 shadow-xs'
                        }`}
                      >
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold truncate mb-1">
                          {f.label}
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className={`font-black text-sm ${f.color}`}>{f.val !== null && f.val !== undefined ? `${f.val}/10` : '—'}</span>
                          {f.val !== null && f.val !== undefined && (
                            <div className="w-12 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full ${f.val >= 7 ? 'bg-emerald-400' : f.val >= 5 ? 'bg-blue-400' : 'bg-amber-400'}`} 
                                style={{ width: `${f.val * 10}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Institutional Research & Setup Notes */}
                  <div className={`p-3 rounded-xl text-xs ${
                    isDark ? 'bg-black/40 border border-white/5' : 'bg-white border border-black/5 shadow-xs'
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3 leading-relaxed`}>
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 mt-0.5 opacity-60 text-emerald-400 shrink-0" />
                      <p className="text-gray-300 dark:text-gray-300 text-[11px] sm:text-xs">
                        {r.researchNotes || breakdown.research_notes}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAskCopilot(r.symbol, breakdown.setupType)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center justify-center gap-1 shrink-0 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" />
                      Plan Trade in Copilot
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
