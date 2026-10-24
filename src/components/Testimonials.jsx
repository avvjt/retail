import React from 'react';
import './Testimonials.css';

const testimonials = [
  {
    quote: "Got locked out on day 3. Checked my journal. RetailX was right.",
    name: "Karan D.",
    role: "Crypto Trader",
    saved: "₹40,000 saved"
  },
  {
    quote: "I stopped chasing P&L and started tracking my behavior. Game changer.",
    name: "Priya S.",
    role: "Intraday Equity",
    saved: "3 blown accounts → 0"
  },
  {
    quote: "The pre-trade checklist cut my impulsive entries by 60%. Simple but brutal.",
    name: "Rohit M.",
    role: "NSE Options",
    saved: "60% fewer bad trades"
  }
];

export default function Testimonials() {
  return (
    <section className="testimonials">
      <div className="section-container text-center">
        <span className="eyebrow">COMMUNITY</span>
        <h2 className="section-headline">Traders Like You.</h2>
        <p className="bridge-text">Early beta users are already seeing the difference.</p>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-card testimonial-glass">
              <p className="tg-quote">"{t.quote}"</p>
              <div className="tg-divider"></div>
              <div className="tg-author-info">
                <span className="tg-name">{t.name}</span>
                <span className="tg-role">{t.role}</span>
              </div>
              <div className="saved-badge">{t.saved}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
