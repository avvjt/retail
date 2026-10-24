import React, { useState, useEffect } from 'react';
import { Layers, Info, CheckCircle2, ChevronRight, Gauge, Activity, ShieldAlert, Clock, LineChart as ChartIcon } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, AreaChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ChartAiOverviewInsights from './ChartAiOverviewInsights';

export default function OptionChainIntel({ theme }) {
  const isDark = theme === 'dark';
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive strategy state for risk visualizer
  const [selectedStrategy, setSelectedStrategy] = useState('LongCall');

  useEffect(() => {
    fetchOptionChain(true);
    const interval = setInterval(() => {
      fetchOptionChain(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchOptionChain = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/options/snapshots?symbol=${symbol}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch option chain snapshot');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred loading option chain.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Determine ATM strike dynamically from data or fallback
  const getAtmStrike = () => {
    if (data?.maxPain) return data.maxPain;
    if (data?.strikes && data.strikes.length > 0) {
      const mid = Math.floor(data.strikes.length / 2);
      return data.strikes[mid]?.strikePrice || (symbol === 'NIFTY' ? 23400 : 54000);
    }
    return symbol === 'NIFTY' ? 23400 : 54000;
  };

  const isATM = (strike) => {
    const atm = getAtmStrike();
    return Math.abs(strike - atm) < (symbol === 'NIFTY' ? 30 : 60);
  };

  const getPcrColor = (pcr) => {
    if (pcr > 1.15) return 'text-emerald-500';
    if (pcr < 0.85) return 'text-red-500';
    return isDark ? 'text-yellow-400' : 'text-amber-600';
  };

  // Strategy Payoff calculations at Expiry
  const riskProfileData = (() => {
    const isNifty = symbol === 'NIFTY';
    const atm = getAtmStrike();
    const step = isNifty ? 50 : 200;
    const startPrice = atm - (step * 4);
    const endPrice = atm + (step * 4);
    
    const profile = [];
    for (let price = startPrice; price <= endPrice; price += step) {
      let pnl = 0;
      if (selectedStrategy === 'LongCall') {
        const premium = isNifty ? 150 : 450;
        pnl = Math.max(-premium, (price - atm) - premium);
      } else if (selectedStrategy === 'LongPut') {
        const premium = isNifty ? 140 : 420;
        pnl = Math.max(-premium, (atm - price) - premium);
      } else if (selectedStrategy === 'ShortStraddle') {
        const premium = isNifty ? 290 : 870;
        pnl = premium - Math.abs(price - atm);
      } else if (selectedStrategy === 'BullCallSpread') {
        const premiumPaid = isNifty ? 150 : 450;
        const premiumReceived = isNifty ? 60 : 180;
        const netDebit = premiumPaid - premiumReceived;
        const otmStrike = atm + step;
        const profitAtExpiry = Math.min(otmStrike - atm, Math.max(0, price - atm)) - netDebit;
        pnl = profitAtExpiry;
      }
      
      const lotSize = isNifty ? 50 : 15;
      const totalPnl = Math.round(pnl * lotSize);
      
      profile.push({
        price: price.toLocaleString(),
        pnl: totalPnl,
        zero: 0
      });
    }
    return profile;
  })();

  const glassCard = `p-6 rounded-3xl border transition-all duration-300 ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-lg' 
      : 'bg-white border-black/5 shadow-sm'
  }`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Selector and stats */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#c8f135]/10 text-[#c8f135]' : 'bg-black/5 text-black'}`}>
            <Layers size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">Options Intelligence</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Derived Open Interest (OI), Max Pain calculation, Delta/Greeks interpretation, and structural liquidity boundaries.
            </p>
          </div>
        </div>

        {/* Index switcher */}
        <div className="flex items-center gap-2">
          {['NIFTY', 'BANKNIFTY'].map((idx) => (
            <button
              key={idx}
              onClick={() => setSymbol(idx)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                symbol === idx
                  ? (isDark ? 'bg-white text-black shadow-lg shadow-white/5' : 'bg-black text-white shadow-lg')
                  : (isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }`}
            >
              {idx}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-500">
          {error}
        </div>
      ) : data?.unavailable || !data?.strikes || data.strikes.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center ${isDark ? 'bg-[#111] border-white/10 text-gray-400' : 'bg-white border-black/5 text-gray-600'}`}>
          <p className="text-base font-medium">Data unavailable</p>
          <p className="text-xs mt-1 text-gray-500">Live option chain data is currently unavailable for {symbol}.</p>
        </div>
      ) : data && (
        <div className="space-y-6">
          {/* Market Offline Notice (if closed) */}
          {data.marketClosed && (
            <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex items-center gap-4 font-sans shadow-md ${
              isDark 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' 
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              <Clock size={22} className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} shrink-0`} />
              <div>
                <div className="font-bold text-sm uppercase tracking-wider">OFF-MARKET HOURS • LATEST SESSION SNAPSHOT</div>
                <div className="text-xs opacity-90">{data.message || "Displaying the latest synchronized option chain snapshot with real Greeks and Max Pain analytics."}</div>
              </div>
            </div>
          )}

          {/* PCR Dashboard widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Put-Call Ratio (PCR)</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${getPcrColor(data.pcr)}`}>{data.pcr}</span>
                <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{data.structureStatus || 'Balanced OI'}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {data.pcrInterpretation || "Put and Call Open Interest distribution across active option contracts."}
              </p>
            </div>
            
            <div className={`p-6 rounded-3xl border md:col-span-2 flex items-center justify-between ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
              <div className="text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Max Pain & OI Buildup Structure</span>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
                  {symbol} Max Pain calculated at strike <strong className={isDark ? "text-[#c8f135]" : "text-emerald-700"}>₹{(data.maxPain || (symbol === 'NIFTY' ? 24000 : 58000)).toLocaleString('en-IN')}</strong>.
                </p>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {data.maxPainInterpretation || "The strike price where aggregate option payout at expiration is minimized."}
                </p>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {data.oiBuildupInterpretation || "Upper Call OI and Lower Put OI concentrations define structural liquidity boundaries."}
                </p>
              </div>
              <div className="text-xs text-right pl-4 shrink-0">
                <span className="text-gray-400 block">Snapshot Sync</span>
                <span className="font-bold">{new Date(data.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Analysis & Compliance Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={glassCard}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                <Gauge size={16} className={isDark ? "text-[#c8f135]" : "text-emerald-600"} /> Open Interest Distribution Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Put-Call Ratio (PCR)</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.pcr}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Neutral Classification</span>
                  <span className={`font-bold px-2 py-1 rounded text-[11px] ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  } ${
                    data.pcr > 1.15 ? 'text-emerald-500' : data.pcr < 0.85 ? 'text-red-500' : (isDark ? 'text-yellow-400' : 'text-amber-700')
                  }`}>
                    {data.pcr > 1.15 ? 'Elevated Put Writing' : data.pcr < 0.85 ? 'Elevated Call Writing' : 'Balanced'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 leading-relaxed pt-2">
                  An option chain is a balanced system. <strong>Elevated Put Writing</strong> indicates concentrations in put selling (often a support base), whereas <strong>Elevated Call Writing</strong> shows high concentrations in call options (often a resistance base). Standard zones are classified as <strong>Balanced</strong>.
                </div>
              </div>
            </div>

            <div className={glassCard}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-400" /> Regulatory and Risk Disclosure
              </h3>
              <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
                <p>
                  This system processes real-time and historical Option Greeks directly from the licensed Angel One gateway where active client connections exist.
                </p>
                <p>
                  <strong>No Directional Calls:</strong> All metadata classifications, Max Pain computations, and implied volatility matrices are purely mathematical indicators and do not contain bullish, bearish, buy, or sell trading recommendations.
                </p>
                <p>
                  Option trading involves substantial risk of loss and is not suitable for every investor. Please utilize the strategy payoff simulator below to analyze risk boundaries before taking action.
                </p>
              </div>
            </div>
          </div>

          {/* Strategy Risk Profile Visualizer */}
          <div className={glassCard}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-indigo-400" /> Option Strategy Payoff Risk Visualizer (Expiry)
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Simulate maximum risk, reward and breakeven boundaries.
                </p>
              </div>

              {/* Strategy Select */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'LongCall', label: 'Long Call 🟢' },
                  { id: 'LongPut', label: 'Long Put 🔴' },
                  { id: 'ShortStraddle', label: 'Short Straddle ⚡' },
                  { id: 'BullCallSpread', label: 'Bull Call Spread 🐂' },
                ].map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => setSelectedStrategy(strat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedStrategy === strat.id
                        ? (isDark ? 'bg-[#c8f135] text-black shadow-md shadow-[#c8f135]/10' : 'bg-black text-white')
                        : (isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                    }`}
                  >
                    {strat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskProfileData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <XAxis dataKey="price" stroke={isDark ? "#ccc" : "#333"} fontSize={10} />
                  <YAxis stroke={isDark ? "#ccc" : "#333"} fontSize={10} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Estimated P&L']} />
                  <Area type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={3} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Option Chain Grid */}
          <div className={`p-6 rounded-3xl border overflow-hidden ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className="font-bold text-sm mb-4">Interactive Greeks & Volume Matrix</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse min-w-[700px]">
                <thead>
                  {/* Header Row 1 */}
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${isDark ? 'border-white/10 text-gray-400' : 'border-black/5 text-gray-500'}`}>
                    <th colSpan={3} className="pb-2 text-right pr-6 bg-red-500/5">CALL OPTIONS (Delta, IV, OI)</th>
                    <th className="pb-2 text-center">STRIKE</th>
                    <th colSpan={3} className="pb-2 text-left pl-6 bg-emerald-500/5">PUT OPTIONS (OI, IV, Delta)</th>
                  </tr>
                  {/* Header Row 2 */}
                  <tr className={`border-b text-xs font-bold text-gray-500 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <th className="py-2 pr-2 text-right bg-red-500/5">Delta (Δ)</th>
                    <th className="py-2 text-right bg-red-500/5">IV</th>
                    <th className="py-2 pr-4 text-right bg-red-500/5">Call OI</th>
                    
                    <th className="py-2 font-black text-gray-400 text-center">Strike Price</th>
                    
                    <th className="py-2 pl-4 text-left bg-emerald-500/5">Put OI</th>
                    <th className="py-2 text-left bg-emerald-500/5">IV</th>
                    <th className="py-2 pl-2 text-left bg-emerald-500/5">Delta (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent text-xs font-mono">
                  {data.strikes.map((s) => {
                    const isATMStrike = isATM(s.strikePrice);
                    const callDelta = s.callDeltaOi / 1000;
                    const putDelta = s.putDeltaOi / 1000;
                    const callChgPositive = callDelta >= 0;
                    const putChgPositive = putDelta >= 0;

                    return (
                       <tr 
                        key={s.id} 
                        className={`hover:bg-white/5 border-b transition-colors ${
                          isATMStrike 
                            ? (isDark ? 'bg-[#c8f135]/15 border-[#c8f135]/40 text-white' : 'bg-emerald-50 border-emerald-300 text-gray-900 font-semibold') 
                            : (isDark ? 'border-white/5' : 'border-black/5')
                        }`}
                      >
                        {/* Call Delta */}
                        <td className={`py-3.5 pr-2 text-right bg-red-500/5 ${callChgPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {callDelta > 0 ? '+' : ''}{callDelta.toFixed(3)}
                        </td>
                        {/* Call IV */}
                        <td className="py-3.5 text-right text-gray-400 bg-red-500/5">{s.callIv}%</td>
                        {/* Call Volume & Visual OI Bar */}
                        <td className="py-3.5 pr-4 text-right font-bold text-red-400 bg-red-500/5 relative">
                          <div 
                            className="absolute top-1.5 bottom-1.5 right-0 bg-red-500/15 rounded-l pointer-events-none"
                            style={{ width: `${Math.min(100, Math.max(8, (s.callOi / 250000) * 100))}%` }}
                          />
                          <span className="relative z-10">{s.callOi.toLocaleString()}</span>
                        </td>

                        {/* Strike */}
                        <td className={`py-3.5 font-bold text-center text-sm font-sans ${isATMStrike ? (isDark ? 'text-[#c8f135]' : 'text-emerald-800 font-black') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                          {s.strikePrice.toLocaleString()} {isATMStrike && '⭐'}
                        </td>

                        {/* Put Volume & Visual OI Bar */}
                        <td className="py-3.5 pl-4 text-left font-bold text-emerald-400 bg-emerald-500/5 relative">
                          <div 
                            className="absolute top-1.5 bottom-1.5 left-0 bg-emerald-500/15 rounded-r pointer-events-none"
                            style={{ width: `${Math.min(100, Math.max(8, (s.putOi / 250000) * 100))}%` }}
                          />
                          <span className="relative z-10">{s.putOi.toLocaleString()}</span>
                        </td>
                        {/* Put IV */}
                        <td className="py-3.5 text-left text-gray-400 bg-emerald-500/5">{s.putIv}%</td>
                        {/* Put Delta */}
                        <td className={`py-3.5 pl-2 text-left bg-emerald-500/5 ${putChgPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {putDelta > 0 ? '+' : ''}{putDelta.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 AI Overview Downside the Charts & 🧠 Insights | 📰 News & Analysis */}
      <ChartAiOverviewInsights symbol={symbol} theme={theme} />

      {/* Required Disclaimer */}
      <div className={`p-4 rounded-xl border text-center text-xs ${isDark ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-gray-100 border-black/5 text-gray-500'}`}>
        Educational information, not investment advice.
      </div>
    </div>
  );
}
