import { Router, Response } from "express";
import { db } from "../db";
import { sentimentScores } from "../schema";
import { desc } from "drizzle-orm";
import { optionalAuth, AuthenticatedRequest } from "../middleware/auth";
import { createBluemindsCompletion } from "../blueminds";

const router = Router();

// GET /api/watchlist/sentiment - Get saved stock sentiments from real analyses
router.get("/sentiment", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await db.select()
      .from(sentimentScores)
      .orderBy(desc(sentimentScores.createdAt));

    // Deduplicate to get latest score for each symbol
    const map = new Map<string, any>();
    list.forEach(item => {
      if (!map.has(item.symbol)) {
        map.set(item.symbol, item);
      }
    });

    return res.json(Array.from(map.values()));
  } catch (err) {
    console.error("Failed to query sentiment list:", err);
    return res.status(500).json({ error: "Failed to load stock sentiment watchlist." });
  }
});

// POST /api/watchlist/analyze - Run dynamic AI news parsing for a ticker powered by GPT 5.5
router.post("/analyze", async (req: AuthenticatedRequest, res: Response) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: "Missing stock ticker symbol" });
  }

  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    let score: number | null = null;
    let analysisSummary = "";

    const prompt = `
Analyze the short-term financial news sentiment for the Indian stock ticker "${cleanSymbol}".
Assign a single composite sentiment score on a scale from -100 (extreme net outflow) to +100 (extreme net inflow).
Provide a concise 2-sentence market explanation detailing recent triggers, volume trends, or institutional flow.

Return your response ONLY as a valid JSON object matching the exact format:
{
  "score": 45,
  "summary": "Brief 2-sentence reasoning."
}
Do not output any markdown blocks (no \`\`\`json, no \`\`\`), do not include any text other than the JSON object.`;

    try {
      const completionText = await createBluemindsCompletion({
        messages: [
          { role: "system", content: "You are a quantitative financial sentiment analyst powered by GPT 5.5." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      let text = completionText.trim();
      if (text.includes("```")) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          text = match[1].trim();
        } else {
          text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        }
      }
      
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      const data = JSON.parse(text);
      if (typeof data.score === "number") {
        score = data.score;
      } else if (typeof data.score === "string") {
        const parsedScore = parseInt(data.score, 10);
        if (!isNaN(parsedScore)) {
          score = parsedScore;
        }
      }
      if (data.summary) {
        analysisSummary = data.summary;
      }
    } catch (apiErr: any) {
      console.warn("Blueminds GPT 5.5 watchlist sentiment error:", apiErr?.message || apiErr);
      return res.status(503).json({ error: "Sentiment analysis unavailable for this ticker at this time." });
    }

    if (score === null) {
      return res.status(503).json({ error: "Sentiment analysis unavailable for this ticker at this time." });
    }

    // Save real sentiment score to DB
    const inserted = await db.insert(sentimentScores).values({
      symbol: cleanSymbol,
      score,
      source: "AI Analyst"
    }).returning();

    return res.json({
      id: inserted[0].id,
      symbol: cleanSymbol,
      score,
      summary: analysisSummary || "Sentiment analysis completed successfully.",
      createdAt: inserted[0].createdAt
    });
  } catch (error: any) {
    console.error("Watchlist analyzer failed:", error);
    return res.status(500).json({ error: "Failed to perform AI sentiment analysis." });
  }
});

export default router;
