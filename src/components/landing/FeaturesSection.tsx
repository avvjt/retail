import React from 'react';
import { 
  BarChart2, 
  Target, 
  ArrowLeftRight, 
  Search, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  Bot, 
  ArrowRight 
} from 'lucide-react';

interface FeaturesSectionProps {
  onSelectFeature: (featureName: string) => void;
}

export default function FeaturesSection({ onSelectFeature }: FeaturesSectionProps) {
  const features = [
    {
      id: 'watchlist',
      title: 'AI Watchlist',
      description: 'Track & analyze stocks with AI insights',
      icon: BarChart2,
      iconBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-600',
    },
    {
      id: 'options',
      title: 'Options Intelligence',
      description: 'Find high probability opportunities',
      icon: Target,
      iconBg: 'bg-rose-50 border-rose-200/80 text-rose-600',
    },
    {
      id: 'smart-money',
      title: 'Smart Money Activity',
      description: 'Track institutional moves',
      icon: ArrowLeftRight,
      iconBg: 'bg-blue-50 border-blue-200/80 text-blue-600',
    },
    {
      id: 'scanners',
      title: 'Scanners',
      description: 'Discover trading ideas instantly',
      icon: Search,
      iconBg: 'bg-sky-50 border-sky-200/80 text-sky-600',
    },
    {
      id: 'paper-trading',
      title: 'Paper Trading',
      description: 'Practice risk-free with virtual funds',
      icon: Terminal,
      iconBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-600',
    },
    {
      id: 'risk-guard',
      title: 'AI Risk Guard',
      description: 'Get real-time risk analysis',
      icon: ShieldCheck,
      iconBg: 'bg-teal-50 border-teal-200/80 text-teal-600',
    },
    {
      id: 'behavioral-coach',
      title: 'Behavioral Coach',
      description: 'Build better trading habits',
      icon: Sparkles,
      iconBg: 'bg-amber-50 border-amber-200/80 text-amber-600',
    },
    {
      id: 'alpha-copilot',
      title: 'Alpha Copilot',
      description: 'Your AI market assistant',
      icon: Bot,
      iconBg: 'bg-purple-50 border-purple-200/80 text-purple-600',
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left mb-12 lg:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase">
              POWERFUL FEATURES
            </span>
            <div className="w-8 h-0.5 bg-[#2563EB] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Everything You Need. In One Place.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            From real-time market insights to AI-powered guidance — RetailX gives you the tools to trade smarter and stay ahead.
          </p>
        </div>

        {/* 8 Feature Cards Grid (4 columns on desktop, 2 on tablet, scrollable/stacked on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                onClick={() => onSelectFeature(f.title)}
                className="group bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 hover:translate-y-[-2px] transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${f.iconBg}`}>
                      <Icon size={22} />
                    </div>
                    <ArrowRight 
                      size={18} 
                      className="text-slate-300 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" 
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors mb-1.5 flex items-center gap-1.5">
                    <span>{f.title}</span>
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile "Explore All Features" CTA Button */}
        <div className="mt-10 text-center sm:hidden">
          <button
            onClick={() => onSelectFeature('All')}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-sm shadow-sm hover:bg-slate-50 active:scale-[0.98]"
          >
            <span>Explore All Features</span>
            <ArrowRight size={16} className="text-[#2563EB]" />
          </button>
        </div>

      </div>
    </section>
  );
}
