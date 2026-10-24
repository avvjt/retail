import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import RetailXLogo from './landing/RetailXLogo';
import './AuthModal.css';
export default function AuthModal() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db-verify');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error('Failed to query DB status:', err);
    }
  };
  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      if (
        e &&
        e.detail &&
        typeof e.detail.isLogin === 'boolean'
      ) {
        setIsLogin(e.detail.isLogin);
      }
      fetchDbStatus();
    };
    window.addEventListener('openAuth', handleOpen);
    if (window.location.search.includes('ref=')) {
      setIsOpen(true);
      setIsLogin(false);
      fetchDbStatus();
    }
    fetchDbStatus();
    return () => {
      window.removeEventListener('openAuth', handleOpen);
    };
  }, []);
  if (!isOpen) return null;
  const isIframe =
    typeof window !== 'undefined' &&
    window.self !== window.top;
  const handleGoogleSignIn = () => {
    setError('');
    setLoading(true);
    try {
      // @ts-ignore
      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '780137191210-ustgpb5vmdvltq656p25v8bpmm4ootcg.apps.googleusercontent.com';
      const redirectUri =
        window.location.origin + '/oauth-callback';
      const state =
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2);
      // Save state to sessionStorage to prevent CSRF
      sessionStorage.setItem('oauth_state', state);
      // Secure full-page redirect to Google's OAuth consent screen
      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&state=${state}` +
        `&prompt=select_account`;
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Initiate Google Oauth error:', err);
      setError(
        'Failed to initiate Google sign-in: ' +
        (err.message || err)
      );
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin
      ? '/api/login'
      : '/api/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          referralCode:
            localStorage.getItem('referralCode')
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || 'Authentication failed'
        );
      }
      // Save authentication token
      localStorage.setItem('token', data.token);
      // Mark newly created accounts
      if (!isLogin) {
        localStorage.setItem(
          'just_signed_up',
          'true'
        );
      }
      // Notify the rest of the application
      // that authentication succeeded.
      window.dispatchEvent(
        new Event('authSuccess')
      );
      // Close modal and clear form
      setIsOpen(false);
      setEmail('');
      setPassword('');
      /*
       * ADMIN LOGIN
       *
       * AdminPanel is mounted on the landing page.
       * Therefore, admins are sent to "/" first,
       * then the admin panel is opened after the
       * landing page has mounted.
       */
      if (
        isLogin &&
        data.user?.isAdmin === true
      ) {
        navigate('/');
        setTimeout(() => {
          window.dispatchEvent(
            new Event('openAdmin')
          );
        }, 300);
      } else {
        /*
         * NORMAL USER
         */
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.message || 'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AnimatePresence>
      <div
        className="auth-modal-overlay"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          className="auth-modal"
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="auth-close"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
          <div className="auth-modal-brand">
            <RetailXLogo
              size="sm"
              showTagline={false}
            />
          </div>
          {/* Tab Selector */}
          <div className="auth-tab-row">
            <button
              type="button"
              className={`auth-tab-btn ${
                isLogin ? 'active' : ''
              }`}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${
                !isLogin ? 'active' : ''
              }`}
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              Create Account
            </button>
          </div>
          <h2>
            {isLogin
              ? 'Welcome Back'
              : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Enter your details to sign in to RetailX.'
              : 'Get started with your free RetailX account today.'}
          </p>
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>
            <div className="input-group">
              <div className="input-header-row">
                <label>Password</label>
                {isLogin && (
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() =>
                      alert(
                        'Password reset instructions will be sent to your registered email.'
                      )
                    }
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="password-input-wrapper">
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  title={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : isLogin
                  ? 'Sign In'
                  : 'Sign Up'}
            </button>
          </form>
          <div className="auth-divider">
            or
          </div>
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              className="google-icon"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.84 2.97c.87-2.6 3.3-4.65 6.16-4.65z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
          {isIframe && (
            <div className="auth-iframe-helper">
              <p className="auth-iframe-tip">
                Running in preview pane?{' '}
                <span>
                  Browsers block Google Auth popups
                  inside sandboxed frames.
                </span>
              </p>
              <div
                className="iframe-actions-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '6px'
                }}
              >
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-iframe-link"
                >
                  Open in New Tab ↗
                </a>
              </div>
            </div>
          )}
          <div className="auth-switch">
            {isLogin
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin
                ? 'Sign up'
                : 'Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
