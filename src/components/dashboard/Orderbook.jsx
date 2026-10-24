import React, { useState, useEffect, useRef } from 'react';
import { Zap, AlertTriangle, MousePointer2, X, RefreshCw, Layers, TrendingUp, TrendingDown, ArrowUpDown, Clock } from 'lucide-react';

// Helper to determine real-time Indian stock market open/closed status (Mon-Fri 09:15 - 15:30 IST)
function getIsIndianMarketOpen() {
  try {
    const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const ist = new Date(istString);
    const day = ist.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;
    const minutes = ist.getHours() * 60 + ist.getMinutes();
    return minutes >= (9 * 60 + 15) && minutes <= (15 * 60 + 30);
  } catch (e) {
    return false;
  }
}

export default function Orderbook({ theme }) {
  const [viewMode, setViewMode] = useState('book'); // book, dom
  const [symbol, setSymbol] = useState('NIFTY50');
  const [marketType, setMarketType] = useState('nse'); // 'nse' or 'crypto'
  const [ladder, setLadder] = useState([]);
  const [ltp, setLtp] = useState(null);
  const [displayName, setDisplayName] = useState('NIFTY 50');
  const [totalBuyQty, setTotalBuyQty] = useState(0);
  const [totalSellQty, setTotalSellQty] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [marketOpen, setMarketOpen] = useState(getIsIndianMarketOpen);
  const [marketStatus, setMarketStatus] = useState(() => getIsIndianMarketOpen() ? 'OPEN' : 'CLOSED');
  const [marketMessage, setMarketMessage] = useState('');
  const [change, setChange] = useState(null);
  const [changePercent, setChangePercent] = useState(null);
  const [previousClose, setPreviousClose] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const INDIAN_PRESETS = [
    { label: 'NIFTY 50', symbol: 'NIFTY50' },
    { label: 'BANK NIFTY', symbol: 'BANKNIFTY' },
    { label: 'RELIANCE', symbol: 'RELIANCE.NS' },
    { label: 'HDFC BANK', symbol: 'HDFCBANK.NS' },
    { label: 'TCS', symbol: 'TCS.NS' },
    { label: 'INFOSYS', symbol: 'INFY.NS' },
    { label: 'SBI', symbol: 'SBIN.NS' },
    { label: 'TATA MOTORS', symbol: 'TATAMOTORS.NS' },
    { label: 'ICICI BANK', symbol: 'ICICIBANK.NS' },
  ];

  const CRYPTO_PRESETS = [
    { label: 'BTC / USDT', symbol: 'BTCUSDT' },
    { label: 'ETH / USDT', symbol: 'ETHUSDT' },
    { label: 'SOL / USDT', symbol: 'SOLUSDT' },
  ];

  const [orders, setOrders] = useState([]); // { price, side, size }

  const placeOrder = (price, side) => {
    setOrders(prev => {
      const existing = prev.find(o => o.price === price && o.side === side);
      if (existing) {
        return prev.map(o => o.price === price && o.side === side ? { ...o, size: o.size + 1 } : o);
      }
      return [...prev, { price, side, size: 1 }];
    });
  };

  const cancelOrder = (e, price, side) => {
    e.stopPropagation();
    setOrders(prev => prev.filter(o => !(o.price === price && o.side === side)));
  };

  const isCrypto = symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD');
  const currencySymbol = isCrypto ? '$' : '₹';

  useEffect(() => {
    let interval;
    let isMounted = true;
    
    setLadder([]);
    setError(null);
    setIsLive(false);

    const fetchBinanceOrderbook = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`);
        if (!res.ok) throw new Error('Binance API error');
        const data = await res.json();
        
        if (!isMounted) return;
        
        let buySum = 0;
        let sellSum = 0;

        const asks = data.asks.map(a => {
          const rawSize = parseFloat(a[1]);
          sellSum += rawSize;
          return {
            type: 'ask',
            price: parseFloat(a[0]).toFixed(2),
            askSize: rawSize.toFixed(4),
            bidSize: null,
            orders: null,
            rawSize
          };
        }).reverse(); 
        
        const bids = data.bids.map(b => {
          const rawSize = parseFloat(b[1]);
          buySum += rawSize;
          return {
            type: 'bid',
            price: parseFloat(b[0]).toFixed(2),
            askSize: null,
            bidSize: rawSize.toFixed(4),
            orders: null,
            rawSize
          };
        });

        const bestAsk = asks.length > 0 ? parseFloat(asks[asks.length - 1].price) : 0;
        const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
        const midPrice = bestBid && bestAsk ? ((bestBid + bestAsk) / 2).toFixed(2) : (bestBid || bestAsk || null);
        
        setLadder([...asks, ...bids]);
        setLtp(midPrice);
        setDisplayName(symbol);
        setTotalBuyQty(buySum);
        setTotalSellQty(sellSum);
        setIsLive(true);
        setMarketOpen(true);
        setMarketStatus('OPEN (24/7)');
        setMarketMessage('');
        setChange(null);
        setChangePercent(null);
        setPreviousClose(null);
        setDataSource('Binance Real-Time L2 Feed');
        setLastUpdated(new Date().toLocaleTimeString('en-IN'));
        setError(null);
      } catch (err) {
        if (isMounted) setError('Failed to fetch from Binance. Real-time network error.');
      }
    };

    const fetchSmartAPIDepth = async () => {
      try {
        const res = await fetch(`/api/market/depth?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch depth data');
        }
        const data = await res.json();
        
        if (!isMounted) return;
        
        if (data && data.depth) {
          let asks = [];
          let sellSum = 0;
          if (data.depth.sell && Array.isArray(data.depth.sell)) {
            asks = data.depth.sell
              .filter(a => a && (a.price > 0 || typeof a.price === 'number'))
              .map(a => {
                const rawSize = Number(a.quantity) || 0;
                sellSum += rawSize;
                return {
                  type: 'ask',
                  price: Number(a.price).toFixed(2),
                  askSize: rawSize.toLocaleString('en-IN'),
                  bidSize: null,
                  orders: a.orders || 1,
                  rawSize
                };
              })
              .reverse(); // Lowest ask closest to spread
          }
          
          let bids = [];
          let buySum = 0;
          if (data.depth.buy && Array.isArray(data.depth.buy)) {
            bids = data.depth.buy
              .filter(b => b && (b.price > 0 || typeof b.price === 'number'))
              .map(b => {
                const rawSize = Number(b.quantity) || 0;
                buySum += rawSize;
                return {
                  type: 'bid',
                  price: Number(b.price).toFixed(2),
                  askSize: null,
                  bidSize: rawSize.toLocaleString('en-IN'),
                  orders: b.orders || 1,
                  rawSize
                };
              });
          }
          
          if (asks.length > 0 || bids.length > 0) {
            setLadder([...asks, ...bids]);
            setLtp(data.ltp ? Number(data.ltp).toFixed(2) : null);
            setDisplayName(data.displayName || data.symbol || symbol);
            setTotalBuyQty(data.depth.totalBuyQuantity || buySum);
            setTotalSellQty(data.depth.totalSellQuantity || sellSum);
            setIsLive(Boolean(data.isLive));
            const calculatedOpen = data.marketOpen !== undefined ? Boolean(data.marketOpen) : getIsIndianMarketOpen();
            setMarketOpen(calculatedOpen);
            setMarketStatus(data.marketStatus || (calculatedOpen ? 'OPEN' : 'CLOSED'));
            setMarketMessage(data.marketMessage || '');
            if (data.change !== undefined) setChange(data.change);
            if (data.changePercent !== undefined) setChangePercent(data.changePercent);
            if (data.previousClose !== undefined) setPreviousClose(data.previousClose);
            setDataSource(data.source || 'AngelOne SmartAPI (Live Level-2)');
            setLastUpdated(new Date().toLocaleTimeString('en-IN'));
            setError(null);
            return true;
          }
        }
        throw new Error('Order book depth format received was incomplete');
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to stream market depth.');
          setIsLive(false);
        }
        return false;
      }
    };

    const startDataStream = async () => {
      if (isCrypto) {
        await fetchBinanceOrderbook();
        interval = setInterval(fetchBinanceOrderbook, 1500);
      } else {
        const isLiveOrOpen = await fetchSmartAPIDepth();
        // If market is closed, Indian equity depth doesn't move - avoid rapid re-polling
        const isOpen = getIsIndianMarketOpen();
        if (isOpen) {
          interval = setInterval(fetchSmartAPIDepth, 3000);
        } else {
          // Slow refresh (every 60s) just to verify state transitions
          interval = setInterval(fetchSmartAPIDepth, 60000);
        }
      }
    };

    startDataStream();
    
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [symbol]);

  // Find max sizes to calculate depth distribution visual bars
  const maxAskSize = Math.max(...ladder.filter(l => l.type === 'ask').map(l => l.rawSize || 0), 1);
  const maxBidSize = Math.max(...ladder.filter(l => l.type === 'bid').map(l => l.rawSize || 0), 1);

  // Spread calculation
  const bestBidItem = ladder.find(l => l.type === 'bid');
  const bestAskItem = [...ladder].reverse().find(l => l.type === 'ask');
  const bestBidPrice = bestBidItem ? parseFloat(bestBidItem.price) : 0;
  const bestAskPrice = bestAskItem ? parseFloat(bestAskItem.price) : 0;
  const spread = bestAskPrice && bestBidPrice ? Math.max(0, bestAskPrice - bestBidPrice).toFixed(2) : '0.05';

  // Imbalance percentage
  const totalDepth = (totalBuyQty || 0) + (totalSellQty || 0);
  const buyRatio = totalDepth > 0 ? Math.round((totalBuyQty / totalDepth) * 100) : 50;
  const sellRatio = 100 - buyRatio;

  return (
    <div className={`w-full p-4 sm:p-6 h-full overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight">Level-2 Orderbook</h1>
                {isCrypto ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CRYPTO 24/7 • LIVE STREAM
                  </span>
                ) : marketOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    MARKET OPEN • LIVE L2
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Clock size={12} className="text-amber-400" />
                    MARKET CLOSED • CLOSING SNAPSHOT
                  </span>
                )}
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-0.5 flex items-center gap-1.5 flex-wrap`}>
                <Zap size={13} className={marketOpen || isCrypto ? "text-blue-400" : "text-amber-400"} />
                <span>Source: <strong className="font-semibold">{dataSource || 'Connecting to Market Data Engine...'}</strong></span>
                {lastUpdated && <span className="text-[11px] opacity-75">| Updated: {lastUpdated}</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {['book', 'dom'].map(m => (
            <button 
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all ${
                viewMode === m 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                  : (theme === 'dark' ? 'bg-[#18181b] text-gray-400 hover:bg-[#27272a]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')
              }`}
            >
              {m === 'book' ? 'L2 Book' : 'DOM'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">

        {/* Off-Market Hours Notice Banner */}
        {!isCrypto && !marketOpen && (
          <div className={`p-3.5 rounded-xl border flex items-start sm:items-center justify-between gap-3 text-xs ${
            theme === 'dark' 
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-200' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start sm:items-center gap-2.5">
              <Clock size={16} className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px] block sm:inline mr-2 text-amber-400">
                  NSE/BSE Closed
                </span>
                <span className="opacity-90">
                  {marketMessage || "Indian stock exchanges are currently closed (Trading hours: 09:15 AM – 03:30 PM IST, Mon–Fri). Displaying verified closing session depth snapshot based on official exchange settlement data."}
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
              AMO / CLOSING
            </span>
          </div>
        )}
        
        {/* Symbol selector & Market Tabs */}
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121214] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={symbol} 
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className={`px-3.5 py-2 rounded-lg font-mono font-medium text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  theme === 'dark' ? 'bg-[#1a1a1e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`} 
                placeholder="Symbol (e.g. NIFTY50, RELIANCE.NS)"
              />
              <span className="text-xs font-mono font-medium opacity-60">
                {displayName}
              </span>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setMarketType('nse');
                  if (isCrypto) setSymbol('NIFTY50');
                  const open = getIsIndianMarketOpen();
                  setMarketOpen(open);
                  setMarketStatus(open ? 'OPEN' : 'CLOSED');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  marketType === 'nse'
                    ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                    : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                NSE (India)
              </button>
              <button
                onClick={() => {
                  setMarketType('crypto');
                  if (!isCrypto) setSymbol('BTCUSDT');
                  setMarketOpen(true);
                  setMarketStatus('OPEN (24/7)');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  marketType === 'crypto'
                    ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                    : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                Crypto (Binance)
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(marketType === 'nse' ? INDIAN_PRESETS : CRYPTO_PRESETS).map(item => (
              <button
                key={item.symbol}
                onClick={() => setSymbol(item.symbol)}
                className={`px-3 py-1 text-xs font-mono rounded-lg whitespace-nowrap transition-all ${
                  symbol === item.symbol 
                    ? 'bg-blue-600 text-white font-bold shadow-sm' 
                    : (theme === 'dark' ? 'bg-[#1c1c20] text-gray-300 hover:bg-[#282830] border border-white/5' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200')
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Market Depth Imbalance & Statistics Bar */}
        <div className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-4 ${
          theme === 'dark' ? 'bg-[#121214] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {marketOpen || isCrypto ? 'Last Traded Price' : 'Closing Price (LTP)'}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-blue-500">
                {ltp ? `${currencySymbol}${ltp}` : '--'}
              </span>
              {changePercent !== null && changePercent !== undefined && (
                <span className={`text-xs font-mono font-semibold ${
                  changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {changePercent >= 0 ? '+' : ''}{Number(changePercent).toFixed(2)}%
                </span>
              )}
            </div>
            {previousClose && (
              <div className={`text-[10px] font-mono mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Prev Close: {currencySymbol}{Number(previousClose).toFixed(2)}
              </div>
            )}
          </div>

          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Bid-Ask Spread
            </span>
            <div className="text-xl font-bold font-mono text-amber-500 mt-0.5">
              {currencySymbol}{spread}
            </div>
          </div>

          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider text-emerald-500`}>
              Total Bid Volume
            </span>
            <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">
              {totalBuyQty ? Number(totalBuyQty).toLocaleString('en-IN') : '--'}
            </div>
          </div>

          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider text-rose-500`}>
              Total Ask Volume
            </span>
            <div className="text-xl font-bold font-mono text-rose-500 mt-0.5">
              {totalSellQty ? Number(totalSellQty).toLocaleString('en-IN') : '--'}
            </div>
          </div>

          {/* Liquidity Imbalance Meter */}
          <div className="col-span-2 sm:col-span-4 pt-2 border-t border-dashed border-gray-500/20">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <TrendingUp size={13} /> Buy Pressure: {buyRatio}%
              </span>
              <span className="text-xs text-gray-400">Order Book Imbalance</span>
              <span className="text-rose-500 font-bold flex items-center gap-1">
                Sell Pressure: {sellRatio}% <TrendingDown size={13} />
              </span>
            </div>
            <div className="w-full h-2.5 bg-rose-500/30 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${buyRatio}%` }}
              ></div>
              <div 
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${sellRatio}%` }}
              ></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-500 text-sm font-medium">
            <AlertTriangle size={17} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* View Mode 1: Classic L2 Order Book Ladder */}
        {viewMode === 'book' && (
          <div className={`border rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-[#0d0d0d]' : 'border-slate-200 bg-white'}`}>
            <div className={`grid grid-cols-3 text-xs font-bold font-mono py-2.5 px-4 border-b ${theme === 'dark' ? 'border-white/10 bg-[#141416]' : 'border-slate-200 bg-slate-100'} opacity-90`}>
              <div className="text-left text-emerald-500">Bid Size (Quantity)</div>
              <div className="text-center">Price ({currencySymbol})</div>
              <div className="text-right text-rose-500">Ask Size (Quantity)</div>
            </div>
            
            <div className={`divide-y font-mono text-[13px] ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
              {ladder.length === 0 ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-blue-500" size={20} />
                  <span>Loading Level-2 Depth Feed for {symbol}...</span>
                </div>
              ) : (
                ladder.map((level, i) => {
                  const isAsk = level.type === 'ask';
                  return (
                    <div 
                      key={`${level.price}-${i}`} 
                      className={`grid grid-cols-3 py-1.5 px-4 transition-colors relative ${
                        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Bid Column */}
                      <div className="text-left text-emerald-500 relative flex items-center">
                        <div className="relative z-10 font-semibold">
                          {level.bidSize !== null ? level.bidSize : '-'}
                          {level.orders && level.bidSize !== null && (
                            <span className="text-[10px] ml-1.5 opacity-60 font-normal">({level.orders})</span>
                          )}
                        </div>
                        {level.bidSize !== null && (
                          <div 
                            className="absolute top-0 right-0 bottom-0 bg-emerald-500/15 z-0 transition-all duration-300 ease-out rounded-l-sm" 
                            style={{ width: `${Math.min(100, (level.rawSize / maxBidSize) * 100)}%` }}
                          ></div>
                        )}
                      </div>
                      
                      {/* Price Column */}
                      <div className={`text-center font-bold relative z-10 ${isAsk ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {level.price}
                      </div>
                      
                      {/* Ask Column */}
                      <div className="text-right text-rose-500 relative flex items-center justify-end">
                        <div className="relative z-10 font-semibold">
                          {level.orders && level.askSize !== null && (
                            <span className="text-[10px] mr-1.5 opacity-60 font-normal">({level.orders})</span>
                          )}
                          {level.askSize !== null ? level.askSize : '-'}
                        </div>
                        {level.askSize !== null && (
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-rose-500/15 z-0 transition-all duration-300 ease-out rounded-r-sm" 
                            style={{ width: `${Math.min(100, (level.rawSize / maxAskSize) * 100)}%` }}
                          ></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* View Mode 2: Interactive DOM (Depth of Market) Ladder */}
        {viewMode === 'dom' && (
          <div className={`border rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-[#0d0d0d]' : 'border-slate-200 bg-white'}`}>
            <div className={`grid grid-cols-3 text-xs font-bold font-mono py-2.5 px-4 border-b ${theme === 'dark' ? 'border-white/10 bg-[#141416]' : 'border-slate-200 bg-slate-100'} opacity-90`}>
              <div className="text-left flex items-center gap-1 text-emerald-500">
                <MousePointer2 size={13}/> Bid (Click to Buy Limit)
              </div>
              <div className="text-center">Price ({currencySymbol})</div>
              <div className="text-right flex items-center justify-end gap-1 text-rose-500">
                Ask (Click to Sell Limit) <MousePointer2 size={13}/>
              </div>
            </div>
            
            <div className={`divide-y font-mono text-[13px] ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
              {ladder.length === 0 ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-blue-500" size={20} />
                  <span>Loading DOM Data for {symbol}...</span>
                </div>
              ) : (
                ladder.map((level, i) => {
                  const hasBuy = orders.find(o => o.price === level.price && o.side === 'buy');
                  const hasSell = orders.find(o => o.price === level.price && o.side === 'sell');
                  
                  return (
                    <div 
                      key={`${level.price}-${i}-dom`} 
                      className={`grid grid-cols-3 transition-colors select-none ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      {/* Buy Column */}
                      <div 
                        onClick={() => placeOrder(level.price, 'buy')} 
                        className={`text-left text-emerald-500 relative flex items-center px-4 py-1.5 cursor-crosshair group ${
                          theme === 'dark' ? 'hover:bg-emerald-500/20' : 'hover:bg-emerald-100'
                        }`}
                      >
                        <div className="relative z-10 font-medium group-hover:opacity-20 transition-opacity">
                          {level.bidSize !== null ? level.bidSize : '-'}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow">BUY LMT</span>
                        </div>
                        
                        {hasBuy && (
                          <div className="absolute left-1 z-20 flex items-center gap-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-bold">
                            <span>{hasBuy.size} Lot</span>
                            <X size={11} className="cursor-pointer hover:text-emerald-200" onClick={(e) => cancelOrder(e, level.price, 'buy')} />
                          </div>
                        )}
                      </div>
                      
                      {/* Price Column */}
                      <div className={`text-center font-bold px-4 py-1.5 ${level.type === 'ask' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {level.price}
                      </div>
                      
                      {/* Sell Column */}
                      <div 
                        onClick={() => placeOrder(level.price, 'sell')} 
                        className={`text-right text-rose-500 relative flex items-center justify-end px-4 py-1.5 cursor-crosshair group ${
                          theme === 'dark' ? 'hover:bg-rose-500/20' : 'hover:bg-rose-100'
                        }`}
                      >
                        <div className="relative z-10 font-medium group-hover:opacity-20 transition-opacity">
                          {level.askSize !== null ? level.askSize : '-'}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow">SELL LMT</span>
                        </div>
                        
                        {hasSell && (
                          <div className="absolute right-1 z-20 flex items-center gap-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-bold">
                            <span>{hasSell.size} Lot</span>
                            <X size={11} className="cursor-pointer hover:text-rose-200" onClick={(e) => cancelOrder(e, level.price, 'sell')} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
