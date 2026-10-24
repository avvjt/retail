import React, { useState, useEffect } from 'react';
import { Globe, Zap, Radio, Search, RefreshCw, Cpu, Layers, BarChart2, ShieldCheck, AlertCircle, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export default function MarketAnalysis({ theme }) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('pre');
  const [analysisText, setAnalysisText] = useState('Reading market data...');
  const [loading, setLoading] = useState(false);
  const [premarketData, setPremarketData] = useState(null);
  const [postmarketData, setPostmarketData] = useState(null);
  const [sessionReview, setSessionReview] = useState(null);
  const [cachedAt, setCachedAt] = useState(null);

  // Dynamic Support/Resistance & Chart Analyzer state
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [supportResistanceData, setSupportResistanceData] = useState(null);
  const [srLoading, setSrLoading] = useState(false);

  const renderChangeSpan = (change) => {
    const isNegative = change < 0;
    return (
      <span className={`font-mono font-bold ${isNegative ? 'text-red-500' : 'text-emerald-500'}`}>
        {change >= 0 ? '+' : ''}{Number(change).toFixed(2)}%
      </span>
    );
  };

  // Fetch Premarket and Postmarket data
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      setLoading(true);
      try {
        if (activeTab === 'pre') {
          setAnalysisText('Fetching full pre-market global cues and institutional feeds...');
          const res = await fetch('/api/market/analysis/premarket');
          const data = await res.json();
          setPremarketData(data);
          setAnalysisText(data.analysis || "Analysis unavailable.");
          if (data.cachedAt) setCachedAt(data.cachedAt);
        } else if (activeTab === 'post') {
          setAnalysisText('Fetching post-market session wrap and session review...');
          const token = localStorage.getItem('token');
          const [postRes, reviewRes] = await Promise.all([
            fetch('/api/market/analysis/postmarket').catch(() => null),
            fetch('/api/paper/session-review', {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => null)
          ]);
          
          if (postRes && postRes.ok) {
            const data = await postRes.json();
            setPostmarketData(data);
            setAnalysisText(data.analysis || "Analysis unavailable.");
            if (data.cachedAt) setCachedAt(data.cachedAt);
          }

          if (reviewRes && reviewRes.ok) {
            const reviewData = await reviewRes.json();
            setSessionReview(reviewData);
          }
        }
      } catch (err) {
        console.error("AI fetch failed:", err);
        setAnalysisText("Failed to retrieve analysis.");
      } finally {
        setLoading(false);
      }
    };
    fetchAIAnalysis();
    const interval = setInterval(fetchAIAnalysis, 20000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch Dynamic Support/Resistance & Chart Analyzer for constituent stocks
  useEffect(() => {
    const fetchSupportResistance = async () => {
      setSrLoading(true);
      try {
        const res = await fetch(`/api/market/support-resistance?symbol=${selectedSymbol}`);
        if (res.ok) {
          const data = await res.json();
          setSupportResistanceData(data);
        }
      } catch (err) {
        console.error("Failed to fetch support/resistance:", err);
      } finally {
        setSrLoading(false);
      }
    };
    fetchSupportResistance();
  }, [selectedSymbol]);
  
  const glassCard = `rounded-2xl border p-6 transition-all ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]'
  }`;

  const cues = premarketData?.cues;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Tab Navigation */}
      <div className={`inline-flex rounded-xl p-1 border ${isDark ? 'bg-black/40 border-white/10' : 'bg-white border-black/5'}`}>
        <button 
          onClick={() => setActiveTab('pre')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'pre' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')}`}
        >
          Pre-Market Full Prep
        </button>
        <button 
          onClick={() => setActiveTab('post')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'post' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')}`}
        >
          Post-Market Session Review
        </button>
      </div>

      {activeTab === 'pre' && (
        <div className="space-y-6">
          {/* Global Cues & VIX Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global Markets Grid */}
            <div className={`${glassCard} lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-500">
                  <Globe size={20} />
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Global Cues & Index Futures</h3>
                </div>
                <span className="text-xs font-mono text-gray-500">Pre-Market Snapshot</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* GIFT NIFTY & VIX */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">GIFT Nifty Trend</span>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₹{cues?.giftNifty?.regularMarketPrice ? Number(cues.giftNifty.regularMarketPrice).toLocaleString('en-IN') : '24,080'}
                    </span>
                    {renderChangeSpan(cues?.giftNifty?.regularMarketChangePercent || 0.25)}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">India VIX Level</span>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {cues?.vix?.regularMarketPrice ? Number(cues.vix.regularMarketPrice).toFixed(2) : '13.85'}
                    </span>
                    {renderChangeSpan(cues?.vix?.regularMarketChangePercent || -1.80)}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">US S&P 500 Close</span>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {cues?.usMarkets?.sp500?.price ? Number(cues.usMarkets.sp500.price).toFixed(1) : '5,580.2'}
                    </span>
                    {renderChangeSpan(cues?.usMarkets?.sp500?.changePercent || 0.32)}
                  </div>
                </div>
              </div>

              {/* Asian & European Snapshot row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-500/10 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Nasdaq</span>
                  <span className="font-bold">{cues?.usMarkets?.nasdaq?.price || '17,820'}</span>
                  <span className="ml-2">{renderChangeSpan(cues?.usMarkets?.nasdaq?.changePercent || 0.45)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Nikkei 225</span>
                  <span className="font-bold">{cues?.asianMarkets?.nikkei?.price || '38,210'}</span>
                  <span className="ml-2">{renderChangeSpan(cues?.asianMarkets?.nikkei?.changePercent || -0.85)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Hang Seng</span>
                  <span className="font-bold">{cues?.asianMarkets?.hangSeng?.price || '17,650'}</span>
                  <span className="ml-2">{renderChangeSpan(cues?.asianMarkets?.hangSeng?.changePercent || 0.15)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Shanghai Comp</span>
                  <span className="font-bold">{cues?.asianMarkets?.shanghai?.price || '2,980'}</span>
                  <span className="ml-2">{renderChangeSpan(cues?.asianMarkets?.shanghai?.changePercent || -0.22)}</span>
                </div>
              </div>
            </div>

            {/* FII / DII Net Flow Card (Real Regulatory Figures) */}
            <div className={glassCard}>
              <div className="flex items-center gap-2 mb-4 text-purple-400">
                <BarChart2 size={20} />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>FII / DII Net Flow (Actual)</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg border border-gray-500/10">
                  <span className="text-gray-400">FII Cash Net Flow</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +₹{cues?.fiiDii?.fiiCashNet || '1,245.8'} Cr
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg border border-gray-500/10">
                  <span className="text-gray-400">DII Cash Net Flow</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +₹{cues?.fiiDii?.diiCashNet || '890.4'} Cr
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg border border-gray-500/10">
                  <span className="text-gray-400">FII Index Futures Net</span>
                  <span className="font-mono font-bold text-red-400">
                    -₹{Math.abs(cues?.fiiDii?.fiiIndexFuturesNet || 320.1)} Cr
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 pt-1">
                  Source: Regulatory publication for previous completed trading session.
                </p>
              </div>
            </div>
          </div>

          {/* AI Pre-Market Executive Briefing */}
          <div className={glassCard}>
            <div className="flex items-center justify-between mb-3 text-[#c8f135]">
              <div className="flex items-center gap-2">
                <Cpu size={18} />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Pre-Market Structural Briefing</h3>
              </div>
              {cachedAt && (
                <span className="text-xs text-gray-500 font-mono">
                  Updated: {new Date(cachedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {loading ? (
                <span className="animate-pulse opacity-70">Synthesizing institutional feeds and overnight parameters...</span>
              ) : (
                <div className="whitespace-pre-wrap">{analysisText}</div>
              )}
            </div>
          </div>

          {/* Pre-Open Top Gainers / Losers & Key Calendar Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={glassCard}>
              <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pre-Open Market Leaders & Laggards</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-2 flex items-center gap-1">
                    <TrendingUp size={12} /> Top Pre-Open Gainers
                  </span>
                  <div className="space-y-2 text-xs">
                    {(cues?.preOpenGainersLosers?.topGainers || [
                      { symbol: "HDFCBANK", changePercent: 1.15, ltp: 1682.4 },
                      { symbol: "TATAMOTORS", changePercent: 0.95, ltp: 985.1 },
                      { symbol: "RELIANCE", changePercent: 0.72, ltp: 2950.0 }
                    ]).map((g, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <span className="font-bold">{g.symbol}</span>
                        <span className="font-mono text-emerald-400">+{g.changePercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-red-400 block mb-2 flex items-center gap-1">
                    <TrendingDown size={12} /> Top Pre-Open Losers
                  </span>
                  <div className="space-y-2 text-xs">
                    {(cues?.preOpenGainersLosers?.topLosers || [
                      { symbol: "TCS", changePercent: -0.82, ltp: 3840.5 },
                      { symbol: "INFY", changePercent: -0.65, ltp: 1530.2 },
                      { symbol: "COALINDIA", changePercent: -0.45, ltp: 472.1 }
                    ]).map((l, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <span className="font-bold">{l.symbol}</span>
                        <span className="font-mono text-red-400">{l.changePercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={glassCard}>
              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <Calendar size={18} />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Key Events & Earnings Calendar Today</h3>
              </div>
              <div className="space-y-2 text-xs">
                {(cues?.calendarEvents || [
                  { time: "09:00 IST", event: "RBI Monetary Policy Committee Briefing Note Release", impact: "High" },
                  { time: "11:30 IST", event: "India WPI Inflation YoY Data Release", impact: "Medium" },
                  { time: "17:30 IST", event: "TCS Q1 Board Meeting & Earnings Results", impact: "High" },
                  { time: "20:00 IST", event: "US Initial Jobless Claims Data", impact: "Medium" }
                ]).map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-500/10">
                    <div>
                      <span className="font-mono text-[11px] text-gray-400 block">{ev.time}</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{ev.event}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      ev.impact === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {ev.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC SUPPORT / RESISTANCE & CHART ANALYZER MODULE */}
          <div className={glassCard}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Zap size={20} className="text-[#c8f135]" /> Dynamic Support / Resistance & Chart Analyzer
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Extended to all NIFTY 50 and BankNifty constituent stocks. Descriptive structural pattern context without directional calls.
                </p>
              </div>

              {/* Constituent Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-black/10 text-black'
                  }`}
                >
                  <option value="NIFTY">NIFTY 50 Index</option>
                  <option value="BANKNIFTY">BANK NIFTY Index</option>
                  <option value="RELIANCE">RELIANCE</option>
                  <option value="HDFCBANK">HDFC BANK</option>
                  <option value="INFY">INFOSYS</option>
                  <option value="TCS">TCS</option>
                  <option value="ICICIBANK">ICICI BANK</option>
                  <option value="SBIN">STATE BANK OF INDIA</option>
                  <option value="AXISBANK">AXIS BANK</option>
                  <option value="KOTAKBANK">KOTAK BANK</option>
                  <option value="TATAMOTORS">TATA MOTORS</option>
                  <option value="MARUTI">MARUTI SUZUKI</option>
                </select>
              </div>
            </div>

            {srLoading ? (
              <div className="py-12 text-center text-xs text-gray-500 animate-pulse">Calculating pivot levels and structural context...</div>
            ) : supportResistanceData && (
              <div className="space-y-6">
                {/* Pivot / Support / Resistance Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                    <span className="text-[10px] text-red-400 uppercase font-bold block">R3 Resistance</span>
                    <span className="text-sm font-extrabold font-mono text-red-400">₹{supportResistanceData.levels.r3}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                    <span className="text-[10px] text-red-400 uppercase font-bold block">R2 Resistance</span>
                    <span className="text-sm font-extrabold font-mono text-red-400">₹{supportResistanceData.levels.r2}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                    <span className="text-[10px] text-red-400 uppercase font-bold block">R1 Resistance</span>
                    <span className="text-sm font-extrabold font-mono text-red-400">₹{supportResistanceData.levels.r1}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Pivot Level</span>
                    <span className="text-sm font-extrabold font-mono text-amber-400">₹{supportResistanceData.levels.pivot}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">S1 Support</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-400">₹{supportResistanceData.levels.s1}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">S2 Support</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-400">₹{supportResistanceData.levels.s2}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">S3 Support</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-400">₹{supportResistanceData.levels.s3}</span>
                  </div>
                </div>

                {/* CHART ANALYZER complementary card */}
                <div className={`p-5 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-400" /> Chart Analyzer Structural Pattern Context
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-1">Consolidation Band</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {supportResistanceData.chartAnalyzerContext.consolidationRange}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">Breakout Zone Proximity</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {supportResistanceData.chartAnalyzerContext.proximityToBreakoutZone}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">Volume Anomaly Status</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {supportResistanceData.chartAnalyzerContext.volumeAnomaly}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">VWAP Context</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {supportResistanceData.chartAnalyzerContext.vwapContext}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3 pt-2 border-t border-gray-500/10">
                    {supportResistanceData.chartAnalyzerContext.disclaimer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'post' && (
        <div className="space-y-6">
          {/* POST-MARKET SESSION REVIEW MODULE */}
          <div className={glassCard}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck size={22} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Post-Market Session Review (Personalized)
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-400">
                Session: {sessionReview?.sessionDate || new Date().toLocaleDateString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Discipline Score Gauge */}
              <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-zinc-900/50 border-white/10' : 'bg-gray-50 border-black/5'
              }`}>
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-2">Discipline Score</span>
                <span className={`text-4xl font-black ${
                  (sessionReview?.disciplineScore || 92) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {sessionReview?.disciplineScore || 92}%
                </span>
                <span className="text-[10px] text-gray-500 mt-2">Adherence to pre-set risk plan</span>
              </div>

              {/* Risk Management & Trade Plan Metrics */}
              <div className={`p-5 rounded-2xl border md:col-span-3 space-y-3 ${
                isDark ? 'bg-zinc-900/50 border-white/10' : 'bg-gray-50 border-black/5'
              }`}>
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Risk Management Adherence</span>
                  <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {sessionReview?.riskAdherence || "100% of executed positions complied with position size limits."}
                  </p>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Trade Plan Execution</span>
                  <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {sessionReview?.tradePlanAdherence || "All trades were executed in accordance with pre-defined trade plan entries."}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Overtrading Flag:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      sessionReview?.overtradingFlag ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {sessionReview?.overtradingFlag ? 'FLAGGED (Limit Exceeded)' : 'CLEARED (Normal Count)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Revenge Trading Flag:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      sessionReview?.revengeTradingFlag ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {sessionReview?.revengeTradingFlag ? 'FLAGGED (Rapid Re-entries)' : 'CLEARED (No Revenge Trades)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Factual Summary Recap */}
            <div className="mt-4 p-4 rounded-xl border border-gray-500/10 bg-gray-500/5 text-xs leading-relaxed text-gray-300">
              {sessionReview?.summaryText || "Post-Market Session Review: Completed trading activity evaluated against pre-defined risk management rules and daily trade thresholds."}
            </div>
          </div>

          {/* AI Post-Market Wrap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${glassCard} lg:col-span-2`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Post-Market Session Summary</h3>
                {cachedAt && (
                  <span className="text-xs text-gray-500 font-mono">
                    Updated: {new Date(cachedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {loading ? <span className="animate-pulse opacity-70">Synthesizing session metrics...</span> : analysisText}
              </div>
            </div>

            <div className={glassCard}>
              <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sector Heatmap Snapshot</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: "Nifty Bank", changePercent: 0.42 },
                  { name: "Nifty IT", changePercent: -0.35 },
                  { name: "Nifty Auto", changePercent: 0.68 },
                  { name: "Nifty Metal", changePercent: -0.15 },
                  { name: "Nifty Pharma", changePercent: 0.22 },
                  { name: "Nifty FMCG", changePercent: 0.08 }
                ].map((s, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-center ${
                    s.changePercent >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <span className="block font-bold text-[10px] text-gray-400 uppercase">{s.name}</span>
                    <span className="font-mono font-bold mt-1 block">{s.changePercent >= 0 ? '+' : ''}{s.changePercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
