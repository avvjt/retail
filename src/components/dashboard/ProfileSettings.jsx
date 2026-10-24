import React, { useState, useEffect } from 'react';
import { Activity, Target, 
  User, 
  Shield, 
  Moon, 
  Sun, 
  Loader2, 
  CheckCircle2, 
  Bell, 
  Check, 
  AlertCircle, 
  Smartphone, 
  Volume2,
  Lock,
  ExternalLink,
  VolumeX,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Compass,
  Percent
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { 
  isNotificationSupported, 
  getNotificationPermissionState, 
  requestNotificationPermission, 
  getNotificationSettings, 
  saveNotificationSettings,
  isInsideIframe,
  isNativeNotificationSupported,
  notifyUserOfAlert
} from '../../utils/notifications';

export default function ProfileSettings() {
  // @ts-ignore
  const { theme, toggleTheme, user } = useOutletContext();
  const isDark = theme === 'dark';

  const [riskTolerance, setRiskTolerance] = useState('Moderate');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Notifications State
  const [notifSupported, setNotifSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('default');
  const [notifSettings, setNotifSettings] = useState({
    enabled: true,
    minSeverity: 'High',
    allowedInstruments: ['NIFTY50', 'BANKNIFTY', 'SENSEX', 'USDINR', 'CRUDEOIL'],
    aiCuratedOnly: true,
    playChime: true
  });
  const [testNotificationStatus, setTestNotificationStatus] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);
  const [stylePreference, setStylePreference] = useState(null);
  
  const [scores, setScores] = useState({
    edgeScore: 7.1,
    subScores: { risk: 8, discipline: 6, strategy: 7 },
    health: { disciplinePct: 75, riskControlPct: 82, overtradingLevel: 'Medium', emotionalControl: 'Fair' }
  });

  const handleResetScores = () => {
    setScores({
      edgeScore: 10.0,
      subScores: { risk: 10, discipline: 10, strategy: 10 },
      health: { disciplinePct: 100, riskControlPct: 100, overtradingLevel: 'Low', emotionalControl: 'Excellent' }
    });
  };

  // Fetch current profile settings from database
  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok && active) {
          const data = await res.json();
          if (data.riskTolerance) {
            setRiskTolerance(data.riskTolerance);
          }
          if (data.stylePreference) {
            setStylePreference(data.stylePreference);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile settings', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();

    // Set notification details
    setNotifSupported(isNotificationSupported());
    setPermissionState(getNotificationPermissionState());
    setNotifSettings(getNotificationSettings());
    setIsSandbox(isInsideIframe());

    // Listen for permission changes inside dashboard
    const handlePermissionChange = () => {
      setPermissionState(getNotificationPermissionState());
    };

    // Listen for completed quiz assessment inside Settings to update profile preference view
    const handleQuizCompleted = (e) => {
      if (e.detail && e.detail.stylePreference) {
        setStylePreference(e.detail.stylePreference);
      }
    };

    window.addEventListener('retailx_notification_permission_changed', handlePermissionChange);
    window.addEventListener('trading_quiz_completed', handleQuizCompleted);

    return () => {
      active = false;
      window.removeEventListener('retailx_notification_permission_changed', handlePermissionChange);
      window.removeEventListener('trading_quiz_completed', handleQuizCompleted);
    };
  }, []);

  const handleRiskChange = async (newRisk) => {
    setRiskTolerance(newRisk);
    setSaving(true);
    setSaveMessage('Saving selection...');
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riskTolerance: newRisk })
      });

      if (res.ok) {
        setSaveMessage('Saved successfully!');
      } else {
        setSaveMessage('Failed to save selection.');
      }
    } catch (err) {
      console.error('Error saving risk preference', err);
      setSaveMessage('Error saving preference.');
    } finally {
      setTimeout(() => {
        setSaving(false);
        setSaveMessage('');
      }, 2000);
    }
  };

  const handleSaveNotifSettings = (updated) => {
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionState(perm);
  };

  const handleSendTestNotification = () => {
    if (permissionState !== 'granted') {
      setTestNotificationStatus('Please enable alerts first.');
      setTimeout(() => setTestNotificationStatus(''), 3000);
      return;
    }

    try {
      // Trigger via the utility which will broadcast the event for simulated toast and native notifications
      notifyUserOfAlert({
        id: `test-alert-${Date.now()}`,
        title: '🚨 NIFTY50 Breakout Alert',
        observation: 'NIFTY50 broke out of the 24,000 supply zone with 1.8x average volume. Useful market observation successfully routed to your device.',
        severity: 'High',
        category: 'Breakout',
        instrument: 'NIFTY50',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
      });
      
      setTestNotificationStatus('🔔 Premium test alert fired! Watch the top right of your screen.');
      setTimeout(() => setTestNotificationStatus(''), 4500);
    } catch (err) {
      console.error("Test notification failed:", err);
      setTestNotificationStatus('Failed to trigger. Check device notifications.');
      setTimeout(() => setTestNotificationStatus(''), 4000);
    }
  };

  const glassCard = `rounded-2xl border p-6 transition-all ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]'
  }`;

  const displayName = user?.email ? user.email.split('@')[0] : 'Trader Pro';
  const displayEmail = user?.email || 'pro@example.com';
  const initials = displayEmail.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Profile Info */}
      <div className={`${glassCard} flex items-center justify-between`}>
         <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
              {initials}
            </div>
            <div>
              <h2 className={`text-xl font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayName}</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{displayEmail}</p>
            </div>
         </div>
         <div className="text-xs font-mono text-zinc-450 bg-zinc-500/10 py-1 px-3 rounded-full">
            Verified Profile
         </div>
      </div>


      {/* Trader Health & Edge Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className={glassCard}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Target className="text-blue-500 w-5 h-5" /> RetailX Edge Score
            </h3>
            <span className={`text-2xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{scores.edgeScore}/10</span>
          </div>
          <div className="space-y-3">
             <div>
                <div className="flex justify-between text-xs mb-1"><span className="opacity-70">Risk Management</span><span className="font-bold">{scores.subScores.risk}/10</span></div>
                <div className="w-full bg-black/10 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${(scores.subScores.risk/10)*100}%`}}></div></div>
             </div>
             <div>
                <div className="flex justify-between text-xs mb-1"><span className="opacity-70">Discipline</span><span className="font-bold">{scores.subScores.discipline}/10</span></div>
                <div className="w-full bg-black/10 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${(scores.subScores.discipline/10)*100}%`}}></div></div>
             </div>
             <div>
                <div className="flex justify-between text-xs mb-1"><span className="opacity-70">Strategy Execution</span><span className="font-bold">{scores.subScores.strategy}/10</span></div>
                <div className="w-full bg-black/10 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${(scores.subScores.strategy/10)*100}%`}}></div></div>
             </div>
          </div>
        </div>

        <div className={glassCard}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="text-rose-500 w-5 h-5" /> Trader Health
            </h3>
            <button onClick={handleResetScores} className="text-xs px-3 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-colors font-medium">Reset Scores</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-3 rounded-xl border border-white/5 bg-black/5 dark:bg-white/5">
                <div className="text-xs opacity-70 mb-1">Discipline %</div>
                <div className="text-lg font-bold text-emerald-500">{scores.health.disciplinePct}%</div>
             </div>
             <div className="p-3 rounded-xl border border-white/5 bg-black/5 dark:bg-white/5">
                <div className="text-xs opacity-70 mb-1">Risk Control %</div>
                <div className="text-lg font-bold text-emerald-500">{scores.health.riskControlPct}%</div>
             </div>
             <div className="p-3 rounded-xl border border-white/5 bg-black/5 dark:bg-white/5">
                <div className="text-xs opacity-70 mb-1">Overtrading</div>
                <div className={`text-lg font-bold ${scores.health.overtradingLevel === 'Low' ? 'text-emerald-500' : 'text-rose-500'}`}>{scores.health.overtradingLevel}</div>
             </div>
             <div className="p-3 rounded-xl border border-white/5 bg-black/5 dark:bg-white/5">
                <div className="text-xs opacity-70 mb-1">Emotions</div>
                <div className="text-lg font-bold text-amber-500">{scores.health.emotionalControl}</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Risk Profile Card */}
        <div className={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`}>
              <Shield size={20} />
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Risk Profile</h3>
            </div>
            {saving && (
              <span className={`flex items-center gap-1 text-xs animate-pulse ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`}>
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </span>
            )}
            {!saving && saveMessage === 'Saved successfully!' && (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 size={12} />
                Saved
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-zinc-500" size={24} />
            </div>
          ) : (
            <div className="space-y-3">
              {['Conservative', 'Moderate', 'Aggressive'].map((r) => {
                const isSelected = riskTolerance === r;
                return (
                  <label 
                    key={r} 
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? (isDark ? 'border-[#c8f135] bg-[#c8f135]/10' : 'border-emerald-500 bg-emerald-50') 
                        : (isDark ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5')
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{r}</span>
                    <input 
                      type="radio" 
                      name="risk" 
                      checked={isSelected} 
                      onChange={() => handleRiskChange(r)}
                      className={`w-4 h-4 focus:ring-0 ${isDark ? 'accent-[#c8f135]' : 'accent-emerald-600'}`} 
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Trading Style Card */}
        <div className={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`}>
              <Sparkles size={20} />
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Trading Style Profile</h3>
            </div>
          </div>
          
          {stylePreference ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-[#c8f135]/10 border-[#c8f135]/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-[#c8f135]/20 text-[#c8f135]' : 'bg-emerald-100 text-emerald-700'}`}>
                  {stylePreference.toLowerCase().includes("scalper") && <Zap size={22} />}
                  {stylePreference.toLowerCase().includes("intraday") && <Clock size={22} />}
                  {stylePreference.toLowerCase().includes("swing") && <TrendingUp size={22} />}
                  {stylePreference.toLowerCase().includes("positional") && <Compass size={22} />}
                  {stylePreference.toLowerCase().includes("options") && <Percent size={22} />}
                  {!stylePreference.toLowerCase().includes("scalper") && !stylePreference.toLowerCase().includes("intraday") && !stylePreference.toLowerCase().includes("swing") && !stylePreference.toLowerCase().includes("positional") && !stylePreference.toLowerCase().includes("options") && <Sparkles size={22} />}
                </div>
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest block ${isDark ? 'text-[#c8f135]' : 'text-emerald-700'}`}>Active Profile</span>
                  <span className={`text-sm font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>{stylePreference}</span>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                Your platform alerts, break-out observations, and behavioral analytics are fine-tuned to your active trading style classification.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    if (token) {
                      await fetch('/api/profile/reset-quiz', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                    }
                  } catch (e) {
                    console.error("Failed to reset style preference", e);
                  }
                  setStylePreference(null);
                  window.dispatchEvent(new CustomEvent('open_trading_quiz'));
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Retake Assessment
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center py-4">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                You haven't completed your Trading Style Assessment yet. Complete it to unlock hyper-targeted alerts and customized rulesets!
              </p>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open_trading_quiz'));
                }}
                className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md ${isDark ? 'bg-[#c8f135] text-black shadow-[#c8f135]/10' : 'bg-emerald-600 text-white shadow-emerald-600/10 hover:bg-emerald-700'}`}
              >
                Take Assessment Now
              </button>
            </div>
          )}
        </div>

        {/* Appearance Card */}
        <div className={glassCard}>
          <div className="flex items-center gap-2 mb-4 text-blue-500">
             <Moon size={20} />
             <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance</h3>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Color Theme</span>
            <button 
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${isDark ? 'border-white/20 hover:bg-white/10 text-white' : 'border-black/10 hover:bg-black/5 text-gray-900'}`}
            >
              {isDark ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Phone & Device Notifications Card */}
      <div className={glassCard}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4 border-zinc-500/10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#c8f135]/10 text-[#c8f135]' : 'bg-emerald-50 text-emerald-600'}`}>
              <Bell size={22} className={isDark ? "text-[#c8f135]" : "text-emerald-600"} />
            </div>
            <div>
              <h3 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone & Web Notifications</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real-time breakout and structure alerts pushed directly to your device</p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {/* Intelligent permission status pill */}
            {isSandbox ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Smartphone size={12} /> Virtual Simulator Active
              </span>
            ) : permissionState === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Check size={12} /> Active & Approved
              </span>
            ) : permissionState === 'denied' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <Lock size={12} /> Blocked in Browser
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <AlertCircle size={12} /> Permission Required
              </span>
            )}
          </div>
        </div>

        {/* Sandbox Instruction Banner */}
        {isSandbox && (
          <div className={`p-4 mb-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark ? 'bg-zinc-950/80 border-[#c8f135]/20' : 'bg-emerald-50 border-emerald-500/20'} text-xs`}>
            <div className="space-y-1">
              <span className={`font-extrabold block uppercase tracking-wider text-[10px] ${isDark ? 'text-[#c8f135]' : 'text-emerald-700'}`}>🔒 Secure Sandbox Notice</span>
              <p className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
                Because this app is running within an AI Studio preview iframe, browsers restrict native OS notification popups. 
                We have automatically engaged our premium <strong>Virtual Device Push Engine</strong> with Double-Tone sound synthesis so you can test real-time alerts instantly in this window!
              </p>
            </div>
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-1 px-4 py-2 font-extrabold rounded-xl active:scale-[0.98] transition-all whitespace-nowrap shadow-sm text-center ${isDark ? 'bg-[#c8f135] text-black hover:brightness-110' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              Open in New Tab <ExternalLink size={12} />
            </a>
          </div>
        )}

        <div className="space-y-6">
          {/* Main Access Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-500/10 bg-zinc-500/5">
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Device Authorization</h4>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {permissionState === 'granted' 
                  ? "This device is authorized to receive instant background notifications." 
                  : permissionState === 'denied' 
                  ? "Authorization has been declined. Please reset your browser site settings and allow notifications to continue." 
                  : "Authorize this device to deliver critical risk alerts as native or simulated notifications."}
              </p>
            </div>
            
            {permissionState !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold active:scale-[0.98] transition-all shrink-0 ${isDark ? 'bg-[#c8f135] text-black hover:brightness-110' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                Enable Notifications
              </button>
            ) : (
              <button
                onClick={handleSendTestNotification}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  isDark 
                    ? 'border-white/10 hover:bg-white/5 text-white' 
                    : 'border-black/10 hover:bg-black/5 text-gray-900'
                }`}
              >
                Send Test Alert to Phone
              </button>
            )}
          </div>

          {testNotificationStatus && (
            <p className={`text-xs text-center font-bold animate-pulse ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`}>
              {testNotificationStatus}
            </p>
          )}



          {/* Smart Filters section */}
          <div className="space-y-4">
            <div className="border-t border-zinc-500/10 pt-4">
              <h4 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Volume2 size={16} className={isDark ? "text-[#c8f135]" : "text-emerald-600"} /> Useful Notification Filters
              </h4>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                To prevent notification fatigue, only high-value, actionable alerts are sent. Customize your rules below.
              </p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Global toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-500/10 cursor-pointer hover:bg-zinc-500/5 transition-all">
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>Enable Alerts</span>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Toggle all phone notifications</span>
                </div>
                <input 
                  type="checkbox"
                  checked={notifSettings.enabled}
                  onChange={() => handleSaveNotifSettings({ ...notifSettings, enabled: !notifSettings.enabled })}
                  className={`w-4 h-4 cursor-pointer ${isDark ? 'accent-[#c8f135] focus:ring-[#c8f135]' : 'accent-emerald-600 focus:ring-emerald-500'}`}
                />
              </label>

              {/* AI-Curated curation */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-500/10 cursor-pointer hover:bg-zinc-500/5 transition-all">
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Smart-Curation Mode</span>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Exclude routine tick updates & noise</span>
                </div>
                <input 
                  type="checkbox"
                  checked={notifSettings.aiCuratedOnly}
                  onChange={() => handleSaveNotifSettings({ ...notifSettings, aiCuratedOnly: !notifSettings.aiCuratedOnly })}
                  className={`w-4 h-4 cursor-pointer ${isDark ? 'accent-[#c8f135] focus:ring-[#c8f135]' : 'accent-emerald-600 focus:ring-emerald-500'}`}
                />
              </label>

              {/* Sound toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-500/10 cursor-pointer hover:bg-zinc-500/5 transition-all">
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>Synthesizer Notification Chime</span>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Play double-tone digital chime on alert</span>
                </div>
                <input 
                  type="checkbox"
                  checked={notifSettings.playChime ?? true}
                  onChange={() => handleSaveNotifSettings({ ...notifSettings, playChime: !notifSettings.playChime })}
                  className={`w-4 h-4 cursor-pointer ${isDark ? 'accent-[#c8f135] focus:ring-[#c8f135]' : 'accent-emerald-600 focus:ring-emerald-500'}`}
                />
              </label>
            </div>

            {/* Minimum Severity Selector */}
            <div className="space-y-2">
              <span className={`text-xs font-bold block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Minimum Severity Level</span>
              <div className="flex border border-zinc-500/10 rounded-xl overflow-hidden p-1 bg-zinc-500/5 max-w-md">
                {['High', 'Medium', 'Low'].map((sev) => {
                  const isSelected = notifSettings.minSeverity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => handleSaveNotifSettings({ ...notifSettings, minSeverity: sev })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected 
                      ? (isDark ? 'bg-white text-black shadow' : 'bg-black text-white shadow') 
                      : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')
                      }`}
                    >
                      {sev} {sev === 'High' ? '🔥' : sev === 'Medium' ? '⚠️' : 'ℹ️'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">
                *Selecting **High** ensures you only get alerted for major breakouts and massive institutional flow waves.
              </p>
            </div>

            {/* Allowed Instruments Checkboxes */}
            <div className="space-y-2 pt-2">
              <span className={`text-xs font-bold block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Allowed Watchlist Instruments</span>
              <div className="flex flex-wrap gap-2">
                {['NIFTY50', 'BANKNIFTY', 'SENSEX', 'USDINR', 'CRUDEOIL'].map((symbol) => {
                  const list = notifSettings.allowedInstruments || [];
                  const isSelected = list.includes(symbol);
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => {
                        const newList = isSelected 
                        ? list.filter(s => s !== symbol) 
                        : [...list, symbol];
                        handleSaveNotifSettings({ ...notifSettings, allowedInstruments: newList });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        isSelected 
                        ? (isDark ? 'bg-[#c8f135]/10 border-[#c8f135] text-[#c8f135]' : 'bg-emerald-50 border-emerald-500 text-emerald-700')
                        : (isDark ? 'border-white/5 hover:border-white/10 text-gray-400 bg-white/2' : 'border-black/5 hover:border-black/10 text-gray-500 bg-black/2')
                      }`}
                    >
                      {symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
