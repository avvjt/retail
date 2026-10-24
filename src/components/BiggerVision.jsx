import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Network, Smartphone, Eye, Code, Zap, Globe } from 'lucide-react';
import './BiggerVision.css';

export default function BiggerVision() {
  const visionSteps = [
    { name: "Market Bias Engine", desc: "Global cues, GIFT Nifty, FII/DII net flows, and dynamic support/resistance levels", icon: <Globe size={16} /> },
    { name: "Risk Meter & Lockout", desc: "Configurable max risk per trade, max daily loss rules, and automated account lockout triggers", icon: <Smartphone size={16} /> },
    { name: "Trap Detection System", desc: "Real-time volume anomaly identification, liquidity trap detection, and post-loss cooldowns", icon: <Eye size={16} /> },
    { name: "Smart Money Flow Radar", desc: "Institutional FII & DII cash flow tracking, NSE bulk and block deals monitoring", icon: <Zap size={16} /> },
    { name: "Paper Trading Engine & Journal", desc: "Simulated virtual order execution with ₹5,00,000 wallet and process emotion journaling", icon: <Code size={16} /> },
    { name: "Scanner, AlgoBuilder & Community", desc: "Pattern anomaly scanner, no-code strategy backtester, and SEBI-compliant discussion forum", icon: <Network size={16} /> }
  ];

  return (
    <section className="bigger-vision-section" id="vision">
      <div className="section-container">
        <div className="vision-header text-center">
          <span className="eyebrow">THE BIGGER VISION</span>
          <h2 className="section-headline">Scaling <span className="text-green-accent font-bold">Trading Edge</span>, Controlling <span className="text-red-accent font-bold">Risk</span>.</h2>
          <p className="bridge-text text-muted">
            We aren't just building an app. We are building the modular architecture that levels the playing field forever.
          </p>
        </div>

        <div className="vision-flow">
          {visionSteps.map((step, idx) => (
            <React.Fragment key={step.name}>
              {/* Step Node */}
              <motion.div 
                className="vision-node glass-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="node-icon-glow">
                  {step.icon}
                </div>
                <div className="node-content">
                  <h4 className="node-name">{step.name}</h4>
                  <p className="node-desc text-muted">{step.desc}</p>
                </div>
                <div className="node-number-banner monospace">
                  PHASE 0{idx+1}
                </div>
              </motion.div>

              {/* Connector Arrow (unless it's the last step) */}
              {idx < visionSteps.length - 1 && (
                <div className="flow-connector">
                  <ChevronDown size={20} className="connector-arrow-icon" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
