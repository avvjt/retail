import React from 'react';
import { motion } from 'framer-motion';
import { EyeOff, Flame, AlertOctagon } from 'lucide-react';
import './InvisibleProblem.css';

export default function InvisibleProblem() {
  const enemies = [
    {
      id: 1,
      title: "Information Asymmetry",
      desc: "Institutions see order flow, liquidity and positioning. Retail traders see candles.",
      icon: <EyeOff size={18} className="enemy-icon-glyph text-red" />
    },
    {
      id: 2,
      title: "Emotional Decision-Making",
      desc: "Fear. Greed. Revenge trading. A single impulsive trade can destroy weeks of progress.",
      icon: <Flame size={18} className="enemy-icon-glyph text-red" />
    },
    {
      id: 3,
      title: "No Risk Intelligence",
      desc: "Most traders know how to enter. Almost nobody knows when to walk away.",
      icon: <AlertOctagon size={18} className="enemy-icon-glyph text-red" />
    }
  ];

  return (
    <section className="invisible-problem-section">
      <div className="section-container">
        <div className="problem-header text-center">
          <span className="eyebrow">THE INVISIBLE PROBLEM</span>
          <h2 className="section-headline">They want you to <span className="text-red-accent font-bold">trade more</span>, not <span className="text-green-accent font-bold">win more</span>.</h2>
          <p className="bridge-text text-white">
            Every trading platform today is optimized for higher activity and transaction volume. Nobody benefits when you stay disciplined or avoid a bad trade. That's why retail traders face 3 invisible enemies:
          </p>
        </div>

        <div className="enemies-grid">
          {enemies.map((enemy, idx) => (
            <motion.div 
              key={enemy.id}
              className="enemy-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <div className="enemy-icon">
                {enemy.icon}
                <span className="monospace enemy-num">0{enemy.id}</span>
              </div>
              <h3 className="enemy-title">{enemy.title}</h3>
              <p className="enemy-desc text-muted">{enemy.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
