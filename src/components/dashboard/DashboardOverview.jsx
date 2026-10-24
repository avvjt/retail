import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import MarketScheduleBanner from './MarketScheduleBanner';
import SectorHeatmap from './SectorHeatmap';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  Target, 
  Clock, 
  RefreshCw, 
  Volume2, 
  Sparkles, 
  ArrowRight, 
  ArrowUpRight,
  ArrowDownRight,
  Compass, 
  Layers, 
  Sliders, 
  Play, 
  ShieldCheck, 
  Brain, 
  Bot, 
  Newspaper, 
  Send, 
  ChevronRight,
  Building2,
  Briefcase,
  CheckCircle,
  HelpCircle,
  BarChart2,
  Check,
  Bell,
  Grid3x3,
  BookOpen,
  Cpu,
  Link,
  Users,
  MessageSquare,
  GraduationCap,
  FileBarChart,
  CreditCard,
  Radar,
  Star,
  Settings
} from 'lucide-react';

// Indian Flag Badge Component
const IndiaFlagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 36 36" className="rounded-full shadow-sm shrink-0 border border-slate-700/40">
    <rect width="36" height="12" fill="#FF9933" />
    <rect y="12" width="36" height="12" fill="#FFFFFF" />
    <rect y="24" width="36" height="12" fill="#138808" />
    {/* Ashok Chakra */}
    <circle cx="18" cy="18" r="4.5" fill="none" stroke="#000080" strokeWidth="0.8" />
    <circle cx="18" cy="18" r="1" fill="#000080" />
    {[...Array(12)].map((_, i) => (
      <line
        key={i}
        x1="18"
        y1="18"
        x2={18 + 4.2 * Math.cos((i * Math.PI) / 6)}
        y2={18 + 4.2 * Math.sin((i * Math.PI) / 6)}
        stroke="#000080"
        strokeWidth="0.4"
      />
    ))}
  </svg>
);

// Smooth SVG Sparkline component
const Sparkline = ({ data = [20, 25, 22, 35, 30, 45, 40, 55, 60], isUp = true, id = 'spark' }) => {
  const width = 120;
  const height = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  const fillColor = isUp ? 'url(#greenGrad-' + id + ')' : 'url(#redGrad-' + id + ')';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`greenGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id={`redGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={fillColor}
      />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default function DashboardOverview({ theme: propTheme }) {
  const outletContext = useOutletContext();
  const theme = propTheme || outletContext?.theme || 'dark';
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Greeting time calculation
  const [greeting, setGreeting] = useState('Good Morning, Trader 👋');
  useEffect(() => {
    const kolkataTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const hour = new Date(kolkataTimeStr).getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning, Trader 👋');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good Afternoon, Trader 👋');
    } else {
      setGreeting('Good Evening, Trader 👋');
    }
  }, []);

  // Top Movers Tab State
  const [moversTab, setMoversTab] = useState('Nifty 50');

  // Market News Category Filter State
  const [newsFilter, setNewsFilter] = useState('All');

  // Options Intel Filter State
  const [optionsFilter, setOptionsFilter] = useState('Nifty 50');

  // Quick Modules Category Filter & Expansion State
  const [moduleFilter, setModuleFilter] = useState('all');
  const [showAllModules, setShowAllModules] = useState(false);

  // Alpha Copilot prompt state
  const [copilotQuery, setCopilotQuery] = useState('');

  // Live Market State
  const [indexTickers, setIndexTickers] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [rawMovers, setRawMovers] = useState([]);
  const [isDataUnavailable, setIsDataUnavailable] = useState(false);

  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastLiveUpdated, setLastLiveUpdated] = useState(null);
  const [isMarketOpenState, setIsMarketOpenState] = useState(false);

  // Live Async Datasets for Cards
  const [newsFeed, setNewsFeed] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [aiWatchlistData, setAiWatchlistData] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [optionsIntelData, setOptionsIntelData] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [smartMoneyData, setSmartMoneyData] = useState([]);
  const [smartMoneyLoading, setSmartMoneyLoading] = useState(true);
  const [fiiDiiFlow, setFiiDiiFlow] = useState(null);
  const [fiiDiiLoading, setFiiDiiLoading] = useState(true);

  // Fetch Live Overview from backend API
  const fetchOverview = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
      fetchNews();
      fetchWatchlist();
      fetchOptionsIntel();
      fetchSmartMoney();
    }
    try {
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.unavailable) {
          setIsDataUnavailable(true);
          setIsLiveConnected(false);
          setIndexTickers([]);
          return;
        }
        setIsDataUnavailable(false);
        if (data.indexTickers && Array.isArray(data.indexTickers)) {
          setIndexTickers(data.indexTickers);
        }
        if (data.sentiment) {
          setSentiment(data.sentiment);
        }
        if (data.moversData && Array.isArray(data.moversData)) {
          setRawMovers(data.moversData);
        }
        if (data.marketOpen !== undefined) {
          setIsMarketOpenState(Boolean(data.marketOpen));
        }
        setIsLiveConnected(true);
        setLastLiveUpdated(new Date());
      } else {
        setIsDataUnavailable(true);
        setIsLiveConnected(false);
      }
    } catch (err) {
      console.warn('Live overview fetch error:', err);
      setIsLiveConnected(false);
      setIsDataUnavailable(true);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNewsFeed(data.map((item, idx) => ({
            id: item.id || `news-${idx}`,
            category: item.category || 'Markets',
            headline: item.title || item.headline,
            source: item.source || 'Exchange News',
            time: item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
            url: item.url
          })));
        } else {
          setNewsFeed([]);
        }
      } else {
        setNewsFeed([]);
      }
    } catch (err) {
      setNewsFeed([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let symbols = ['RELIANCE', 'HDFCBANK', 'INFY', 'TCS', 'ICICIBANK'];
      
      try {
        const wRes = await fetch('/api/watchlist', { headers });
        if (wRes.ok) {
          const wData = await wRes.json();
          if (Array.isArray(wData) && wData.length > 0) {
            const extracted = wData.map(item => item.symbol || item).filter(Boolean);
            if (extracted.length > 0) symbols = extracted;
          }
        }
      } catch {}

      // NSE stocks need the .NS suffix to resolve; indices (^), forex (=) and crypto (-) already carry theirs.
      const toYahoo = (sym) => (/[.^=\-]/.test(sym) ? sym : `${sym}.NS`);
      const qRes = await fetch(`/api/market/quotes?symbols=${symbols.slice(0, 5).map(toYahoo).join(',')}`);
      if (qRes.ok) {
        const qData = await qRes.json();
        if (Array.isArray(qData) && qData.length > 0) {
          setAiWatchlistData(qData.map(q => {
            // /api/market/quotes returns Yahoo-style fields (regularMarket*), not price/change.
            const price = q.regularMarketPrice ?? q.price;
            const chgPct = q.regularMarketChangePercent ?? q.changePercent;
            const hasChange = chgPct !== undefined && chgPct !== null;
            const isUp = Number(hasChange ? chgPct : (q.regularMarketChange ?? q.change ?? 0)) >= 0;
            return {
              symbol: String(q.symbol || '').replace(/\.NS$/, ''),
              ltp: price != null ? Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
              changePct: hasChange ? `${isUp ? '+' : ''}${Number(chgPct).toFixed(2)}%` : '—',
              isUp,
              view: hasChange ? (isUp ? 'Positive Momentum' : 'Negative Momentum') : '—',
              viewColor: !hasChange
                ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                : isUp ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            };
          }));
        } else {
          setAiWatchlistData([]);
        }
      } else {
        setAiWatchlistData([]);
      }
    } catch {
      setAiWatchlistData([]);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const fetchOptionsIntel = async () => {
    setOptionsLoading(true);
    try {
      const symbol = optionsFilter === 'Bank Nifty' ? 'BANKNIFTY' : 'NIFTY';
      const res = await fetch(`/api/options/snapshots?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.unavailable && Array.isArray(data.strikes) && data.strikes.length > 0) {
          const sorted = [...data.strikes].sort((a, b) => (b.callOi + b.putOi) - (a.callOi + a.putOi)).slice(0, 5);
          setOptionsIntelData(sorted.map(s => {
            const isCallDominant = s.callOi >= s.putOi;
            return {
              symbol: `${symbol} ${s.strikePrice} ${isCallDominant ? 'CE' : 'PE'}`,
              type: isCallDominant ? 'CE' : 'PE',
              strike: `₹${s.strikePrice.toLocaleString('en-IN')}`,
              activity: isCallDominant ? 'High Call OI Concentration' : 'High Put OI Concentration',
              isPositive: isCallDominant
            };
          }));
        } else {
          setOptionsIntelData([]);
        }
      } else {
        setOptionsIntelData([]);
      }
    } catch {
      setOptionsIntelData([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  const fetchSmartMoney = async () => {
    setSmartMoneyLoading(true);
    setFiiDiiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [dealsRes, flowsRes] = await Promise.all([
        fetch('/api/smart-money/deals', { headers }).catch(() => null),
        fetch('/api/smart-money/flows', { headers }).catch(() => null)
      ]);

      let combinedSignals = [];
      if (dealsRes && dealsRes.ok) {
        const deals = await dealsRes.json();
        if (Array.isArray(deals)) {
          combinedSignals.push(...deals.map(d => ({
            symbol: d.symbol,
            activity: d.institution || d.signal || 'Institutional Block Flow',
            category: d.dealType || 'Block Deal',
            time: d.time || (d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today')
          })));
        }
      }
      if (flowsRes && flowsRes.ok) {
        const flows = await flowsRes.json();
        if (Array.isArray(flows) && flows.length > 0) {
          const latest = flows[0];
          setFiiDiiFlow({
            fiiNet: latest.fiiNetBuySell ?? null,
            diiNet: latest.diiNetBuySell ?? null,
            totalNet: (latest.fiiNetBuySell !== null && latest.diiNetBuySell !== null) ? (latest.fiiNetBuySell + latest.diiNetBuySell) : null,
            date: latest.date || 'Today'
          });
          combinedSignals.push(...flows.map(f => ({
            symbol: f.symbol || 'FII/DII',
            activity: f.fiiNetBuySell !== null ? `FII Net: ₹${f.fiiNetBuySell} Cr` : 'Institutional Flow',
            category: 'FII/DII Flow',
            time: f.date || 'EOD'
          })));
        } else {
          setFiiDiiFlow(null);
        }
      } else {
        setFiiDiiFlow(null);
      }

      setSmartMoneyData(combinedSignals.slice(0, 5));
    } catch {
      setSmartMoneyData([]);
      setFiiDiiFlow(null);
    } finally {
      setSmartMoneyLoading(false);
      setFiiDiiLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchWatchlist();
    fetchSmartMoney();
  }, []);

  useEffect(() => {
    fetchOptionsIntel();
  }, [optionsFilter]);

  // Determine granular Indian Market Session Status (Pre-Open, Trading, Post-Closing, Closed)
  const marketSession = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false
      }).formatToParts(new Date());

      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const weekday = parts.find(p => p.type === 'weekday')?.value || '';
      const totalMinutes = hour * 60 + minute;

      const isWeekend = weekday === 'Sat' || weekday === 'Sun';
      if (isWeekend) {
        return { label: 'Weekend Closed', color: 'slate', isOpen: false };
      }
      if (totalMinutes >= 540 && totalMinutes < 548) { // 09:00 - 09:08
        return { label: 'Pre-Open Session', color: 'amber', isOpen: true };
      }
      if (totalMinutes >= 555 && totalMinutes <= 930) { // 09:15 - 15:30
        return { label: 'Regular Market Open', color: 'emerald', isOpen: true };
      }
      if (totalMinutes > 930 && totalMinutes <= 960) { // 15:30 - 16:00
        return { label: 'Post-Market Session', color: 'blue', isOpen: false };
      }
      return { label: 'Market Closed', color: 'slate', isOpen: false };
    } catch {
      return { label: isMarketOpenState ? 'Market Open' : 'Market Closed', color: isMarketOpenState ? 'emerald' : 'slate', isOpen: isMarketOpenState };
    }
  }, [isMarketOpenState]);

  useEffect(() => {
    fetchOverview();

    let intervalId = null;
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      // Use conservative refresh interval when market is closed (30s) vs active hours (6s)
      const pollTime = isMarketOpenState ? 6000 : 30000;
      intervalId = setInterval(() => {
        // Pause if document is not visible
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        fetchOverview();
      }, pollTime);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOverview();
        startPolling();
      } else if (intervalId) {
        clearInterval(intervalId);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMarketOpenState]);

  // Filter and sort movers dynamically based on active tab
  const moversData = React.useMemo(() => {
    const list = [...rawMovers];
    if (moversTab === 'Top Gainers') {
      return list.sort((a, b) => {
        const numA = parseFloat(a.changePct.replace('%', '').replace('+', '')) || 0;
        const numB = parseFloat(b.changePct.replace('%', '').replace('+', '')) || 0;
        return numB - numA;
      }).map((m, i) => ({ ...m, rank: i + 1 }));
    }
    if (moversTab === 'Top Losers') {
      return list.sort((a, b) => {
        const numA = parseFloat(a.changePct.replace('%', '').replace('+', '')) || 0;
        const numB = parseFloat(b.changePct.replace('%', '').replace('+', '')) || 0;
        return numA - numB;
      }).map((m, i) => ({ ...m, rank: i + 1 }));
    }
    if (moversTab === 'High Volume') {
      return list.sort((a, b) => (b.symbol === 'RELIANCE' || b.symbol === 'HDFCBANK' ? 1 : -1)).map((m, i) => ({ ...m, rank: i + 1 }));
    }
    return list;
  }, [rawMovers, moversTab]);

  // Comprehensive Platform Modules Directory
  const allPlatformModules = [
    // Markets
    {
      id: 'watchlist',
      title: 'AI Watchlist',
      subtitle: 'Track & analyze stocks',
      icon: Star,
      color: 'from-blue-600 to-indigo-600',
      path: '/dashboard/watchlist',
      category: 'markets'
    },
    {
      id: 'options',
      title: 'Options Intel',
      subtitle: 'Chain & PCR analytics',
      icon: Layers,
      color: 'from-purple-600 to-pink-600',
      path: '/dashboard/options',
      category: 'markets'
    },
    {
      id: 'smart-money',
      title: 'Smart Money',
      subtitle: 'Institutional flows & bulk',
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      path: '/dashboard/smart-money',
      category: 'markets'
    },
    {
      id: 'heatmap',
      title: 'Market Heatmap',
      subtitle: 'Sectoral performance tree',
      icon: Grid3x3,
      color: 'from-amber-600 to-orange-600',
      path: '/dashboard/heatmap',
      category: 'markets'
    },
    {
      id: 'global-indices',
      title: 'Global Indices',
      subtitle: 'World macro & Gift Nifty',
      icon: Compass,
      color: 'from-sky-600 to-blue-700',
      path: '/dashboard/global-indices',
      category: 'markets'
    },
    {
      id: 'fii-dii',
      title: 'FII/DII Data',
      subtitle: 'Institutional net activity',
      icon: Building2,
      color: 'from-indigo-600 to-violet-700',
      path: '/dashboard/fii-dii',
      category: 'markets'
    },
    {
      id: 'alerts',
      title: 'Live Alerts Feed',
      subtitle: 'Real-time NSE signals',
      icon: Bell,
      color: 'from-rose-600 to-pink-600',
      path: '/dashboard/alerts',
      category: 'markets'
    },
    // AI & Intelligence
    {
      id: 'scanners',
      title: 'Core Scanner',
      subtitle: 'Multi-indicator screening',
      icon: Sliders,
      color: 'from-amber-600 to-orange-600',
      path: '/dashboard/core-scanner',
      category: 'ai'
    },
    {
      id: 'pattern-scanner',
      title: 'Pattern Scanner',
      subtitle: 'Chart patterns & breaks',
      icon: Radar,
      color: 'from-orange-600 to-amber-700',
      path: '/dashboard/scanner',
      category: 'ai'
    },
    {
      id: 'copilot',
      title: 'Alpha Copilot',
      subtitle: 'AI market assistant',
      icon: Bot,
      color: 'from-blue-500 to-cyan-500',
      isCopilot: true,
      category: 'ai'
    },
    {
      id: 'news',
      title: 'News & Insights',
      subtitle: 'AI sentiment & summaries',
      icon: Newspaper,
      color: 'from-slate-700 to-slate-900',
      path: '/dashboard/news',
      category: 'ai'
    },
    // Trading & Execution
    {
      id: 'paper-trading',
      title: 'Paper Trading',
      subtitle: 'Virtual ₹10L simulator',
      icon: Play,
      color: 'from-cyan-600 to-blue-600',
      path: '/dashboard/paper-trading',
      category: 'trading'
    },
    {
      id: 'journal',
      title: 'Trade Journal',
      subtitle: 'AI log, stats & emotions',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-700',
      path: '/dashboard/journal',
      category: 'trading'
    },
    {
      id: 'algo-builder',
      title: 'Algo Builder',
      subtitle: 'Visual rule strategy lab',
      icon: Cpu,
      color: 'from-violet-600 to-purple-700',
      path: '/dashboard/algo-builder',
      category: 'trading'
    },
    {
      id: 'orderbook',
      title: 'L2 Orderbook',
      subtitle: 'Depth & liquidity walls',
      icon: Activity,
      color: 'from-blue-700 to-indigo-800',
      path: '/dashboard/orderbook',
      category: 'trading'
    },
    {
      id: 'broker',
      title: 'Broker Connect',
      subtitle: 'Zerodha, Upstox, Angel',
      icon: Link,
      color: 'from-sky-700 to-cyan-800',
      path: '/dashboard/broker',
      category: 'trading'
    },
    // Discipline & Psychology
    {
      id: 'risk-guard',
      title: 'AI Risk Guard',
      subtitle: 'Real-time protection rules',
      icon: ShieldCheck,
      color: 'from-rose-600 to-red-600',
      path: '/dashboard/coach',
      category: 'coach'
    },
    {
      id: 'behavioral-coach',
      title: 'Behavioral Coach',
      subtitle: 'Psychological guardrails',
      icon: Brain,
      color: 'from-violet-600 to-purple-600',
      path: '/dashboard/coach',
      category: 'coach'
    },
    {
      id: 'performance',
      title: 'Performance & Edge',
      subtitle: 'Equity curve & win rate',
      icon: BarChart2,
      color: 'from-teal-600 to-emerald-700',
      path: '/dashboard/performance',
      category: 'coach'
    },
    {
      id: 'education',
      title: 'Trader Academy',
      subtitle: 'Interactive risk lessons',
      icon: GraduationCap,
      color: 'from-indigo-600 to-blue-700',
      path: '/dashboard/education',
      category: 'coach'
    },
    {
      id: 'reports',
      title: 'Reports & P&L',
      subtitle: 'Statements & audit log',
      icon: FileBarChart,
      color: 'from-slate-700 to-slate-900',
      path: '/dashboard/reports',
      category: 'coach'
    },
    // Tools & Platform
    {
      id: 'community',
      title: 'Community Hub',
      subtitle: 'Network & share setups',
      icon: Users,
      color: 'from-pink-600 to-rose-700',
      path: '/dashboard/community',
      category: 'tools'
    },
    {
      id: 'discussions',
      title: 'Discussions',
      subtitle: 'Live trader debates',
      icon: MessageSquare,
      color: 'from-purple-700 to-pink-700',
      path: '/dashboard/discussions',
      category: 'tools'
    },
    {
      id: 'documentation',
      title: 'Documentation',
      subtitle: 'Platform guides & API',
      icon: BookOpen,
      color: 'from-cyan-700 to-slate-800',
      path: '/dashboard/documentation',
      category: 'tools'
    },
    {
      id: 'settings',
      title: 'Risk Settings',
      subtitle: 'Drawdown caps & filters',
      icon: Settings,
      color: 'from-slate-600 to-slate-800',
      path: '/dashboard/settings',
      category: 'tools'
    }
  ];

  const handleTileClick = (tile) => {
    if (tile.isCopilot) {
      window.dispatchEvent(new CustomEvent('open_copilot_ask', { detail: '' }));
    } else if (tile.path) {
      navigate(tile.path);
    }
  };

  const handleSendCopilot = (e) => {
    e?.preventDefault();
    if (copilotQuery.trim()) {
      window.dispatchEvent(new CustomEvent('open_copilot_ask', { detail: copilotQuery.trim() }));
      setCopilotQuery('');
    }
  };

  const handleChipClick = (prompt) => {
    window.dispatchEvent(new CustomEvent('open_copilot_ask', { detail: prompt }));
  };

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Greeting Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {greeting}
            </h1>
            <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              marketSession.isOpen
                ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                : (isDark ? 'bg-slate-500/10 border-slate-500/30 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600')
            }`}>
              <span className={`w-2 h-2 rounded-full ${marketSession.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{marketSession.label}</span>
            </div>

            <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              isLiveConnected 
                ? (isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700')
                : (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-blue-500' : 'bg-amber-500'}`} />
              <span>{isLiveConnected ? 'Feeds Connected' : 'Reconnecting'}</span>
              <button 
                onClick={() => fetchOverview(true)} 
                title="Refresh Market Data"
                className="ml-1 hover:opacity-75 transition-opacity"
              >
                <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Discipline today. Freedom tomorrow.
            {lastLiveUpdated && (
              <span className="ml-2 text-xs opacity-60">
                • Updated {lastLiveUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        {/* Quote Card */}
        <div className={`w-full md:w-auto max-w-lg px-4 py-3 rounded-2xl border text-xs leading-relaxed ${
          isDark 
            ? 'bg-[#0B0F17]/90 border-slate-800/80 text-slate-300' 
            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
        }`}>
          <span className="italic">"A small edge, used consistently, compounds into something massive."</span>
          <span className="block font-bold mt-1 text-blue-500">— RetailX</span>
        </div>
      </div>

      {/* Real-time NSE Trading Schedule & Holiday Countdown Banner */}
      <MarketScheduleBanner isDark={isDark} />

      {/* 2. Index Tickers Row + Market Sentiment Gauge */}
      {isDataUnavailable || indexTickers.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-[#0B0F17] border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
          <p className="text-base font-semibold">Data unavailable</p>
          <p className="text-xs mt-1 text-slate-500">Live market feed is currently offline or unreachable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {indexTickers.map((ticker, idx) => (
            <div
              key={ticker.symbol}
              onClick={() => navigate('/dashboard/analysis')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                isDark 
                  ? 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {ticker.symbol}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                  ticker.isUp 
                    ? 'text-emerald-500 bg-emerald-500/10' 
                    : 'text-rose-500 bg-rose-500/10'
                }`}>
                  {ticker.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {ticker.changePct}
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 mt-1">
                <div>
                  <div className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {ticker.price}
                  </div>
                  <div className={`text-xs font-mono font-medium mt-0.5 ${ticker.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {ticker.change}
                  </div>
                </div>

                {/* Sparkline Graphic */}
                {Array.isArray(ticker.sparkData) && ticker.sparkData.length > 1 && (
                  <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={ticker.sparkData} isUp={ticker.isUp} id={idx} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 5th Card: Market Momentum Gauge */}
          {sentiment && (
            <div
              onClick={() => navigate('/dashboard/analysis')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between ${
                isDark 
                  ? 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IndiaFlagIcon />
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Market Momentum
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className={`text-xl font-black tracking-tight mt-2 ${
                  sentiment.score >= 55 ? 'text-emerald-500' : sentiment.score >= 45 ? 'text-blue-400' : 'text-rose-500'
                }`}>
                  {sentiment.label || 'Neutral'}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                  <span>Momentum Index</span>
                  <span className={`font-mono font-bold ${sentiment.score >= 55 ? 'text-emerald-500' : sentiment.score >= 45 ? 'text-blue-400' : 'text-rose-500'}`}>
                    {sentiment.score}/100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      sentiment.score >= 55 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : sentiment.score >= 45 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                          : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, sentiment.score))}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Platform Modules Directory & Quick Access */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Platform Modules
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              {allPlatformModules.filter(m => {
                if (moduleFilter === 'all') {
                  return showAllModules ? true : [
                    'watchlist', 'options', 'smart-money', 'alerts',
                    'scanners', 'paper-trading', 'journal', 'copilot',
                    'risk-guard', 'behavioral-coach', 'algo-builder', 'heatmap'
                  ].includes(m.id);
                }
                return m.category === moduleFilter;
              }).length} of {allPlatformModules.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Featured' },
              { id: 'markets', label: 'Markets' },
              { id: 'ai', label: 'AI & Intel' },
              { id: 'trading', label: 'Trading' },
              { id: 'coach', label: 'Discipline' },
              { id: 'tools', label: 'Tools' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setModuleFilter(cat.id);
                  if (cat.id !== 'all') setShowAllModules(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  moduleFilter === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDark 
                      ? 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <button
              onClick={() => {
                if (moduleFilter !== 'all') {
                  setModuleFilter('all');
                  setShowAllModules(false);
                } else {
                  setShowAllModules(!showAllModules);
                }
              }}
              className={`ml-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                showAllModules && moduleFilter === 'all'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : isDark 
                    ? 'border-slate-800 hover:border-slate-700 text-slate-300' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              {showAllModules && moduleFilter === 'all' ? 'Compact' : 'All Modules (24)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {allPlatformModules.filter(m => {
            if (moduleFilter === 'all') {
              return showAllModules ? true : [
                'watchlist', 'options', 'smart-money', 'alerts',
                'scanners', 'paper-trading', 'journal', 'copilot',
                'risk-guard', 'behavioral-coach', 'algo-builder', 'heatmap'
              ].includes(m.id);
            }
            return m.category === moduleFilter;
          }).map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group ${
                  isDark 
                    ? 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tile.color} flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className={`text-xs font-bold leading-tight group-hover:text-blue-500 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {tile.title}
                  </div>
                  <div className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {tile.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Grid Layout - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Top Movers */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Top Movers
            </h3>
            <button
              onClick={() => navigate('/dashboard/analysis')}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto custom-scrollbar pb-1">
            {['Nifty 50', 'Top Gainers', 'Top Losers', 'High Volume'].map((tab) => (
              <button
                key={tab}
                onClick={() => setMoversTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  moversTab === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar">
            {moversData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Data unavailable
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <th className="pb-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Symbol</th>
                    <th className="pb-2 font-semibold text-right">LTP (₹)</th>
                    <th className="pb-2 font-semibold text-right">Change</th>
                    <th className="pb-2 font-semibold text-right">Change %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {moversData.map((item) => (
                    <tr 
                      key={item.symbol} 
                      onClick={() => navigate(`/dashboard/analysis?symbol=${item.symbol}`)}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 text-slate-500 font-mono">{item.rank}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md ${item.color} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                            {item.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.symbol}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[80px]">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.ltp}
                      </td>
                      <td className={`py-2.5 text-right font-mono font-medium ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.change}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {item.changePct}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Card 2: FII / DII Activity (₹ Crore) */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  FII / DII Activity (₹ Crore)
                </h3>
                <span className="text-[11px] text-slate-400">Cash Market Net Flows</span>
              </div>
              <button
                onClick={() => navigate('/dashboard/fii-dii')}
                className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
              >
                View Details <ArrowRight size={13} />
              </button>
            </div>

            {/* FII Card */}
            <div className="space-y-3 mt-4">
              {fiiDiiLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading flow data...</div>
              ) : !fiiDiiFlow || (fiiDiiFlow.fiiNet === null && fiiDiiFlow.diiNet === null) ? (
                <div className="py-6 text-center text-xs text-slate-400">Data unavailable</div>
              ) : (
                <>
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          FII (Foreign Institutional)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fiiDiiFlow.fiiNet !== null ? (fiiDiiFlow.fiiNet >= 0 ? 'Net Buyer' : 'Net Seller') : 'Daily Cash Flow'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-black font-mono ${fiiDiiFlow.fiiNet !== null && fiiDiiFlow.fiiNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {fiiDiiFlow.fiiNet !== null ? `${fiiDiiFlow.fiiNet > 0 ? '+' : ''}${fiiDiiFlow.fiiNet.toLocaleString('en-IN')}` : 'Data unavailable'}
                      </div>
                      <div className="text-[10px] text-slate-400">₹ Crore</div>
                    </div>
                  </div>

                  {/* DII Card */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          DII (Domestic Institutional)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fiiDiiFlow.diiNet !== null ? (fiiDiiFlow.diiNet >= 0 ? 'Net Buyer' : 'Net Seller') : 'Daily Cash Flow'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-black font-mono ${fiiDiiFlow.diiNet !== null && fiiDiiFlow.diiNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {fiiDiiFlow.diiNet !== null ? `${fiiDiiFlow.diiNet > 0 ? '+' : ''}${fiiDiiFlow.diiNet.toLocaleString('en-IN')}` : 'Data unavailable'}
                      </div>
                      <div className="text-[10px] text-slate-400">₹ Crore</div>
                    </div>
                  </div>

                  {/* Net Combined Flow */}
                  {fiiDiiFlow.totalNet !== null && (
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      fiiDiiFlow.totalNet >= 0
                        ? (isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                        : (isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700')
                    }`}>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className={fiiDiiFlow.totalNet >= 0 ? "text-emerald-500" : "text-rose-500"} />
                        <span className="text-xs font-bold">Net Institutional Flow</span>
                      </div>
                      <div className={`text-base font-black font-mono ${fiiDiiFlow.totalNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {fiiDiiFlow.totalNet > 0 ? '+' : ''}{fiiDiiFlow.totalNet.toLocaleString('en-IN')} Cr
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>FII/DII Institutional reporting</span>
            <span className="font-semibold text-blue-500">Updated Daily</span>
          </div>
        </div>

        {/* Card 3: Market News */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Market News
            </h3>
            <button
              onClick={() => navigate('/dashboard/news')}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto custom-scrollbar pb-1">
            {['All', 'Markets', 'Economy', 'Companies', 'Global'].map((category) => (
              <button
                key={category}
                onClick={() => setNewsFilter(category)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  newsFilter === category 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* News List */}
          <div className="space-y-3">
            {newsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading market news...</div>
            ) : newsFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Data unavailable</div>
            ) : (
              (() => {
                const filteredNews = newsFeed.filter(item => newsFilter === 'All' || item.category?.toLowerCase() === newsFilter.toLowerCase());
                return (
                  <>
                    {filteredNews
                      .slice(0, 4)
                      .map((news) => (
                        <div
                          key={news.id}
                          onClick={() => {
                            if (news.url) {
                              window.open(news.url, '_blank');
                            } else {
                              navigate('/dashboard/news');
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">
                              {news.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{news.time}</span>
                          </div>
                          <h4 className={`text-xs font-semibold leading-relaxed line-clamp-2 ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {news.headline}
                          </h4>
                          <div className="text-[10px] text-slate-400 mt-1">{news.source}</div>
                        </div>
                      ))}
                    {filteredNews.length > 4 && (
                      <div className="pt-1 text-center">
                        <button
                          onClick={() => navigate('/dashboard/news')}
                          className="text-xs font-medium text-blue-500 hover:underline"
                        >
                          View all {filteredNews.length} headlines
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Sectoral Heatmap & Institutional Money Flow */}
      <SectorHeatmap isDark={isDark} />

      {/* 5. Main Grid Layout - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 4: AI Watchlist */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-blue-500" />
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                AI Watchlist
              </h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/watchlist')}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {watchlistLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading watchlist...</div>
            ) : aiWatchlistData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Data unavailable</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <th className="pb-2 font-semibold">Symbol</th>
                    <th className="pb-2 font-semibold text-right">LTP (₹)</th>
                    <th className="pb-2 font-semibold text-right">Change %</th>
                    <th className="pb-2 font-semibold text-right">Momentum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {aiWatchlistData.map((item) => (
                    <tr 
                      key={item.symbol}
                      onClick={() => navigate('/dashboard/watchlist')}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className={`py-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.symbol}
                      </td>
                      <td className={`py-3 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.ltp}
                      </td>
                      <td className={`py-3 text-right font-mono font-bold ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.changePct}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.viewColor}`}>
                          {item.view}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Card 5: Options Intelligence */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-purple-500" />
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Options Intelligence
              </h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/options')}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto custom-scrollbar pb-1">
            {['Nifty 50', 'Bank Nifty'].map((opt) => (
              <button
                key={opt}
                onClick={() => setOptionsFilter(opt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  optionsFilter === opt 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {optionsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading options intelligence...</div>
            ) : optionsIntelData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Data unavailable</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <th className="pb-2 font-semibold">Instrument</th>
                    <th className="pb-2 font-semibold text-center">Type</th>
                    <th className="pb-2 font-semibold text-right">Strike</th>
                    <th className="pb-2 font-semibold text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {optionsIntelData.map((item, i) => (
                    <tr 
                      key={i}
                      onClick={() => navigate('/dashboard/options')}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className={`py-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.symbol}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'CE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.strike}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (item.isPositive ?? item.isBullish)
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {item.activity || item.signal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Card 6: Smart Money Activity */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Smart Money Activity
              </h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/smart-money')}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {smartMoneyLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading smart money activity...</div>
            ) : smartMoneyData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Data unavailable</div>
            ) : (
              smartMoneyData.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/dashboard/smart-money')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {item.activity || item.signal}
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    {item.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Main Grid Layout - Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 7: Paper Trading Summary Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-cyan-500" />
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Paper Trading
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                Virtual ₹10 Lakhs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">Virtual Balance</div>
                <div className={`text-base font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ₹10,00,000
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">Total Trades</div>
                <div className={`text-base font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  24
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">P&L (Return)</div>
                <div className="text-base font-black font-mono mt-0.5 text-emerald-500">
                  +12.34%
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">Win Rate</div>
                <div className="text-base font-black font-mono mt-0.5 text-emerald-500">
                  66.7%
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/paper-trading')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <span>Start Paper Trading</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 8: Behavioral Coach Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-violet-500" />
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Behavioral Coach
                </h3>
              </div>
              <button
                onClick={() => navigate('/dashboard/coach')}
                className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
              >
                Open Coach <ArrowRight size={13} />
              </button>
            </div>

            {/* Quote Banner */}
            <div className={`p-3 rounded-xl border text-xs italic mb-4 ${
              isDark ? 'bg-violet-950/20 border-violet-800/40 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-800'
            }`}>
              "Good traders manage themselves before they manage the market."
            </div>

            {/* Checklist-style tips */}
            <div className="space-y-2.5">
              {[
                'Avoid revenge trading after stop loss hits',
                'Take mandatory 15-minute breaks after 2 consecutive losses',
                'Stick to your pre-market sizing plan',
                'Focus on execution process, not short-term profit'
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span className={`text-xs font-medium leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Trading Discipline Score:</span>
            <span className="font-bold text-emerald-500 font-mono">88 / 100</span>
          </div>
        </div>

        {/* Card 9: Alpha Copilot Chat Widget */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-blue-500" />
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Alpha Copilot (AI)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                New
              </span>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                "What's the outlook for NIFTY?",
                "Top breakout stocks today",
                "Explain PCR data",
                "Should I book profits in HDFC?",
                "Sector outlook for next week"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                    isDark 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-blue-500/40 hover:text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Input Form */}
          <form onSubmit={handleSendCopilot} className="mt-2">
            <div className={`flex items-center rounded-xl border p-1.5 ${
              isDark ? 'bg-slate-900/80 border-slate-800 focus-within:border-blue-500' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400'
            }`}>
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask anything about the market..."
                className={`w-full py-1.5 px-3 bg-transparent text-xs focus:outline-none placeholder:text-xs ${
                  isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!copilotQuery.trim()}
                className={`p-2 rounded-lg transition-all ${
                  copilotQuery.trim() 
                    ? 'bg-blue-600 text-white hover:bg-blue-500' 
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              AI can make mistakes. Please verify important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
