import { db } from "../server/db";
import { 
  smartMoneySignals, 
  sentimentScores, 
  discussionPosts, 
  discussionComments, 
  communityPosts, 
  strategies, 
  strategyFollows, 
  strategyPostComments, 
  courses, 
  courseProgress, 
  users 
} from "../server/schema";
import { eq, or, inArray, and } from "drizzle-orm";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(isDryRun 
    ? "🔍 [DRY RUN] Checking database for fabricated/seeded data (no changes will be made)...\n"
    : "🧹 Starting production database cleanup of fabricated/seeded data...\n"
  );

  try {
    // 1. Delete all smart_money_signals rows
    const signalsCount = isDryRun
      ? (await db.select({ id: smartMoneySignals.id }).from(smartMoneySignals)).length
      : (await db.delete(smartMoneySignals).returning({ id: smartMoneySignals.id })).length;
    console.log(`[1/5] ${isDryRun ? "Would delete" : "Deleted"} smart_money_signals rows: ${signalsCount}`);

    // 2. Delete exact seeded sentiment_scores (symbol, score) pairs with source = 'AI Analyst'
    const seededSentimentPairs = [
      { symbol: "RELIANCE", score: 75 },
      { symbol: "TCS", score: 55 },
      { symbol: "INFY", score: -20 },
      { symbol: "HDFCBANK", score: 82 },
      { symbol: "ICICIBANK", score: 68 },
      { symbol: "TATASTEEL", score: 40 },
    ];

    const seededSentimentCondition = and(
      eq(sentimentScores.source, "AI Analyst"),
      or(
        ...seededSentimentPairs.map(p =>
          and(eq(sentimentScores.symbol, p.symbol), eq(sentimentScores.score, p.score))
        )
      )
    );

    const sentimentsCount = isDryRun
      ? (await db.select({ id: sentimentScores.id }).from(sentimentScores).where(seededSentimentCondition)).length
      : (await db.delete(sentimentScores).where(seededSentimentCondition).returning({ id: sentimentScores.id })).length;
    console.log(`[2/5] ${isDryRun ? "Would delete" : "Deleted"} seeded sentiment_scores (source='AI Analyst'): ${sentimentsCount}`);

    // 3. Find and delete seeded users & their posts/comments/strategies
    const fakeEmails = [
      "market.analyst@retailx.in",
      "market.master@retailx.in",
      "system.seed@retailx.in"
    ];

    const fakeUsers = await db.select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.email, fakeEmails));

    console.log(`[3/5] Found fake/seeded users: ${fakeUsers.length} (${fakeUsers.map(u => u.email).join(', ') || 'None'})`);

    if (fakeUsers.length > 0) {
      const fakeUserIds = fakeUsers.map(u => u.id);

      // Delete comments by these users
      const commentsCount = isDryRun
        ? (await db.select({ id: discussionComments.id }).from(discussionComments).where(inArray(discussionComments.userId, fakeUserIds))).length
        : (await db.delete(discussionComments).where(inArray(discussionComments.userId, fakeUserIds)).returning({ id: discussionComments.id })).length;
      console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} discussion comments by fake users: ${commentsCount}`);

      const stratCommentsCount = isDryRun
        ? (await db.select({ id: strategyPostComments.id }).from(strategyPostComments).where(inArray(strategyPostComments.userId, fakeUserIds))).length
        : (await db.delete(strategyPostComments).where(inArray(strategyPostComments.userId, fakeUserIds)).returning({ id: strategyPostComments.id })).length;
      console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} strategy comments by fake users: ${stratCommentsCount}`);

      // Delete discussion posts by these users
      const postsCount = isDryRun
        ? (await db.select({ id: discussionPosts.id }).from(discussionPosts).where(inArray(discussionPosts.userId, fakeUserIds))).length
        : (await db.delete(discussionPosts).where(inArray(discussionPosts.userId, fakeUserIds)).returning({ id: discussionPosts.id })).length;
      console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} discussion posts by fake users: ${postsCount}`);

      // Delete community posts by these users
      const commPostsCount = isDryRun
        ? (await db.select({ id: communityPosts.id }).from(communityPosts).where(inArray(communityPosts.userId, fakeUserIds))).length
        : (await db.delete(communityPosts).where(inArray(communityPosts.userId, fakeUserIds)).returning({ id: communityPosts.id })).length;
      console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} community posts by fake users: ${commPostsCount}`);

      // Delete strategies by these users
      const stratsCount = isDryRun
        ? (await db.select({ id: strategies.id }).from(strategies).where(inArray(strategies.userId, fakeUserIds))).length
        : (await db.delete(strategies).where(inArray(strategies.userId, fakeUserIds)).returning({ id: strategies.id })).length;
      console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} strategies by fake users: ${stratsCount}`);

      // Delete fake users
      const usersCount = isDryRun
        ? fakeUsers.length
        : (await db.delete(users).where(inArray(users.id, fakeUserIds)).returning({ id: users.id })).length;
      console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} fake user accounts: ${usersCount}`);
    }

    // 4. Delete seeded placeholder courses (Rickroll / placeholder youtube URLs) and only their course progress
    const targetCourses = await db.select({ id: courses.id })
      .from(courses)
      .where(or(
        eq(courses.videoUrl, "https://www.youtube.com/embed/dQw4w9WgXcQ"),
        eq(courses.title, "Risk Management & The 1% Rule for Retail Traders"),
        eq(courses.title, "Price Action & Market Structure Breakdown"),
        eq(courses.title, "Options Greeks Explained: Delta, Theta Decay & Implied Volatility"),
        eq(courses.title, "Mastering Trading Psychology: Conquering FOMO & Tilt"),
        eq(courses.title, "Quantitative Order Flow & Institutional Tracking")
      ));

    const targetCourseIds = targetCourses.map(c => c.id);

    let progressCount = 0;
    let coursesCount = 0;

    if (targetCourseIds.length > 0) {
      progressCount = isDryRun
        ? (await db.select({ id: courseProgress.id }).from(courseProgress).where(inArray(courseProgress.courseId, targetCourseIds))).length
        : (await db.delete(courseProgress).where(inArray(courseProgress.courseId, targetCourseIds)).returning({ id: courseProgress.id })).length;

      coursesCount = isDryRun
        ? targetCourseIds.length
        : (await db.delete(courses).where(inArray(courses.id, targetCourseIds)).returning({ id: courses.id })).length;
    }

    console.log(`[4/5] ${isDryRun ? "Would delete" : "Deleted"} course_progress rows for target courses: ${progressCount}`);
    console.log(`   - ${isDryRun ? "Would delete" : "Deleted"} seeded courses: ${coursesCount}`);

    console.log(isDryRun
      ? "\n✅ [DRY RUN] Inspection finished successfully (no records modified)."
      : "\n✅ Production database cleanup finished successfully!"
    );
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
