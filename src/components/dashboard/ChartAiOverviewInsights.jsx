import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Layers, 
  Newspaper, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Activity, 
  Sparkles, 
  BarChart3, 
  Flame, 
  Globe, 
  Info
} from 'lucide-react';

export default function ChartAiOverviewInsights({ symbol = "NIFTY50", theme = "dark" }) {
  const isDark = theme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'news'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchChartIntelligence = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/market/chart-intelligence?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch chart intelligence:", err);
    } finally {
      if (showSpinner) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChartIntelligence(true);
    const interval = setInterval(() => {
      fetchChartIntelligence(false);
    }, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [symbol]);

  // High contrast theme classes
  const cardBg = isDark ? 'bg-[#151518] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const innerCardBg = isDark ? 'bg-zinc-900/60 border-white/5' : 'bg-slate-50 border-slate-200';
  const miniBoxBg = isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-xs';
  const textMuted = isDark ? 'text-zinc-400' : 'text-slate-500';

  if (loading && !data) {
    return (
      <div className={`mt-4 p-6 rounded-2xl border ${cardBg} animate-pulse`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20" />
          <div className="h-5 w-48 bg-slate-300 dark:bg-zinc-700/30 rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-200 dark:bg-zinc-700/20 rounded" />
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-700/20 rounded" />
          <div className="h-20 w-full bg-slate-100 dark:bg-zinc-700/10 rounded-xl mt-4" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const displayName = data.displayName || symbol;
  const priceData = data.priceData || {};
  const sentiment = data.sentiment || {};
  const aiOverview = data.aiOverview || {};
  const technicalScores = data.technicalScores || {};
  const keyLevels = data.keyLevels || {};
  const newsAndAnalysis = Array.isArray(data.newsAndAnalysis) ? data.newsAndAnalysis : [];
  const fundamentalAnalysis = data.fundamentalAnalysis || {};
  const hasKeyReasons = Array.isArray(aiOverview.keyReasons) && aiOverview.keyReasons.length > 0;
  const hasMacroFactors = Array.isArray(aiOverview.macroFactors) && aiOverview.macroFactors.length > 0;
  const hasUpcomingEvents = Array.isArray(aiOverview.upcomingEvents) && aiOverview.upcomingEvents.length > 0;
  const formattedTime = data.formattedTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const numChange = Number(priceData.change || 0);
  const isPriceUp = numChange >= 0;
  const numPercentChange = Number(priceData.percentChange || 0);
  const currentPrice = Number(priceData.currentPrice || 0);
  // Day range and levels come from the real quote; when missing they are shown as "—" (never as 0 or the current price).
  const dayLow = priceData.dayLow != null ? Number(priceData.dayLow) : null;
  const dayHigh = priceData.dayHigh != null ? Number(priceData.dayHigh) : null;
  const hasDayRange = dayLow !== null && dayHigh !== null;
  const rangePositionPercent = priceData.rangePositionPercent != null
    ? Math.min(100, Math.max(0, Number(priceData.rangePositionPercent)))
    : null;
  const fmtLevel = (v) => (typeof v === 'number' && Number.isFinite(v)) ? `₹${v.toLocaleString('en-IN')}` : '—';
  const sentimentLabel = sentiment.label || (isPriceUp ? "Positive Momentum" : "Negative Momentum");

  return (
    <div className="mt-5 space-y-5" id="chart_ai_intelligence_module">
      {/* 1. 🤖 AI Overview Downside the Charts */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg} relative overflow-hidden`}>
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
                  AI Market Overview
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  {displayName}
                </span>
              </div>
              <p className={`text-xs font-medium ${textMuted}`}>
                Summary computed from live price data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchChartIntelligence(false)}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isDark 
                  ? 'border-white/10 hover:bg-white/10 text-zinc-300' 
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-xs'
              }`}
              title="Refresh AI Analysis"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-400'} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className={`flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border ${
              isDark ? 'border-white/5 bg-white/5 text-zinc-400' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}>
              <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Updated {formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Narrative Box */}
        <div className={`p-4 rounded-xl border mb-4 ${
          isDark 
            ? 'bg-zinc-900/60 border-white/5' 
            : 'bg-indigo-50/60 border-indigo-200/80'
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Recent Price Movement & Momentum
              </span>
              <p className="text-xs sm:text-sm leading-relaxed font-semibold text-slate-800 dark:text-zinc-200">
                {aiOverview.recentPriceMovement || "Summary unavailable."}
              </p>
            </div>
          </div>
        </div>

        {/* 3-Column Factors Grid (only when there is real content) */}
        {(hasKeyReasons || hasMacroFactors || hasUpcomingEvents) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Key Reasons */}
          {hasKeyReasons && (
          <div className={`p-4 rounded-xl border transition-all ${
            isDark 
              ? 'bg-zinc-900/60 border-white/5 text-zinc-300' 
              : 'bg-emerald-50/60 border-emerald-200 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 mb-3 text-emerald-700 dark:text-emerald-400">
              <Activity size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Key Reasons Behind Move
              </h3>
            </div>
            <ul className="space-y-2.5">
              {Array.isArray(aiOverview.keyReasons) && aiOverview.keyReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1 shrink-0" />
                  <span className="leading-snug font-medium">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          )}

          {/* Macro & Fundamental Factors */}
          {hasMacroFactors && (
          <div className={`p-4 rounded-xl border transition-all ${
            isDark 
              ? 'bg-zinc-900/60 border-white/5 text-zinc-300' 
              : 'bg-blue-50/60 border-blue-200 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
              <Globe size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Macro & Global Drivers
              </h3>
            </div>
            <ul className="space-y-2.5">
              {Array.isArray(aiOverview.macroFactors) && aiOverview.macroFactors.map((macro, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1 shrink-0" />
                  <span className="leading-snug font-medium">{macro}</span>
                </li>
              ))}
            </ul>
          </div>
          )}

          {/* Upcoming Events / Data */}
          {hasUpcomingEvents && (
          <div className={`p-4 rounded-xl border transition-all ${
            isDark 
              ? 'bg-zinc-900/60 border-white/5 text-zinc-300' 
              : 'bg-amber-50/60 border-amber-200 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400">
              <Calendar size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Upcoming Catalyst Events
              </h3>
            </div>
            <div className="space-y-2">
              {Array.isArray(aiOverview.upcomingEvents) && aiOverview.upcomingEvents.map((evt, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-amber-200/80 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="truncate pr-2 text-slate-900 dark:text-zinc-200">{evt.name}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      evt.impact === 'High' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                    }`}>
                      {evt.impact}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium mt-0.5">{evt.date}</div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        )}
      </div>

      {/* 2. 🧠 Insights | 📰 News & Analysis (Tabbed Section) */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg}`}>
        {/* Tab Selector Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'insights'
                  ? 'bg-white dark:bg-[#222228] text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Brain size={15} className="text-indigo-600 dark:text-indigo-400" />
              🧠 Insights & Market Analytics
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'news'
                  ? 'bg-white dark:bg-[#222228] text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Newspaper size={15} className="text-blue-600 dark:text-blue-400" />
              📰 News & Economic Analysis
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-zinc-400">
            <span>Pair/Security:</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-400">{displayName}</span>
            <span>• Spot:</span>
            <span className="font-bold text-slate-900 dark:text-zinc-100">₹{currentPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* TAB 1: 🧠 INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-5 animate-fade-in">
            {/* Row 1: Market Sentiment & Daily Price Change */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Market Sentiment Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">
                      Market Momentum
                    </h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isPriceUp 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30' 
                      : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30'
                  }`}>
                    {sentimentLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={`flex items-center gap-1 ${isPriceUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {isPriceUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      Session Trend: {isPriceUp ? 'Positive Momentum' : 'Negative Momentum'}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">
                      {isPriceUp ? '+' : ''}{numPercentChange.toFixed(2)}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                    Momentum structure derived directly from live intraday price movement, range positioning, and moving average alignment.
                  </p>
                </div>
              </div>

              {/* Daily Price Change & Range Position */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">
                      Daily Price Change & Range
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-black ${isPriceUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {isPriceUp ? '+' : ''}{numChange.toFixed(2)} ({isPriceUp ? '+' : ''}{numPercentChange.toFixed(2)}%)
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border ${miniBoxBg}`}>
                      <span className="text-slate-500 dark:text-zinc-400 text-[10px] block font-semibold">Day's Low</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{fmtLevel(dayLow)}</span>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${miniBoxBg}`}>
                      <span className="text-slate-500 dark:text-zinc-400 text-[10px] block font-semibold">Day's High</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{fmtLevel(dayHigh)}</span>
                    </div>
                  </div>

                  {/* Range Slider / Position Indicator (only with a real day range) */}
                  {hasDayRange && rangePositionPercent !== null && (
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-zinc-400 mb-1">
                      <span>Low (0%)</span>
                      <span className="text-indigo-700 dark:text-indigo-400 font-bold">Position: {rangePositionPercent}% of Day Band</span>
                      <span>High (100%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 relative overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${rangePositionPercent}%` }}
                      />
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Technical Indicators (Short, Intermediate, Long Term) */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardBg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">
                    Multi-Timeframe Technical Analysis
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase">Trend Consensus</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Short-Term */}
                <div className={`p-3.5 rounded-xl border ${miniBoxBg}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-200">{technicalScores.shortTerm?.timeframe || "Short-Term"}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      technicalScores.shortTerm?.status === 'Positive Momentum' || technicalScores.shortTerm?.status === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : technicalScores.shortTerm?.status === 'Negative Momentum' || technicalScores.shortTerm?.status === 'Bearish'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                      {technicalScores.shortTerm?.status || "unavailable"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold mb-2">{technicalScores.shortTerm?.signal || "unavailable"}</p>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-0.5 font-medium">
                    <div>RSI(14): <span className="text-slate-900 dark:text-zinc-100 font-mono font-bold">{technicalScores.shortTerm?.indicators?.rsi14 ?? "unavailable"}</span></div>
                    <div>Pivot: <span className="text-slate-900 dark:text-zinc-100 font-mono font-bold">{technicalScores.shortTerm?.indicators?.vwapStatus ?? "unavailable"}</span></div>
                  </div>
                </div>

                {/* Intermediate-Term */}
                <div className={`p-3.5 rounded-xl border ${miniBoxBg}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-200">{technicalScores.intermediateTerm?.timeframe || "Intermediate-Term"}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      technicalScores.intermediateTerm?.status === 'Positive Momentum' || technicalScores.intermediateTerm?.status === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : technicalScores.intermediateTerm?.status === 'Negative Momentum' || technicalScores.intermediateTerm?.status === 'Bearish'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {technicalScores.intermediateTerm?.status || "unavailable"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold mb-2">{technicalScores.intermediateTerm?.signal || "unavailable"}</p>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-0.5 font-medium">
                    <div>50 SMA: <span className="text-slate-900 dark:text-zinc-100 font-mono font-bold">{technicalScores.intermediateTerm?.indicators?.sma50 && technicalScores.intermediateTerm?.indicators?.sma50 !== 'unavailable' ? `₹${technicalScores.intermediateTerm.indicators.sma50}` : "unavailable"}</span></div>
                    <div>MACD: <span className="text-slate-900 dark:text-zinc-100 font-mono font-bold">{technicalScores.intermediateTerm?.indicators?.macdHistogram || "unavailable"}</span></div>
                  </div>
                </div>

                {/* Long-Term */}
                <div className={`p-3.5 rounded-xl border ${miniBoxBg}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-200">{technicalScores.longTerm?.timeframe || "Long-Term"}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      technicalScores.longTerm?.status === 'Positive Momentum' || technicalScores.longTerm?.status === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : technicalScores.longTerm?.status === 'Negative Momentum' || technicalScores.longTerm?.status === 'Bearish'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {technicalScores.longTerm?.status || "unavailable"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold mb-2">{technicalScores.longTerm?.signal || "unavailable"}</p>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-0.5 font-medium">
                    <div>200 EMA: <span className="text-slate-900 dark:text-zinc-100 font-mono font-bold">{technicalScores.longTerm?.indicators?.ema200 && technicalScores.longTerm?.indicators?.ema200 !== 'unavailable' ? `₹${technicalScores.longTerm.indicators.ema200}` : "unavailable"}</span></div>
                    <div>Macro Structure: <span className="text-slate-900 dark:text-zinc-100 font-mono font-bold">{technicalScores.longTerm?.indicators?.macroTrend || "unavailable"}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Key Levels (Support & Resistance) */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">
                    Institutional Pivot & Key Levels
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                  Range: {keyLevels.immediateRange || "unavailable"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center font-mono">
                {/* S3 */}
                <div className="p-2.5 rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 block">S3 Floor</span>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300">{fmtLevel(keyLevels.s3)}</span>
                </div>
                {/* S2 */}
                <div className="p-2.5 rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 block">S2 Support</span>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300">{fmtLevel(keyLevels.s2)}</span>
                </div>
                {/* S1 */}
                <div className="p-2.5 rounded-xl border border-rose-400 bg-rose-100/70 dark:border-rose-500/40 dark:bg-rose-500/15">
                  <span className="text-[10px] font-black text-rose-800 dark:text-rose-400 block">S1 Support</span>
                  <span className="text-xs font-black text-rose-950 dark:text-rose-300">{fmtLevel(keyLevels.s1)}</span>
                </div>
                {/* PIVOT */}
                <div className="p-2.5 rounded-xl border border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/15">
                  <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 block">Central Pivot</span>
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">{fmtLevel(keyLevels.pivot)}</span>
                </div>
                {/* R1 */}
                <div className="p-2.5 rounded-xl border border-emerald-400 bg-emerald-100/70 dark:border-emerald-500/40 dark:bg-emerald-500/15">
                  <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 block">R1 Resist</span>
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-300">{fmtLevel(keyLevels.r1)}</span>
                </div>
                {/* R2 */}
                <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block">R2 Target</span>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">{fmtLevel(keyLevels.r2)}</span>
                </div>
                {/* R3 */}
                <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block">R3 Ceiling</span>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">{fmtLevel(keyLevels.r3)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 📰 NEWS & ECONOMIC ANALYSIS */}
        {activeTab === 'news' && (
          <div className="space-y-5 animate-fade-in">
            {/* Fundamental Summary Metrics */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardBg}`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                <Info size={14} /> Fundamental Valuation & Institutional Flow
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono text-xs">
                <div className={`p-2.5 rounded-xl border ${miniBoxBg}`}>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 block font-semibold">Index P/E</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-200">{fundamentalAnalysis.peRatio || "Data unavailable"}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${miniBoxBg}`}>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 block font-semibold">P/B Ratio</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-200">{fundamentalAnalysis.pbRatio || "Data unavailable"}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${miniBoxBg}`}>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 block font-semibold">Div Yield</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-200">{fundamentalAnalysis.dividendYield || "Data unavailable"}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${miniBoxBg} sm:col-span-2`}>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 block font-semibold">Market Breadth</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-200">{fundamentalAnalysis.advanceDeclineRatio || "Data unavailable"}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${miniBoxBg}`}>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 block font-semibold">FII/DII Net</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-200">Data unavailable</span>
                </div>
              </div>
            </div>

            {/* Market-Moving News List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-300 flex items-center gap-1.5">
                <Newspaper size={14} className="text-blue-700 dark:text-blue-400" /> Market-Moving Headlines & Impact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {newsAndAnalysis.map((news, idx) => (
                  <div key={news.id || `news-${idx}`} className={`p-4 rounded-xl border transition-all ${
                    isDark 
                      ? 'bg-zinc-900/60 border-white/5 hover:border-indigo-500/40' 
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-400 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        {news.category || "Markets"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          news.impact === 'High' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20'
                        }`}>
                          {news.impact || "Medium"} Impact
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono font-medium">{news.timeAgo || "Just now"}</span>
                      </div>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1 leading-snug">
                      {news.title || "Market Update"}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-zinc-400 font-medium leading-relaxed mb-2">
                      {news.summary || ""}
                    </p>
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">Source: {news.publisher || "Market Feed"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
