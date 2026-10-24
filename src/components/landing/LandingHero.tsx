import React from 'react';
import { 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Laptop, 
  Search, 
  Bell, 
  ChevronDown,
  BarChart3,
  Target,
  Compass,
  Cpu,
  Shield
} from 'lucide-react';
import RetailXLogo from './RetailXLogo';

interface LandingHeroProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
}

export default function LandingHero({ onGetStarted, onWatchDemo }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-20 sm:pt-28 pb-16 lg:pt-36 lg:pb-24 bg-gradient-to-b from-white via-[#F0F6FE] to-[#070D1B] lg:bg-[#070D1B]">
      
      {/* Light glow on mobile & ambient glow on desktop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-400/10 lg:bg-blue-600/15 blur-[130px] rounded-full pointer-events-none" />

      {/* =========================================================================
          HERO CONTENT CONTAINER
         ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* =======================================================================
            MOBILE VIEW (Matches uploaded screenshot D3D3F795-FEC0-4942-BC35-2E182BA71C4C.png)
           ======================================================================= */}
        <div className="lg:hidden flex flex-col items-center text-center pt-3">
          
          {/* 1. Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3FF] border border-blue-200/80 text-[#2563EB] text-xs font-semibold mb-5 shadow-sm">
            <svg className="w-3.5 h-3.5 fill-[#2563EB]" viewBox="0 0 24 24">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
            <span>AI-Powered Trading Platform</span>
          </div>

          {/* 2. Main Headline */}
          <h1 className="text-[36px] xs:text-[40px] sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.08] mb-4">
            Smarter Insights. <br />
            <span className="text-[#2563EB]">Better Decisions.</span>
          </h1>

          {/* 3. Subtitle */}
          <p className="text-sm sm:text-base text-[#475569] max-w-lg leading-relaxed mb-7 font-normal px-2">
            All the tools you need to analyze, track, and trade — in one powerful platform. Backed by real-time data, AI insights, and institutional intelligence.
          </p>

          {/* 4. Action Buttons (Horizontal on mobile as in screenshot) */}
          <div className="flex items-center justify-center gap-3 w-full max-w-md mb-6 px-2">
            <button
              onClick={onGetStarted}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 px-4 sm:px-6 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              id="mobile-hero-getstarted-btn"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={onWatchDemo}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#0F172A] border border-blue-300/80 py-3.5 px-4 sm:px-6 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 shadow-sm active:scale-[0.98]"
              id="mobile-hero-watchdemo-btn"
            >
              <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center text-[#2563EB]">
                <Play size={10} className="ml-0.5 fill-[#2563EB]" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* 5. Guarantees Row (Horizontal with blue icons) */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#334155] font-medium mb-10 px-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#2563EB] shrink-0" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={16} className="text-[#2563EB] shrink-0" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone size={16} className="text-[#2563EB] shrink-0" />
              <span>Available on Web, iOS & Android</span>
            </div>
          </div>

          {/* 6. Phone Mockup + Floating Handwritten Accent Text Container */}
          <div className="relative w-full max-w-[360px] mx-auto pb-4">
            
            {/* Handwritten-style accent text ('Discipline today. Freedom tomorrow.') */}
            <div className="absolute -right-2 sm:-right-4 top-24 z-20 pointer-events-none transform rotate-[-7deg] text-left">
              <div 
                className="text-2xl sm:text-3xl text-[#0F172A] font-bold leading-tight"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                Discipline <br />
                today. <br />
                Freedom <br />
                tomorrow.
              </div>
              {/* Hand-drawn ink underline swoosh */}
              <svg className="w-24 sm:w-28 h-4 text-[#0F172A] -mt-1" viewBox="0 0 100 20" fill="none">
                <path d="M5 14C35 5 65 17 95 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Smartphone Chassis Mockup */}
            <div className="relative bg-[#101726] p-2.5 rounded-[46px] border-[4px] border-slate-700/80 shadow-2xl shadow-blue-950/60 w-[290px] xs:w-[310px] mx-auto">
              
              {/* Inner Screen Display */}
              <div className="relative bg-[#070D1B] rounded-[38px] overflow-hidden border border-slate-800 text-left text-white text-xs select-none">
                
                {/* Dynamic Island / Status Bar */}
                <div className="pt-2 px-5 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="font-semibold text-[11px]">9:41</span>
                  <div className="w-16 h-4 bg-black rounded-full mx-auto" />
                  <div className="flex items-center gap-1 text-[9px]">
                    <svg className="w-3.5 h-2.5 fill-current" viewBox="0 0 16 12">
                      <path d="M1 10h2V8H1v2zm4 0h2V6H5v4zm4 0h2V4H9v6zm4 0h2V1h-2v9z" />
                    </svg>
                    <svg className="w-3.5 h-2.5 fill-current" viewBox="0 0 16 12">
                      <path d="M8 2.5a7.5 7.5 0 0 0-5.3 2.2L1.3 3.3A9.5 9.5 0 0 1 8 .5a9.5 9.5 0 0 1 6.7 2.8l-1.4 1.4A7.5 7.5 0 0 0 8 2.5z" />
                      <circle cx="8" cy="10" r="1.5" />
                    </svg>
                    <div className="w-4 h-2.5 border border-slate-300 rounded-[3px] p-0.5 flex items-center">
                      <div className="w-full h-full bg-white rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* App Screen Content */}
                <div className="p-3.5 space-y-3">
                  
                  {/* Header: Logo & Bell */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                        X
                      </div>
                      <span className="font-bold text-sm text-white">RetailX</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300">
                      <Bell size={13} />
                    </div>
                  </div>

                  {/* Greeting */}
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>Good Morning, Trader</span>
                      <span>👋</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Discipline today, Freedom tomorrow.</p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="px-2.5 py-1 rounded-md bg-[#2563EB] text-white font-medium">Watchlist</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">Options</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">Scanners</span>
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300">More</span>
                  </div>

                  {/* 4 Index Cards (NIFTY 50, BANK NIFTY, SENSEX, INDIA VIX) */}
                  <div className="space-y-2">
                    
                    {/* NIFTY 50 */}
                    <div className="bg-[#0A1224] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">NIFTY 50</div>
                        <div className="text-xs font-bold text-white font-mono">25,017.80</div>
                        <span className="text-[9px] text-[#10B981] font-semibold">+182.40 (+0.73%)</span>
                      </div>
                      <svg className="w-16 h-6 text-[#10B981]" viewBox="0 0 50 16" fill="none">
                        <path d="M1 14L10 11L22 12L35 5L49 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* BANK NIFTY */}
                    <div className="bg-[#0A1224] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">BANK NIFTY</div>
                        <div className="text-xs font-bold text-white font-mono">51,230.45</div>
                        <span className="text-[9px] text-[#10B981] font-semibold">+412.30 (+0.81%)</span>
                      </div>
                      <svg className="w-16 h-6 text-[#10B981]" viewBox="0 0 50 16" fill="none">
                        <path d="M1 13L12 10L24 11L36 4L49 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* SENSEX */}
                    <div className="bg-[#0A1224] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">SENSEX</div>
                        <div className="text-xs font-bold text-white font-mono">81,645.12</div>
                        <span className="text-[9px] text-[#10B981] font-semibold">+597.21 (+0.74%)</span>
                      </div>
                      <svg className="w-16 h-6 text-[#10B981]" viewBox="0 0 50 16" fill="none">
                        <path d="M1 14L11 11L25 10L37 6L49 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* INDIA VIX */}
                    <div className="bg-[#0A1224] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">INDIA VIX</div>
                        <div className="text-xs font-bold text-white font-mono">11.42</div>
                        <span className="text-[9px] text-[#EF4444] font-semibold">-0.38 (-3.22%)</span>
                      </div>
                      <svg className="w-16 h-6 text-[#EF4444]" viewBox="0 0 50 16" fill="none">
                        <path d="M1 3L11 5L24 4L36 10L49 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>

                  </div>

                  <p className="text-[9px] text-slate-500 text-center pt-0.5">Sample data for illustration</p>

                  {/* Phone Bottom Dock Navigation */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-around text-[9px] text-slate-400">
                    <div className="flex flex-col items-center gap-0.5">
                      <Cpu size={12} className="text-blue-400" />
                      <span className="text-blue-400 font-semibold">AI</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Laptop size={12} />
                      <span>Paper Trade</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Shield size={12} />
                      <span>Risk Guard</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Target size={12} />
                      <span>Coach</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>

        {/* =======================================================================
            DESKTOP VIEW (MacBook Frame & High-Contrast Typography)
           ======================================================================= */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6 shadow-sm shadow-blue-900/30">
              <span className="text-blue-400">✨</span>
              <span>AI-Powered Market Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
              Smarter Insights. <br />
              <span className="text-[#2563EB]">Better Decisions.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-300 max-w-xl mb-8 leading-relaxed">
              RetailX brings together real-time market data, AI insights, and powerful analysis tools — so you can trade smarter, manage risk, and stay ahead. All in one place.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-10">
              <button
                onClick={onGetStarted}
                className="flex items-center justify-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:translate-y-[-1px] active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={onWatchDemo}
                className="flex items-center justify-center gap-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-500 px-6 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                  <Play size={12} className="ml-0.5 fill-blue-400" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Feature Checkmarks (Desktop) */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-slate-400 pt-2 border-t border-slate-800/60 w-full">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={15} className="text-blue-400 shrink-0" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                <span>Simple & Intuitive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Laptop size={15} className="text-blue-400 shrink-0" />
                <span>Access on All Devices</span>
              </div>
            </div>

          </div>

          {/* Right Column: Realistic MacBook Display */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-[620px]">
              <div className="relative bg-[#0F172A] p-3 rounded-t-2xl rounded-b-md border border-slate-700/80 shadow-2xl shadow-blue-900/25">
                <div className="relative bg-[#070D1B] rounded-lg overflow-hidden border border-slate-800/90 text-left text-white text-xs select-none">
                  <div className="h-4 bg-[#080E1D] flex items-center justify-center border-b border-slate-800/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700/80" />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">X</div>
                        <span className="font-bold text-sm">RetailX Command Center</span>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-mono">Illustrative example</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-[#0A1224] p-2 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">NIFTY 50</div>
                        <div className="text-sm font-bold text-white font-mono">25,017.80</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">+0.73%</div>
                      </div>
                      <div className="bg-[#0A1224] p-2 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">BANK NIFTY</div>
                        <div className="text-sm font-bold text-white font-mono">51,230.45</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">+0.81%</div>
                      </div>
                      <div className="bg-[#0A1224] p-2 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">SENSEX</div>
                        <div className="text-sm font-bold text-white font-mono">81,645.12</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">+0.74%</div>
                      </div>
                      <div className="bg-[#0A1224] p-2 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">INDIA VIX</div>
                        <div className="text-sm font-bold text-white font-mono">11.42</div>
                        <div className="text-[10px] text-rose-400 font-semibold">-3.22%</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center pt-1">Sample data for illustration</p>
                  </div>
                </div>
              </div>
              <div className="relative h-3 bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-b-xl border-t border-slate-600/50 shadow-xl flex items-center justify-center">
                <div className="w-16 h-1 bg-slate-700/80 rounded-full" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          ORGANIC DEEP NAVY CURVED WAVE TRANSITION (Matches screenshot wave)
         ========================================================================= */}
      <div className="relative mt-8 sm:mt-12">
        
        {/* Organic curved background wave SVG */}
        <div className="w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-16 sm:h-24 text-[#070D1B]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C150,90 350,-40 500,60 C650,140 900,20 1200,80 L1200,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* 4 Bottom Feature Icons on the Dark Canvas */}
        <div className="bg-[#070D1B] pt-2 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* 4 Columns matching screenshot icons */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 py-3 text-center">
              
              {/* 1. AI Watchlist */}
              <div className="flex flex-col items-center justify-center p-1 sm:p-2 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#2563EB] mb-1.5 transition-transform group-hover:scale-110">
                  <BarChart3 size={24} className="stroke-[2.2]" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 leading-tight">
                  AI Watchlist
                </span>
              </div>

              {/* 2. Options Intelligence */}
              <div className="flex flex-col items-center justify-center p-1 sm:p-2 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#2563EB] mb-1.5 transition-transform group-hover:scale-110">
                  <ShieldCheck size={24} className="stroke-[2.2]" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 leading-tight">
                  Options <br className="xs:hidden" /> Intelligence
                </span>
              </div>

              {/* 3. Smart Money Activity */}
              <div className="flex flex-col items-center justify-center p-1 sm:p-2 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#2563EB] mb-1.5 transition-transform group-hover:scale-110">
                  <svg className="w-6 h-6 text-[#2563EB] fill-current" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="4" r="2" />
                    <circle cx="12" cy="20" r="2" />
                    <circle cx="4" cy="12" r="2" />
                    <circle cx="20" cy="12" r="2" />
                    <path d="M12 7V9M12 15V17M7 12H9M15 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 leading-tight">
                  Smart Money <br className="xs:hidden" /> Activity
                </span>
              </div>

              {/* 4. Scanners */}
              <div className="flex flex-col items-center justify-center p-1 sm:p-2 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#2563EB] mb-1.5 transition-transform group-hover:scale-110">
                  <svg className="w-6 h-6 text-[#2563EB] stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 leading-tight">
                  Scanners
                </span>
              </div>

            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs pt-3">
              <ChevronDown size={14} className="animate-bounce text-slate-400" />
              <span className="text-slate-400 font-medium">Scroll to explore</span>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
}
