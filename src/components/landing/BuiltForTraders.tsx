import React from 'react';
import { 
  Zap, 
  BarChart3, 
  Bell, 
  RotateCw, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Compass,
  CheckCircle,
  UserCheck
} from 'lucide-react';

export default function BuiltForTraders() {
  const stockList = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: '2,932.45', change: '+1.24%', up: true },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: '1,678.30', change: '+0.82%', up: true },
    { symbol: 'INFY', name: 'Infosys Limited', price: '1,455.60', change: '-0.36%', up: false },
    { symbol: 'TCS', name: 'Tata Consultancy', price: '4,112.20', change: '+0.91%', up: true },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: '1,085.00', change: '+1.08%', up: true },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section 1: A Smarter Way to Trade */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-24">
          
          {/* Left: Text & Key Checklist */}
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase">
                BUILT FOR REAL TRADERS
              </span>
              <div className="w-8 h-0.5 bg-[#2563EB] rounded-full" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
              A Smarter Way to Trade
            </h2>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed">
              Get the edge with AI-powered tools, real-time insights, and a clean, distraction-free interface built to keep you disciplined.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Real-time market data', desc: 'Sub-second updates on NIFTY, BANK NIFTY, and F&O stocks', icon: Zap },
                { title: 'AI-driven insights', desc: 'Predictive momentum and institutional order flow tracking', icon: BarChart3 },
                { title: 'Instant notifications', desc: 'Smart alerts when high-probability setups trigger', icon: Bell },
                { title: 'Sync across devices', desc: 'Seamless transition between Web desktop and mobile companion', icon: RotateCw },
                { title: 'Your data, your control', desc: 'Strict bank-grade encryption and privacy protection', icon: ShieldCheck },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                      <Icon size={14} />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Dual Phone/Card Interactive Showcase */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[440px]">
              
              {/* Card 1: Live Stock Watchlist Mockup */}
              <div className="bg-[#0A1628] rounded-3xl p-5 border border-slate-800 shadow-2xl text-white relative z-10">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live AI Watchlist</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">NSE · Real-time</span>
                </div>

                <div className="space-y-2">
                  {stockList.map((stk) => (
                    <div
                      key={stk.symbol}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{stk.symbol}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 font-normal">Positive Momentum</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{stk.name}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-white">₹{stk.price}</div>
                        <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${stk.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stk.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          <span>{stk.change}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Floating Risk Guard Meter Card */}
              <div className="hidden sm:block absolute -bottom-8 -right-6 z-20 bg-[#070D1B] rounded-2xl p-4 border border-blue-900/60 shadow-2xl text-white w-64 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Risk Guard</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                    PROTECTED
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="#1E293B" strokeWidth="4" fill="none" />
                      <circle cx="24" cy="24" r="20" stroke="#10B981" strokeWidth="4" fill="none" strokeDasharray="125" strokeDashoffset="35" strokeLinecap="round" />
                    </svg>
                    <span className="absolute font-bold text-xs text-white">72</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Emotional Safety</div>
                    <div className="text-[10px] text-slate-400">0 revenge trades detected</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Section 2: WHY RETAILX (4 Pillars) */}
        <div className="pt-12 border-t border-slate-200">
          <div className="text-left mb-12">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase">
                WHY RETAILX
              </span>
              <div className="w-8 h-0.5 bg-[#2563EB] rounded-full" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for a Better Trading Experience
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Smarter Tools',
                desc: 'Advanced options analytics, smart money flow, and real-time scanners built for fast execution.',
                icon: Target,
                color: 'text-blue-600 bg-blue-50 border-blue-200',
              },
              {
                title: 'Better Insights',
                desc: 'Instant AI summaries on trends, breakouts, and institutional action without market noise.',
                icon: BarChart3,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              },
              {
                title: 'More Discipline',
                desc: 'Automated behavioral guardrails that block emotional revenge trading before it costs you.',
                icon: ShieldCheck,
                color: 'text-purple-600 bg-purple-50 border-purple-200',
              },
              {
                title: 'Greater Confidence',
                desc: 'Practice risk-free in real-time paper trading before putting hard-earned capital at risk.',
                icon: UserCheck,
                color: 'text-amber-600 bg-amber-50 border-amber-200',
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${pillar.color}`}>
                    <Icon size={20} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
