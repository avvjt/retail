import { Router, Response } from "express";
import { db } from "../db";
import { smartMoneySignals } from "../schema";
import { eq, or, desc } from "drizzle-orm";
import { authenticateJWT, requireActiveSubscription, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Apply auth & premium subscription check to all endpoints in this route
router.use(authenticateJWT);
router.use(requireActiveSubscription);

// GET /api/smart-money/deals
router.get("/deals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await db.select()
      .from(smartMoneySignals)
      .where(or(eq(smartMoneySignals.signalType, "bulk_deal"), eq(smartMoneySignals.signalType, "block_deal")))
      .orderBy(desc(smartMoneySignals.createdAt));

    const formatted = records.map(r => {
      let details: any = {};
      try {
        details = JSON.parse(r.details);
      } catch (e) {
        details = {};
      }

      const sharesNum = details.quantity || 0;
      const priceNum = details.price || 0;
      const totalCr = (sharesNum && priceNum) ? ((sharesNum * priceNum) / 10000000).toFixed(1) : null;

      return {
        id: `deal-${r.id}`,
        symbol: r.symbol,
        dealType: r.signalType === "bulk_deal" ? "Bulk Deal" : "Block Deal",
        type: r.signalType === "bulk_deal" ? "Bulk Deal" : "Block Deal",
        participantA: details.clientName || details.buyer || "Institutional Participant",
        participantB: details.seller || "Market Counterparty",
        shares: sharesNum ? sharesNum.toLocaleString('en-IN') : "—",
        price: priceNum ? `₹${priceNum.toLocaleString('en-IN')}` : "—",
        totalVal: totalCr ? `₹${totalCr} Cr` : "—",
        time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—",
        isPositive: details.action === "BUY" || !!details.buyer,
        action: details.action === "BUY" ? "Institutional Accumulation Flow" : "Institutional Distribution Flow",
        conviction: details.conviction || "High",
        rationale: details.rationale || `${r.signalType === "bulk_deal" ? "Bulk" : "Block"} deal verified in exchange registry.`,
        details,
        createdAt: r.createdAt
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error("Failed to fetch bulk/block deals:", error);
    return res.status(500).json({ error: "Failed to fetch bulk and block deals" });
  }
});

// GET /api/smart-money/flows
router.get("/flows", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await db.select()
      .from(smartMoneySignals)
      .where(eq(smartMoneySignals.signalType, "fii_flow"))
      .orderBy(desc(smartMoneySignals.createdAt));

    const formatted = records.map(r => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(r.details);
      } catch (e) {
        parsed = {};
      }
      return {
        id: `flow-${r.id}`,
        date: parsed.date || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : "—"),
        fiiNetBuySell: parsed.fiiNetBuySell ?? null,
        diiNetBuySell: parsed.diiNetBuySell ?? null,
        createdAt: r.createdAt
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error("Failed to fetch FII/DII flows:", error);
    return res.status(500).json({ error: "Failed to fetch FII/DII flow records" });
  }
});

// GET /api/smart-money/volume-spikes
router.get("/volume-spikes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await db.select()
      .from(smartMoneySignals)
      .where(eq(smartMoneySignals.signalType, "volume_spike"))
      .orderBy(desc(smartMoneySignals.createdAt));

    const formatted = records.map(r => {
      let details: any = {};
      try {
        details = JSON.parse(r.details);
      } catch (e) {
        details = {};
      }
      return {
        id: `spike-${r.id}`,
        symbol: r.symbol,
        price: details.price ? `₹${details.price}` : "—",
        changePercent: details.changePercent ?? null,
        todayVolume: details.todayVolume ?? null,
        avgVolume20D: details.avgVolume20D ?? null,
        multiple: details.multiple ?? null,
        details,
        createdAt: r.createdAt
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error("Failed to fetch volume spikes:", error);
    return res.status(500).json({ error: "Failed to fetch volume spikes" });
  }
});

export default router;
