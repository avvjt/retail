import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void;
}

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-3">
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Simple. Transparent. Always Fair.
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Choose a plan that fits your trading goals. Upgrade or cancel anytime with zero lock-in.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center bg-slate-200/80 p-1.5 rounded-2xl">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                !isYearly
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isYearly
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Free Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Free</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Starter
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Perfect to get started and experience core market intelligence.
              </p>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-mono">₹0</span>
                <span className="text-slate-500 text-sm font-medium">/ month</span>
              </div>

              <div className="space-y-3.5 pt-6 border-t border-slate-100 text-sm">
                {[
                  'Access to core market data & indices',
                  'AI Watchlist (up to 5 stocks)',
                  'Basic intraday scanners & screeners',
                  'Real-time Paper Trading with ₹10L virtual cash',
                  'Standard Web & Mobile companion access',
                  'Community market discussions',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('Free')}
              className="mt-8 w-full py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all active:scale-[0.98]"
              id="pricing-free-btn"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan Card */}
          <div className="bg-white rounded-3xl p-8 border-2 border-[#2563EB] shadow-xl relative flex flex-col justify-between">
            {/* Most Popular Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-md shadow-blue-500/30 flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>Most Popular</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Pro</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  Full Power
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                For serious traders who demand high-probability institutional insights.
              </p>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-mono">
                  {isYearly ? '₹399' : '₹499'}
                </span>
                <span className="text-slate-500 text-sm font-medium">/ month</span>
                {isYearly && (
                  <span className="text-xs text-slate-400 ml-2">billed annually</span>
                )}
              </div>

              <div className="space-y-3.5 pt-6 border-t border-slate-100 text-sm">
                {[
                  'Full access to all market intelligence tools',
                  'Unlimited AI Watchlists with instant alerts',
                  'Advanced Options Intelligence & Option Chain Greeks',
                  'Smart Money Activity & FII/DII Institutional flows',
                  'AI Risk Guard & automated revenge trade protection',
                  'Full Alpha Copilot conversational AI assistant',
                  'Priority trade alerts & real-time webhook sync',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                    <span className="text-slate-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('Pro')}
              className="mt-8 w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
              id="pricing-pro-btn"
            >
              Get Started
            </button>
          </div>

        </div>

        {/* View all plans link */}
        <div className="text-center mt-10">
          <button
            onClick={() => onSelectPlan('All')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            <span>View All Enterprise & Broker Partnership Plans</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </section>
  );
}
