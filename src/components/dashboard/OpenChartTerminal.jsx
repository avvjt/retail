import React, { useState, useEffect, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import ChartAiOverviewInsights from './ChartAiOverviewInsights';
import { 
  TrendingUp, 
  TrendingDown,
  Search, 
  Calendar, 
  Clock, 
  Layers, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  BarChart2, 
  Sliders,
  ChevronDown,
  Activity,
  Radio,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function OpenChartTerminal({ 
  theme = 'light',
  initialSymbol = 'NIFTY 50',
  initialSegment = 'IDX',
  embedded = false,
  onSelectSymbol = null
}) {
  const isDark = theme === 'dark';

  const [segment, setSegment] = useState(initialSegment || 'IDX'); // 'IDX' | 'EQ' | 'FO'
  const [symbol, setSymbol] = useState(initialSymbol || 'NIFTY 50');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [timeframe, setTimeframe] = useState('1d');
  const [days, setDays] = useState(30);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quoteDetails, setQuoteDetails] = useState({
    price: null,
    change: 0,
    changePercent: 0,
    dayHigh: null,
    dayLow: null,
    openPrice: null,
    prevClose: null,
    volume: 0,
    displayName: '',
    marketStatus: null,
    source: ''
  });
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'table'
  const searchTimeoutRef = useRef(null);

  // Sync external initialSymbol if changed
  useEffect(() => {
    if (initialSymbol && initialSymbol !== symbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Sync external initialSegment if changed
  useEffect(() => {
    if (initialSegment && initialSegment !== segment) {
      setSegment(initialSegment);
    }
  }, [initialSegment]);

  const TIMEFRAMES = [
    { id: '1m', label: '1 Min', desc: 'Intraday scalping' },
    { id: '5m', label: '5 Min', desc: 'Momentum breakout' },
    { id: '15m', label: '15 Min', desc: 'Day trading' },
    { id: '30m', label: '30 Min', desc: 'Session swing' },
    { id: '1h', label: '1 Hour', desc: 'Hourly trend' },
    { id: '1d', label: 'Daily (1D)', desc: 'Positional & EOD' },
    { id: '1w', label: 'Weekly', desc: 'Multi-week swing' },
    { id: '1M', label: 'Monthly', desc: 'Long-term macro' }
  ];

  const SEGMENTS = [
    { id: 'IDX', label: 'Indices (IDX)', count: 'Nifty, BankNifty, IT' },
    { id: 'EQ', label: 'Equities (EQ)', count: 'Reliance, TCS, HDFC' },
    { id: 'FO', label: 'Futures & Options (FO)', count: 'Active Month F&O' }
  ];

  const POPULAR_INDICES = [
    { symbol: 'NIFTY 50', label: 'Nifty 50' },
    { symbol: 'NIFTY BANK', label: 'Bank Nifty' },
    { symbol: 'NIFTY IT', label: 'Nifty IT' },
    { symbol: 'NIFTY NEXT 50', label: 'Next 50' },
    { symbol: 'NIFTY AUTO', label: 'Auto' },
    { symbol: 'BSE SENSEX', label: 'Sensex' }
  ];

  // Fetch symbol search when searchQuery or segment changes
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const queryParam = encodeURIComponent(searchQuery || '');
        const res = await fetch(`/api/openchart/symbols?segment=${segment}&symbol=${queryParam}`);
        const data = await res.json();
        if (data && data.status && Array.isArray(data.data)) {
          setSearchResults(data.data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Failed to search symbols:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [segment, searchQuery]);

  // Fetch historical OHLCV chart data
  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const symParam = encodeURIComponent(symbol);
      const res = await fetch(`/api/openchart/historical?symbol=${symParam}&segment=${segment}&interval=${timeframe}&days=${days}`);
      const result = await res.json();

      if (result && result.unavailable) {
        setCandles([]);
        setError("Chart data unavailable");
      } else if (result && result.status && Array.isArray(result.data) && result.data.length > 0) {
        setCandles(result.data);
        setQuoteDetails({
          price: result.currentPrice,
          change: result.change ?? 0,
          changePercent: result.changePercent ?? 0,
          dayHigh: result.dayHigh ?? result.currentPrice,
          dayLow: result.dayLow ?? result.currentPrice,
          openPrice: result.openPrice ?? result.currentPrice,
          prevClose: result.prevClose ?? result.currentPrice,
          volume: result.volume ?? 0,
          displayName: result.displayName || symbol,
          marketStatus: result.marketStatus,
          source: result.source
        });
        setLastRefreshedAt(new Date());
      } else {
        setCandles([]);
        setError("Chart data unavailable");
      }
    } catch (err) {
      console.error("Historical data fetch failed:", err);
      setError("Chart data unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol, segment, timeframe, days]);

  // Real-time market hours continuous live indexing (Immediate + 1s ultra-fast streaming)
  useEffect(() => {
    let intervalId = null;
    const pollLiveQuote = async () => {
      if (!isLiveStreaming) return;
      try {
        const symParam = encodeURIComponent(symbol);
        const res = await fetch(`/api/openchart/quote?symbol=${symParam}&segment=${segment}`);
        const data = await res.json();
        if (data && data.status) {
          setQuoteDetails(prev => ({
            ...prev,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            dayHigh: data.dayHigh,
            dayLow: data.dayLow,
            openPrice: data.openPrice,
            prevClose: data.prevClose,
            volume: data.volume,
            marketStatus: data.marketStatus,
            displayName: data.displayName || prev.displayName
          }));
          setLastRefreshedAt(new Date());

          // Dynamically synchronize the final candle's close with the live market tick
          setCandles(prev => {
            if (!prev || prev.length === 0) return prev;
            const copy = [...prev];
            const lastIdx = copy.length - 1;
            const last = { ...copy[lastIdx] };
            last.close = data.price;
            last.high = Math.max(last.high, data.price);
            last.low = Math.min(last.low, data.price);
            copy[lastIdx] = last;
            return copy;
          });
        }
      } catch (e) {
        // silent background polling catch
      }
    };

    pollLiveQuote(); // Instant trigger on mount / symbol change
    intervalId = setInterval(pollLiveQuote, 1000); // 1-second continuous live stream
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [symbol, segment, isLiveStreaming]);

  // Card theme classes
  const cardBg = isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-200';
  const headerBg = isDark ? 'bg-black/30' : 'bg-gray-50';

  const isPositive = (quoteDetails.change || 0) >= 0;
  const rangeSpan = Math.max(0.01, (quoteDetails.dayHigh || 1) - (quoteDetails.dayLow || 1));
  const rangePositionPercent = Math.min(100, Math.max(0, (((quoteDetails.price || quoteDetails.dayLow || 0) - (quoteDetails.dayLow || 0)) / rangeSpan) * 100));

  // Format ApexChart series
  const series = [
    {
      name: symbol,
      data: candles.map(c => ({
        x: new Date(c.timestamp).getTime(),
        y: [c.open, c.high, c.low, c.close]
      }))
    }
  ];

  const chartOptions = {
    chart: {
      type: 'candlestick',
      height: 480,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: false
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    annotations: {
      yaxis: quoteDetails.price != null ? [
        {
          y: Number(quoteDetails.price),
          borderColor: isPositive ? '#10b981' : '#ef4444',
          strokeDashArray: 4,
          borderWidth: 2,
          opacity: 0.95,
          label: {
            borderColor: isPositive ? '#10b981' : '#ef4444',
            style: {
              color: '#ffffff',
              background: isPositive ? '#059669' : '#dc2626',
              fontWeight: 800,
              fontSize: '11px',
              padding: { left: 8, right: 8, top: 4, bottom: 4 }
            },
            text: `₹${Number(quoteDetails.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Live Index)`
          }
        }
      ] : []
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#4b5563',
          fontSize: '11px'
        },
        datetimeUTC: false
      },
      axisBorder: {
        color: isDark ? '#262626' : '#e5e7eb'
      },
      axisTicks: {
        color: isDark ? '#262626' : '#e5e7eb'
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#4b5563',
          fontSize: '11px'
        },
        formatter: (val) => Number(val).toFixed(2)
      },
      opposite: true
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981',
          downward: '#ef4444'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    grid: {
      borderColor: isDark ? '#262626' : '#f3f4f6',
      strokeDashArray: 3
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: {
        format: 'dd MMM yyyy, HH:mm'
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (candles.length === 0) return;
    const headers = ['Timestamp', 'Date', 'Time', 'Open', 'High', 'Low', 'Close', 'Volume'];
    const rows = candles.map(c => {
      const d = new Date(c.timestamp);
      return [
        c.timestamp,
        d.toLocaleDateString('en-GB'),
        d.toLocaleTimeString('en-US', { hour12: false }),
        c.open,
        c.high,
        c.low,
        c.close,
        c.volume
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OpenChart_${symbol.replace(/\s+/g, '_')}_${timeframe}_${days}D.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={embedded ? "space-y-4 max-w-full overflow-hidden" : "space-y-6 max-w-full overflow-hidden"} id="openchart_root_container">
      {/* Header Banner (Full mode only) */}
      {!embedded && (
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm relative overflow-hidden`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                  OC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      OpenChart Historical Data Engine
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Accurate Exchange Feeds
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Live market index tracking during market hours with multi-interval candlestick analysis & EOD history.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={candles.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={14} />
                Export CSV ({candles.length} bars)
              </button>

              <button
                onClick={fetchHistoricalData}
                disabled={loading}
                className={`p-2 rounded-lg border transition-all ${
                  isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
                title="Refresh Live Data"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-500' : ''} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Market Index & Real-Time Stats Display */}
      <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-4`}>
        {/* Top Status & Price Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-white/10">
          {/* Symbol & Live Spot Price */}
          <div className="flex items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{segment}</span>
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                  {quoteDetails.displayName || symbol}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                  ₹{quoteDetails.price != null ? Number(quoteDetails.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                </span>
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                  isPositive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {isPositive ? '+' : ''}{quoteDetails.change?.toFixed(2)} ({isPositive ? '+' : ''}{quoteDetails.changePercent?.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Market Hours Indicator & Quick Status */}
          <div className="flex flex-wrap items-center gap-3">
            {quoteDetails.marketStatus?.isMarketOpen ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>NSE LIVE MARKET OPEN</span>
                <span className="text-gray-400 font-mono text-[11px] font-normal">
                  ({quoteDetails.marketStatus?.istTime || '09:15 - 15:30 IST'})
                </span>
              </div>
            ) : quoteDetails.marketStatus?.isPreMarket ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>NSE PRE-MARKET</span>
                <span className="text-gray-400 font-mono text-[11px] font-normal">
                  ({quoteDetails.marketStatus?.istTime || '09:00 - 09:15 IST'})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                <span>NSE MARKET CLOSED</span>
                <span className="text-gray-500 font-mono text-[11px]">
                  ({quoteDetails.marketStatus?.istTime || 'Next Session: 09:15 IST'})
                </span>
              </div>
            )}

            {lastRefreshedAt && (
              <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                Sync: {lastRefreshedAt.toLocaleTimeString('en-IN', { hour12: false })}
              </span>
            )}
          </div>
        </div>

        {/* Intraday Range & Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 text-xs">
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Day Range</span>
            <div className="flex justify-between font-mono font-bold mt-0.5 text-[11px]">
              <span className="text-red-500">₹{quoteDetails.dayLow?.toFixed(2) || '—'}</span>
              <span className="text-emerald-500">₹{quoteDetails.dayHigh?.toFixed(2) || '—'}</span>
            </div>
            {/* Visual range meter */}
            <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${rangePositionPercent}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Session Open</span>
            <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5 text-xs">
              ₹{quoteDetails.openPrice != null ? Number(quoteDetails.openPrice).toFixed(2) : '—'}
            </div>
            <span className="text-[10px] text-gray-400">At 09:15:00 IST</span>
          </div>

          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Previous Close</span>
            <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5 text-xs">
              ₹{quoteDetails.prevClose != null ? Number(quoteDetails.prevClose).toFixed(2) : '—'}
            </div>
            <span className="text-[10px] text-gray-400">NSE Official EOD</span>
          </div>

          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Data Source</span>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 text-xs truncate">
              {quoteDetails.source || "NSE Exchange Live Data"}
            </div>
            <span className="text-[10px] text-gray-400">OpenChart Engine</span>
          </div>
        </div>

        {/* Quick Index Selector (When Segment is IDX) */}
        {segment === 'IDX' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-400 mr-1">Major Indices:</span>
            {POPULAR_INDICES.map(idx => (
              <button
                key={idx.symbol}
                onClick={() => {
                  setSymbol(idx.symbol);
                  if (onSelectSymbol) onSelectSymbol(idx.symbol, 'IDX');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  symbol === idx.symbol
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark 
                      ? 'bg-white/5 text-gray-300 hover:bg-white/10' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx.label}
              </button>
            ))}
          </div>
        )}

        {/* Segment Selector & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
          {/* Segment Selector */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0">
            {SEGMENTS.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSegment(s.id);
                  let defSym = 'NIFTY 50';
                  if (s.id === 'IDX') defSym = 'NIFTY 50';
                  else if (s.id === 'EQ') defSym = 'RELIANCE-EQ';
                  else defSym = 'NIFTY26JANFUT';
                  setSymbol(defSym);
                  if (onSelectSymbol) onSelectSymbol(defSym, s.id);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  segment === s.id
                    ? 'bg-white dark:bg-[#202020] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Timeframe Chips */}
          <div className="flex flex-wrap items-center gap-1 shrink-0">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                title={tf.desc}
                className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all ${
                  timeframe === tf.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : isDark
                      ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tf.id}
              </button>
            ))}
          </div>

          {/* Lookback Range in Days & CSV */}
          <div className="flex flex-wrap items-center gap-1 text-xs font-semibold shrink-0">
            <span className="text-gray-400 text-[11px] mr-0.5">Lookback:</span>
            {[7, 30, 90, 180, 365].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  days === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {d}D
              </button>
            ))}
            {embedded && (
              <button
                onClick={handleExportCSV}
                disabled={candles.length === 0}
                className="ml-1 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
                title="Export Candlestick CSV"
              >
                <FileSpreadsheet size={12} /> CSV
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Symbol Search Autocomplete */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${segment} symbols (e.g. NIFTY, BANKNIFTY, RELIANCE, TCS)...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-all ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Search Results Pills */}
        {searchResults.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-white/10">
            <div className="text-[11px] font-semibold text-gray-400 mb-2">
              Found {searchResults.length} {segment} symbols:
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {searchResults.slice(0, 15).map((item, idx) => (
                <button
                  key={`${item.scripcode}-${idx}`}
                  onClick={() => {
                    setSymbol(item.symbol);
                    setSearchQuery('');
                    if (onSelectSymbol) onSelectSymbol(item.symbol, segment);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    symbol === item.symbol
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : isDark
                        ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{item.symbol}</span>
                  <span className="text-[10px] opacity-60">#{item.scripcode}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main View Tabs (Chart | Data Table | Code Snippet) */}
      <div className={`rounded-xl border ${cardBg} overflow-hidden shadow-sm`}>
        <div className={`flex items-center justify-between border-b px-4 py-2.5 ${headerBg} border-gray-200 dark:border-white/10`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'chart'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 size={14} /> Candlestick Chart
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'table'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet size={14} /> Data Ledger ({candles.length})
            </button>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Timeframe: <span className="font-bold text-emerald-500">{timeframe}</span> | Period: <span className="font-bold text-emerald-500">{days} Days</span>
          </div>
        </div>

        {/* Tab 1: Interactive Candlestick Chart */}
        {activeTab === 'chart' && (
          <div className="p-4 space-y-3">
            {/* Live Current Price Indexing In-Chart Banner */}
            {quoteDetails.price != null && (
              <div className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'} font-mono text-xs`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Live Index
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {quoteDetails.displayName || symbol}
                  </span>
                  <span className={`text-base font-black ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    ₹{Number(quoteDetails.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isPositive ? '+' : ''}{Number(quoteDetails.change || 0).toFixed(2)} ({isPositive ? '+' : ''}{Number(quoteDetails.changePercent || 0).toFixed(2)}%)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-[11px]">
                  {quoteDetails.dayHigh != null && <span>H: <strong className="text-gray-800 dark:text-gray-200">₹{Number(quoteDetails.dayHigh).toFixed(2)}</strong></span>}
                  {quoteDetails.dayLow != null && <span>L: <strong className="text-gray-800 dark:text-gray-200">₹{Number(quoteDetails.dayLow).toFixed(2)}</strong></span>}
                  {candles.length > 0 && (
                    <span className="hidden sm:inline text-gray-400 border-l border-gray-200 dark:border-white/10 pl-2">
                      Bars: <strong className="text-emerald-500">{candles.length}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-3">
                <RefreshCw size={32} className="animate-spin text-emerald-500" />
                <p className="text-sm font-semibold text-gray-400">Loading {symbol} ({timeframe}) candles...</p>
              </div>
            ) : error ? (
              <div className="h-96 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="text-gray-400 font-semibold">{error === "Chart data unavailable" ? "Chart data unavailable" : "Failed to render candles"}</div>
                {error !== "Chart data unavailable" && <p className="text-xs text-gray-400">{error}</p>}
                <button
                  onClick={fetchHistoricalData}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                >
                  Retry Request
                </button>
              </div>
            ) : candles.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center space-y-2">
                <div className="text-gray-400 text-sm">Chart data unavailable</div>
                <p className="text-xs text-gray-500">Try selecting a larger lookback period or different timeframe.</p>
              </div>
            ) : (
              <div className="w-full">
                <ReactApexChart
                  options={chartOptions}
                  series={series}
                  type="candlestick"
                  height={480}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: OHLCV Data Table */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className={`sticky top-0 ${headerBg} border-b border-gray-200 dark:border-white/10 font-bold text-gray-500 uppercase tracking-wider`}>
                <tr>
                  <th className="py-2.5 px-4">Time (IST)</th>
                  <th className="py-2.5 px-4 text-right">Open</th>
                  <th className="py-2.5 px-4 text-right">High</th>
                  <th className="py-2.5 px-4 text-right">Low</th>
                  <th className="py-2.5 px-4 text-right">Close</th>
                  <th className="py-2.5 px-4 text-right">Volume</th>
                  <th className="py-2.5 px-4 text-right">Candle Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                {candles.slice().reverse().map((c, i) => {
                  const isGreen = c.close >= c.open;
                  const range = (c.high - c.low).toFixed(2);
                  const dateStr = new Date(c.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2 px-4 text-gray-400">{dateStr}</td>
                      <td className="py-2 px-4 text-right">₹{c.open.toFixed(2)}</td>
                      <td className="py-2 px-4 text-right text-emerald-500">₹{c.high.toFixed(2)}</td>
                      <td className="py-2 px-4 text-right text-red-500">₹{c.low.toFixed(2)}</td>
                      <td className={`py-2 px-4 text-right font-bold ${isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{c.close.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-400">{c.volume.toLocaleString()}</td>
                      <td className="py-2 px-4 text-right text-gray-500">₹{range}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🤖 AI Overview Downside the Charts & 🧠 Insights | 📰 News & Analysis */}
      {!embedded && (
        <ChartAiOverviewInsights symbol={symbol} theme={theme} />
      )}

      {/* Feature Highlights Grid (Full mode only) */}
      {!embedded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1.5 text-emerald-500 font-bold text-sm">
              <Search size={16} /> Dynamic Symbol Discovery
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Search symbols by segment: Indices (NIFTY 50, BANKNIFTY), Equities (RELIANCE, TCS), and Futures & Options strike tokens.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1.5 text-blue-500 font-bold text-sm">
              <Clock size={16} /> Multi-Timeframe OHLCV
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supports 1m, 3m, 5m, 10m, 15m, 30m, 1h, 1d, 1w, and 1M candlestick intervals with market hour cutoff filtering.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1.5 text-amber-500 font-bold text-sm">
              <Download size={16} /> Direct CSV Export
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Export raw candlestick historical ledgers to CSV for backtesting and spreadsheet analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
