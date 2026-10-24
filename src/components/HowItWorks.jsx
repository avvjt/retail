import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import './HowItWorks.css';

const Step = ({ number, title, description, delay }) => (
  <motion.div 
    className="hiw-step"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay }}
  >
    <div className="hiw-number">{number}</div>
    <h3 className="hiw-title">{title}</h3>
    <p className="hiw-description">{description}</p>
  </motion.div>
);

export default function HowItWorks() {
  const containerRef = useRef(null);
  
  return (
    <section id="how-it-works" className="how-it-works" ref={containerRef}>
      <div className="section-container text-center">
        <span className="eyebrow">HOW IT WORKS</span>
        <h2 className="section-headline">Between You and Your Worst Trade.</h2>
        <p className="bridge-text">Setup takes under 3 minutes. Protection starts immediately.</p>
        
        <div className="hiw-grid-container">
          <div className="hiw-grid">
            <Step 
              number="01"
              title="Connect Broker"
              description="Read-only API. We never touch your funds."
              delay={0.1}
            />
            <Step 
              number="02"
              title="AI Monitors"
              description="Real-time behavioral pattern detection."
              delay={0.2}
            />
            <Step 
              number="03"
              title="Intervention"
              description="Fires before you pull the trigger emotionally."
              delay={0.3}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
