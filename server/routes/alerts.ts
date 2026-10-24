import { Router, Response } from "express";
import { db } from "../db";
import { priceAlerts } from "../schema";
import { eq, and } from "drizzle-orm";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(authenticateJWT);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const alerts = await db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId));
    res.json(alerts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { symbol, triggerType, price, repeat, expiryDays } = req.body;
    const [alert] = await db.insert(priceAlerts).values({
      userId, symbol, triggerType, price, repeat, expiryDays
    }).returning();
    res.json(alert);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const alertId = parseInt(req.params.id, 10);
    await db.delete(priceAlerts).where(
      and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.userId, userId)
      )
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
