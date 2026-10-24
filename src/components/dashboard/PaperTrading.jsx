import NativeChart from "./NativeChart";
import OpenChartTerminal from "./OpenChartTerminal";
import PaperTradingChat from "./PaperTradingChat";
import ChartAiOverviewInsights from "./ChartAiOverviewInsights";
import { Camera, Share2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  RefreshCw, 
  Play, 
  Trash2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert, 
  AlertCircle, 
  Activity, 
  X,
  Plus,
  Minus,
  Sliders,
  Target,
  AlertOctagon,
  CandlestickChart,
  BarChart2,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function PaperTrading({ theme }) {
  const isDark = theme === 'dark';

  // State Management
  const [wallet, setWallet] = useState({ balance: 500000, startingBalance: 500000, resetCount: 0 });
  const [tradingPlan, setTradingPlan] = useState(null);
  const [checkedCriteria, setCheckedCriteria] = useState({});
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmationData, setConfirmationData] = useState(null);

  // Live Quotes state
  const [indexSpot, setIndexSpot] = useState({
    NIFTY50: 24056.00,
    BANKNIFTY: 52177.05,
    niftyChange: null,
    bankniftyChange: null
  });

  // Form States
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY50');
  const [activeChartTab, setActiveChartTab] = useState('openchart'); // 'openchart' | 'native' | 'chat'
  const [instrumentType, setInstrumentType] = useState('call'); // 'future' | 'call' | 'put'
  const [strikePrice, setStrikePrice] = useState(24000);
  const [expiryDate, setExpiryDate] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [side, setSide] = useState('long'); // 'long' | 'short'

  // Stop Loss / Target / Trailing Stop form states
  const [enableSlTarget, setEnableSlTarget] = useState(false);
  const [stopLossInput, setStopLossInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [trailingInput, setTrailingInput] = useState('');

  // Position Risk Modification state
  const [editingPosId, setEditingPosId] = useState(null);
  const [modSl, setModSl] = useState('');
  const [modTarget, setModTarget] = useState('');
  const [modTrailing, setModTrailing] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);
  

  useEffect(() => {
    const symbolParam = selectedSymbol === 'NIFTY50' ? 'NIFTY' : 'BANKNIFTY';
    fetch(`/api/market/expiries?underlying=${symbolParam}`)
      .then(res => res.json())
      .then(data => {
        setAvailableExpiries(data.expiries);
        if (data.expiries && data.expiries.length > 0) {
          setExpiryDate(data.expiries[0]);
        }
      })
      .catch(err => console.error("Failed to fetch expiries:", err));
  }, [selectedSymbol]);
  const [orderType, setOrderType] = useState('market'); // 'market' | 'limit'
  const [quantity, setQuantity] = useState(1); // quantity in lots
  const [limitPrice, setLimitPrice] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Derive lot size
  const lotSize = selectedSymbol === 'NIFTY50' ? 50 : 15;

  const checkIsMarketOpen = () => {
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const ist = new Date(istString);
    const day = ist.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;
    const minutes = ist.getHours() * 60 + ist.getMinutes();
    return minutes >= (9 * 60 + 15) && minutes <= (15 * 60 + 30);
  };

  const isMarketClosed = !checkIsMarketOpen();
  const isDataUnavailable = !indexSpot.NIFTY50 || !indexSpot.BANKNIFTY;
  const isChecklistIncomplete = tradingPlan?.setupCriteria?.length > 0 && Object.values(checkedCriteria).filter(Boolean).length !== tradingPlan.setupCriteria.length;
  const isOrderDisabled = isDataUnavailable || orderSubmitting || isChecklistIncomplete;

  // Helper to fetch live quotes
  const fetchMarketQuotes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch index quotes for spot pricing
      const res = await fetch('/api/market/quotes?symbols=^NSEI,^NSEBANK', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const nifty = data.find(q => q.symbol === '^NSEI');
        const bank = data.find(q => q.symbol === '^NSEBANK');

        setIndexSpot({
          NIFTY50: nifty?.regularMarketPrice ?? 24056.00,
          BANKNIFTY: bank?.regularMarketPrice ?? 52177.05,
          niftyChange: nifty?.regularMarketChangePercent ?? (nifty?.changePercent ?? 0),
          bankniftyChange: bank?.regularMarketChangePercent ?? (bank?.changePercent ?? 0)
        });
      }
    } catch (err) {
      console.warn("Market quotes fetch failed - relying on default tick values:", err);
    }
  }, []);

  // Fetch Paper Trading Data: Wallet, Open Positions, Orders, Closed Position History
  const fetchPaperData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallelize core paper trading fetches
      const [walletRes, posRes, ordersRes, historyRes, planRes] = await Promise.all([
        fetch('/api/paper/wallet', { headers }),
        fetch('/api/paper/positions', { headers }),
        fetch('/api/paper/orders', { headers }),
        fetch('/api/paper/history', { headers }),
        fetch('/api/settings/trading-plan', { headers })
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(posData);
      }
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
      if (planRes && planRes.ok) {
        const planData = await planRes.json();
        setTradingPlan(planData);
      }
    } catch (err) {
      console.error("Failed to fetch paper trading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set default centered strike prices when selected symbol or spot prices change
  useEffect(() => {
    const currentSpot = indexSpot[selectedSymbol];
    const step = selectedSymbol === 'NIFTY50' ? 50 : 100;
    const rounded = Math.round(currentSpot / step) * step;
    setStrikePrice(rounded);
  }, [selectedSymbol, indexSpot]);

  // Initial and polling timers
  useEffect(() => {
    fetchMarketQuotes();
    fetchPaperData();

    // Fast-polling: Fetch quotes and position P&Ls every 1 second for active day-traders
    const interval = setInterval(() => {
      fetchMarketQuotes();
      fetchPaperData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchMarketQuotes, fetchPaperData]);

  // Handle Order Submit
  const handlePlaceOrder = async (e, isBypass = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setOrderSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/paper/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          instrumentType,
          strikePrice: instrumentType === 'future' ? null : strikePrice,
          expiryDate: instrumentType === 'future' ? null : expiryDate,
          side,
          orderType,
          quantity,
          limitPrice: orderType === 'limit' ? Number(limitPrice) : null,
          stopLoss: enableSlTarget && stopLossInput !== '' ? Number(stopLossInput) : null,
          targetPrice: enableSlTarget && targetInput !== '' ? Number(targetInput) : null,
          trailingStopPoints: enableSlTarget && trailingInput !== '' ? Number(trailingInput) : null,
          confirmed: isBypass
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      if (data.requiresConfirmation) {
        setConfirmationData({
          triggerType: data.triggerType,
          message: data.message
        });
        setOrderSubmitting(false);
        return;
      }

      setSuccessMessage(data.message);
      setLimitPrice('');
      setCheckedCriteria({});
      setStopLossInput('');
      setTargetInput('');
      setTrailingInput('');
      setConfirmationData(null);
      fetchPaperData();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Modify position risk parameters (SL / Target / Trailing Stop)
  const handleModifyPosition = async (posId) => {
    setErrorMessage('');
    setSuccessMessage('');
    setModSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/paper/positions/${posId}/modify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stopLoss: modSl !== '' ? Number(modSl) : null,
          targetPrice: modTarget !== '' ? Number(modTarget) : null,
          trailingStopPoints: modTrailing !== '' ? Number(modTrailing) : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to modify position parameters');
      }
      setSuccessMessage(data.message);
      setEditingPosId(null);
      fetchPaperData();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setModSubmitting(false);
    }
  };

  // Close active position
  const handleClosePosition = async (posId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/paper/positions/${posId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to close position');
      }
      setSuccessMessage(data.message);
      fetchPaperData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Square off all active positions in one click
  const [isSquaringOff, setIsSquaringOff] = useState(false);
  const handleSquareOffAll = async () => {
    if (positions.length === 0) return;
    if (!window.confirm(`Are you sure you want to emergency square off all ${positions.length} open position(s)?`)) {
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsSquaringOff(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/paper/positions/close-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to square off all positions');
      }
      setSuccessMessage(data.message);
      fetchPaperData();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSquaringOff(false);
    }
  };

  // Cancel pending order
  const handleCancelOrder = async (orderId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/paper/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }
      setSuccessMessage(data.message);
      fetchPaperData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Reset Wallet Account
  const handleResetWallet = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/paper/wallet/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset virtual workspace');
      }
      setSuccessMessage(data.message);
      setConfirmReset(false);
      fetchPaperData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Dynamic strike list centered around spot price (+/- 4 strikes)
  const getDynamicStrikes = () => {
    const spot = indexSpot[selectedSymbol];
    const step = selectedSymbol === 'NIFTY50' ? 50 : 100;
    const center = Math.round(spot / step) * step;
    const strikes = [];
    for (let i = -4; i <= 4; i++) {
      strikes.push(center + i * step);
    }
    return strikes;
  };

  // Safe behavioral risk guardrail
  const capitalRiskPercentage = (() => {
    const lotSizeVal = selectedSymbol === 'NIFTY50' ? 50 : 15;
    const estimatePrice = instrumentType === 'future' ? indexSpot[selectedSymbol] * 0.05 : (selectedSymbol === 'NIFTY50' ? 120 : 380);
    const cost = estimatePrice * lotSizeVal * quantity;
    return ((cost / wallet.balance) * 100).toFixed(1);
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="animate-spin text-emerald-500 h-10 w-10" />
        <p className={isDark ? 'text-gray-400 font-medium' : 'text-gray-600 font-medium'}>
          Booting virtual paper trading exchange...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Simulation Banner Warning Label */}
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
        isDark ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}>
        <Activity size={20} className="text-emerald-500 flex-shrink-0" />
        <div className="text-xs md:text-sm font-medium leading-relaxed">
          <span className="font-extrabold mr-1">SIMULATION ENGINE LIVE:</span>
          All fills, execution, margins, and portfolio positions are simulated utilizing real-time quotes of the NSE Indices. No real cash is traded, in complete alignment with SEBI retail guidelines.
        </div>
      </div>

      {/* Behavioral Intervention Simulated Banner */}
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
        isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <ShieldAlert size={20} className="text-amber-500 flex-shrink-0 animate-pulse" />
        <div className="text-xs md:text-sm font-medium leading-relaxed">
          Behavioral intervention shown here is simulated on paper trades. Live broker-account intervention will roll out once RetailX completes SEBI regulatory clearance.
        </div>
      </div>

      {/* Behavioral Guardrail Triggered Modal */}
      {confirmationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${
            isDark 
              ? 'bg-[#121212]/95 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] text-white' 
              : 'bg-white border-red-200 shadow-2xl text-gray-900'
          }`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500 flex-shrink-0 animate-pulse">
                <ShieldAlert size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black tracking-tight text-red-500">
                  Guardian Behavioral Guardrail Triggered
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-red-500/10 text-red-400 mt-1.5 inline-block">
                  {confirmationData.triggerType.replace('_', ' ')}
                </span>
              </div>
              <button 
                onClick={() => setConfirmationData(null)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs md:text-sm leading-relaxed text-gray-400 mb-6 bg-red-500/5 p-4 rounded-xl border border-red-500/15">
              {confirmationData.message}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                disabled={orderSubmitting}
                onClick={(e) => handlePlaceOrder(e, true)}
                className="w-full py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderSubmitting ? 'Overriding...' : 'I understand the risk — Override Guardrail'}
              </button>
              <button
                onClick={() => setConfirmationData(null)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${
                  isDark 
                    ? 'border-white/10 text-gray-300 hover:bg-white/5' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel Simulated Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Segment: Wallet Balance and Interactive Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Balance Card */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#121212] border-white/5 shadow-xl' : 'bg-white border-black/5 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-extrabold tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Available Virtual Capital
            </span>
            <Wallet className="text-emerald-500 h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-500 truncate">
            ₹{Number(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
            <span>Starting Capital:</span>
            <span className="font-mono font-bold text-gray-500">₹{Number(wallet.startingBalance).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Live Market Price NIFTY */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold tracking-wider uppercase text-gray-400">NIFTY 50 SPOT</span>
            {indexSpot.niftyChange !== null ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                indexSpot.niftyChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {indexSpot.niftyChange >= 0 ? '+' : ''}{indexSpot.niftyChange.toFixed(2)}%
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {isMarketClosed ? 'CLOSED' : 'OUTAGE'}
              </span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {indexSpot.NIFTY50 !== null 
              ? `₹${indexSpot.NIFTY50.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
              : isMarketClosed 
                ? '₹24,056.00' 
                : '₹—'}
          </div>
          <div className="mt-2 text-xs text-amber-500 font-medium">
            {indexSpot.NIFTY50 !== null 
              ? 'Lot Size: 50 units • Contract Cycle Dec 2026' 
              : isMarketClosed 
                ? 'Market Closed — showing last available data' 
                : 'Live data unavailable'}
          </div>
        </div>

        {/* Live Market Price BANKNIFTY */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold tracking-wider uppercase text-gray-400">BANKNIFTY SPOT</span>
            {indexSpot.bankniftyChange !== null ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                indexSpot.bankniftyChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {indexSpot.bankniftyChange >= 0 ? '+' : ''}{indexSpot.bankniftyChange.toFixed(2)}%
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {isMarketClosed ? 'CLOSED' : 'OUTAGE'}
              </span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {indexSpot.BANKNIFTY !== null 
              ? `₹${indexSpot.BANKNIFTY.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
              : isMarketClosed 
                ? '₹52,177.05' 
                : '₹—'}
          </div>
          <div className="mt-2 text-xs text-amber-500 font-medium">
            {indexSpot.BANKNIFTY !== null 
              ? 'Lot Size: 15 units • Contract Cycle Dec 2026' 
              : isMarketClosed 
                ? 'Market Closed — showing last available data' 
                : 'Live data unavailable'}
          </div>
        </div>

      </div>

      
      {/* Interactive Chart & Trade Copilot Section */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-[#121212] border-white/5 shadow-xl' : 'bg-white border-black/5 shadow-md'
      }`}>
        {/* Tab Switcher: OpenChart Engine | Classic Chart | AI Trade Copilot */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <button
              onClick={() => setActiveChartTab('openchart')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeChartTab === 'openchart'
                  ? 'bg-white dark:bg-[#202020] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CandlestickChart size={14} className="text-emerald-500" />
              OpenChart Candlesticks
            </button>

            <button
              onClick={() => setActiveChartTab('native')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeChartTab === 'native'
                  ? 'bg-white dark:bg-[#202020] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 size={14} className="text-blue-500" />
              Classic Spot Chart
            </button>

            <button
              onClick={() => setActiveChartTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeChartTab === 'chat'
                  ? 'bg-white dark:bg-[#202020] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={14} className="text-amber-500" />
              AI Trade Copilot Chat
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Trading:</span>
            <span className="font-bold text-emerald-500">{selectedSymbol}</span>
            <span>• Spot:</span>
            <span className="font-bold font-mono">₹{Number(indexSpot[selectedSymbol] || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Tab 1: OpenChart Candlestick Engine */}
        {activeChartTab === 'openchart' && (
          <div className="w-full">
            <OpenChartTerminal 
              theme={theme}
              initialSymbol={selectedSymbol === 'NIFTY50' ? 'NIFTY 50' : 'NIFTY BANK'}
              initialSegment="IDX"
              embedded={true}
              onSelectSymbol={(sym) => {
                if (sym.toUpperCase().includes('BANK')) setSelectedSymbol('BANKNIFTY');
                else if (sym.toUpperCase().includes('NIFTY')) setSelectedSymbol('NIFTY50');
              }}
            />
          </div>
        )}

        {/* Tab 2: Classic Spot Chart */}
        {activeChartTab === 'native' && (
          <div className="h-[550px] w-full">
            <NativeChart 
              symbol={selectedSymbol}
              currentPrice={indexSpot[selectedSymbol]}
              isDark={isDark}
            />
          </div>
        )}

        {/* Tab 3: AI Trade Copilot Chat */}
        {activeChartTab === 'chat' && (
          <div className="w-full">
            <PaperTradingChat 
              theme={theme}
              selectedSymbol={selectedSymbol}
              currentPrice={indexSpot[selectedSymbol] || 24000}
              walletBalance={wallet.balance}
              positions={positions}
            />
          </div>
        )}

        {/* 🤖 AI Overview Downside the Charts & 🧠 Insights | 📰 News & Analysis */}
        <ChartAiOverviewInsights symbol={selectedSymbol} theme={theme} />
      </div>

      {/* Main Layout: Left terminal, Right Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Order Terminal */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121212] border-white/5 shadow-xl' : 'bg-white border-black/5 shadow-lg'
          }`}>
            <h2 className={`text-lg font-black tracking-tight mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className="text-emerald-500 h-5 w-5" />
              Simulated Execution Terminal
            </h2>

            {/* Error and Success Notices */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 mb-4 rounded-xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                <Play size={16} className="text-emerald-500 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {isMarketClosed && (
              <div className="p-3 mb-4 rounded-xl text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500 flex-shrink-0" />
                <span>Off-Market Practice Session Active: Orders simulate execution against latest index prices.</span>
              </div>
            )}
            {isDataUnavailable && (
              <div className="p-3 mb-4 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span>Market data feed connecting... Order ticket will activate shortly.</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-4">

              {/* Trading Plan Checklist */}
              {tradingPlan && tradingPlan.setupCriteria && tradingPlan.setupCriteria.length > 0 && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-emerald-500" />
                    <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Pre-Trade Clearance</h4>
                  </div>
                  <div className="space-y-2">
                    {tradingPlan.setupCriteria.map((criteria, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!!checkedCriteria[idx]}
                          onChange={(e) => setCheckedCriteria({...checkedCriteria, [idx]: e.target.checked})}
                          className="w-4 h-4 accent-emerald-500 rounded bg-black/10 border-white/10"
                        />
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} ${checkedCriteria[idx] ? 'line-through opacity-50' : 'font-medium'}`}>
                          {criteria}
                        </span>
                      </label>
                    ))}
                  </div>
                  {Object.values(checkedCriteria).filter(Boolean).length !== tradingPlan.setupCriteria.length && (
                    <div className="mt-3 text-[10px] text-amber-500 flex items-center gap-1 font-bold">
                      <AlertCircle size={12} /> Complete checklist to enforce trading discipline
                    </div>
                  )}
                </div>
              )}

              
              {/* Enter Long / Enter Short Tabs Strip */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-500/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSide('long')}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all ${
                    side === 'long'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Enter Long (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => setSide('short')}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all ${
                    side === 'short'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Enter Short (Sell)
                </button>
              </div>

              {/* Index Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                  Underlying Index
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSymbol('NIFTY50')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedSymbol === 'NIFTY50'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : (isDark ? 'border-white/5 bg-[#181818] text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600')
                    }`}
                  >
                    NIFTY 50
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSymbol('BANKNIFTY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedSymbol === 'BANKNIFTY'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : (isDark ? 'border-white/5 bg-[#181818] text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600')
                    }`}
                  >
                    BANKNIFTY
                  </button>
                </div>
              </div>

              {/* Instrument Type */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                  Instrument Type
                </label>
                <select
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border ${
                    isDark ? 'bg-[#181818] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="call">Call Option (CE)</option>
                  <option value="put">Put Option (PE)</option>
                  <option value="future">Index Future (FUT)</option>
                </select>
              </div>

              {/* Strike Price & Expiry Date (Options Only) */}
              {instrumentType !== 'future' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                      Strike Price
                    </label>
                    <select
                      value={strikePrice}
                      onChange={(e) => setStrikePrice(Number(e.target.value))}
                      className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border ${
                        isDark ? 'bg-[#181818] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      {getDynamicStrikes().map((strike) => (
                        <option key={strike} value={strike}>
                          ₹{strike}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                      Expiry Cycle
                    </label>
                    <select
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${
                        isDark ? 'bg-[#181818] border-white/5 text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      {availableExpiries.map((expiry) => (
                        <option key={expiry} value={expiry}>{expiry}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Order Type & Limit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                    Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold border ${
                      isDark ? 'bg-[#181818] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <option value="market">Market Price</option>
                    <option value="limit">Limit Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                    {orderType === 'limit' ? 'Limit Price (₹)' : 'Est. Price (₹)'}
                  </label>
                  {orderType === 'limit' ? (
                    <input
                      type="number"
                      step="0.05"
                      required
                      placeholder="e.g. 115.50"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border ${
                        isDark ? 'bg-[#181818] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={indexSpot[selectedSymbol] !== null
                        ? `₹${(instrumentType === 'future' ? indexSpot[selectedSymbol] * 1.0005 : (selectedSymbol === 'NIFTY50' ? 120 : 380)).toFixed(2)}`
                        : '—'
                      }
                      className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border text-center ${
                        isDark ? 'bg-[#181818] border-white/5 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Lots Counter */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-gray-400 mb-1">
                  Lot Size Selector
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className={`p-2 rounded-xl border ${
                      isDark ? 'border-white/5 bg-[#181818] hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Minus size={14} className={isDark ? 'text-white' : 'text-gray-700'} />
                  </button>
                  <div className={`flex-1 text-center font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {quantity} Lot{quantity > 1 ? 's' : ''} ({quantity * lotSize} Units)
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className={`p-2 rounded-xl border ${
                      isDark ? 'border-white/5 bg-[#181818] hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Plus size={14} className={isDark ? 'text-white' : 'text-gray-700'} />
                  </button>
                </div>
              </div>

              {/* Stop Loss / Target / Trailing Stop Controls */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#181818] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-gray-400 flex items-center gap-1.5 cursor-pointer">
                    <ShieldAlert size={14} className="text-emerald-500" />
                    <span>Add Stop Loss / Target</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={enableSlTarget}
                    onChange={(e) => setEnableSlTarget(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {enableSlTarget && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-gray-500/10">
                    {/* Quick R:R presets */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase">Quick Risk:Reward Preset</span>
                      <div className="flex gap-2">
                        {[
                          { label: '1:1.5', slPct: 0.005, tpMultiplier: 1.5 },
                          { label: '1:2', slPct: 0.005, tpMultiplier: 2.0 },
                          { label: '1:3', slPct: 0.005, tpMultiplier: 3.0 },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              const base = (orderType === 'limit' && limitPrice) 
                                ? Number(limitPrice) 
                                : (instrumentType === 'future' 
                                    ? (indexSpot[selectedSymbol] || 24000) 
                                    : (selectedSymbol === 'NIFTY50' ? 120 : 380));
                              const slDist = base * preset.slPct;
                              if (side === 'long') {
                                setStopLossInput((base - slDist).toFixed(2));
                                setTargetInput((base + slDist * preset.tpMultiplier).toFixed(2));
                              } else {
                                setStopLossInput((base + slDist).toFixed(2));
                                setTargetInput((base - slDist * preset.tpMultiplier).toFixed(2));
                              }
                            }}
                            className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border transition-all ${
                              isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            R:R {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          Stop Loss (₹)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          placeholder={side === 'long' ? 'Below entry' : 'Above entry'}
                          value={stopLossInput === undefined || isNaN(stopLossInput) ? '' : stopLossInput}
                          onChange={(e) => setStopLossInput(e.target.value)}
                          className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border ${
                            isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          Target Price (₹)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          placeholder={side === 'long' ? 'Above entry' : 'Below entry'}
                          value={targetInput === undefined || isNaN(targetInput) ? '' : targetInput}
                          onChange={(e) => setTargetInput(e.target.value)}
                          className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border ${
                            isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        Trailing Stop (Points)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 10 (optional points)"
                        value={trailingInput === undefined || isNaN(trailingInput) ? '' : trailingInput}
                        onChange={(e) => setTrailingInput(e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border ${
                          isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Behavior Risk Guardrail Notice */}
              <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                Number(capitalRiskPercentage) > 15
                  ? 'bg-red-500/5 border-red-500/20 text-red-300'
                  : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
              }`}>
                <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold uppercase tracking-wide mr-1">Risk Exposure:</span>
                  This order commits <strong className="font-mono">{capitalRiskPercentage}%</strong> of your virtual account balance.
                  {Number(capitalRiskPercentage) > 15 && " Safe behavioral standards advise locking less than 15% to maintain emotional stability."}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isOrderDisabled}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg ${
                  isOrderDisabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
                    : side === 'long'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10'
                }`}
              >
                {orderSubmitting 
                  ? 'Fulfilling...' 
                  : isDataUnavailable
                    ? 'Loading Market Data...'
                    : isChecklistIncomplete
                      ? 'Complete Checklist to Enable'
                      : orderType === 'limit' 
                        ? `Queue Limit Order (${side.toUpperCase()})` 
                        : isMarketClosed
                          ? `Execute Practice ${side === 'long' ? 'Long' : 'Short'} Fill`
                          : `Execute simulated ${side === 'long' ? 'long' : 'short'} fill`
                }
              </button>

            </form>
          </div>

          {/* Quick Account Reset and Safety Action Box */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
          }`}>
            <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <RefreshCw className="text-gray-400 h-4 w-4" />
              Reset Account Simulation
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Reset virtual wallet to baseline ₹5,00,000. All active positions will be closed at index spot prices, and pending order queues will be cancelled.
            </p>
            {confirmReset ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-400">Are you sure? This will wipe your simulated portfolio.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetWallet}
                    className="flex-1 py-2 px-3 rounded-lg text-[10px] font-black tracking-widest uppercase bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Reset Now
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                      isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                  isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/5' : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                Reset Virtual Account (Count: {wallet.resetCount})
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Active Portfolios & Queues */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Positions */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className={`text-md font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Play className="text-emerald-500 h-4 w-4" />
                Active Simulated Positions ({positions.length})
              </h2>
              {positions.length > 0 && (
                <button
                  onClick={handleSquareOffAll}
                  disabled={isSquaringOff}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                  title="Square off all open positions immediately"
                >
                  <AlertOctagon size={13} className={isSquaringOff ? 'animate-spin' : ''} />
                  <span>{isSquaringOff ? 'Closing All...' : 'Square Off All'}</span>
                </button>
              )}
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto text-gray-600 mb-2 h-8 w-8" />
                <p className="text-xs text-gray-400">No open simulated positions detected. Utilize the terminal to enter contracts.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/5 text-gray-400' : 'border-gray-200 text-gray-500'} pb-2`}>
                      <th className="pb-3">Instrument</th>
                      <th className="pb-3">Lots</th>
                      <th className="pb-3 text-right">Avg Entry</th>
                      <th className="pb-3 text-right">Current</th>
                      <th className="pb-3 text-right">SL / Target</th>
                      <th className="pb-3 text-right">Unrealized P&L</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => {
                      const isProfit = pos.unrealizedPnl >= 0;
                      const isLong = pos.side === 'long';
                      const isEditing = editingPosId === pos.id;

                      return (
                        <React.Fragment key={pos.id}>
                          <tr className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:bg-gray-500/5`}>
                            <td className="py-3 font-semibold">
                              <div className="flex flex-col">
                                <span>
                                  {pos.symbol} {pos.instrumentType === 'future' ? 'FUT' : `${pos.strikePrice} ${pos.instrumentType.toUpperCase()}`}
                                </span>
                                <span className={`text-[10px] font-bold ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {isLong ? 'LONG (Enter)' : 'SHORT (Write)'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 font-mono">
                              {pos.quantity} L ({pos.quantity * (pos.symbol === 'NIFTY50' ? 50 : 15)})
                            </td>
                            <td className="py-3 text-right font-mono">
                              ₹{Number(pos.entryPrice).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-mono">
                              ₹{Number(pos.currentPrice || pos.entryPrice).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-mono text-[11px]">
                              <div className="flex flex-col items-end">
                                <span className="text-red-400">
                                  SL: {pos.stopLoss ? `₹${Number(pos.stopLoss).toFixed(2)}` : '—'}
                                </span>
                                <span className="text-emerald-400">
                                  Tgt: {pos.targetPrice ? `₹${Number(pos.targetPrice).toFixed(2)}` : '—'}
                                </span>
                                {pos.trailingStopPoints && (
                                  <span className="text-[9px] text-gray-400 font-sans">
                                    (Trail: {pos.trailingStopPoints}pts)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`py-3 text-right font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                              <span className="flex items-center justify-end gap-1">
                                {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                ₹{pos.unrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditingPosId(null);
                                    } else {
                                      setEditingPosId(pos.id);
                                      setModSl(pos.stopLoss || '');
                                      setModTarget(pos.targetPrice || '');
                                      setModTrailing(pos.trailingStopPoints || '');
                                    }
                                  }}
                                  className={`py-1 px-2 rounded text-[10px] font-bold border transition-all ${
                                    isEditing
                                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                      : (isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50')
                                  }`}
                                >
                                  Modify
                                </button>
                                <button
                                  onClick={() => handleClosePosition(pos.id)}
                                  className="py-1 px-2.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-[10px] font-bold transition-all"
                                >
                                  Exit
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline Risk Editor Row */}
                          {isEditing && (
                            <tr className={isDark ? 'bg-white/5' : 'bg-gray-100'}>
                              <td colSpan={7} className="p-3">
                                <div className="flex flex-wrap items-end gap-3">
                                  <div className="flex-1 min-w-[100px]">
                                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Stop Loss (₹)</label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      placeholder="SL Price"
                                      value={modSl === undefined || isNaN(modSl) ? '' : modSl}
                                      onChange={(e) => setModSl(e.target.value)}
                                      className={`w-full p-2 rounded-lg text-xs font-mono font-bold border ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[100px]">
                                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Target Price (₹)</label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      placeholder="Target Price"
                                      value={modTarget === undefined || isNaN(modTarget) ? '' : modTarget}
                                      onChange={(e) => setModTarget(e.target.value)}
                                      className={`w-full p-2 rounded-lg text-xs font-mono font-bold border ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[100px]">
                                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Trailing (Points)</label>
                                    <input
                                      type="number"
                                      step="0.5"
                                      placeholder="Trail Points"
                                      value={modTrailing === undefined || isNaN(modTrailing) ? '' : modTrailing}
                                      onChange={(e) => setModTrailing(e.target.value)}
                                      className={`w-full p-2 rounded-lg text-xs font-mono font-bold border ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={modSubmitting}
                                      onClick={() => handleModifyPosition(pos.id)}
                                      className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase transition-all"
                                    >
                                      {modSubmitting ? 'Saving...' : 'Save Risk'}
                                    </button>
                                    <button
                                      onClick={() => setEditingPosId(null)}
                                      className={`py-2 px-3 rounded-lg text-xs font-bold border ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700'}`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Orders Queue */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
          }`}>
            <h2 className={`text-md font-extrabold tracking-tight mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Clock className="text-yellow-500 h-4 w-4" />
              Pending Limit Orders Queue ({orders.filter(o => o.status === 'pending').length})
            </h2>

            {orders.filter(o => o.status === 'pending').length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">No pending simulated limit orders in queue.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/5' : 'border-gray-200'} pb-2`}>
                      <th className="pb-3 text-gray-400">Instrument</th>
                      <th className="pb-3 text-gray-400">Lots</th>
                      <th className="pb-3 text-gray-400 text-right">Trigger Limit</th>
                      <th className="pb-3 text-gray-400 text-right">Status</th>
                      <th className="pb-3 text-gray-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.status === 'pending').map((ord) => (
                      <tr key={ord.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <td className="py-3 font-semibold">
                          {ord.symbol} {ord.instrumentType === 'future' ? 'FUT' : `${ord.strikePrice} ${ord.instrumentType.toUpperCase()}`} ({ord.side.toUpperCase()})
                        </td>
                        <td className="py-3 font-mono">{ord.quantity} Lots</td>
                        <td className="py-3 text-right font-mono font-bold">₹{Number(ord.limitPrice).toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                            PENDING
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="text-red-400 hover:text-red-300 font-bold text-[10px] py-1 px-2 border border-red-500/20 hover:bg-red-500/5 rounded"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Order Logs */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
          }`}>
            <h2 className={`text-md font-extrabold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Recent Order Logs History
            </h2>

            {orders.filter(o => o.status !== 'pending').length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">No recently logged orders available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/5' : 'border-gray-200'} pb-2`}>
                      <th className="pb-2 text-gray-400">Instrument</th>
                      <th className="pb-2 text-gray-400">Type</th>
                      <th className="pb-2 text-gray-400 text-right">Filled Price</th>
                      <th className="pb-2 text-gray-400 text-right font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.status !== 'pending').slice(0, 8).map((ord) => {
                      const isFilled = ord.status === 'filled';
                      return (
                        <tr key={ord.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className="py-2.5 font-medium">
                            {ord.symbol} {ord.instrumentType === 'future' ? 'FUT' : `${ord.strikePrice} ${ord.instrumentType.toUpperCase()}`} ({ord.side.toUpperCase()})
                          </td>
                          <td className="py-2.5 text-xs text-gray-400">
                            {ord.orderType.toUpperCase()}
                          </td>
                          <td className="py-2.5 text-right font-mono">
                            {ord.filledPrice ? `₹${Number(ord.filledPrice).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 text-right font-bold">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              isFilled 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {ord.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Closed Positions History */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5 shadow-md'
          }`}>
            <h2 className={`text-md font-extrabold tracking-tight mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Clock className="text-emerald-500 h-4 w-4" />
              Closed Positions History ({history.length})
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">No closed positions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/5 text-gray-400' : 'border-gray-200 text-gray-500'} pb-2`}>
                      <th className="pb-3">Instrument</th>
                      <th className="pb-3 text-right">Entry Price</th>
                      <th className="pb-3 text-right">Exit Price</th>
                      <th className="pb-3 text-right">Realized P&L</th>
                      <th className="pb-3 text-right">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((pos) => {
                      const pnlNum = Number(pos.realizedPnl || 0);
                      const isProfit = pnlNum >= 0;
                      const isLong = pos.side === 'long';

                      let reasonLabel = 'Manual Exit';
                      let reasonClass = 'bg-blue-500/10 text-blue-400';

                      if (pos.exitReason === 'stop_loss') {
                        reasonLabel = 'Stop Loss Hit';
                        reasonClass = 'bg-red-500/10 text-red-400';
                      } else if (pos.exitReason === 'target') {
                        reasonLabel = 'Target Hit';
                        reasonClass = 'bg-emerald-500/10 text-emerald-400';
                      } else if (pos.exitReason === 'reset') {
                        reasonLabel = 'Account Reset';
                        reasonClass = 'bg-amber-500/10 text-amber-400';
                      }

                      return (
                        <tr key={pos.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className="py-2.5 font-semibold">
                            <div className="flex flex-col">
                              <span>
                                {pos.symbol} {pos.instrumentType === 'future' ? 'FUT' : `${pos.strikePrice} ${pos.instrumentType.toUpperCase()}`}
                              </span>
                              <span className={`text-[10px] font-bold ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isLong ? 'LONG' : 'SHORT'} ({pos.quantity} Lot{pos.quantity > 1 ? 's' : ''})
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-right font-mono text-gray-400">
                            ₹{Number(pos.entryPrice).toFixed(2)}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold">
                            ₹{Number(pos.exitPrice || 0).toFixed(2)}
                          </td>
                          <td className={`py-2.5 text-right font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            ₹{pnlNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${reasonClass}`}>
                              {reasonLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
