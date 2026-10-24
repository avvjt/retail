import { Router, Request, Response } from "express";
import { db } from "../db";
import { optionChainSnapshots } from "../schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function isMarketOpen(): boolean {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const ist = new Date(istString);
  const day = ist.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return minutes >= (9 * 60 + 15) && minutes <= (15 * 60 + 30);
}

// GET /api/options/snapshots
router.get("/snapshots", async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string || "NIFTY").toUpperCase();
    
    const strikes = await db.select()
      .from(optionChainSnapshots)
      .where(eq(optionChainSnapshots.symbol, symbol))
      .orderBy(desc(optionChainSnapshots.strikePrice));

    if (strikes.length === 0) {
      return res.json({
        unavailable: true,
        message: "Data unavailable",
        symbol,
      });
    }

    let totalCallOi = 0;
    let totalPutOi = 0;
    let maxCallOiStrike = strikes[0]?.strikePrice || 24000;
    let maxCallOiVal = -1;
    let maxPutOiStrike = strikes[0]?.strikePrice || 24000;
    let maxPutOiVal = -1;

    strikes.forEach(s => {
      totalCallOi += s.callOi;
      totalPutOi += s.putOi;
      if (s.callOi > maxCallOiVal) {
        maxCallOiVal = s.callOi;
        maxCallOiStrike = s.strikePrice;
      }
      if (s.putOi > maxPutOiVal) {
        maxPutOiVal = s.putOi;
        maxPutOiStrike = s.strikePrice;
      }
    });

    const pcr = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(3)) : 1.0;

    // Calculate Max Pain Strike
    let minPayout = Infinity;
    let maxPainStrike = maxCallOiStrike;

    strikes.forEach(targetStrike => {
      let totalPayout = 0;
      strikes.forEach(s => {
        const callPayout = Math.max(0, targetStrike.strikePrice - s.strikePrice) * s.callOi;
        const putPayout = Math.max(0, s.strikePrice - targetStrike.strikePrice) * s.putOi;
        totalPayout += (callPayout + putPayout);
      });
      if (totalPayout < minPayout) {
        minPayout = totalPayout;
        maxPainStrike = targetStrike.strikePrice;
      }
    });

    // Descriptive Plain-Language Interpretations (SEBI-Compliant, No Directional Calls)
    const pcrInterpretation = pcr > 1.15
      ? `Put Open Interest exceeds Call Open Interest (PCR: ${pcr}), reflecting heavier put option positioning across strikes.`
      : pcr < 0.85
      ? `Call Open Interest exceeds Put Open Interest (PCR: ${pcr}), reflecting higher call option concentration.`
      : `Put and Call Open Interest are balanced across active strikes (PCR: ${pcr}).`;

    const maxPainInterpretation = `Max Pain is calculated at ₹${maxPainStrike.toLocaleString('en-IN')}, representing the strike price where aggregate option payout at expiration is mathematically minimized.`;

    const oiBuildupInterpretation = `Upper Call OI concentration is centered at ₹${maxCallOiStrike.toLocaleString('en-IN')} (${(maxCallOiVal / 1000).toFixed(0)}k contracts), while lower Put OI concentration sits at ₹${maxPutOiStrike.toLocaleString('en-IN')} (${(maxPutOiVal / 1000).toFixed(0)}k contracts).`;

    const greeksInterpretation = `Option Delta measures price sensitivity per unit move in the underlying ${symbol} index. Implied Volatility (IV) averages ${strikes.length > 0 ? strikes[Math.floor(strikes.length / 2)]?.callIv : "14.0"}%, tracking option premium pricing intensity.`;

    const structureStatus = pcr > 1.15 ? "Put Dominance in OI" : pcr < 0.85 ? "Call Dominance in OI" : "Balanced OI Distribution";

    return res.json({
      symbol,
      pcr,
      maxPain: maxPainStrike,
      structureStatus,
      pcrInterpretation,
      maxPainInterpretation,
      oiBuildupInterpretation,
      greeksInterpretation,
      maxCallOiStrike,
      maxPutOiStrike,
      strikes,
      marketClosed: !isMarketOpen(),
      message: !isMarketOpen() ? "The Indian stock market is currently closed. Showing last session snapshot data." : undefined,
      timestamp: strikes[0]?.createdAt || new Date()
    });
  } catch (error: any) {
    console.error("Failed to fetch option chain snapshot:", error);
    return res.status(500).json({ error: "Failed to fetch option chain insights." });
  }
});

export default router;
