import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Target, 
  TrendingUp, 
  Percent, 
  Brain, 
  Loader2, 
  Calendar, 
  TrendingDown, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  PieChart, 
  Activity, 
  AlertCircle,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  LogIn,
  BookOpen,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

export default function PerformanceAnalytics({ theme }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Glass card styles matching the rest of the application
  const glassCard = `rounded-2xl border p-6 transition-all duration-300 ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/15' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-white/85 hover:border-black/10'
  }`;

  // Interactive and database states
  const [dbTrades, setDbTrades] = useState([]);
  const [paperTrades, setPaperTrades] = useState([]);
  const [performanceMode, setPerformanceMode] = useState('real'); // 'real' | 'paper'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRange, setFilterRange] = useState('all'); // 'all' | 'last30' | 'last7'
  const [searchInstrument, setSearchInstrument] = useState('');
  const [searchTag, setSearchTag] = useState('all'); // 'all' | 'fomo' | 'revenge' | 'calm' | 'anxious'

  // Pre-populated professional demo trades if the user has no logs or turns on demo mode
  const demoTrades = [
    {
      id: 'demo-1',
      instrument: 'NQ BACKTEST',
      entryPrice: '18200.00',
      exitPrice: '18350.00',
      pnl: '+3000.00',
      emotion: 'Calm & Patient',
      notes: 'Executed high timeframe breakout strategy with standard risk sizing.',
      tradeTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-2',
      instrument: 'ES MINIS',
      entryPrice: '5250.75',
      exitPrice: '5238.00',
      pnl: '-637.50',
      emotion: 'Slightly FOMO',
      notes: 'Chased the market high on micro breakout. Stopped out cleanly.',
      tradeTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-3',
      instrument: 'GOLD SPOT',
      entryPrice: '2350.00',
      exitPrice: '2385.00',
      pnl: '+1750.00',
      emotion: 'Disciplined',
      notes: 'Support bounce matched with critical volume profile nodes.',
      tradeTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-4',
      instrument: 'NQ BACKTEST',
      entryPrice: '18410.00',
      exitPrice: '18360.00',
      pnl: '-1000.00',
      emotion: 'Revenge Bias',
      notes: 'Attempted to short immediately after previous candle stop. Unsafe execution parameters.',
      tradeTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-5',
      instrument: 'ES MINIS',
      entryPrice: '5210.00',
      exitPrice: '5265.00',
      pnl: '+2750.00',
      emotion: 'Highly Calm',
      notes: 'Patiently waited for key liquidity sweep before opening long parameters.',
      tradeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-6',
      instrument: 'CRUDE OIL',
      entryPrice: '78.20',
      exitPrice: '79.90',
      pnl: '+850.00',
      emotion: 'Calm & Risk-Averse',
      notes: 'Riding high probability multi-day trend structure. Safely configured stop loss.',
      tradeTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Fetch real trades from database
  const fetchTrades = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in securely to access your real trade history metrics.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDbTrades(data.trades || []);
      } else {
        setError(data.error || 'Failed to retrieve trade log synchronization metrics.');
      }
    } catch (err) {
      console.error("Performance Analytics Fetch Error:", err);
      setError('Communication timeout with secure database engine.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch paper trades from virtual database
  const fetchPaperTrades = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in securely to access your paper trade history metrics.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/paper/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPaperTrades(data || []);
      } else {
        setError('Failed to retrieve paper trade history metrics.');
      }
    } catch (err) {
      console.error("Paper Trades Fetch Error:", err);
      setError('Communication timeout with secure database engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (performanceMode === 'real') {
      fetchTrades();
    } else {
      fetchPaperTrades();
    }
  }, [performanceMode]);

  // Parse custom string PnL e.g. "+1,450.00", "-650", "$300" securely
  const parsePnL = (pnlStr) => {
    if (!pnlStr) return 0;
    const cleanStr = String(pnlStr).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // Determine active dataset
  const activeSeries = performanceMode === 'real' ? dbTrades : paperTrades;

  // Process data with structured temporal sorting and parsing filter mappings
  const rawProcessed = activeSeries.map(t => {
    const isPaperObj = performanceMode === 'paper';
    const pnlVal = isPaperObj ? t.realizedPnl : t.pnl;
    const numericPnl = parsePnL(pnlVal);
    const dateObj = new Date(
      isPaperObj 
        ? (t.closedAt || t.openedAt || Date.now()) 
        : (t.tradeTime || t.createdAt || Date.now())
    );
    
    // Synthesize fields for uniform behavior
    const instrument = isPaperObj 
      ? `${t.symbol} ${(t.instrumentType || '').toUpperCase()} ${(t.side || '').toUpperCase()}`
      : t.instrument;

    // Automated Behavioral & Emotional Classification for both Paper and Real trades
    let emotion = t.emotion;
    if (!emotion || emotion === "Simulated (Paper)" || emotion === "Neutral") {
      const notesLower = String(t.notes || '').toLowerCase();
      const holdDurationMins = (t.closedAt && t.openedAt) 
        ? Math.abs(new Date(t.closedAt).getTime() - new Date(t.openedAt).getTime()) / 60000 
        : 5;

      if (t.revengeFlag || notesLower.includes('revenge') || notesLower.includes('tilt')) {
        emotion = "Revenge (Tilt)";
      } else if (t.riskBreachFlag || notesLower.includes('risk breach') || notesLower.includes('exceed')) {
        emotion = "Risk Breach";
      } else if (notesLower.includes('fomo') || notesLower.includes('chase')) {
        emotion = "FOMO Entry";
      } else if (notesLower.includes('fear') || notesLower.includes('anxio')) {
        emotion = "Anxious Cut (Fear)";
      } else if (numericPnl < 0) {
        if (holdDurationMins <= 1.5) {
          emotion = "Anxious Cut (Fear)";
        } else if (Math.abs(numericPnl) > 500) {
          emotion = "Impulsive Loss";
        } else {
          emotion = "Calculated Stop-Loss";
        }
      } else if (numericPnl > 0) {
        if (holdDurationMins < 1) {
          emotion = "Quick Scalp (Calm)";
        } else if (numericPnl > 500) {
          emotion = "Controlled Take Profit";
        } else {
          emotion = "Disciplined (Calm)";
        }
      } else {
        emotion = "Disciplined (Calm)";
      }
    }

    const notes = isPaperObj 
      ? (t.notes || `Paper trade in ${t.symbol}. Analyzed by RetailX behavioral risk engine. Entered at ₹${parseFloat(t.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} and exited at ₹${parseFloat(t.exitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}.`)
      : t.notes;

    return {
      ...t,
      instrument,
      emotion,
      notes,
      numericPnl,
      dateObj
    };
  }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Filter application relative to chosen timeframe bounds
  const now = new Date();
  const filteredTrades = rawProcessed.filter(t => {
    // Time interval range filter
    if (filterRange === 'last7') {
      if ((now.getTime() - t.dateObj.getTime()) > 7 * 24 * 60 * 60 * 1000) return false;
    } else if (filterRange === 'last30') {
      if ((now.getTime() - t.dateObj.getTime()) > 30 * 24 * 60 * 60 * 1000) return false;
    }

    // Instrument string match filter
    if (searchInstrument && !t.instrument?.toLowerCase().includes(searchInstrument.toLowerCase())) {
      return false;
    }

    // Psychological tag match filter
    if (searchTag && searchTag !== 'all') {
      const notesLower = String(t.notes || '').toLowerCase();
      const emotionLower = String(t.emotion || '').toLowerCase();
      if (searchTag === 'fomo' && !notesLower.includes('fomo') && !emotionLower.includes('fomo')) return false;
      if (searchTag === 'revenge' && !notesLower.includes('revenge') && !emotionLower.includes('revenge') && !notesLower.includes('tilt') && !emotionLower.includes('tilt')) return false;
      if (searchTag === 'calm' && !notesLower.includes('calm') && !emotionLower.includes('calm') && !notesLower.includes('disciplined') && !emotionLower.includes('disciplined')) return false;
      if (searchTag === 'anxious' && !notesLower.includes('anxious') && !emotionLower.includes('anxious') && !notesLower.includes('fear') && !emotionLower.includes('fear')) return false;
    }

    return true;
  });

  // High-fidelity performance metrics computations
  const totalTradesCount = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => t.numericPnl > 0);
  const losingTrades = filteredTrades.filter(t => t.numericPnl < 0);
  
  const winRate = totalTradesCount > 0 
    ? Math.round((winningTrades.length / totalTradesCount) * 100) 
    : 0;

  const totalNetPnl = filteredTrades.reduce((sum, t) => sum + t.numericPnl, 0);

  // Risk Benefit analysis calculations
  const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.numericPnl, 0);
  const totalLossAmount = losingTrades.reduce((sum, t) => sum + t.numericPnl, 0);
  const averageWin = winningTrades.length > 0 ? (totalWinAmount / winningTrades.length) : 0;
  const averageLoss = losingTrades.length > 0 ? (Math.abs(totalLossAmount) / losingTrades.length) : 0;
  
  // Realized profit-based Risk to Reward factor (Avg Win Size vs Avg Loss Size Ratio)
  const realizedRRRatio = averageLoss > 0 ? (averageWin / averageLoss) : (averageWin > 0 ? averageWin : 0);

  // Expectancy calculation (Average expected financial outcome per opened position)
  const expectancy = totalTradesCount > 0 ? (totalNetPnl / totalTradesCount) : 0;

  // AI Cognitive Evaluation: dynamic discipline scoring based on emotional logging correlations
  const calculateDisciplineScore = () => {
    if (filteredTrades.length === 0) return 85; // Standard healthy initialization baseline
    let baseScore = 80;
    
    filteredTrades.forEach(t => {
      const emo = String(t.emotion || '').toLowerCase();
      if (emo.includes('revenge') || emo.includes('tilt') || emo.includes('anger') || emo.includes('mad')) {
        baseScore -= 14;
      } else if (emo.includes('fomo') || emo.includes('greed') || emo.includes('chase') || emo.includes('desire')) {
        baseScore -= 8;
      } else if (emo.includes('anxiety') || emo.includes('fear') || emo.includes('anxious') || emo.includes('shake')) {
        baseScore -= 3;
      } else if (emo.includes('calm') || emo.includes('discipline') || emo.includes('patient') || emo.includes('chill')) {
        baseScore += 4;
      }
    });

    return Math.max(35, Math.min(100, baseScore));
  };
  const evolutionScore = calculateDisciplineScore();

  // Equity curve data stream mapping
  const chartData = [];
  let runningCumulative = 0;

  // Insert initial starting point anchor
  chartData.push({
    name: 'Start',
    displayDate: 'Baseline',
    pnl: 0,
    cumulative: 0,
    instrument: 'Initial State',
    emotion: 'Neural Balance'
  });

  filteredTrades.forEach((t, i) => {
    runningCumulative += t.numericPnl;
    const formattedDateStr = t.dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    chartData.push({
      name: `Trade ${i + 1}`,
      displayDate: formattedDateStr,
      pnl: t.numericPnl,
      cumulative: Math.round(runningCumulative * 100) / 100,
      instrument: t.instrument,
      emotion: t.emotion || 'Calm'
    });
  });

  // Categorize individual Best & Worst trade parameters dynamically
  let bestTrade = null;
  let worstTrade = null;

  if (filteredTrades.length > 0) {
    // Clone and sort to preserve spatial structure of the original dataset
    const sortedByPnL = [...filteredTrades].sort((a, b) => b.numericPnl - a.numericPnl);
    if (sortedByPnL[0]?.numericPnl > 0) {
      bestTrade = sortedByPnL[0];
    }
    const lowest = sortedByPnL[sortedByPnL.length - 1];
    if (lowest?.numericPnl < 0) {
      worstTrade = lowest;
    }
  }

  // Custom high-tech tooltips for the cumulative area chart
  const CustomPerformanceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isWin = point.pnl >= 0;
      return (
        <div className={`p-4 rounded-xl border text-xs shadow-2xl backdrop-blur-md ${
          isDark 
            ? 'bg-zinc-950/90 border-white/15 text-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]' 
            : 'bg-white/95 border-black/10 text-gray-900 shadow-[0_12px_32px_rgba(0,0,0,0.08)]'
        }`}>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-mono tracking-wider opacity-60 text-[9px] uppercase">{point.displayDate}</span>
            {point.instrument && (
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                isDark ? 'bg-zinc-850 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
              }`}>
                {point.instrument}
              </span>
            )}
          </div>
          <p className="font-extrabold text-sm mb-1">{point.name}</p>
          <div className="space-y-1 my-2 border-t border-dashed border-gray-500/10 pt-1.5 font-sans font-semibold">
            <div className="flex items-center justify-between gap-6">
              <span className="opacity-60 text-[10px]">Cumulative Equity</span>
              <span className={`font-mono font-bold ${point.cumulative >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {point.cumulative >= 0 ? '+' : ''}₹{point.cumulative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {point.name !== 'Start' && (
              <>
                <div className="flex items-center justify-between gap-6">
                  <span className="opacity-60 text-[10px]">Trade Impact</span>
                  <span className={`font-mono font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {isWin ? '+' : ''}₹{point.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="opacity-60 text-[10px]">Behavior Logging</span>
                  <span className={`capitalize font-bold px-1.5 py-0.5 rounded text-[9px] ${
                    point.emotion?.toLowerCase().includes('calm') || point.emotion?.toLowerCase().includes('disciplined')
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>{point.emotion || 'Neutral'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleLoggedTimeStr = (t) => {
    if (!t) return 'Just now';
    return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 select-none" id="performance_tabs_container">
      
      {/* Header action bar with Filters & Demo Mode Toggles */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Performance Analytics
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Portfolio performance matched with behavioral patterns.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Instrument Filter input */}
          <input
            type="text"
            value={searchInstrument}
            onChange={(e) => setSearchInstrument(e.target.value)}
            placeholder="Search instrument..."
            className={`text-xs p-2 px-3 rounded-xl border font-semibold outline-none transition-all ${
              isDark 
                ? 'bg-black/30 border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500' 
                : 'bg-white border-black/10 text-gray-900 placeholder-zinc-400 focus:border-indigo-600'
            }`}
          />

          {/* Psychological tag filter select */}
          <select
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            className={`text-xs p-2 px-3 rounded-xl border font-semibold outline-none transition-all cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-white/10 text-zinc-300 focus:border-indigo-500'
                : 'bg-white border-black/10 text-gray-700 focus:border-indigo-650'
            }`}
          >
            <option value="all">All Psych Tags</option>
            <option value="fomo">FOMO 👀</option>
            <option value="revenge">Revenge/Tilt 😡</option>
            <option value="calm">Calm/Disciplined 😌</option>
            <option value="anxious">Anxious/Fear 😰</option>
          </select>

          {/* Timeframe Filters */}
          <div className={`p-1 rounded-xl border flex items-center ${isDark ? 'bg-black/30 border-white/10' : 'bg-gray-100/80 border-black/5'}`}>
            {[
              { id: 'all', label: 'All-time' },
              { id: 'last30', label: 'Last 30D' },
              { id: 'last7', label: 'Last 7D' }
            ].map((bt) => (
              <button
                key={bt.id}
                onClick={() => setFilterRange(bt.id)}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                  filterRange === bt.id
                    ? isDark 
                      ? 'bg-white text-zinc-900 shadow-sm font-semibold' 
                      : 'bg-black text-white shadow-sm font-semibold'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>

          {/* Database Reload */}
          <button
            onClick={performanceMode === 'real' ? fetchTrades : fetchPaperTrades}
            title="Refresh database records"
            className={`p-2 rounded-xl border transition-all ${
              isDark 
                ? 'border-white/10 hover:bg-zinc-900 text-zinc-400 hover:text-white' 
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>
      </div>

      {/* Performance Mode Tabs / Switcher */}
      <div className={`p-1 rounded-xl border flex items-center self-start ${isDark ? 'bg-black/30 border-white/10' : 'bg-gray-100/80 border-black/5'} max-w-sm`}>
        <button
          onClick={() => setPerformanceMode('real')}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex-1 ${
            performanceMode === 'real'
              ? isDark 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'bg-black text-white shadow-sm'
              : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
          }`}
        >
          Trade Journal (Real)
        </button>
        <button
          onClick={() => setPerformanceMode('paper')}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex-1 ${
            performanceMode === 'paper'
              ? isDark 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'bg-black text-white shadow-sm'
              : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
          }`}
        >
          Paper Trading
        </button>
      </div>

      {/* Warning when viewing empty slate */}
      {activeSeries.length === 0 && !loading && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`} id="empty_trades_notif">
          <div className="flex gap-3.5 items-start">
            <AlertCircle size={20} className="shrink-0 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold">
                {performanceMode === 'real' ? "No journal entries found" : "No paper trades found"}
              </h4>
              <p className="text-xs opacity-80 mt-1 max-w-xl">
                {performanceMode === 'real'
                  ? "Log your trades in the Journal to visualize your performance metrics and psychological stats."
                  : "Go to the Paper Trading tab to place virtual orders and test your trading strategies."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(performanceMode === 'real' ? '/dashboard/journal' : '/dashboard/paper')}
              className={`p-2.5 px-4 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all ${
                isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              <PlusCircle size={13} />
              {performanceMode === 'real' ? "Log First Trade" : "Start Paper Trading"}
            </button>
          </div>
        </div>
      )}

      {/* Database fetching state */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-20 rounded-2xl border border-gray-500/10" id="loading_spinner_overlay">
          <Loader2 size={36} className={`animate-spin mb-4 ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`} />
          <p className="text-xs text-gray-400 uppercase tracking-widest font-mono font-medium animate-pulse">
            Analyzing performance data...
          </p>
        </div>
      )}

      {/* Performance Statistics Grid cards */}
      {!loading && activeSeries.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats_cards_row">
            {/* 1. Win Rate Card */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Win Rate</span>
                <span className="text-xs font-mono font-medium text-indigo-500">
                  {winningTrades.length} of {totalTradesCount}
                </span>
              </div>
              <div className={`text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {winRate}%
              </div>
            </div>

            {/* 2. Avg Realized Risk:Reward Ratio Card */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Profit Ratio (Avg Win/Loss)</span>
                <span className="text-xs font-mono font-medium text-amber-500">
                  R:R
                </span>
              </div>
              <div className={`text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                1 : {realizedRRRatio > 0 ? realizedRRRatio.toFixed(1) : '0.0'}
              </div>
            </div>

            {/* 3. Expected PnL Card */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Expectancy (Avg/Trade)</span>
                <span className={`text-xs font-mono font-medium ${expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  Outcome
                </span>
              </div>
              <div className={`text-3xl font-semibold tracking-tight ${
                expectancy >= 0 
                  ? (isDark ? 'text-teal-400' : 'text-green-600') 
                  : 'text-red-500'
              }`}>
                {expectancy >= 0 ? '+' : ''}₹{Math.round(expectancy).toLocaleString()}
              </div>
            </div>

            {/* 4. Discipline Card */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Discipline Score</span>
                <span className="text-xs font-mono font-medium text-emerald-500">
                  Psychology
                </span>
              </div>
              <div className={`text-3xl font-semibold tracking-tight ${
                evolutionScore >= 75
                  ? (isDark ? 'text-[#c8f135]' : 'text-emerald-600')
                  : evolutionScore >= 55 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {evolutionScore}/100
              </div>
            </div>
          </div>

          {/* Equity Curve Visual Interactive Area Chart Component */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dynamic Area Recharts Container */}
            <div className={`${glassCard} lg:col-span-2 h-[420px] flex flex-col`} id="equity_curve_recharts_box">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h3 className={`text-sm md:text-base font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Cumulative Performance (Dual-Axis)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Cumulative Equity Curve (left) vs. Individual Trade P&L (right).
                  </p>
                </div>

                {/* Legend indicator */}
                <span className={`text-xs font-mono px-3 py-1 rounded-lg ${
                  totalNetPnl >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
                }`}>
                  Net: {totalNetPnl >= 0 ? '+' : ''}₹{Math.round(totalNetPnl).toLocaleString()}
                </span>
              </div>

              {/* Responsive Container wrapper */}
              <div className="flex-1 w-full relative" id="equity_curve_container">
                {filteredTrades.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pb-12">
                    <BarChart3 size={36} className="text-gray-500 opacity-30 mb-2.5" />
                    <p className="text-xs font-bold text-gray-400">Not enough trades to map curve parameters with active filters.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorDynamicPnl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={totalNetPnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={totalNetPnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                      <XAxis dataKey="name" stroke={isDark ? '#52525b' : '#a1a1aa'} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke={isDark ? '#10b981' : '#059669'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <YAxis yAxisId="right" orientation="right" stroke={isDark ? '#818cf8' : '#4f46e5'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip content={CustomPerformanceTooltip} />
                      <Area yAxisId="left" type="monotone" dataKey="cumulative" stroke={totalNetPnl >= 0 ? "#10b981" : "#ef4444"} strokeWidth={3} fillOpacity={1} fill="url(#colorDynamicPnl)" />
                      <Bar yAxisId="right" dataKey="pnl" barSize={14} fill={isDark ? "rgba(129, 140, 248, 0.25)" : "rgba(79, 70, 229, 0.15)"} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Cognitive Emotion Sidebar Column */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* Highlight card for Best Trade logged */}
              <div className={glassCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <ArrowUpRight size={16} />
                    <h3 className="text-xs font-medium uppercase tracking-wider">
                      Best Trade
                    </h3>
                  </div>
                </div>

                {bestTrade ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {bestTrade.instrument}
                      </span>
                      <span className="text-base font-mono font-bold text-green-500">
                        +₹{Math.round(parsePnL(bestTrade.pnl)).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-500/10 pt-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Emotion</span>
                        <span className="font-medium text-emerald-400 capitalize">{bestTrade.emotion || 'Calm'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Date</span>
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{handleLoggedTimeStr(bestTrade.tradeTime)}</span>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed italic p-2 rounded-lg ${
                      isDark ? 'bg-zinc-900/40 text-zinc-400' : 'bg-zinc-50 text-zinc-600'
                    }`}>
                      "{bestTrade.notes || 'Executed with focus.'}"
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <HelpCircle size={18} className="mx-auto text-zinc-500 opacity-40 mb-1" />
                    <p className="text-xs text-zinc-500">No winning positions logged.</p>
                  </div>
                )}
              </div>

              {/* Highlight card for Worst Trade logged */}
              <div className={glassCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-rose-500">
                    <ArrowDownRight size={16} />
                    <h3 className="text-xs font-medium uppercase tracking-wider">
                      Worst Trade
                    </h3>
                  </div>
                </div>

                {worstTrade ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {worstTrade.instrument}
                      </span>
                      <span className="text-base font-mono font-bold text-rose-500">
                        -₹{Math.round(Math.abs(parsePnL(worstTrade.pnl))).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-500/10 pt-2">
                       <div>
                        <span className="text-[10px] text-zinc-500 block">Emotion</span>
                        <span className="font-medium text-amber-555 capitalize">{worstTrade.emotion || 'Unstable'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Date</span>
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{handleLoggedTimeStr(worstTrade.tradeTime)}</span>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed italic p-2 rounded-lg ${
                      isDark ? 'bg-zinc-900/40 text-zinc-400' : 'bg-zinc-50 text-zinc-600'
                    }`}>
                      "{worstTrade.notes || 'No notes correlated.'}"
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500">
                    <HelpCircle size={18} className="mx-auto text-zinc-500 opacity-40 mb-1" />
                    <p className="text-xs text-zinc-500">No drawdowns recorded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed tabular Breakdown block of All Logged Trades with Theme styling */}
          <div className={`${glassCard} overflow-hidden px-0 pb-0`} id="performance_journal_table_box">
            <div className={`px-6 pb-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-black/5'}`}>
              <div>
                <h3 className={`text-sm md:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Trade Ledger
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Chronological record of recent entries and emotional correlation.
                </p>
              </div>

              <span className={`text-xs font-mono p-1 px-2.5 rounded-lg border ${
                isDark ? 'bg-zinc-950 border-white/10 text-zinc-400' : 'bg-zinc-100 border-black/5 text-zinc-600'
              }`}>
                {filteredTrades.length} Trades
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              {filteredTrades.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <BarChart3 className="mx-auto opacity-30 mb-2" size={28} />
                  <p className="text-xs font-medium leading-none">No active table lines to display.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-medium ${
                      isDark ? 'border-white/5 bg-zinc-900/45 text-zinc-400' : 'border-black/5 bg-zinc-50 text-zinc-500'
                    }`}>
                      <th className="p-4">Asset</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Price Interval</th>
                      <th className="p-4">Emotional State</th>
                      <th className="p-4 text-right font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-black/5'}`}>
                    {[...filteredTrades].reverse().map((trade) => {
                      const isProfit = trade.numericPnl >= 0;
                      return (
                        <tr 
                          key={trade.id} 
                          className={`transition-all text-xs ${
                            isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                          }`}
                        >
                          {/* Instrument */}
                          <td className={`p-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <span className="truncate font-medium">{trade.instrument}</span>
                          </td>

                          {/* Trade Date */}
                          <td className="p-4 text-zinc-500">
                            {handleLoggedTimeStr(trade.tradeTime || trade.createdAt)}
                          </td>

                          {/* Pricing parameters */}
                          <td className="p-4 font-mono text-zinc-400">
                            ₹{parseFloat(trade.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} → ₹{parseFloat(trade.exitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Emotional classification */}
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              trade.emotion?.toLowerCase().includes('calm') || trade.emotion?.toLowerCase().includes('discipline') || trade.emotion?.toLowerCase().includes('profit') || trade.emotion?.toLowerCase().includes('stop')
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : trade.emotion?.toLowerCase().includes('revenge') || trade.emotion?.toLowerCase().includes('tilt') || trade.emotion?.toLowerCase().includes('breach') || trade.emotion?.toLowerCase().includes('impulse') || trade.emotion?.toLowerCase().includes('fomo') || trade.emotion?.toLowerCase().includes('fear') || trade.emotion?.toLowerCase().includes('anxious')
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {trade.emotion || 'Disciplined (Calm)'}
                            </span>
                          </td>

                          {/* PnL Value */}
                          <td className={`p-4 text-right font-mono font-semibold ${
                            isProfit ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {isProfit ? '+' : ''}₹{Math.round(trade.numericPnl).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
