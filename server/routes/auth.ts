import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions, loginSessions, userProfiles, referrals } from "../schema";
import { JWT_SECRET, REFRESH_SECRET, ADMIN_PASSWORD, ADMIN_EMAIL as RAW_ADMIN_EMAIL } from "../config";

const router = Router();

router.get("/db-verify", async (req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(200).json({
        status: "unconfigured",
        connected: false,
        message: "No database URL configured.",
      });
    }
    // Try to run a simple limit 1 query to see if connection is healthy
    await db.select({ id: users.id }).from(users).limit(1);
    return res.status(200).json({
      status: "healthy",
      connected: true,
      message: "Database connection verified.",
    });
  } catch (error: any) {
    console.error("Database connection verification check output:", error);
    return res.status(200).json({
      status: "degraded",
      connected: false,
      error: error.message || String(error),
      message: "Database configured but connection failed. Check connection parameters.",
    });
  }
});

const ADMIN_EMAIL = RAW_ADMIN_EMAIL.toLowerCase();

// Helper to generate access and refresh tokens
async function createTokensAndSession(user: { id: number; email: string }, req: Request) {
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;
  
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, isAdmin },
    JWT_SECRET as string,
    { expiresIn: "24h" } // Access token valid for 24h
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    REFRESH_SECRET as string,
    { expiresIn: "7d" } // Refresh token valid for 7d
  );

  // Store refresh token in sessions table
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    active: true,
  });

  // Track login session audit
  const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  const userAgent = req.headers["user-agent"] || "";
  await db.insert(loginSessions).values({
    userId: user.id,
    ipAddress,
    userAgent,
  });

  return { accessToken, refreshToken, isAdmin };
}

// Signup route (both paths for perfect compatibility)
const handleSignup = async (req: Request, res: Response) => {
  try {
    const { email, password, referralCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Insert user
    const [newUser] = await db.insert(users).values({
      email: cleanEmail,
      passwordHash,
    }).returning({
      id: users.id,
      email: users.email,
    });
    
    // Handle Referral Logic
    if (referralCode) {
      const [referrer] = await db.select().from(userProfiles).where(eq(userProfiles.referralCode, referralCode)).limit(1);
      if (referrer && referrer.userId) {
        await db.insert(referrals).values({
          referrerId: referrer.userId,
          referredEmail: cleanEmail,
          status: 'completed',
          pointsEarned: 100
        });
      }
    } else {
      // Check if invited by email
      const existingRef = await db.select().from(referrals).where(eq(referrals.referredEmail, cleanEmail)).limit(1);
      if (existingRef.length > 0) {
        await db.update(referrals).set({ status: 'completed' }).where(eq(referrals.id, existingRef[0].id));
      }
    }


    const { accessToken, refreshToken, isAdmin } = await createTokensAndSession(newUser, req);

    return res.status(201).json({
      accessToken,
      refreshToken,
      token: accessToken, // for backward compatibility in UI
      user: { id: newUser.id, email: newUser.email, isAdmin },
    });
  } catch (error: any) {
    console.error("Signup Route Error:", error);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
};

router.post("/signup", handleSignup);
router.post("/auth/signup", handleSignup);

// Login route (both paths for perfect compatibility)
const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Query user
    const foundUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    let user = foundUsers[0];

    // Bootstrap Admin on-demand if missing (match existing logic)
    if (!user && cleanEmail === ADMIN_EMAIL) {
      if (ADMIN_PASSWORD && cleanPassword === ADMIN_PASSWORD) {
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const [newAdmin] = await db.insert(users).values({
          email: ADMIN_EMAIL,
          passwordHash,
        }).returning();
        user = newAdmin;
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isPassValid = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isPassValid) {
      // Allow override if Admin logs in with master password from Env
      if (cleanEmail === ADMIN_EMAIL && cleanPassword === ADMIN_PASSWORD) {
        // Carry on as authenticated
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    const { accessToken, refreshToken, isAdmin } = await createTokensAndSession(user, req);

    return res.status(200).json({
      accessToken,
      refreshToken,
      token: accessToken, // for backward compatibility in UI
      user: { id: user.id, email: user.email, isAdmin },
    });
  } catch (error: any) {
    console.error("Login Route Error:", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
};

router.post("/login", handleLogin);
router.post("/auth/login", handleLogin);

// Refresh token route
router.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify raw JWT
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET as string) as unknown as { userId: number; email: string };
    
    // Check database to ensure session is active
    const activeSessions = await db.select().from(sessions).where(eq(sessions.refreshToken, refreshToken)).limit(1);
    const session = activeSessions[0];

    if (!session || !session.active || new Date() > session.expiresAt) {
      return res.status(401).json({ error: "Refresh session expired or revoked." });
    }

    const isAdmin = decoded.email.toLowerCase() === ADMIN_EMAIL;

    // Issue new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, isAdmin },
      JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      accessToken: newAccessToken,
      token: newAccessToken,
    });
  } catch (error: any) {
    console.error("Refresh Token Error:", error);
    return res.status(401).json({ error: "Invalid refresh token." });
  }
});

// Logged-in profile verification endpoint (/api/me)
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No bearer token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string; isAdmin?: boolean };

    const foundUsers = await db.select().from(users).where(eq(users.id, Number(decoded.userId))).limit(1);
    const user = foundUsers[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      isAdmin: user.email.toLowerCase() === ADMIN_EMAIL,
    });
  } catch (error: any) {
    return res.status(401).json({ error: "Unauthorized or session expired" });
  }
});

// Google Login Route
router.post("/google-login", async (req: Request, res: Response) => {
  try {
    const { authCode, redirectUri } = req.body;
    if (!authCode) {
      return res.status(400).json({ error: "Google auth code is required" });
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "780137191210-ustgpb5vmdvltq656p25v8bpmm4ootcg.apps.googleusercontent.com";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientSecret) {
      console.error("Missing GOOGLE_CLIENT_SECRET in environment variables.");
      return res.status(500).json({ error: "Server missing OAuth secret configuration." });
    }

    // Exchange auth code for tokens matching client side's redirect_uri exactly
    const exchangeRedirectUri = redirectUri || 'postmessage';

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: exchangeRedirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok || tokenData.error) {
      console.error("Google token exchange error:", tokenData);
      return res.status(401).json({ error: "Failed to verify Google auth code" });
    }

    // Verify token and fetch user profile securely on the server
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    if (!profileRes.ok) {
      return res.status(401).json({ error: "Failed to fetch Google profile" });
    }
    
    const info = await profileRes.json();
    if (!info.email) {
      return res.status(400).json({ error: "Google account details did not include an email address." });
    }

    const cleanEmail = info.email.trim().toLowerCase();

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    let user = existingUsers[0];
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create user if they don't exist
      // Since Google authenticated them, we don't have a password. Generating a random one to satisfy the DB schema.
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const [newUser] = await db.insert(users).values({
        email: cleanEmail,
        passwordHash,
      }).returning();
      user = newUser;
    }

    const { accessToken, refreshToken, isAdmin } = await createTokensAndSession(user, req);

    return res.status(200).json({
      accessToken,
      refreshToken,
      token: accessToken, // for backward compatibility in UI
      user: { id: user.id, email: user.email, isAdmin },
      isNewUser,
    });
  } catch (error: any) {
    console.error("Google Login Route Error:", error);
    return res.status(500).json({ error: "Internal server error during Google login." });
  }
});

export default router;

// Change Password
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string };
    const { oldPassword, newPassword } = req.body;
    const foundUsers = await db.select().from(users).where(eq(users.id, Number(decoded.userId))).limit(1);
    const user = foundUsers[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const isPassValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPassValid) return res.status(400).json({ error: "Invalid old password" });
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Sign out of all devices
router.post("/sign-out-all", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string };
    
    await db.delete(sessions).where(eq(sessions.userId, decoded.userId));
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
});
