import { db } from "../db";
import { dashboardActivity, marketTicks, optionChainSnapshots, smartMoneySignals } from "../schema";
import { eq } from "drizzle-orm";
import yahooFinanceModule from "yahoo-finance2";
import crypto from "crypto";
import WebSocket from "ws";
import { marketCache } from "../cache/marketCache";
import { 
  generatePremarketAnalysis, 
  generatePostmarketAnalysis, 
  generateAlerts, 
  broadcastAlert,
  sanitizeError
} from "../routes/market";

const YahooFinanceClass = (yahooFinanceModule as any)?.default ?? yahooFinanceModule;
const yahooFinance = new YahooFinanceClass();

let lastNiftyPrice = 24056.0;
let lastBankNiftyPrice = 52177.05;

async function pollMarketData() {
  try {
    let niftyPrice: number;
    let bankNiftyPrice: number;
    let niftyVolume = 0;
    let bankNiftyVolume = 0;
    let niftyQuote: any = null;
    let bankNiftyQuote: any = null;
    
    // Live open interest (null if not reported by index feed)
    const niftyOI: number | null = null;
    const bankNiftyOI: number | null = null;

    try {
      const quotes = await yahooFinance.quote(["^NSEI", "^NSEBANK"]);
      niftyQuote = quotes.find((quote: any) => quote.symbol === "^NSEI");
      bankNiftyQuote = quotes.find((quote: any) => quote.symbol === "^NSEBANK");

      if (niftyQuote && niftyQuote.regularMarketPrice !== undefined) {
        niftyPrice = niftyQuote.regularMarketPrice;
        niftyVolume = niftyQuote.regularMarketVolume || 0;
        lastNiftyPrice = niftyPrice;
      } else {
        console.warn("Market Poller: NIFTY50 quote is missing price or fields.");
        return;
      }

      if (bankNiftyQuote && bankNiftyQuote.regularMarketPrice !== undefined) {
        bankNiftyPrice = bankNiftyQuote.regularMarketPrice;
        bankNiftyVolume = bankNiftyQuote.regularMarketVolume || 0;
        lastBankNiftyPrice = bankNiftyPrice;
      } else {
        console.warn("Market Poller: BANKNIFTY quote is missing price or fields.");
        return;
      }
    } catch (fetchError: any) {
      console.warn("Market Poller: Failed to fetch live quotes from Yahoo Finance:", sanitizeError(fetchError));
      return;
    }

    console.log(`Market Poller: Fetched live tick - NIFTY50: ₹${niftyPrice} | BANKNIFTY: ₹${bankNiftyPrice}`);

    const niftyPrevClose = niftyQuote?.regularMarketPreviousClose || niftyPrice;
    const niftyChg = niftyQuote?.regularMarketChange ?? Number((niftyPrice - niftyPrevClose).toFixed(2));
    const niftyChgPct = niftyQuote?.regularMarketChangePercent ?? (niftyPrevClose > 0 ? Number((((niftyPrice - niftyPrevClose) / niftyPrevClose) * 100).toFixed(2)) : 0);

    const bankNiftyPrevClose = bankNiftyQuote?.regularMarketPreviousClose || bankNiftyPrice;
    const bankNiftyChg = bankNiftyQuote?.regularMarketChange ?? Number((bankNiftyPrice - bankNiftyPrevClose).toFixed(2));
    const bankNiftyChgPct = bankNiftyQuote?.regularMarketChangePercent ?? (bankNiftyPrevClose > 0 ? Number((((bankNiftyPrice - bankNiftyPrevClose) / bankNiftyPrevClose) * 100).toFixed(2)) : 0);

    // Update in-memory cache store immediately for ultra-fast zero-latency route responses
    marketCache.setTick("NIFTY50", { price: niftyPrice, volume: String(niftyVolume), timestamp: Date.now() });
    marketCache.setTick("BANKNIFTY", { price: bankNiftyPrice, volume: String(bankNiftyVolume), timestamp: Date.now() });
    marketCache.setQuote("^NSEI", {
      symbol: "^NSEI",
      regularMarketPrice: niftyPrice,
      regularMarketChange: niftyChg,
      regularMarketChangePercent: niftyChgPct,
      regularMarketPreviousClose: niftyPrevClose,
      // Real Yahoo day range only (fields are regularMarketDayHigh/DayLow); never invent a range.
      regularMarketOpen: niftyQuote?.regularMarketOpen,
      regularMarketHigh: niftyQuote?.regularMarketDayHigh ?? niftyQuote?.regularMarketHigh,
      regularMarketLow: niftyQuote?.regularMarketDayLow ?? niftyQuote?.regularMarketLow,
      regularMarketVolume: niftyVolume,
      averageDailyVolume10Day: niftyQuote?.averageDailyVolume10Day ?? niftyQuote?.averageDailyVolume3Month,
      fiftyDayAverage: niftyQuote?.fiftyDayAverage,
      twoHundredDayAverage: niftyQuote?.twoHundredDayAverage,
      fiftyTwoWeekHigh: niftyQuote?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: niftyQuote?.fiftyTwoWeekLow,
      longName: "NIFTY 50",
      shortName: "NIFTY 50",
      currency: "INR",
      timestamp: Date.now()
    });
    marketCache.setQuote("^NSEBANK", {
      symbol: "^NSEBANK",
      regularMarketPrice: bankNiftyPrice,
      regularMarketChange: bankNiftyChg,
      regularMarketChangePercent: bankNiftyChgPct,
      regularMarketPreviousClose: bankNiftyPrevClose,
      // Real Yahoo day range only (fields are regularMarketDayHigh/DayLow); never invent a range.
      regularMarketOpen: bankNiftyQuote?.regularMarketOpen,
      regularMarketHigh: bankNiftyQuote?.regularMarketDayHigh ?? bankNiftyQuote?.regularMarketHigh,
      regularMarketLow: bankNiftyQuote?.regularMarketDayLow ?? bankNiftyQuote?.regularMarketLow,
      regularMarketVolume: bankNiftyVolume,
      averageDailyVolume10Day: bankNiftyQuote?.averageDailyVolume10Day ?? bankNiftyQuote?.averageDailyVolume3Month,
      fiftyDayAverage: bankNiftyQuote?.fiftyDayAverage,
      twoHundredDayAverage: bankNiftyQuote?.twoHundredDayAverage,
      fiftyTwoWeekHigh: bankNiftyQuote?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: bankNiftyQuote?.fiftyTwoWeekLow,
      longName: "NIFTY BANK",
      shortName: "NIFTY BANK",
      currency: "INR",
      timestamp: Date.now()
    });

    if (!process.env.DATABASE_URL) {
      return;
    }

    // Commit indices ticks to DB
    await db.insert(marketTicks).values({
       symbol: "NIFTY50",
       price: niftyPrice.toString(),
       volume: niftyVolume.toString(),
       openInterest: niftyOI !== null ? String(niftyOI) : null,
     });

    await db.insert(marketTicks).values({
       symbol: "BANKNIFTY",
       price: bankNiftyPrice.toString(),
       volume: bankNiftyVolume.toString(),
       openInterest: bankNiftyOI !== null ? String(bankNiftyOI) : null,
     });

    // Write a system-wide market updates flag to dashboardActivity
    await db.insert(dashboardActivity).values({
      type: "market_tick",
      description: `Indices updated: NIFTY50 of ₹${niftyPrice}, BANKNIFTY of ₹${bankNiftyPrice}`,
      data: {
        nifty: { price: niftyPrice, oi: niftyOI, vol: niftyVolume },
        banknifty: { price: bankNiftyPrice, oi: bankNiftyOI, vol: bankNiftyVolume },
      },
    });

  } catch (error: any) {
    console.error("❌ [Market Poller] Engine error:", error.message || error);
  }
}

// Time calculation helpers for IST timezone (UTC+5.5 hours, no DST)
function getMsUntilNextTarget(targetHour: number, targetMinute: number): number {
  const kolkataOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowReal = Date.now();
  
  for (let d = 0; d <= 7; d++) {
    const candidateReal = nowReal + d * 24 * 60 * 60 * 1000;
    const candidateKolkata = new Date(candidateReal + kolkataOffsetMs);
    
    candidateKolkata.setUTCHours(targetHour, targetMinute, 0, 0);
    const targetReal = candidateKolkata.getTime() - kolkataOffsetMs;
    
    if (targetReal > nowReal) {
      const dayOfWeek = candidateKolkata.getUTCDay(); // 0 is Sun, 6 is Sat
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return targetReal - nowReal;
      }
    }
  }
  return 24 * 60 * 60 * 1000; // fallback to 1 day
}

function isDuringMarketHours(): boolean {
  const kolkataOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowKolkata = new Date(Date.now() + kolkataOffsetMs);
  const day = nowKolkata.getUTCDay(); // 0 is Sunday, 6 is Saturday
  const isWeekday = (day >= 1 && day <= 5);
  if (!isWeekday) return false;

  const hours = nowKolkata.getUTCHours();
  const minutes = nowKolkata.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 09:15 AM = 555 minutes, 03:30 PM = 930 minutes
  return totalMinutes >= 555 && totalMinutes < 930;
}

// Scheduled pre-market and post-market run functions
async function runPremarketJob() {
  console.log("⏰ [Market Poller] Running scheduled Pre-Market Analysis...");
  try {
    const res = await generatePremarketAnalysis();
    console.log("⏰ [Market Poller] Pre-Market Analysis cached successfully at:", new Date(res.timestamp).toISOString());
  } catch (error) {
    console.error("⏰ [Market Poller] Error in scheduled Pre-Market Analysis:", error);
  }
}

async function runPostmarketJob() {
  console.log("⏰ [Market Poller] Running scheduled Post-Market Analysis...");
  try {
    const res = await generatePostmarketAnalysis();
    console.log("⏰ [Market Poller] Post-Market Analysis cached successfully at:", new Date(res.timestamp).toISOString());
  } catch (error) {
    console.error("⏰ [Market Poller] Error in scheduled Post-Market Analysis:", error);
  }
}

function scheduleNextPremarket() {
  const delay = getMsUntilNextTarget(8, 45);
  console.log(`⏰ [Market Poller] Next Pre-Market Analysis scheduled in ${(delay / 1000 / 60).toFixed(1)} minutes.`);
  setTimeout(async () => {
    await runPremarketJob();
    scheduleNextPremarket();
  }, delay);
}

function scheduleNextPostmarket() {
  const delay = getMsUntilNextTarget(15, 45);
  console.log(`⏰ [Market Poller] Next Post-Market Analysis scheduled in ${(delay / 1000 / 60).toFixed(1)} minutes.`);
  setTimeout(async () => {
    await runPostmarketJob();
    scheduleNextPostmarket();
  }, delay);
}

// Scheduled alerts refresh job
async function runAlertsRefreshJob() {
  console.log("🚨 [Market Poller] Running scheduled Alerts Refresh...");
  try {
    let niftyPrice: number | null = null;
    let bankNiftyPrice: number | null = null;
    try {
      const quotes = await yahooFinance.quote(["^NSEI", "^NSEBANK"]);
      const niftyQuote = quotes.find((quote: any) => quote.symbol === "^NSEI");
      const bankNiftyQuote = quotes.find((quote: any) => quote.symbol === "^NSEBANK");
      if (niftyQuote && niftyQuote.regularMarketPrice) niftyPrice = niftyQuote.regularMarketPrice;
      if (bankNiftyQuote && bankNiftyQuote.regularMarketPrice) bankNiftyPrice = bankNiftyQuote.regularMarketPrice;
    } catch (fetchError: any) {
      console.warn("🚨 [Market Poller] Failed to fetch live quotes for alerts refresh:", sanitizeError(fetchError));
    }

    const marketData = {
      nifty: niftyPrice,
      banknifty: bankNiftyPrice
    };

    const alerts = await generateAlerts(marketData);
    
    if (alerts && Array.isArray(alerts.observations)) {
      const highSeverityAlerts = alerts.observations.filter((obs: any) => obs.severity === "High");
      if (highSeverityAlerts.length > 0) {
        console.log(`🚨 [Market Poller] Broadcasting ${highSeverityAlerts.length} High-severity alert(s) to connected SSE clients...`);
        highSeverityAlerts.forEach((alert: any) => {
          broadcastAlert(alert);
        });
      }
    }
  } catch (error) {
    console.error("🚨 [Market Poller] Error in scheduled Alerts Refresh job:", error);
  }
}

function startAlertsPoller() {
  console.log("🚀 [Market Poller] Starting background Alerts Refresh Poller (5M loop)...");
  
  if (isDuringMarketHours()) {
    runAlertsRefreshJob();
  }

  setInterval(async () => {
    if (isDuringMarketHours()) {
      await runAlertsRefreshJob();
    }
  }, 5 * 60 * 1000);
}

export function getNearestExpiryDate(underlying: "NIFTY" | "BANKNIFTY"): string {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  
  let expiryDate: Date;

  if (underlying === "NIFTY") {
    // Weekly expiry: Tuesday (2)
    const targetDay = 2; 
    const currentDay = istTime.getDay();
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    
    let daysToTarget = (targetDay - currentDay + 7) % 7;
    
    if (daysToTarget === 0) {
      if (currentHour > 15 || (currentHour === 15 && currentMinute >= 30)) {
        daysToTarget = 7;
      }
    }
    expiryDate = new Date(istTime.getTime() + daysToTarget * 24 * 60 * 60 * 1000);
  } else {
    // Monthly expiry: Last Tuesday of the month
    let year = istTime.getFullYear();
    let month = istTime.getMonth();
    
    // Find last Tuesday of current month
    let lastDay = new Date(year, month + 1, 0);
    while (lastDay.getDay() !== 2) { // Tuesday is 2
      lastDay.setDate(lastDay.getDate() - 1);
    }
    
    // If today is past lastDay, go to next month
    if (istTime > lastDay && (istTime.getHours() > 15 || (istTime.getHours() === 15 && istTime.getMinutes() >= 30))) {
      month++;
      lastDay = new Date(year, month + 1, 0);
      while (lastDay.getDay() !== 2) {
        lastDay.setDate(lastDay.getDate() - 1);
      }
    }
    expiryDate = lastDay;
  }
  
  const dayStr = String(expiryDate.getDate()).padStart(2, "0");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthStr = months[expiryDate.getMonth()];
  const yearStr = String(expiryDate.getFullYear());
  
  return `${dayStr}${monthStr}${yearStr}`;
}

export function getUpcomingExpiryDates(underlying: "NIFTY" | "BANKNIFTY"): string[] {
  const expiries: string[] = [];
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  if (underlying === "NIFTY") {
    let date = new Date(istTime);
    // Move to next Tuesday (2)
    while (date.getDay() !== 2) {
      date.setDate(date.getDate() + 1);
    }
    for (let i = 0; i < 4; i++) {
      const dayStr = String(date.getDate()).padStart(2, "0");
      const monthStr = months[date.getMonth()];
      const yearStr = String(date.getFullYear());
      expiries.push(`${dayStr}${monthStr}${yearStr}`);
      date.setDate(date.getDate() + 7);
    }
  } else {
    // Monthly expiry: Last Tuesday of the month
    let date = new Date(istTime);
    for (let i = 0; i < 4; i++) {
      let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      while (lastDay.getDay() !== 2) {
        lastDay.setDate(lastDay.getDate() - 1);
      }
      
      // If lastDay is past today, add it
      if (lastDay >= istTime) {
          const dayStr = String(lastDay.getDate()).padStart(2, "0");
          const monthStr = months[lastDay.getMonth()];
          const yearStr = String(lastDay.getFullYear());
          expiries.push(`${dayStr}${monthStr}${yearStr}`);
      }
      date.setMonth(date.getMonth() + 1);
    }
  }
  
  return expiries;
}

export async function pollOptionChainData(expiryDate?: string) {
  console.log("📊 [Market Poller] Running Option Chain snapshot refresh (5M loop)...");

  try {
    const symbols: ("NIFTY" | "BANKNIFTY")[] = ["NIFTY", "BANKNIFTY"];
    for (const underlying of symbols) {
      const expiryToUse = expiryDate || getNearestExpiryDate(underlying);
      console.log(`📊 [Option Chain] Resolved live expiry date "${expiryToUse}" for ${underlying}`);
      const greeks = await fetchAngelOneOptionGreeks(underlying, expiryToUse);
      if (!greeks || greeks.length === 0) {
        console.warn(`⚠️ [Option Chain] No real option Greeks data returned from Angel One for ${underlying} with expiry "${expiryToUse}"`);
        continue;
      }

      const strikesMap = new Map<number, {
        callOi: number;
        callDeltaOi: number;
        callIv: string;
        putOi: number;
        putDeltaOi: number;
        putIv: string;
      }>();

      for (const greek of greeks) {
        const strike = Number(greek.strikePrice);
        if (isNaN(strike)) continue;
        
        if (!strikesMap.has(strike)) {
          strikesMap.set(strike, {
            callOi: 0,
            callDeltaOi: 0,
            callIv: "0.00",
            putOi: 0,
            putDeltaOi: 0,
            putIv: "0.00"
          });
        }
        
        const entry = strikesMap.get(strike)!;
        const isCall = greek.optionType === "CE";
        const ivStr = typeof greek.impliedVolatility === "number" 
          ? greek.impliedVolatility.toFixed(2) 
          : String(greek.impliedVolatility || "0.00");
        
        const vol = Number(greek.tradeVolume) || 0;
        const deltaVal = Math.round((Number(greek.delta) || 0) * 1000);
        
        if (isCall) {
          entry.callOi = vol;
          entry.callDeltaOi = deltaVal;
          entry.callIv = ivStr;
        } else {
          entry.putOi = vol;
          entry.putDeltaOi = deltaVal;
          entry.putIv = ivStr;
        }
      }

      if (strikesMap.size > 0) {
        await db.delete(optionChainSnapshots).where(eq(optionChainSnapshots.symbol, underlying));
        
        for (const [strike, entry] of strikesMap.entries()) {
          await db.insert(optionChainSnapshots).values({
            symbol: underlying,
            strikePrice: strike,
            callOi: entry.callOi,
            callDeltaOi: entry.callDeltaOi,
            callIv: entry.callIv,
            putOi: entry.putOi,
            putDeltaOi: entry.putDeltaOi,
            putIv: entry.putIv
          });
        }
        console.log(`📊 [Market Poller] Option Chain snaps updated for ${underlying} with ${strikesMap.size} strikes.`);
      }
    }
  } catch (err: any) {
    console.error("❌ Failed to poll option chain:", err.message || err);
  }
}

async function pollSmartMoneyData() {
  console.log("💰 [Market Poller] Running Smart Money signals refresh (15M loop)...");
  // Live smart money activity remains unaltered without synthetic jitter
}

// --- TOTP Generation Helper ---
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/\s/g, "").replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${cleaned[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret: string): string {
  const cleanSecret = secret.replace(/\s+/g, "");
  const key = base32Decode(cleanSecret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);
  
  const hmac = crypto.createHmac("sha1", key);
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
    
  const otp = (binary % 1000000).toString();
  return otp.padStart(6, "0");
}

// --- Smart Stream Parser ---
interface SmartStreamTick {
  subscriptionMode: number;
  exchangeType: number;
  token: string;
  sequenceNumber: bigint;
  exchangeTimestamp: number;
  lastTradedPrice: number;
  volume?: bigint;
  openInterest?: bigint;
}

function parseSmartStreamBuffer(buf: Buffer): SmartStreamTick | null {
  if (buf.length < 51) return null;
  
  const subscriptionMode = buf.readUInt8(0);
  const exchangeType = buf.readUInt8(1);
  const token = buf.toString("utf8", 2, 27).replace(/\0/g, "").trim();
  const sequenceNumber = buf.readBigInt64LE(27);
  
  const exchangeTimestamp = Number(buf.readBigInt64LE(35));
  const lastTradedPrice = Number(buf.readBigInt64LE(43)) / 100;
  let volume: bigint | undefined;
  let openInterest: bigint | undefined;
  
  if (buf.length >= 83 && buf.length <= 95) {
    volume = buf.readBigUInt64LE(51);
  } else if (buf.length >= 464) {
    volume = buf.readBigUInt64LE(51);
    openInterest = buf.readBigUInt64LE(456);
  }
  
  return {
    subscriptionMode,
    exchangeType,
    token,
    sequenceNumber,
    exchangeTimestamp,
    lastTradedPrice,
    volume,
    openInterest
  };
}

// --- State Variables ---
interface AngelOneTokens {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
  expiresAt: number;
}

let currentTokens: AngelOneTokens | null = null;
let activeWs: WebSocket | null = null;
let wsHeartbeatInterval: NodeJS.Timeout | null = null;
let tokenRefreshTimeout: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let wsConnected = false;

interface LatestTick {
  price: number;
  volume: string;
  timestamp: number;
}
const latestTicks: Record<string, LatestTick> = {};

// Cache to prevent spamming ticks and only broadcast major market movements or breakouts
const lastBroadcastedTicks: Record<string, { price: number; timestamp: number }> = {};
const dayHighs: Record<string, number> = {};
const dayLows: Record<string, number> = {};

export function getLatestTicks(): Record<string, LatestTick> {
  const ticks = { ...latestTicks };
  
  // Inject fallback pricing for paper trading if SmartAPI WS is down
  if (!ticks["NIFTY50"] && lastNiftyPrice > 0) {
    ticks["NIFTY50"] = { price: lastNiftyPrice, volume: "0", timestamp: Date.now() };
  }
  if (!ticks["BANKNIFTY"] && lastBankNiftyPrice > 0) {
    ticks["BANKNIFTY"] = { price: lastBankNiftyPrice, volume: "0", timestamp: Date.now() };
  }
  
  return ticks;
}

export function isAngelOneWsLive(): boolean {
  return wsConnected;
}

export async function checkAndReloginAngelOne(): Promise<boolean> {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  const clientId = process.env.ANGEL_ONE_CLIENT_ID;
  const password = process.env.ANGEL_ONE_PASSWORD;
  const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET;

  if (!apiKey || !clientId || !password || !totpSecret) {
    console.warn("⚠️ [Angel One SmartAPI] Credentials missing in environment.");
    return false;
  }

  // If we have valid tokens, return true
  if (currentTokens && currentTokens.expiresAt > Date.now()) {
    return true;
  }

  // Try re-login
  console.log("🔄 [Angel One SmartAPI] Session expired or missing. Attempting lightweight re-login...");
  const tokens = await loginAngelOne();
  if (tokens) {
    currentTokens = tokens;
    scheduleTokenRenewal();
    reconnectWebSocket();
    return true;
  }

  return false;
}

export function getAngelOneStatus() {
  const hasCredentials = !!(
    process.env.ANGEL_ONE_CLIENT_ID &&
    process.env.ANGEL_ONE_API_KEY &&
    process.env.ANGEL_ONE_PASSWORD &&
    process.env.ANGEL_ONE_TOTP_SECRET
  );
  return {
    hasCredentials,
    isLoggedIn: !!currentTokens,
    isWsConnected: wsConnected,
    mode: hasCredentials && currentTokens ? "live" : "disconnected",
    clientId: process.env.ANGEL_ONE_CLIENT_ID || null
  };
}

const ANGEL_ONE_BASE_URL = "https://apiconnect.angelone.in";

// --- API Helpers ---
async function loginAngelOne(): Promise<AngelOneTokens | null> {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  const clientId = process.env.ANGEL_ONE_CLIENT_ID;
  const password = process.env.ANGEL_ONE_PASSWORD;
  const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET;

  if (!apiKey || !clientId || !password || !totpSecret) {
    console.warn("⚠️ [Angel One SmartAPI] Credentials missing in environment.");
    return null;
  }

  try {
    const totp = generateTOTP(totpSecret);
    console.log(`🔑 [Angel One SmartAPI] Logging in client ${clientId} with fresh TOTP...`);

    const response = await fetch(`${ANGEL_ONE_BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216:3eff:fe0d:a123",
        "X-PrivateKey": apiKey
      },
      body: JSON.stringify({
        clientcode: clientId,
        password: password,
        totp: totp
      })
    });

    const result = await response.json() as any;

    if (!result || !result.status || !result.data) {
      console.error(`❌ [Angel One SmartAPI] Login response failed: ${result?.message || "Unknown error"}`);
      return null;
    }

    const { jwtToken, refreshToken, feedToken } = result.data;
    console.log("✅ [Angel One SmartAPI] Login successful!");

    return {
      jwtToken,
      refreshToken,
      feedToken,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000
    };
  } catch (err: any) {
    console.error(`❌ [Angel One SmartAPI] Login request error:`, err.message || err);
    return null;
  }
}

async function renewAngelOneToken(tokens: AngelOneTokens): Promise<AngelOneTokens | null> {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("🔄 [Angel One SmartAPI] Renewing token...");
    const response = await fetch(`${ANGEL_ONE_BASE_URL}/rest/auth/angelbroking/user/v1/renewToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216:3eff:fe0d:a123",
        "X-PrivateKey": apiKey,
        "Authorization": `Bearer ${tokens.jwtToken}`
      },
      body: JSON.stringify({
        refreshToken: tokens.refreshToken
      })
    });

    const result = await response.json() as any;

    if (!result || !result.status || !result.data) {
      console.error(`❌ [Angel One SmartAPI] Renewal response failed: ${result?.message || "Unknown error"}`);
      return null;
    }

    const { jwtToken, refreshToken, feedToken } = result.data;
    console.log("✅ [Angel One SmartAPI] Token renewed!");

    return {
      jwtToken,
      refreshToken,
      feedToken,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000
    };
  } catch (err: any) {
    console.error("❌ [Angel One SmartAPI] Renewal request error:", err.message || err);
    return null;
  }
}

export async function fetchAngelOneOptionGreeks(underlying: "NIFTY" | "BANKNIFTY", expirydate: string) {
  if (!currentTokens) return null;
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  try {
    const response = await fetch(`${ANGEL_ONE_BASE_URL}/rest/secure/angelbroking/marketData/v1/optionGreek`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${currentTokens.jwtToken}`,
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216:3eff:fe0d:a123",
        "X-PrivateKey": apiKey || ""
      } as Record<string, string>,
      body: JSON.stringify({ name: underlying, expirydate })
    });
    const result = await response.json() as any;
    if (!result.status || !result.data) {
      console.warn(`⚠️ [Option Greeks] No data for ${underlying} ${expirydate}:`, result.message);
      return null;
    }
    return result.data; // array of { strikePrice, optionType, delta, gamma, theta, vega, impliedVolatility, tradeVolume }
  } catch (err: any) {
    console.error(`❌ [Option Greeks] Fetch failed for ${underlying}:`, err.message || err);
    return null;
  }
}

function scheduleTokenRenewal() {
  if (tokenRefreshTimeout) {
    clearTimeout(tokenRefreshTimeout);
  }

  if (!currentTokens) return;

  const delay = Math.max(1000, currentTokens.expiresAt - Date.now() - 30 * 60 * 1000);
  console.log(`⏰ [Angel One SmartAPI] Next token renewal scheduled in ${Math.round(delay / 1000 / 60)} minutes.`);

  tokenRefreshTimeout = setTimeout(async () => {
    if (!currentTokens) return;
    const nextTokens = await renewAngelOneToken(currentTokens);
    if (nextTokens) {
      currentTokens = nextTokens;
      scheduleTokenRenewal();
      reconnectWebSocket();
    } else {
      console.warn("⚠️ Token renewal failed, trying re-login...");
      const newTokens = await loginAngelOne();
      if (newTokens) {
        currentTokens = newTokens;
        scheduleTokenRenewal();
        reconnectWebSocket();
      }
    }
  }, delay);
}

// --- WebSocket Connection ---
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  const hasCredentials = !!(
    process.env.ANGEL_ONE_CLIENT_ID &&
    process.env.ANGEL_ONE_API_KEY &&
    process.env.ANGEL_ONE_PASSWORD &&
    process.env.ANGEL_ONE_TOTP_SECRET
  );
  if (!hasCredentials) return;

  console.log("🔄 [Angel One WS] Scheduling reconnect in 10 seconds...");
  reconnectTimeout = setTimeout(() => {
    reconnectWebSocket();
  }, 10000);
}

async function reconnectWebSocket() {
  if (activeWs) {
    try {
      activeWs.terminate();
    } catch {}
    activeWs = null;
  }

  console.log("🔌 [Angel One WS] Reconnecting...");

  if (!currentTokens || currentTokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    currentTokens = await loginAngelOne();
  }

  if (!currentTokens) {
    console.warn("⚠️ [Angel One WS] Re-auth failed. No simulation fallback active.");
    return;
  }

  connectWebSocket();
}

function connectWebSocket() {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  const clientId = process.env.ANGEL_ONE_CLIENT_ID;

  if (!apiKey || !clientId || !currentTokens) {
    return;
  }

  try {
    const url = "wss://smartapisocket.angelone.in/smart-stream";
    console.log("🔌 [Angel One WS] Initiating socket to Smart Stream...");
    
    const ws = new WebSocket(url, {
      headers: {
        "Authorization": `Bearer ${currentTokens.jwtToken}`,
        "x-api-key": apiKey,
        "x-client-code": clientId,
        "x-feed-token": currentTokens.feedToken
      }
    });

    activeWs = ws;

    ws.on("open", () => {
      console.log("🔌 [Angel One WS] Connected! Subscribing to low-latency NIFTY50, BANKNIFTY and scanned stock ticks...");
      wsConnected = true;

      const subscribePayload = {
        correlationId: "low_latency_ticks",
        action: 1, // Subscribe
        params: {
          mode: 2, // Quote mode for LTP + volume
          tokenList: [
            {
              exchangeType: 1, // NSECM
              tokens: [
                "99926000", "99926009", // NIFTY50, BANKNIFTY
                "2885", "1333", "4963", "11536", "1594", "3045", "3456", "5900", "3499", "10999" // Scanned stocks
              ]
            }
          ]
        }
      };

      ws.send(JSON.stringify(subscribePayload));

      if (wsHeartbeatInterval) {
        clearInterval(wsHeartbeatInterval);
      }
      wsHeartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 30000);
    });

    ws.on("message", async (data) => {
      if (typeof data === "string") {
        if (data === "pong") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === "error") {
            console.error("❌ [Angel One WS] Socket error payload:", parsed);
          }
        } catch {}
        return;
      }

      if (Buffer.isBuffer(data)) {
        try {
          const tick = parseSmartStreamBuffer(data);
          if (tick) {
            const symbolMap: Record<string, string> = {
              "99926000": "NIFTY50",
              "99926009": "BANKNIFTY",
              "2885": "RELIANCE",
              "1333": "HDFCBANK",
              "4963": "ICICIBANK",
              "11536": "TCS",
              "1594": "INFY",
              "3045": "SBIN",
              "3456": "TATAMOTORS",
              "5900": "AXISBANK",
              "3499": "TATASTEEL",
              "10999": "MARUTI"
            };
            const symbol = symbolMap[tick.token];
            if (!symbol) return;

            const price = tick.lastTradedPrice;
            const vol = tick.volume ? tick.volume.toString() : "0";

            console.log(`⚡ [Angel One WS Tick] ${symbol}: ₹${price} | Vol: ${vol}`);

            latestTicks[symbol] = { price, volume: vol, timestamp: Date.now() };
            marketCache.setTick(symbol, { price, volume: vol, timestamp: Date.now() });

            // Determine if this tick represents an important market breakout or major movement
            const last = lastBroadcastedTicks[symbol];

            // 1. Check for Intraday High breakout
            if (!dayHighs[symbol] || price > dayHighs[symbol]) {
              const prevHigh = dayHighs[symbol];
              dayHighs[symbol] = price;
              if (prevHigh && price > prevHigh * 1.001) {
                const breakoutAlert = {
                  id: `breakout_high_${symbol}_${Date.now()}`,
                  severity: "High",
                  type: "market_structure",
                  category: "Breakout Alert",
                  instrument: symbol,
                  title: `${symbol} Intraday High Breakout`,
                  observation: `${symbol} has broken above its previous intraday high of ₹${prevHigh.toFixed(2)}, reaching ₹${price.toFixed(2)}. This indicates strong intraday buying momentum.`,
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
                  timestamp: Date.now()
                };
                broadcastAlert(breakoutAlert);
                lastBroadcastedTicks[symbol] = { price, timestamp: Date.now() };
              }
            }

            // 2. Check for Intraday Low breakdown
            if (!dayLows[symbol] || price < dayLows[symbol]) {
              const prevLow = dayLows[symbol];
              dayLows[symbol] = price;
              if (prevLow && price < prevLow * 0.999) {
                const breakdownAlert = {
                  id: `breakdown_low_${symbol}_${Date.now()}`,
                  severity: "High",
                  type: "market_structure",
                  category: "Breakout Alert",
                  instrument: symbol,
                  title: `${symbol} Intraday Low Breakdown`,
                  observation: `${symbol} has broken below its previous intraday low of ₹${prevLow.toFixed(2)}, dropping to ₹${price.toFixed(2)}. This indicates elevated selling pressure.`,
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
                  timestamp: Date.now()
                };
                broadcastAlert(breakdownAlert);
                lastBroadcastedTicks[symbol] = { price, timestamp: Date.now() };
              }
            }

            // 3. Check for significant price change since last broadcasted alert
            if (last) {
              const priceChangePercent = Math.abs((price - last.price) / last.price) * 100;
              const timeSinceLastMs = Date.now() - last.timestamp;

              // Only broadcast significant shifts (>= 0.75%) after a 60-second cooldown
              if (priceChangePercent >= 0.75 && timeSinceLastMs > 60000) {
                const direction = price > last.price ? "upward" : "downward";
                const movementAlert = {
                  id: `move_${symbol}_${Date.now()}`,
                  severity: "High",
                  type: "volatility_conditions",
                  category: "Market Movement",
                  instrument: symbol,
                  title: `${symbol} Significant Price Shift`,
                  observation: `${symbol} has registered a sharp ${direction} movement of ${priceChangePercent.toFixed(2)}%, trading at ₹${price.toFixed(2)} (previously ₹${last.price.toFixed(2)}).`,
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
                  timestamp: Date.now()
                };
                broadcastAlert(movementAlert);
                lastBroadcastedTicks[symbol] = { price, timestamp: Date.now() };
              }
            } else {
              // Establish initial baseline price
              lastBroadcastedTicks[symbol] = { price, timestamp: Date.now() };
            }

            if (process.env.DATABASE_URL) {
              await db.insert(marketTicks).values({
                symbol,
                price: price.toString(),
                volume: vol,
              });
            }
          }
        } catch (err: any) {
          console.warn("⚠️ [Angel One WS] Buffer parse error:", err.message || err);
        }
      }
    });

    ws.on("error", (err: any) => {
      console.error("❌ [Angel One WS] Socket error event:", err.message || err);
    });

    ws.on("close", (code, reason) => {
      console.warn(`🔌 [Angel One WS] Closed. Code: ${code}, Reason: ${reason || "none"}.`);
      wsConnected = false;
      if (wsHeartbeatInterval) {
        clearInterval(wsHeartbeatInterval);
        wsHeartbeatInterval = null;
      }
      scheduleReconnect();
    });

  } catch (err: any) {
    console.error("❌ [Angel One WS] Connect initialization error:", err.message || err);
  }
}

export async function initAngelOneWebSocket() {
  console.log("🔌 [Angel One SmartAPI] Initializing low-latency live quote tick WebSocket...");
  
  const hasCredentials = !!(
    process.env.ANGEL_ONE_CLIENT_ID &&
    process.env.ANGEL_ONE_API_KEY &&
    process.env.ANGEL_ONE_PASSWORD &&
    process.env.ANGEL_ONE_TOTP_SECRET
  );

  if (!hasCredentials) {
    console.warn("⚠️ [Angel One SmartAPI] Required credentials missing.");
    return;
  }

  currentTokens = await loginAngelOne();
  if (!currentTokens) {
    console.warn("⚠️ [Angel One SmartAPI] Login failed on init.");
    scheduleReconnect(); // Keep trying to connect in background
    return;
  }

  scheduleTokenRenewal();
  connectWebSocket();
}

export async function fetchAngelOneQuotes(exchangeTokens: string[]): Promise<any[] | null> {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  const clientId = process.env.ANGEL_ONE_CLIENT_ID;
  if (!apiKey || !clientId || !currentTokens) {
    throw new Error(JSON.stringify({
      status: false,
      message: "Angel One SmartAPI credentials missing or not logged in",
      errorcode: "API_AUTH_ERROR"
    }));
  }

  try {
    const response = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216:3eff:fe0d:a123",
        "X-PrivateKey": apiKey,
        "Authorization": `Bearer ${currentTokens.jwtToken}`
      },
      body: JSON.stringify({
        mode: "FULL",
        exchangeTokens: {
          "NSE": exchangeTokens
        }
      })
    });

    const result = await response.json() as any;
    if (result && result.status && result.data && Array.isArray(result.data.fetched)) {
      return result.data.fetched;
    }
    
    // Propagate the exact raw error payload from SmartAPI
    throw new Error(JSON.stringify(result || { message: "Unknown response from quote endpoint" }));
  } catch (err: any) {
    // If it's already a JSON error, propagate it
    try {
      JSON.parse(err.message);
      throw err;
    } catch {
      throw new Error(JSON.stringify({
        status: false,
        message: err.message || "Failed to communicate with Angel One Quotes API",
        errorcode: "API_COMMUNICATION_ERROR"
      }));
    }
  }
}

export async function fetchAngelOneHistoricalData(
  exchange: string,
  symbolToken: string,
  interval: string,
  fromDate: string,
  toDate: string
): Promise<any[] | null> {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  const clientId = process.env.ANGEL_ONE_CLIENT_ID;
  if (!apiKey || !clientId || !currentTokens) {
    return null;
  }

  try {
    const response = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216:3eff:fe0d:a123",
        "X-PrivateKey": apiKey,
        "Authorization": `Bearer ${currentTokens.jwtToken}`
      },
      body: JSON.stringify({
        exchange,
        symboltoken: symbolToken,
        interval,
        fromdate: fromDate,
        todate: toDate
      })
    });

    const result = await response.json() as any;
    if (result && result.status && result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return null;
  } catch (err: any) {
    return null;
  }
}

export function startPoller() {
  console.log("🚀 [Market Poller] Starting market data tick poller (5M loop)...");
  
  // Prime state immediately on server start
  pollMarketData();
  pollOptionChainData();
  pollSmartMoneyData();

  // Run market tick data poller on a 15-second interval
  setInterval(() => {
    pollMarketData();
  }, 15 * 1000);

  // Run option chain snapshot poller on a 3-minute interval
  setInterval(() => {
    pollOptionChainData();
  }, 3 * 60 * 1000);

  // Run on a 2-minute interval for smart money flows
  setInterval(() => {
    pollSmartMoneyData();
  }, 2 * 60 * 1000);

  // Start Pre-market and Post-market scheduled jobs
  scheduleNextPremarket();
  scheduleNextPostmarket();

  // Start Alerts poller
  startAlertsPoller();

  // Initialize Angel One Live WebSocket tick streaming
  initAngelOneWebSocket();
}


// --- Auto Scanner Injection ---
import { scannerConfigs, scannerResults } from "../schema";
import { createBluemindsCompletion } from "../blueminds";

async function runScheduledScanners() {
  try {
    const configs = await db.select().from(scannerConfigs).where(eq(scannerConfigs.active, true));
    for (const config of configs) {
      if (!config.scheduleCron) continue; // simplistic check, in real life use node-cron
      // We will just run it once a day if it has a schedule. For this mockup, we just run occasionally.
      console.log(`[Scanner Engine] Running scheduled scan for config: ${config.name}`);
      
      const symbols = ["RELIANCE.NS", "HDFCBANK.NS", "INFY.NS", "BTC-USD"];
      for (const sym of symbols) {
        try {
          const aiResponse = await createBluemindsCompletion({
            messages: [{role: "user", content: `Analyze ${sym} based on recent price action. Score 1-10 on trend, volume, catalyst, rr, cleanliness. Return ONLY JSON like: {"trend":8,"volume":7,"catalyst":9,"rr":8,"cleanliness":7,"research_notes":"Fact based..."}`}],
            response_format: { type: "json_object" }
          });
          const aiData = JSON.parse(aiResponse);
          const avgScore = Math.round((aiData.trend + aiData.volume + aiData.catalyst + aiData.rr + aiData.cleanliness) / 5);
          const riskPassed = avgScore >= 6;
          
          await db.insert(scannerResults).values({
            configId: config.id,
            symbol: sym,
            score: avgScore,
            scoreBreakdown: aiData,
            researchNotes: aiData.research_notes,
            riskPassed
          });
        } catch(e) { }
      }
    }
  } catch (e) {
    console.error("[Scanner Engine] Error:", e);
  }
}

// Intercept setInterval to also run scanners
setInterval(() => {
  runScheduledScanners();
}, 60 * 60 * 1000); // Check every hour
