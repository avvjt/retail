import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowRight, 
  TrendingUp, 
  Bot, 
  Compass, 
  Layers, 
  Sliders, 
  Play, 
  ShieldCheck, 
  Brain, 
  Newspaper, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

const SEARCHABLE_ITEMS = [
  // Modules
  { type: 'module', title: 'Dashboard', subtitle: 'Overview & Market Snapshot', path: '/dashboard', icon: TrendingUp },
  { type: 'module', title: 'Market Overview', subtitle: 'Indices, Heatmaps & Technicals', path: '/dashboard/analysis', icon: TrendingUp },
  { type: 'module', title: 'Live Alerts Feed', subtitle: 'Real-time NSE signals & institutional alerts', path: '/dashboard/alerts', icon: TrendingUp },
  { type: 'module', title: 'Market Heatmap', subtitle: 'Sectoral performance tree & stock strength', path: '/dashboard/heatmap', icon: Layers },
  { type: 'module', title: 'Global Indices', subtitle: 'S&P 500, Nasdaq, Nikkei, Gift Nifty & commodities', path: '/dashboard/global-indices', icon: Compass },
  { type: 'module', title: 'AI Watchlist', subtitle: 'Track & analyze high momentum stocks', path: '/dashboard/watchlist', icon: Compass },
  { type: 'module', title: 'Options Intelligence', subtitle: 'Option chain analytics & open interest', path: '/dashboard/options', icon: Layers },
  { type: 'module', title: 'Smart Money Activity', subtitle: 'Institutional FII/DII tracking & bulk deals', path: '/dashboard/smart-money', icon: TrendingUp },
  { type: 'module', title: 'FII/DII Activity', subtitle: 'Foreign and domestic institutional flows', path: '/dashboard/fii-dii', icon: TrendingUp },
  { type: 'module', title: 'Scanners & Filters', subtitle: 'Real-time multi-timeframe pattern filters', path: '/dashboard/core-scanner', icon: Sliders },
  { type: 'module', title: 'Pattern Scanner', subtitle: 'Chart pattern detection & breakout scanner', path: '/dashboard/scanner', icon: Sliders },
  { type: 'module', title: 'Paper Trading', subtitle: 'Virtual trading engine with ₹10L balance', path: '/dashboard/paper-trading', icon: Play },
  { type: 'module', title: 'Trade Journal', subtitle: 'AI-powered trading log, screenshots & emotion tracking', path: '/dashboard/journal', icon: Play },
  { type: 'module', title: 'Algo Strategy Builder', subtitle: 'Visual no-code rule builder & strategy backtester', path: '/dashboard/algo-builder', icon: Sliders },
  { type: 'module', title: 'Level-2 Orderbook', subtitle: 'Market depth, bid-ask distribution & liquidity walls', path: '/dashboard/orderbook', icon: Layers },
  { type: 'module', title: 'Broker Connect', subtitle: 'Connect Zerodha Kite, Upstox, Angel One, Dhan', path: '/dashboard/broker', icon: ExternalLink },
  { type: 'module', title: 'AI Risk Guard', subtitle: 'Real-time position risk protection', path: '/dashboard/coach', icon: ShieldCheck },
  { type: 'module', title: 'Behavioral Coach', subtitle: 'Psychological guardrails & discipline', path: '/dashboard/coach', icon: Brain },
  { type: 'module', title: 'Performance Analytics', subtitle: 'Equity curve, win rate, Sharpe ratio & Edge Score', path: '/dashboard/performance', icon: TrendingUp },
  { type: 'module', title: 'Trader Academy & Education', subtitle: 'Interactive courses, risk lessons & masterclasses', path: '/dashboard/education', icon: Brain },
  { type: 'module', title: 'News & Insights', subtitle: 'High-impact market updates & headlines', path: '/dashboard/news', icon: Newspaper },
  { type: 'module', title: 'Reports & Analytics', subtitle: 'Performance logs, tax reports and equity curve', path: '/dashboard/reports', icon: TrendingUp },
  { type: 'module', title: 'Community Feed', subtitle: 'Connect with profitable traders & share charts', path: '/dashboard/community', icon: Sparkles },
  { type: 'module', title: 'Trader Discussions', subtitle: 'Live debates, setup ideas & market chat', path: '/dashboard/discussions', icon: Sparkles },
  { type: 'module', title: 'Settings & Risk Limits', subtitle: 'Configure alert filters, daily drawdown caps & API', path: '/dashboard/settings', icon: Sliders },
  { type: 'module', title: 'Plans & Billing', subtitle: 'Upgrade to Pro, manage subscription & invoices', path: '/dashboard/billing', icon: Sparkles },
  { type: 'module', title: 'Referral Rewards', subtitle: 'Invite peers and unlock pro features & credits', path: '/dashboard/referrals', icon: Sparkles },
  { type: 'module', title: 'Help & Support', subtitle: 'Knowledge base, submit tickets & video bug reports', path: '/dashboard/support', icon: ExternalLink },
  { type: 'module', title: 'Documentation', subtitle: 'Full platform documentation & API guides', path: '/dashboard/documentation', icon: ExternalLink },
  { type: 'module', title: 'Release Changelog', subtitle: 'Platform release notes, fixes & new tools', path: '/dashboard/changelog', icon: Sparkles },
  
  // Stocks
  { type: 'stock', symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
  { type: 'stock', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
  { type: 'stock', symbol: 'TCS', name: 'Tata Consultancy Services' },
  { type: 'stock', symbol: 'INFY', name: 'Infosys Ltd.' },
  { type: 'stock', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
  { type: 'stock', symbol: 'SBIN', name: 'State Bank of India' },
  { type: 'stock', symbol: 'ITC', name: 'ITC Ltd.' },
  { type: 'stock', symbol: 'TATASTEEL', name: 'Tata Steel Ltd.' },
  { type: 'stock', symbol: 'NIFTY 50', name: 'Nifty 50 Index' },
  { type: 'stock', symbol: 'BANK NIFTY', name: 'Bank Nifty Index' },
  { type: 'stock', symbol: 'INDIA VIX', name: 'India Volatility Index' }
];

export default function UniversalSearchModal({ isOpen, onClose, isDark = true }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent('open_universal_search'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim() === '' 
    ? SEARCHABLE_ITEMS.slice(0, 8)
    : SEARCHABLE_ITEMS.filter(item => {
        const q = query.toLowerCase();
        if (item.type === 'module') {
          return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
        }
        return item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
      });

  const handleSelect = (item) => {
    if (item.type === 'module') {
      navigate(item.path);
    } else {
      // Stock selected -> navigate to analysis or trigger prompt
      navigate(`/dashboard/analysis?symbol=${encodeURIComponent(item.symbol)}`);
    }
    onClose();
  };

  const handleAskAI = () => {
    if (query.trim()) {
      window.dispatchEvent(new CustomEvent('open_copilot_ask', { detail: query.trim() }));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark 
            ? 'bg-[#0b0f17] border-slate-800 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center px-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <Search size={20} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                  handleSelect(filtered[selectedIndex]);
                } else if (query.trim()) {
                  handleAskAI();
                }
              }
            }}
            placeholder="Search stocks, indices, sectors, news or ask AI..."
            className={`w-full py-4 px-3 bg-transparent text-base focus:outline-none placeholder:text-sm ${
              isDark ? 'placeholder:text-slate-500 text-white' : 'placeholder:text-slate-400 text-slate-900'
            }`}
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className={`hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${
              isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {query.trim() && (
            <button
              onClick={handleAskAI}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                isDark 
                  ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20' 
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    Ask Alpha Copilot: <span className="font-normal italic">"{query}"</span>
                  </div>
                  <div className="text-xs opacity-75">
                    Get real-time market analysis, indicators & guidance
                  </div>
                </div>
              </div>
              <Sparkles size={16} className="text-blue-500 shrink-0" />
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No exact matches found for "{query}".
              </p>
              <button
                onClick={handleAskAI}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all inline-flex items-center gap-2"
              >
                <Bot size={14} />
                Ask Alpha Copilot
              </button>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              if (item.type === 'module') {
                const Icon = item.icon;
                return (
                  <button
                    key={`mod-${index}`}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isSelected 
                        ? (isDark ? 'bg-slate-800/80 text-white' : 'bg-slate-100 text-slate-900') 
                        : (isDark ? 'hover:bg-slate-800/40 text-slate-300' : 'hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                  </button>
                );
              }

              // Stock item
              return (
                <button
                  key={`stk-${index}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected 
                      ? (isDark ? 'bg-slate-800/80 text-white' : 'bg-slate-100 text-slate-900') 
                      : (isDark ? 'hover:bg-slate-800/40 text-slate-300' : 'hover:bg-slate-50 text-slate-700')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isDark ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40' : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {item.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        {item.symbol}
                        <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.name}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className={`p-2.5 px-4 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}>
          <div className="flex items-center gap-3">
            <span>Use <kbd className="font-semibold">↑</kbd> <kbd className="font-semibold">↓</kbd> to navigate</span>
            <span><kbd className="font-semibold">↵</kbd> to select</span>
            <span><kbd className="font-semibold">ESC</kbd> to close</span>
          </div>
          <div className="font-semibold text-blue-500">RetailX Universal Search</div>
        </div>
      </div>
    </div>
  );
}
