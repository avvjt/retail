import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenAuth = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event('openAuth'));
  };

  const handleOpenAdmin = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event('openAdmin'));
  };

  const handleOpenDashboard = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    navigate('/dashboard');
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkAuth();
    
    // Listen for auth success to update UI
    const onAuthSuccess = () => checkAuth();
    window.addEventListener('authSuccess', onAuthSuccess);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('authSuccess', onAuthSuccess);
    };
  }, []);

  const handleOpenWaitlist = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event('openWaitlist'));
  };

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="/" className="logo">
          <img src="https://i.ibb.co/b5Mr19wz/IMG-20260612-111704.png" alt="RetailX" className="logo-image" referrerPolicy="no-referrer" />
        </a>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href}>{link.name}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">{user.email}</span>
              <button onClick={() => {
                localStorage.removeItem('token');
                setUser(null);
                window.location.reload();
              }} className="nav-login">Log Out</button>
              <button onClick={user.isAdmin ? handleOpenAdmin : handleOpenDashboard} className="nav-cta">Go to Dashboard</button>
            </>
          ) : (
            <>
              <button onClick={handleOpenAuth} className="nav-login">Log In</button>
              <button onClick={handleOpenWaitlist} className="nav-cta">Get Early Access</button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="mobile-nav">
              <ul>
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mobile-actions">
                {user ? (
                  <>
                    <button onClick={() => {
                      localStorage.removeItem('token');
                      setUser(null);
                      setMobileMenuOpen(false);
                      window.location.reload();
                    }} className="nav-login mobile">Log Out</button>
                    <button 
                      className="nav-cta mobile"
                      onClick={(e) => {
                        if (user.isAdmin) {
                          handleOpenAdmin(e);
                        } else {
                          handleOpenDashboard(e);
                        }
                      }}
                    >
                      Go to Dashboard
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleOpenAuth} className="nav-login mobile">Log In</button>
                    <button 
                      className="nav-cta mobile"
                      onClick={handleOpenWaitlist}
                    >
                      Get Early Access
                    </button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
