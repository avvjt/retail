import React from 'react';
import { motion } from 'framer-motion';
import './Features.css';

const features = [
  {
    title: "Revenge Trade Blocker",
    stat: "5 MIN",
    description: "Re-entry blocked automatically after a loss. No exceptions."
  },
  {
    title: "Daily Loss Lockout",
    stat: "₹0",
    description: "Hit your daily limit. Platform locks. Done for the day."
  },
  {
    title: "Discipline Score",
    stat: "87/100",
    description: "Track your behavioral process. Not just your P&L."
  }
];

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="section-container">
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <span className="eyebrow">BEHAVIORAL PROTECTION</span>
          <h2 className="section-headline" style={{ marginTop: '16px' }}>Guardrails. Engineered.</h2>
          <p className="bridge-text">RetailX doesn't predict the market. It protects you from yourself.</p>
        </div>

        <div className="features-list">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              className="feature-row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.1 * idx }}
            >
              <div className="fr-left monospace">0{idx + 1}</div>
              <div className="fr-center">
                <div className="fr-text">
                  <h3 className="fr-title">{feature.title}</h3>
                  <p className="fr-desc">{feature.description}</p>
                </div>
              </div>
              <div className="fr-right monospace">{feature.stat}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
