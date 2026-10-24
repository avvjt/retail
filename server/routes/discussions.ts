import { Router, Response } from "express";
import { db } from "../db";
import { discussionPosts, discussionComments, users } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticateJWT, optionalAuth, AuthenticatedRequest } from "../middleware/auth";
import { checkCompliance } from "../utils/compliance";

const router = Router();

// GET /api/discussions - paginated list of posts, newest first, author email, comment count via subquery
router.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const posts = await db.select({
      id: discussionPosts.id,
      userId: discussionPosts.userId,
      content: discussionPosts.content,
      createdAt: discussionPosts.createdAt,
      editedAt: discussionPosts.editedAt,
      flagged: discussionPosts.flagged,
      authorEmail: users.email,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM discussion_comments WHERE discussion_comments.post_id = ${discussionPosts.id})`.as("comment_count")
    })
    .from(discussionPosts)
    .innerJoin(users, eq(discussionPosts.userId, users.id))
    .orderBy(desc(discussionPosts.createdAt))
    .limit(limit)
    .offset(offset);

    const totalResult = await db.select({
      count: sql<number>`COUNT(*)::int`
    }).from(discussionPosts);
    const total = totalResult[0]?.count || 0;

    return res.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error retrieving discussions:", error);
    return res.status(500).json({ error: "Failed to load discussions" });
  }
});

// POST /api/discussions - create new post, with character count limit (2000) and compliance checking
router.post("/", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Content cannot be empty" });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: "Content cannot exceed 2000 characters" });
    }

    // Run compliance moderation check
    const compliance = checkCompliance(content);
    if (compliance.flagged) {
      return res.status(400).json({
        error: "Posts can't contain trade recommendations or buy/sell calls — please rephrase as a description of what you observed."
      });
    }

    const newPost = await db.insert(discussionPosts).values({
      userId: req.user!.userId,
      content: content.trim()
    }).returning();

    // Fetch the full post info (with author email) to send back
    const fullPostResult = await db.select({
      id: discussionPosts.id,
      userId: discussionPosts.userId,
      content: discussionPosts.content,
      createdAt: discussionPosts.createdAt,
      editedAt: discussionPosts.editedAt,
      flagged: discussionPosts.flagged,
      authorEmail: users.email,
      commentCount: sql<number>`0`.as("comment_count")
    })
    .from(discussionPosts)
    .innerJoin(users, eq(discussionPosts.userId, users.id))
    .where(eq(discussionPosts.id, newPost[0].id))
    .limit(1);

    return res.status(201).json(fullPostResult[0]);
  } catch (error) {
    console.error("Error creating discussion post:", error);
    return res.status(500).json({ error: "Failed to create discussion post" });
  }
});

// GET /api/discussions/:id - retrieve single post and its comments (oldest first), joined with author email
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const postResult = await db.select({
      id: discussionPosts.id,
      userId: discussionPosts.userId,
      content: discussionPosts.content,
      createdAt: discussionPosts.createdAt,
      editedAt: discussionPosts.editedAt,
      flagged: discussionPosts.flagged,
      authorEmail: users.email
    })
    .from(discussionPosts)
    .innerJoin(users, eq(discussionPosts.userId, users.id))
    .where(eq(discussionPosts.id, postId))
    .limit(1);

    if (postResult.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = postResult[0];

    const commentsList = await db.select({
      id: discussionComments.id,
      postId: discussionComments.postId,
      userId: discussionComments.userId,
      content: discussionComments.content,
      createdAt: discussionComments.createdAt,
      flagged: discussionComments.flagged,
      authorEmail: users.email
    })
    .from(discussionComments)
    .innerJoin(users, eq(discussionComments.userId, users.id))
    .where(eq(discussionComments.postId, postId))
    .orderBy(discussionComments.createdAt);

    return res.json({
      post,
      comments: commentsList
    });
  } catch (error) {
    console.error("Error retrieving discussion post details:", error);
    return res.status(500).json({ error: "Failed to retrieve discussion post details" });
  }
});

// POST /api/discussions/:id/comments - create comment, validate <= 500 chars, compliance checking
router.post("/:id/comments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Verify post exists
    const postExists = await db.select({ id: discussionPosts.id }).from(discussionPosts).where(eq(discussionPosts.id, postId)).limit(1);
    if (postExists.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: "Comment cannot exceed 500 characters" });
    }

    // Run compliance moderation check
    const compliance = checkCompliance(content);
    if (compliance.flagged) {
      return res.status(400).json({
        error: "Posts can't contain trade recommendations or buy/sell calls — please rephrase as a description of what you observed."
      });
    }

    const newComment = await db.insert(discussionComments).values({
      postId,
      userId: req.user!.userId,
      content: content.trim()
    }).returning();

    // Fetch comment with user email
    const fullCommentResult = await db.select({
      id: discussionComments.id,
      postId: discussionComments.postId,
      userId: discussionComments.userId,
      content: discussionComments.content,
      createdAt: discussionComments.createdAt,
      flagged: discussionComments.flagged,
      authorEmail: users.email
    })
    .from(discussionComments)
    .innerJoin(users, eq(discussionComments.userId, users.id))
    .where(eq(discussionComments.id, newComment[0].id))
    .limit(1);

    return res.status(201).json(fullCommentResult[0]);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

// DELETE /api/discussions/:id - delete a post (only original author or admin)
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const postResult = await db.select({ userId: discussionPosts.userId }).from(discussionPosts).where(eq(discussionPosts.id, postId)).limit(1);
    if (postResult.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = postResult[0];
    const isAuthor = post.userId === req.user!.userId;
    const isAdmin = req.user!.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to delete this post" });
    }

    await db.delete(discussionPosts).where(eq(discussionPosts.id, postId));
    return res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

// DELETE /api/discussions/:id/comments/:commentId - delete a comment (only original author or admin)
router.delete("/:id/comments/:commentId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    if (isNaN(postId) || isNaN(commentId)) {
      return res.status(400).json({ error: "Invalid post ID or comment ID" });
    }

    const commentResult = await db.select({ userId: discussionComments.userId }).from(discussionComments).where(eq(discussionComments.id, commentId)).limit(1);
    if (commentResult.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = commentResult[0];
    const isAuthor = comment.userId === req.user!.userId;
    const isAdmin = req.user!.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to delete this comment" });
    }

    await db.delete(discussionComments).where(eq(discussionComments.id, commentId));
    return res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
