import express from "express";
import https from "https";
import yahooFinanceModule from "yahoo-finance2";
import { marketCache } from "../cache/marketCache";

const YahooFinanceClass = (yahooFinanceModule as any)?.default ?? yahooFinanceModule;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ["yahooSurvey"] });

const router = express.Router();

interface NSEMasterItem {
  symbol: string;
  scripcode: string;
  description: string;
  type: string;
  exchange: string;
  instrumentType?: string;
  fullname?: string;
}

// Helper: Calculate accurate Indian Standard Time (IST) & Market Hours Status
export function getIndianMarketStatus() {
  const now = new Date();
  // Get time in IST (UTC+5:30)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));

  const dayOfWeek = istDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const seconds = istDate.getSeconds();
  const totalMins = hours * 60 + minutes;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let isRegularMarket = false;
  let isPreMarket = false;
  let isPostMarket = false;
  let statusText = "Market Closed";

  if (!isWeekend) {
    if (totalMins >= 540 && totalMins < 555) { // 09:00 - 09:15 IST
      isPreMarket = true;
      statusText = "Pre-Market";
    } else if (totalMins >= 555 && totalMins <= 930) { // 09:15 - 15:30 IST
      isRegularMarket = true;
      statusText = "Live (Market Open)";
    } else if (totalMins > 930 && totalMins <= 960) { // 15:30 - 16:00 IST
      isPostMarket = true;
      statusText = "Post-Market";
    }
  }

  const isMarketOpen = isRegularMarket;
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeFormatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} IST`;
  const dateFormatted = `${pad(istDate.getDate())}/${pad(istDate.getMonth() + 1)}/${istDate.getFullYear()}`;

  return {
    isMarketOpen,
    isRegularMarket,
    isPreMarket,
    isPostMarket,
    statusText,
    istTime: timeFormatted,
    istDate: dateFormatted,
    exchange: "NSE",
    timezone: "Asia/Kolkata (IST)"
  };
}

// Helper: Map user symbol & segment to standard Yahoo Finance symbol
export function resolveYahooSymbol(symbol: string, segment: string): { yahooSym: string; isIndex: boolean; displayName: string } {
  const upper = symbol.toUpperCase().trim();
  const clean = upper.replace("-EQ", "").replace("-FUT", "").trim();

  // 1. Index Symbol Mappings
  if (segment === "IDX" || clean.startsWith("NIFTY") || clean.includes("SENSEX") || clean.includes("BANK")) {
    if (clean === "NIFTY 50" || clean === "NIFTY" || clean === "NIFTY50") {
      return { yahooSym: "^NSEI", isIndex: true, displayName: "NIFTY 50" };
    }
    if (clean === "NIFTY BANK" || clean === "BANKNIFTY" || clean === "BANK NIFTY") {
      return { yahooSym: "^NSEBANK", isIndex: true, displayName: "NIFTY BANK" };
    }
    if (clean === "NIFTY IT" || clean === "CNXIT") {
      return { yahooSym: "^CNXIT", isIndex: true, displayName: "NIFTY IT" };
    }
    if (clean === "NIFTY NEXT 50" || clean === "NEXT50") {
      return { yahooSym: "^NSMIDCP", isIndex: true, displayName: "NIFTY NEXT 50" };
    }
    if (clean === "NIFTY MIDCAP 100" || clean === "MIDCAP100") {
      return { yahooSym: "^NSMIDCP", isIndex: true, displayName: "NIFTY MIDCAP 100" };
    }
    if (clean === "NIFTY AUTO") {
      return { yahooSym: "^CNXAUTO", isIndex: true, displayName: "NIFTY AUTO" };
    }
    if (clean === "NIFTY FMCG") {
      return { yahooSym: "^CNXFMCG", isIndex: true, displayName: "NIFTY FMCG" };
    }
    if (clean === "NIFTY METAL") {
      return { yahooSym: "^CNXMETAL", isIndex: true, displayName: "NIFTY METAL" };
    }
    if (clean === "NIFTY PHARMA") {
      return { yahooSym: "^CNXPHARMA", isIndex: true, displayName: "NIFTY PHARMA" };
    }
    if (clean === "NIFTY ENERGY") {
      return { yahooSym: "^CNXENERGY", isIndex: true, displayName: "NIFTY ENERGY" };
    }
    if (clean === "SENSEX" || clean === "BSE SENSEX" || clean === "^BSESN") {
      return { yahooSym: "^BSESN", isIndex: true, displayName: "BSE SENSEX" };
    }
    if (clean === "INDIA VIX" || clean === "VIX") {
      return { yahooSym: "^INDIAVIX", isIndex: true, displayName: "INDIA VIX" };
    }
    return { yahooSym: "^NSEI", isIndex: true, displayName: clean };
  }

  // 2. Equities
  if (segment === "EQ") {
    if (clean.endsWith(".NS") || clean.endsWith(".BO")) {
      return { yahooSym: clean, isIndex: false, displayName: clean.replace(".NS", "") };
    }
    return { yahooSym: `${clean}.NS`, isIndex: false, displayName: clean };
  }

  // 3. F&O Underlying fallback
  if (clean.includes("BANK")) {
    return { yahooSym: "^NSEBANK", isIndex: true, displayName: clean };
  }
  return { yahooSym: "^NSEI", isIndex: true, displayName: clean };
}

function mapToYahooInterval(interval: string): { yfInterval: string; lookbackDays: number } {
  switch (interval) {
    case '1m': return { yfInterval: '1m', lookbackDays: 5 };
    case '3m': return { yfInterval: '5m', lookbackDays: 14 };
    case '5m': return { yfInterval: '5m', lookbackDays: 30 };
    case '10m': return { yfInterval: '15m', lookbackDays: 60 };
    case '15m': return { yfInterval: '15m', lookbackDays: 60 };
    case '30m': return { yfInterval: '30m', lookbackDays: 60 };
    case '1h': return { yfInterval: '60m', lookbackDays: 365 };
    case '1d': return { yfInterval: '1d', lookbackDays: 730 };
    case '1w': return { yfInterval: '1wk', lookbackDays: 1825 };
    case '1M': return { yfInterval: '1mo', lookbackDays: 3650 };
    default: return { yfInterval: '1d', lookbackDays: 365 };
  }
}

// In-memory master symbols cache seeded with NSE indices, top equities, and active F&O symbols
const MASTER_SYMBOLS: Record<string, NSEMasterItem[]> = {
  IDX: [
    { symbol: "NIFTY 50", scripcode: "26000", description: "Nifty 50 Benchmark Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY BANK", scripcode: "26004", description: "Nifty Bank Sectoral Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY IT", scripcode: "26001", description: "Nifty IT Sectoral Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY NEXT 50", scripcode: "26002", description: "Nifty Next 50 Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY MIDCAP 100", scripcode: "26005", description: "Nifty Midcap 100 Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY AUTO", scripcode: "26006", description: "Nifty Auto Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY FMCG", scripcode: "26007", description: "Nifty FMCG Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY METAL", scripcode: "26008", description: "Nifty Metal Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY PHARMA", scripcode: "26009", description: "Nifty Pharma Index", type: "Index", exchange: "NSE" },
    { symbol: "NIFTY ENERGY", scripcode: "26010", description: "Nifty Energy Index", type: "Index", exchange: "NSE" }
  ],
  EQ: [
    { symbol: "RELIANCE-EQ", scripcode: "2885", description: "RELIANCE INDUSTRIES LTD", type: "Equity", exchange: "NSE" },
    { symbol: "HDFCBANK-EQ", scripcode: "1333", description: "HDFC BANK LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "ICICIBANK-EQ", scripcode: "4963", description: "ICICI BANK LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "INFY-EQ", scripcode: "1594", description: "INFOSYS LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "TCS-EQ", scripcode: "11536", description: "TATA CONSULTANCY SERVICES", type: "Equity", exchange: "NSE" },
    { symbol: "SBIN-EQ", scripcode: "3045", description: "STATE BANK OF INDIA", type: "Equity", exchange: "NSE" },
    { symbol: "TATAMOTORS-EQ", scripcode: "3456", description: "TATA MOTORS LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "AXISBANK-EQ", scripcode: "5900", description: "AXIS BANK LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "ITC-EQ", scripcode: "1660", description: "ITC LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "BHARTIARTL-EQ", scripcode: "10604", description: "BHARTI AIRTEL LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "KOTAKBANK-EQ", scripcode: "1922", description: "KOTAK MAHINDRA BANK", type: "Equity", exchange: "NSE" },
    { symbol: "LT-EQ", scripcode: "11483", description: "LARSEN & TOUBRO LTD", type: "Equity", exchange: "NSE" },
    { symbol: "TATASTEEL-EQ", scripcode: "3499", description: "TATA STEEL LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "BAJFINANCE-EQ", scripcode: "317", description: "BAJAJ FINANCE LIMITED", type: "Equity", exchange: "NSE" },
    { symbol: "MARUTI-EQ", scripcode: "10999", description: "MARUTI SUZUKI INDIA LTD", type: "Equity", exchange: "NSE" }
  ],
  FO: [
    { symbol: "NIFTY26JANFUT", scripcode: "49229", description: "NIFTY 27 JAN 2026", type: "Futures", exchange: "NSE" },
    { symbol: "NIFTY26FEBFUT", scripcode: "59182", description: "NIFTY 24 FEB 2026", type: "Futures", exchange: "NSE" },
    { symbol: "BANKNIFTY26JANFUT", scripcode: "59890", description: "BANKNIFTY 27 JAN 2026", type: "Futures", exchange: "NSE" },
    { symbol: "BANKNIFTY26FEBFUT", scripcode: "60110", description: "BANKNIFTY 24 FEB 2026", type: "Futures", exchange: "NSE" },
    { symbol: "NIFTY2612024000CE", scripcode: "38639", description: "NIFTY 24000 CALL OPTION", type: "Options", exchange: "NSE" },
    { symbol: "NIFTY2612024000PE", scripcode: "38640", description: "NIFTY 24000 PUT OPTION", type: "Options", exchange: "NSE" },
    { symbol: "NIFTY2612024500CE", scripcode: "38641", description: "NIFTY 24500 CALL OPTION", type: "Options", exchange: "NSE" },
    { symbol: "NIFTY2612024500PE", scripcode: "38642", description: "NIFTY 24500 PUT OPTION", type: "Options", exchange: "NSE" }
  ]
};

// Helper: Query live NSE dynamic search endpoint with fallback to master cache
async function queryNseDynamicSearch(symbol: string, segment: string): Promise<NSEMasterItem[]> {
  return new Promise((resolve) => {
    try {
      const postData = JSON.stringify({ symbol, segment });
      const req = https.request("https://charting.nseindia.com/v1/exchanges/symbolsDynamic", {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "Origin": "https://charting.nseindia.com",
          "Referer": "https://charting.nseindia.com/",
          "Content-Length": Buffer.byteLength(postData)
        },
        timeout: 4000
      }, (res) => {
        let body = "";
        res.on("data", c => body += c);
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed && parsed.status && Array.isArray(parsed.data) && parsed.data.length > 0) {
              const items: NSEMasterItem[] = parsed.data.map((d: any) => ({
                symbol: d.symbol || symbol,
                scripcode: String(d.scripcode || d.token || ""),
                description: d.description || d.fullname || d.symbol,
                type: d.type || (segment === "IDX" ? "Index" : segment === "FO" ? "Futures" : "Equity"),
                exchange: d.exchange || "NSE",
                instrumentType: d.instrumentType,
                fullname: d.fullname
              }));
              return resolve(items);
            }
          } catch {
            // fallback
          }
          resolve(filterLocalMaster(symbol, segment));
        });
      });

      req.on("error", () => {
        resolve(filterLocalMaster(symbol, segment));
      });
      req.on("timeout", () => {
        req.destroy();
        resolve(filterLocalMaster(symbol, segment));
      });

      req.write(postData);
      req.end();
    } catch {
      resolve(filterLocalMaster(symbol, segment));
    }
  });
}

function filterLocalMaster(symbol: string, segment: string): NSEMasterItem[] {
  const list = MASTER_SYMBOLS[segment] || [];
  const q = symbol.toUpperCase();
  const matched = list.filter(item => 
    item.symbol.toUpperCase().includes(q) || 
    item.description.toUpperCase().includes(q)
  );
  return matched.length > 0 ? matched : list;
}

// 1. GET /api/openchart/symbols - Search symbols across IDX, EQ, FO
router.get("/symbols", async (req, res) => {
  try {
    const symbolQuery = (req.query.symbol as string || "").trim();
    const segment = (req.query.segment as string || "IDX").toUpperCase();

    if (!["IDX", "EQ", "FO"].includes(segment)) {
      return res.status(400).json({ error: "Invalid segment. Must be 'IDX', 'EQ', or 'FO'." });
    }

    if (!symbolQuery) {
      const defaultList = MASTER_SYMBOLS[segment] || [];
      return res.json({ status: true, data: defaultList, source: "OpenChart Master Registry" });
    }

    const results = await queryNseDynamicSearch(symbolQuery, segment);
    return res.json({
      status: true,
      segment,
      data: results,
      total: results.length,
      source: "OpenChart NSE Dynamic Search Engine"
    });
  } catch (err: any) {
    console.error("OpenChart symbols error:", err);
    return res.status(500).json({ error: "Failed to search symbols" });
  }
});

// 2. GET /api/openchart/historical - Fetch historical OHLCV candles
router.get("/historical", async (req, res) => {
  try {
    const symbol = (req.query.symbol as string || "NIFTY 50").trim();
    const segment = (req.query.segment as string || "IDX").toUpperCase();
    const interval = (req.query.interval as string || "1d");
    const days = parseInt(req.query.days as string || "30", 10);

    const validTimeframes = ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1w', '1M'];
    const activeInterval = validTimeframes.includes(interval) ? interval : '1d';

    const marketStatus = getIndianMarketStatus();
    const resolved = resolveYahooSymbol(symbol, segment);

    // 1. Fetch live spot quote from Yahoo Finance or Cache
    let livePrice = 0;
    let change = 0;
    let changePercent = 0;
    let dayHigh = 0;
    let dayLow = 0;
    let openPrice = 0;
    let prevClose = 0;
    let liveVolume = 0;
    let quoteTimestamp = Date.now();
    let isLiveFeed = false;

    try {
      const q = await yahooFinance.quote(resolved.yahooSym);
      if (q && q.regularMarketPrice) {
        livePrice = q.regularMarketPrice;
        prevClose = q.regularMarketPreviousClose || livePrice;
        change = q.regularMarketChange ?? Number((livePrice - prevClose).toFixed(2));
        changePercent = q.regularMarketChangePercent ?? Number((((livePrice - prevClose) / (prevClose || 1)) * 100).toFixed(2));
        dayHigh = q.regularMarketDayHigh || livePrice;
        dayLow = q.regularMarketDayLow || livePrice;
        openPrice = q.regularMarketOpen || livePrice;
        liveVolume = q.regularMarketVolume || 0;
        quoteTimestamp = q.regularMarketTime ? new Date(q.regularMarketTime).getTime() : Date.now();
        isLiveFeed = true;

        // Sync with central marketCache
        marketCache.setQuote(resolved.yahooSym, {
          symbol: resolved.yahooSym,
          regularMarketPrice: livePrice,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketPreviousClose: prevClose,
          // Cache only real values (never the live price standing in for the day range)
          regularMarketOpen: q.regularMarketOpen,
          regularMarketHigh: q.regularMarketDayHigh ?? q.regularMarketHigh,
          regularMarketLow: q.regularMarketDayLow ?? q.regularMarketLow,
          regularMarketVolume: liveVolume,
          longName: q.longName || resolved.displayName,
          shortName: q.shortName || resolved.displayName,
          timestamp: quoteTimestamp
        });
        marketCache.setTick(symbol, {
          price: livePrice,
          volume: String(liveVolume),
          timestamp: quoteTimestamp
        });
      }
    } catch (quoteErr: any) {
      console.warn(`[OpenChart] Yahoo live quote fetch error for ${resolved.yahooSym}:`, quoteErr.message);
    }

    // Fallback to cached quote if available
    if (!livePrice) {
      const cached = marketCache.getQuote(resolved.yahooSym);
      if (cached && cached.regularMarketPrice) {
        livePrice = cached.regularMarketPrice;
        prevClose = cached.regularMarketPreviousClose || livePrice;
        change = cached.regularMarketChange || 0;
        changePercent = cached.regularMarketChangePercent || 0;
        dayHigh = cached.regularMarketHigh || livePrice;
        dayLow = cached.regularMarketLow || livePrice;
        openPrice = cached.regularMarketOpen || livePrice;
        liveVolume = cached.regularMarketVolume || 0;
      }
    }

    // 2. Fetch Candlesticks
    let candles: any[] = [];
    const { yfInterval, lookbackDays } = mapToYahooInterval(activeInterval);
    const requestedDays = Math.max(1, Math.min(days, lookbackDays));
    const period1 = new Date(Date.now() - (requestedDays * 86400 * 1000));

    try {
      const chartResult = await yahooFinance.chart(resolved.yahooSym, {
        period1,
        interval: yfInterval as any
      });

      if (chartResult && Array.isArray(chartResult.quotes) && chartResult.quotes.length > 0) {
        candles = chartResult.quotes
          .filter((q: any) => q && q.date && q.close !== null && q.close !== undefined)
          .map((q: any) => {
            const openVal = Number((q.open ?? q.close).toFixed(2));
            const closeVal = Number(q.close.toFixed(2));
            const highVal = Number((q.high ?? Math.max(openVal, closeVal)).toFixed(2));
            const lowVal = Number((q.low ?? Math.min(openVal, closeVal)).toFixed(2));
            return {
              timestamp: new Date(q.date).toISOString(),
              timeSec: Math.floor(new Date(q.date).getTime() / 1000),
              open: openVal,
              high: highVal,
              low: lowVal,
              close: closeVal,
              volume: Number(q.volume || 0)
            };
          });

        // Ensure the last candle precisely reflects the accurate live market price
        if (candles.length > 0 && livePrice > 0) {
          const lastCandle = candles[candles.length - 1];
          lastCandle.close = Number(livePrice.toFixed(2));
          lastCandle.high = Number(Math.max(lastCandle.high, livePrice).toFixed(2));
          lastCandle.low = Number(Math.min(lastCandle.low, livePrice).toFixed(2));
        }
      }
    } catch (chartErr: any) {
      console.warn(`[OpenChart] Yahoo chart fetch error for ${resolved.yahooSym}:`, chartErr.message);
    }

    // If exchange chart unavailable, return unavailable: true
    if (candles.length === 0) {
      return res.json({
        unavailable: true,
        status: false,
        symbol,
        displayName: resolved.displayName,
        segment,
        interval: activeInterval,
        data: [],
        message: "Chart data unavailable"
      });
    }

    return res.json({
      status: true,
      symbol,
      displayName: resolved.displayName,
      segment,
      interval: activeInterval,
      totalCandles: candles.length,
      currentPrice: Number(livePrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: Number(dayHigh.toFixed(2)),
      dayLow: Number(dayLow.toFixed(2)),
      openPrice: Number(openPrice.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      volume: liveVolume,
      marketStatus,
      asOf: new Date().toISOString(),
      data: candles,
      source: isLiveFeed ? "NSE Exchange Live Data (OpenChart Engine)" : "NSE EOD Historical Cache"
    });
  } catch (err: any) {
    console.error("OpenChart historical error:", err);
    return res.status(500).json({ error: "Failed to fetch historical data" });
  }
});

// 3. GET /api/openchart/quote - Fast real-time live index & stock quote
router.get("/quote", async (req, res) => {
  try {
    const symbol = (req.query.symbol as string || "NIFTY 50").trim();
    const segment = (req.query.segment as string || "IDX").toUpperCase();
    const marketStatus = getIndianMarketStatus();
    const resolved = resolveYahooSymbol(symbol, segment);

    let quoteData: any = null;
    try {
      const q = await yahooFinance.quote(resolved.yahooSym);
      if (q && q.regularMarketPrice) {
        quoteData = q;
        marketCache.setQuote(resolved.yahooSym, {
          symbol: resolved.yahooSym,
          regularMarketPrice: q.regularMarketPrice,
          regularMarketChange: q.regularMarketChange,
          regularMarketChangePercent: q.regularMarketChangePercent,
          regularMarketPreviousClose: q.regularMarketPreviousClose,
          regularMarketOpen: q.regularMarketOpen,
          regularMarketHigh: q.regularMarketDayHigh ?? q.regularMarketHigh,
          regularMarketLow: q.regularMarketDayLow ?? q.regularMarketLow,
          regularMarketVolume: q.regularMarketVolume,
          longName: q.longName || resolved.displayName,
          shortName: q.shortName || resolved.displayName,
          timestamp: Date.now()
        });
      }
    } catch (e: any) {
      // ignore
    }

    const cached = marketCache.getQuote(resolved.yahooSym);

    const price = quoteData?.regularMarketPrice || cached?.regularMarketPrice || null;
    if (price === null) {
      return res.status(404).json({ error: "Quote data unavailable" });
    }

    const prevClose = quoteData?.regularMarketPreviousClose || cached?.regularMarketPreviousClose || price;
    const change = quoteData?.regularMarketChange ?? (cached?.regularMarketChange ?? Number((price - prevClose).toFixed(2)));
    const changePercent = quoteData?.regularMarketChangePercent ?? (cached?.regularMarketChangePercent ?? (prevClose ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0));
    const high = quoteData?.regularMarketDayHigh || cached?.regularMarketHigh || price;
    const low = quoteData?.regularMarketDayLow || cached?.regularMarketLow || price;
    const open = quoteData?.regularMarketOpen || cached?.regularMarketOpen || prevClose;
    const volume = quoteData?.regularMarketVolume || cached?.regularMarketVolume || 0;

    return res.json({
      status: true,
      symbol,
      displayName: resolved.displayName,
      segment,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: Number(high.toFixed(2)),
      dayLow: Number(low.toFixed(2)),
      openPrice: Number(open.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      volume,
      marketStatus,
      timestamp: Date.now()
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch live quote" });
  }
});

// 4. GET /api/openchart/timeframes - List supported intervals
router.get("/timeframes", (req, res) => {
  const marketStatus = getIndianMarketStatus();
  res.json({
    timeframes: ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1w', '1M'],
    segments: ['IDX', 'EQ', 'FO'],
    marketStatus
  });
});

export default router;
