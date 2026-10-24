import { Router, Response } from "express";
import { db } from "../db";
import { communityPosts, strategies, users, strategyFollows, strategyPostComments } from "../schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticateJWT, optionalAuth, AuthenticatedRequest } from "../middleware/auth";
import { checkCompliance } from "../utils/compliance";

const router = Router();

// GET /api/community/posts - Retrieve shared community strategies
router.get("/posts", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postsList = await db.select({
      id: communityPosts.id,
      userId: communityPosts.userId,
      strategyId: communityPosts.strategyId,
      winRate: communityPosts.winRate,
      totalTrades: communityPosts.totalTrades,
      sharedAt: communityPosts.sharedAt,
    }).from(communityPosts).orderBy(desc(communityPosts.sharedAt));

    const formatted: any[] = [];
    for (const post of postsList) {
      const creator = await db.select({ email: users.email }).from(users).where(eq(users.id, post.userId)).limit(1);
      const strategy = await db.select({ name: strategies.name, rulesJson: strategies.rulesJson }).from(strategies).where(eq(strategies.id, post.strategyId)).limit(1);

      if (creator.length > 0 && strategy.length > 0) {
        const rules = strategy[0].rulesJson as any;
        formatted.push({
          id: post.id,
          userId: post.userId,
          creatorEmail: creator[0].email,
          strategyName: strategy[0].name,
          rulesJson: rules,
          winRate: post.winRate,
          totalTrades: post.totalTrades,
          sharedAt: post.sharedAt,
          description: rules?.description || "A shared trading strategy based on custom risk parameters."
        });
      }
    }

    return res.json(formatted);
  } catch (error: any) {
    console.error("Failed to query community posts:", error);
    return res.status(500).json({ error: "Failed to retrieve community feed posts." });
  }
});

// POST /api/community/share - Share strategy with community
router.post("/share", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { strategyId, winRate, totalTrades, title, description, rulesJson } = req.body;

  if (!winRate) {
    return res.status(400).json({ error: "Missing required field: winRate" });
  }
  if (!totalTrades) {
    return res.status(400).json({ error: "Missing required field: totalTrades" });
  }

  try {
    let finalStrategyId: number;

    if (strategyId) {
      // Verify strategy belongs to user
      const strat = await db.select()
        .from(strategies)
        .where(and(eq(strategies.id, Number(strategyId)), eq(strategies.userId, user.userId)))
        .limit(1);

      if (strat.length === 0) {
        return res.status(404).json({ error: "Strategy not found or unauthorized" });
      }
      finalStrategyId = Number(strategyId);
    } else {
      // Sharing on-the-fly from the form
      if (!title || !rulesJson) {
        return res.status(400).json({ error: "Missing title or rulesJson parameters" });
      }

      // Compliance checks
      const textToCompliance = `${title} ${description || ""}`;
      const compliance = checkCompliance(textToCompliance);
      if (compliance.flagged) {
        return res.status(400).json({
          error: `Strategy name/notes contain restricted or non-compliant advisory terms: "${compliance.matchedTerm}". Please rephrase describing metrics/criteria instead.`
        });
      }

      const mergedRules = {
        ...rulesJson,
        description: description ? description.trim() : ""
      };

      // Dynamically insert new strategy for the user
      const [newStrat] = await db.insert(strategies).values({
        userId: user.userId,
        name: title.trim(),
        rulesJson: mergedRules,
        active: true
      }).returning();

      finalStrategyId = newStrat.id;
    }

    const inserted = await db.insert(communityPosts).values({
      userId: user.userId,
      strategyId: finalStrategyId,
      winRate: String(winRate),
      totalTrades: Number(totalTrades)
    }).returning();

    return res.json({
      success: true,
      message: "Strategy shared with community feed!",
      post: {
        id: inserted[0].id,
        userId: inserted[0].userId,
        strategyId: inserted[0].strategyId,
        winRate: inserted[0].winRate,
        totalTrades: inserted[0].totalTrades,
        sharedAt: inserted[0].sharedAt
      }
    });
  } catch (error: any) {
    console.error("Community sharing error:", error);
    return res.status(500).json({ error: "Failed to share strategy" });
  }
});

// POST /api/community/copy (and alias /clone) - Clone a shared strategy ruleset to user's strategies
router.post(["/copy", "/clone"], authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { communityPostId, postId } = req.body;
  const targetPostId = communityPostId || postId;

  if (!targetPostId) {
    return res.status(400).json({ error: "Missing communityPostId or postId parameter" });
  }

  try {
    // Fetch community post
    const post = await db.select()
      .from(communityPosts)
      .where(eq(communityPosts.id, Number(targetPostId)))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: "Community post not found" });
    }

    // Fetch original strategy details
    const origStrat = await db.select()
      .from(strategies)
      .where(eq(strategies.id, post[0].strategyId))
      .limit(1);

    if (origStrat.length === 0) {
      return res.status(404).json({ error: "Original strategy rules not found" });
    }

    // Insert cloned strategy rules under current user
    const clonedStrat = await db.insert(strategies).values({
      userId: user.userId,
      name: `${origStrat[0].name} (Copy)`,
      rulesJson: origStrat[0].rulesJson,
      active: false
    }).returning();

    // Log tracking follow record
    await db.insert(strategyFollows).values({
      userId: user.userId,
      communityPostId: Number(targetPostId)
    });

    return res.json({
      success: true,
      message: "Successfully cloned strategy to your private Algo Builder!",
      strategy: clonedStrat[0]
    });
  } catch (error: any) {
    console.error("Strategy cloning failed:", error);
    return res.status(500).json({ error: "Failed to clone community strategy ruleset." });
  }
});

// GET /api/community/posts/:id/comments - Fetch comments for a community post
router.get("/posts/:id/comments", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  try {
    const comments = await db.select({
      id: strategyPostComments.id,
      postId: strategyPostComments.postId,
      userId: strategyPostComments.userId,
      content: strategyPostComments.content,
      createdAt: strategyPostComments.createdAt,
    })
    .from(strategyPostComments)
    .where(eq(strategyPostComments.postId, postId))
    .orderBy(desc(strategyPostComments.createdAt));

    const enrichedComments = [];
    for (const comment of comments) {
      const commenter = await db.select({ email: users.email }).from(users).where(eq(users.id, comment.userId)).limit(1);
      if (commenter.length > 0) {
        enrichedComments.push({
          id: comment.id,
          postId: comment.postId,
          userId: comment.userId,
          content: comment.content,
          createdAt: comment.createdAt,
          commenterEmail: commenter[0].email,
        });
      }
    }

    return res.json(enrichedComments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return res.status(500).json({ error: "Failed to retrieve strategy comments." });
  }
});

// POST /api/community/posts/:id/comments - Post a new comment
router.post("/posts/:id/comments", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const postId = Number(id);
  const user = req.user!;
  const { content } = req.body;

  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment content cannot be empty" });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: "Comment cannot exceed 500 characters" });
  }

  try {
    const compliance = checkCompliance(content);
    if (compliance.flagged) {
      return res.status(400).json({
        error: `Comment content contains restricted or non-compliant advisory terms: "${compliance.matchedTerm}". Please rephrase.`
      });
    }

    const [inserted] = await db.insert(strategyPostComments).values({
      postId: postId,
      userId: user.userId,
      content: content.trim(),
    }).returning();

    const commenter = await db.select({ email: users.email }).from(users).where(eq(users.id, user.userId)).limit(1);

    return res.status(201).json({
      id: inserted.id,
      postId: inserted.postId,
      userId: inserted.userId,
      content: inserted.content,
      createdAt: inserted.createdAt,
      commenterEmail: commenter[0]?.email || "Unknown User",
    });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return res.status(500).json({ error: "Failed to add comment to strategy post." });
  }
});

export default router;
