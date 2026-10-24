/**
 * SEBI Compliance helper to check for directional or advisory language in posts and comments.
 * Returns information on whether the text is flagged and which term triggered it.
 */
export function checkCompliance(text: string): { flagged: boolean; matchedTerm?: string } {
  if (!text) return { flagged: false };

  // Combine terms from server/routes/market.ts and specific requested terms
  const bannedTerms = [
    "buy",
    "sell",
    "short",
    "exit",
    "target",
    "stop-loss",
    "stop loss",
    "signal",
    "signals",
    "recommendation",
    "recommendations",
    "recommended",
    "predict",
    "forecast",
    "guarantee",
    "guaranteed",
    "sure shot",
    "sureshot",
    "target price",
    "tip",
    "tips",
    "bullish",
    "bearish",
    "confidence score",
    "alpha",
    "edge"
  ];

  const lowerText = text.toLowerCase();

  for (const term of bannedTerms) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedTerm}\\b`, "i");
    if (regex.test(lowerText)) {
      // If the term is "short", ignore it if it is part of common brief/time descriptors rather than short-selling
      if (term === "short") {
        const safePatterns = /\bshort[- ]?(term|post|message|text|obs|description|time|run|note|form|comment|observation|discussion|brief|summary|capsule|intro)\b/i;
        if (safePatterns.test(lowerText)) {
          // Check if there are any OTHER occurrences of "short" that are not safe
          const cleanedText = lowerText.replace(safePatterns, "");
          if (!regex.test(cleanedText)) {
            continue; // Safe occurrence, skip flagging
          }
        }
      }
      return { flagged: true, matchedTerm: term };
    }
  }

  return { flagged: false };
}
