import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import RetailXLogo from './landing/RetailXLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // If URL is /signup or query contains mode=signup, default to signup
  const isInitialSignup = location.pathname === '/signup' || location.search.includes('mode=signup');
  const [isLogin, setIsLogin] = useState(!isInitialSignup);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    // If user already has a token, redirect to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
      return;
    }

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
    fetchDbStatus();
  }, [navigate]);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleGoogleSignIn = () => {
    setError('');
    setLoading(true);

    try {
      // @ts-ignore
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "780137191210-ustgpb5vmdvltq656p25v8bpmm4ootcg.apps.googleusercontent.com";
      const redirectUri = window.location.origin + "/oauth-callback";
      const state = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      sessionStorage.setItem("oauth_state", state);

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent("openid email profile")}` +
        `&state=${state}` +
        `&prompt=select_account`;

      window.location.href = googleAuthUrl;
    } catch (err: any) {
      console.error("Initiate Google Oauth error:", err);
      setError("Failed to initiate Google sign-in: " + (err.message || err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          referralCode: localStorage.getItem('referralCode') 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      if (!isLogin) {
        localStorage.setItem('just_signed_up', 'true');
      }
      window.dispatchEvent(new Event('authSuccess'));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1B] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Simple Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <RetailXLogo showTagline={true} size="md" />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-all"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content: Split layout on desktop, stacked on mobile */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Hero Column (Desktop): Brand Showcase, handwritten quote, live index */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-start text-left pr-4">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-6 shadow-sm">
              <span>✨</span>
              <span>AI-Powered Market Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Smarter Insights. <br />
              <span className="text-[#2563EB]">Better Decisions.</span>
            </h1>

            <p className="text-base text-slate-300 max-w-md mb-8 leading-relaxed">
              Log in to your command center to access sub-second NSE telemetry, real-time AI Risk Guard, and automated behavioral safety systems.
            </p>

            {/* Handwritten-style accent text ('Discipline today. Freedom tomorrow.') */}
            <div className="mb-8 pl-1">
              <div 
                className="text-3xl text-blue-300 font-normal leading-tight"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                Discipline today. <br />
                <span className="text-white font-bold">Freedom tomorrow.</span>
              </div>
              <svg className="w-28 h-4 text-blue-400 -mt-1" viewBox="0 0 100 20" fill="none">
                <path d="M5 12C35 4 65 16 95 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Illustrative example */}
            <div className="w-full max-w-md mb-8">
              <div className="text-xs font-semibold text-slate-400 mb-2">Illustrative example</div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-[#0A1224] p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">NIFTY 50</div>
                  <div className="text-sm font-bold text-white font-mono">25,017.80</div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold mt-1">
                    <span>+0.73%</span>
                    <svg className="w-12 h-3.5 text-emerald-400" viewBox="0 0 40 14" fill="none">
                      <path d="M1 12L10 9L20 10L30 4L39 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="bg-[#0A1224] p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">BANK NIFTY</div>
                  <div className="text-sm font-bold text-white font-mono">51,230.45</div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold mt-1">
                    <span>+0.81%</span>
                    <svg className="w-12 h-3.5 text-emerald-400" viewBox="0 0 40 14" fill="none">
                      <path d="M1 11L10 8L20 9L30 3L39 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center pt-1.5">Sample data for illustration</p>
            </div>

            {/* Guarantees */}
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-blue-400 shrink-0" />
                <span>No credit card required for standard account</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-400 shrink-0" />
                <span>Bank-grade 256-bit AES encryption and privacy</span>
              </div>
            </div>

          </div>

          {/* Right Column: Modern Matching Auth Card */}
          <div className="col-span-1 lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px] bg-[#0A1628] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 relative">
              
              {/* Tab Switcher: Sign In vs Sign Up */}
              <div className="flex p-1 bg-[#070D1B] rounded-2xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    isLogin 
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-signin-btn"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    !isLogin 
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-signup-btn"
                >
                  Create Account
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="text-left mb-6">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {isLogin ? 'Welcome Back' : 'Get Started with RetailX'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isLogin 
                    ? 'Enter your credentials to access your trading desk.' 
                    : 'Join thousands of disciplined traders today.'}
                </p>
              </div>

              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0F1D33] hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 mb-5 shadow-sm active:scale-[0.98]"
                id="google-signin-btn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.84 2.97c.87-2.6 3.3-4.65 6.16-4.65z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0A1628] px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  or continue with email
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-left">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trader@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 text-left">
                      Password
                    </label>
                    {isLogin && (
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Password reset instructions will be sent to your registered email.');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-left animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-900 disabled:text-slate-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  id="submit-auth-btn"
                >
                  <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Free Account')}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Iframe Preview Notice if inside iframe */}
              {isIframe && (
                <div className="mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 text-center">
                  <span>Inside AI Studio preview? </span>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline font-semibold"
                  >
                    Open in New Tab ↗
                  </a>
                </div>
              )}

              {/* Bottom Switch text */}
              <div className="mt-6 text-center text-xs text-slate-400">
                <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-blue-400 hover:text-blue-300 font-bold ml-1 hover:underline"
                >
                  {isLogin ? 'Sign up for free' : 'Sign in here'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2024 RetailX. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-slate-300">Home</Link>
            <span className="text-slate-700">·</span>
            <Link to="/documentation" className="hover:text-slate-300">Documentation</Link>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400">NSE · BSE Market Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
