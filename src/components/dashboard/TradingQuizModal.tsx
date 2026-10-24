import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Compass, 
  Percent, 
  Upload, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Shield,
  Sliders,
  Sparkles
} from 'lucide-react';

const STEPS = [
  {
    id: 1,
    type: 'single',
    field: 'userPersona',
    title: 'What best describes you?',
    purpose: 'Determines the primary user persona.',
    options: [
      '🌱 Just Learning',
      '📈 Investor',
      '📊 Swing Trader',
      '⚡ Intraday Trader',
      '🎯 Scalper',
      '🤖 Algo Trader'
    ]
  },
  {
    id: 2,
    type: 'single',
    field: 'primaryMarkets',
    title: 'Which markets do you primarily trade?',
    purpose: 'Personalizes dashboards, alerts, and analytics.',
    options: [
      'Stocks',
      'Options',
      'Futures',
      'Commodities',
      'Forex',
      'Crypto',
      'Multiple'
    ]
  },
  {
    id: 3,
    type: 'single',
    field: 'tradingDuration',
    title: 'How long have you been active in the markets?',
    purpose: 'Estimates experience level and learning needs.',
    options: [
      'Just Started',
      'Less than 1 Year',
      '1–3 Years',
      '3–5 Years',
      '5+ Years'
    ]
  },
  {
    id: 4,
    type: 'single',
    field: 'biggestChallenge',
    title: 'What is your biggest challenge right now?',
    purpose: "Identifies the user's pain point and enables personalized coaching.",
    options: [
      'Finding High-Quality Setups',
      'Risk Management',
      'Trading Psychology',
      'Exiting Trades',
      'Consistency',
      'Becoming Profitable'
    ]
  },
  {
    id: 5,
    type: 'single',
    field: 'primaryGoal',
    title: 'What is your primary goal with RetailX?',
    purpose: "Aligns risk settings and product experience with the user's objective",
    options: [
      'Learn Trading',
      'Improve Consistency',
      'Better Risk Management',
      'Find Better Trade Opportunities',
      'Grow Long-Term Wealth',
      'Automate My Trading'
    ]
  },
  {
    id: 6,
    type: 'single',
    field: 'pricing',
    title: 'What would you pay monthly for a tool that prevents impulsive losses?',
    purpose: 'Aligns budget interest with our feature tiering.',
    options: [
      '₹199',
      '₹399',
      '₹599',
      '₹639',
      '₹999',
      '₹1,499+'
    ]
  }
];

const PROFILES = {
  JustLearning: {
    title: "Just Learning",
    icon: Sparkles,
    color: "from-indigo-400 to-violet-500",
    textClass: "text-indigo-400",
    bgClass: "bg-indigo-500/10 border-indigo-500/20",
    glowingGlow: "rgba(99, 102, 241, 0.15)",
    description: "You are embarking on a journey to decode financial markets. Your focus lies in learning technical structures, understanding market mechanics, and building high-conviction trading habits.",
    guidelines: [
      "Focus heavily on risk-free paper trading to practice mechanical setups.",
      "Understand the basic support, resistance, and moving average indicators.",
      "Limit daily screen-time; focus on deep learning modules rather than active tickers.",
      "Never risk real capital without a defined, backtested trading playbook.",
      "Prioritize psychological discipline and rule-following over raw percentage gains."
    ]
  },
  Investor: {
    title: "Investor / Positional",
    icon: Compass,
    color: "from-purple-400 to-pink-500",
    textClass: "text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    glowingGlow: "rgba(168, 85, 247, 0.15)",
    description: "You are a macroscopic trend compounder. You combine strong technical bases with structural fundamental indicators, keeping positions for weeks, months, or years to score maximum yields.",
    guidelines: [
      "Size positions conservatively to survive normal 10-15% intermediate corrections.",
      "Verify technical breakout setups with fundamental EPS growth or quarterly catalysts.",
      "Evaluate trade performance based on quarterly milestones, not daily price variance.",
      "Avoid checking active prices constantly; utilize daily closing alerts instead.",
      "Keep a clean log of macro industry themes and tailwinds."
    ]
  },
  Swing: {
    title: "Swing Trader",
    icon: TrendingUp,
    color: "from-lime-400 to-[#c8f135]",
    textClass: "text-[#c8f135]",
    bgClass: "bg-[#c8f135]/10 border-[#c8f135]/20",
    glowingGlow: "rgba(200, 241, 53, 0.15)",
    description: "You excel at patience and medium-term structural patterns. You ride high-probability swings and momentum cycles over 3 to 15 days, letting the price action breathe while ignoring short-term market noise.",
    guidelines: [
      "Define standard risk at 1.0% - 1.5% per swing setup.",
      "Use daily and weekly charts to identify key structural accumulation breakouts.",
      "Trail stop losses to break-even once the first target level is locked.",
      "Always hedge overnight positions if major global events are scheduled.",
      "Focus heavily on sector strength rotation and relative index momentum."
    ]
  },
  Intraday: {
    title: "Intraday Trader",
    icon: Clock,
    color: "from-cyan-400 to-blue-500",
    textClass: "text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    glowingGlow: "rgba(6, 182, 212, 0.15)",
    description: "You excel at catching daily trend waves. You open and close positions in a single session, capitalizing on intra-day breakouts and VWAP structures while carrying zero overnight risk.",
    guidelines: [
      "Set a strict daily loss cap (e.g. 1.5% of total capital). Shut down if hit.",
      "Prioritize trades with a minimum of 1:2 Risk-to-Reward ratio.",
      "Incorporate the Volume Weighted Average Price (VWAP) as your trend filter.",
      "Keep screen time disciplined; avoid forcing setups during mid-day flat sessions.",
      "Journal emotional milestones alongside PnL targets at the close."
    ]
  },
  Scalper: {
    title: "Scalper",
    icon: Zap,
    color: "from-yellow-400 to-amber-500",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    glowingGlow: "rgba(245, 158, 11, 0.15)",
    description: "You thrive on speed and razor-sharp execution. Your edge lies in capturing short-term market momentum, exploiting micro-tick movements within seconds or minutes using high-frequency compounding.",
    guidelines: [
      "Limit risk strictly to 0.25% - 0.5% per trade with automated hard stops.",
      "Execute only during peak liquidity hours (first 90 mins of market open).",
      "Overtrading is your biggest risk; establish a hard stop of 10 trades per day.",
      "Strictly zero overnight holding. Clear all positions prior to session close.",
      "Focus exclusively on high-liquidity instruments (Index Options, top momentum stocks)."
    ]
  },
  Algo: {
    title: "Algo Trader",
    icon: Sliders,
    color: "from-emerald-400 to-teal-500",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    glowingGlow: "rgba(16, 185, 129, 0.15)",
    description: "You operate with mathematical probability and structured computational rules. You build, backtest, and automate execution logic, removing emotional bias from the equation entirely.",
    guidelines: [
      "Always backtest strategies across multiple market regimes before deployment.",
      "Implement strong broker API disconnect alerts and manual override killswitches.",
      "Verify slippage and execution latency assumptions in live simulation sandbox.",
      "Keep standard strategy exposure balanced; avoid placing 100% of capital in a single model.",
      "Log API parameters and JSON state structures for daily execution audits."
    ]
  }
};

export default function TradingQuizModal({ isOpen, onClose, onQuizCompleted }: any) {
  const [currentStep, setCurrentStep] = useState(0); // 0: Welcome, 1-6: Quiz steps, 7: Results
  
  // New Onboarding States
  const [userPersona, setUserPersona] = useState('');
  const [primaryMarkets, setPrimaryMarkets] = useState('');
  const [tradingDuration, setTradingDuration] = useState('');
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [pricing, setPricing] = useState('');

  // Results custom rules and persistence state
  const [dragActive, setDragActive] = useState(false);
  const [customRules, setCustomRules] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultProfile, setResultProfile] = useState('Swing');
  const [classificationScores, setClassificationScores] = useState<any>(null);

  if (!isOpen) return null;

  // Map user persona choice to Profile keys
  const mapPersonaToProfileKey = (persona: string) => {
    if (!persona) return "Swing";
    if (persona.includes("Just Learning")) return "JustLearning";
    if (persona.includes("Investor")) return "Investor";
    if (persona.includes("Swing Trader")) return "Swing";
    if (persona.includes("Intraday Trader")) return "Intraday";
    if (persona.includes("Scalper")) return "Scalper";
    if (persona.includes("Algo Trader")) return "Algo";
    return "Swing";
  };

  // Save profile to backend & close
  const saveProfileData = async (profileKey: string, scoresObj: any) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsSubmitting(false);
        return;
      }

      const activeProfile = (PROFILES as Record<string, any>)[profileKey] || PROFILES.Swing;
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stylePreference: activeProfile.title,
          riskTolerance: profileKey === 'Scalper' ? 'High' : (profileKey === 'Investor' ? 'Conservative' : 'Moderate'),
          experience: tradingDuration,
          painScale: 3,
          behaviors: primaryMarkets,
          valuableFeature: biggestChallenge,
          pricing: primaryGoal,
          riskMetrics: {
            quizClassification: profileKey,
            scores: scoresObj,
            customImportedRulesCount: customRules.length,
            importedRules: customRules,
            completedAt: new Date().toISOString()
          }
        })
      });

      // Parallelly post survey response to the main survey log table
      await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: localStorage.getItem('userName') || 'User',
          email: 'user@example.com', // placeholder, resolved securely server-side from JWT
          biometricScore: 30,
          answers: {
            userPersona,
            primaryMarkets,
            tradingDuration,
            biggestChallenge,
            primaryGoal,
            pricing
          }
        })
      }).catch(err => console.warn("Survey logger warning:", err));

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('trading_quiz_completed', { 
          detail: { 
            stylePreference: activeProfile.title,
            riskMetrics: { quizClassification: profileKey }
          } 
        }));
        
        setIsSubmitting(false);
        onQuizCompleted(activeProfile.title);
        onClose();
      } else {
        console.error("Failed to persist profile updates.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error saving profile", err);
      setIsSubmitting(false);
    }
  };

  // Ingestion File Drag & Drop
  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleRuleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      handleRuleFile(e.target.files[0]);
    }
  };

  const handleRuleFile = (file: any) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event?.target?.result || '');
        if (file.name.endsWith('.json')) {
          const parsed: any = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setCustomRules(parsed.map((item: any) => String(item)));
          } else if (parsed.rules && Array.isArray(parsed.rules)) {
            setCustomRules(parsed.rules.map((item: any) => String(item)));
          } else if (typeof parsed === 'object') {
            setCustomRules(Object.values(parsed).map((item: any) => String(item)));
          }
        } else {
          const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 5 && !line.startsWith('#') && !line.startsWith('//'));
          setCustomRules(lines.slice(0, 5));
        }
      } catch (err) {
        console.error("Rule Ingestion Failed:", err);
        alert("Failed to parse the rule file. Please upload a plain text file (.txt) or JSON list.");
      }
    };
    reader.readAsText(file);
  };

  // Reset quiz states on retry
  const handleRetryQuiz = () => {
    setUserPersona('');
    setPrimaryMarkets('');
    setTradingDuration('');
    setBiggestChallenge('');
    setPrimaryGoal('');
    setCustomRules([]);
    setCurrentStep(1);
  };


  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#09090b] text-white overflow-hidden w-screen h-screen">
      {/* Immersive background ambient decorations */}
      <div className="absolute inset-0 bg-[#09090b] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      {/* Main Container - Centered Content Engine with maximum readable width */}
      <div className="relative z-10 flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto px-6 py-8 sm:px-12 sm:py-12 overflow-y-auto h-full">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full pb-4 border-b border-zinc-900 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co/b5Mr19wz/IMG-20260612-111704.png" 
              alt="RetailX Logo" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">RetailX ONBOARDING</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* PROGRESS BAR */}
        {currentStep >= 1 && currentStep <= 6 && (
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-8 shrink-0">
            <motion.div 
              initial={{ width: "20%" }}
              animate={{ width: `${(currentStep / 6) * 100}%` }}
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-[#c8f135]"
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            />
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase mt-2">
              <span>PROGRESS</span>
              <span>Step {currentStep} of 6</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* SCREEN 0: WELCOME SCREEN (Kept exactly as requested) */}
          {currentStep === 0 && (
            <motion.div
              key="welcome-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 my-auto">
                <motion.div 
                  className="relative flex justify-center items-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <div className="absolute w-32 h-32 rounded-full bg-violet-600/15 blur-2xl animate-pulse"></div>
                  <img 
                    src="https://i.ibb.co/b5Mr19wz/IMG-20260612-111704.png" 
                    alt="RetailX Logo" 
                    className="relative w-32 h-32 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>

                <div className="space-y-4 text-center px-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Walk into every session <br />with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-[#c8f135] font-extrabold">a plan:</span> your bias, your levels, your news.
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Build your professional trading profile. RetailX tailors your control center, safeguards, and risk alarms around how you actually trade.
                  </p>
                </div>
              </div>

              <div className="pt-8 shrink-0">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="w-full h-16 rounded-2xl font-black text-sm tracking-widest uppercase bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white hover:opacity-95 hover:scale-[1.01] hover:shadow-violet-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer relative overflow-hidden group"
                  id="welcome-build-dashboard-btn"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    Build my dashboard
                    <ChevronRight size={16} className="stroke-[3] group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* DYNAMIC STEPS RENDERER FOR STEPS 1-5 */}
          {currentStep >= 1 && currentStep <= 6 && (
            (() => {
              const stepIndex = currentStep - 1;
              const stepConfig = STEPS[stepIndex];
              
              // Get current state value based on stepConfig.field
              let currentValue = '';
              let setCurrentValue = (val: string) => {};
              if (stepConfig.field === 'userPersona') {
                currentValue = userPersona;
                setCurrentValue = setUserPersona;
              } else if (stepConfig.field === 'primaryMarkets') {
                currentValue = primaryMarkets;
                setCurrentValue = setPrimaryMarkets;
              } else if (stepConfig.field === 'tradingDuration') {
                currentValue = tradingDuration;
                setCurrentValue = setTradingDuration;
              } else if (stepConfig.field === 'biggestChallenge') {
                currentValue = biggestChallenge;
                setCurrentValue = setBiggestChallenge;
              } else if (stepConfig.field === 'primaryGoal') {
                currentValue = primaryGoal;
                setCurrentValue = setPrimaryGoal;
              }

              return (
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-2 mb-6">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                      {stepConfig.title}
                    </h2>
                    {stepConfig.purpose && (
                      <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                        {stepConfig.purpose}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 py-1 custom-scrollbar max-h-[380px]">
                    {stepConfig.options.map((opt, idx) => {
                      const isSelected = currentValue === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            setCurrentValue(opt);
                            setTimeout(() => setCurrentStep(currentStep + 1), 200);
                          }}
                          className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-sm cursor-pointer min-h-[58px] ${
                            isSelected 
                              ? 'border-[#c8f135] bg-[#c8f135]/10 text-white font-bold' 
                              : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300'
                          }`}
                          id={`opt-${stepConfig.field}-${idx}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center border transition-all shrink-0 ${
                              isSelected 
                                ? 'bg-[#c8f135] text-black border-[#c8f135]' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-semibold leading-snug">{opt}</span>
                          </div>
                          {isSelected && <Check size={18} className="text-[#c8f135] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Actions */}
                  <div className="mt-8 pt-4 border-t border-zinc-900/60 flex gap-4 shrink-0">
                    <button 
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-6 h-14 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-xs uppercase"
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button 
                      onClick={() => currentValue && setCurrentStep(currentStep + 1)}
                      disabled={!currentValue}
                      className={`flex-1 h-14 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                        currentValue
                          ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-95 active:scale-[0.98]'
                          : 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-40'
                      }`}
                    >
                      Continue
                      <ChevronRight size={14} className="stroke-[3]" />
                    </button>
                  </div>
                </motion.div>
              );
            })()
          )}

          {/* SCREEN 6: RESULTS SCREEN (SHOW KIND OF TRADER) */}
          {currentStep === 7 && (
            (() => {
              const selectedProfileKey = mapPersonaToProfileKey(userPersona);
              const activeProfile = PROFILES[selectedProfileKey] || PROFILES.Swing;
              const IconComponent = activeProfile.icon;

              return (
                <motion.div
                  key="results-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] font-extrabold tracking-widest text-[#c8f135] uppercase bg-[#c8f135]/10 px-2.5 py-1 rounded border border-[#c8f135]/20">
                      ONBOARDING COMPLETE
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
                      Here is what kind of trader you are:
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Our system analyzed your profile preferences and synthesized your custom workspace configuration.
                    </p>
                  </div>

                  {/* Profile Results Card */}
                  <div className={`p-6 rounded-2xl border relative overflow-hidden flex-1 flex flex-col justify-between min-h-[300px] mb-6 ${activeProfile.bgClass}`} style={{ boxShadow: `inset 0 0 40px ${activeProfile.glowingGlow}` }}>
                    <div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeProfile.color} flex items-center justify-center text-black shadow-lg shrink-0`}>
                          <IconComponent size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">YOUR PERSONA</span>
                          <h3 className={`text-xl font-black tracking-tight ${activeProfile.textClass}`}>{activeProfile.title}</h3>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium mb-6">
                        {activeProfile.description}
                      </p>

                      <div className="space-y-3">
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-400 block">
                          🛡️ SUGGESTED RISK OVERLAYS:
                        </span>
                        <div className="space-y-2">
                          {activeProfile.guidelines.map((guide, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300">
                              <span className="text-[#c8f135] font-bold shrink-0 mt-0.5">✓</span>
                              <span className="leading-normal">{guide}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="mt-2 pt-4 border-t border-zinc-900/60 flex gap-4 shrink-0">
                    <button 
                      onClick={() => setCurrentStep(5)}
                      className="px-6 h-14 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-xs uppercase"
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button 
                      onClick={() => {
                        const scores = {
                          JustLearning: selectedProfileKey === 'JustLearning' ? 10 : 2,
                          Investor: selectedProfileKey === 'Investor' ? 10 : 2,
                          Swing: selectedProfileKey === 'Swing' ? 10 : 2,
                          Intraday: selectedProfileKey === 'Intraday' ? 10 : 2,
                          Scalper: selectedProfileKey === 'Scalper' ? 10 : 2,
                          Algo: selectedProfileKey === 'Algo' ? 10 : 2
                        };
                        
                        setResultProfile(selectedProfileKey);
                        setClassificationScores(scores);
                        saveProfileData(selectedProfileKey, scores);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 h-14 rounded-2xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-[#c8f135] to-emerald-400 text-black font-extrabold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? 'Compiling Workspace...' : 'Compile My Dashboard & Launch'}
                      <Check size={14} className="stroke-[3]" />
                    </button>
                  </div>
                </motion.div>
              );
            })()
          )}

          {/* COMPILING LOADING SCREEN OVERLAY */}
          {isSubmitting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#09090b]/98 backdrop-blur-md flex flex-col items-center justify-center p-8 z-[110] text-center"
            >
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-zinc-800/80" />
                <div className="absolute inset-0 rounded-full border-2 border-t-[#c8f135] animate-spin" style={{ animationDuration: '1s' }} />
                <div className="absolute inset-4 rounded-full bg-[#c8f135]/5 flex items-center justify-center">
                  <Sparkles size={24} className="text-[#c8f135] animate-pulse" />
                </div>
              </div>
              <span className="text-[10px] font-extrabold tracking-widest text-[#c8f135] uppercase mb-1.5">
                Terminal Initialization
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Compiling Personal Workspace...
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-2 leading-relaxed">
                Calibrating customized cognitive guardrails, risk tolerances, and behavioral guidelines based on your trading style profile.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
