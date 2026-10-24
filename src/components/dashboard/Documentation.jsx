import React from 'react';
import { Book, Code, Terminal, Zap, ShieldAlert, LineChart, Cpu, Settings, Lock, Share2, Search, Database } from 'lucide-react';

export default function Documentation({ theme }) {
  const sections = [
    {
      title: "Getting Started",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      content: "Welcome to RetailX! Begin your journey by customizing your trading profile. Navigate to Profile Settings to establish your trading identity, then head over to Broker Connect to link your live brokerage accounts using secure OAuth integration. Finish your setup by defining your risk thresholds in the Risk Management module to ensure all your trades fall within safe parameters."
    },
    {
      title: "Core Scanner Engine",
      icon: <Terminal className="w-5 h-5 text-emerald-500" />,
      content: "The Core Scanner is your primary tool for market discovery. It utilizes advanced filtering logic across both real-time tick data and historical trends. You can specify criteria such as Relative Volume (RVOL), Moving Averages (SMA50, SMA200), VWAP interactions, and RSI levels. The scanner executes comprehensive market sweeps every 5 minutes and flags setups that pass your quantitative criteria and risk filters."
    },
    {
      title: "Algorithmic Builder",
      icon: <Code className="w-5 h-5 text-blue-500" />,
      content: "Democratize quantitative finance with our visual, no-code Algo Builder. Drag and drop conditions (e.g., 'If Price crosses above EMA20' AND 'RSI < 70') to form robust trading logic. You can instantly backtest your logic against up to 5 years of historical data. Once confident, seamlessly deploy the algorithm into Paper Trading mode or link it to live execution endpoints."
    },
    {
      title: "Risk Management & Kill Switches",
      icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
      content: "Your capital's safety is our top priority. The Risk Settings module allows you to define strict rules: Maximum Daily Drawdown, Max Position Sizing, and consecutive loss limits. If you breach a critical limit, the Auto-Pause Checklist Rule engages—acting as an emotional circuit breaker that temporarily locks order submissions until a cool-down period elapses."
    },
    {
      title: "Paper Trading Simulator",
      icon: <LineChart className="w-5 h-5 text-purple-500" />,
      content: "Test your edge without financial risk. Our Paper Trading engine mimics live market mechanics—including bid/ask spread slippage, order queues, and partial fills. Your hypothetical portfolio tracks P&L accurately, allowing you to gauge performance of manual trades or automated algos before risking real capital."
    },
    {
      title: "AI Co-pilot & Analysis",
      icon: <Cpu className="w-5 h-5 text-indigo-500" />,
      content: "The platform features a multi-tiered AI analysis system powered by state-of-the-art models (GPT-5.5, Claude Sonnet, Gemini Flash). The AI will auto-generate chart narratives, summarize news catalysts, and provide risk-reward scores on any ticker. Our strict fallback cascade ensures you always receive quantitative insights even if primary API endpoints experience latency."
    },
    {
      title: "Custom Webhooks & API Integration",
      icon: <Share2 className="w-5 h-5 text-pink-500" />,
      content: "For advanced users, RetailX offers outgoing webhooks to push signal alerts directly into your Discord, Telegram, or custom endpoints. You can also integrate directly with our REST API to query historical backtest results and sync performance statistics securely."
    },
    {
      title: "Enterprise Grade Security",
      icon: <Lock className="w-5 h-5 text-green-500" />,
      content: "All brokerage tokens and API keys are strictly hashed and encrypted at rest using AES-256 standards. Our cloud infrastructure leverages Zero Trust architecture, meaning your algorithms execute in isolated containerized sandboxes to prevent cross-contamination and guarantee maximum execution speed."
    }
  ];

  return (
    <div className={`w-full p-6 h-full overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col items-center justify-center mb-12 max-w-5xl mx-auto text-center pt-8">
        <Book className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h1 className="text-4xl font-bold font-mono mb-2">RetailX Platform Documentation</h1>
        <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} max-w-3xl leading-relaxed mt-4`}>
          Your comprehensive guide to mastering the ultimate quantitative trading platform. Discover features, learn advanced mechanics, configure your AI models, and optimize your market edge against institutional players.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {sections.map((sec, idx) => (
          <div key={idx} className={`p-6 border rounded-xl hover:shadow-lg transition-all ${theme === 'dark' ? 'bg-[#111] border-white/10 hover:border-white/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-black/50' : 'bg-white shadow-sm border border-gray-100'}`}>
                {sec.icon}
              </div>
              <h2 className="text-xl font-bold">{sec.title}</h2>
            </div>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{sec.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
