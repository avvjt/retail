import React from 'react';
import './LogoBar.css';

const LOGOS = ['ZERODHA', 'UPSTOX', 'ANGEL ONE', 'DHAN', 'FYERS', 'GROWW', 'BINANCE', 'BYBIT'];

export default function LogoBar() {
  return (
    <div className="logobar">
      <div className="logobar-label monospace text-muted">Integrated with</div>
      <div className="logobar-track-container">
        <div className="logobar-track">
          {/* Duplicate for infinite scroll effect */}
          {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, index) => (
            <div key={index} className="logobar-item">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
