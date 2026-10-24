import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Users, Gift, Mail, Send, Link2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Referrals({ theme }) {
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    fetch('/api/settings/profile', { headers })
      .then(res => res.json())
      .then(data => { if (!data.error) setProfile(data); })
      .catch(() => {});
    fetch('/api/settings/referrals', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setReferrals(data); })
      .catch(() => {});
  }, []);

  const referralCode = profile?.referralCode || (profile?.userId ? `RTLX-${profile.userId}` : '');
  const inviteUrl = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}/invite/${referralCode}`
    : (typeof window !== 'undefined' ? `${window.location.origin}/invite/` : '');

  const copyText = async (text, setCopied) => {
    if (!text) return;
    let successful = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        successful = true;
      }
    } catch (e) {
      console.warn('Clipboard API blocked, using fallback', e);
    }

    if (!successful) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        successful = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.error('Copy fallback failed', e);
      }
    }

    if (successful) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSendInvite = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = inviteEmail.trim();
    if (!cleanEmail) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referredEmail: cleanEmail })
      });
      const data = await res.json();

      if (data.error) {
        setStatusMessage({ type: 'error', text: data.error });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Invitation successfully sent to ${cleanEmail}!`
        });
        setInviteEmail('');
        if (data.id) {
          setReferrals(prev => [data, ...prev]);
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Network error sending invitation. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const totalPoints = referrals.reduce((acc, curr) => acc + (Number(curr.pointsEarned) || 0), 0);

  return (
    <div className={`w-full p-4 sm:p-6 lg:p-8 h-full overflow-y-auto ${isDark ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-[#fafafa] text-zinc-900'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
            </div>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-1.5`}>
              Invite traders and colleagues. Earn reward points and unlock premium institutional features.
            </p>
          </div>
        </div>

        {/* Stats Grid - 3 Balanced Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Points Earned */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111] border-emerald-500/20' : 'bg-white border-emerald-200 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Points Earned</span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Gift className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-500">{totalPoints}</div>
              <p className="text-xs opacity-60 mt-1">+50 pts for every active referral</p>
            </div>
          </div>

          {/* Total Referrals */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Total Referrals</span>
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Users className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-blue-500">{referrals.length}</div>
              <p className="text-xs opacity-60 mt-1">Traders joined via your network</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Your Code</span>
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Sparkles className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-2xl font-bold font-mono tracking-wide text-purple-400">
                {referralCode || '...'}
              </div>
              <button
                type="button"
                onClick={() => copyText(referralCode, setCodeCopied)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                  codeCopied
                    ? 'bg-emerald-500 text-white'
                    : isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                }`}
              >
                {codeCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Action Box: Referral Links & Send Invite */}
        <div className={`p-6 sm:p-7 rounded-2xl border space-y-7 ${isDark ? 'bg-[#111] border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'}`}>
          {/* 1. Your Personal Referral Link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                Your Personal Referral Link
              </label>
              {linkCopied && (
                <span className="text-xs font-medium text-emerald-500 inline-flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Link copied to clipboard
                </span>
              )}
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mb-3`}>
              Share this unique link anywhere. When someone creates an account through it, you both earn bonus points.
            </p>

            {/* Robust Responsive Copy Row */}
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl border transition-all ${
              isDark ? 'bg-black/50 border-zinc-800 focus-within:border-blue-500/60' : 'bg-zinc-50/80 border-zinc-300 focus-within:border-blue-500'
            }`}>
              <div className="flex-1 min-w-0 flex items-center px-3.5 py-2.5 sm:py-3 gap-2.5">
                <Link2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  onClick={(e) => e.target.select()}
                  placeholder="Generating referral link..."
                  className={`w-full min-w-0 bg-transparent text-xs sm:text-sm font-mono outline-none select-all truncate ${
                    isDark ? 'text-zinc-200' : 'text-zinc-800'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => copyText(inviteUrl, setLinkCopied)}
                className={`shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold rounded-b-xl sm:rounded-b-none sm:rounded-r-xl transition-all ${
                  linkCopied
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm'
                }`}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={`h-px w-full ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />

          {/* 2. Invite by Email */}
          <div>
            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
              Invite Colleague by Email
            </label>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mb-3`}>
              We will send an invitation directly to their inbox with your referral code attached.
            </p>

            {/* Robust Responsive Send Invite Row */}
            <form onSubmit={handleSendInvite}>
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl border transition-all ${
                isDark ? 'bg-black/50 border-zinc-800 focus-within:border-emerald-500/60' : 'bg-zinc-50/80 border-zinc-300 focus-within:border-emerald-500'
              }`}>
                <div className="flex-1 min-w-0 flex items-center px-3.5 py-2.5 sm:py-3 gap-2.5">
                  <Mail className={`w-4 h-4 shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    placeholder="colleague@example.com"
                    disabled={isSending}
                    className={`w-full min-w-0 bg-transparent text-xs sm:text-sm outline-none placeholder:text-zinc-400 ${
                      isDark ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending || !inviteEmail.trim()}
                  className={`shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold rounded-b-xl sm:rounded-b-none sm:rounded-r-xl transition-all ${
                    isSending || !inviteEmail.trim()
                      ? 'bg-zinc-700/50 text-zinc-400 cursor-not-allowed opacity-75'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm'
                  }`}
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Inline Status Message */}
            {statusMessage && (
              <div
                className={`mt-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : isDark
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Referrals Section */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight">Recent Referrals</h2>
            <span className="text-xs opacity-60 font-mono">
              {referrals.length} {referrals.length === 1 ? 'invite' : 'invites'}
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className={`text-center py-8 rounded-xl border border-dashed ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No referrals recorded yet</p>
              <p className="text-xs mt-1 opacity-70">Share your invite link above or invite a colleague by email to get started!</p>
            </div>
          ) : (
            <div className={`divide-y rounded-xl border overflow-hidden ${isDark ? 'divide-zinc-800 border-zinc-800 bg-black/40' : 'divide-zinc-200 border-zinc-200 bg-zinc-50/50'}`}>
              {referrals.map((r, i) => (
                <div key={r.id || i} className="px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {(r.referredEmail || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-xs sm:text-sm font-medium truncate">
                        {r.referredEmail}
                      </div>
                      {r.createdAt && (
                        <div className="text-[10px] opacity-50">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                        r.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {r.status === 'completed' ? 'Joined' : 'Pending'}
                      <span className="font-bold">+{r.pointsEarned || 50} pts</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

