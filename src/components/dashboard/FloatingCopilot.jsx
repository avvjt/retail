import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { 
  Bot, 
  Sparkles, 
  Send, 
  TrendingUp, 
  Newspaper, 
  Layers, 
  Globe, 
  HelpCircle, 
  Activity, 
  Compass, 
  Search,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  X,
  Minimize2,
  MessageSquare,
  GripVertical,
  Move,
  RotateCcw
} from 'lucide-react';
import Markdown from 'react-markdown';

// A highly polished, creative futuristic logo/avatar for Alpha Copilot
function CopilotAvatar({ size = 32, isAnimated = false, isDark = true }) {
  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Dynamic spinning glow ring */}
      <motion.div
        animate={isAnimated ? { rotate: 360 } : { rotate: 45 }}
        transition={isAnimated ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
        className={`absolute inset-0 bg-gradient-to-tr opacity-85 ${isDark ? 'from-[#c8f135] via-[#4ade80] to-[#06b6d4]' : 'from-emerald-600 via-teal-500 to-blue-500'}`}
        style={{ borderRadius: size * 0.35 }}
      />
      {/* Pulse background layer for animated mode */}
      {isAnimated && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={`absolute inset-[-4px] blur-[8px] opacity-30 ${isDark ? 'bg-[#c8f135]' : 'bg-emerald-500'}`}
          style={{ borderRadius: size * 0.4 }}
        />
      )}
      {/* Inner face panel */}
      <div 
        className="absolute flex items-center justify-center"
        style={{ 
          inset: '2px', 
          borderRadius: size * 0.3,
          backgroundColor: isDark ? '#09090b' : '#ffffff'
        }}
      >
        <Sparkles 
          size={size * 0.45} 
          className={isDark ? "text-[#c8f135] drop-shadow-[0_0_4px_rgba(200,241,53,0.5)]" : "text-emerald-600"} 
        />
        {/* Abstract intelligence orbit indicators */}
        <motion.div 
          animate={isAnimated ? { scale: [0.8, 1.2, 0.8] } : { scale: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"
        />
      </div>
    </div>
  );
}

export default function FloatingCopilot({ theme }) {
  const location = useLocation();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const dragControls = useDragControls();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am **Alpha Copilot**, your real-time stock market intelligence assistant.\n\nI am connected to the **RetailX Real-Time Market & Exchange Depth Engine**, giving you verified live stock prices, benchmark indices (NIFTY, BANK NIFTY, SENSEX), corporate actions, technical patterns, and risk frameworks.\n\nWhat are we analyzing today?",
      time: new Date(),
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const chatEndRef = useRef(null);

  // Map routes to human-readable page names
  const pageMap = {
    '/dashboard': 'Dashboard Overview',
    '/dashboard/analysis': 'Market Analysis',
    '/dashboard/scanner': 'Pattern Scanner',
    '/dashboard/smart-money': 'Smart Money Activity',
    '/dashboard/watchlist': 'AI Watchlist',
    '/dashboard/options': 'Options Intelligence',
    '/dashboard/heatmap': 'Market Heatmap',
    '/dashboard/algo-builder': 'Algo Builder',
    '/dashboard/paper-trading': 'Paper Trading',
    '/dashboard/broker': 'Broker Connect',
    '/dashboard/community': 'Community',
    '/dashboard/discussions': 'Discussions',
    '/dashboard/billing': 'Billing',
    '/dashboard/journal': 'Trade Journal',
    '/dashboard/coach': 'AI Risk Guard',
    '/dashboard/alerts': 'Alerts Feed',
    '/dashboard/performance': 'Performance Analytics',
    '/dashboard/education': 'Education'
  };

  const currentPageName = pageMap[location.pathname] || 'Dashboard';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 80);
    }
  }, [isOpen, messages, isLoading]);

  // Show subtle greeting nudge after some time
  useEffect(() => {
    const slideInterval = setInterval(() => {
      if (!isOpen) {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    }, 15000);

    const initialTimeout = setTimeout(() => {
      if (!isOpen) {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    }, 4000);

    return () => {
      clearInterval(slideInterval);
      clearTimeout(initialTimeout);
    };
  }, [isOpen]);

  // Handle global events to trigger copilot open or ask from overview/sidebar
  useEffect(() => {
    const handleQuickAsk = (e) => {
      const prompt = e?.detail ?? localStorage.getItem('copilot_initial_prompt');
      setIsOpen(true);
      if (prompt && typeof prompt === 'string' && prompt.trim()) {
        localStorage.removeItem('copilot_initial_prompt');
        setTimeout(() => {
          handleSend(prompt.trim());
        }, 120);
      }
    };

    const handleSimpleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('open_copilot_ask', handleQuickAsk);
    window.addEventListener('open_copilot', handleSimpleOpen);
    
    // Also expose a direct helper function
    window.openAlphaCopilot = (promptText = '') => {
      setIsOpen(true);
      if (promptText && typeof promptText === 'string' && promptText.trim()) {
        setTimeout(() => {
          handleSend(promptText.trim());
        }, 120);
      }
    };

    // Check on mount if there's an initial prompt stored
    const storedPrompt = localStorage.getItem('copilot_initial_prompt');
    if (storedPrompt && storedPrompt.trim()) {
      localStorage.removeItem('copilot_initial_prompt');
      setIsOpen(true);
      setTimeout(() => {
        handleSend(storedPrompt.trim());
      }, 150);
    }

    return () => {
      window.removeEventListener('open_copilot_ask', handleQuickAsk);
      window.removeEventListener('open_copilot', handleSimpleOpen);
      delete window.openAlphaCopilot;
    };
  }, [messages, isLoading]);

  const presetQueries = [
    { 
      label: `Explain ${currentPageName}`, 
      prompt: `Please explain the features and data shown on the ${currentPageName} page I am currently viewing, and how I can use it.`,
      icon: Search 
    },
    { 
      label: "Live Prices", 
      prompt: "What is the current stock price and recent trend of Nifty 50 and Apple (AAPL)?",
      icon: TrendingUp 
    },
    { 
      label: "Option Strategy", 
      prompt: "Explain how to construct a Bull Call Spread option strategy.",
      icon: Layers 
    },
    { 
      label: "Technical Signals", 
      prompt: "Explain how RSI and MACD are used together to identify bullish divergences.",
      icon: Activity 
    }
  ];

  const handleSend = async (customPrompt, isExplain = false) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    setError('');
    setIsLoading(true);

    let base64Image = null;
    if (isExplain) {
      try {
        const canvas = await html2canvas(document.body, {
          ignoreElements: (element) => element.id === 'floating-copilot', // Avoid screenshotting the copilot itself
          scale: 1 // Lower scale to keep payload size small
        });
        base64Image = canvas.toDataURL('image/jpeg', 0.5);
      } catch (err) {
        console.error("Screenshot capture failed:", err);
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      time: new Date(),
      sources: [],
      image: base64Image
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInput('');

    try {
      // Keep only last 10 messages for token context efficiency
      const historyPayload = messages.slice(-10).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        text: msg.text,
        image: msg.image
      }));

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          pageContext: currentPageName,
          image: base64Image
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned error code ${res.status}`);
      }

      const data = await res.json();
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply || "I couldn't process that request at this moment.",
        time: new Date(),
        sources: data.sources || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("[Copilot Request Error]:", err);
      setError('Communication failed. Please verify your GEMINI_API_KEY in Settings Secrets.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="floating-copilot" className="fixed bottom-6 right-6 z-50 font-sans text-left pointer-events-none">
      <AnimatePresence>
        {/* Floating Toggle Button (Draggable) */}
        {!isOpen && (
          <motion.div
            key={`button-${resetKey}`}
            layoutId="copilot-floating-container"
            drag
            dragMomentum={false}
            dragElastic={0.08}
            dragConstraints={{ left: -window.innerWidth + 180, right: 20, top: -window.innerHeight + 120, bottom: 20 }}
            whileDrag={{ scale: 1.06, cursor: 'grabbing' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="pointer-events-auto cursor-grab active:cursor-grabbing inline-block"
            title="Drag anywhere on screen to relocate Alpha Copilot"
          >
            <div
              onClick={() => setIsOpen(true)}
              className={`flex items-center relative h-[56px] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)] border transition-all duration-300 hover:scale-105 pl-3 pr-4 group select-none ${
                isDark 
                  ? 'bg-black text-white hover:text-[#c8f135] border-[#c8f135]/40 hover:border-[#c8f135]' 
                  : 'bg-white text-gray-900 hover:text-emerald-600 border-black/10 hover:border-emerald-500 shadow-md'
              }`}
            >
              <div className={`absolute inset-0 rounded-full opacity-10 pointer-events-none ${isDark ? 'bg-[#c8f135]' : 'bg-emerald-600'}`}></div>
              
              {/* Drag Grip Handle */}
              <div className="mr-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} className="text-gray-400" />
              </div>

              <div className="flex items-center justify-center shrink-0">
                <CopilotAvatar size={34} isAnimated={true} isDark={isDark} />
              </div>
              
              <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out flex flex-col justify-center ${
                showMessage 
                  ? 'max-w-[200px] ml-3 opacity-100' 
                  : 'max-w-0 opacity-0 ml-0 group-hover:max-w-[200px] group-hover:ml-3 group-hover:opacity-100'
              }`}>
                <span className="font-extrabold text-[10px] tracking-wider uppercase">
                  Alpha Copilot Active
                </span>
                <span className="text-[9px] opacity-60">Drag to move • Click to open</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Floating Chat Panel (Draggable from Header) */}
        {isOpen && (
          <motion.div
            key={`panel-${resetKey}`}
            layoutId="copilot-floating-container"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.05}
            dragConstraints={{ left: -window.innerWidth + 440, right: 30, top: -window.innerHeight + 580, bottom: 30 }}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`pointer-events-auto w-[calc(100vw-3rem)] sm:w-[430px] h-[560px] max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border shadow-[0_24px_64px_rgba(0,0,0,0.35)] ${
              isDark 
                ? 'border-white/10 bg-[#0c0c0e]/95 text-white backdrop-blur-2xl' 
                : 'border-black/5 bg-white text-gray-900 backdrop-blur-2xl'
            }`}
          >
            {/* Draggable Header */}
            <div 
              onPointerDown={(e) => {
                // Don't trigger drag if clicking buttons
                if (e.target.closest('button')) return;
                dragControls.start(e);
              }}
              className={`p-3.5 sm:p-4 flex items-center justify-between border-b cursor-grab active:cursor-grabbing select-none ${
                isDark ? 'border-white/10 bg-black/60' : 'border-black/5 bg-gray-50'
              }`}
              title="Click and drag header to relocate anywhere on screen"
            >
              <div className="flex items-center gap-2.5">
                <div className="opacity-40 hover:opacity-100 transition-opacity p-0.5" title="Drag to relocate">
                  <Move size={14} className="text-gray-400" />
                </div>
                <div className="relative">
                  <CopilotAvatar size={34} isAnimated={true} isDark={isDark} />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-black rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm tracking-tight">Alpha Copilot</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isDark ? 'bg-[#c8f135]/15 text-[#c8f135]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                    }`}>Gemini AI</span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                    Drag header to relocate • Live AI
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Reset Position Button */}
                <button
                  type="button"
                  onClick={() => setResetKey(k => k + 1)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white' : 'border-black/5 hover:bg-black/5 text-gray-500'
                  }`}
                  title="Reset window position to corner"
                >
                  <RotateCcw size={13} />
                </button>

                {/* Clear Chat History */}
                <button
                  type="button"
                  onClick={() => {
                    if (showConfirmClear) {
                      setMessages([
                        {
                          id: 'welcome',
                          role: 'model',
                          text: "Hello! I am **Alpha Copilot**, your real-time stock market intelligence assistant.\n\nI am connected to the **RetailX Real-Time Market & Exchange Depth Engine**, giving you verified live stock prices, benchmark indices (NIFTY, BANK NIFTY, SENSEX), corporate actions, technical patterns, and risk frameworks.\n\nWhat are we analyzing today?",
                          time: new Date(),
                          sources: []
                        }
                      ]);
                      setShowConfirmClear(false);
                    } else {
                      setShowConfirmClear(true);
                      setTimeout(() => {
                        setShowConfirmClear(false);
                      }, 3000);
                    }
                  }}
                  className={`p-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                    showConfirmClear
                      ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                      : isDark ? 'border-white/10 hover:bg-white/10 text-gray-300' : 'border-black/5 hover:bg-black/5 text-gray-600'
                  }`}
                  title="Clear conversation history"
                >
                  {showConfirmClear ? 'Confirm?' : 'Clear'}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-gray-300' : 'border-black/5 hover:bg-black/5 text-gray-600'
                  }`}
                  title="Close Copilot"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b ${
              isDark ? 'from-transparent to-black/10' : 'from-transparent to-gray-50'
            }`}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <CopilotAvatar size={32} isAnimated={false} isDark={isDark} />
                  )}
                  
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed font-medium transition-colors ${
                        msg.role === 'user'
                          ? (isDark ? 'bg-[#c8f135] text-black rounded-tr-sm font-semibold shadow-sm' : 'bg-emerald-600 text-white rounded-tr-sm font-semibold shadow-sm')
                          : isDark
                            ? 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm markdown-body'
                            : 'bg-gray-100 border border-black/5 text-gray-900 rounded-tl-sm markdown-body'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="flex flex-col gap-2">
                          {msg.image && (
                            <img src={msg.image} alt="Context Screenshot" className="rounded-xl border border-black/10 max-w-full opacity-90 mb-1" />
                          )}
                          <span>{msg.text}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full break-words">
                          <Markdown
                            components={{
                              p: ({node, ...props}) => <p className="m-0 leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className={`font-bold ${isDark ? 'text-[#c8f135]' : 'text-emerald-700'}`} {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-1 my-1.5" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 space-y-1 my-1.5" {...props} />,
                              h1: ({node, ...props}) => <h1 className={`text-xs font-extrabold mt-3 mb-1 border-b pb-0.5 ${isDark ? 'text-white border-white/10' : 'text-gray-900 border-black/5'}`} {...props} />,
                              h2: ({node, ...props}) => <h2 className={`text-xs font-extrabold mt-2 mb-1 ${isDark ? 'text-[#c8f135]' : 'text-emerald-700'}`} {...props} />,
                              h3: ({node, ...props}) => <h3 className={`text-xs font-bold mt-1.5 mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`} {...props} />,
                              li: ({node, ...props}) => <li className="text-[11px] pl-0.5 marker:text-gray-400" {...props} />,
                              code: ({node, ...props}) => <code className={`px-1 py-0.5 rounded text-[10px] font-mono border ${isDark ? 'bg-black/40 text-emerald-400 border-white/5' : 'bg-black/5 text-indigo-600 border-black/5'}`} {...props} />,
                            }}
                          >
                            {msg.text}
                          </Markdown>

                          {/* Grounding citations inside chat */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className={`mt-3 pt-2.5 border-t text-[10px] ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                              <p className="font-extrabold text-gray-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                                <Search size={10} className={isDark ? "text-[#c8f135]" : "text-emerald-600"} />
                                Citations:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.sources.slice(0, 3).map((src, sIdx) => (
                                  <a
                                    key={sIdx}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9.5px] transition-all font-semibold ${
                                      isDark 
                                        ? 'bg-white/5 border-white/10 hover:bg-[#c8f135]/10 hover:border-[#c8f135]/40 text-gray-300' 
                                        : 'bg-white border-zinc-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-gray-600'
                                    }`}
                                  >
                                    <Globe size={9} />
                                    <span className="truncate max-w-[100px]">{src.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`text-[8px] mt-0.5 text-gray-500 font-mono tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

               {isLoading && (
                <div className="flex gap-2.5 justify-start items-center">
                  <CopilotAvatar size={32} isAnimated={true} isDark={isDark} />
                  <div className={`p-3 rounded-2xl text-[11px] flex flex-col gap-1 rounded-tl-sm shadow-md ${
                    isDark 
                      ? 'bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 text-gray-200' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-50 border border-black/5 text-gray-800'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#c8f135]' : 'bg-emerald-600'} animate-ping`} />
                      Alpha Market Intelligence Grid
                    </div>
                    <span className="font-semibold text-[11px] leading-relaxed">
                      Synthesizing live web indexes and search results...
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <motion.div 
                        animate={{ width: ["15%", "95%", "40%", "100%", "15%"] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className={`h-1 rounded-full bg-gradient-to-r ${isDark ? 'from-[#c8f135] via-emerald-400 to-cyan-500 shadow-[0_0_8px_rgba(200,241,53,0.5)]' : 'from-emerald-600 via-teal-500 to-blue-500 shadow-sm'}`}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="m-3 p-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-2 text-[10px] font-semibold">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}

            {/* Suggested Starter Chips */}
            {messages.length === 1 && (
              <div className={`p-2.5 px-4 border-t ${isDark ? 'border-white/5 bg-black/20' : 'border-black/5 bg-gray-50'}`}>
                <p className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mb-1.5 flex items-center gap-1">
                  <Compass size={11} /> Suggested Analysis
                </p>
                <div className="flex flex-col gap-1.5">
                  {presetQueries.map((query, idx) => {
                    const Icon = query.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(query.prompt, idx === 0)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold border transition-all text-left ${
                          isDark 
                            ? 'bg-white/5 border-white/5 hover:bg-[#c8f135]/15 hover:border-[#c8f135]/40 text-gray-300' 
                            : 'bg-white border-zinc-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-gray-700'
                        }`}
                      >
                        <Icon size={12} className={isDark ? "text-[#c8f135]" : "text-emerald-600"} />
                        <span>{query.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className={`p-3 border-t flex gap-2 items-center ${isDark ? 'border-white/10 bg-black/60' : 'border-black/5 bg-gray-50'}`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about live stocks, options strategies..."
                disabled={isLoading}
                className={`flex-1 p-2.5 px-4 rounded-xl text-xs border transition-all focus:outline-none focus:ring-0 font-medium ${
                  isDark 
                    ? 'bg-white/5 border-white/10 focus:border-[#c8f135]/50 text-white placeholder-gray-500' 
                    : 'bg-white border-black/10 focus:border-emerald-500 text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 active:scale-95 disabled:scale-100 disabled:opacity-40 shadow-sm ${
                  isDark 
                    ? 'bg-[#c8f135] text-black hover:bg-[#b5db2b]' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
