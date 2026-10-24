import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import RetailXLogo from './RetailXLogo';

interface ClosingCTABannerProps {
  onGetStarted: () => void;
}

export default function ClosingCTABanner({ onGetStarted }: ClosingCTABannerProps) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100/50 border border-blue-200/80 p-8 sm:p-14 lg:p-16 text-center shadow-lg">
          
          {/* Subtle background circular accent */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            {/* Logo Emblem */}
            <div className="mb-4">
              <RetailXLogo theme="light" size="lg" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Ready to Take Control?
            </h2>

            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              Join thousands of disciplined traders using real-time market tools, risk guardrails, and AI insights to trade smarter.
            </p>

            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:translate-y-[-1px] active:scale-[0.98]"
              id="closing-cta-btn"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </button>

            {/* Micro guarantees */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#2563EB]" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#2563EB]" />
                <span>Free forever tier</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#2563EB]" />
                <span>1-minute setup</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
