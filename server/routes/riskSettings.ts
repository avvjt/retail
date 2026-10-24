import { Router, Response } from "express";
import { db } from "../db";
import { riskSettings } from "../schema";
import { eq } from "drizzle-orm";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.use(authenticateJWT);

// GET /api/risk-settings - Get current risk configuration
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    let settings = await db.select()
      .from(riskSettings)
      .where(eq(riskSettings.userId, user.userId))
      .limit(1);

    if (settings.length === 0) {
      console.log(`🌱 Creating default risk settings for User #${user.userId}...`);
      const inserted = await db.insert(riskSettings).values({
        userId: user.userId,
        maxRiskPerTrade: "2%",
        maxDailyLoss: "5%",
        maxDrawdown: "10%",
        capitalBase: "100000"
      }).returning();
      
      settings = inserted;
    }

    return res.json(settings[0]);
  } catch (error: any) {
    console.error("Failed to query risk settings:", error);
    return res.status(500).json({ error: "Failed to retrieve risk profile settings." });
  }
});

// POST /api/risk-settings - Create or update risk configuration
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { maxRiskPerTrade, maxDailyLoss, maxDrawdown, capitalBase } = req.body;

  try {
    const existing = await db.select()
      .from(riskSettings)
      .where(eq(riskSettings.userId, user.userId))
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db.update(riskSettings)
        .set({
          maxRiskPerTrade: maxRiskPerTrade || existing[0].maxRiskPerTrade,
          maxDailyLoss: maxDailyLoss || existing[0].maxDailyLoss,
          maxDrawdown: maxDrawdown || existing[0].maxDrawdown,
          capitalBase: capitalBase || existing[0].capitalBase,
        })
        .where(eq(riskSettings.userId, user.userId))
        .returning();
    } else {
      result = await db.insert(riskSettings).values({
        userId: user.userId,
        maxRiskPerTrade: maxRiskPerTrade || "2%",
        maxDailyLoss: maxDailyLoss || "5%",
        maxDrawdown: maxDrawdown || "10%",
        capitalBase: capitalBase || "100000",
      }).returning();
    }

    return res.json({
      success: true,
      message: "Risk management settings saved successfully!",
      settings: result[0]
    });
  } catch (error: any) {
    console.error("Risk configuration update error:", error);
    return res.status(500).json({ error: "Failed to update risk profile settings." });
  }
});

export default router;
