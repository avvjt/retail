import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import { createServer as createViteServer } from "vite";

// Import custom route bundles
import authRouter from "./routes/auth";
import surveyRouter from "./routes/survey";
import consoleRouter from "./routes/console";
import healthRouter from "./routes/health";
import chatRouter from "./routes/chat";
import tradesRouter from "./routes/trades";
import coursesRouter from "./routes/courses";
import marketRouter from "./routes/market";
import smartMoneyRouter from "./routes/smartMoney";
import optionChainRouter from "./routes/optionChain";
import algoBuilderRouter from "./routes/algoBuilder";
import brokerConnectRouter from "./routes/brokerConnect";
import communityRouter from "./routes/community";
import billingRouter from "./routes/billing";
import watchlistRouter from "./routes/watchlist";
import riskSettingsRouter from "./routes/riskSettings";
import copilotRouter from "./routes/copilot";
import paperTradingRouter from "./routes/paperTrading";
import discussionsRouter from "./routes/discussions";

import scannerRouter from "./routes/scanner";
import indicesRouter from "./routes/indices";
import alertsRouter from "./routes/alerts";
import settingsRouter from "./routes/settings";
import { authenticateJWT } from "./middleware/auth";
import newsRouter from "./routes/news";
import openchartRouter from "./routes/openchart";
import { globalApiRateLimiter } from "./middleware/rateLimiter";
import { PORT as CONFIG_PORT, APP_URL } from "./config";


// Import DB Initializer
import { initDatabase } from "./dbInit";

// Import background data ticker engine
import { startPoller } from "./poller";

dotenv.config();

function ensureLocalIcon() {
  const publicDir = path.join(process.cwd(), "public");
  const iconPath = path.join(publicDir, "icon.png");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  if (!fs.existsSync(iconPath)) {
    console.log("📥 Downloading PWA icon locally to eliminate external cross-origin lookups...");
    const file = fs.createWriteStream(iconPath);
    https.get("https://i.ibb.co/S2t7PSF/1000061906-removebg-preview.png", (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("✅ PWA icon downloaded successfully to /public/icon.png");
        
        // Also copy to dist if dist exists
        const distDir = path.join(process.cwd(), "dist");
        if (fs.existsSync(distDir)) {
          try {
            fs.copyFileSync(iconPath, path.join(distDir, "icon.png"));
          } catch (copyErr) {
            console.warn("Could not copy icon to dist directory:", copyErr);
          }
        }
      });
    }).on("error", (err) => {
      fs.unlink(iconPath, () => {});
      console.error("❌ Failed to download PWA icon:", err.message);
    });
  } else {
    // If icon exists, make sure it's also inside dist if compiled
    const distDir = path.join(process.cwd(), "dist");
    if (fs.existsSync(distDir)) {
      const distIconPath = path.join(distDir, "icon.png");
      if (!fs.existsSync(distIconPath)) {
        try {
          fs.copyFileSync(iconPath, distIconPath);
        } catch (copyErr) {
          console.warn("Could not copy existing icon to dist directory:", copyErr);
        }
      }
    }
  }
}

async function bootstrap() {
  // Ensure local icon is available for PWA installation
  ensureLocalIcon();

  // Ensure DB fields are created
  // await initDatabase(); // Skipped to avoid Neon DB lock issues

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust Cloud Run / Reverse Proxy for rate limiting and real client IPs
  app.set("trust proxy", 1);

  // Cache-busting middleware to prevent stale browser registrations
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Restrict CORS to APP_URL
  if (process.env.NODE_ENV === "production" && !APP_URL) {
    throw new Error("Missing required environment variable: APP_URL in production");
  }

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || !APP_URL) return callback(null, true);
      const cleanAppUrl = APP_URL.replace(/\/$/, "");
      const cleanOrigin = origin.replace(/\/$/, "");
      if (cleanOrigin === cleanAppUrl) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Express json parsing: 10mb only on screenshot route, 2mb limit on all other routes
  app.use("/api/trades/analyze", express.json({ limit: "10mb" }));
  app.use("/api/trades/analyze", express.urlencoded({ limit: "10mb", extended: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Apply general rate limiting across all API routes
  app.use("/api", globalApiRateLimiter);

  // Mount API Endpoint modular routers
  app.use("/api", authRouter);     // Matches /api/login, /api/signup, /api/me
  app.use("/api", surveyRouter);   // Matches /api/survey, /api/submit-form
  app.use("/api", consoleRouter);  // Matches /api/market-conditions, /api/risk-meter, /api/behavioral-pattern, /api/pause, /api/cooldown
  app.use("/api", healthRouter);   // Matches /api/health
  app.use("/api", chatRouter);     // Matches /api/chat
  app.use("/api", tradesRouter);   // Matches /api/trades (fetch, add, delete)
  app.use("/api", coursesRouter);  // Matches /api/courses and active management
  app.use("/api/market", marketRouter); // Matches /api/market/quotes, /api/market/news, /api/market/analyze
  app.use("/api/smart-money", smartMoneyRouter);
  app.use("/api/options", optionChainRouter);
  app.use("/api/strategies", algoBuilderRouter);
  app.use("/api/broker", brokerConnectRouter);
  app.use("/api/community", communityRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/watchlist", watchlistRouter);
  app.use("/api/risk-settings", riskSettingsRouter);
  app.use("/api", copilotRouter);
  app.use("/api/paper", paperTradingRouter);
  app.use("/api/discussions", discussionsRouter);

  app.use("/api/scanner", scannerRouter);
  app.use("/api/indices", indicesRouter);
  app.use("/api/alerts", alertsRouter);
  app.use("/api/settings", authenticateJWT, settingsRouter);
app.use("/api/news", newsRouter);
app.use("/api/openchart", openchartRouter);


  // Start the 5-Minute background market data ticker engine
  startPoller();

  // Route Fallback & SPA serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Running Express in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running Express in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server bootstrap failure:", err);
  process.exit(1);
});
