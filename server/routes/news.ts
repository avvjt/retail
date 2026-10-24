import { Router } from "express";
import Parser from "rss-parser";
import { getRedisClient, isRedisAvailable } from "../cache/redisClient";

const router = Router();
const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; RetailX-FeedReader/1.0; +https://retailx.in)"
  }
});

// In-memory cache for news by filter category
const newsCache = new Map<string, { data: any[]; timestamp: number }>();
const NEWS_CACHE_TTL = 300000; // 5 minutes

interface FeedSource {
  name: string;
  url: string;
  category: string;
}

const FEEDS_CONFIG: Record<string, FeedSource[]> = {
  latest: [
    { name: "Economic Times", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", category: "Markets" },
    { name: "Moneycontrol", url: "https://www.moneycontrol.com/rss/marketreports.xml", category: "Markets" },
    { name: "LiveMint", url: "https://www.livemint.com/rss/markets", category: "Markets" },
    { name: "Business Standard", url: "https://www.business-standard.com/rss/markets-106.rss", category: "Markets" },
  ],
  trending: [
    { name: "LiveMint", url: "https://www.livemint.com/rss/markets", category: "Markets" },
    { name: "Economic Times", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", category: "Markets" },
    { name: "Business Standard", url: "https://www.business-standard.com/rss/home_page_top_stories.rss", category: "Top Stories" },
  ],
  crypto: [
    { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "Crypto" },
    { name: "CoinTelegraph", url: "https://cointelegraph.com/rss", category: "Crypto" },
  ],
  world: [
    { name: "LiveMint", url: "https://www.livemint.com/rss/news", category: "Global" },
    { name: "Business Standard", url: "https://www.business-standard.com/rss/international-116.rss", category: "World" },
    { name: "Economic Times", url: "https://economictimes.indiatimes.com/news/international/rssfeeds/2143429.cms", category: "World" },
  ]
};

async function fetchRssFeed(feed: FeedSource): Promise<any[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    if (!parsed || !Array.isArray(parsed.items)) return [];

    return parsed.items.map((item, idx) => {
      const rawDate = item.isoDate || item.pubDate;
      const pubDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
      const title = (item.title || "").trim();
      const link = (item.link || item.guid || "").trim();
      const summary = (item.contentSnippet || item.summary || item.content || "").replace(/<[^>]*>?/gm, '').trim();

      return {
        id: item.guid || link || `${feed.name}-${idx}-${Date.now()}`,
        title,
        headline: title,
        summary: summary.length > 300 ? `${summary.substring(0, 300)}...` : summary,
        publisher: feed.name,
        source: feed.name,
        time: pubDate,
        pubDate,
        url: link,
        link,
        category: feed.category
      };
    }).filter(item => item.title && item.url);
  } catch (err: any) {
    console.warn(`[News RSS] Failed to fetch feed ${feed.name} (${feed.url}):`, err.message);
    return [];
  }
}

async function fetchRealNews(filter: string): Promise<any[]> {
  const sources = FEEDS_CONFIG[filter] || FEEDS_CONFIG.latest;
  
  const results = await Promise.allSettled(sources.map(src => fetchRssFeed(src)));
  const allArticles: any[] = [];
  const seenLinks = new Set<string>();

  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      for (const item of res.value) {
        if (!seenLinks.has(item.url)) {
          seenLinks.add(item.url);
          allArticles.push(item);
        }
      }
    }
  }

  // Sort newest first
  allArticles.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return allArticles;
}

router.get("/", async (req: any, res: any) => {
  const filter = (req.query.filter || 'latest').toString().toLowerCase();
  
  try {
    const cached = newsCache.get(filter);
    if (cached && (Date.now() - cached.timestamp) < NEWS_CACHE_TTL && cached.data.length > 0) {
      return res.json(cached.data);
    }

    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        const stored = await redis.get(`market:news_feed:${filter}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            newsCache.set(filter, { data: parsed, timestamp: Date.now() });
            return res.json(parsed);
          }
        }
      } catch (err) {}
    }

    const items = await fetchRealNews(filter);
    
    if (items.length > 0) {
      newsCache.set(filter, { data: items, timestamp: Date.now() });
      if (redis && isRedisAvailable()) {
        redis.set(`market:news_feed:${filter}`, JSON.stringify(items), "EX", 300).catch(() => {});
      }
    }

    // On failure or empty, return []
    return res.json(items);
  } catch (error: any) {
    console.error("Error fetching news:", error);
    return res.json([]);
  }
});

export default router;
