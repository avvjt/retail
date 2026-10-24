import { pgTable, serial, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// 1. Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. JWT Sessions Table (refresh token storage)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

// 3. Survey Responses Table
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  biometricScore: integer("biometric_score").notNull(),
  answers: jsonb("answers").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. User Profiles Table
export const userProfiles = pgTable("user_profiles", {
  name: varchar("name", { length: 255 }),
  username: varchar("username", { length: 255 }),
  avatarUrl: text("avatar_url"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  referralCode: varchar("referral_code", { length: 50 }).unique(),
  disciplineScore: integer("discipline_score").default(100),
  edgeScore: integer("edge_score").default(100),
  traderHealthScore: integer("trader_health_score").default(100),
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  experience: varchar("experience", { length: 255 }),
  painScale: integer("pain_scale"),
  behaviors: text("behaviors"),
  valuableFeature: varchar("valuable_feature", { length: 255 }),
  pricing: varchar("pricing", { length: 255 }),
  riskTolerance: varchar("risk_tolerance", { length: 255 }),
  stylePreference: varchar("style_preference", { length: 255 }),
  riskMetrics: jsonb("risk_metrics"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Dashboard Activity Table (telemetry log)
export const dashboardActivity = pgTable("dashboard_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // "market_tick", "emergency_pause", "overtrading", etc.
  description: text("description").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Login Sessions Table (audit sign-ins)
export const loginSessions = pgTable("login_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  loggedInAt: timestamp("logged_in_at").defaultNow(),
});

// 7. Market Ticks Table (periodic prices loaded from background poller)
export const marketTicks = pgTable("market_ticks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull(), // "NIFTY50", "BANKNIFTY"
  price: varchar("price", { length: 50 }).notNull(),
  volume: varchar("volume", { length: 50 }),
  openInterest: varchar("open_interest", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. Risk Assessments Table
export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  positionSize: integer("position_size"),
  capital: integer("capital"),
  stopLoss: integer("stop_loss"),
  riskPercent: varchar("risk_percent", { length: 50 }),
  riskLevel: varchar("risk_level", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. Cooldown Logs Table (emotional checks with Coach Advice)
export const cooldownLogs = pgTable("cooldown_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  emotionalState: text("emotional_state"),
  advice: text("advice"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 10. Trades Table (Trading Journal)
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  instrument: varchar("instrument", { length: 100 }).notNull(),
  entryPrice: varchar("entry_price", { length: 50 }).notNull(),
  exitPrice: varchar("exit_price", { length: 50 }).notNull(),
  pnl: varchar("pnl", { length: 50 }).notNull(), // text representation of PnL e.g. "+350", "-150"
  emotion: varchar("emotion", { length: 100 }).notNull(),
  notes: text("notes"),
  screenshotUrl: text("screenshot_url"),
  tradeTime: timestamp("trade_time").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 11. Chat Sessions Table
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Chat Messages Table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // "user" or "model"
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 13. Courses Table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  videoUrl: text("video_url").notNull(),
  publicId: text("public_id"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 14. Course Progress Table
export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 15. Smart Money Signals Table
export const smartMoneySignals = pgTable("smart_money_signals", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  signalType: varchar("signal_type", { length: 50 }).notNull(), // "bulk_deal", "block_deal", "fii_flow", "dii_flow", "volume_spike"
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 16. Option Chain Snapshots Table
export const optionChainSnapshots = pgTable("option_chain_snapshots", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull(), // "NIFTY", "BANKNIFTY"
  strikePrice: integer("strike_price").notNull(),
  callOi: integer("call_oi").notNull(),
  callDeltaOi: integer("call_delta_oi").notNull(),
  callIv: varchar("call_iv", { length: 50 }).notNull(),
  putOi: integer("put_oi").notNull(),
  putDeltaOi: integer("put_delta_oi").notNull(),
  putIv: varchar("put_iv", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 17. Strategies Table
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  rulesJson: jsonb("rules_json").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. Broker Connections Table
export const brokerConnections = pgTable("broker_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  brokerName: varchar("broker_name", { length: 50 }).notNull(), // "zerodha", "upstox"
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  mode: varchar("mode", { length: 20 }).default("paper").notNull(), // "paper" or "live"
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
});

// 19. Community Posts Table
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  strategyId: integer("strategy_id").references(() => strategies.id, { onDelete: "cascade" }).notNull(),
  winRate: varchar("win_rate", { length: 50 }).notNull(),
  totalTrades: integer("total_trades").notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

// 20. Strategy Follows Table
export const strategyFollows = pgTable("strategy_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  communityPostId: integer("community_post_id").references(() => communityPosts.id, { onDelete: "cascade" }).notNull(),
  copiedAt: timestamp("copied_at").defaultNow().notNull(),
});

// 21. Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  razorpaySubId: varchar("razorpay_sub_id", { length: 255 }),
  plan: varchar("plan", { length: 50 }).notNull(), // "free", "pro"
  status: varchar("status", { length: 50 }).notNull(), // "active", "cancelled", etc.
  currentPeriodEnd: timestamp("current_period_end"),
});

// 22. Risk Settings Table
export const riskSettings = pgTable("risk_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  maxRiskPerTrade: varchar("max_risk_per_trade", { length: 50 }).notNull(),
  maxDailyLoss: varchar("max_daily_loss", { length: 50 }).notNull(),
  maxDrawdown: varchar("max_drawdown", { length: 50 }).notNull(),
  capitalBase: varchar("capital_base", { length: 50 }).notNull(),
});

// 23. Sentiment Scores Table
export const sentimentScores = pgTable("sentiment_scores", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  score: integer("score").notNull(), // -100 to +100
  source: varchar("source", { length: 50 }).notNull(), // "news", "reddit", "twitter", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// 24. Paper Trading Tables
export const paperWallets = pgTable("paper_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  balance: varchar("balance", { length: 50 }).notNull(),
  startingBalance: varchar("starting_balance", { length: 50 }).notNull(),
  resetCount: integer("reset_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paperPositions = pgTable("paper_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(), // "NIFTY50", "BANKNIFTY"
  instrumentType: varchar("instrument_type", { length: 50 }).notNull(), // "future" | "call" | "put"
  strikePrice: integer("strike_price"),
  expiryDate: varchar("expiry_date", { length: 50 }),
  side: varchar("side", { length: 20 }).notNull(), // "long" | "short"
  quantity: integer("quantity").notNull(), // quantity in lots
  entryPrice: varchar("entry_price", { length: 50 }).notNull(),
  exitPrice: varchar("exit_price", { length: 50 }),
  status: varchar("status", { length: 20 }).default("open").notNull(), // "open" | "closed"
  unrealizedPnl: varchar("unrealized_pnl", { length: 50 }).default("0").notNull(),
  realizedPnl: varchar("realized_pnl", { length: 50 }),
  stopLoss: varchar("stop_loss", { length: 50 }),
  targetPrice: varchar("target_price", { length: 50 }),
  trailingStopPoints: varchar("trailing_stop_points", { length: 50 }),
  exitReason: varchar("exit_reason", { length: 20 }).default("manual"),
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const paperOrders = pgTable("paper_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  instrumentType: varchar("instrument_type", { length: 50 }).notNull(),
  strikePrice: integer("strike_price"),
  expiryDate: varchar("expiry_date", { length: 50 }),
  side: varchar("side", { length: 20 }).notNull(), // "long" | "short"
  orderType: varchar("order_type", { length: 20 }).notNull(), // "market" | "limit"
  quantity: integer("quantity").notNull(), // quantity in lots
  limitPrice: varchar("limit_price", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // "pending" | "filled" | "cancelled"
  stopLoss: varchar("stop_loss", { length: 50 }),
  targetPrice: varchar("target_price", { length: 50 }),
  trailingStopPoints: varchar("trailing_stop_points", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  filledAt: timestamp("filled_at"),
  filledPrice: varchar("filled_price", { length: 50 }),
});

// 25. Saved Algos Table (for Algo Builder)
export const savedAlgos = pgTable("saved_algos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"), // original English description
  script: text("script").notNull(), // generated Javascript or Python script
  language: varchar("language", { length: 20 }).default("js").notNull(), // js, python, etc.
  configJson: jsonb("config_json"), // holds entry/exit conditions, instrument, timeframe, etc.
  backtestResults: jsonb("backtest_results"), // total trades, win rate, net P&L, max drawdown, average win/loss, equity curve
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 26. Discussion Posts Table
export const discussionPosts = pgTable("discussion_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  flagged: boolean("flagged").default(false),
});

// 27. Discussion Comments Table
export const discussionComments = pgTable("discussion_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => discussionPosts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  flagged: boolean("flagged").default(false),
});

// 28. Strategy Post Comments Table
export const strategyPostComments = pgTable("strategy_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 29. Behavioral Interventions Table
export const behavioralInterventions = pgTable("behavioral_interventions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tradeAttemptJson: jsonb("trade_attempt_json").notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // "revenge_trade" | "risk_breach" | "overtrading"
  message: text("message").notNull(),
  action: varchar("action", { length: 20 }).notNull(), // "warned" | "blocked" | "overridden"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});





// 30. Price Alerts Table
export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // "above", "below"
  price: varchar("price", { length: 50 }).notNull(),
  repeat: boolean("repeat").default(false),
  expiryDays: integer("expiry_days"), // null = never
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 31. Trading Plans Table
export const tradingPlans = pgTable("trading_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  maxTradesPerDay: integer("max_trades_per_day").default(3).notNull(),
  maxRiskPerTrade: varchar("max_risk_per_trade", { length: 50 }).default("1%").notNull(),
  setupCriteria: jsonb("setup_criteria"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 32. Referrals Table
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  referredEmail: varchar("referred_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 33. Support Tickets Table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "bug", "feature", "feedback", "support"
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  mediaData: text("media_data"), // Base64 or URL
  mediaType: varchar("media_type", { length: 50 }), // e.g. "image/png", "video/mp4"
  status: varchar("status", { length: 50 }).default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 34. Scanner Configs
export const scannerConfigs = pgTable("scanner_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  
  filterRules: jsonb("filter_rules"), // e.g. [{type: 'volume', min: 100000}]
  riskLimits: jsonb("risk_limits"),
  scheduleCron: varchar("schedule_cron", { length: 50 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 35. Scanner Results
export const scannerResults = pgTable("scanner_results", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => scannerConfigs.id, { onDelete: "cascade" }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  scoreBreakdown: jsonb("score_breakdown"), // trend, volume, catalyst, rr, cleanliness
  researchNotes: text("research_notes"),
  riskPassed: boolean("risk_passed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
