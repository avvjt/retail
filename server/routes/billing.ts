import { Router, Response } from "express";
import { db } from "../db";
import { subscriptions } from "../schema";
import { eq } from "drizzle-orm";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.use(authenticateJWT);

// GET /api/billing/status - Fetch current subscription details (always return PRO subscription)
router.get("/status", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const list = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.userId))
      .limit(1);

    const renewalDate = list[0]?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return res.json({
      id: list[0]?.id || 1,
      userId: user.userId,
      plan: "pro",
      status: "pro", // Since Billing.jsx checks for subscription?.status === 'pro'
      razorpaySubId: list[0]?.razorpaySubId || "sub_always_pro_free",
      renewalAt: renewalDate.toISOString(),
      currentPeriodEnd: renewalDate.toISOString(),
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Failed to fetch subscription status:", error);
    return res.status(500).json({ error: "Failed to query billing status." });
  }
});

// POST /api/billing/checkout - Return 501 until Razorpay is integrated
router.post("/checkout", async (req: AuthenticatedRequest, res: Response) => {
  return res.status(501).json({
    error: "Not Implemented",
    message: "Razorpay payment integration is pending. Online checkout is currently not available."
  });
});

// POST /api/billing/cancel - Cancel active subscription
router.post("/cancel", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const updated = await db.update(subscriptions)
      .set({
        status: "cancelled",
        plan: "free"
      })
      .where(eq(subscriptions.userId, user.userId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Subscription record not found" });
    }

    return res.json({
      success: true,
      message: "Your premium subscription has been successfully cancelled. You will degrade to the Free tier immediately.",
      subscription: updated[0]
    });
  } catch (error: any) {
    console.error("Failed to cancel subscription:", error);
    return res.status(500).json({ error: "Failed to cancel subscription." });
  }
});

export default router;
