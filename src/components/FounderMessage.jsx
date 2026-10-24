import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import './FounderMessage.css';

export default function FounderMessage() {
  return (
    <section className="founder-section" id="founder">
      <div className="section-container">
        <motion.div 
          className="founder-card glass-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="quote-badge">
            <Quote size={20} className="quote-icon" fill="currentColor" />
          </div>

          <div className="founder-grid">
            <div className="founder-quote-column">
              <span className="monospace quote-label text-accent">A Message from the Founder</span>
              <p className="founder-quote">
                &ldquo;Retail traders have been left behind by both institutions and the platforms meant to serve them. RetailX is a soul-aligned, AI-driven ecosystem that solves the real emotional and tactical challenges retail traders face daily. Starting with a behavioral analytics platform, this is just the beginning of something much larger - a system designed to restore confidence, precision, and timing to everyday traders. Our mission is simple: awaken a new era of intelligent, profitable decision-making for the masses.&rdquo;
              </p>
              <div className="signature-block">
                <div className="signature-name text-white">Raj Deep Chaudhary</div>
                <div className="signature-title text-muted monospace">Founder &amp; Principal Architect, RetailX</div>
              </div>
            </div>

            <div className="founder-thesis-column">
              <h4 className="thesis-title">The Operational Thesis</h4>
              <p className="thesis-point">Most traders do not need more indicators.</p>
              <p className="thesis-point">Most traders do not need more information.</p>
              <p className="thesis-point highlight">Most traders need protection from the mistakes they repeatedly make.</p>
              
              <div className="thesis-divider"></div>

              <p className="thesis-future">
                The future of trading is not faster execution.
                <br />
                The future of trading is <strong>better decision‑making</strong>.
              </p>
              <p className="thesis-future-tagline monospace text-accent">
                That is the future RetailX is building.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
