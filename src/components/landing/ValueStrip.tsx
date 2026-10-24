import React from 'react';
import { Radio, Sliders, ShieldCheck, ArrowRight, Sparkles, Layers } from 'lucide-react';

interface ValueStripProps {
  onGetStarted: () => void;
}

export default function ValueStrip({ onGetStarted }: ValueStripProps) {
  const valueItems = [
    {
      title: 'Real-time Insights',
      desc: 'Stay updated with market movements',
      icon: Radio,
    },
    {
      title: 'Personalized Experience',
      desc: 'Tools that adapt to your style',
      icon: Sliders,
    },
    {
      title: 'Secure & Private',
      desc: 'Your data, your control',
      icon: ShieldCheck,
    },
    {
      title: 'Seamless Synchronization',
      desc: 'Trade across web, iOS and Android',
      icon: Layers,
    },
  ];

  return (
    <section className="bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0A1628] rounded-3xl border border-blue-950/80 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-blue-950/20 text-white">
          
          {/* Header row with Badge and CTA */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2.5">
                <Sparkles size={13} className="text-blue-400" />
                <span>AI-Powered. Built for Traders.</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Smarter tools. Deeper insights. Better decisions.
              </h3>
            </div>

            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:translate-y-[-1px] active:scale-[0.98] shrink-0"
              id="value-strip-cta-btn"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* 4 Icon + Label items row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {valueItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3.5 group">
                  <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-900 group-hover:text-blue-300 transition-colors">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
