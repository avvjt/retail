import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';
import './PainStats.css';

const StatCard = ({ value, suffix, prefix, label, delay, decimals = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useCountUp(value, 2000, isInView, decimals);

  return (
    <motion.div 
      ref={ref}
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      <div className="stat-number">
        {prefix}{count}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
};

export default function PainStats() {
  return (
    <section className="pain-stats">
      <div className="section-container text-center">
        <span className="eyebrow">THE PROBLEM</span>
        <h2 className="section-headline">The Cost of <span className="text-red-accent font-bold">Emotion</span> vs. Power of <span className="text-green-accent font-bold">Discipline</span>.</h2>
        <p className="bridge-text">Strategy isn't the problem. Impulse is.</p>
        
        <div className="stats-bar">
          <StatCard 
            prefix="₹" 
            value={2.3} 
            decimals={1}
            suffix="L" 
            label="Avg. annual loss per trader" 
            delay={0.1} 
          />
          <div className="stats-divider"></div>
          <StatCard 
            prefix="" 
            value={78} 
            suffix="%" 
            label="Trades made under stress" 
            delay={0.2} 
          />
          <div className="stats-divider"></div>
          <StatCard 
            prefix="" 
            value={11} 
            suffix="s" 
            label="Gap before revenge trade" 
            delay={0.3} 
          />
        </div>
      </div>
    </section>
  );
}
