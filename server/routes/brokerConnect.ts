import { Router, Response } from "express";
import { db } from "../db";
import { brokerConnections } from "../schema";
import { eq, and } from "drizzle-orm";
import { authenticateJWT, requireActiveSubscription, AuthenticatedRequest } from "../middleware/auth";
import { checkAndReloginAngelOne, getAngelOneStatus } from "../poller";
import { encryptToken } from "../utils/encryption";

const router = Router();

router.use(authenticateJWT);
router.use(requireActiveSubscription);

// GET /api/broker/status - Check broker connections
router.get("/status", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    let list = await db.select()
      .from(brokerConnections)
      .where(eq(brokerConnections.userId, user.userId));

    const hasSystemAngel = !!(
      process.env.ANGEL_ONE_CLIENT_ID &&
      process.env.ANGEL_ONE_API_KEY &&
      process.env.ANGEL_ONE_PASSWORD &&
      process.env.ANGEL_ONE_TOTP_SECRET
    );

    if (hasSystemAngel) {
      const hasAngel = list.some(conn => conn.brokerName.toLowerCase().includes("angel"));
      if (!hasAngel) {
        try {
          console.log(`Auto-linking system Angel One credentials for user #${user.userId}...`);
          const [newConn] = await db.insert(brokerConnections).values({
            userId: user.userId,
            brokerName: "Angel One",
            accessToken: encryptToken(process.env.ANGEL_ONE_API_KEY!),
            refreshToken: encryptToken(process.env.ANGEL_ONE_TOTP_SECRET!),
            mode: "live",
          }).returning();
          
          if (newConn) {
            list.push(newConn);
          }
          
          checkAndReloginAngelOne().catch(err => {
            console.error("Background Angel One relogin failed:", err);
          });
        } catch (dbErr) {
          console.error("Error auto-inserting system Angel connection:", dbErr);
        }
      } else {
        checkAndReloginAngelOne().catch(err => {
          console.error("Background Angel One relogin validation failed:", err);
        });
      }
    }

    return res.json({
      connected: list.length > 0,
      connections: list.map(c => ({
        id: c.id,
        brokerName: c.brokerName,
        mode: c.mode,
        connectedAt: c.connectedAt,
      })),
      angelOneStatus: getAngelOneStatus()
    });
  } catch (err) {
    console.error("Failed to query broker connection status:", err);
    return res.status(500).json({ error: "Failed to retrieve broker connections" });
  }
});

// POST /api/broker/connect - Connect broker API keys
router.post("/connect", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { brokerName, accessToken, refreshToken, mode } = req.body;

  if (!brokerName || typeof brokerName !== "string" || !brokerName.trim()) {
    return res.status(400).json({ error: "Missing broker name specification" });
  }

  if (!accessToken || typeof accessToken !== "string" || !accessToken.trim()) {
    return res.status(400).json({ error: "Broker access token is required. Missing tokens are not permitted." });
  }

  try {
    const encryptedAccessToken = encryptToken(accessToken.trim());
    const encryptedRefreshToken = refreshToken && typeof refreshToken === "string" && refreshToken.trim()
      ? encryptToken(refreshToken.trim())
      : "";

    // Delete any old connection of this user with the same broker
    await db.delete(brokerConnections)
      .where(and(eq(brokerConnections.userId, user.userId), eq(brokerConnections.brokerName, brokerName)));

    const inserted = await db.insert(brokerConnections).values({
      userId: user.userId,
      brokerName: brokerName.trim(),
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      mode: mode || "paper",
    }).returning();

    return res.json({
      success: true,
      message: `Successfully authenticated connection with ${brokerName}!`,
      connection: {
        id: inserted[0].id,
        brokerName: inserted[0].brokerName,
        mode: inserted[0].mode,
        connectedAt: inserted[0].connectedAt
      }
    });
  } catch (err) {
    console.error("Broker connection error:", err);
    return res.status(500).json({ error: "Failed to bind broker API credentials" });
  }
});

// POST /api/broker/mode - Change Mode (paper/live)
router.post("/mode", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { brokerName, mode } = req.body;

  if (!brokerName || !mode) {
    return res.status(400).json({ error: "Missing brokerName or mode parameter" });
  }

  try {
    const updated = await db.update(brokerConnections)
      .set({ mode })
      .where(and(eq(brokerConnections.userId, user.userId), eq(brokerConnections.brokerName, brokerName)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Broker connection not found" });
    }

    return res.json({
      success: true,
      brokerName,
      mode: updated[0].mode,
      message: `Trading mode updated to ${mode.toUpperCase()} for ${brokerName}`
    });
  } catch (err) {
    console.error("Mode swap failure:", err);
    return res.status(500).json({ error: "Failed to update trading mode." });
  }
});

// POST /api/broker/disconnect - Disconnect broker
router.post("/disconnect", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { brokerName } = req.body;

  if (!brokerName) {
    return res.status(400).json({ error: "Missing broker name specification" });
  }

  try {
    await db.delete(brokerConnections)
      .where(and(eq(brokerConnections.userId, user.userId), eq(brokerConnections.brokerName, brokerName)));

    return res.json({
      success: true,
      message: `Successfully disconnected ${brokerName} credentials.`
    });
  } catch (err) {
    console.error("Broker disconnect failure:", err);
    return res.status(500).json({ error: "Failed to disconnect broker credentials." });
  }
});

export default router;
