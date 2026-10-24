import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FinalCTA.css';

export default function FinalCTA() {
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
    <section className="final-cta-section" id="final-cta">
      <div className="section-container">
        <motion.div 
          className="final-cta-card glass-card text-center"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="cta-glow-element"></div>
          
          <div className="cta-badge-wrapper">
            <span className="badge">
              <Sparkles size={12} />
              FREE BETA PROGRAM
            </span>
          </div>

          <h2 className="cta-title">
            Stop Trading Against the Market.
            <br />
            Stop Trading Against Yourself.
            <br />
            <span className="text-accent gradient-text-lime">Start Trading With Intelligence.</span>
          </h2>

          <div className="cta-button-container">
            <button onClick={handleActionClick} className="btn btn-primary cta-action-btn">
              <UserPlus size={15} style={{ marginRight: '8px' }} /> 
              {user && user.hasSubmitted ? "Go to Dashboard" : "Join Early Access - Free"}
            </button>
          </div>

          <p className="cta-terms-detail">
            First 1,000 members get RetailX Pro free for 6 months. No credit card. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
