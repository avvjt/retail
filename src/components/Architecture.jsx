import React from 'react';
import './Architecture.css';

export default function Architecture() {
  return (
    <section className="architecture">
      <div className="section-container">
        <div className="text-center arch-header">
          <span className="eyebrow">QUANT-AI OS</span>
          <h2 className="section-headline">Quant-Grade Infrastructure.</h2>
          <p className="bridge-text">Built like a hedge fund's risk desk. Designed for the individual trader.</p>
        </div>

        <div className="arch-table-container glass-card">
          <div className="arch-table-header">
            <div className="arch-col monospace">TRADITIONAL BROKER</div>
            <div className="arch-col monospace right">WITH RETAILX</div>
          </div>
          
          <div className="arch-table-row">
            <div className="arch-col old-way">Emotional re-entry</div>
            <div className="arch-col new-way right">Blocked automatically</div>
          </div>
          
          <div className="arch-table-row">
            <div className="arch-col old-way">No loss limit enforcement</div>
            <div className="arch-col new-way right">Hard daily lockout</div>
          </div>
          
          <div className="arch-table-row">
            <div className="arch-col old-way">P&L is the only metric</div>
            <div className="arch-col new-way right">Discipline score tracked</div>
          </div>
          
          <div className="arch-table-row">
            <div className="arch-col old-way">Revenge trades happen</div>
            <div className="arch-col new-way right">Detected and stopped</div>
          </div>
          
          <div className="arch-table-row">
            <div className="arch-col old-way">You're on your own</div>
            <div className="arch-col new-way right">AI monitors every trade</div>
          </div>
          
          <div className="arch-table-row last-row">
            <div className="arch-col old-way">No behavioral data</div>
            <div className="arch-col new-way right">Full psychology report</div>
          </div>
        </div>
      </div>
    </section>
  );
}
