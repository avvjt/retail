import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';

interface MountainBannerProps {
  onGetStarted: () => void;
}

export default function MountainBanner({ onGetStarted }: MountainBannerProps) {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-[#0A1628] border border-blue-900/50 p-8 sm:p-12 lg:p-16 text-center text-white shadow-2xl">
          
          {/* Subtle gradient layers resembling sunrise mountain skyline */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D1B] via-[#0A1628]/90 to-blue-950/60 pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none" />
          
          {/* Stylized mountain silhouette SVG in the background */}
          <div className="absolute inset-x-0 bottom-0 opacity-20 pointer-events-none flex justify-center">
            <svg viewBox="0 0 1200 240" fill="none" className="w-full max-w-4xl h-auto">
              <path d="M0 240L240 120L420 180L650 60L880 200L1050 110L1200 240H0Z" fill="#3B82F6" />
              <path d="M150 240L380 150L540 210L780 100L960 210L1100 160L1200 240H150Z" fill="#1D4ED8" />
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-4 tracking-wider uppercase">
              <Compass size={13} className="text-blue-400" />
              <span>TRADE A BRIGHTER TOMORROW</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Discipline Today. Freedom Tomorrow.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
              RetailX helps you make informed decisions, eliminate emotional impulse trades, and build sustainable long-term trading consistency.
            </p>

            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:translate-y-[-1px] active:scale-[0.98]"
              id="mountain-banner-cta-btn"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
