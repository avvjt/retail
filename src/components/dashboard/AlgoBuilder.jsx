import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Play, Shield, CheckCircle, ArrowRight, Sparkles, Plus, 
  History, Send, Copy, Download, Trash2, Edit3, Check, RefreshCw, 
  ChevronRight, ArrowUpRight, BarChart2, BookOpen, AlertCircle, Bookmark, Code,
  Terminal, Webhook, Layers, GitBranch, Zap, Radio, Power, Flame, Sliders,
  Settings, ArrowDownRight, ExternalLink, HelpCircle, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

// OpenAlgo Supported Broker Plugins Catalog
const BROKER_PLUGINS = [
  { id: 'angelone', name: 'Angel One', type: 'Securities', logo: '🔴', status: 'CONNECTED', authMethod: 'SmartAPI (TOTP + API Key)', latency: '18ms', desc: 'Direct WebSocket & REST Order Routing' },
  { id: 'zerodha', name: 'Zerodha Kite', type: 'Securities', logo: '🟠', status: 'READY', authMethod: 'Kite Connect API v3', latency: '22ms', desc: 'Official KiteConnect v3 Bridge' },
  { id: 'dhan', name: 'Dhan HQ', type: 'Securities', logo: '🟢', status: 'READY', authMethod: 'DhanHQ REST v2', latency: '14ms', desc: 'Ultra-low latency direct DMA access' },
  { id: 'dhansandbox', name: 'Dhan Sandbox', type: 'Paper Engine', logo: '🧪', status: 'ACTIVE', authMethod: 'Free Unlimited Sandbox', latency: '4ms', desc: 'Real-time paper trading environment' },
  { id: 'fyers', name: 'Fyers', type: 'Securities', logo: '🔵', status: 'READY', authMethod: 'Fyers API v3 OAuth', latency: '19ms', desc: 'Direct TradingView & Data API' },
  { id: 'upstox', name: 'Upstox', type: 'Securities', logo: '🟣', status: 'READY', authMethod: 'Upstox Pro API v2', latency: '25ms', desc: 'Interactive API v2 Order Gateway' },
  { id: 'kotakneo', name: 'Kotak Neo', type: 'Securities', logo: '🔴', status: 'READY', authMethod: 'Neo Trade API', latency: '28ms', desc: 'Zero brokerage intraday router' },
  { id: 'shoonya', name: 'Shoonya (Finvasia)', type: 'Zero Brokerage', logo: '⚪', status: 'READY', authMethod: 'Shoonya API', latency: '32ms', desc: 'Direct zero brokerage terminal' },
  { id: 'deltaexchange', name: 'Delta Exchange', type: 'Crypto Derivatives', logo: '🟡', status: 'READY', authMethod: 'Delta REST + WS API', latency: '42ms', desc: 'BTC & ETH Options / Futures API' }
];

export default function AlgoBuilder({ theme }) {
  const isDark = theme === 'dark';
  
  // Theme accents
  const cardBg = isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-200';
  const subCardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100';
  const headerBg = isDark ? 'bg-black/40' : 'bg-gray-50/80';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentText = isDark ? "text-[#c8f135]" : "text-emerald-700 font-semibold";
  const accentBadge = isDark ? "bg-[#c8f135]/20 text-[#c8f135] border border-[#c8f135]/30" : "bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold";
  const accentBtn = isDark ? "bg-[#c8f135] text-black hover:bg-[#b5db29] font-bold" : "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm";

  // Primary Workspace Navigation
  // 'ai_architect' | 'visual_flow' | 'code_studio' | 'webhook_gateway' | 'backtester' | 'order_terminal' | 'portfolio'
  const [activeTab, setActiveTab] = useState('ai_architect');

  // Broker & Execution Mode State
  const [selectedBroker, setSelectedBroker] = useState('angelone');
  const [executionMode, setExecutionMode] = useState('SANDBOX'); // 'SANDBOX' | 'LIVE'
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  // =========================================================================
  // 1. AI STRATEGY ARCHITECT (OpenAlgo Copilot / MCP)
  // =========================================================================
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `### Welcome to **OpenAlgo AI Strategy Architect** 🚀
I am your Quantitative Systems Engineer powered by the OpenAlgo Multi-Broker Framework.

**What I can build for you:**
* **Institutional Python Strategies** using official \`openalgo-python\` SDK
* **TradingView PineScript v5 Webhook Strategies** with automated OpenAlgo JSON alerts
* **Node.js & Amibroker AFL connectors** for automated order execution across 36+ brokers
* **Multi-leg Options Systems** (Straddles, Strangles, Iron Condors, Trailing SL, Split Iceberg Orders)

*Try asking below, or select a preset blueprint:*`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef(null);

  // Active loaded strategy in memory
  const [activeStrategy, setActiveStrategy] = useState({
    name: "OpenAlgo_NIFTY_EMA_Breakout_V2",
    language: "python",
    description: "OpenAlgo Multi-Broker EMA 9/21 Crossover strategy with ATR Trailing Stop-Loss & Split Order execution.",
    script: `"""
OpenAlgo Multi-Broker Strategy: NIFTY 9/21 EMA Breakout + ATR Trailing SL
Powered by OpenAlgo Unified REST & WebSocket Execution Engine
Supported Brokers: Angel One, Zerodha, Dhan, Fyers, Upstox, Alice Blue
"""
from openalgo import OpenAlgo
import numpy as np
import time

# 1. Initialize OpenAlgo Client (Zero-config multi-broker session)
client = OpenAlgo(
    api_key="oa_live_secret_key_xxxx",
    host="http://localhost:3000/api/strategies/openalgo",
    broker="angelone"  # Switch to 'zerodha', 'dhan', 'fyers', 'upstox'
)

CONFIG = {
    "symbol": "NIFTY",
    "exchange": "NFO",
    "strike_offset": "ATM",
    "timeframe": "5m",
    "fast_ema": 9,
    "slow_ema": 21,
    "atr_period": 14,
    "quantity": 50,
    "split_order": True,
    "split_size": 25,
    "max_loss_day": -5000,
    "square_off_time": "15:15:00"
}

def on_candle_close(candles):
    closes = [c['close'] for c in candles]
    fast_ema = client.indicators.ema(closes, period=CONFIG['fast_ema'])
    slow_ema = client.indicators.ema(closes, period=CONFIG['slow_ema'])
    
    # Check EMA Crossover Trigger
    if fast_ema[-1] > slow_ema[-1] and fast_ema[-2] <= slow_ema[-2]:
        print(f"[OpenAlgo] Bullish Crossover detected on {CONFIG['symbol']}! Routing Order...")
        
        # Place Split Market Order via OpenAlgo Unified Broker Layer
        order_response = client.place_order(
            strategy="NIFTY_EMA_Breakout",
            symbol=CONFIG['symbol'],
            action="BUY",
            exchange=CONFIG['exchange'],
            pricetype="MARKET",
            product="MIS",
            quantity=CONFIG['quantity'],
            splitorder="YES" if CONFIG['split_order'] else "NO",
            splitsize=CONFIG['split_size']
        )
        print(f"[OpenAlgo] Order Placed: {order_response}")

if __name__ == "__main__":
    print("🚀 OpenAlgo Engine Started. Streaming market ticks...")
    client.start_strategy(on_candle_close)`,
    config: {
      instrument: "NIFTY50",
      timeframe: "FIVE_MINUTE",
      stopLoss: 25,
      target: 50,
      indicator: "EMA",
      buyValue: 9,
      sellValue: 21
    }
  });

  // =========================================================================
  // 2. VISUAL FLOW BUILDER (No-Code Canvas State)
  // =========================================================================
  const [flowConfig, setFlowConfig] = useState({
    strategyName: 'OpenAlgo_Visual_Straddle_V1',
    instrument: 'NIFTY',
    exchange: 'NFO',
    triggerType: 'LTP_CROSS',
    indicator: 'SUPERTREND',
    supertrendPeriod: 10,
    supertrendMultiplier: 3,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    fastEma: 9,
    slowEma: 21,
    action: 'BUY',
    orderType: 'MARKET',
    product: 'MIS',
    quantity: 50,
    targetPoints: 40,
    stopLossPoints: 20,
    trailingSlPoints: 10,
    enableSplitOrder: true,
    splitSize: 25,
    squareOffTime: '15:15'
  });

  // =========================================================================
  // 3. CODE STUDIO (Multi-Language IDE)
  // =========================================================================
  const [codeLanguage, setCodeLanguage] = useState('python'); // 'python' | 'pinescript' | 'javascript' | 'afl'
  const [editorCode, setEditorCode] = useState(activeStrategy.script);

  // Update editor code when activeStrategy changes
  useEffect(() => {
    if (activeStrategy?.script) {
      setEditorCode(activeStrategy.script);
    }
  }, [activeStrategy]);

  // =========================================================================
  // 4. WEBHOOK & SIGNAL GATEWAY
  // =========================================================================
  const webhookUrl = `${window.location.origin}/api/strategies/openalgo/order/place`;
  const [webhookApiKey, setWebhookApiKey] = useState('oa_live_9b84e12c87f901a');
  const [webhookPayload, setWebhookPayload] = useState(JSON.stringify({
    apikey: "oa_live_9b84e12c87f901a",
    strategy: "TradingView_Pine_Breakout",
    symbol: "NIFTY26SEP24200CE",
    action: "BUY",
    exchange: "NFO",
    pricetype: "MARKET",
    product: "MIS",
    quantity: 50,
    splitorder: "YES",
    splitsize: 25,
    broker: "angelone"
  }, null, 2));
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // =========================================================================
  // 5. INSTITUTIONAL BACKTESTER
  // =========================================================================
  const [runningBacktest, setRunningBacktest] = useState(false);
  const [backtestResult, setBacktestResult] = useState(null);

  // =========================================================================
  // 6. LIVE ORDER TERMINAL & POSITIONS
  // =========================================================================
  const [liveOrders, setLiveOrders] = useState([]);
  const [livePositions, setLivePositions] = useState([]);
  const [loadingTerminal, setLoadingTerminal] = useState(false);

  // =========================================================================
  // 7. PORTFOLIO & SAVED STRATEGIES
  // =========================================================================
  const [savedAlgosList, setSavedAlgosList] = useState([]);
  const [loadingAlgos, setLoadingAlgos] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Helper notification dispatcher
  const showToast = (msg, type = 'success') => {
    setNotification({ text: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Fetch initial portfolio & orders
  useEffect(() => {
    fetchSavedAlgos();
    fetchOrdersAndPositions();
  }, []);

  const fetchSavedAlgos = async () => {
    setLoadingAlgos(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/strategies/algos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAlgosList(data);
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoadingAlgos(false);
    }
  };

  const fetchOrdersAndPositions = async () => {
    setLoadingTerminal(true);
    const token = localStorage.getItem('token');
    try {
      const [ordRes, posRes] = await Promise.all([
        fetch('/api/strategies/openalgo/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/strategies/openalgo/positions', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setLiveOrders(ordData.orders || []);
      }
      if (posRes.ok) {
        const posData = await posRes.json();
        setLivePositions(posData.positions || []);
      }
    } catch (err) {
      console.error("Failed to load orders/positions:", err);
    } finally {
      setLoadingTerminal(false);
    }
  };

  // Emergency Kill Switch
  const handleEmergencyKillSwitch = async () => {
    if (!window.confirm("🚨 EMERGENCY KILL SWITCH: This will instantly cancel all active OpenAlgo orders and square off all open positions across connected brokers. Continue?")) return;
    
    setKillSwitchActive(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/strategies/openalgo/order/cancelall', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      showToast(data.message || "All orders cancelled and positions closed!", "error");
      fetchOrdersAndPositions();
    } catch (err) {
      showToast("Failed to trigger emergency kill switch", "error");
    } finally {
      setTimeout(() => setKillSwitchActive(false), 2000);
    }
  };

  // Send AI chat message
  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInputValue('');
    setIsGenerating(true);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/strategies/generate-algo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newHistory })
      });

      if (!res.ok) throw new Error("Strategy generation failed");
      const data = await res.json();

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || "Strategy compiled successfully.",
        strategyData: data.type === 'strategy' ? data : null
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (data.type === 'strategy' && data.strategyCode) {
        const synthesized = {
          name: data.strategyName || "OpenAlgo_Custom_Strategy",
          language: data.strategyLanguage || "python",
          description: data.text?.slice(0, 120) || "Synthesized OpenAlgo Strategy",
          script: data.strategyCode,
          config: data.config || {
            instrument: "NIFTY50",
            timeframe: "FIFTEEN_MINUTE",
            stopLoss: 20,
            target: 40,
            indicator: "RSI",
            buyValue: 30,
            sellValue: 70
          }
        };
        setActiveStrategy(synthesized);
        showToast(`Synthesized "${synthesized.name}" successfully!`);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Sorry, I encountered an issue synthesizing the OpenAlgo strategy. Please try again."
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Backtest Walk
  const runBacktest = async (customConfig = null) => {
    const cfg = customConfig || activeStrategy?.config || flowConfig;
    setRunningBacktest(true);
    setBacktestResult(null);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/strategies/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          config: {
            instrument: cfg.instrument || "NIFTY50",
            timeframe: cfg.timeframe || "FIFTEEN_MINUTE",
            stopLoss: cfg.stopLoss || cfg.stopLossPoints || 20,
            target: cfg.target || cfg.targetPoints || 40,
            indicator: cfg.indicator || "RSI",
            buyValue: cfg.buyValue || cfg.rsiOversold || 30,
            sellValue: cfg.sellValue || cfg.rsiOverbought || 70
          }
        })
      });

      if (!res.ok) throw new Error("Backtest failed to execute");
      const result = await res.json();
      if (result.unavailable) {
        setBacktestResult({ unavailable: true });
        showToast("Data unavailable for backtest", "error");
        return;
      }
      setBacktestResult(result);
      showToast(`Backtest complete! Net Profit: ₹${result.summary?.netProfit?.toLocaleString('en-IN')}`);
    } catch (err) {
      console.error("Backtest error:", err);
      showToast(err.message || "Backtest failed", "error");
    } finally {
      setRunningBacktest(false);
    }
  };

  // Test Webhook Dispatch
  const handleTestWebhook = async () => {
    setIsSendingWebhook(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/strategies/openalgo/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payload: webhookPayload })
      });
      const data = await res.json();
      setWebhookLogs(prev => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString('en-IN'),
          status: data.status,
          orderId: data.orderid,
          response: data.message,
          latency: '12ms'
        },
        ...prev
      ]);
      showToast(`Webhook signal executed: Order ID ${data.orderid}`);
      fetchOrdersAndPositions();
    } catch (err) {
      showToast("Webhook test execution failed", "error");
    } finally {
      setIsSendingWebhook(false);
    }
  };

  // Save active strategy to portfolio
  const handleSaveToPortfolio = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/strategies/algos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: activeStrategy.name,
          description: activeStrategy.description || "OpenAlgo Automated Strategy",
          script: editorCode || activeStrategy.script,
          language: codeLanguage || activeStrategy.language || 'python',
          configJson: activeStrategy.config,
          backtestResults: backtestResult?.summary || null
        })
      });

      if (res.ok) {
        showToast(`Saved "${activeStrategy.name}" to Strategy Portfolio!`);
        fetchSavedAlgos();
      }
    } catch (err) {
      showToast("Failed to save strategy", "error");
    }
  };

  // Preset Strategy Templates
  const loadPreset = (type) => {
    if (type === 'straddle') {
      setActiveStrategy({
        name: "OpenAlgo_BankNifty_920_Straddle",
        language: "python",
        description: "Institutional 09:20 AM Bank Nifty Short Straddle with 25% Trailing SL and Auto 15:15 Square Off.",
        script: `"""
OpenAlgo Strategy: Bank Nifty 09:20 AM Short Straddle
Features: Auto ATM Strike Selection, 25% Leg-wise Stop Loss, Trailing SL Engine
"""
from openalgo import OpenAlgo
import datetime

client = OpenAlgo(api_key="oa_live_key", host="http://localhost:3000/api/strategies/openalgo", broker="angelone")

def run_920_straddle():
    now = datetime.datetime.now().time()
    if now.hour == 9 and now.minute == 20:
        spot_price = client.quotes.get_ltp("BANKNIFTY", exchange="NSE")
        atm_strike = round(spot_price / 100) * 100
        
        ce_symbol = f"BANKNIFTY{atm_strike}CE"
        pe_symbol = f"BANKNIFTY{atm_strike}PE"
        
        # Place Both Legs in Parallel
        client.place_basket([
            {"symbol": ce_symbol, "action": "SELL", "quantity": 30, "pricetype": "MARKET", "product": "MIS"},
            {"symbol": pe_symbol, "action": "SELL", "quantity": 30, "pricetype": "MARKET", "product": "MIS"}
        ])
        print(f"✅ Straddle Executed at Strike: {atm_strike}")`,
        config: { instrument: "BANKNIFTY", timeframe: "FIVE_MINUTE", stopLoss: 30, target: 60, indicator: "EMA", buyValue: 9, sellValue: 21 }
      });
      showToast("Loaded Bank Nifty 9:20 Straddle Template!");
    } else if (type === 'supertrend') {
      setActiveStrategy({
        name: "OpenAlgo_SuperTrend_EMA_Scalper",
        language: "python",
        description: "SuperTrend (10, 3) + 20 EMA trend-following scalping strategy with Split Order execution.",
        script: `"""
OpenAlgo Strategy: SuperTrend (10, 3) + 20 EMA Trend Scalper
Features: Iceberg / Split Order Execution, Multi-broker Routing
"""
from openalgo import OpenAlgo

client = OpenAlgo(api_key="oa_live_key", host="http://localhost:3000/api/strategies/openalgo", broker="dhan")

def check_supertrend_signal(candles):
    st_val, st_trend = client.indicators.supertrend(candles, period=10, multiplier=3.0)
    ema20 = client.indicators.ema([c['close'] for c in candles], period=20)
    
    current_close = candles[-1]['close']
    if st_trend[-1] == 1 and current_close > ema20[-1]:
        client.place_order(
            strategy="SuperTrend_Scalper",
            symbol="NIFTY",
            action="BUY",
            quantity=50,
            splitorder="YES",
            splitsize=25
        )`,
        config: { instrument: "NIFTY50", timeframe: "FIFTEEN_MINUTE", stopLoss: 20, target: 50, indicator: "RSI", buyValue: 30, sellValue: 70 }
      });
      showToast("Loaded SuperTrend Scalper Template!");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="openalgo_root_container">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
          notification.type === 'error' ? 'bg-red-950 text-red-200 border-red-800' : 'bg-emerald-950 text-emerald-200 border-emerald-800'
        } animate-in fade-in slide-in-from-bottom-4`}>
          {notification.type === 'error' ? <AlertCircle size={18} className="text-red-400" /> : <CheckCircle size={18} className="text-emerald-400" />}
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Top OpenAlgo Command Hub & Multi-Broker Header */}
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm relative overflow-hidden`}>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
          {/* Brand & Status */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-[#c8f135] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-emerald-500/20">
              <Cpu size={26} className="text-black" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    OpenAlgo
                  </h1>
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    isDark 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    v2.4.0 Unified
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
                  executionMode === 'LIVE' 
                    ? isDark ? 'bg-red-500/15 text-red-400 border border-red-500/40' : 'bg-red-50 text-red-700 border border-red-200'
                    : isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${executionMode === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {executionMode === 'LIVE' ? 'LIVE ROUTING ACTIVE' : 'SANDBOX SIMULATOR'}
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${textMuted} mt-0.5`}>
                Open-Source Multi-Broker Algorithmic Trading Architecture (Angel One, Zerodha, Dhan, Fyers & 32+ Brokers)
              </p>
            </div>
          </div>

          {/* Broker Selector, Mode Toggle, Emergency Kill Switch */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
            {/* Broker Dropdown */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 text-xs">
              <span className="text-gray-400 font-medium">Broker:</span>
              <select
                value={selectedBroker}
                onChange={(e) => setSelectedBroker(e.target.value)}
                className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                {BROKER_PLUGINS.map(b => (
                  <option key={b.id} value={b.id} className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">
                    {b.logo} {b.name} ({b.latency})
                  </option>
                ))}
              </select>
            </div>

            {/* Sandbox / Live Mode Switch */}
            <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold">
              <button
                onClick={() => setExecutionMode('SANDBOX')}
                className={`px-3 py-1 rounded-lg transition-all ${executionMode === 'SANDBOX' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Sandbox
              </button>
              <button
                onClick={() => setExecutionMode('LIVE')}
                className={`px-3 py-1 rounded-lg transition-all ${executionMode === 'LIVE' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Live Broker
              </button>
            </div>

            {/* Emergency Kill Switch */}
            <button
              onClick={handleEmergencyKillSwitch}
              disabled={killSwitchActive}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
              title="Instant Kill Switch: Cancels all active orders and closes all open positions across connected brokers."
            >
              <Power size={14} className={killSwitchActive ? "animate-spin" : ""} />
              {killSwitchActive ? "Killing Positions..." : "KILL SWITCH"}
            </button>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-4 border-t border-gray-200 dark:border-white/10 scrollbar-none text-xs font-bold">
          {[
            { id: 'ai_architect', label: 'AI Strategy Architect', icon: Sparkles },
            { id: 'visual_flow', label: 'No-Code Flow Builder', icon: GitBranch },
            { id: 'code_studio', label: 'Multi-Language IDE', icon: Code },
            { id: 'webhook_gateway', label: 'TradingView Webhooks', icon: Webhook },
            { id: 'backtester', label: 'Historical Backtester', icon: BarChart2 },
            { id: 'order_terminal', label: 'Live Order Terminal', icon: Terminal, badge: liveOrders.length },
            { id: 'portfolio', label: 'Strategy Portfolio', icon: Bookmark, badge: savedAlgosList.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                  isActive 
                    ? isDark ? 'bg-[#c8f135] text-black shadow-md' : 'bg-emerald-600 text-white shadow-md'
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? (isDark ? 'bg-black text-white' : 'bg-white text-emerald-800') : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: AI STRATEGY ARCHITECT (OPENALGO COPILOT / MCP) */}
      {/* ========================================================================= */}
      {activeTab === 'ai_architect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Chat & Blueprint Generator */}
          <div className={`lg:col-span-7 rounded-2xl border ${cardBg} shadow-sm flex flex-col h-[700px] overflow-hidden`}>
            {/* Header */}
            <div className={`px-5 py-3.5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between ${headerBg}`}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-500" />
                <span className="font-bold text-sm text-gray-900 dark:text-white">OpenAlgo Quantitative Model Architect</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadPreset('straddle')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                >
                  BankNifty 9:20 Straddle
                </button>
                <button
                  onClick={() => loadPreset('supertrend')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20"
                >
                  SuperTrend Scalper
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-sm scrollbar-thin">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex-shrink-0 flex items-center justify-center text-black font-black text-xs shadow-sm">
                      OA
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    m.role === 'user' 
                      ? isDark ? 'bg-[#c8f135] text-black font-medium' : 'bg-emerald-600 text-white font-medium'
                      : isDark ? 'bg-white/5 border border-white/10 text-gray-200' : 'bg-gray-100 border border-gray-200 text-gray-800'
                  }`}>
                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>

                    {/* If strategy was generated, show Quick Actions */}
                    {m.strategyData && (
                      <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveTab('code_studio');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all"
                        >
                          <Code size={13} /> Inspect Code in IDE
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('backtester');
                            runBacktest(m.strategyData.config);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm"
                        >
                          <Play size={13} /> Run Backtest Walk
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3 items-center text-xs text-emerald-500 font-mono">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center animate-spin">
                    <RefreshCw size={14} />
                  </div>
                  <span>Synthesizing OpenAlgo rules & compiling execution engine...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className={`p-4 border-t border-gray-200 dark:border-white/10 ${headerBg}`}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="E.g., Buy NIFTY when 9 EMA crosses 21 EMA with 25 pts SL & 50 pts target..."
                  className="flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-sm outline-none focus:border-emerald-500 transition-all text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isGenerating}
                  className={`px-4 py-2.5 rounded-xl ${accentBtn} flex items-center gap-1.5 transition-all disabled:opacity-50`}
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Synthesize</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Live Strategy Blueprint & Execution Preview */}
          <div className="lg:col-span-5 space-y-5">
            {/* Active Strategy Card */}
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-emerald-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Active OpenAlgo Model</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  {activeStrategy.language?.toUpperCase() || 'PYTHON'}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-base text-gray-900 dark:text-white">{activeStrategy.name}</h4>
                <p className={`text-xs ${textMuted} line-clamp-2`}>{activeStrategy.description}</p>
              </div>

              {/* Parameter Table */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className={`p-2.5 rounded-xl border ${subCardBg}`}>
                  <span className="text-gray-400 block text-[10px] uppercase">Instrument</span>
                  <strong className="text-gray-900 dark:text-white">{activeStrategy.config?.instrument || 'NIFTY50'}</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${subCardBg}`}>
                  <span className="text-gray-400 block text-[10px] uppercase">Timeframe</span>
                  <strong className="text-emerald-500">{activeStrategy.config?.timeframe || '5m'}</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${subCardBg}`}>
                  <span className="text-gray-400 block text-[10px] uppercase">Stop Loss</span>
                  <strong className="text-red-500">{activeStrategy.config?.stopLoss || 20} pts</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${subCardBg}`}>
                  <span className="text-gray-400 block text-[10px] uppercase">Target</span>
                  <strong className="text-emerald-500">{activeStrategy.config?.target || 40} pts</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('backtester');
                    runBacktest();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Play size={14} /> Backtest Walk
                </button>
                <button
                  onClick={handleSaveToPortfolio}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white font-bold text-xs transition-all`}
                >
                  <Bookmark size={14} /> Save Model
                </button>
              </div>
            </div>

            {/* Supported Broker Latencies */}
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-500" />
                  Broker Gateway Matrix
                </span>
                <span className="text-[10px] text-gray-400 font-mono">36+ Plugins Available</span>
              </div>
              <div className="space-y-2">
                {BROKER_PLUGINS.slice(0, 4).map(b => (
                  <div key={b.id} className={`flex items-center justify-between p-2 rounded-xl border ${subCardBg} text-xs`}>
                    <div className="flex items-center gap-2">
                      <span>{b.logo}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-emerald-500 font-bold">{b.latency}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: VISUAL FLOW STRATEGY BUILDER (NO-CODE CANVAS) */}
      {/* ========================================================================= */}
      {activeTab === 'visual_flow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas Form Builder */}
          <div className={`lg:col-span-7 rounded-2xl border ${cardBg} p-6 shadow-sm space-y-6`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <GitBranch size={20} className="text-emerald-500" />
                  No-Code Rule Flow Canvas
                </h3>
                <p className={`text-xs ${textMuted}`}>Build trigger conditions and smart order rules without writing code.</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('code_studio');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
              >
                <Code size={13} /> Export to Code
              </button>
            </div>

            {/* Block 1: Instrument & Trigger */}
            <div className={`p-4 rounded-xl border ${subCardBg} space-y-3`}>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Step 1: Instrument & Market Trigger
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Underlying Asset</label>
                  <select
                    value={flowConfig.instrument}
                    onChange={(e) => setFlowConfig({ ...flowConfig, instrument: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none"
                  >
                    <option value="NIFTY">NIFTY 50 (Index)</option>
                    <option value="BANKNIFTY">BANK NIFTY (Index)</option>
                    <option value="RELIANCE">RELIANCE (Stock)</option>
                    <option value="HDFCBANK">HDFCBANK (Stock)</option>
                    <option value="TCS">TCS (Stock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Trigger Condition</label>
                  <select
                    value={flowConfig.triggerType}
                    onChange={(e) => setFlowConfig({ ...flowConfig, triggerType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none"
                  >
                    <option value="LTP_CROSS">Live Tick (LTP Cross)</option>
                    <option value="CANDLE_CLOSE">Candle Bar Close</option>
                    <option value="TIME_920">Time-based (09:20 AM)</option>
                    <option value="OI_SHIFT">Option Chain OI Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Indicator Engine</label>
                  <select
                    value={flowConfig.indicator}
                    onChange={(e) => setFlowConfig({ ...flowConfig, indicator: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none"
                  >
                    <option value="SUPERTREND">SuperTrend (10, 3)</option>
                    <option value="EMA_CROSS">EMA Crossover (9 / 21)</option>
                    <option value="RSI">RSI Momentum (30 / 70)</option>
                    <option value="VWAP">VWAP Band Breakout</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Block 2: Order & Smart Execution */}
            <div className={`p-4 rounded-xl border ${subCardBg} space-y-3`}>
              <span className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Step 2: Smart Execution & Split Order
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Action</label>
                  <select
                    value={flowConfig.action}
                    onChange={(e) => setFlowConfig({ ...flowConfig, action: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-emerald-500 font-bold outline-none"
                  >
                    <option value="BUY">BUY (Long)</option>
                    <option value="SELL">SELL (Short)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Order Type</label>
                  <select
                    value={flowConfig.orderType}
                    onChange={(e) => setFlowConfig({ ...flowConfig, orderType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none"
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="SL-M">STOP LOSS (SL-M)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Quantity</label>
                  <input
                    type="number"
                    value={flowConfig.quantity}
                    onChange={(e) => setFlowConfig({ ...flowConfig, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Iceberg Split</label>
                  <select
                    value={flowConfig.enableSplitOrder ? "YES" : "NO"}
                    onChange={(e) => setFlowConfig({ ...flowConfig, enableSplitOrder: e.target.value === "YES" })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-emerald-500 font-bold outline-none"
                  >
                    <option value="YES">YES (Split 25 Qty)</option>
                    <option value="NO">NO (Single Order)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Block 3: Risk Controls */}
            <div className={`p-4 rounded-xl border ${subCardBg} space-y-3`}>
              <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Step 3: Risk Guardrails & Trailing SL
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-gray-400 mb-1 font-sans">Target (Pts)</label>
                  <input
                    type="number"
                    value={flowConfig.targetPoints}
                    onChange={(e) => setFlowConfig({ ...flowConfig, targetPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-emerald-500 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-sans">Stop Loss (Pts)</label>
                  <input
                    type="number"
                    value={flowConfig.stopLossPoints}
                    onChange={(e) => setFlowConfig({ ...flowConfig, stopLossPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-red-500 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-sans">Trailing SL (Pts)</label>
                  <input
                    type="number"
                    value={flowConfig.trailingSlPoints}
                    onChange={(e) => setFlowConfig({ ...flowConfig, trailingSlPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-teal-400 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-sans">Auto Square Off</label>
                  <input
                    type="text"
                    value={flowConfig.squareOffTime}
                    onChange={(e) => setFlowConfig({ ...flowConfig, squareOffTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveTab('backtester');
                  runBacktest(flowConfig);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play size={16} /> Run Backtest Simulation
              </button>
            </div>
          </div>

          {/* Right Visual Flow Diagram & Live JSON Rule Preview */}
          <div className="lg:col-span-5 space-y-5">
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Code size={16} className="text-emerald-500" />
                Compiled OpenAlgo Rule Matrix (JSON)
              </h4>
              <div className="p-4 rounded-xl bg-black font-mono text-xs text-emerald-400 overflow-x-auto max-h-[480px] scrollbar-thin">
                <pre>{JSON.stringify({
                  openalgo_version: "2.4",
                  broker_target: selectedBroker,
                  execution_mode: executionMode,
                  strategy: flowConfig.strategyName,
                  instrument: flowConfig.instrument,
                  trigger: {
                    type: flowConfig.triggerType,
                    indicator: flowConfig.indicator
                  },
                  order: {
                    action: flowConfig.action,
                    pricetype: flowConfig.orderType,
                    product: flowConfig.product,
                    quantity: flowConfig.quantity,
                    split_iceberg: flowConfig.enableSplitOrder ? { enabled: true, chunk: flowConfig.splitSize } : { enabled: false }
                  },
                  risk_guards: {
                    target: flowConfig.targetPoints,
                    stop_loss: flowConfig.stopLossPoints,
                    trailing_sl: flowConfig.trailingSlPoints,
                    auto_square_off: flowConfig.squareOffTime
                  }
                }, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MULTI-LANGUAGE CODE STUDIO (PYTHON, PINESCRIPT, NODE.JS, AFL) */}
      {/* ========================================================================= */}
      {activeTab === 'code_studio' && (
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Code size={20} className="text-emerald-500" />
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">{activeStrategy.name}</h3>
                <span className={`text-xs ${textMuted}`}>OpenAlgo Multi-Language Execution Studio</span>
              </div>
            </div>

            {/* Language Selector & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold font-mono">
                {['python', 'pinescript', 'javascript', 'afl'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-3 py-1 rounded-lg uppercase transition-all ${codeLanguage === lang ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(editorCode);
                  showToast("Code copied to clipboard!");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-900 dark:text-white"
              >
                <Copy size={13} /> Copy
              </button>

              <button
                onClick={handleSaveToPortfolio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Bookmark size={13} /> Save Strategy
              </button>
            </div>
          </div>

          {/* IDE Editor Area */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 font-mono text-xs">
            <textarea
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              rows={22}
              className="w-full p-4 bg-gray-950 text-emerald-400 font-mono leading-relaxed outline-none resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: TRADINGVIEW & WEBHOOK SIGNAL GATEWAY */}
      {/* ========================================================================= */}
      {activeTab === 'webhook_gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Webhook Config & Alert Generator */}
          <div className={`lg:col-span-7 rounded-2xl border ${cardBg} p-6 shadow-sm space-y-5`}>
            <div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Webhook size={20} className="text-emerald-500" />
                OpenAlgo Webhook Signal Gateway
              </h3>
              <p className={`text-xs ${textMuted}`}>Route automated signals from TradingView, Chartink, AmiBroker, Python, or Excel directly into your broker.</p>
            </div>

            {/* Live Webhook Endpoint Box */}
            <div className={`p-4 rounded-xl border ${subCardBg} space-y-2`}>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Your Standard OpenAlgo Webhook URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-black/10 dark:bg-black font-mono text-xs text-emerald-500 border border-gray-200 dark:border-white/10 outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    showToast("Webhook URL copied!");
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Webhook JSON Payload Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white">TradingView Alert JSON Payload Format</span>
                <span className="text-[10px] text-gray-400 font-mono">POST /api/strategies/openalgo/order/place</span>
              </div>
              <textarea
                value={webhookPayload}
                onChange={(e) => setWebhookPayload(e.target.value)}
                rows={11}
                className="w-full p-4 rounded-xl bg-gray-950 text-emerald-400 font-mono text-xs leading-relaxed border border-gray-200 dark:border-white/10 outline-none"
              />
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={handleTestWebhook}
              disabled={isSendingWebhook}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap size={16} className={isSendingWebhook ? "animate-spin" : ""} />
              {isSendingWebhook ? "Dispatching Signal to Router..." : "Dispatch Test Webhook Signal"}
            </button>
          </div>

          {/* Right Live Signal Logs */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Terminal size={15} className="text-emerald-500" />
                  Live Webhook Dispatch Log
                </h4>
                <span className="text-[10px] font-mono text-emerald-500">Live Router</span>
              </div>

              {webhookLogs.length === 0 ? (
                <div className={`p-8 rounded-xl border ${subCardBg} text-center text-xs ${textMuted}`}>
                  No webhook signals dispatched yet. Click "Dispatch Test Webhook Signal" to verify order routing.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
                  {webhookLogs.map(log => (
                    <div key={log.id} className={`p-3 rounded-xl border ${subCardBg} text-xs font-mono space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400">{log.orderId}</span>
                        <span className="text-gray-400 text-[10px]">{log.timestamp} ({log.latency})</span>
                      </div>
                      <p className="text-gray-300">{log.response}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: INSTITUTIONAL HISTORICAL BACKTESTER */}
      {/* ========================================================================= */}
      {activeTab === 'backtester' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm flex flex-wrap items-center justify-between gap-4`}>
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-emerald-500" />
                OpenAlgo Walk-Forward Backtester
              </h3>
              <p className={`text-xs ${textMuted}`}>30-Day Historical Candle Simulation using Angel One SmartAPI Feed</p>
            </div>

            <button
              onClick={() => runBacktest()}
              disabled={runningBacktest}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Play size={14} className={runningBacktest ? "animate-spin" : ""} />
              {runningBacktest ? "Simulating Historical Walk..." : "Execute Backtest"}
            </button>
          </div>

          {/* Backtest Results Cards */}
          {backtestResult?.unavailable ? (
            <div className={`p-8 rounded-2xl border text-center ${cardBg}`}>
              <p className="text-base font-semibold text-gray-900 dark:text-white">Data unavailable</p>
              <p className="text-xs mt-1 text-gray-400">Historical market data is currently unreachable for backtest simulation.</p>
            </div>
          ) : backtestResult && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className="text-gray-400 block text-[10px] font-sans">Net P&L (₹)</span>
                  <strong className={`text-base font-black ${backtestResult.summary?.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ₹{backtestResult.summary?.netProfit?.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className="text-gray-400 block text-[10px] font-sans">Win Rate</span>
                  <strong className="text-base font-black text-emerald-500">{backtestResult.summary?.winRate}</strong>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className="text-gray-400 block text-[10px] font-sans">Total Trades</span>
                  <strong className="text-base font-black text-gray-900 dark:text-white">{backtestResult.summary?.totalTrades}</strong>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className="text-gray-400 block text-[10px] font-sans">Profit Factor</span>
                  <strong className="text-base font-black text-teal-400">{backtestResult.summary?.profitFactor}</strong>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className="text-gray-400 block text-[10px] font-sans">Max Drawdown</span>
                  <strong className="text-base font-black text-red-500">{backtestResult.summary?.maxDrawdown}</strong>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className="text-gray-400 block text-[10px] font-sans">Return %</span>
                  <strong className="text-base font-black text-emerald-500">{backtestResult.summary?.returnPct}</strong>
                </div>
              </div>

              {/* Equity Curve Chart */}
              {backtestResult.equityCurve && backtestResult.equityCurve.length > 0 && (
                <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">Simulated Portfolio Equity Curve</h4>
                    <span className="text-xs text-gray-400 font-mono">Initial Capital: ₹1,00,000</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={backtestResult.equityCurve}>
                        <defs>
                          <linearGradient id="oaEquityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={10} hide />
                        <YAxis stroke="#6b7280" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#oaEquityGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Trade Log */}
              {backtestResult.tradeLog && (
                <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Recent Trade Logs ({backtestResult.tradeLog.length} Walk Records)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400">
                          <th className="pb-2">Side</th>
                          <th className="pb-2">Entry Price</th>
                          <th className="pb-2">Exit Price</th>
                          <th className="pb-2">P&L (₹)</th>
                          <th className="pb-2">Trigger Reason</th>
                          <th className="pb-2">Exit Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {backtestResult.tradeLog.map((t, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-2 text-emerald-500 font-bold">{t.type || 'BUY'}</td>
                            <td className="py-2 text-gray-800 dark:text-gray-200">₹{t.entryPrice?.toFixed(2)}</td>
                            <td className="py-2 text-gray-800 dark:text-gray-200">₹{t.exitPrice?.toFixed(2)}</td>
                            <td className={`py-2 font-bold ${t.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {t.pnl >= 0 ? '+' : ''}₹{t.pnl?.toFixed(2)}
                            </td>
                            <td className="py-2 text-gray-400">{t.reason}</td>
                            <td className="py-2 text-gray-500">{t.exitTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: LIVE ORDER TERMINAL & POSITIONS */}
      {/* ========================================================================= */}
      {activeTab === 'order_terminal' && (
        <div className="space-y-6">
          {/* Header & Refresh */}
          <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm flex items-center justify-between`}>
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Terminal size={18} className="text-emerald-500" />
                OpenAlgo Order & Position Terminal
              </h3>
              <p className={`text-xs ${textMuted}`}>Real-time Execution Pipeline across Broker Connections</p>
            </div>
            <button
              onClick={fetchOrdersAndPositions}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-900 dark:text-white"
            >
              <RefreshCw size={13} className={loadingTerminal ? "animate-spin" : ""} /> Refresh Book
            </button>
          </div>

          {/* Active Positions */}
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Active Positions ({livePositions.length})</h4>
              <span className="text-xs font-mono font-bold text-emerald-500">
                Net MTM: ₹{livePositions.reduce((s, p) => s + (p.pnl || 0), 0).toFixed(2)}
              </span>
            </div>

            {livePositions.length === 0 ? (
              <div className={`p-8 rounded-xl border ${subCardBg} text-center text-xs ${textMuted}`}>
                No open positions currently active.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Avg Price</th>
                      <th className="pb-2">LTP</th>
                      <th className="pb-2">P&L (₹)</th>
                      <th className="pb-2">Broker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {livePositions.map((p, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="py-2.5 font-bold text-gray-900 dark:text-white">{p.symbol}</td>
                        <td className="py-2.5 text-emerald-500">{p.quantity}</td>
                        <td className="py-2.5 text-gray-300">₹{p.avgPrice?.toFixed(2)}</td>
                        <td className="py-2.5 text-gray-300">₹{p.ltp?.toFixed(2)}</td>
                        <td className={`py-2.5 font-bold ${p.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {p.pnl >= 0 ? '+' : ''}₹{p.pnl?.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-gray-400">{p.broker}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order Book */}
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Order Book ({liveOrders.length} Orders)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Strategy</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {liveOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5">
                      <td className="py-2.5 font-bold text-gray-400">{o.orderId}</td>
                      <td className="py-2.5 text-gray-300">{o.strategy}</td>
                      <td className="py-2.5 font-bold text-gray-900 dark:text-white">{o.symbol}</td>
                      <td className={`py-2.5 font-bold ${o.action === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>{o.action}</td>
                      <td className="py-2.5 text-gray-300">{o.quantity}</td>
                      <td className="py-2.5 text-gray-300">₹{o.price?.toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-500' : o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500">{o.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: STRATEGY PORTFOLIO & SAVED MODELS */}
      {/* ========================================================================= */}
      {activeTab === 'portfolio' && (
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-6`}>
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Bookmark size={20} className="text-emerald-500" />
                Strategy Portfolio Library
              </h3>
              <p className={`text-xs ${textMuted}`}>Your collection of synthesized OpenAlgo strategies.</p>
            </div>
            <button
              onClick={() => setActiveTab('ai_architect')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus size={14} /> New Strategy
            </button>
          </div>

          {savedAlgosList.length === 0 ? (
            <div className={`p-12 rounded-xl border ${subCardBg} text-center space-y-3`}>
              <Cpu size={32} className="mx-auto text-emerald-500" />
              <p className={`text-sm ${textMuted}`}>No strategies saved yet. Build and save a model from the AI Architect or No-Code Flow Builder.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedAlgosList.map((algo) => (
                <div key={algo.id} className={`p-5 rounded-xl border ${subCardBg} space-y-3 hover:border-emerald-500/40 transition-all`}>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{algo.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase">
                      {algo.language || 'PYTHON'}
                    </span>
                  </div>
                  <p className={`text-xs ${textMuted} line-clamp-2`}>{algo.description || 'OpenAlgo Quantitative Model'}</p>
                  <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveStrategy({
                          name: algo.name,
                          language: algo.language || 'python',
                          description: algo.description,
                          script: algo.script,
                          config: algo.configJson || { instrument: "NIFTY50", timeframe: "FIVE_MINUTE" }
                        });
                        setActiveTab('code_studio');
                      }}
                      className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1"
                    >
                      Open in IDE <ChevronRight size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('backtester');
                        runBacktest(algo.configJson);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20"
                    >
                      Backtest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
