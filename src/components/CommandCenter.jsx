import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ShieldAlert, Cpu, Activity, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ComplianceDisclaimer from './ComplianceDisclaimer';
import './CommandCenter.css';

export default function CommandCenter() {
  const [systime, setSystime] = useState("16:44:37 UTC");
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error(e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    
    window.addEventListener('authSuccess', checkAuth);
    window.addEventListener('newSubmissionSaved', checkAuth);
    return () => {
      window.removeEventListener('authSuccess', checkAuth);
      window.removeEventListener('newSubmissionSaved', checkAuth);
    };
  }, []);

  const handleActionClick = (e) => {
    e.preventDefault();
    if (!user) {
      window.dispatchEvent(new Event('openAuth'));
    } else if (user.hasSubmitted) {
      if (user.isAdmin) {
        window.dispatchEvent(new Event('openAdmin'));
      } else {
        navigate('/dashboard');
      }
    } else {
      window.dispatchEvent(new Event('openWaitlist'));
    }
  };

  // Update tick every few seconds to show "live feed" action
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
      const now = new Date();
      setSystime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="command-center-section" id="command-center">
      <div className="section-container">
        <div className="command-header text-center">
          <span className="eyebrow">THE RETAILX COMMAND CENTER</span>
          <h2 className="section-headline">Turn <span className="text-red-accent font-bold">market chaos</span> into <span className="text-green-accent font-bold">structured clarity</span>.</h2>
          <p className="bridge-text text-muted">A zero-noise quantitative cockpit designed to deliver immediate psychological ground-truth before execution.</p>
        </div>

        <div className="command-grid">
          {/* Main Visual Dashboard */}
          <motion.div 
            className="command-mockup-wrapper glass-card"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="command-mockup-top">
              <div className="terminal-dots">
                <span className="dot flex-shrink-0 red-btn"></span>
                <span className="dot flex-shrink-0 yellow-btn"></span>
                <span className="dot flex-shrink-0 green-btn"></span>
              </div>
              <div className="system-identity monospace">
                RETAILX CONDITION MONITOR // CORE_SECURE_v2.6
              </div>
              <div className="system-time monospace">
                <Clock size={12} style={{ marginRight: '4px' }} />
                {systime}
              </div>
            </div>

            <div className="command-board">
              {/* Stat 1: Market Analysis & Institutional Flow */}
              <div className="board-card">
                <div className="card-top">
                  <Compass size={14} className="card-top-icon text-green" />
                  <span className="monospace label text-muted">INSTITUTIONAL ACTIVITY</span>
                </div>
                <div className="card-value inst-value text-green">ABOVE AVG VOLUME</div>
                <div className="card-sub monospace text-muted">SEC_LOG_FILTERED</div>
              </div>

              {/* Stat 2: Risk Meter */}
              <div className="board-card">
                <div className="card-top">
                  <Activity size={14} className="card-top-icon text-yellow" />
                  <span className="monospace label text-muted">RISK LEVEL</span>
                </div>
                <div className="card-value risk-value text-yellow">MEDIUM</div>
                <div className="card-sub monospace text-muted">VOLATILITY_CAP</div>
              </div>

              {/* Stat 3: Trap Detection */}
              <div className="board-card">
                <div className="card-top">
                  <ShieldAlert size={14} className="card-top-icon text-red" />
                  <span className="monospace label text-muted">VOLATILITY PATTERN</span>
                </div>
                <div className="card-value trap-value text-red">HIGH</div>
                <div className="card-sub monospace text-muted">LIQUIDITY_HUNT_FOUND</div>
              </div>

              {/* Stat 4: Conditions Summary */}
              <div className="board-card conditions-summary-card">
                <div className="card-top">
                  <Cpu size={14} className="card-top-icon text-accent" />
                  <span className="monospace label text-accent-light">CONDITIONS SUMMARY</span>
                </div>
                <div className="card-value action-value-box text-black">LOW VOLUME</div>
                <div className="card-sub monospace text-muted">SUSPEND_TRIGGER</div>
              </div>
            </div>

            {/* Explanatory Message Block */}
            <div className="reason-container">
              <div className="reason-header monospace text-accent">REASONING:</div>
              <p className="reason-body">
                "Weak volume. Resistance overhead. Institutional participation declining."
              </p>
              <div className="live-status-ticker">
                <span className="ticker-dot"></span>
                <span className="monospace ticker-text">
                  RECEIVING ACTIVE PIPELINES &middot; HEDGE CO-LOCATED FEED ACTIVE &middot; TICK {tick}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Left/Side Value Proposition */}
          <div className="command-right-copy">
            <h3 className="command-tagline">One glance. Total clarity. No emotional override.</h3>
            <p className="command-body-desc text-muted">
              You do not need more indicators or moving average overlaps to clutter your chart. You need a centralized system that synthesizes multiple institutional parameters and tells you the core cold hard truth.
            </p>
            <p className="command-body-desc text-muted">
              When RetailX detects low-volume or elevated-volatility conditions, it surfaces this data so you can apply your own trading plan rules before executing.
            </p>
            <div className="action-row-button">
              <button onClick={handleActionClick} className="btn btn-primary">
                {user && user.hasSubmitted ? "Go to Dashboard \u2192" : "Experience Terminal Access \u2192"}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/5">
          <ComplianceDisclaimer />
        </div>
      </div>
    </section>
  );
}
