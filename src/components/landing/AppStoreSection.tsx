import React from 'react';
import { Smartphone, Check, ArrowRight } from 'lucide-react';

export default function AppStoreSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#070D1B] border-b border-slate-800/80 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-[#0A1628] rounded-3xl border border-blue-950/80 p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Text and Badges */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-3">
                <Smartphone size={13} className="text-blue-400" />
                <span>CROSS-PLATFORM ECOSYSTEM</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
                Trade Smarter. Anywhere.
              </h2>

              <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
                Access RetailX on web, iOS, and Android. Your customized trading desk, real-time risk guard, and Alpha Copilot are always with you.
              </p>

              {/* App Store Badges */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                {/* Apple App Store Badge */}
                <a
                  href="#app-store"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new Event('openAuth'));
                  }}
                  className="flex items-center gap-3 bg-black hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 px-5 py-3 rounded-xl transition-all duration-200 group shadow-md"
                >
                  <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1.01.08 2.02-.49 2.64-1.24z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] uppercase font-normal text-slate-400">Download on the</div>
                    <div className="text-sm font-bold text-white tracking-wide">App Store</div>
                  </div>
                </a>

                {/* Google Play Store Badge */}
                <a
                  href="#google-play"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new Event('openAuth'));
                  }}
                  className="flex items-center gap-3 bg-black hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 px-5 py-3 rounded-xl transition-all duration-200 group shadow-md"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <path d="M3.6 2.4C3.4 2.6 3.3 2.9 3.3 3.4V20.6C3.3 21.1 3.4 21.4 3.6 21.6L13.1 12.1L3.6 2.4Z" fill="#2196F3" />
                    <path d="M16.3 8.9L13.1 12.1L16.3 15.3L20.1 13.1C21.2 12.5 21.2 11.5 20.1 10.9L16.3 8.9Z" fill="#FFC107" />
                    <path d="M3.6 2.4L13.1 12.1L16.3 8.9L4.9 2.4C4.3 2.1 3.8 2.1 3.6 2.4Z" fill="#4CAF50" />
                    <path d="M3.6 21.6C3.8 21.9 4.3 21.9 4.9 21.6L16.3 15.3L13.1 12.1L3.6 21.6Z" fill="#F44336" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] uppercase font-normal text-slate-400">GET IT ON</div>
                    <div className="text-sm font-bold text-white tracking-wide">Google Play</div>
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span>Sub-second Push Alerts</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span>Biometric Fingerprint/FaceID</span>
                </span>
              </div>
            </div>

            {/* Right Column: Visual Phone Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 bg-[#111827] p-3 rounded-[36px] border-2 border-slate-700 shadow-2xl">
                <div className="bg-[#070D1B] rounded-[28px] p-3 text-center text-xs overflow-hidden">
                  <div className="w-12 h-3 bg-black rounded-full mx-auto mb-3" />
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                    Mobile Companion
                  </div>
                  <div className="text-sm font-bold text-white mb-2">
                    NSE Live Stream
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-left space-y-1.5 mb-2">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-slate-300">NIFTY</span>
                      <span className="text-emerald-400">+0.73%</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-slate-300">BANKNIFTY</span>
                      <span className="text-emerald-400">+0.81%</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Syncs with web session in real-time
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
