import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import './AudienceComparison.css';

export default function AudienceComparison() {
  const whoFor = [
    "Options Traders",
    "Intraday Traders",
    "Swing Traders",
    "Futures Traders",
    "Serious Portfolio Investors",
    "Anyone who wants to protect their capital and trade with clarity"
  ];

  const whatNot = [
    "Advisory subscription channel",
    "Telegram tip group",
    "Broker",
    "Get-rich-quick scheme",
    "Fake AI predictor",
    "Social network (no leaderboards, no bragging)"
  ];

  const whatIs = [
    "Trading Intelligence Platform",
    "Capital Protection System",
    "Behavioral Decision Engine",
    "Real-Time Guardian",
    "Quant-AI Operating System"
  ];

  return (
    <section className="audience-comparison-section" id="audience">
      <div className="section-container">
        
        {/* Audience Panel */}
        <div className="audience-block glass-card">
          <div className="block-header">
            <div className="icon-wrap-lime">
              <Users size={18} className="icon-lime" />
            </div>
            <h3 className="block-title">Who This Is Designed For</h3>
          </div>
          <div className="audience-grid">
            {whoFor.map((item, id) => (
              <motion.div 
                key={id}
                className="checklist-item-raw animate-hover-item"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: id * 0.08 }}
              >
                <div className="ch-bullet-wrapper green-ch">
                  <Check size={12} className="ch-icon" />
                </div>
                <span className="ch-text-raw font-weight-500">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* COMPARATIVE CLARITY: IS NOT VS IS */}
        <div className="comparison-columns-grid">
          
          {/* IS NOT Column */}
          <motion.div 
            className="comparison-card glass-card not-card-border"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="block-header pb-12">
              <div className="icon-wrap-red">
                <AlertTriangle size={18} className="icon-red" />
              </div>
              <h3 className="block-title text-red-accent">What RetailX Is NOT</h3>
            </div>
            <div className="comparison-list">
              {whatNot.map((item, id) => (
                <div key={id} className="checklist-item-raw">
                  <div className="ch-bullet-wrapper red-cross">
                    <X size={12} className="cross-icon" />
                  </div>
                  <span className="ch-text-raw text-muted font-weight-500">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* IS Column */}
          <motion.div 
            className="comparison-card glass-card is-card-border"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="block-header pb-12">
              <div className="icon-wrap-lime">
                <ShieldCheck size={18} className="icon-lime" />
              </div>
              <h3 className="block-title text-accent">What RetailX IS</h3>
            </div>
            <div className="comparison-list">
              {whatIs.map((item, id) => (
                <div key={id} className="checklist-item-raw">
                  <div className="ch-bullet-wrapper green-ch-glowing">
                    <Check size={12} className="ch-icon" />
                  </div>
                  <span className="ch-text-raw font-weight-600">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
        </div>

      </div>
    </section>
  );
}
