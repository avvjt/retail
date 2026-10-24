import { Router, Response } from "express";
import { db } from "../db";
import { scannerConfigs, scannerResults, users } from "../schema";
import { eq, desc, and } from "drizzle-orm";
import { createBluemindsCompletion } from "../blueminds";
import { marketCache } from "../cache/marketCache";
import yahooFinanceModule from "yahoo-finance2";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const YahooFinanceClass = (yahooFinanceModule as any)?.default ?? yahooFinanceModule;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

const router = Router();
router.use(authenticateJWT);

// GET all configs
router.get("/configs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId; 
    const configs = await db.select().from(scannerConfigs).where(eq(scannerConfigs.userId, userId));
    res.json(configs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE config
router.post("/configs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, filterRules, riskLimits, scheduleCron } = req.body;
    const result = await db.insert(scannerConfigs).values({
      userId,
      name,
      filterRules,
      riskLimits,
      scheduleCron
    }).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Real-time live quote fetcher for symbols using Yahoo Finance and marketCache
const quoteCache = new Map<string, { data: any; time: number }>();
const CACHE_TTL = 15000; // 15 seconds fresh cache

async function getLiveQuotes(symbols: string[]) {
  const results: Record<string, any> = {};
  const missingSymbols: string[] = [];
  const now = Date.now();
  
  for (const sym of symbols) {
    const cached = quoteCache.get(sym);
    if (cached && (now - cached.time) < CACHE_TTL) {
      results[sym] = cached.data;
    } else {
      missingSymbols.push(sym);
    }
  }

  if (missingSymbols.length > 0) {
    try {
      const yfQuotes = await yahooFinance.quote(missingSymbols);
      const quotesList = Array.isArray(yfQuotes) ? yfQuotes : (yfQuotes ? [yfQuotes] : []);
      
      for (const yq of quotesList) {
        if (!yq || !yq.symbol) continue;
        const sym = yq.symbol;
        const rawPrice = yq.regularMarketPrice ?? yq.regularMarketPreviousClose;
        const dayHigh = yq.regularMarketDayHigh || yq.regularMarketHigh;
        const dayLow = yq.regularMarketDayLow || yq.regularMarketLow;
        const volume = yq.regularMarketVolume;
        const fiftyDayAvg = yq.fiftyDayAverage;
        const twoHundredDayAvg = yq.twoHundredDayAverage;
        const fiftyTwoWeekHigh = yq.fiftyTwoWeekHigh;
        const fiftyTwoWeekLow = yq.fiftyTwoWeekLow;

        // Skip if any required quote field is missing
        if (
          rawPrice === undefined || rawPrice === null ||
          yq.regularMarketPreviousClose === undefined || yq.regularMarketPreviousClose === null ||
          dayHigh === undefined || dayHigh === null ||
          dayLow === undefined || dayLow === null ||
          volume === undefined || volume === null ||
          fiftyDayAvg === undefined || fiftyDayAvg === null ||
          twoHundredDayAvg === undefined || twoHundredDayAvg === null ||
          fiftyTwoWeekHigh === undefined || fiftyTwoWeekHigh === null ||
          fiftyTwoWeekLow === undefined || fiftyTwoWeekLow === null
        ) {
          continue;
        }

        const price = Number(rawPrice.toFixed(2));
        const prevClose = Number(yq.regularMarketPreviousClose.toFixed(2));
        const change = Number((yq.regularMarketChange ?? (price - prevClose)).toFixed(2));
        const changePct = Number((yq.regularMarketChangePercent ?? (prevClose > 0 ? ((change / prevClose) * 100) : 0)).toFixed(2));
        const avgVol = yq.averageDailyVolume10Day || yq.averageDailyVolume3Month || null;
        const rvol = avgVol && avgVol > 0 ? Number((volume / avgVol).toFixed(2)) : null;
        const name = yq.shortName || yq.longName || sym;
        const currency = yq.currency || (sym.includes("-USD") || sym.startsWith("^G") || sym.startsWith("^I") ? "USD" : "INR");

        const data = {
          symbol: sym,
          name,
          price,
          prevClose,
          change,
          changePct,
          dayHigh: Number(dayHigh.toFixed(2)),
          dayLow: Number(dayLow.toFixed(2)),
          volume,
          avgVol,
          rvol,
          fiftyDayAvg: Number(fiftyDayAvg.toFixed(2)),
          twoHundredDayAvg: Number(twoHundredDayAvg.toFixed(2)),
          fiftyTwoWeekHigh: Number(fiftyTwoWeekHigh.toFixed(2)),
          fiftyTwoWeekLow: Number(fiftyTwoWeekLow.toFixed(2)),
          currency,
          timestamp: now
        };

        results[sym] = data;
        quoteCache.set(sym, { data, time: now });
      }
    } catch (err: any) {
      console.warn("❌ [Scanner YF Fetch Error]:", err?.message || err);
    }
  }

  // Populate from marketCache if real quote exists with all required fields
  for (const sym of symbols) {
    if (!results[sym]) {
      const q: any = marketCache.getQuote(sym);
      if (
        q && 
        q.regularMarketPrice !== undefined &&
        q.regularMarketPreviousClose !== undefined && q.regularMarketPreviousClose !== null &&
        (q.regularMarketHigh !== undefined || q.dayHigh !== undefined) &&
        (q.regularMarketLow !== undefined || q.dayLow !== undefined) &&
        q.regularMarketVolume !== undefined &&
        q.fiftyDayAverage !== undefined &&
        q.twoHundredDayAverage !== undefined &&
        q.fiftyTwoWeekHigh !== undefined &&
        q.fiftyTwoWeekLow !== undefined
      ) {
        const price = Number(q.regularMarketPrice.toFixed(2));
        const prevClose = Number(q.regularMarketPreviousClose.toFixed(2));
        const changePct = Number((q.regularMarketChangePercent ?? ((price - prevClose) / prevClose) * 100).toFixed(2));
        const change = Number((q.regularMarketChange ?? (price - prevClose)).toFixed(2));
        const dayHigh = Number((q.regularMarketHigh || q.dayHigh).toFixed(2));
        const dayLow = Number((q.regularMarketLow || q.dayLow).toFixed(2));
        const volume = q.regularMarketVolume;
        const avgVol = q.averageDailyVolume10Day || q.averageDailyVolume3Month || null;
        const rvol = avgVol && avgVol > 0 ? Number((volume / avgVol).toFixed(2)) : null;
        const currency = sym.includes("-USD") || sym.startsWith("^G") ? "USD" : "INR";

        const data = {
          symbol: sym,
          name: q.shortName || q.longName || sym,
          price,
          prevClose,
          change,
          changePct,
          dayHigh,
          dayLow,
          volume,
          avgVol,
          rvol,
          fiftyDayAvg: Number(q.fiftyDayAverage.toFixed(2)),
          twoHundredDayAvg: Number(q.twoHundredDayAverage.toFixed(2)),
          fiftyTwoWeekHigh: Number(q.fiftyTwoWeekHigh.toFixed(2)),
          fiftyTwoWeekLow: Number(q.fiftyTwoWeekLow.toFixed(2)),
          currency,
          timestamp: now
        };

        results[sym] = data;
        quoteCache.set(sym, { data, time: now });
      }
    }
  }

  return results;
}

// Compute live quantitative multi-factor ratings and institutional research
function computeQuantitativeAnalysis(q: any) {
  const { price, changePct, dayHigh, dayLow, rvol, fiftyDayAvg, twoHundredDayAvg, fiftyTwoWeekHigh, currency, symbol, name } = q;
  const currSym = currency === "USD" ? "$" : "₹";

  // 1. Trend (1-10): Position relative to moving averages and 52w high
  let trend = 5;
  if (price >= fiftyDayAvg) trend += 2;
  if (price >= twoHundredDayAvg) trend += 1;
  if (fiftyDayAvg >= twoHundredDayAvg) trend += 1;
  if (price >= fiftyTwoWeekHigh * 0.95) trend += 1;
  if (changePct >= 1.5) trend += 1;
  else if (changePct <= -1.5) trend -= 2;
  else if (changePct < 0) trend -= 1;
  trend = Math.min(10, Math.max(2, trend));

  // 2. Volume (1-10): Relative volume expansion ratio (null if rvol is null)
  let volumeScore: number | null = null;
  if (rvol !== null && rvol !== undefined) {
    if (rvol >= 2.2) volumeScore = 10;
    else if (rvol >= 1.6) volumeScore = 9;
    else if (rvol >= 1.25) volumeScore = 8;
    else if (rvol >= 0.95) volumeScore = 7;
    else if (rvol >= 0.7) volumeScore = 6;
    else volumeScore = 4;
  }

  // 3. Catalyst (1-10): Momentum, day range volatility, and breakout strength
  const rangePct = Math.abs(dayHigh - dayLow) / (price || 1) * 100;
  let catalyst = 5;
  if (Math.abs(changePct) >= 2.5 || rangePct >= 3.5) catalyst = 9;
  else if (Math.abs(changePct) >= 1.5 || rangePct >= 2.2) catalyst = 8;
  else if (Math.abs(changePct) >= 0.75 || rangePct >= 1.4) catalyst = 7;
  else if (Math.abs(changePct) >= 0.3) catalyst = 6;
  else catalyst = 5;
  if (rvol !== null && rvol !== undefined && rvol > 1.5 && Math.abs(changePct) > 1.0) catalyst = Math.min(10, catalyst + 1);

  // 4. Support and Resistance based purely on real fields (dayHigh, dayLow, fiftyDayAvg, fiftyTwoWeekHigh)
  const supportCandidates = [
    dayLow <= price ? dayLow : null,
    fiftyDayAvg > 0 && fiftyDayAvg <= price ? fiftyDayAvg : null
  ].filter((v): v is number => v !== null && v !== undefined && v > 0);

  const support = supportCandidates.length > 0 ? Math.min(...supportCandidates) : (dayLow > 0 ? dayLow : null);

  const resistanceCandidates = [
    dayHigh > price ? dayHigh : null,
    fiftyTwoWeekHigh > price ? fiftyTwoWeekHigh : null,
    fiftyDayAvg > price ? fiftyDayAvg : null
  ].filter((v): v is number => v !== null && v !== undefined && v > 0);

  const resistance = resistanceCandidates.length > 0 ? Math.min(...resistanceCandidates) : null;

  // Risk / Reward (1-10)
  let rr: number | null = null;
  if (support !== null && price > support && resistance !== null && resistance > price) {
    const downside = price - support;
    const upside = resistance - price;
    const rrRatio = upside / (downside || 1);
    if (rrRatio >= 2.8) rr = 10;
    else if (rrRatio >= 2.2) rr = 9;
    else if (rrRatio >= 1.7) rr = 8;
    else if (rrRatio >= 1.2) rr = 7;
    else if (rrRatio >= 0.8) rr = 5;
    else rr = 4;
  }

  // 5. Cleanliness / Liquidity Structure (1-10) based only on real avgVol
  let cleanliness: number | null = null;
  if (q.avgVol !== null && q.avgVol !== undefined && q.avgVol > 0) {
    if (q.avgVol >= 5000000) cleanliness = 9;
    else if (q.avgVol >= 1000000) cleanliness = 8;
    else if (q.avgVol >= 250000) cleanliness = 7;
    else cleanliness = 6;
  }

  // Total Score: averaged only over non-null factors
  const factors: { val: number | null; weight: number }[] = [
    { val: trend, weight: 0.25 },
    { val: volumeScore, weight: 0.25 },
    { val: catalyst, weight: 0.20 },
    { val: rr, weight: 0.15 },
    { val: cleanliness, weight: 0.15 },
  ];

  const activeFactors = factors.filter((f): f is { val: number; weight: number } => f.val !== null && f.val !== undefined);
  const totalWeight = activeFactors.reduce((sum, f) => sum + f.weight, 0);
  const totalScore = Math.round(
    activeFactors.reduce((sum, f) => sum + f.val * f.weight, 0) / totalWeight
  );

  // Classify Setup Type
  let setupType = "Constructive Trend Continuation";
  if (rvol !== null && rvol !== undefined && rvol >= 1.3 && changePct >= 0.8) {
    setupType = "High-Volume Momentum Breakout";
  } else if (price >= fiftyTwoWeekHigh * 0.97) {
    setupType = "52-Week High Breakout Contender";
  } else if (price >= fiftyDayAvg && rvol !== null && rvol !== undefined && rvol < 0.9 && Math.abs(changePct) < 0.6) {
    setupType = "Low-Volatility Pullback Compression";
  } else if (changePct <= -1.2 && rvol !== null && rvol !== undefined && rvol >= 1.2) {
    setupType = "Institutional Supply Breakdown";
  } else if (price <= dayLow * 1.008 && changePct < -0.6) {
    setupType = "Demand Zone Support Reversal Test";
  } else if (changePct >= 1.8) {
    setupType = "Positive Trend Surge";
  }

  // Synthesize rich, distinct factual research notes
  const changeFormatted = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
  const priceFormatted = `${currSym}${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const highFormatted = `${currSym}${dayHigh.toFixed(2)}`;
  const lowFormatted = `${currSym}${dayLow.toFixed(2)}`;
  const supportFormatted = support !== null ? `${currSym}${support.toFixed(2)}` : null;
  const resistanceFormatted = resistance !== null ? `${currSym}${resistance.toFixed(2)}` : null;
  const fiftyAvgFormatted = `${currSym}${fiftyDayAvg.toFixed(2)}`;
  const rvolSegment = rvol !== null && rvol !== undefined ? ` with RVOL of ${rvol}x` : '';

  let levelsText = '';
  if (supportFormatted && resistanceFormatted) {
    levelsText = ` with primary support at ${supportFormatted} and overhead resistance at ${resistanceFormatted}`;
  } else if (supportFormatted) {
    levelsText = ` with primary support at ${supportFormatted}`;
  } else if (resistanceFormatted) {
    levelsText = ` with overhead resistance at ${resistanceFormatted}`;
  }

  const notes = `${name} (${symbol}) is trading at ${priceFormatted} (${changeFormatted})${rvolSegment}. Price is ${price >= fiftyDayAvg ? 'holding firmly above' : 'testing below'} the 50-DMA (${fiftyAvgFormatted}). Session Range: ${lowFormatted} - ${highFormatted}. ${setupType} detected${levelsText}.`;

  return {
    trend,
    volume: volumeScore,
    catalyst,
    rr,
    cleanliness,
    totalScore,
    setupType,
    support,
    resistance,
    research_notes: notes,
    price,
    changePct,
    change: q.change,
    dayHigh,
    dayLow,
    rvol,
    currency: q.currency
  };
}

// RUN scan manually
router.post("/scan/:configId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const parsedId = parseInt(req.params.configId);
    let config: any = null;

    if (!isNaN(parsedId)) {
      const [found] = await db.select().from(scannerConfigs).where(and(eq(scannerConfigs.id, parsedId), eq(scannerConfigs.userId, userId)));
      config = found;
    } else if (typeof req.params.configId === "string") {
      const [foundByName] = await db.select().from(scannerConfigs).where(and(eq(scannerConfigs.name, req.params.configId), eq(scannerConfigs.userId, userId)));
      config = foundByName;
    }

    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }

    let symbols = ["RELIANCE.NS", "HDFCBANK.NS", "INFY.NS", "BTC-USD"];
    if (req.body && req.body.symbols && Array.isArray(req.body.symbols) && req.body.symbols.length > 0) {
      symbols = req.body.symbols;
    }
    
    // 1. Fetch live market quotes
    const quotesData = await getLiveQuotes(symbols);
    const results: any[] = [];
    const skipped: string[] = [];
    
    // 2. Perform quantitative and AI-grounded scan
    const scanPromises = symbols.map(async (sym) => {
      try {
        const quote = quotesData[sym];
        if (!quote) {
          skipped.push(sym);
          return;
        }
        
        // Base quantitative analysis directly from live data
        const quantAnalysis = computeQuantitativeAnalysis(quote);
        let finalAnalysis = quantAnalysis;

        // Try optional AI enrichment with real quote numbers
        try {
          const prompt = `Quantitatively evaluate ${sym} (${quote.name}) live market data: Price=${quote.price}, Day Change=${quote.changePct}%, Day Range=${quote.dayLow}-${quote.dayHigh}, RVOL=${quote.rvol}x, 50DMA=${quote.fiftyDayAvg}, 52wHigh=${quote.fiftyTwoWeekHigh}. Score from 1-10 on trend, volume, catalyst, rr, cleanliness and provide 1-2 sentence factual research note. Return ONLY valid JSON: {"trend":${quantAnalysis.trend},"volume":${quantAnalysis.volume},"catalyst":${quantAnalysis.catalyst},"rr":${quantAnalysis.rr},"cleanliness":${quantAnalysis.cleanliness},"research_notes":"..."}`;
          
          const aiResponse = await createBluemindsCompletion({
            model: "gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }]
          });
          
          const rawChoice = (aiResponse as any)?.choices?.[0]?.message?.content || "";
          let cleanContent = rawChoice.trim();
          if (cleanContent.startsWith("```json")) {
            cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
          }
          const parsed = JSON.parse(cleanContent);
          if (parsed && typeof parsed.trend === "number") {
            finalAnalysis = {
              ...quantAnalysis,
              trend: Math.min(10, Math.max(1, Number(parsed.trend) || quantAnalysis.trend)),
              volume: quantAnalysis.volume !== null && parsed.volume !== undefined && parsed.volume !== null
                ? Math.min(10, Math.max(1, Number(parsed.volume) || quantAnalysis.volume))
                : quantAnalysis.volume,
              catalyst: Math.min(10, Math.max(1, Number(parsed.catalyst) || quantAnalysis.catalyst)),
              rr: quantAnalysis.rr !== null && parsed.rr !== undefined && parsed.rr !== null
                ? Math.min(10, Math.max(1, Number(parsed.rr) || quantAnalysis.rr))
                : quantAnalysis.rr,
              cleanliness: quantAnalysis.cleanliness !== null && parsed.cleanliness !== undefined && parsed.cleanliness !== null
                ? Math.min(10, Math.max(1, Number(parsed.cleanliness) || quantAnalysis.cleanliness))
                : quantAnalysis.cleanliness,
              research_notes: parsed.research_notes && parsed.research_notes.length > 20 ? parsed.research_notes : quantAnalysis.research_notes
            };
            const aiFactors = [
              { val: finalAnalysis.trend, weight: 0.25 },
              { val: finalAnalysis.volume, weight: 0.25 },
              { val: finalAnalysis.catalyst, weight: 0.20 },
              { val: finalAnalysis.rr, weight: 0.15 },
              { val: finalAnalysis.cleanliness, weight: 0.15 }
            ];
            const activeAiFactors = aiFactors.filter(f => f.val !== null && f.val !== undefined);
            const totalAiWeight = activeAiFactors.reduce((sum, f) => sum + f.weight, 0);
            finalAnalysis.totalScore = totalAiWeight > 0
              ? Math.round(activeAiFactors.reduce((sum, f) => sum + f.val! * f.weight, 0) / totalAiWeight)
              : 5;
          }
        } catch (aiErr) {
          // Gracefully continue with live quantitative analysis
        }

        const minScore = (config?.riskLimits as any)?.minScore || 5;
        const riskPassed = finalAnalysis.totalScore >= minScore;
        
        const [savedResult] = await db.insert(scannerResults).values({
          configId: config.id,
          symbol: sym,
          score: finalAnalysis.totalScore,
          scoreBreakdown: finalAnalysis,
          researchNotes: finalAnalysis.research_notes,
          riskPassed
        }).returning();

        results.push(savedResult);
      } catch (err: any) {
         console.warn(`❌ [Core Scanner Scan Error for ${sym}]:`, err.message);
         skipped.push(sym);
      }
    });

    await Promise.all(scanPromises);
    res.json({ message: "Scan completed", count: results.length, results, skipped });
  } catch (e: any) {
    console.error("❌ [Scanner API Error]:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET results
router.get("/results/:configId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const configId = parseInt(req.params.configId);
    if (isNaN(configId)) {
      return res.status(404).json({ error: "Config not found" });
    }

    const [config] = await db.select().from(scannerConfigs).where(and(eq(scannerConfigs.id, configId), eq(scannerConfigs.userId, userId)));
    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }

    const results = await db.select().from(scannerResults)
      .where(eq(scannerResults.configId, configId))
      .orderBy(desc(scannerResults.createdAt))
      .limit(50);
    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const STATIC_SEARCHABLE_SYMBOLS = [
  { symbol: "^NSEI", name: "Nifty 50 Index", type: "INDEX", exchange: "NSE" },
  { symbol: "^NSEBANK", name: "Nifty Bank Index", type: "INDEX", exchange: "NSE" },
  { symbol: "^BSESN", name: "BSE Sensex", type: "INDEX", exchange: "BSE" },
  { symbol: "^INDIAVIX", name: "India Volatility Index", type: "INDEX", exchange: "NSE" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "EQUITY", exchange: "NSE" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "SBIN.NS", name: "State Bank of India", type: "EQUITY", exchange: "NSE" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", type: "EQUITY", exchange: "NSE" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", type: "EQUITY", exchange: "NSE" },
  { symbol: "INFY.NS", name: "Infosys Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "WIPRO.NS", name: "Wipro Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", type: "EQUITY", exchange: "NSE" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", type: "EQUITY", exchange: "NSE" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", type: "EQUITY", exchange: "NSE" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", type: "EQUITY", exchange: "NSE" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", type: "EQUITY", exchange: "NSE" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", type: "EQUITY", exchange: "NSE" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp", type: "EQUITY", exchange: "NSE" },
  { symbol: "NTPC.NS", name: "NTPC Ltd", type: "EQUITY", exchange: "NSE" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", type: "EQUITY", exchange: "NSE" },
  { symbol: "BTC-USD", name: "Bitcoin USD", type: "CRYPTOCURRENCY", exchange: "CRYPTO" },
  { symbol: "ETH-USD", name: "Ethereum USD", type: "CRYPTOCURRENCY", exchange: "CRYPTO" },
  { symbol: "GC=F", name: "Gold Futures", type: "FUTURE", exchange: "COMEX" },
  { symbol: "XAUUSD=X", name: "Gold/USD", type: "CURRENCY", exchange: "CCY" },
  { symbol: "EURUSD=X", name: "EUR/USD", type: "CURRENCY", exchange: "CCY" },
  { symbol: "^GSPC", name: "S&P 500 Index", type: "INDEX", exchange: "US" },
  { symbol: "^IXIC", name: "Nasdaq Composite", type: "INDEX", exchange: "US" },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", type: "INDEX", exchange: "US" }
];

// SEARCH symbols - fast in-memory prefix and substring search
router.get("/search", async (req: any, res: any) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string") return res.json([]);
    
    const searchLower = q.trim().toLowerCase();
    const matches = STATIC_SEARCHABLE_SYMBOLS.filter((s) => {
      return (
        s.symbol.toLowerCase().includes(searchLower) ||
        s.name.toLowerCase().includes(searchLower)
      );
    });

    res.json(matches.slice(0, 15));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
