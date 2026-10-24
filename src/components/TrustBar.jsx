import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import './TrustBar.css';

export default function TrustBar() {
  const pillars = [
    "Smart Money Intelligence",
    "Risk Protection Engine",
    "Behavioral AI Layer",
    "Institutional-Grade Insights"
  ];

  return (
    <section className="trustbar-section">
      <div className="section-container">
        <motion.div 
          className="trustbar-wrapper glass-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="trustbar-intro">
            <span className="monospace caption-label text-muted">Core Foundation</span>
            <h3 className="trustbar-headline">
              Built by traders who’ve <span className="text-red-accent font-semibold">lost money</span>. Backed by <span className="text-green-accent font-semibold">behavioral science</span>. Privacy-first. No calls, no tips, no BS.
            </h3>
          </div>

          <div className="trustbar-divider" />

          <div className="trustbar-pillars">
            {pillars.map((pillar, i) => (
              <motion.div 
                key={pillar} 
                className="pillar-item"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="check-badge">
                  <Check size={12} className="check-icon" />
                </div>
                <span className="pillar-text">{pillar}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
