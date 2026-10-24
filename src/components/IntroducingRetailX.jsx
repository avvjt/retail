import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, AlertCircle, TrendingDown, ArrowRight } from 'lucide-react';
import './IntroducingRetailX.css';

export default function IntroducingRetailX() {
  const points = [
    "Is active trading appropriate right now?",
    "Is waiting indicated?",
    "Is risk reduction indicated?",
    "Is walking away indicated?"
  ];

  return (
    <section className="introducing-section">
      <div className="section-container">
        <div className="intro-grid">
          <motion.div 
            className="intro-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow">INTRODUCING RETAILX</span>
            <h2 className="section-headline">A Decision Intelligence System built to manage <span className="text-red-accent font-bold">risk</span> and <span className="text-green-accent font-bold">reinforce discipline</span>.</h2>
            <p className="intro-tagline">
              RetailX is not another scanner. Not another indicator. Not another Telegram group.
            </p>
            <p className="intro-body-text text-muted">
              We don't sell predictions or promise overnight wealth. We protect your psychological capital, intervene before emotional failures occur, and ensure your actual trading plan is followed with absolute discipline.
            </p>
          </motion.div>

          <motion.div 
            className="intro-right"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="decision-card glass-card">
              <div className="decision-card-header">
                <span className="monospace header-label text-accent">Real-time Risk Screen</span>
                <span className="live-pill"><span className="live-dot"></span> LIVE SHIELD</span>
              </div>
              <h4 className="decision-card-prompt">
                Before you risk a single rupee, RetailX answers the only questions that matter:
              </h4>

              <div className="questions-list">
                {points.map((q, idx) => (
                  <motion.div 
                    key={idx}
                    className="question-row"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <div className="question-bullet monospace">0{idx+1}</div>
                    <div className="question-text">{q}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
