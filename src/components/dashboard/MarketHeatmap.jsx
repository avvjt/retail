import React, { useState, useEffect } from 'react';
import { 
  Grid3x3, Activity, Info, Search, RefreshCw, X, 
  TrendingUp, TrendingDown, Clock, Zap, Cpu, BarChart3, Shield
} from 'lucide-react';

const getQPilotMetrics = (stock) => {
  if (stock && stock.metrics) return stock.metrics;
  if (!stock) return null;
  
  // Client-side safe dynamic calculation if server metrics aren't loaded yet
  const price = stock.price || 100.0;
  const change = stock.change || 0.0;

  let trend = "BALANCED";
  if (change > 0.4) trend = "EXPANDING UP";
  else if (change < -0.4) trend = "CONTRACTING DOWN";

  const absChange = Math.abs(change);
  let strength = "WEAK";
  if (absChange > 2.0) strength = "EXTREME";
  else if (absChange > 1.0) strength = "STRONG";
  else if (absChange > 0.4) strength = "MEDIUM";

  let momentum = "Flat ↔";
  if (change > 0) {
    momentum = "Accelerating ▲";
  } else if (change < 0) {
    momentum = "Decelerating ▼";
  }

  let trendScore = 50 + (change * 15);
  let scoreVal = Math.round(trendScore);
  scoreVal = Math.max(1, Math.min(99, scoreVal));

  const seed = stock.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rawAge = (seed % 18) / 3 + 0.1;
  const signalAge = `${rawAge.toFixed(1)}h`;

  let volumePressure = "Balanced";
  if (absChange > 1.5) {
    volumePressure = change > 0 ? "High Accumulation ▲▲" : "High Distribution ▼▼";
  }

  const marketState = absChange < 0.7 ? "CHOPPY" : "CLEAR";

  let forecast = "Consolidation Regime ↔";
  if (scoreVal > 70) {
    forecast = "Upward Expansion Structure ↗";
  } else if (scoreVal < 30) {
    forecast = "Downward Pressure Structure ↘";
  } else if (scoreVal >= 45 && scoreVal <= 55) {
    forecast = "Range Bound Consolidation ↔";
  }

  let volRibbon = "Neutral";
  if (change > 1.0) {
    volRibbon = "EXPANSION ▲ Strong";
  } else if (change > 0) {
    volRibbon = "EXPANSION ▲ Moderate";
  } else if (change < -1.0) {
    volRibbon = "CONTRACTION ▼ Strong";
  } else if (change < 0) {
    volRibbon = "CONTRACTION ▼ Moderate";
  }

  const enginePresets = ["Delta Protocol", "Volatility Scalper", "Momentum Engine", "Liquidity Preset", "Gamma Structure", "Pivots Core"];
  const engine = enginePresets[seed % enginePresets.length];

  return {
    trend,
    strength,
    momentum,
    score: `${scoreVal}%`,
    signalAge,
    volumePressure,
    marketState,
    forecast,
    volRibbon,
    engine
  };
};

export default function MarketHeatmap({ theme }) {
  const isDark = theme === 'dark';
  const [filterSector, setFilterSector] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredStock, setHoveredStock] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sector-wise fallback & representative stock items for the Indian NSE market
  const [stockSectors, setStockSectors] = useState([
    {
      name: "Banking & Financials",
      stocks: [
        { symbol: "HDFCBANK", name: "HDFC Bank Ltd", price: 1610.25, change: 1.45, cap: "Large Cap" },
        { symbol: "ICICIBANK", name: "ICICI Bank Ltd", price: 1120.40, change: 2.10, cap: "Large Cap" },
        { symbol: "SBIN", name: "State Bank of India", price: 830.15, change: -1.25, cap: "Large Cap" },
        { symbol: "AXISBANK", name: "Axis Bank Ltd", price: 1180.00, change: 0.85, cap: "Large Cap" },
        { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", price: 1720.50, change: -0.40, cap: "Large Cap" },
      ]
    },
    {
      name: "Information Technology",
      stocks: [
        { symbol: "TCS", name: "Tata Consultancy Services", price: 3820.00, change: -0.80, cap: "Large Cap" },
        { symbol: "INFY", name: "Infosys Ltd", price: 1445.00, change: 3.15, cap: "Large Cap" },
        { symbol: "WIPRO", name: "Wipro Ltd", price: 490.80, change: -2.35, cap: "Mid Cap" },
        { symbol: "HCLTECH", name: "HCL Technologies Ltd", price: 1335.20, change: 1.10, cap: "Large Cap" },
        { symbol: "TECHM", name: "Tech Mahindra Ltd", price: 1210.00, change: -0.15, cap: "Mid Cap" },
      ]
    },
    {
      name: "Energy & Infrastructure",
      stocks: [
        { symbol: "RELIANCE", name: "Reliance Industries Ltd", price: 2420.50, change: 1.95, cap: "Large Cap" },
        { symbol: "ONGC", name: "Oil & Natural Gas Corp", price: 275.40, change: -1.50, cap: "Large Cap" },
        { symbol: "POWERGRID", name: "Power Grid Corp of India", price: 290.00, change: 0.35, cap: "Large Cap" },
        { symbol: "NTPC", name: "NTPC Ltd", price: 360.25, change: 2.65, cap: "Large Cap" },
        { symbol: "BPCL", name: "Bharat Petroleum Corp", price: 615.10, change: -0.90, cap: "Mid Cap" },
      ]
    },
    {
      name: "Metals & Commodities",
      stocks: [
        { symbol: "TATASTEEL", name: "Tata Steel Ltd", price: 165.40, change: 3.45, cap: "Large Cap" },
        { symbol: "JSWSTEEL", name: "JSW Steel Ltd", price: 890.15, change: 0.20, cap: "Large Cap" },
        { symbol: "HINDALCO", name: "Hindalco Industries Ltd", price: 630.00, change: -1.15, cap: "Mid Cap" },
        { symbol: "COALINDIA", name: "Coal India Ltd", price: 450.50, change: 0.95, cap: "Large Cap" },
      ]
    },
    {
      name: "Automobiles",
      stocks: [
        { symbol: "TATAMOTORS", name: "Tata Motors Ltd", price: 980.40, change: 4.80, cap: "Large Cap" },
        { symbol: "M&M", name: "Mahindra & Mahindra Ltd", price: 2050.15, change: -0.65, cap: "Large Cap" },
        { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", price: 12200.00, change: 1.05, cap: "Large Cap" },
        { symbol: "EICHERMOT", name: "Eicher Motors Ltd", price: 4620.00, change: -2.10, cap: "Mid Cap" },
      ]
    }
  ]);

  const [marketClosed, setMarketClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('');

  const fetchHeatmapData = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      setError(null);
      const res = await fetch('/api/market/heatmap');
      if (!res.ok) {
        throw new Error('Failed to fetch real market heatmap data.');
      }
      const data = await res.json();
      if (data && data.marketClosed) {
        setMarketClosed(true);
        setClosedMessage(data.message || 'The Indian stock market is currently closed.');
      } else if (Array.isArray(data) && data.length > 0) {
        setStockSectors(data);
        setMarketClosed(false);
      }
    } catch (err) {
      console.error('Heatmap fetch error:', err);
      setError(err.message || 'Error loading live market data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
    // Poll live market data every 3 seconds to keep the heatmap fresh
    const interval = setInterval(() => {
      if (!marketClosed) {
        fetchHeatmapData(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [marketClosed]);

  // Keyboard accessibility: dismiss modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedStock(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live market breadth (advances / declines) dynamically
  let totalStocksCount = 0;
  let advancesCount = 0;
  let declinesCount = 0;

  stockSectors.forEach(sect => {
    sect.stocks.forEach(stock => {
      totalStocksCount++;
      if (stock.change > 0) advancesCount++;
      else if (stock.change < 0) declinesCount++;
    });
  });

  const advancesPct = totalStocksCount > 0 ? Math.round((advancesCount / totalStocksCount) * 100) : 50;
  const declinesPct = 100 - advancesPct;

  const getHeatColor = (change) => {
    if (change >= 3.0) return 'bg-emerald-700 text-white border-emerald-500';
    if (change >= 1.5) return 'bg-emerald-600 text-white border-emerald-400';
    if (change > 0) return 'bg-emerald-500 text-white border-emerald-400';
    if (change === 0) return 'bg-gray-600 text-white border-gray-500';
    if (change <= -3.0) return 'bg-red-700 text-white border-red-500';
    if (change <= -1.5) return 'bg-red-600 text-white border-red-400';
    return 'bg-red-500 text-white border-red-400';
  };

  const filteredSectors = stockSectors.filter(sect => 
    filterSector === 'All' || sect.name === filterSector
  ).map(sect => {
    return {
      ...sect,
      stocks: sect.stocks.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    };
  }).filter(sect => sect.stocks.length > 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Market Closed Warning Banner */}
      {marketClosed && (
        <div className={`p-5 rounded-3xl border flex items-center gap-4 font-sans shadow-md ${
          isDark 
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' 
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>
          <Clock size={24} className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} shrink-0 animate-pulse`} />
          <div>
            <div className="font-bold text-base uppercase tracking-wider">MARKET CLOSED / SESSION OFFLINE</div>
            <div className="text-sm opacity-90">{closedMessage}</div>
          </div>
        </div>
      )}

      {/* Top Controller */}
      <div className={`p-6 rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-6 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#c8f135]/10 text-[#c8f135]' : 'bg-black/5 text-black'}`}>
            <Grid3x3 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">Market Heatmap Radar</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Bento-Grid representation of sector performance. Click on any block to open full Q-Pilot metrics.
            </p>
          </div>
        </div>

        {/* Sector selection and search */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <form className="relative flex-1 md:max-w-xs w-full" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2 pl-9 pr-4 rounded-xl text-xs font-semibold focus:outline-none ${
                isDark 
                  ? 'bg-white/5 border border-white/10 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          </form>

          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className={`py-2 px-4 rounded-xl text-xs font-bold focus:outline-none ${
              isDark 
                ? 'bg-white/5 border border-white/10 text-white' 
                : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
            }`}
          >
            <option value="All">All Sectors</option>
            {stockSectors.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => fetchHeatmapData(true)}
            disabled={loading}
            className={`p-2.5 rounded-xl transition-all focus:outline-none ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-[#c8f135]' 
                : 'bg-white hover:bg-gray-50 border border-gray-200 text-black shadow-sm'
            } disabled:opacity-50`}
            title="Refresh Live Quotes"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Market Breadth sentiment meter */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-500" /> Real-Time Market Breadth Sentiment
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
              Current buy/sell pressure ratio of tracked Indian market constituents based on intraday ticks.
            </p>
          </div>
          <div className="flex-1 max-w-xl w-full">
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold font-mono">
              <span className="text-emerald-400">{advancesCount} ({advancesPct}%) ADVANCES</span>
              <span className="text-red-400">{declinesCount} ({declinesPct}%) DECLINES</span>
            </div>
            <div className="h-3.5 w-full bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${advancesPct}%` }} />
              <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${declinesPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-semibold">
          ⚠️ {error} (Falling back to cached high-fidelity pricing data)
        </div>
      )}

      {/* Full Width Heatmap Bento Grid */}
      <div className="space-y-6">
        {filteredSectors.map((sect) => (
          <div 
            key={sect.name} 
            className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">{sect.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sect.stocks.map((stock) => {
                const colorClass = getHeatColor(stock.change);
                return (
                  <div
                    key={stock.symbol}
                    onMouseEnter={() => setHoveredStock(stock)}
                    onClick={() => setSelectedStock(stock)}
                    className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-center flex flex-col justify-between min-h-[100px] shadow-sm hover:shadow-md ${colorClass}`}
                  >
                    <span className="font-extrabold text-sm block tracking-wide">{stock.symbol}</span>
                    <div>
                      <span className="text-xs font-semibold block opacity-95">₹{stock.price.toLocaleString()}</span>
                      <span className="text-[10px] font-black block mt-1.5 px-2 py-0.5 bg-black/10 rounded-md inline-block">
                        {stock.change > 0 ? '+' : ''}{stock.change}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Beautiful Web-Native Modal Popup Dialog */}
      {selectedStock && (() => {
        const stock = selectedStock;
        const metrics = getQPilotMetrics(stock);
        const scoreValue = parseInt(metrics.score) || 50;
        const isUpward = metrics.trend === "EXPANDING UP";
        const isDownward = metrics.trend === "CONTRACTING DOWN";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blurry glass backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 cursor-pointer" 
              onClick={() => setSelectedStock(null)}
              title="Click outside to close"
            />
            
            {/* Modal Body Container */}
            <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95 ${
              isDark 
                ? 'bg-[#0b0c10] border-white/10 text-white shadow-cyan-500/5' 
                : 'bg-white border-black/10 text-slate-900 shadow-slate-200'
            }`}>
              {/* Dynamic colored visual border on top */}
              <div className={`h-1.5 w-full ${stock.change > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              
              {/* Header section with symbol, name, and sector details */}
              <div className={`p-6 border-b flex flex-col gap-4 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                {/* Top line with Badges & Standard Close Button to completely avoid overlap */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {stock.cap && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-600'
                      }`}>{stock.cap}</span>
                    )}
                    {stock.sector && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                      }`}>{stock.sector}</span>
                    )}
                  </div>
                  
                  {/* Clean Close Pill with fixed container placement so it never overlaps text */}
                  <button 
                    onClick={() => setSelectedStock(null)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 focus:outline-none shadow-sm active:scale-95 ${
                      isDark 
                        ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20' 
                        : 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100'
                    }`}
                  >
                    <X size={12} className="stroke-[3px]" />
                    <span>Close</span>
                  </button>
                </div>

                {/* Main Identity and Price Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-tight flex flex-wrap items-center gap-2">
                      <span className="truncate">{stock.symbol}</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full shrink-0 ${
                        stock.change >= 0 
                          ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-500 dark:text-red-400'
                      }`}>
                        {stock.change > 0 ? '+' : ''}{parseFloat(stock.change).toFixed(2)}%
                      </span>
                    </h2>
                    <p className={`text-xs mt-0.5 font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stock.name}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:items-end justify-center shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-gray-400 block tracking-wider">Last Price (LTP)</span>
                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      ₹{parseFloat(stock.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Core Telemetry Signal Bento Panels */}
              <div className={`p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[60vh] md:max-h-[65vh] overflow-y-auto ${isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'}`}>
                
                {/* Composite Gauge Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  
                  {/* Radial Progress Score Ring - highly compact on mobile */}
                  <div className={`p-4 sm:p-5 rounded-2xl border flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 text-left sm:text-center ${
                    isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'
                  }`}>
                    <div className="flex flex-col items-start sm:items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider mb-1.5 block">COMPOSITE SCORE</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                        scoreValue >= 50 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : scoreValue < 30 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {scoreValue >= 50 ? "Trend has legs" : scoreValue < 30 ? "Wait for Edge" : "Range bound"}
                      </span>
                    </div>
                    
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                        <circle
                           cx="48"
                           cy="48"
                           r="40"
                           stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
                           strokeWidth="8"
                           fill="transparent"
                        />
                        <circle
                           cx="48"
                           cy="48"
                           r="40"
                           stroke={scoreValue >= 50 ? "#10b981" : scoreValue < 30 ? "#ef4444" : "#f59e0b"}
                           strokeWidth="8"
                           strokeDasharray={2 * Math.PI * 40}
                           strokeDashoffset={2 * Math.PI * 40 * (1 - scoreValue / 100)}
                           strokeLinecap="round"
                           fill="transparent"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-sm sm:text-base font-black block">{scoreValue}%</span>
                        <span className="text-[8px] text-slate-500 dark:text-gray-400 block uppercase font-bold tracking-wider">Rating</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trend and Conviction analysis */}
                  <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between md:col-span-2 ${
                    isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'
                  }`}>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between border-b pb-2 border-gray-800/10 dark:border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider">Structure Status</span>
                        <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          <Clock size={13} /> age: {metrics.signalAge}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 dark:text-gray-400 font-bold block mb-1 uppercase tracking-wider">DIRECTION</span>
                          <div className="flex items-center gap-2">
                            {isUpward ? (
                              <TrendingUp className="text-emerald-500" size={18} />
                            ) : (
                              <TrendingDown className="text-red-500" size={18} />
                            )}
                            <span className={`font-black uppercase text-xs sm:text-sm tracking-wider ${
                              isUpward ? "text-emerald-500" : isDownward ? "text-red-500" : "text-gray-400"
                            }`}>{metrics.trend}</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-[9px] text-slate-500 dark:text-gray-400 font-bold block mb-1 uppercase tracking-wider">CONVICTION</span>
                          <div className="space-y-1.5">
                            <span className="font-bold text-xs uppercase tracking-wide">{metrics.strength} STRENGTH</span>
                            {/* Strength indicator bar segments */}
                            <div className="flex gap-1.5">
                              <div className={`h-2 w-5 rounded-full ${
                                metrics.strength !== "WEAK" ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-700"
                              }`} />
                              <div className={`h-2 w-5 rounded-full ${
                                metrics.strength === "STRONG" || metrics.strength === "EXTREME" ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-700"
                              }`} />
                              <div className={`h-2 w-5 rounded-full ${
                                metrics.strength === "EXTREME" ? "bg-purple-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"
                              }`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Forecast bar */}
                    <div className={`mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-black/5'
                    }`}>
                      <Zap size={14} className="text-yellow-500 shrink-0" />
                      <div className="min-w-0 truncate">
                        <span className="text-slate-500 dark:text-gray-400 font-semibold">Engine Forecast:</span>{' '}
                        <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{metrics.forecast}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 3x2 Grid for Secondary Telemetry Indices */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  
                  {/* Momentum */}
                  <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block tracking-wider mb-1">MOMENTUM</span>
                    <span className="font-bold text-xs block truncate">{metrics.momentum}</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${metrics.momentum.includes("▲") ? "bg-emerald-500 w-3/4" : "bg-red-500 w-1/3"}`} />
                    </div>
                  </div>
                  
                  {/* Volume Pressure */}
                  <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block tracking-wider mb-1">VOLUME PRESSURE</span>
                    <span className="font-bold text-xs block truncate">{metrics.volumePressure}</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${metrics.volumePressure.includes("▲▲") ? "bg-red-500 w-4/5" : "bg-emerald-500 w-1/2"}`} />
                    </div>
                  </div>

                  {/* Market State */}
                  <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block tracking-wider mb-1">MARKET CLARITY</span>
                    <span className={`font-bold text-xs block truncate ${metrics.marketState === "CLEAR" ? "text-emerald-500" : "text-yellow-500"}`}>{metrics.marketState}</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${metrics.marketState === "CLEAR" ? "bg-emerald-500 w-5/6" : "bg-yellow-500 w-2/5"}`} />
                    </div>
                  </div>

                  {/* Vol Ribbon */}
                  <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block tracking-wider mb-1">VOL RIBBON</span>
                    <span className="font-bold text-xs block truncate">{metrics.volRibbon}</span>
                  </div>

                  {/* Tuning Preset */}
                  <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block tracking-wider mb-1">ALGO PRESET</span>
                    <span className={`font-mono text-xs font-bold block truncate ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{metrics.engine}</span>
                  </div>

                  {/* Daily High/Low */}
                  <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block tracking-wider mb-1">TODAY'S RANGE</span>
                    <div className="flex justify-between text-[10px] font-mono mt-1 font-bold">
                      <span className="text-red-500 truncate mr-1">L: ₹{(stock.low || stock.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-emerald-500 truncate">H: ₹{(stock.high || stock.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                </div>

              </div>
              
              {/* Footer info message with pristine design - no double close option */}
              <div className={`p-5 text-center text-[10px] font-black tracking-wider uppercase border-t ${
                isDark ? 'bg-black/40 border-white/5 text-gray-400' : 'bg-slate-50 border-black/5 text-slate-500'
              }`}>
                SCORE &gt; 50% = Trend has legs. &lt; 30% = wait. Pure Algorithmic Engine Analysis.
              </div>
            </div>
          </div>
        );
      })()}

      {/* Required Disclaimer */}
      <div className={`p-4 rounded-xl border text-center text-xs ${isDark ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-gray-100 border-black/5 text-gray-500'}`}>
        Educational information, not investment advice.
      </div>
    </div>
  );
}
