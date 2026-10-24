import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import './Pricing.css';

const PricingCard = ({ title, price, description, features, buttonClass, highlighted = false, delay }) => (
  <motion.div 
    className={`glass-card pricing-card ${highlighted ? 'pro-card' : ''}`}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay }}
  >
    {highlighted && <div className="pricing-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', verticalAlign: 'middle', marginBottom: '2px'}}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4l3 3"></path>
      </svg>
      MOST POPULAR
    </div>}
    <div className="pricing-header">
      <h3 className="pricing-title">{title}</h3>
      <div className="pricing-price">
        <AnimatePresence mode="wait">
          <motion.span 
            key={price}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {price}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="pricing-desc">{description}</p>
    </div>
    
    <ul className="pricing-features">
      {features.map((feature, i) => (
        <li key={i}>
          <Check size={18} className="check-icon" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    
    <button onClick={(e) => e.preventDefault()} className={`btn w-full ${buttonClass}`}>
      Join Now
    </button>
  </motion.div>
);

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="pricing">
      <div className="section-container">
        <div className="text-center">
          <span className="eyebrow">PRICING</span>
          <h2 className="section-headline">Protect your capital for less than a coffee.</h2>
          <p className="bridge-text">One bad revenge trade costs more than a year of RetailX.</p>
          
          <div className="pricing-toggle">
            <span className={!isYearly ? 'active' : ''}>Monthly</span>
            <button 
              className={`toggle-switch ${isYearly ? 'on' : 'off'}`}
              onClick={() => setIsYearly(!isYearly)}
            >
              <motion.div 
                className="toggle-knob" 
                layout 
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
              />
            </button>
            <span className={isYearly ? 'active' : ''}>Yearly <span className="discount">-20%</span></span>
          </div>
        </div>

        <div className="pricing-grid">
          <PricingCard 
            title="Free"
            price="₹0/mo"
            description="Basic loss limits + nudges"
            features={[
              '1 Connected Broker',
              'Basic Daily Loss Limit',
              'End of Day Report',
              'Standard Support'
            ]}
            buttonClass="btn-ghost pricing-btn-border"
            delay={0.1}
          />
          <PricingCard 
            title="Pro"
            price={isYearly ? '₹511/mo' : '₹639/mo'}
            description="Full behavioral protection + complete trading intelligence suite"
            features={[
              'Unlimited Broker Integration',
              'AI Risk Guard & Hard Lockouts',
              'Revenge Trade 60s Interrupts',
              'Smart Money Flow & Bulk Deals',
              'Paper Trading with ₹5L Virtual Wallet',
              'AlgoBuilder Strategy Backtester',
              'Real-time Discipline Score'
            ]}
            buttonClass="btn-primary"
            highlighted={true}
            delay={0.2}
          />
        </div>
      </div>
    </section>
  );
}
