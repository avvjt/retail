-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. JWT Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- 3. Survey Responses Table
CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  biometric_score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

-- 5. Dashboard Activity Table
CREATE TABLE IF NOT EXISTS dashboard_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Login Sessions Table
CREATE TABLE IF NOT EXISTS login_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  logged_in_at TIMESTAMP DEFAULT NOW()
);

-- 7. Market Ticks Table
CREATE TABLE IF NOT EXISTS market_ticks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  price VARCHAR(50) NOT NULL,
  volume VARCHAR(50),
  open_interest VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  position_size INTEGER,
  capital INTEGER,
  stop_loss INTEGER,
  risk_percent VARCHAR(50),
  risk_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Cooldown Logs Table
CREATE TABLE IF NOT EXISTS cooldown_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  emotional_state TEXT,
  advice TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Trades Table
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

-- 11. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  topic VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  video_url TEXT NOT NULL,
  public_id TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 14. Course Progress Table
CREATE TABLE IF NOT EXISTS course_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. Smart Money Signals Table
CREATE TABLE IF NOT EXISTS smart_money_signals (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  signal_type VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Option Chain Snapshots Table
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

-- 17. Strategies Table
CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rules_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 18. Broker Connections Table
CREATE TABLE IF NOT EXISTS broker_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_name VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  mode VARCHAR(20) NOT NULL DEFAULT 'paper',
  connected_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 19. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id INTEGER NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  win_rate VARCHAR(50) NOT NULL,
  total_trades INTEGER NOT NULL,
  shared_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 20. Strategy Follows Table
CREATE TABLE IF NOT EXISTS strategy_follows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  copied_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 21. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_sub_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_end TIMESTAMP
);

-- 22. Risk Settings Table
CREATE TABLE IF NOT EXISTS risk_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  max_risk_per_trade VARCHAR(50) NOT NULL,
  max_daily_loss VARCHAR(50) NOT NULL,
  max_drawdown VARCHAR(50) NOT NULL,
  capital_base VARCHAR(50) NOT NULL
);

-- 23. Sentiment Scores Table
CREATE TABLE IF NOT EXISTS sentiment_scores (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 24. Paper Trading Tables
CREATE TABLE IF NOT EXISTS paper_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance VARCHAR(50) NOT NULL,
  starting_balance VARCHAR(50) NOT NULL,
  reset_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

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
  stop_loss VARCHAR(50),
  target_price VARCHAR(50),
  trailing_stop_points VARCHAR(50),
  exit_reason VARCHAR(20) DEFAULT 'manual',
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

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
  stop_loss VARCHAR(50),
  target_price VARCHAR(50),
  trailing_stop_points VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP,
  filled_price VARCHAR(50)
);

-- 25. Saved Algos Table
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

-- 26. Discussion Posts Table
CREATE TABLE IF NOT EXISTS discussion_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  flagged BOOLEAN DEFAULT false
);

-- 27. Discussion Comments Table
CREATE TABLE IF NOT EXISTS discussion_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES discussion_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  flagged BOOLEAN DEFAULT false
);

-- 28. Strategy Post Comments Table
CREATE TABLE IF NOT EXISTS strategy_post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 29. Behavioral Interventions Table
CREATE TABLE IF NOT EXISTS behavioral_interventions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_attempt_json JSONB NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  action VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
