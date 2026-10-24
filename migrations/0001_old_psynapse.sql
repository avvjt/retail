CREATE TABLE "behavioral_interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"trade_attempt_json" jsonb NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"action" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discussion_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"flagged" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "discussion_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"edited_at" timestamp,
	"flagged" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "paper_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"instrument_type" varchar(50) NOT NULL,
	"strike_price" integer,
	"expiry_date" varchar(50),
	"side" varchar(20) NOT NULL,
	"order_type" varchar(20) NOT NULL,
	"quantity" integer NOT NULL,
	"limit_price" varchar(50),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"stop_loss" varchar(50),
	"target_price" varchar(50),
	"trailing_stop_points" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"filled_at" timestamp,
	"filled_price" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "paper_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"instrument_type" varchar(50) NOT NULL,
	"strike_price" integer,
	"expiry_date" varchar(50),
	"side" varchar(20) NOT NULL,
	"quantity" integer NOT NULL,
	"entry_price" varchar(50) NOT NULL,
	"exit_price" varchar(50),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"unrealized_pnl" varchar(50) DEFAULT '0' NOT NULL,
	"realized_pnl" varchar(50),
	"stop_loss" varchar(50),
	"target_price" varchar(50),
	"trailing_stop_points" varchar(50),
	"exit_reason" varchar(20) DEFAULT 'manual',
	"opened_at" timestamp DEFAULT now(),
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "paper_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance" varchar(50) NOT NULL,
	"starting_balance" varchar(50) NOT NULL,
	"reset_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "paper_wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"price" varchar(50) NOT NULL,
	"repeat" boolean DEFAULT false,
	"expiry_days" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_algos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"script" text NOT NULL,
	"language" varchar(20) DEFAULT 'js' NOT NULL,
	"config_json" jsonb,
	"backtest_results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scanner_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"filter_rules" jsonb,
	"risk_limits" jsonb,
	"schedule_cron" varchar(50),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scanner_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"score" integer NOT NULL,
	"score_breakdown" jsonb,
	"research_notes" text,
	"risk_passed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"media_data" text,
	"media_type" varchar(50),
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"max_trades_per_day" integer DEFAULT 3 NOT NULL,
	"max_risk_per_trade" varchar(50) DEFAULT '1%' NOT NULL,
	"setup_criteria" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trading_plans_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "referral_code" varchar(50);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "discipline_score" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "edge_score" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "trader_health_score" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "style_preference" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "risk_metrics" jsonb;--> statement-breakpoint
ALTER TABLE "behavioral_interventions" ADD CONSTRAINT "behavioral_interventions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_post_id_discussion_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."discussion_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_orders" ADD CONSTRAINT "paper_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_positions" ADD CONSTRAINT "paper_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_wallets" ADD CONSTRAINT "paper_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_algos" ADD CONSTRAINT "saved_algos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scanner_configs" ADD CONSTRAINT "scanner_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scanner_results" ADD CONSTRAINT "scanner_results_config_id_scanner_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."scanner_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_post_comments" ADD CONSTRAINT "strategy_post_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_post_comments" ADD CONSTRAINT "strategy_post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trading_plans" ADD CONSTRAINT "trading_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_referral_code_unique" UNIQUE("referral_code");