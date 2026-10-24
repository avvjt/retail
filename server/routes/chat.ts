import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { chatSessions, chatMessages, trades, paperPositions, paperOrders, paperWallets, riskSettings } from "../schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { createBluemindsCompletion, ChatMessage } from "../blueminds";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { JWT_SECRET } from "../config";

const router = Router();

const systemInstruction = `You are "Guardian AI", the resident AI Behavioral Coach and RetailX performance psychologist powered by GPT 5.5.
Your priority is to act as an elite Trading Psychology expert, psychiatric performance coach, and institutional risk advisor.

Role & Tone:
- Professional, empathetic, highly analytical, clear, and grounded in behavioral finance.
- Speak in precise trading terminology (e.g., "drawdown", "tilt", "revenge trading", "R:R ratios", "cognitive styles", "FOMO", "position sizing").
- Never give direct financial calls or specify market direction. Focus purely on execution discipline, emotional control, and risk parameters.
- IMPORTANT: Support clean markdown rendering. Always format lists neatly, use normal markdown numbering (e.g., '1. Item', '2. Item') and asterisks for bullet points. Ensure titles, bold text (e.g., **Concept**), and paragraphs are balanced with clear spacing so it reads beautifully without feeling truncated or broken.

Context of RetailX:
- RetailX prevents emotional/impulsive trading with Tilt Control, Pre-Trade Checklists, Market Conditions indicators, and a rigorous, biometric Trade Journal.
- If users ask how RetailX works, briefly explain its core safety elements in under 3 sentences.

Access to Trades:
- When a user asks questions related to their losing streaks, emotional triggers, trading performance, portfolio statistics, history, or says terms like "why am I losing?", "analyze my trades", "my pnl", etc., you will be given access to their live database trade logs under a special section.
- You must carefully inspect their trade logs (average entry/exit prices, symbols, emotion states, notes, net profits/losses), find behavioral patterns (e.g., "all your large losses are logged under Revenge Trading or FOMO emotions", "your average loss on NIFTY50 is exceeding your risk tolerance"), and deliver exact, helpful clinical feedback to restore their trading discipline. Ensure to mention specific instruments, emotions, and pnl values where relevant!`;

// GET /api/chat/sessions - Retrieve all chat sessions for the active user
router.get("/chat/sessions", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Session missing." });
    }

    const sessionsList = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.userId, userId), eq(chatSessions.active, true)))
      .orderBy(desc(chatSessions.createdAt));

    return res.json(sessionsList);
  } catch (err) {
    console.error("Failed to fetch chat sessions:", err);
    return res.status(500).json({ error: "Failed to fetch chat sessions." });
  }
});

// POST /api/chat/sessions - Create a new chat session
router.post("/chat/sessions", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    const { title } = req.body;
    const sessionTitle = title && String(title).trim() !== "" ? title : `Session ${new Date().toLocaleDateString()}`;

    const [newSession] = await db
      .insert(chatSessions)
      .values({
        userId,
        title: sessionTitle,
        active: true,
      })
      .returning();

    return res.json(newSession);
  } catch (err) {
    console.error("Failed to create chat session:", err);
    return res.status(500).json({ error: "Failed to create chat session." });
  }
});

// GET /api/chat/sessions/:id/messages - Retrieve messages for a session
router.get("/chat/sessions/:id/messages", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sessionId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const messagesList = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.id);

    return res.json(messagesList);
  } catch (err) {
    console.error("Failed to fetch messages for session:", err);
    return res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// DELETE /api/chat/sessions/:id - Archive or delete a session
router.delete("/chat/sessions/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sessionId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    await db
      .update(chatSessions)
      .set({ active: false })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));

    return res.json({ success: true, message: "Chat session closed." });
  } catch (err) {
    console.error("Failed to delete chat session:", err);
    return res.status(500).json({ error: "Failed to delete chat session." });
  }
});

// POST /api/chat - Dynamic Behavioral AI Coach powered by GPT 5.5
router.post("/chat", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    let userId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string };
        userId = Number(decoded.userId);
      } catch (err) {
        console.warn("Invalid JWT in chat, continuing in guest mode");
      }
    }

    const { message, sessionId, history } = req.body;

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ error: "Message is required." });
    }

    let activeSessionId = sessionId ? Number(sessionId) : null;
    if (userId && !activeSessionId) {
      const activeSessions = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.userId, userId), eq(chatSessions.active, true)))
        .orderBy(desc(chatSessions.createdAt))
        .limit(1);

      if (activeSessions.length > 0) {
        activeSessionId = activeSessions[0].id;
      } else {
        const titleSnippet = message.slice(0, 30) + (message.length > 30 ? "..." : "");
        const [newSess] = await db
          .insert(chatSessions)
          .values({
            userId,
            title: `Session: ${titleSnippet}`,
            active: true,
          })
          .returning();
        activeSessionId = newSess.id;
      }
    }

    if (userId && activeSessionId) {
      await db.insert(chatMessages).values({
        sessionId: activeSessionId,
        role: "user",
        text: message,
      });
    }

    // Trade journal & Paper Trading context injection
    let tradesContext = "";
    if (userId) {
      const lowerQuery = message.toLowerCase();
      const matchesConditionalKeywords = [
        "loss", "lose", "losing", "win", "winning", "streak", "trade", "trading", "profit", "pnl", 
        "history", "records", "emotion", "feeling", "disciplined", "discipline", "fomo", "revenge", "tilt", 
        "analys", "anxious", "nervous", "paper", "review", "order", "position", "wallet", "balance", "guard", "performance"
      ].some(word => lowerQuery.includes(word));

      if (matchesConditionalKeywords) {
        // 1. Fetch Closed Paper Trades
        const closedPaperTrades = await db
          .select()
          .from(paperPositions)
          .where(and(eq(paperPositions.userId, userId), eq(paperPositions.status, "closed")))
          .orderBy(desc(paperPositions.closedAt))
          .limit(20);

        // 2. Fetch Open Paper Positions
        const openPaperPositions = await db
          .select()
          .from(paperPositions)
          .where(and(eq(paperPositions.userId, userId), eq(paperPositions.status, "open")))
          .orderBy(desc(paperPositions.openedAt));

        // 3. Fetch Paper Wallet
        const [wallet] = await db
          .select()
          .from(paperWallets)
          .where(eq(paperWallets.userId, userId))
          .limit(1);

        // 4. Fetch Manual Trade Journal Entries
        const userTrades = await db
          .select()
          .from(trades)
          .where(eq(trades.userId, userId))
          .orderBy(desc(trades.createdAt))
          .limit(20);

        // 5. Fetch Risk Settings
        const [userRisk] = await db
          .select()
          .from(riskSettings)
          .where(eq(riskSettings.userId, userId))
          .limit(1);

        let paperContextSection = "";
        if (closedPaperTrades.length > 0 || openPaperPositions.length > 0 || wallet) {
          const closedBullets = closedPaperTrades.length > 0
            ? closedPaperTrades.map(p => {
                return `- **Closed Trade**: ${p.symbol} (${p.side?.toUpperCase()} ${p.quantity} lots), Entry: ₹${p.entryPrice}, Exit: ₹${p.exitPrice || "N/A"}, Realized P&L: ₹${p.realizedPnl || 0}, Reason: ${p.exitReason || "manual"}, Closed At: ${p.closedAt ? new Date(p.closedAt).toLocaleString('en-IN') : 'N/A'}`;
              }).join("\n")
            : "No closed paper trades yet.";

          const openBullets = openPaperPositions.length > 0
            ? openPaperPositions.map(p => {
                return `- **Open Position**: ${p.symbol} (${p.side?.toUpperCase()} ${p.quantity} lots), Entry: ₹${p.entryPrice}, Stop Loss: ₹${p.stopLoss || "None"}, Target: ₹${p.targetPrice || "None"}, Unrealized P&L: ₹${p.unrealizedPnl || 0}`;
              }).join("\n")
            : "No active open positions.";

          const calculatedPnl = wallet ? (Number(wallet.balance) - Number(wallet.startingBalance)).toFixed(2) : "0.00";
          const walletInfo = wallet
            ? `Virtual Balance: ₹${wallet.balance} (Starting: ₹${wallet.startingBalance}, Total Realized P&L: ₹${calculatedPnl})`
            : "Virtual Balance: ₹5,00,000 (Initial Sandbox)";

          paperContextSection = `
[USER PAPER TRADING DATA INJECTION]
${walletInfo}
### Active Open Paper Positions:
${openBullets}

### Recent Closed Paper Trades (Simulated Execution):
${closedBullets}
[END PAPER TRADING DATA]
`;
        }

        let journalContextSection = "";
        if (userTrades.length > 0) {
          const tradeBullets = userTrades.map(t => {
            return `- **Date**: ${t.tradeTime || t.createdAt}, **Security**: ${t.instrument}, **Entry**: ${t.entryPrice}, **Exit**: ${t.exitPrice}, **Net P&L**: ₹${t.pnl}, **Emotion State**: ${t.emotion}, **Execution Notes**: ${t.notes || "None"}`;
          }).join("\n");
          journalContextSection = `
[TRADING JOURNAL INJECTED CONTEXT]
Here are the user's manual trade journal records:
${tradeBullets}
[END JOURNAL INJECTION]
`;
        }

        let riskConfigSection = "";
        if (userRisk) {
          riskConfigSection = `
[USER RISK GUARD RULES]
Max Loss Per Day: ₹${userRisk.maxDailyLoss || 5000}, Max Loss Per Trade: ₹${userRisk.maxRiskPerTrade || 2000}, Max Drawdown: ₹${userRisk.maxDrawdown || 10000}, Capital Base: ₹${userRisk.capitalBase || 100000}
[END RISK RULES]
`;
        }

        if (paperContextSection || journalContextSection || riskConfigSection) {
          tradesContext = `${paperContextSection}\n${journalContextSection}\n${riskConfigSection}`;
        } else {
          tradesContext = `\n\n[TRADING CONTEXT]\nUser has not placed any paper trades or logged manual journal trades yet. Politely invite them to place a simulated order in the "Paper Trading" tab or log a trade in the "Trade Journal" tab so you can analyze their performance.\n[END CONTEXT]\n`;
        }
      }
    }

    // Build ChatMessage sequence for Blueminds GPT 5.5
    const messages: ChatMessage[] = [
      { role: "system", content: systemInstruction + (tradesContext ? `\n\n${tradesContext}` : "") }
    ];

    if (history && Array.isArray(history) && history.length > 0) {
      history.forEach((h: any) => {
        const role = (h.role === "model" || h.role === "assistant" || h.sender === "coach") ? "assistant" : "user";
        const content = h.text || h.content || "";
        if (content) {
          messages.push({ role, content });
        }
      });
    } else if (userId && activeSessionId) {
      const previousDbMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, activeSessionId))
        .orderBy(chatMessages.id);

      const recentMessages = previousDbMessages.slice(-15);
      recentMessages.forEach((msg) => {
        if (msg.text !== message || msg.role !== "user") {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          });
        }
      });
    }

    messages.push({
      role: "user",
      content: message
    });

    let reply = "";
    try {
      reply = await createBluemindsCompletion({
        messages,
        temperature: 0.7,
      });

      if (!reply) {
        reply = "I apologize, but my diagnostic network response is empty. Let me know how I can help you with your discipline.";
      }
    } catch (err: any) {
      console.warn("AI Coach Blueminds GPT 5.5 model warning, providing high-quality psycho-behavioral fallback dialogue:", err?.message || err);

      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("loss") || lowerMessage.includes("lost") || lowerMessage.includes("pnl")) {
        reply = `### **Guardian AI | Behavioral Recovery Protocol**

It looks like you're processing a loss right now. Let me share some quick guidance to help ground your emotional state:

1. **The Post-Loss Illusion**: Your mind immediately wants to fight the market to "win back" capital. This is called **Revenge Trading** and is responsible for 90% of account blowouts.
2. **Immediate Checklist**:
   - Close all active tabs for 15 minutes.
   - Do not open a new order out of frustration.
   - Log the emotion "FOMO" or "Revenge" in your Trade Journal.
3. **Guard Duty**: Remember, a single bad trade does not define you. Your edge is defined by consistent execution over 100 trials, not 1.

*My server is currently operating with local guardrails active, standing safeguard over your capital.*`;
      } else if (lowerMessage.includes("fomo") || lowerMessage.includes("chasing") || lowerMessage.includes("missed")) {
        reply = `### **Guardian AI | Execution Discipline Check**

Sensing FOMO or fear of missing out is completely natural, but here's the reality:

- **Infinite Stream**: The market offers hundreds of structured movements every day. Missing one setup is not a failure; it is a sign of dynamic patience.
- **Biometric Guard**: Check your breathing depth. Chasing green candles increases physiological arousal, clouding your rational cortex.
- **Action Plan**: Let the current move finish without you. Standardize your strategy parameters and wait patiently for the next clean setup criteria.`;
      } else {
        reply = `### **Guardian AI | Diagnostic Assistance Mode**

Hello! I am Guardian AI, your institutional trading psychologist powered by GPT 5.5. Core risk rules:

- **Rule 1**: Protect your execution capital above all else.
- **Rule 2**: Never trade while under high psychological pressure or tilt.
- **Rule 3**: Document every dynamic decision in your Trade Journal so we can identify emotional loops.

*Tell me more about what you are trading today, or how your capital discipline is holding up under current market conditions!*`;
      }
    }

    if (userId && activeSessionId) {
      await db.insert(chatMessages).values({
        sessionId: activeSessionId,
        role: "model",
        text: reply,
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      sessionId: activeSessionId,
    });
  } catch (error: any) {
    console.error("AI Dynamic Chat System Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to process psychological coaching insights.",
    });
  }
});

export default router;
