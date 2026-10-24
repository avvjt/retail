import { neon } from "@neondatabase/serverless";

export async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("⚠️ DATABASE_URL is not defined in environment variables. Skipping DB tables check.");
    return;
  }

  try {
    const sql = neon(connectionString);
    console.log("Checking and initializing database schema tables...");

    // Create trades table if not exists with references to the users table
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        instrument VARCHAR(100) NOT NULL,
        entry_price VARCHAR(50) NOT NULL,
        exit_price VARCHAR(50) NOT NULL,
        pnl VARCHAR(50) NOT NULL,
        emotion VARCHAR(100) NOT NULL,
        notes TEXT,
        screenshot_url TEXT,
        trade_time TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Alter table to add columns if they don't exist
    await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot_url TEXT;`;
    await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_time TIMESTAMP;`;

    // Create chat_sessions and chat_messages if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Create courses table if it does not exist
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        topic VARCHAR(100) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        video_url TEXT NOT NULL,
        public_id TEXT,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create course_progress table if it does not exist
    await sql`
      CREATE TABLE IF NOT EXISTS course_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        completed BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );
    `;

    // Cleanup pre-seeded default courses and legacy smart money mock seeds
    console.log("🧹 Removing pre-seeded default mock trading data...");
    await sql`
      DELETE FROM courses 
      WHERE title IN (
        'Mastering Market Structure', 
        'Identifying Trap Scenarios', 
        'Advanced Risk Management', 
        'Trading Psychology 101'
      );
    `;
    await sql`
      DELETE FROM smart_money_signals 
      WHERE details LIKE '%Morgan Stanley%' 
         OR details LIKE '%Societe Generale%' 
         OR details LIKE '%Fidelity%' 
         OR details LIKE '%Gouvernement du Canada%'
         OR details LIKE '%Goldman Sachs%'
         OR signal_type = 'fii_flow'
         OR signal_type = 'volume_spike';
    `;

    console.log("🚀 Creating and verifying extended platform tables...");
    
    await sql`
      CREATE TABLE IF NOT EXISTS smart_money_signals (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        signal_type VARCHAR(50) NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE smart_money_signals ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);`;
    await sql`ALTER TABLE smart_money_signals ADD COLUMN IF NOT EXISTS signal_type VARCHAR(50);`;
    await sql`ALTER TABLE smart_money_signals ADD COLUMN IF NOT EXISTS details TEXT;`;
    await sql`ALTER TABLE smart_money_signals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    // Safely remove any obsolete NOT NULL constraint on old columns to prevent seed failure
    await sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_money_signals' AND column_name = 'type') THEN
          ALTER TABLE smart_money_signals ALTER COLUMN type DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_money_signals' AND column_name = 'signal') THEN
          ALTER TABLE smart_money_signals ALTER COLUMN signal DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_money_signals' AND column_name = 'timestamp') THEN
          ALTER TABLE smart_money_signals ALTER COLUMN timestamp DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_money_signals' AND column_name = 'description') THEN
          ALTER TABLE smart_money_signals ALTER COLUMN description DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_money_signals' AND column_name = 'title') THEN
          ALTER TABLE smart_money_signals ALTER COLUMN title DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_money_signals' AND column_name = 'severity') THEN
          ALTER TABLE smart_money_signals ALTER COLUMN severity DROP NOT NULL;
        END IF;
      END $$;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS option_chain_snapshots (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        strike_price INTEGER NOT NULL,
        call_oi INTEGER NOT NULL,
        call_delta_oi INTEGER NOT NULL,
        call_iv VARCHAR(50) NOT NULL,
        put_oi INTEGER NOT NULL,
        put_delta_oi INTEGER NOT NULL,
        put_iv VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS strike_price INTEGER;`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS call_oi INTEGER;`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS call_delta_oi INTEGER;`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS call_iv VARCHAR(50);`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS put_oi INTEGER;`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS put_delta_oi INTEGER;`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS put_iv VARCHAR(50);`;
    await sql`ALTER TABLE option_chain_snapshots ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    await sql`
      CREATE TABLE IF NOT EXISTS strategies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        rules_json JSONB,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Handle rename / migration from older schema using 'conditions' to 'rules_json'
    await sql`
      DO $$
      BEGIN
        -- If conditions exists but rules_json does not, rename conditions to rules_json
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategies' AND column_name = 'conditions') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategies' AND column_name = 'rules_json') THEN
          ALTER TABLE strategies RENAME COLUMN conditions TO rules_json;
        END IF;

        -- If conditions exists (both exist or rename was skipped), drop NOT NULL from conditions
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategies' AND column_name = 'conditions') THEN
          ALTER TABLE strategies ALTER COLUMN conditions DROP NOT NULL;
        END IF;

        -- If rules_json exists, drop NOT NULL from rules_json to handle old rows
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategies' AND column_name = 'rules_json') THEN
          ALTER TABLE strategies ALTER COLUMN rules_json DROP NOT NULL;
        END IF;
      END $$;
    `;

    await sql`ALTER TABLE strategies ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE strategies ADD COLUMN IF NOT EXISTS name VARCHAR(255);`;
    await sql`ALTER TABLE strategies ADD COLUMN IF NOT EXISTS rules_json JSONB;`;
    await sql`ALTER TABLE strategies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;`;
    await sql`ALTER TABLE strategies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    await sql`
      CREATE TABLE IF NOT EXISTS broker_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        broker_name VARCHAR(50) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        mode VARCHAR(20) NOT NULL DEFAULT 'paper',
        connected_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE broker_connections ADD COLUMN IF NOT EXISTS broker_name VARCHAR(50);`;
    await sql`ALTER TABLE broker_connections ADD COLUMN IF NOT EXISTS access_token TEXT;`;
    await sql`ALTER TABLE broker_connections ADD COLUMN IF NOT EXISTS refresh_token TEXT;`;
    await sql`ALTER TABLE broker_connections ADD COLUMN IF NOT EXISTS mode VARCHAR(20);`;
    await sql`ALTER TABLE broker_connections ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP;`;

    await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        strategy_id INTEGER NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
        win_rate VARCHAR(50) NOT NULL,
        total_trades INTEGER NOT NULL,
        shared_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Drop NOT NULL on older/obsolete columns that may still exist in the database
    await sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'title') THEN
          ALTER TABLE community_posts ALTER COLUMN title DROP NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'description') THEN
          ALTER TABLE community_posts ALTER COLUMN description DROP NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'content') THEN
          ALTER TABLE community_posts ALTER COLUMN content DROP NOT NULL;
        END IF;
      END $$;
    `;

    await sql`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS win_rate VARCHAR(50);`;
    await sql`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS total_trades INTEGER;`;
    await sql`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP DEFAULT NOW();`;

    await sql`
      CREATE TABLE IF NOT EXISTS strategy_follows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        community_post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        copied_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE strategy_follows ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE strategy_follows ADD COLUMN IF NOT EXISTS community_post_id INTEGER;`;
    await sql`ALTER TABLE strategy_follows ADD COLUMN IF NOT EXISTS copied_at TIMESTAMP DEFAULT NOW();`;

    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        razorpay_sub_id VARCHAR(255),
        plan VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_period_end TIMESTAMP
      );
    `;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_sub_id VARCHAR(255);`;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan VARCHAR(50);`;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50);`;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;`;

    await sql`
      CREATE TABLE IF NOT EXISTS risk_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        max_risk_per_trade VARCHAR(50) NOT NULL,
        max_daily_loss VARCHAR(50) NOT NULL,
        max_drawdown VARCHAR(50) NOT NULL,
        capital_base VARCHAR(50) NOT NULL
      );
    `;
    await sql`ALTER TABLE risk_settings ADD COLUMN IF NOT EXISTS max_risk_per_trade VARCHAR(50);`;
    await sql`ALTER TABLE risk_settings ADD COLUMN IF NOT EXISTS max_daily_loss VARCHAR(50);`;
    await sql`ALTER TABLE risk_settings ADD COLUMN IF NOT EXISTS max_drawdown VARCHAR(50);`;
    await sql`ALTER TABLE risk_settings ADD COLUMN IF NOT EXISTS capital_base VARCHAR(50);`;

    await sql`
      CREATE TABLE IF NOT EXISTS sentiment_scores (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE sentiment_scores ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);`;
    await sql`ALTER TABLE sentiment_scores ADD COLUMN IF NOT EXISTS score INTEGER;`;
    await sql`ALTER TABLE sentiment_scores ADD COLUMN IF NOT EXISTS source VARCHAR(50);`;
    await sql`ALTER TABLE sentiment_scores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    // 24. Survey Responses and User Profiles
    await sql`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        biometric_score INTEGER NOT NULL,
        answers JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        experience VARCHAR(255),
        pain_scale INTEGER,
        behaviors TEXT,
        valuable_feature VARCHAR(255),
        pricing VARCHAR(255),
        risk_tolerance VARCHAR(255),
        style_preference VARCHAR(255),
        risk_metrics JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS style_preference VARCHAR(255);`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS risk_metrics JSONB;`;

    // 25. Paper Trading Tables
    await sql`
      CREATE TABLE IF NOT EXISTS paper_wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        balance VARCHAR(50) NOT NULL,
        starting_balance VARCHAR(50) NOT NULL,
        reset_count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE paper_wallets ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE paper_wallets ADD COLUMN IF NOT EXISTS balance VARCHAR(50);`;
    await sql`ALTER TABLE paper_wallets ADD COLUMN IF NOT EXISTS starting_balance VARCHAR(50);`;
    await sql`ALTER TABLE paper_wallets ADD COLUMN IF NOT EXISTS reset_count INTEGER;`;

    await sql`
      CREATE TABLE IF NOT EXISTS paper_positions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        instrument_type VARCHAR(50) NOT NULL,
        strike_price INTEGER,
        expiry_date VARCHAR(50),
        side VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        entry_price VARCHAR(50) NOT NULL,
        exit_price VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        unrealized_pnl VARCHAR(50) NOT NULL DEFAULT '0',
        realized_pnl VARCHAR(50),
        opened_at TIMESTAMP DEFAULT NOW(),
        closed_at TIMESTAMP
      );
    `;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS instrument_type VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS strike_price INTEGER;`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS side VARCHAR(20);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS quantity INTEGER;`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS entry_price VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS exit_price VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS status VARCHAR(20);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS unrealized_pnl VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS realized_pnl VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS stop_loss VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS target_price VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS trailing_stop_points VARCHAR(50);`;
    await sql`ALTER TABLE paper_positions ADD COLUMN IF NOT EXISTS exit_reason VARCHAR(20) DEFAULT 'manual';`;

    await sql`
      CREATE TABLE IF NOT EXISTS paper_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        instrument_type VARCHAR(50) NOT NULL,
        strike_price INTEGER,
        expiry_date VARCHAR(50),
        side VARCHAR(20) NOT NULL,
        order_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        limit_price VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        filled_at TIMESTAMP,
        filled_price VARCHAR(50)
      );
    `;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS instrument_type VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS strike_price INTEGER;`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS side VARCHAR(20);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS quantity INTEGER;`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS limit_price VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS status VARCHAR(20);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS filled_price VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS stop_loss VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS target_price VARCHAR(50);`;
    await sql`ALTER TABLE paper_orders ADD COLUMN IF NOT EXISTS trailing_stop_points VARCHAR(50);`;

    // Create saved_algos table if it does not exist
    await sql`
      CREATE TABLE IF NOT EXISTS saved_algos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        script TEXT NOT NULL,
        language VARCHAR(20) NOT NULL DEFAULT 'js',
        config_json JSONB,
        backtest_results JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE saved_algos ADD COLUMN IF NOT EXISTS name VARCHAR(255);`;
    await sql`ALTER TABLE saved_algos ADD COLUMN IF NOT EXISTS description TEXT;`;
    await sql`ALTER TABLE saved_algos ADD COLUMN IF NOT EXISTS script TEXT;`;
    await sql`ALTER TABLE saved_algos ADD COLUMN IF NOT EXISTS language VARCHAR(20);`;
    await sql`ALTER TABLE saved_algos ADD COLUMN IF NOT EXISTS config_json JSONB;`;
    await sql`ALTER TABLE saved_algos ADD COLUMN IF NOT EXISTS backtest_results JSONB;`;

    // Create discussion_posts and discussion_comments tables
    await sql`
      CREATE TABLE IF NOT EXISTS discussion_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        edited_at TIMESTAMP,
        flagged BOOLEAN DEFAULT FALSE
      );
    `;
    await sql`ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS content TEXT;`;
    await sql`ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;
    await sql`ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;`;
    await sql`ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;`;

    await sql`
      CREATE TABLE IF NOT EXISTS discussion_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES discussion_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        flagged BOOLEAN DEFAULT FALSE
      );
    `;
    await sql`ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS post_id INTEGER;`;
    await sql`ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS content TEXT;`;
    await sql`ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;
    await sql`ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;`;

    // Create strategy_post_comments table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS strategy_post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE strategy_post_comments ADD COLUMN IF NOT EXISTS post_id INTEGER;`;
    await sql`ALTER TABLE strategy_post_comments ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE strategy_post_comments ADD COLUMN IF NOT EXISTS content TEXT;`;
    await sql`ALTER TABLE strategy_post_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    // Create behavioral_interventions table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS behavioral_interventions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade_attempt_json JSONB NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        action VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE behavioral_interventions ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
    await sql`ALTER TABLE behavioral_interventions ADD COLUMN IF NOT EXISTS trade_attempt_json JSONB;`;
    await sql`ALTER TABLE behavioral_interventions ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50);`;
    await sql`ALTER TABLE behavioral_interventions ADD COLUMN IF NOT EXISTS message TEXT;`;
    await sql`ALTER TABLE behavioral_interventions ADD COLUMN IF NOT EXISTS action VARCHAR(20);`;
    await sql`ALTER TABLE behavioral_interventions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    
    // The following lines were injected to keep dbInit.ts in sync with schema additions
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(255);`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS discipline_score INTEGER DEFAULT 100;`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS edge_score INTEGER DEFAULT 100;`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trader_health_score INTEGER DEFAULT 100;`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        price_target VARCHAR(50),
        condition VARCHAR(20),
        trigger_type VARCHAR(50) DEFAULT 'above',
        price VARCHAR(50) DEFAULT '0',
        repeat BOOLEAN DEFAULT FALSE,
        expiry_days INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50) DEFAULT 'above';`;
    await sql`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS price VARCHAR(50) DEFAULT '0';`;
    await sql`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS repeat BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS expiry_days INTEGER;`;
    await sql`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS trading_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        max_trades_per_day INTEGER DEFAULT 3,
        max_risk_per_trade VARCHAR(50) DEFAULT '1%',
        setup_criteria JSONB,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS scanner_configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        filter_rules JSONB,
        risk_limits JSONB,
        schedule_cron VARCHAR(50),
        active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS scanner_results (
        id SERIAL PRIMARY KEY,
        config_id INTEGER NOT NULL REFERENCES scanner_configs(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        score_breakdown JSONB,
        research_notes TEXT,
        risk_passed BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log("Database schema verification completed.");
  } catch (error) {
    console.error("Failed to verify or initialize database tables:", error);
  }
}

