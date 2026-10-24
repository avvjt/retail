import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { surveyResponses, userProfiles, users } from "../schema";
import { eq, desc } from "drizzle-orm";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { JWT_SECRET } from "../config";

const router = Router();

// Optional Auth Helper to extract user if it exists (allows guest/waitlist completion or fully authenticated completion)
function getOptionalUser(req: Request): { userId: number; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string };
    return { userId: Number(decoded.userId), email: decoded.email };
  } catch {
    return null;
  }
}

// POST /api/survey - Save survey results
router.post("/survey", async (req: Request, res: Response) => {
  try {
    const { name, email, answers, biometricScore } = req.body;

    if (!name || !email || !answers || biometricScore === undefined) {
      return res.status(400).json({ error: "Missing required survey details: name, email, answers, or biometricScore." });
    }

    const user = getOptionalUser(req);
    const cleanEmail = user ? user.email.toLowerCase() : email.trim().toLowerCase();
    const cleanName = user ? user.email.split('@')[0] : name.trim();

    // Save response
    const [insertedResponse] = await db.insert(surveyResponses).values({
      userId: user ? user.userId : null,
      name: cleanName,
      email: cleanEmail,
      biometricScore: Number(biometricScore),
      answers: answers,
    }).returning();

    // If fully-logged in, let's also update the user's profile
    if (user) {
      // Find or insert user profile
      const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.userId)).limit(1);
      
      const behaviorsStr = answers.behaviors ? (Array.isArray(answers.behaviors) ? answers.behaviors.join(", ") : String(answers.behaviors)) : "";
      
      if (profiles.length > 0) {
        await db.update(userProfiles).set({
          experience: answers.experience || null,
          painScale: answers.painScale ? Number(answers.painScale) : null,
          behaviors: behaviorsStr || null,
          valuableFeature: answers.valuableFeature || null,
          pricing: answers.pricing || null,
        }).where(eq(userProfiles.userId, user.userId));
      } else {
        await db.insert(userProfiles).values({
          userId: user.userId,
          experience: answers.experience || null,
          painScale: answers.painScale ? Number(answers.painScale) : null,
          behaviors: behaviorsStr || null,
          valuableFeature: answers.valuableFeature || null,
          pricing: answers.pricing || null,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Survey answers saved successfully.",
      surveyId: insertedResponse.id,
    });
  } catch (error: any) {
    console.error("Survey Ingestion Error:", error);
    return res.status(500).json({ error: "Internal server error saving survey answers." });
  }
});

// GET /api/survey - Retrieve survey for logged-in user
router.get("/survey", async (req: Request, res: Response) => {
  try {
    const user = getOptionalUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please sign in to fetch responses." });
    }

    const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.userId, user.userId));
    return res.status(200).json({ responses });
  } catch (error: any) {
    console.error("Survey Fetch Error:", error);
    return res.status(500).json({ error: "Internal server error fetching survey data." });
  }
});

// Backward compatibility helper POST /api/submit-form (WaitlistForm.jsx support)
router.post("/submit-form", async (req: Request, res: Response) => {
  try {
    const { name, email, experience, painScale, behaviors, valuableFeature, pricing } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required to register early access." });
    }

    const user = getOptionalUser(req);
    const cleanEmail = user ? user.email.toLowerCase() : email.trim().toLowerCase();
    const cleanName = user ? user.email.split('@')[0] : name.trim();

    // Transform Waitlist format into formatted Answers object
    const structuredAnswers = {
      experience,
      painScale,
      behaviors: Array.isArray(behaviors) ? behaviors : [behaviors],
      valuableFeature,
      pricing,
    };

    const biometricScore = painScale ? Math.min(100, Math.max(0, Number(painScale) * 10)) : 50;

    // Save Waitlist Submission into surveyResponses
    await db.insert(surveyResponses).values({
      userId: user ? user.userId : null,
      name: cleanName,
      email: cleanEmail,
      biometricScore,
      answers: structuredAnswers,
    });

    if (user) {
      const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.userId)).limit(1);
      const behaviorsStr = Array.isArray(behaviors) ? behaviors.join(", ") : String(behaviors || "");

      if (existing.length > 0) {
        await db.update(userProfiles).set({
          experience,
          painScale: Number(painScale || 5),
          behaviors: behaviorsStr,
          valuableFeature,
          pricing,
        }).where(eq(userProfiles.userId, user.userId));
      } else {
        await db.insert(userProfiles).values({
          userId: user.userId,
          experience,
          painScale: Number(painScale || 5),
          behaviors: behaviorsStr,
          valuableFeature,
          pricing,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Thank you! Your trading profile has been saved.",
    });
  } catch (error: any) {
    console.error("Submit Form Compatibility Error:", error);
    return res.status(500).json({ error: "Internal server error during profile registry." });
  }
});

// GET /api/admin/submissions - Protected Admin Route to fetch waitlist submissions
router.get("/admin/submissions", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email?.toLowerCase();
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
    const isAdmin = req.user?.isAdmin === true || email === ADMIN_EMAIL;

    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied. Administrative privileges are required." });
    }

    const rawSubmissions = await db.select().from(surveyResponses).orderBy(desc(surveyResponses.createdAt));

    // Map each submission to match the structure the frontend AdminPanel is expecting
    const flattedSubmissions = rawSubmissions.map((sub: any) => {
      const answers = sub.answers || {};
      return {
        id: sub.id,
        userId: sub.userId,
        name: sub.name,
        email: sub.email,
        biometricScore: sub.biometricScore,
        created_at: sub.createdAt,
        experience: answers.experience || answers.tradingDuration || "",
        painScale: answers.painScale || Math.round(sub.biometricScore / 10) || 5,
        pain_scale: answers.painScale || Math.round(sub.biometricScore / 10) || 5,
        valuableFeature: answers.valuableFeature || answers.biggestChallenge || "",
        valuable_feature: answers.valuableFeature || answers.biggestChallenge || "",
        pricing: answers.pricing || answers.primaryGoal || "",
        behaviors: answers.behaviors || answers.primaryMarkets || [],
      };
    });

    return res.status(200).json(flattedSubmissions);
  } catch (error: any) {
    console.error("Fetch Submissions Admin Error:", error);
    return res.status(500).json({ error: "Internal server error fetching administrative records." });
  }
});

// GET /api/profile - Fetch authenticated user profile
router.get("/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (profiles.length === 0) {
      return res.status(200).json({ riskTolerance: "Moderate", stylePreference: null, riskMetrics: null });
    }

    return res.status(200).json({
      experience: profiles[0].experience,
      painScale: profiles[0].painScale,
      behaviors: profiles[0].behaviors,
      valuableFeature: profiles[0].valuableFeature,
      pricing: profiles[0].pricing,
      riskTolerance: profiles[0].riskTolerance || "Moderate",
      stylePreference: profiles[0].stylePreference || null,
      riskMetrics: profiles[0].riskMetrics || null,
    });
  } catch (error: any) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ error: "Internal server error fetching profile." });
  }
});

// POST /api/profile - Create or update authenticated user profile (e.g. riskTolerance, stylePreference, riskMetrics)
router.post("/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { riskTolerance, experience, painScale, behaviors, valuableFeature, pricing, stylePreference, riskMetrics } = req.body;

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

    if (profiles.length > 0) {
      await db.update(userProfiles).set({
        ...(riskTolerance !== undefined && { riskTolerance }),
        ...(experience !== undefined && { experience }),
        ...(painScale !== undefined && { painScale: Number(painScale) }),
        ...(behaviors !== undefined && { behaviors }),
        ...(valuableFeature !== undefined && { valuableFeature }),
        ...(pricing !== undefined && { pricing }),
        ...(stylePreference !== undefined && { stylePreference }),
        ...(riskMetrics !== undefined && { riskMetrics }),
      }).where(eq(userProfiles.userId, userId));
    } else {
      await db.insert(userProfiles).values({
        userId,
        riskTolerance: riskTolerance || "Moderate",
        experience: experience || null,
        painScale: painScale ? Number(painScale) : null,
        behaviors: behaviors || null,
        valuableFeature: valuableFeature || null,
        pricing: pricing || null,
        stylePreference: stylePreference || null,
        riskMetrics: riskMetrics || null,
      });
    }

    return res.status(200).json({ success: true, message: "Profile updated successfully." });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({ error: "Internal server error updating profile." });
  }
});

// POST /api/profile/reset-quiz - Resets the style preference string back to null
router.post("/profile/reset-quiz", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

    if (profiles.length > 0) {
      await db.update(userProfiles).set({
        stylePreference: null,
        riskMetrics: null,
      }).where(eq(userProfiles.userId, userId));
    }

    return res.status(200).json({ success: true, message: "Quiz preference reset successfully." });
  } catch (error: any) {
    console.error("Profile Quiz Reset Error:", error);
    return res.status(500).json({ error: "Internal server error resetting quiz preference." });
  }
});

export default router;
