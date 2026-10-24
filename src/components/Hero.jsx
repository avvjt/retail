import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error(e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    
    window.addEventListener('authSuccess', checkAuth);
    window.addEventListener('newSubmissionSaved', checkAuth);
    return () => {
      window.removeEventListener('authSuccess', checkAuth);
      window.removeEventListener('newSubmissionSaved', checkAuth);
    };
  }, []);

  const handleActionClick = (e) => {
    e.preventDefault();
    if (!user) {
      window.dispatchEvent(new Event('openAuth'));
    } else if (user.hasSubmitted) {
      if (user.isAdmin) {
        window.dispatchEvent(new Event('openAdmin'));
      } else {
        navigate('/dashboard');
      }
    } else {
      window.dispatchEvent(new Event('openWaitlist'));
    }
  };

  return (
    <section className="hero">
      <div className="section-container hero-container">
        
        {/* Left Column: Text */}
        <div className="hero-content">
          
          <motion.h1 
            className="hero-headline"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-green-accent">Trade</span> without <span className="text-red-accent">emotion</span>.
          </motion.h1>
          
          <motion.h2 
            className="hero-subheadline"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Protect your capital in real time.
          </motion.h2>
          
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button onClick={handleActionClick} className="btn btn-primary">
              {user && user.hasSubmitted ? "Go to Dashboard" : "Get Early Access"}
            </button>
            <a href="#how-it-works" className="link-ghost">See How It Works &rarr;</a>
          </motion.div>
        </div>

        {/* Right Column: Dashboard Mockup */}
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <div className="glow-circle"></div>
          <div className="mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="mockup-title monospace">RetailX Active</div>
            </div>
            
            <div className="mockup-chart">
              <svg viewBox="0 0 400 150" className="chart-svg">
                {/* Grid */}
                <path d="M0 30 H400 M0 60 H400 M0 90 H400 M0 120 H400" className="chart-grid" />
                {/* Drawdown */}
                <path d="M0 30 L40 40 L80 80 L120 110 L160 130" className="chart-line-loss" />
                {/* Intervention / Flatline */}
                <path d="M160 130 L200 130 L240 128 L280 130 L320 125 L360 128 L400 130" className="chart-line-flat" />
                {/* Marker */}
                <line x1="160" y1="0" x2="160" y2="150" className="chart-marker" />
                <text x="165" y="20" className="chart-marker-text">RetailX Enabled</text>
              </svg>
            </div>
            
            <div className="mockup-status-row">
              <div className="status-pill red">
                <span className="dot"></span> Revenge Blocked
              </div>
              <div className="status-pill yellow">
                <span className="dot"></span> Cooldown: 4:32
              </div>
              <div className="status-pill green">
                <span className="dot"></span> Score: 87
              </div>
            </div>

            <div className="mockup-banner">
              <span className="blink-dot"></span>
              LOCKOUT ACTIVE
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
