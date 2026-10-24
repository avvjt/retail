import { Router } from "express";
import { marketCache } from "../cache/marketCache";
import { getRedisClient, isRedisAvailable } from "../cache/redisClient";
import yahooFinanceModule from "yahoo-finance2";

const YahooFinanceClass = (yahooFinanceModule as any)?.default ?? yahooFinanceModule;
const yahooFinance = new YahooFinanceClass();

const router = Router();

export const GLOBAL_INDICES = [
  { symbol: "^NSEI", tdSymbol: "NIFTY", name: "GIFT NIFTY", flag: "🇮🇳" },
  { symbol: "^HSI", tdSymbol: "HSI", name: "Hang Seng", flag: "🇭🇰" },
  { symbol: "^FTSE", tdSymbol: "FTSE", name: "FTSE 100", flag: "🇬🇧" },
  { symbol: "YM=F", tdSymbol: "DJI", name: "Dow Jones Futures", flag: "🇺🇸" },
  { symbol: "^JKSE", tdSymbol: "JCI", name: "Jakarta Composite", flag: "🇮🇩" },
  { symbol: "^STI", tdSymbol: "STI", name: "Straits Times", flag: "🇸🇬" },
  { symbol: "^SET.BK", tdSymbol: "SET", name: "SET Composite", flag: "🇹🇭" },
  { symbol: "^GSPC", tdSymbol: "SPX", name: "S&P 500", flag: "🇺🇸" },
  { symbol: "^GDAXI", tdSymbol: "DAX", name: "DAX", flag: "🇩🇪" },
  { symbol: "^FCHI", tdSymbol: "CAC", name: "CAC 40", flag: "🇫🇷" },
  { symbol: "^IXIC", tdSymbol: "IXIC", name: "Nasdaq", flag: "🇺🇸" },
  { symbol: "^TWII", tdSymbol: "TWII", name: "Taiwan Weighted", flag: "🇹🇼" },
  { symbol: "000001.SS", tdSymbol: "SHCOMP", name: "Shanghai Composite", flag: "🇨🇳" },
  { symbol: "^N225", tdSymbol: "N225", name: "Nikkei 225", flag: "🇯🇵" },
  { symbol: "^KS11", tdSymbol: "KOSPI", name: "KOSPI", flag: "🇰🇷" }
];

let cachedIndices: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 15000; // 15 seconds fast fresh cache

async function fetchLiveGlobalIndices(): Promise<any[]> {
  const symbols = GLOBAL_INDICES.map(i => i.symbol);
  const now = Date.now();
  
  let fetchedQuotes: any[] = [];
  try {
    const rawQuotes = await yahooFinance.quote(symbols);
    if (Array.isArray(rawQuotes) && rawQuotes.length > 0) {
      fetchedQuotes = rawQuotes;
    }
  } catch (err: any) {
    // Yahoo Finance may be throttled or blocked in cloud hosting
  }

  const quoteMap = new Map(fetchedQuotes.map(q => [q?.symbol, q]));

  return GLOBAL_INDICES.map((idx) => {
    const liveQ = quoteMap.get(idx.symbol);
    const cachedQ = marketCache.getQuote(idx.symbol);

    const price = liveQ?.regularMarketPrice ?? cachedQ?.regularMarketPrice ?? null;
    const change = liveQ?.regularMarketChange ?? cachedQ?.regularMarketChange ?? null;
    const changePercent = liveQ?.regularMarketChangePercent ?? cachedQ?.regularMarketChangePercent ?? null;

    if (liveQ) {
      marketCache.setQuote(idx.symbol, {
        symbol: idx.symbol,
        regularMarketPrice: liveQ.regularMarketPrice,
        regularMarketChange: liveQ.regularMarketChange,
        regularMarketChangePercent: liveQ.regularMarketChangePercent,
        timestamp: now
      });
    }

    return {
      symbol: idx.symbol,
      name: idx.name,
      flag: idx.flag,
      price: price !== null ? Number(price.toFixed(2)) : null,
      change: change !== null ? Number(change.toFixed(2)) : null,
      changePercent: changePercent !== null ? Number(changePercent.toFixed(2)) : null,
      timestamp: new Date().toISOString(),
      delayed: false
    };
  });
}

router.get("/", async (req: any, res: any) => {
  try {
    const now = Date.now();
    if (cachedIndices && (now - lastFetchTime) < CACHE_DURATION_MS) {
       return res.json(cachedIndices);
    }

    const indices = await fetchLiveGlobalIndices();
    cachedIndices = indices;
    lastFetchTime = now;

    // Async save to Redis
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set("market:global_indices", JSON.stringify(indices), "EX", 30).catch(() => {});
    }
    
    return res.json(indices);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
