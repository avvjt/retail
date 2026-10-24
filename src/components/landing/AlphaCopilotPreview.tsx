import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, ArrowRight } from 'lucide-react';

interface AlphaCopilotPreviewProps {
  onOpenAuth: () => void;
}

export default function AlphaCopilotPreview({ onOpenAuth }: AlphaCopilotPreviewProps) {
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'What are the top breakout stocks today?'
    },
    {
      role: 'assistant',
      text: `Here are 3 breakout stocks based on volume and institutional order flow:\n\n1. RELIANCE — Strong breakout above ₹2,920 on 2.4x average volume with sustained delivery accumulation.\n2. HDFCBANK — Testing multi-month consolidation resistance at ₹1,680 with DII net buying.\n3. TCS — Fresh momentum push with positive RSI divergence on the daily timeframe.`
    }
  ]);

  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal;
    setInputVal('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    setTimeout(() => {
      let reply = "I've analyzed your query with live NSE data. For full real-time order-book analytics, option greeks, and automated risk scoring, sign in to your RetailX account.";
      if (userText.toLowerCase().includes('option') || userText.toLowerCase().includes('nifty')) {
        reply = "NIFTY 25,000 Call options show significant short-covering while 24,900 Put open interest acts as strong immediate support. PCR stands at 1.14 (Mildly Positive Momentum).";
      } else if (userText.toLowerCase().includes('risk') || userText.toLowerCase().includes('stop')) {
        reply = "Recommended risk parameters: Cap single-trade risk at 1.5% of equity, set hard stop-loss at dynamic ATR levels, and enforce a 3-loss daily cooling off timer.";
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputVal(prompt);
  };

  return (
    <section id="copilot-preview" className="py-20 lg:py-28 bg-[#070D1B] border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Description Column */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-3">
              <Sparkles size={13} className="text-blue-400" />
              <span>ALPHA COPILOT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Your Personal <br />
              <span className="text-[#2563EB]">Trading Assistant</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
              Ask anything about the market, get instant insights, charts, and actionable ideas — powered by specialized financial AI trained on Indian market mechanics.
            </p>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => handleQuickPrompt("What are the top breakout stocks today?")}
                className="w-full text-left p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 text-xs sm:text-sm text-slate-300 hover:text-white transition-all flex items-center justify-between"
              >
                <span>💡 "What are the top breakout stocks today?"</span>
                <ArrowRight size={14} className="text-slate-500" />
              </button>

              <button
                onClick={() => handleQuickPrompt("Analyze NIFTY option chain and max pain")}
                className="w-full text-left p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 text-xs sm:text-sm text-slate-300 hover:text-white transition-all flex items-center justify-between"
              >
                <span>⚡ "Analyze NIFTY option chain and max pain"</span>
                <ArrowRight size={14} className="text-slate-500" />
              </button>

              <button
                onClick={() => handleQuickPrompt("How do I protect against revenge trading today?")}
                className="w-full text-left p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 text-xs sm:text-sm text-slate-300 hover:text-white transition-all flex items-center justify-between"
              >
                <span>🛡️ "How do I protect against revenge trading today?"</span>
                <ArrowRight size={14} className="text-slate-500" />
              </button>
            </div>

            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <span>Try Alpha Copilot Now</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right Interactive Chat UI Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-[#0A1224] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
              
              {/* Chat Header */}
              <div className="p-4 bg-[#080E1D] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Alpha Copilot</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">NSE Market Intelligence Engine</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  Model: GPT-5.5 Financial v2
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-sm font-normal">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                        <Bot size={15} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 leading-relaxed whitespace-pre-line text-xs sm:text-sm ${
                        m.role === 'user'
                          ? 'bg-[#2563EB] text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {m.text}
                    </div>

                    {m.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                        <User size={15} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-3 bg-[#080E1D] border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask anything about stocks, options, or market trends..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="w-10 h-10 rounded-xl bg-[#2563EB] disabled:bg-slate-800 disabled:text-slate-600 hover:bg-[#1D4ED8] text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
