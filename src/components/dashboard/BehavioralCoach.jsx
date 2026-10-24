import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Shield, 
  AlertOctagon, 
  Lightbulb, 
  Send, 
  Trash2, 
  Bot, 
  Sparkles,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Plus,
  MessageSquare,
  History,
  Loader2,
  Compass,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  FileText, 
  Target,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award
} from 'lucide-react';
import Markdown from 'react-markdown';

export default function BehavioralCoach({ theme }) {
  const isDark = theme === 'dark';
  
  const glassCard = `rounded-2xl border p-6 transition-all duration-300 ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]'
  }`;

  // State variables for sessions and chat
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'coach',
      text: "Hello! I am Guardian, your AI Risk Guard companion. Please share any trading stress, psychological friction, or risk parameters you wish to evaluate.",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  // Sizing & Layout Toggles
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default sidebar hidden on both screens

  // Pre-Trade Checklist interactive state
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Context aligns with daily HTF bias', checked: false },
    { id: 2, label: 'Risk exposure is 1% or less of absolute equity', checked: false },
    { id: 3, label: 'Stop Loss physically configured on broker server', checked: false },
    { id: 4, label: 'I am completely calm, clear-headed, and not seeking revenge', checked: false },
  ]);
  const [unlockStatus, setUnlockStatus] = useState('locked'); // 'locked', 'unlocked'

  // Cool-down timer state
  const [cooldownSecs, setCooldownSecs] = useState(15 * 60); // 15 mins default
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Guided Breathing state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Inhale'); // 'Inhale', 'Hold', 'Exhale', 'Rest'
  const [breathingTimer, setBreathingTimer] = useState(4);

  // Emotional analysis state derived from past trades / self-diagnosis overrides
  const [tradesCount, setTradesCount] = useState(0);
  const [emotionalWeights, setEmotionalWeights] = useState({ calm: 70, fomo: 10, revenge: 10, anxious: 10 });
  const [tiltPercentage, setTiltPercentage] = useState(35);
  const [selectedEmotionalState, setSelectedEmotionalState] = useState('Calm');

  // Post-market session review & detailed report modal state
  const [sessionReview, setSessionReview] = useState(null);
  const [tradingReport, setTradingReport] = useState(null);
  // A session review only exists when there are completed trades; otherwise show honest empty states.
  const hasSession = !!sessionReview && !sessionReview.noTrades && Number(sessionReview.tradeCount) > 0;
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sync Emotional gauge & statistics with database trades
  const fetchTradesAnalytics = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success && data.trades) {
        const trades = data.trades;
        setTradesCount(trades.length);
        if (trades.length > 0) {
          let calmCount = 0;
          let fomoCount = 0;
          let revengeCount = 0;
          let anxiousCount = 0;
          
          trades.forEach(t => {
            const emo = String(t.emotion || '').toLowerCase();
            if (emo.includes('fomo') || emo.includes('greed') || emo.includes('desire')) fomoCount++;
            else if (emo.includes('revenge') || emo.includes('anger') || emo.includes('tilt') || emo.includes('frust')) revengeCount++;
            else if (emo.includes('anxiety') || emo.includes('fear') || emo.includes('anxious') || emo.includes('stressed')) anxiousCount++;
            else calmCount++;
          });
          
          const total = trades.length;
          const weights = {
            calm: Math.round((calmCount / total) * 100),
            fomo: Math.round((fomoCount / total) * 100),
            revenge: Math.round((revengeCount / total) * 100),
            anxious: Math.round((anxiousCount / total) * 100)
          };
          setEmotionalWeights(weights);

          // Calculate precise algorithmic tilt score (revenge triggers maximum alert)
          const calculatedTilt = Math.min(100, Math.round(
            ((revengeCount * 1.0 + fomoCount * 0.7 + anxiousCount * 0.4) / total) * 100
          ));
          setTiltPercentage(calculatedTilt || 15);
          
          // Set dynamic textual emotional alert
          if (calculatedTilt > 50) setSelectedEmotionalState('Tilted');
          else if (fomoCount > revengeCount && fomoCount > anxiousCount) setSelectedEmotionalState('FOMO');
          else if (anxiousCount > fomoCount) setSelectedEmotionalState('Anxious');
          else setSelectedEmotionalState('Calm');
        }
      }
    } catch (err) {
      console.error("Failed to sync trades with psych gauge:", err);
    }
  };

  // Sync Post-Market Session Review & Activity Report
  const fetchSessionReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsReviewLoading(true);
    try {
      const [reviewRes, reportRes] = await Promise.all([
        fetch('/api/paper/session-review', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/paper/trading-report', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        setSessionReview(reviewData);
      }
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setTradingReport(reportData);
      }
    } catch (err) {
      console.error("Failed to load post-market review:", err);
    } finally {
      setIsReviewLoading(false);
    }
  };

  useEffect(() => {
    fetchTradesAnalytics();
    fetchSessionReview();
  }, []);

  // Guided breathing loop manager
  useEffect(() => {
    let interval = null;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            setBreathingPhase(curr => {
              if (curr === 'Inhale') return 'Hold';
              if (curr === 'Hold') return 'Exhale';
              if (curr === 'Exhale') return 'Rest';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingPhase('Inhale');
      setBreathingTimer(4);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  // Sync Timer countdown
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && cooldownSecs > 0) {
      interval = setInterval(() => {
        setCooldownSecs(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, cooldownSecs]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const resetTimer = () => {
    setCooldownSecs(15 * 60);
    setIsTimerRunning(true);
  };

  // Toggle checklist checkbox
  const handleToggleChecklist = (id) => {
    const updated = checklist.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    setChecklist(updated);
    
    const allChecked = updated.every(item => item.checked);
    if (allChecked) {
      setUnlockStatus('unlocked');
    } else {
      setUnlockStatus('locked');
    }
  };

  // Triggering visual rewards on Checklist complete
  const handleChecklistUnlock = () => {
    if (unlockStatus !== 'unlocked') return;
    
    // Auto post an encouraging notification inside the active chat
    const alertMsg = {
      id: `system-validation-${Date.now()}`,
      sender: 'coach',
      text: "📊 **Pre-Trade Clearance Approved.** I have audited your current mindset parameters & certified your risk constraints as stable. Execution safety shields are armed. Maintain absolute discipline out there!",
      time: new Date()
    };
    setMessages(prev => [...prev, alertMsg]);
  };

  // Switch manual self-diagnosis emotional category override
  const handleSelfOverrideEmotion = (stateName) => {
    setSelectedEmotionalState(stateName);
    if (stateName === 'Calm') {
      setTiltPercentage(10);
      setEmotionalWeights({ calm: 85, fomo: 5, revenge: 5, anxious: 5 });
    } else if (stateName === 'Tilted') {
      setTiltPercentage(85);
      setEmotionalWeights({ calm: 10, fomo: 15, revenge: 60, anxious: 15 });
    } else if (stateName === 'FOMO') {
      setTiltPercentage(65);
      setEmotionalWeights({ calm: 15, fomo: 65, revenge: 10, anxious: 10 });
    } else if (stateName === 'Anxious') {
      setTiltPercentage(50);
      setEmotionalWeights({ calm: 25, fomo: 10, revenge: 10, anxious: 55 });
    }
  };

  // Load chat sessions on component mount
  const fetchSessions = async () => {
    setSessionsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch messages of chosen session
  const loadSessionMessages = async (sessionId) => {
    setIsLoading(true);
    setChatError('');
    setActiveSessionId(sessionId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const formatted = data.messages.map(m => ({
          id: String(m.id),
          sender: m.role === 'user' ? 'user' : 'coach',
          text: m.text,
          time: new Date(m.createdAt)
        }));
        
        if (formatted.length > 0) {
          setMessages(formatted);
        } else {
          resetToEmptyWelcome();
        }
      } else {
        setChatError(data.error || 'Failed to load messages.');
      }
    } catch (err) {
      console.error(err);
      setChatError('Failed to establish reliable connection with the secure database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch/Reset to dynamic empty welcome
  const resetToEmptyWelcome = () => {
    setMessages([
      {
        id: 'coach-welcome-' + Date.now(),
        sender: 'coach',
        text: "Hello! I am Guardian, your resident AI Performance Coach. If you are experiencing loss streaks, feeling FOMO, or seeking trading clinical feedback, ask me now.",
        time: new Date()
      }
    ]);
  };

  // Start pristine new session
  const handleStartNewSession = () => {
    setActiveSessionId(null);
    resetToEmptyWelcome();
    setChatError('');
  };

  // Send Message Payload
  const handleSend = async (customText = null) => {
    const text = customText || input;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);
    setChatError('');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId,
          history: messages.slice(-10).map(msg => ({
            role: msg.sender === 'coach' ? 'model' : 'user',
            text: msg.text
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const botMsg = {
          id: `coach-${Date.now() + 1}`,
          sender: 'coach',
          text: data.reply,
          time: new Date()
        };

        setMessages(prev => [...prev, botMsg]);

        if (!activeSessionId) {
          setActiveSessionId(data.sessionId);
          fetchSessions();
        }
      } else {
        setChatError(data.error || 'Diagnostic server is busy. Safeguard your emotional equity.');
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: `coach-error-${Date.now()}`,
        sender: 'coach',
        text: "My diagnostic state experienced an active database network timeout. Maintain absolute calm. Please verify if GEMINI_API_KEY is configured inside your account secrets.",
        time: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete chat session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this chat thread?")) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          handleStartNewSession();
        }
      } else {
        alert(data.error || 'Failed to safe-delete session.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to execute command on standard database.');
    }
  };

  const presetSuggestions = [
    { label: "Review my Paper Trades 📝", prompt: "Please review my paper trading trade history, active positions, and execution discipline." },
    { label: "Review my P&L & Stats 📊", prompt: "Give me an objective review of my paper trading trades and journal entries, analyzing my realized P&L, drawdown, and win rate." },
    { label: "Am I overtrading? 😡", prompt: "Review my recent paper trades and trade journal. Am I overtrading, taking excess lot sizes, or on emotional tilt?" },
    { label: "Deconstruct FOMO 👀", prompt: "I see a big momentum move and feel a strong urge to chase on high leverage. Help me deconstruct this impulse and protect my capital." }
  ];

  return (
    <div className="space-y-6 select-none relative" id="coach_dashboard_container">

      {/* Main Grid: Adapts beautifully depending on Full-screen Toggle */}
      <div className={`grid grid-cols-1 ${isFullscreen ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-6 transition-all duration-300`}>
        
        {/* Left Columns (Emotional gauge & Checklists) */}
        {!isFullscreen && (
          <div className="space-y-6">

            {/* Pre-trade checklist code */}
            <div className={glassCard}>
              <div className={`flex items-center justify-between mb-4 ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`}>
                 <div className="flex items-center gap-2">
                   <Shield size={18} />
                   <h3 className={`text-sm md:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                     Active Clearance Checklist
                   </h3>
                 </div>
                 <span className={`text-[10px] uppercase font-mono ${
                   unlockStatus === 'unlocked' ? 'text-green-400 animate-pulse' : 'text-zinc-500'
                 }`}>
                   {unlockStatus === 'unlocked' ? 'Clearance Issued' : 'Restricted state'}
                 </span>
              </div>
              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <label 
                    key={item.id} 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      item.checked 
                        ? isDark 
                          ? 'border-green-500/20 bg-green-500/5' 
                          : 'border-green-200 bg-green-50/50'
                        : isDark 
                          ? 'border-white/5 hover:bg-white/5' 
                          : 'border-black/5 hover:bg-black/5'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={item.checked}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="w-4 h-4 mt-0.5 rounded text-green-500 bg-transparent border-gray-500 focus:ring-0 cursor-pointer" 
                    />
                    <span className={`text-xs font-semibold leading-relaxed ${
                      item.checked 
                        ? 'text-green-500 line-through opacity-80' 
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              
              <button 
                onClick={handleChecklistUnlock}
                disabled={unlockStatus !== 'unlocked'}
                className={`w-full mt-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  unlockStatus === 'unlocked'
                    ? 'bg-green-500 text-white hover:bg-green-600 dark:hover:bg-green-400 shadow-md shadow-green-500/10 animate-pulse'
                    : isDark 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5' 
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-black/5'
                }`}
              >
                {unlockStatus === 'unlocked' ? (
                  <>
                    <CheckCircle size={14} /> Safely Certify Clearance
                  </>
                ) : (
                  'Review and Complete All Safe Parameters'
                )}
              </button>
            </div>

            {/* Guided Box Breathing Card */}
            <div className={glassCard}>
              <div className={`flex items-center justify-between mb-4 ${isDark ? 'text-[#c8f135]' : 'text-emerald-600'}`}>
                 <div className="flex items-center gap-2">
                   <Brain size={18} />
                   <h3 className={`text-sm md:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                     Anti-Tilt Guided Breathing (Box Pattern)
                   </h3>
                 </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-[1000ms] ${
                  breathingActive
                    ? breathingPhase === 'Inhale'
                      ? 'scale-125 bg-emerald-500/20 border-2 border-emerald-400/50'
                      : breathingPhase === 'Hold'
                        ? 'scale-125 bg-amber-500/20 border-2 border-amber-400/50'
                        : breathingPhase === 'Exhale'
                          ? 'scale-100 bg-blue-500/20 border-2 border-blue-400/50'
                          : 'scale-100 bg-zinc-500/10 border-2 border-zinc-400/20'
                    : 'bg-zinc-500/5 border border-gray-500/10'
                }`}>
                  <span className={`text-lg font-black ${
                    breathingActive 
                      ? breathingPhase === 'Inhale' 
                        ? 'text-emerald-400' 
                        : breathingPhase === 'Hold' 
                          ? 'text-amber-400' 
                          : 'text-blue-400' 
                      : (isDark ? 'text-zinc-400' : 'text-zinc-500')
                  }`}>
                    {breathingActive ? breathingPhase : 'Relaxed'}
                  </span>
                  {breathingActive && (
                    <span className="text-xs font-mono font-bold mt-1 text-zinc-400">
                      {breathingTimer}s
                    </span>
                  )}
                </div>
                
                <p className={`text-xs mt-6 max-w-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {breathingActive
                    ? breathingPhase === 'Inhale'
                      ? 'Inhale deeply. Expand your diaphragm.'
                      : breathingPhase === 'Hold'
                        ? 'Hold your breath. Focus on absolute stillness.'
                        : breathingPhase === 'Exhale'
                          ? 'Exhale slowly. Release accumulated trading stress.'
                          : 'Hold empty. Reset your central nervous system.'
                    : 'Log successive losses? Feeling the urge to revenge trade? Trigger the anti-tilt box-breathing technique to realign your focus.'
                  }
                </p>

                <button
                  type="button"
                  onClick={() => setBreathingActive(!breathingActive)}
                  className={`mt-5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    breathingActive
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                      : isDark ? 'bg-[#c8f135] hover:bg-[#b0d52e] text-black shadow-[#c8f135]/10' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                  }`}
                >
                  {breathingActive ? 'Stop Breathing Guide' : 'Start Breathing Guide'}
                </button>
              </div>
            </div>

            {/* Post-Market Behavioural Insights Report */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                   <Target size={18} className={isDark ? 'text-indigo-700 dark:text-indigo-400' : 'text-indigo-600'} />
                   <h3 className={`text-sm md:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                     Post-Market Insights
                   </h3>
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     type="button"
                     onClick={fetchSessionReview}
                     disabled={isReviewLoading}
                     title="Refresh Live Post-Market Analytics"
                     className={`p-1.5 rounded-lg border transition-all ${
                       isDark ? 'border-white/10 hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white' : 'border-black/10 hover:bg-black/5 text-zinc-600 hover:text-black'
                     }`}
                   >
                     <RefreshCw size={12} className={isReviewLoading ? 'animate-spin' : ''} />
                   </button>
                   <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                     {sessionReview?.sessionDate || 'Live Session'}
                   </span>
                 </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Real-time discipline analytics evaluated against your active risk and execution rules.
              </p>

              {/* Dynamic Insights Grid */}
              {!hasSession ? (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isDark ? 'border-white/10 bg-white/5 text-zinc-700 dark:text-zinc-300' : 'border-black/10 bg-black/5 text-zinc-700'}`}>
                  No completed trades yet. Discipline and behavior insights appear here after you close paper trades.
                </div>
              ) : (
              <div className="space-y-2.5">
                {/* 1. Discipline & Overtrading Status */}
                <div className={`p-3 rounded-xl border ${
                  sessionReview?.overtradingFlag
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400'
                    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      {sessionReview?.overtradingFlag ? <AlertTriangle size={13} /> : <CheckCircle size={13} />}
                      {sessionReview?.overtradingFlag ? 'Trade Limit Exceeded' : 'Discipline Score Maintained'}
                    </span>
                    <span className="text-xs font-mono font-black">
                      {sessionReview?.disciplineScore != null ? `${sessionReview.disciplineScore}%` : '—'}
                    </span>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-700'}`}>
                    {sessionReview?.riskAdherence}
                  </div>
                </div>

                {/* 2. Emotional / Revenge Trading Analysis */}
                <div className={`p-3 rounded-xl border ${
                  sessionReview?.revengeTradingFlag
                    ? 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400'
                    : 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Brain size={13} />
                      {sessionReview?.revengeTradingFlag ? 'Revenge Re-entry Flag' : 'Emotional Execution Stability'}
                    </span>
                    <span className={`text-[11px] font-bold ${
                      (sessionReview?.totalRealizedPnl ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      Net P&L: ₹{(sessionReview?.totalRealizedPnl ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-700'}`}>
                    {sessionReview?.tradePlanAdherence || '—'}
                  </div>
                </div>

                {/* 3. Session Edge Adjustment */}
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'border-white/5 bg-white/5 text-zinc-700 dark:text-zinc-300' : 'border-black/5 bg-black/5 text-zinc-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles size={13} className="text-yellow-700 dark:text-yellow-400" />
                      Session Edge Assessment
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {sessionReview?.winningTrades ?? 0}W / {sessionReview?.losingTrades ?? 0}L
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed opacity-90">
                    {sessionReview?.summaryText || '—'}
                  </div>
                </div>
              </div>
              )}

              <button 
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className={`w-full mt-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300' 
                    : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                }`}
              >
                <FileText size={14} />
                View Full Detailed Report
              </button>
            </div>
          </div>
        )}

        {/* Cognitive AI Coaching Workspace with gorgeous mobile card & native full-screen takeoff support */}
        <div className={`transition-all duration-300 flex flex-row overflow-hidden border ${
          isDark 
            ? 'bg-zinc-950 border-white/10 shadow-[0_12px_44px_rgba(0,0,0,0.6)]' 
            : 'bg-white border-zinc-200 shadow-[0_12px_44px_rgba(0,0,0,0.06)]'
        } ${
          isFullscreen 
            ? 'fixed inset-0 z-50 w-full h-full rounded-none border-none max-w-none aspect-auto m-0 outline-none' 
            : 'h-[580px] w-full rounded-3xl'
        }`} id="chat_workspace_panel">
          
          {/* Dynamic collapsible sidebar window (on both Mobile and Desktop) */}
          <div className={`shrink-0 transition-all duration-300 flex flex-col h-full overflow-hidden ${
            isSidebarOpen 
              ? 'w-56 opacity-100 border-r border-gray-500/10' 
              : 'w-0 opacity-0 border-r-0 pointer-events-none'
          }`} id="sidebar_threads_panel">
            
            <div className="w-56 flex flex-col h-full shrink-0">
              {/* Thread sidebar Header */}
              <div className="p-4 flex items-center justify-between border-b border-gray-500/10 shrink-0">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-600 dark:text-zinc-500'}`}>
                  <History size={11} /> Threads
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleStartNewSession}
                    title="Start New Coaching Session"
                    className={`p-1.5 rounded-lg border transition-all ${
                      isDark 
                        ? 'border-white/10 hover:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:text-white' 
                        : 'border-black/10 hover:bg-black/5 text-zinc-700 hover:text-black'
                    }`}
                  >
                    <Plus size={13} />
                  </button>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    title="Close Sidebar"
                    className={`p-1.5 rounded-lg border transition-all ${
                      isDark 
                        ? 'border-white/10 hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white hover:border-red-500/30' 
                        : 'border-black/10 hover:bg-black/5 text-zinc-600 dark:text-zinc-500 hover:text-black hover:border-red-200'
                    }`}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Previous sessions list view */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {sessionsLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="animate-spin text-blue-500" size={16} />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 px-3">
                    <Compass size={22} className="mx-auto text-gray-500 opacity-40 mb-2 animate-pulse" />
                    <p className="text-[10px] text-gray-400 font-semibold tracking-wider">No history trails.</p>
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => loadSessionMessages(sess.id)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs font-semibold ${
                          isActive
                            ? (isDark ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100')
                            : (isDark ? 'hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-600 hover:text-black')
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare size={12} className="shrink-0 opacity-60" />
                          <span className="truncate pr-1 text-[11px] font-semibold leading-none">{sess.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition-all shrink-0"
                          title="Delete this history trail"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Chat Workspace Board Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden" id="chat_main_board">
            
            {/* Top Workspace Header (Unified Hamburger trigger acts flawlessly everywhere!) */}
            <div className={`p-4 border-b border-gray-500/10 flex items-center justify-between shrink-0 ${
              isDark ? 'bg-black/20' : 'bg-zinc-50/50'
            }`}>
              <div className="flex items-center gap-3">
                {/* Responsive Hamburger icon */}
                <button
                  onClick={() => setIsSidebarOpen(prev => !prev)}
                  title={isSidebarOpen ? "Hide Chat History" : "Show Chat History"}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                    isDark
                      ? 'border-white/10 hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-white bg-white/5'
                      : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-black bg-zinc-50'
                  }`}
                >
                  {isSidebarOpen ? <X size={15} /> : <Menu size={15} />}
                </button>

                <div className="relative p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <Bot size={15} />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 border border-white rounded-full animate-pulse"></span>
                </div>
                <div>
                  <h3 className={`text-xs font-extrabold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    AI Risk Guard
                  </h3>
                  <p className="text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">Psychological Risk Shield</p>
                </div>
              </div>

              {/* Layout controls */}
              <div className="flex items-center gap-1.5 col-span-1">
                <button
                  onClick={() => setIsFullscreen(prev => !prev)}
                  title={isFullscreen ? "Exit Fullscreen Workspace" : "Fullscreen Immersive Workspace"}
                  className={`p-1.5 rounded-lg transition-all border ${
                    isDark
                      ? 'border-white/10 hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white'
                      : 'border-black/5 hover:bg-black/5 text-zinc-600 dark:text-zinc-500 hover:text-gray-900'
                  }`}
                >
                  {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* Message Thread Scroll view */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/5">
              {chatError && (
                <div className="p-3 text-xs border border-red-500/10 bg-red-500/5 text-red-400 rounded-xl flex items-center gap-2 animate-pulse">
                  <AlertOctagon size={13} /> {chatError}
                </div>
              )}

              {messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-700 dark:text-indigo-400">
                        <Bot size={13} />
                      </div>
                    )}
                    <div className="flex flex-col max-w-[85%]">
                      <div className={`p-3.5 rounded-2xl text-[11px] leading-relaxed font-semibold transition-all shadow-sm ${
                        isUser
                          ? (isDark ? 'bg-[#c8f135] text-black rounded-tr-none' : 'bg-black text-white rounded-tr-none')
                          : (isDark ? 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none font-medium' : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none font-medium')
                      }`}>
                        {isUser ? (
                          m.text
                        ) : (
                          <div className="flex flex-col gap-1.5 break-words">
                            <Markdown
                              components={{
                                p: ({node, ...props}) => <p className="m-0 leading-relaxed font-sans" {...props} />,
                                strong: ({node, ...props}) => <strong className={`font-extrabold ${isDark ? 'text-[#c8f135]' : 'text-blue-700'}`} {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-1 my-1.5" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 space-y-1 my-1.5" {...props} />,
                                h1: ({node, ...props}) => <h1 className={`text-xs font-black mt-2 mb-1 border-b pb-0.5 ${isDark ? 'text-white border-white/10' : 'text-gray-900 border-black/5'}`} {...props} />,
                                h2: ({node, ...props}) => <h2 className={`text-xs font-bold mt-2 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`} {...props} />,
                                li: ({node, ...props}) => <li className={`text-xs pl-1 ${isDark ? 'marker:text-[#c8f135] text-gray-200' : 'marker:text-blue-600 text-gray-800'}`} {...props} />,
                                code: ({node, ...props}) => <code className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${isDark ? 'bg-black/60 text-emerald-700 dark:text-emerald-400' : 'bg-black/5 text-indigo-600'}`} {...props} />
                              }}
                            >
                              {m.text}
                            </Markdown>
                          </div>
                        )}
                      </div>
                      <span className={`text-[8px] mt-1 text-gray-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                        {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-700 dark:text-indigo-400">
                    <Bot size={13} />
                  </div>
                  <div className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 rounded-tl-none ${
                    isDark ? 'bg-white/5 text-zinc-600 dark:text-zinc-400' : 'bg-zinc-50 text-zinc-600 dark:text-zinc-500'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Mindset suggestion chips */}
            <div className="py-2 px-3 flex flex-nowrap overflow-x-auto gap-1.5 shrink-0 no-scrollbar select-none border-t border-gray-500/5">
              {presetSuggestions.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(p.prompt)}
                  className={`py-1.5 px-3 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30' 
                      : 'bg-zinc-100 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 border border-zinc-200 hover:border-emerald-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chat message input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-gray-500/10 flex gap-2 shrink-0 bg-transparent items-center animate-fade-in"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Ask Guard client about drawdown stats, P&L feedback..."
                className={`flex-1 p-2.5 px-3.5 rounded-xl text-xs bg-transparent border outline-none font-semibold transition-all ${
                  isDark 
                    ? 'border-white/10 focus:border-indigo-500 text-white placeholder-gray-500' 
                    : 'border-black/10 focus:border-indigo-600 text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30'
                }`}
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Post-Market Full Detailed Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
          <div 
            className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
              isDark ? 'bg-zinc-950 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'border-white/10 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50/70'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    Post-Market Performance & Behavioral Audit
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Session Audit for {sessionReview?.sessionDate || 'Current Trading Session'} • Real-Money Discipline Evaluation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSessionReview}
                  disabled={isReviewLoading}
                  className={`p-2 rounded-xl border transition-all ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-zinc-600 dark:text-zinc-400' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600'
                  }`}
                  title="Refresh Audit Data"
                >
                  <RefreshCw size={15} className={isReviewLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className={`p-2 rounded-xl border transition-all ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-white' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-black'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {!hasSession ? (
                <p className={`text-sm text-center py-10 ${isDark ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-700'}`}>
                  No completed trades yet. This report is generated from your closed paper trades and risk settings.
                </p>
              ) : (
              <>
              {/* Executive Summary Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                isDark 
                  ? 'bg-gradient-to-r from-indigo-950/40 to-zinc-900/40 border-indigo-500/20' 
                  : 'bg-gradient-to-r from-indigo-50/70 to-zinc-50 border-indigo-200'
              }`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Executive Session Verdict</span>
                  <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {sessionReview?.summaryText || '—'}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Risk Adherence: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{sessionReview?.riskAdherence || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400">Discipline Score</div>
                    <div className={`text-2xl sm:text-3xl font-mono font-black ${
                      (sessionReview?.disciplineScore ?? 0) >= 80 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      {sessionReview?.disciplineScore != null ? `${sessionReview.disciplineScore}%` : '—'}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-zinc-700/40" />
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400">Net Session P&L</div>
                    <div className={`text-2xl sm:text-3xl font-mono font-black ${
                      (sessionReview?.totalRealizedPnl ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      ₹{(sessionReview?.totalRealizedPnl ?? 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Trades Executed</div>
                  <div className="text-xl font-mono font-black">{sessionReview?.tradeCount ?? tradingReport?.totalTradesCompleted ?? '—'}</div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">Threshold: {sessionReview?.maxTradesThreshold ?? '—'} max</div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Win Rate</div>
                  <div className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-400">
                    {tradingReport?.winRate != null ? `${tradingReport.winRate}%` : '—'}
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                    {sessionReview?.winningTrades ?? '—'} Win / {sessionReview?.losingTrades ?? '—'} Loss
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Risk : Reward</div>
                  <div className="text-xl font-mono font-black text-indigo-700 dark:text-indigo-400">
                    {tradingReport?.riskRewardRatio != null ? `1 : ${tradingReport.riskRewardRatio}` : '—'}
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">Reference: 1:1.5 or better</div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Avg Win / Loss</div>
                  <div className="text-xl font-mono font-black">
                    <span className="text-emerald-700 dark:text-emerald-400">{tradingReport?.avgWinAmount != null ? `₹${Number(tradingReport.avgWinAmount).toLocaleString('en-IN')}` : '—'}</span> / <span className="text-rose-700 dark:text-rose-400">{tradingReport?.avgLossAmount != null ? `₹${Number(tradingReport.avgLossAmount).toLocaleString('en-IN')}` : '—'}</span>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">From your closed trades</div>
                </div>
              </div>

              {/* Granular Behavioral Diagnostics */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Brain size={14} className="text-indigo-700 dark:text-indigo-400" />
                  Behavioral Diagnostics & Trading Plan Verification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Overtrading Check */}
                  <div className={`p-4 rounded-2xl border ${
                    sessionReview?.overtradingFlag
                      ? 'border-rose-500/30 bg-rose-500/10'
                      : 'border-emerald-500/30 bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        {sessionReview?.overtradingFlag ? <AlertOctagon size={14} className="text-rose-700 dark:text-rose-400" /> : <CheckCircle size={14} className="text-emerald-700 dark:text-emerald-400" />}
                        Overtrading & Sizing Discipline
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        sessionReview?.overtradingFlag ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300' : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {sessionReview?.overtradingFlag ? 'Violation' : 'Compliant'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {sessionReview?.overtradingFlag
                        ? `You executed ${sessionReview.tradeCount} trades, which exceeds your maximum allowed rule of ${sessionReview.maxTradesThreshold} trades per session.`
                        : `Executed ${sessionReview?.tradeCount} trades against a daily limit of ${sessionReview?.maxTradesThreshold}.`}
                    </p>
                  </div>

                  {/* Revenge Trading Check */}
                  <div className={`p-4 rounded-2xl border ${
                    sessionReview?.revengeTradingFlag
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-emerald-500/30 bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        {sessionReview?.revengeTradingFlag ? <AlertTriangle size={14} className="text-amber-700 dark:text-amber-400" /> : <CheckCircle size={14} className="text-emerald-700 dark:text-emerald-400" />}
                        Revenge / Rapid Loss Re-entry
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        sessionReview?.revengeTradingFlag ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {sessionReview?.revengeTradingFlag ? 'Tilt Warning' : 'Stable Mindset'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {sessionReview?.revengeTradingFlag
                        ? 'Rapid order re-entry was detected within 10 minutes of a stop-out. Take forced cool-down pauses after any loss.'
                        : 'No rapid re-entries within 10 minutes of a losing exit were detected in your closed trades.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Clinical Recommendations for Tomorrow */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                  <Award size={14} /> Actionable AI Coach Rules For Next Session
                </h3>
                <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Pre-Trade Protocol:</strong> Complete the 4-point Clearance Checklist before taking your first trade tomorrow.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span><strong>Loss Handling:</strong> If a stop-loss is hit, activate the 15-minute cool-down timer before reassessing the chart.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span><strong>Target Preservation:</strong> Lock in profits or trail stop once the trade crosses 1:1.5 R:R to safeguard realized gains.</span>
                  </li>
                </ul>
              </div>

              {/* Regulatory Disclaimer */}
              <p className="text-[11px] text-zinc-600 dark:text-zinc-500 leading-relaxed text-center">
                {sessionReview?.disclaimer || "Post-market session recap generated purely from your logged trading activity and risk parameters."}
              </p>
              </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
              isDark ? 'border-white/10 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50/70'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  handleSend("Please analyze my Post-Market Session Audit in detail, including my discipline score, overtrading checks, and give me a customized plan for tomorrow.");
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <Bot size={15} /> Discuss Audit with AI Guardian
              </button>
              
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-800'
                }`}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
