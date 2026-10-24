import { Router, Request, Response } from "express";
import { db } from "../db";
import { users } from "../schema";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    // Run a lightweight test select query via Drizzle
    await db.select({ id: users.id }).from(users).limit(1);
    const dbPingMs = Date.now() - start;

    return res.status(200).json({
      status: "healthy",
      database: "connected",
      dbPingMs,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Health Probe Warning:", error);
    return res.status(500).json({
      status: "degraded",
      database: "disconnected",
      error: error.message || "Connection to database failed",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
