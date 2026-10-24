import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Verifying your Google account...');

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Google login failed: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received from Google.');
        return;
      }

      // Verify OAuth State to protect against CSRF attacks
      const savedState = sessionStorage.getItem('oauth_state');
      if (state && savedState && state !== savedState) {
        setError('Security warning: OAuth state parameter mismatch. Session could be hijacked.');
        return;
      }

      try {
        setStatus('Exchanging authentication code...');
        const res = await fetch('/api/google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            authCode: code,
            redirectUri: window.location.origin + '/oauth-callback'
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Identity provider login failed');
        }

        setStatus('Securing session tokens...');
        localStorage.setItem('token', data.token);
        if (data.isNewUser) {
          localStorage.setItem('just_signed_up', 'true');
        }
        
        // Dispatch callback event to refresh other parts of the UI (such as Navbar)
        window.dispatchEvent(new Event('authSuccess'));

        setStatus('Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);

      } catch (err) {
        console.error('OAuth Callback flow error:', err);
        setError(err.message || 'An unexpected error occurred during Google sign-in.');
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md p-8 bg-zinc-950/85 border border-zinc-800/60 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Neon accent glow lines at the top of the card */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-lime-400 via-green-500 to-emerald-400" />

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-zinc-100">
            Retail<span className="text-lime-400">X</span> Secure Sign-In
          </h2>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-8">
            Behavioral Protection Node
          </p>

          {error ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-red-200">
                <AlertCircle className="w-10 h-10 text-red-500 mb-1" />
                <p className="text-sm font-medium leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-zinc-300 transition text-sm font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Homepage
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-lime-400 animate-spin mb-2" />
              <p className="text-zinc-300 font-medium text-sm transition-all duration-300">
                {status}
              </p>
              <p className="text-zinc-600 text-[11px] font-mono">
                Bypassing cookie limits • Cross-device safe
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
