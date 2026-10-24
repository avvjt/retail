import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, RefreshCw, AlertCircle, TrendingUp, ShieldAlert, CheckCircle2, Copy } from 'lucide-react';
import Markdown from 'react-markdown';

export default function PaperTradingChat({ 
  theme = 'light', 
  selectedSymbol = 'NIFTY50',
  currentPrice = 24000,
  walletBalance = 500000,
  positions = []
}) {
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am your **Paper Trading AI Copilot**. I have live context on **${selectedSymbol}** (₹${Number(currentPrice).toLocaleString()}) and your ₹${Number(walletBalance).toLocaleString()} virtual account.\n\nAsk me about trade entry setups, position sizing, stop-loss & target calculations, or risk assessment for your open positions!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    { label: `Strategy for ${selectedSymbol}`, prompt: `Analyze current trend and suggest a high-probability option or futures trade setup for ${selectedSymbol} at ₹${currentPrice}.` },
    { label: 'SL & Target Calculator', prompt: `Calculate recommended Stop-Loss and Target levels with a 1:2 risk-reward ratio for ${selectedSymbol} at current price ₹${currentPrice}.` },
    { label: 'Risk & Position Sizing', prompt: `With my current balance of ₹${walletBalance} and ${positions.length} open positions, what is the maximum lot size I should risk per trade?` },
    { label: 'Review Open Positions', prompt: `Review my current open paper trading positions and advise if I should hold, trail stop-loss, or book profit.` }
  ];

  const handleSend = async (customPrompt) => {
    const query = (customPrompt || input).trim();
    if (!query || loading) return;

    setInput('');
    setError(null);

    const userMsg = { id: String(Date.now()), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build rich context for the AI
      const systemContext = `You are an elite quantitative and technical trading mentor inside an NSE Paper Trading simulator. 
Active Instrument: ${selectedSymbol} at ₹${currentPrice}. 
Virtual Balance: ₹${walletBalance}. 
Open Positions Count: ${positions.length}.
Open Positions Details: ${JSON.stringify(positions.map(p => ({
  symbol: p.symbol,
  type: p.instrumentType,
  strike: p.strikePrice,
  side: p.side,
  qty: p.quantity,
  entry: p.entryPrice,
  current: p.currentPrice,
  pnl: p.unrealizedPnl
})))}.
Provide concise, actionable, disciplined trading feedback with entry, stop loss, and target levels. Strictly encourage prudent risk management (maximum 1-2% account risk per trade).`;

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: `${systemContext}\n\nUser Question: ${query}`,
          history: messages.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            text: m.content
          })),
          pageContext: 'Paper Trading'
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to generate AI response`);
      }

      const data = await response.json();
      const botReply = data.reply || data.response || "No response received from AI trading engine.";
      
      setMessages(prev => [...prev, {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: botReply
      }]);
    } catch (err) {
      console.error("PaperTradingChat error:", err);
      setError(err.message || "Failed to reach AI copilot");
      setMessages(prev => [...prev, {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `I couldn't reach the AI engine right now. However, for **${selectedSymbol}** at **₹${Number(currentPrice).toLocaleString()}**, standard risk parameters recommend keeping stop-loss strictly within 0.4% - 0.7% of spot for intraday index options and risking no more than ₹${(walletBalance * 0.015).toLocaleString()} (1.5% of total capital) on this trade.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-200';
  const chatBubbleUser = isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white';
  const chatBubbleBot = isDark ? 'bg-white/5 border border-white/10 text-gray-100' : 'bg-gray-50 border border-gray-200 text-gray-900';

  return (
    <div className={`flex flex-col h-[520px] rounded-xl border ${cardBg} overflow-hidden shadow-sm`}>
      {/* Chat Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${isDark ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Paper Trading Copilot</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                Live AI
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Context: {selectedSymbol} (₹{Number(currentPrice).toLocaleString()}) • Balance ₹{Number(walletBalance).toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-gray-400 hover:text-gray-200 p-1 rounded"
          title="Clear Conversation"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${m.role === 'user' ? chatBubbleUser : chatBubbleBot}`}>
              <div className="markdown-body">
                <Markdown>{m.content}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs pl-8">
            <RefreshCw size={13} className="animate-spin text-emerald-500" />
            <span>Analyzing trade strategy & risk rules...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className={`p-2 border-t overflow-x-auto flex items-center gap-1.5 ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              isDark 
                ? 'border-white/10 text-gray-300 hover:bg-white/10' 
                : 'border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className={`p-3 border-t flex items-center gap-2 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-gray-200'}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Ask about ${selectedSymbol} trade levels, position sizing, or risk...`}
          className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none ${
            isDark ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500'
          }`}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
