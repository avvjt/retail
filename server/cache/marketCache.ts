import { getRedisClient, isRedisAvailable } from "./redisClient";

export interface MarketQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketHigh?: number;
  regularMarketLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume10Day?: number;
  averageDailyVolume3Month?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  trailingPE?: number;
  priceToBook?: number;
  longName?: string;
  shortName?: string;
  currency?: string;
  timestamp?: number;
}

export interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketCacheStore {
  // Fast in-memory tier (Level 1 cache)
  quotes: Map<string, MarketQuote> = new Map();
  ticks: Map<string, { price: number; volume: string; timestamp: number }> = new Map();
  overview: any = null;
  heatmap: any = null;
  scanner: any = null;
  news: Map<string, any[]> = new Map();
  charts: Map<string, { data: ChartDataPoint[]; timestamp: number }> = new Map();
  premarket: any = null;
  postmarket: any = null;
  alerts: any = null;

  constructor() {
    // Initialize Redis background sync if configured
    this.initRedis();
  }

  private async initRedis() {
    const redis = getRedisClient();
    if (!redis || !isRedisAvailable()) return;

    try {
      // Warm up in-memory cache from Redis if Redis already has persistent quotes/ticks
      const quoteKeys = await redis.keys("market:quote:*");
      if (quoteKeys.length > 0) {
        for (const key of quoteKeys) {
          const val = await redis.get(key);
          if (val) {
            try {
              const q: MarketQuote = JSON.parse(val);
              if (q && q.symbol) {
                this.quotes.set(q.symbol, q);
              }
            } catch (e) {}
          }
        }
      }

      const tickKeys = await redis.keys("market:tick:*");
      if (tickKeys.length > 0) {
        for (const key of tickKeys) {
          const val = await redis.get(key);
          if (val) {
            try {
              const t = JSON.parse(val);
              const symbol = key.replace("market:tick:", "");
              this.ticks.set(symbol, t);
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      // Non-blocking catch
    }
  }

  // --- Quote Methods ---
  getQuote(symbol: string): MarketQuote | null {
    return this.quotes.get(symbol) || null;
  }

  async getQuoteAsync(symbol: string): Promise<MarketQuote | null> {
    const memoryQuote = this.quotes.get(symbol);
    if (memoryQuote) return memoryQuote;

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        const val = await redis.get(`market:quote:${symbol}`);
        if (val) {
          const parsed = JSON.parse(val);
          this.quotes.set(symbol, parsed);
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  }

  setQuote(symbol: string, quote: MarketQuote): void {
    const updated = { ...quote, timestamp: Date.now() };
    this.quotes.set(symbol, updated);

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set(`market:quote:${symbol}`, JSON.stringify(updated), "EX", 3600).catch(() => {});
    }
  }

  setQuotes(quotes: MarketQuote[]): void {
    for (const q of quotes) {
      if (q && q.symbol) {
        this.setQuote(q.symbol, q);
      }
    }
  }

  getQuotes(symbols: string[]): MarketQuote[] {
    return symbols.map(s => this.getQuote(s)).filter((q): q is MarketQuote => Boolean(q));
  }

  // --- Tick Methods ---
  getTick(symbol: string): { price: number; volume: string; timestamp: number } | null {
    return this.ticks.get(symbol) || null;
  }

  async getTickAsync(symbol: string): Promise<{ price: number; volume: string; timestamp: number } | null> {
    const mem = this.ticks.get(symbol);
    if (mem) return mem;

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        const val = await redis.get(`market:tick:${symbol}`);
        if (val) {
          const parsed = JSON.parse(val);
          this.ticks.set(symbol, parsed);
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  }

  setTick(symbol: string, tick: { price: number; volume: string; timestamp: number }): void {
    this.ticks.set(symbol, tick);

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set(`market:tick:${symbol}`, JSON.stringify(tick), "EX", 86400).catch(() => {});
    }
  }

  // --- Chart Methods ---
  getChart(symbol: string, interval = "5m", range = "1d"): ChartDataPoint[] | null {
    const key = `${symbol}:${interval}:${range}`;
    const entry = this.charts.get(key);
    if (entry) return entry.data;
    return null;
  }

  async getChartAsync(symbol: string, interval = "5m", range = "1d"): Promise<ChartDataPoint[] | null> {
    const mem = this.getChart(symbol, interval, range);
    if (mem) return mem;

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        const val = await redis.get(`market:chart:${symbol}:${interval}:${range}`);
        if (val) {
          const data: ChartDataPoint[] = JSON.parse(val);
          this.charts.set(`${symbol}:${interval}:${range}`, { data, timestamp: Date.now() });
          return data;
        }
      } catch (e) {}
    }
    return null;
  }

  setChart(symbol: string, interval: string, range: string, data: ChartDataPoint[]): void {
    const key = `${symbol}:${interval}:${range}`;
    this.charts.set(key, { data, timestamp: Date.now() });

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set(`market:chart:${key}`, JSON.stringify(data), "EX", 300).catch(() => {});
    }
  }

  // --- News Methods ---
  getNews(symbol: string): any[] | null {
    return this.news.get(symbol) || null;
  }

  setNews(symbol: string, news: any[]): void {
    this.news.set(symbol, news);

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set(`market:news:${symbol}`, JSON.stringify(news), "EX", 1800).catch(() => {});
    }
  }

  // --- AI Analysis & Alerts (Redis Cache Sync) ---
  setPremarket(data: any): void {
    this.premarket = data;
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set("market:premarket", JSON.stringify(data), "EX", 1800).catch(() => {});
    }
  }

  setPostmarket(data: any): void {
    this.postmarket = data;
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set("market:postmarket", JSON.stringify(data), "EX", 1800).catch(() => {});
    }
  }

  setAlerts(data: any): void {
    this.alerts = data;
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      redis.set("market:alerts", JSON.stringify(data), "EX", 300).catch(() => {});
    }
  }
}

export const marketCache = new MarketCacheStore();
export { getRedisClient, isRedisAvailable };
