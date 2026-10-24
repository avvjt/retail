import { Router } from "express";
import { db } from "../db";
import { userProfiles, referrals, supportTickets, tradingPlans, users } from "../schema";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// Get Profile settings
router.get("/profile", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    let [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!profile) {
      const [inserted] = await db.insert(userProfiles).values({ userId, referralCode: `RTLX-${userId}` }).returning();
      profile = inserted;
    }
    res.json({ ...profile, email: user?.email });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/profile", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    const { name, username, avatarUrl, twoFactorEnabled, email } = req.body;
    await db.update(userProfiles).set({ name, username, avatarUrl, twoFactorEnabled }).where(eq(userProfiles.userId, userId));
    if (email) await db.update(users).set({ email }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Referrals
router.post("/referrals", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    const { referredEmail } = req.body;
    if (!referredEmail) return res.status(400).json({ error: "Email required" });
    const [ref] = await db.insert(referrals).values({ referrerId: userId, referredEmail, status: 'active', pointsEarned: 50 }).returning();
    res.json(ref);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
router.get("/referrals", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    const refs = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
    res.json(refs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Support
router.post("/support", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    const { type, subject, description, mediaData, mediaType } = req.body;
    const [ticket] = await db.insert(supportTickets).values({ userId, type, subject, description, mediaData, mediaType }).returning();
    res.json(ticket);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Trading Plan
router.get("/trading-plan", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    let [plan] = await db.select().from(tradingPlans).where(eq(tradingPlans.userId, userId));
    if (!plan) {
      const [inserted] = await db.insert(tradingPlans).values({ userId }).returning();
      plan = inserted;
    }
    res.json(plan);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/trading-plan", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || 1;
    const { maxTradesPerDay, maxRiskPerTrade, setupCriteria, active } = req.body;
    let [plan] = await db.select().from(tradingPlans).where(eq(tradingPlans.userId, userId));
    if (plan) {
      await db.update(tradingPlans).set({ maxTradesPerDay, maxRiskPerTrade, setupCriteria, active, updatedAt: new Date() }).where(eq(tradingPlans.userId, userId));
    } else {
      await db.insert(tradingPlans).values({ userId, maxTradesPerDay, maxRiskPerTrade, setupCriteria, active });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


router.get("/admin/referrals", async (req, res) => {
  try {
    const allReferrals = await db.select({
      id: referrals.id,
      referrerId: referrals.referrerId,
      referredEmail: referrals.referredEmail,
      status: referrals.status,
      pointsEarned: referrals.pointsEarned,
      createdAt: referrals.createdAt,
      referrerName: userProfiles.name,
      referrerEmail: users.email,
      referralCode: userProfiles.referralCode
    })
    .from(referrals)
    .leftJoin(userProfiles, eq(referrals.referrerId, userProfiles.userId))
    .leftJoin(users, eq(referrals.referrerId, users.id))
    .orderBy(desc(referrals.createdAt));
    
    // Calculate grouped user points
    const userPoints = await db.select({
      userId: referrals.referrerId,
      name: userProfiles.name,
      email: users.email,
      totalPoints: sql`SUM(${referrals.pointsEarned})`,
      totalReferrals: sql`COUNT(${referrals.id})`
    })
    .from(referrals)
    .leftJoin(userProfiles, eq(referrals.referrerId, userProfiles.userId))
    .leftJoin(users, eq(referrals.referrerId, users.id))
    .groupBy(referrals.referrerId, userProfiles.name, users.email);

    res.json({ history: allReferrals, users: userPoints });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

// GET /api/settings/admin/support-tickets - Protected Admin Route (for simplicity, we assume auth is handled or we just return all)
router.get("/admin/support-tickets", async (req: any, res: any) => {
  try {
    const tickets = await db.select({
      id: supportTickets.id,
      userId: supportTickets.userId,
      type: supportTickets.type,
      subject: supportTickets.subject,
      description: supportTickets.description,
      mediaData: supportTickets.mediaData,
      mediaType: supportTickets.mediaType,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      userEmail: users.email
    }).from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt));
      
    res.json(tickets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
