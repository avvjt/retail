import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RetailXLogo from './RetailXLogo';

interface LandingNavbarProps {
  onOpenAuth: (isLogin?: boolean) => void;
}

export default function LandingNavbar({ onOpenAuth }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

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
            const data = await res.json();
            setUser(data);
          }
        } catch {
          // Ignore
        }
      }
    };
    checkAuth();

    const onAuthSuccess = () => checkAuth();
    window.addEventListener('authSuccess', onAuthSuccess);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('authSuccess', onAuthSuccess);
    };
  }, []);

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onOpenAuth(true);
  };

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (user) {
      navigate('/dashboard');
    } else {
      onOpenAuth(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        /* Mobile: Pure white background matching uploaded screenshot. Desktop: Deep navy */
        scrolled
          ? 'bg-white/95 lg:bg-[#070D1B]/95 backdrop-blur-md border-b border-slate-200/80 lg:border-slate-800/80 py-3 shadow-sm lg:shadow-lg lg:shadow-black/20'
          : 'bg-white lg:bg-[#070D1B] border-b border-slate-100 lg:border-slate-800/60 py-3.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand Logo with Tagline */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 group"
          id="landing-logo-btn"
        >
          {/* Mobile uses light theme (dark text) matching screenshot; Desktop uses dark theme */}
          <div className="lg:hidden">
            <RetailXLogo showTagline={true} size="md" theme="light" />
          </div>
          <div className="hidden lg:block">
            <RetailXLogo showTagline={true} size="md" theme="dark" />
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
          >
            Home
          </a>
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('value-strip')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Why RetailX
          </button>
          <button
            onClick={() => scrollToSection('copilot-preview')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            AI Copilot
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection('blog')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Blog
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Right: Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all"
            >
              <UserCheck size={16} />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                id="desktop-signin-btn"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-md shadow-blue-600/30 transition-all hover:translate-y-[-1px]"
                id="desktop-getstarted-btn"
              >
                <span>Get Started Free</span>
                <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Button (Black/charcoal 3 horizontal bars matching screenshot) */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-slate-900" />
            ) : (
              /* Custom 3-bar hamburger icon matching the exact stroke in the screenshot */
              <svg className="w-6 h-6 text-slate-900 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl text-slate-900 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('value-strip')}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Why RetailX
            </button>
            <button
              onClick={() => scrollToSection('copilot-preview')}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              AI Copilot
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('blog')}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Blog
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              FAQ
            </button>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm"
              >
                <UserCheck size={16} />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="w-full py-2.5 text-center text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  id="mobile-drawer-signin-btn"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 text-center text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
                  id="mobile-drawer-getstarted-btn"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
