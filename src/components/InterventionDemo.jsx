import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Play, RefreshCw, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import './InterventionDemo.css';

export default function InterventionDemo() {
  const [tradeSubmitted, setTradeSubmitted] = useState(false);
  const [simulationChoice, setSimulationChoice] = useState(null); // 'pause' or 'proceed'

  const resetSimulation = () => {
    setTradeSubmitted(false);
    setSimulationChoice(null);
  };

  return (
    <section className="intervention-demo-section" id="intervention-demo">
      <div className="section-container">
        <div className="intervention-header text-center">
          <span className="eyebrow">THE INTERVENTION THAT CHANGES EVERYTHING</span>
          <h2 className="section-headline">The Power of a Well-Timed <span className="text-red-accent font-bold">Interruption</span> to Save Your <span className="text-green-accent font-bold">Capital</span>.</h2>
          <p className="bridge-text text-muted">
            Most traders, given just 60 seconds, choose not to take the revenge trade. RetailX steps in at the exact milliseconds before you make a devastating mistake.
          </p>
        </div>

        <div className="intervention-demo-grid">
          {/* Simulation Box */}
          <div className="simulation-column">
            <div className="simulation-frame glass-card">
              <div className="sim-frame-header">
                <span className="live-badge monospace">
                  <span className="sim-pulse"></span> <span className="sim-badge-label">SIMULATED BROKER CONSOLE</span>
                </span>
                <span className="monospace sim-title">RECOVERY_DESK</span>
              </div>

              {!tradeSubmitted ? (
                /* Initial State: Prompting user to submit trade */
                <motion.div 
                  className="sim-step"
                  key="step-initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="loss-alert-box">
                    <div className="alert-top">
                      <AlertTriangle className="alert-tx-icon" size={16} />
                      <span className="monospace">ACCOUNT UPDATE</span>
                    </div>
                    <p className="alert-body-desc">
                      Real-time Loss Registered: <strong className="text-red-accent">- ₹14,200</strong> 3 mins ago in Option NIFTY24DEC.
                    </p>
                  </div>

                  <div className="trade-input-panel">
                    <h4 className="panel-title">Pending Order: Revenge Trade</h4>
                    <div className="input-row">
                      <div className="input-group">
                        <label className="monospace label">INSTRUMENT</label>
                        <div className="input-box">NIFTY24DEC CALL</div>
                      </div>
                      <div className="input-group">
                        <label className="monospace label">SIZE</label>
                        <div className="input-box text-accent">20 Lots (2&times; average)</div>
                      </div>
                    </div>

                    <div className="input-row text-margin">
                      <div className="input-group">
                        <label className="monospace label">ESTIMATED CAPITAL</label>
                        <div className="input-box">₹65,000</div>
                      </div>
                    </div>

                    <p className="fomo-text text-muted italic">
                      "Market is reversing! I'm about to jump back in to recover my losses..."
                    </p>

                    <button 
                      onClick={() => setTradeSubmitted(true)}
                      className="btn submit-order-btn"
                    >
                      Process Trade Order <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                    </button>
                  </div>
                </motion.div>
              ) : simulationChoice === null ? (
                /* Active Shield Triggered Option */
                <motion.div 
                  className="sim-step active-shield"
                  key="step-shield"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="shield-overlay-card">
                    <div className="shield-icon-glow">
                      <ShieldAlert size={28} className="shield-icon" />
                    </div>

                    <h3 className="shield-headline">RETAILX PROTCOL INTERCEPTION</h3>
                    <div className="quote-scanned">
                      <p className="quote-phrase">
                        &ldquo;Hey. We noticed you took a loss 3 minutes ago.
                        This new trade is 2&times; your average size.
                        Does it match the plan you set this morning?&rdquo;
                      </p>
                    </div>

                    <div className="shield-interactions">
                      <button 
                        onClick={() => setSimulationChoice('pause')} 
                        className="btn btn-primary choice-btn shadow-lime"
                      >
                        [ Pause and Review ]
                      </button>
                      <button 
                        onClick={() => setSimulationChoice('proceed')} 
                        className="btn btn-ghost choice-btn"
                      >
                        [ I Understand, Let’s Proceed ]
                      </button>
                    </div>

                    <div className="countdown-bar-run">
                      <div className="bar-fill"></div>
                      <span className="monospace count-text-run">60s COOLDOWN INJECTED</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Evaluation result screen */
                <motion.div 
                  className="sim-step"
                  key="step-eval"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {simulationChoice === 'pause' ? (
                    <div className="eval-result success-box">
                      <CheckCircle2 size={48} className="eval-result-icon text-green-accent" />
                      <h4 className="eval-status-title text-green-accent">Revenge Blocked Successfully</h4>
                      <p className="eval-status-body">
                        You stayed disciplined. Deep breath. By stopping, review of parameters showed your setup wasn't valid. You saved <strong className="text-white">₹65,000</strong> from emotional bleeding.
                      </p>
                      <p className="monospace text-muted mt-2">Discipline Rating: +25 XP (Excellent)</p>
                    </div>
                  ) : (
                    <div className="eval-result bleed-box">
                      <XCircle size={48} className="eval-result-icon text-red-accent" />
                      <h4 className="eval-status-title text-red-accent">Order Proceeded with Warning</h4>
                      <p className="eval-status-body text-muted">
                        Trade order dispatched to broker. Overriding the behavioral shield is logged. Stats show average drawdown increases by 4x during uncoordinated sizing.
                      </p>
                      <p className="monospace text-red-accent mt-2">Discipline Score Degraded: -40 XP</p>
                    </div>
                  )}

                  <button 
                    onClick={resetSimulation}
                    className="btn btn-outline reset-sim-btn"
                  >
                    <RefreshCw size={12} style={{ marginRight: '6px' }} /> Reset Simulation
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Copy Side */}
          <div className="simulation-copy-column">
            <h3 className="intervention-caption">You just took a loss. You’re about to jump back in, sizing up to ‘recover’...</h3>
            <p className="intervention-desc text-muted">
              Most platforms make it incredibly easy to execute trades within milliseconds, encouraging continuous activity while you are compromised or angry.
            </p>
            <p className="intervention-desc text-white font-weight-500">
              RetailX slows you down. That brief moment of pause and friction disrupts the limbic override. It is the single most vital margin between a minor bump and account liquidation.
            </p>
            <div className="stat-highlight">
              <span className="stat-large">91%</span>
              <p className="stat-label-inline text-muted">
                of beta program members report that a simple 60-second delay completely prevented impulsive, non-plan executions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
