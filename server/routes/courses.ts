import { Router, Response } from "express";
import { db } from "../db";
import { courses, courseProgress, users } from "../schema";
import { eq, and } from "drizzle-orm";
import { authenticateJWT, optionalAuth, AuthenticatedRequest } from "../middleware/auth";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

// Configure Cloudinary only if fully provided in the environmental variables
const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Admin eligibility helper
function checkIsAdmin(req: AuthenticatedRequest): boolean {
  if (!req.user) return false;
  const email = req.user.email?.toLowerCase();
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  return req.user.isAdmin === true || email === ADMIN_EMAIL;
}

// 1. GET /api/courses - List all published courses, with completed state relative to current user
router.get("/courses", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Retrieve all database courses
    const allCourses = await db.select().from(courses);
    
    // Retrieve progress rows for this specific user if logged in
    const userProgress = userId
      ? await db.select().from(courseProgress).where(eq(courseProgress.userId, userId))
      : [];

    const enrichedCourses = allCourses.map((c) => {
      const match = userProgress.find((p) => p.courseId === c.id);
      return {
        ...c,
        completed: match ? match.completed : false
      };
    });

    return res.status(200).json(enrichedCourses);
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return res.status(500).json({ error: "Failed to fetch courses ledger." });
  }
});

// 2. POST /api/courses - Create course (Admin only)
router.post("/courses", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: "Forbidden: Administrative role required." });
    }

    const { title, topic, duration, videoUrl } = req.body;
    if (!title || !topic || !duration || !videoUrl) {
      return res.status(400).json({ error: "Missing required fields (title, topic, duration, videoUrl)." });
    }

    const [newCourse] = await db.insert(courses).values({
      title: title.trim(),
      topic: topic.trim(),
      duration: duration.trim(),
      videoUrl: videoUrl.trim(),
      isPublished: true,
    }).returning();

    return res.status(201).json(newCourse);
  } catch (error: any) {
    console.error("POST /api/courses error:", error);
    return res.status(500).json({ error: "Failed to create education course." });
  }
});

// 3. DELETE /api/courses/:id - Delete course (Admin only)
router.delete("/courses/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: "Forbidden: Administrative role required." });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid course identifier." });
    }

    await db.delete(courses).where(eq(courses.id, id));
    return res.status(200).json({ success: true, message: "Course deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/courses/:id error:", error);
    return res.status(500).json({ error: "Failed to delete education course." });
  }
});

// 4. POST /api/courses/:id/toggle-progress - Mark course completed/incomplete
router.post("/courses/:id/toggle-progress", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ error: "Invalid course parameters." });
    }

    // Verify course exists
    const match = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (match.length === 0) {
      return res.status(404).json({ error: "Target course not found." });
    }

    const existingProgress = await db
      .select()
      .from(courseProgress)
      .where(and(eq(courseProgress.userId, userId), eq(courseProgress.courseId, courseId)))
      .limit(1);

    if (existingProgress.length > 0) {
      // Toggle states or remove complete state
      const isCompletedNow = !existingProgress[0].completed;
      await db
        .update(courseProgress)
        .set({ completed: isCompletedNow })
        .where(eq(courseProgress.id, existingProgress[0].id));
      
      return res.status(200).json({ completed: isCompletedNow });
    } else {
      // Create completed entry
      await db.insert(courseProgress).values({
        userId,
        courseId,
        completed: true,
      });
      return res.status(200).json({ completed: true });
    }
  } catch (error: any) {
    console.error("POST /api/courses/:id/toggle-progress error:", error);
    return res.status(500).json({ error: "Failed to modify course progress state." });
  }
});

// 5. POST /api/admin/courses/upload - Server side file receiver proxying to Cloudinary
router.post("/admin/courses/upload", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: "Forbidden: Administrative token required." });
    }

    const { videoData, originalName } = req.body;
    if (!videoData) {
      return res.status(400).json({ error: "Missing uploaded video context data." });
    }

    // If Cloudinary keys aren't defined, proceed beautifully with fallback MP4 mock
    // This maintains zero startup crash loops & full functional preview
    if (!hasCloudinary) {
      console.warn("⚠️ Cloudinary variables not configured. Seamless fallback generated.");
      return res.status(200).json({
        url: "https://assets.mixkit.co/videos/preview/mixkit-trading-monitor-displays-financial-statistics-and-charts-39818-large.mp4",
        warning: "Cloudinary credentials not provided in .env - used high-speed financial video fallback.",
        name: originalName || "fallback-financial.mp4",
        duration: "2:15"
      });
    }

    console.log("☁️ Dispatching video stream payload to Cloudinary...");
    const result = await cloudinary.uploader.upload(videoData, {
      resource_type: "video",
      folder: "retailx_education",
    });

    console.log("✅ Cloudinary stream complete URL:", result.secure_url);

    let autoDuration = "";
    if (result.duration) {
      const totalSecs = Math.round(result.duration);
      const minutes = Math.floor(totalSecs / 60);
      const seconds = totalSecs % 60;
      autoDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      duration: autoDuration,
      success: true
    });
  } catch (error: any) {
    console.error("Cloudinary uploading proxy error:", error);
    return res.status(500).json({ error: error.message || "Failed to process video upload with Cloudinary." });
  }
});

export default router;
