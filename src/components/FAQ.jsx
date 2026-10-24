import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import './FAQ.css';

const faqs = [
  { q: "Does RetailX place trades on my behalf?", a: "No. Read-only API only. We never touch your funds." },
  { q: "Which brokers are supported at launch?", a: "Zerodha, Upstox, Angel One. More coming." },
  { q: "Is my trading data safe?", a: "SEBI-compliant, AES-256 encrypted, full audit logs." },
  { q: "Can I override the lockout?", a: "No. That's the entire point." },
  { q: "What if I'm already a disciplined trader?", a: "Even disciplined traders have emotional days. RetailX is your backup system." },
  { q: "When is the beta launching?", a: "Invite-only. Join the waitlist to get first access." }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="section-container">
        <div className="faq-header text-center">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-headline">Common Questions.</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="glass-card faq-item">
                <button 
                  className="faq-question" 
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                >
                  {faq.q}
                  <span className="faq-icon">
                    {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="faq-answer-container"
                    >
                      <div className="faq-answer">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
