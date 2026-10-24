import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Shield, Sparkles, ArrowRight, Star } from 'lucide-react';

export default function Billing({ theme }) {
  const isDark = theme === 'dark';
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/billing/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load subscription status');
      const data = await res.json();
      setSubscription(data);
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching billing details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to authenticate payment block');
      const data = await res.json();
      alert('Congratulations! Your account has been upgraded to PRO. All premium quantitative tables, options matrices, and algorithmic backtesting modules are now fully unlocked!');
      await fetchSubscription();
      
      // Fast hard reload or state notification so top-level App context picks up Pro subscription
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('Upgrade transaction failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#c8f135]/15 text-[#c8f135]' : 'bg-black/5 text-black'}`}>
          <CreditCard size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Billing & Subscriptions</h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your subscription tier, view historic receipts, and upgrade quantitative execution nodes.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Subscription Status Card */}
          <div className={`p-6 rounded-3xl border flex flex-col justify-between ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <div>
              <h3 className="font-bold text-sm mb-4">Current Subscription Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Active Plan Tier</span>
                  <span className={`inline-block px-3 py-1.5 rounded-full font-bold uppercase text-xs ${
                    subscription?.status === 'pro' 
                      ? (isDark ? 'bg-[#c8f135]/15 text-[#c8f135]' : 'bg-emerald-500/15 text-emerald-600') 
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {subscription?.status === 'pro' ? '🏆 Pro Active' : 'Free Basic Member'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Billing Interval</span>
                  <p className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
                    {subscription?.status === 'pro' ? 'Monthly Auto-Renewal' : 'No Active Billing Session'}
                  </p>
                </div>

                {subscription?.status === 'pro' && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Next Renewal Date</span>
                    <p className={`text-xs font-mono font-bold ${isDark ? 'text-[#c8f135]' : 'text-emerald-700'}`}>
                      {new Date(subscription.renewalAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {subscription?.status !== 'pro' && (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 mt-8 ${
                  upgrading 
                    ? 'bg-gray-500/20 text-gray-400' 
                    : (isDark ? 'bg-[#c8f135] text-black hover:bg-[#b0d626]' : 'bg-black text-white hover:bg-gray-900')
                }`}
              >
                <Sparkles size={12} fill="currentColor" /> {upgrading ? 'Upgrading Account...' : 'Upgrade to Pro Premium'}
              </button>
            )}
          </div>

          {/* Premium Plan benefits description Card */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
              <Star size={14} className={isDark ? 'text-[#c8f135] fill-[#c8f135]' : 'text-amber-500 fill-amber-500'} /> Why Upgrade to PRO?
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Smart Money Flow Monitor</h4>
                  <p className="text-gray-400 mt-1 leading-relaxed">Track FII & DII liquid indices cash allocations and bulk deals on the NSE in real-time.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>No-Code Algorithm Backtester</h4>
                  <p className="text-gray-400 mt-1 leading-relaxed">Verify mathematical strategy win-rates and trade distributions over historical indices candles.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Full Option Chain OI Matrix</h4>
                  <p className="text-gray-400 mt-1 leading-relaxed">Audit total Put-Call Ratio (PCR) trends and pinpoint support/resistance levels.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Broker API Bridging Access</h4>
                  <p className="text-gray-400 mt-1 leading-relaxed">Connect Zerodha Kite, Upstox, and Angel One accounts. Seamless paper vs live trading modes.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Required Disclaimer */}
      <div className={`p-4 rounded-xl border text-center text-xs ${isDark ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-gray-100 border-black/5 text-gray-500'}`}>
        Educational information, not investment advice.
      </div>
    </div>
  );
}
