import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export default function FloatingBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am Guardian, your RetailX behavioral safety companion. Are you feeling disciplined today, or do we need to review your tilt state and risk parameters?",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 60);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000); // Show text for 2 seconds
    }, 8000); // Trigger every 8 seconds

    // Initial show
    const initialTimeout = setTimeout(() => {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    }, 2000);

    return () => {
      clearInterval(slideInterval);
      clearTimeout(initialTimeout);
    };
  }, []);

  const presetQueries = [
    { label: "Tell me more about RetailX", text: "Tell me more about RetailX." },
    { label: "How does RetailX work?", text: "How does RetailX work?" },
    { label: "What are the core features?", text: "What are the core features of RetailX?" },
    { label: "Help, I'm tilting! 😡", text: "I've had a streak of consecutive losses and feel incredibly frustrated. Help me manage this tilt state." }
  ];

  const handleSend = async (textToSend) => {
    const rawText = textToSend || input;
    if (!rawText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: rawText,
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Map message log to backend API expected format
      const historyPayload = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        text: msg.text
      }));

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: rawText,
          history: historyPayload
        })
      });

      const data = await res.json();
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply || data.error || "I'm sorry, I am currently facing connectivity issues.",
        time: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System response degraded. Please confirm GEMINI_API_KEY is configured correctly inside your Settings Secrets.",
        time: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
      {/* Action Floating Trigger Button */}
      {!isOpen && (
        <button
          id="guardian-bot-trigger"
          onClick={() => setIsOpen(true)}
          className="flex items-center group relative h-[56px] rounded-full bg-black text-white hover:text-[#c8f135] shadow-[0_0_25px_rgba(200,241,53,0.3)] border border-[#c8f135]/40 hover:border-[#c8f135] transition-all hover:scale-105 px-4"
        >
          <div className="absolute inset-0 rounded-full bg-[#c8f135] opacity-20 animate-ping pointer-events-none"></div>
          
          <div className="flex items-center justify-center shrink-0 w-6 h-6">
            <Bot size={24} className="animate-pulse" />
          </div>
          
          <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out flex flex-col justify-center ${
            showMessage 
              ? 'max-w-[200px] ml-3 opacity-100' 
              : 'max-w-0 opacity-0 ml-0 group-hover:max-w-[200px] group-hover:ml-3 group-hover:opacity-100'
          }`}>
            <span className="font-bold text-[11px] sm:text-xs tracking-wider uppercase text-left">
              Your 24/7 AI Assistant
            </span>
          </div>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div 
          id="guardian-chatbot-window"
          className="w-[calc(100vw-3rem)] sm:w-[410px] h-[calc(100vh-8rem)] sm:h-[550px] max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0f0f11]/95 text-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/60">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-[#c8f135] to-emerald-600 text-black">
                <Bot size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-black rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                  Guardian Bot
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Institutional Mindset Safeguard</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 px-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-white/5 border border-white/10 flex items-center justify-center text-[#c8f135]">
                    <Bot size={15} />
                  </div>
                )}
                
                <div className="flex flex-col max-w-[78%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                      msg.role === 'user'
                        ? 'bg-[#c8f135] text-black rounded-tr-sm font-semibold shadow-inner'
                        : 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm markdown-body'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.text
                    ) : (
                      <div className="flex flex-col gap-1.5 w-full break-words">
                        <Markdown
                          components={{
                            p: ({node, ...props}) => <p className="m-0 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-[#c8f135]" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 space-y-1.5 my-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 space-y-1.5 my-2" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-sm font-bold mt-2 mb-1 text-white" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-sm font-bold mt-2 mb-1 text-white" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xs font-bold mt-1 mb-1 text-white" {...props} />,
                            li: ({node, ...props}) => <li className="text-xs pl-1 marker:text-gray-400" {...props} />,
                            code: ({node, ...props}) => <code className="bg-black/50 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-400" {...props} />,
                          }}
                        >
                          {msg.text}
                        </Markdown>
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] mt-1 text-gray-500 font-mono tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-white/5 border border-white/10 flex items-center justify-center text-[#c8f135]">
                  <Bot size={15} />
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-xs flex items-center gap-1.5 rounded-tl-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starters Panel */}
          {messages.length === 1 && (
            <div className="p-2 px-4 border-t border-white/5 bg-black/20">
              <p className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase mb-1.5">How can I assist your discipline?</p>
              <div className="flex flex-wrap gap-1.5">
                {presetQueries.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(query.text)}
                    className="p-1.5 px-2.5 rounded-full text-[10.5px] font-semibold bg-white/5 hover:bg-[#c8f135]/15 border border-white/5 hover:border-[#c8f135]/40 text-gray-300 hover:text-white transition-all text-left"
                  >
                    {query.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t border-white/10 bg-black/80 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Guardian about tilt or risk management..."
              className="flex-1 p-2.5 px-4 rounded-xl text-xs bg-white/5 border border-white/10 focus:border-[#c8f135]/50 focus:outline-none placeholder-gray-500 focus:ring-0 text-white font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#c8f135] text-black hover:bg-[#b0d52b] active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:hover:bg-[#c8f135] transition-all flex items-center justify-center shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
