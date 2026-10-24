import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AnnouncementPopup.css';

export default function AnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [dashboardOrAdminActive, setDashboardOrAdminActive] = useState(false);
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

  useEffect(() => {
    const onOpen = () => {
      setDashboardOrAdminActive(true);
      setIsVisible(false);
    };
    const onClose = () => {
      setDashboardOrAdminActive(false);
    };

    window.addEventListener('openDashboard', onOpen);
    window.addEventListener('openAdmin', onOpen);
    window.addEventListener('closeDashboard', onClose);
    window.addEventListener('closeAdmin', onClose);

    return () => {
      window.removeEventListener('openDashboard', onOpen);
      window.removeEventListener('openAdmin', onOpen);
      window.removeEventListener('closeDashboard', onClose);
      window.removeEventListener('closeAdmin', onClose);
    };
  }, []);

  useEffect(() => {
    if (dashboardOrAdminActive || (user && user.hasSubmitted)) {
      setIsVisible(false);
      return;
    }

    // Show popup 3 seconds after page load
    const timer = setTimeout(() => {
      if (!dashboardOrAdminActive && !(user && user.hasSubmitted)) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [dashboardOrAdminActive, user]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleActionClick = (e) => {
    e.preventDefault();
    handleDismiss();
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
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="announcement-popup-container"
          initial={{ opacity: 0, y: 50, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        >
          <div className="announcement-popup-card glass-card">
            {/* Red alert bar top decorative */}
            <div className="announcement-top-bar" />

            <button 
              onClick={handleDismiss} 
              className="announcement-close-btn"
              aria-label="Dismiss Announcement"
            >
              <X size={15} />
            </button>

            <div className="announcement-header-row">
              <div className="announcement-icon-badge">
                <ShieldAlert size={14} className="text-red-accent" />
              </div>
              <span className="monospace warning-label">Crucial Reality Alert</span>
            </div>

            <div className="announcement-body">
              <h4 className="announcement-title">The Trader's Trap</h4>
              <p className="announcement-desc">
                <strong>90% of traders</strong> don’t lose because they lack information. They lose because they make <span className="highlight-red">one bad decision</span> at the wrong moment.
              </p>
              <p className="announcement-sub-desc">
                And no one stops them. RetailX fixes this.
              </p>
            </div>

            <div className="announcement-actions">
              <button 
                onClick={handleActionClick}
                className="announcement-btn"
              >
                {user && user.hasSubmitted ? "Go to Dashboard" : "Learn More"}
              </button>
              <button onClick={handleDismiss} className="announcement-btn-dismiss">
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
