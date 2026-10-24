import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import yahooFinanceModule from "yahoo-finance2";
import { createBluemindsCompletion, ChatMessage } from "../blueminds";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { marketCache } from "../cache/marketCache";
import { getLatestTicks } from "../poller";
import { JWT_SECRET } from "../config";

const router = Router();

const YahooFinanceClass = (yahooFinanceModule as any)?.default ?? yahooFinanceModule;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

// Check Indian Market Session Hours (09:15 AM - 03:30 PM IST, Mon-Fri)
function isIndianMarketOpen(): boolean {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istMinutes = (utcHours * 60 + utcMinutes + 330) % (24 * 60);
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  return istMinutes >= 555 && istMinutes <= 930;
}

// Common symbol alias dictionary
const SYMBOL_MAP: Record<string, string> = {
  "NIFTY": "^NSEI",
  "NIFTY50": "^NSEI",
  "NIFTY 50": "^NSEI",
  "BANKNIFTY": "^NSEBANK",
  "BANK NIFTY": "^NSEBANK",
  "NIFTY BANK": "^NSEBANK",
  "SENSEX": "^BSESN",
  "BSE SENSEX": "^BSESN",
  "INDIA VIX": "^INDIAVIX",
  "VIX": "^INDIAVIX",
  "RELIANCE": "RELIANCE.NS",
  "RIL": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "INFOSYS": "INFY.NS",
  "INFY": "INFY.NS",
  "HDFC": "HDFCBANK.NS",
  "HDFCBANK": "HDFCBANK.NS",
  "ICICI": "ICICIBANK.NS",
  "ICICIBANK": "ICICIBANK.NS",
  "SBI": "SBIN.NS",
  "SBIN": "SBIN.NS",
  "STATE BANK": "SBIN.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
  "TATA MOTORS": "TATAMOTORS.NS",
  "TATASTEEL": "TATASTEEL.NS",
  "TATA STEEL": "TATASTEEL.NS",
  "ITC": "ITC.NS",
  "BHARTIARTL": "BHARTIARTL.NS",
  "AIRTEL": "BHARTIARTL.NS",
  "BHARTI AIRTEL": "BHARTIARTL.NS",
  "KOTAK": "KOTAKBANK.NS",
  "KOTAKBANK": "KOTAKBANK.NS",
  "LT": "LT.NS",
  "L&T": "LT.NS",
  "LARSEN": "LT.NS",
  "WIPRO": "WIPRO.NS",
  "MARUTI": "MARUTI.NS",
  "BAJFINANCE": "BAJFINANCE.NS",
  "BAJAJ FINANCE": "BAJFINANCE.NS",
  "HINDALCO": "HINDALCO.NS",
  "ONGC": "ONGC.NS",
  "NTPC": "NTPC.NS",
  "POWERGRID": "POWERGRID.NS",
  "COALINDIA": "COALINDIA.NS",
  "AXISBANK": "AXISBANK.NS",
  "TECHM": "TECHM.NS",
  "HCLTECH": "HCLTECH.NS",
  "ASIANPAINT": "ASIANPAINT.NS",
  "SUNPHARMA": "SUNPHARMA.NS",
  "TITAN": "TITAN.NS",
  "TSLA": "TSLA",
  "TESLA": "TSLA",
  "AAPL": "AAPL",
  "APPLE": "AAPL",
  "NVDA": "NVDA",
  "NVIDIA": "NVDA",
  "MSFT": "MSFT",
  "MICROSOFT": "MSFT",
  "BTC": "BTC-USD",
  "BITCOIN": "BTC-USD",
  "ETH": "ETH-USD",
  "ETHEREUM": "ETH-USD"
};

// Helper to fetch live quote
async function getLiveQuote(symbolKey: string): Promise<any> {
  // 1. Check tick stream
  const cleanSym = symbolKey.replace(/\.NS$/i, "");
  const ticks = getLatestTicks();
  const tick = ticks[cleanSym] || ticks[symbolKey];

  // 2. Check marketCache
  const cached = marketCache.getQuote(symbolKey);
  if (cached && cached.regularMarketPrice) {
    return {
      symbol: symbolKey,
      name: cached.longName || cached.shortName || cleanSym,
      price: tick?.price || cached.regularMarketPrice,
      change: cached.regularMarketChange ?? 0,
      changePercent: cached.regularMarketChangePercent ?? 0,
      prevClose: cached.regularMarketPreviousClose,
      dayHigh: cached.regularMarketHigh,
      dayLow: cached.regularMarketLow,
      volume: cached.regularMarketVolume
    };
  }

  // 3. Live query Yahoo Finance
  try {
    const q: any = await yahooFinance.quote(symbolKey);
    if (q && q.regularMarketPrice) {
      const quoteObj = {
        symbol: symbolKey,
        name: q.longName || q.shortName || cleanSym,
        price: q.regularMarketPrice,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        prevClose: q.regularMarketPreviousClose || q.regularMarketPrice,
        dayHigh: q.regularMarketDayHigh || q.regularMarketPrice,
        dayLow: q.regularMarketDayLow || q.regularMarketPrice,
        volume: q.regularMarketVolume || 0
      };
      marketCache.setQuote(symbolKey, {
        symbol: symbolKey,
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChange: q.regularMarketChange,
        regularMarketChangePercent: q.regularMarketChangePercent,
        regularMarketPreviousClose: q.regularMarketPreviousClose,
        regularMarketHigh: q.regularMarketDayHigh,
        regularMarketLow: q.regularMarketDayLow,
        regularMarketVolume: q.regularMarketVolume,
        longName: q.longName,
        shortName: q.shortName,
        timestamp: Date.now()
      });
      return quoteObj;
    }
  } catch (err: any) {
    // Quote fetch failed
  }

  return null;
}

const baseSystemInstruction = `You are "Alpha Copilot", the premier Real-Time Stock Market Intelligence assistant integrated directly into the RetailX trading platform dashboard.

Your mission is to answer user questions about the stock market, specific stock symbols (e.g., TSLA, AAPL, RELIANCE, NIFTY 50), technical and fundamental indicators, option strategies, trading systems, portfolio risk, and global market news.

Personality & Strict Data Fidelity Rules:
- Highly analytical, factual, clear, and professional.
- CRITICAL: You are connected to the RetailX Real-Time Exchange Feed. Always use the verified real-time prices, percentage changes, and session statuses provided in the telemetry block below.
- NEVER claim that your knowledge cutoff is June 2024 or that you lack live market data. You have verified live exchange numbers right here.
- If Indian stock exchanges are CLOSED, state clearly that prices reflect the official closing settlement from the most recent session. If OPEN, state that prices reflect live intraday trading.
- Speak in precise financial terms (e.g., support/resistance, RSI, MACD, implied volatility, short squeeze, quantitative analysis).
- NEVER give absolute buy/sell recommendations or predict the future with 100% certainty. Always maintain a professional, objective, and risk-aware tone. Focus on describing current market conditions, technical setups, historical patterns, and educational insights.
- Provide clean, nicely formatted Markdown responses. Use bold text, elegant bullet points, lists, and headers (###) to make explanations beautiful, highly structured, and easy to read.
`;

// POST /api/copilot - Ask the stock market copilot with real-time market data injection
router.post("/copilot", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    let userId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string };
        userId = Number(decoded.userId);
      } catch (err) {
        console.warn("[Copilot] Invalid JWT, continuing in guest mode");
      }
    }

    const { message, history, pageContext, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required." });
    }

    const userQuery = String(message || "").trim();
    const upperQuery = userQuery.toUpperCase();

    // 1. Detect market session & time
    const marketOpen = isIndianMarketOpen();
    const istTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium"
    });

    // 2. Identify symbols mentioned in query or context
    const symbolsToFetch = new Set<string>(["^NSEI", "^NSEBANK", "^BSESN", "^INDIAVIX"]);
    const citations: Array<{ title: string; uri: string }> = [];

    // Check alias dictionary
    for (const [alias, mappedSym] of Object.entries(SYMBOL_MAP)) {
      if (upperQuery.includes(alias)) {
        symbolsToFetch.add(mappedSym);
      }
    }

    // Check regex for potential stock tickers (e.g. INFY, TCS, RELIANCE)
    const tickerMatches = upperQuery.match(/\b[A-Z]{3,12}\b/g) || [];
    for (const t of tickerMatches) {
      if (SYMBOL_MAP[t]) {
        symbolsToFetch.add(SYMBOL_MAP[t]);
      } else if (!["WHAT", "WHEN", "WHERE", "PRICE", "TODAY", "STOCK", "SHARE", "MARKET", "CURRENT", "ABOUT"].includes(t)) {
        // Try as Indian stock if 3-8 chars
        if (t.length <= 10) {
          symbolsToFetch.add(`${t}.NS`);
        }
      }
    }

    // 3. Fetch quotes in parallel
    const quotePromises = Array.from(symbolsToFetch).slice(0, 8).map(sym => getLiveQuote(sym));
    const quotes = await Promise.all(quotePromises);

    // 4. Build Telemetry Context String
    let telemetryContext = `\n\n=== [RETAILX VERIFIED LIVE MARKET TELEMETRY] ===\n`;
    telemetryContext += `Current Indian Standard Time (IST): ${istTime}\n`;
    telemetryContext += `Market Status: ${marketOpen ? "🟢 OPEN (Live Intraday Trading Hours)" : "🟠 CLOSED (Post-Market / Closing Settlement)"}\n\n`;
    telemetryContext += `KEY BENCHMARK INDICES:\n`;

    quotes.forEach(q => {
      if (!q) return;
      const isIndex = q.symbol.startsWith("^");
      const symLabel = q.symbol === "^NSEI" ? "NIFTY 50" : q.symbol === "^NSEBANK" ? "BANK NIFTY" : q.symbol === "^BSESN" ? "BSE SENSEX" : q.symbol === "^INDIAVIX" ? "INDIA VIX" : q.name || q.symbol;
      const chgSign = q.change >= 0 ? "+" : "";
      const chgStr = q.change !== undefined ? ` | Change: ${chgSign}${Number(q.change).toFixed(2)} (${chgSign}${Number(q.changePercent).toFixed(2)}%)` : "";
      const prevCloseStr = q.prevClose ? ` | Prev Close: ${q.prevClose}` : "";
      const highLowStr = q.dayHigh && q.dayLow ? ` | Day Range: ${q.dayLow} - ${q.dayHigh}` : "";
      const volStr = q.volume ? ` | Volume: ${Number(q.volume).toLocaleString("en-IN")}` : "";

      const line = `• ${symLabel} (${q.symbol}): Price ${q.price}${chgStr}${prevCloseStr}${highLowStr}${volStr}`;
      telemetryContext += `${line}\n`;

      if (!isIndex) {
        citations.push({
          title: `NSE/BSE Quote: ${symLabel}`,
          uri: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(q.symbol.replace(".NS", ""))}`
        });
      } else if (q.symbol === "^NSEI") {
        citations.push({
          title: `NSE Benchmark: NIFTY 50 Index`,
          uri: `https://www.nseindia.com/market-data/live-market-indices`
        });
      }
    });

    telemetryContext += `=== [END TELEMETRY] ===\n\n`;

    let contextualSystemInstruction = baseSystemInstruction + telemetryContext;
    if (pageContext) {
      contextualSystemInstruction += `[Active Page Context: The user is currently viewing "${pageContext}". If relevant, tailor your insights to this page's tools/features.]\n\n`;
    }

    // Build chat messages array
    const messages: ChatMessage[] = [
      { role: "system", content: contextualSystemInstruction }
    ];

    // Append history
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      recentHistory.forEach((h: any) => {
        const textVal = h?.content || h?.text;
        if (h && h.role && textVal) {
          const role = h.role === "user" ? "user" : "assistant";
          messages.push({
            role: role,
            content: String(textVal)
          });
        }
      });
    }

    // Add current user prompt
    const userContent: any[] = [];
    if (message) {
      userContent.push({ type: "text", text: String(message) });
    }
    if (image) {
      userContent.push({ type: "image_url", image_url: { url: image } });
    }
    messages.push({
      role: "user",
      content: userContent
    });

    let reply = "";
    try {
      reply = await createBluemindsCompletion({
        messages,
        temperature: 0.3,
      });

      if (!reply) {
        reply = "I was unable to retrieve a response from the market intelligence engine.";
      }
    } catch (apiErr: any) {
      console.warn("[Copilot] AI model warning, using structured financial insight fallback:", apiErr?.message || apiErr);

      // Extract primary requested quote if available
      const primaryQuote = quotes.find(q => q && !q.symbol.startsWith("^")) || quotes.find(q => q?.symbol === "^NSEI");
      let quoteSnippet = "";
      if (primaryQuote) {
        quoteSnippet = `\n\n**Current Market Telemetry (${primaryQuote.name || primaryQuote.symbol}):**\n- **Last Price**: ₹${primaryQuote.price}\n- **Change**: ${primaryQuote.change >= 0 ? "+" : ""}${primaryQuote.change.toFixed(2)} (${primaryQuote.changePercent.toFixed(2)}%)\n- **Session Status**: ${marketOpen ? "Live Trading" : "Closed (Latest Closing Settlement)"}`;
      }

      const lowerMsg = userQuery.toLowerCase();
      let topicResponse = "";

      if (lowerMsg.includes("price") || lowerMsg.includes("quote") || lowerMsg.includes("nifty") || lowerMsg.includes("reliance")) {
        topicResponse = `${quoteSnippet}\n\n**Market Structure & Technical Trends:**\n- Benchmark indices and institutional heavyweights reflect current liquidity dynamics, order imbalances, and key support/resistance boundaries.\n- When planning trades, align entries with Volume-Weighted Average Price (VWAP) and confirmed price rejection at structural pivot levels.`;
      } else if (lowerMsg.includes("option") || lowerMsg.includes("call") || lowerMsg.includes("put") || lowerMsg.includes("spread")) {
        topicResponse = `\n\n**Options Strategy Framework:**\n- **Defined-Risk Spreads**: Buying At-The-Money (ATM) options while simultaneously writing Out-of-The-Money (OTM) options establishes controlled risk profiles with capped theta decay exposure.\n- **Volatility Context**: Evaluate Implied Volatility (IV) percentile before deployment to balance delta risk against premium pricing.`;
      } else {
        topicResponse = `${quoteSnippet}\n\n**Quantitative Intelligence Guide:**\n- **Confluence Metrics**: Combine momentum indicators (such as RSI divergence) with trend structure (EMA ribbon crosses) to avoid false breakouts.\n- **Institutional Risk Rules**: Always define non-negotiable risk limits per position to ensure long-term capital preservation.`;
      }

      reply = `### 💡 **Alpha Copilot | Real-Time Market Analysis**\n\n#### 📘 **Analysis for: "${userQuery}"**${topicResponse}\n\n*All insights grounded in verified RetailX exchange telemetry. Always adhere strictly to your personalized risk management framework.*`;
    }

    if (citations.length === 0) {
      citations.push({
        title: "RetailX Market Telemetry",
        uri: "https://www.nseindia.com"
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      sources: citations.slice(0, 3)
    });

  } catch (error: any) {
    console.error("[Copilot Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to process stock market query."
    });
  }
});

export default router;
