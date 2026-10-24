CREATE TABLE "broker_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"broker_name" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"mode" varchar(20) DEFAULT 'paper' NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"strategy_id" integer NOT NULL,
	"win_rate" varchar(50) NOT NULL,
	"total_trades" integer NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooldown_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"emotional_state" text,
	"advice" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"course_id" integer,
	"completed" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"topic" varchar(100) NOT NULL,
	"duration" varchar(50) NOT NULL,
	"video_url" text NOT NULL,
	"public_id" text,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "login_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"ip_address" varchar(50),
	"user_agent" text,
	"logged_in_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_ticks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"price" varchar(50) NOT NULL,
	"volume" varchar(50),
	"open_interest" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "option_chain_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"strike_price" integer NOT NULL,
	"call_oi" integer NOT NULL,
	"call_delta_oi" integer NOT NULL,
	"call_iv" varchar(50) NOT NULL,
	"put_oi" integer NOT NULL,
	"put_delta_oi" integer NOT NULL,
	"put_iv" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"position_size" integer,
	"capital" integer,
	"stop_loss" integer,
	"risk_percent" varchar(50),
	"risk_level" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"max_risk_per_trade" varchar(50) NOT NULL,
	"max_daily_loss" varchar(50) NOT NULL,
	"max_drawdown" varchar(50) NOT NULL,
	"capital_base" varchar(50) NOT NULL,
	CONSTRAINT "risk_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sentiment_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"score" integer NOT NULL,
	"source" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "smart_money_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"signal_type" varchar(50) NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"rules_json" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"community_post_id" integer NOT NULL,
	"copied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"razorpay_sub_id" varchar(255),
	"plan" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"current_period_end" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"biometric_score" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"instrument" varchar(100) NOT NULL,
	"entry_price" varchar(50) NOT NULL,
	"exit_price" varchar(50) NOT NULL,
	"pnl" varchar(50) NOT NULL,
	"emotion" varchar(100) NOT NULL,
	"notes" text,
	"screenshot_url" text,
	"trade_time" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"experience" varchar(255),
	"pain_scale" integer,
	"behaviors" text,
	"valuable_feature" varchar(255),
	"pricing" varchar(255),
	"risk_tolerance" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooldown_logs" ADD CONSTRAINT "cooldown_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_activity" ADD CONSTRAINT "dashboard_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_settings" ADD CONSTRAINT "risk_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_follows" ADD CONSTRAINT "strategy_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_follows" ADD CONSTRAINT "strategy_follows_community_post_id_community_posts_id_fk" FOREIGN KEY ("community_post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;