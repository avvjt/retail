import React from 'react';
import { GitCommit, Star, ArrowUpCircle, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function Changelog({ theme }) {
  const updates = [
    {
      version: "v1.6.0",
      date: "Sep 2, 2026",
      icon: <Star className="w-5 h-5 text-amber-500" />,
      changes: [
        "Major Architecture Shift: Migrated Documentation and Changelog to public-facing standalone top-level routes, making them visible to prospective users without logging in.",
        "Admin Panel Optimization: Dynamic waitlist viewer that strictly type-checks array transformations to prevent render crashes.",
        "Rich Media Bug Reporting: Users can now attach videos and images (up to 50MB) straight into the support system. Files are serialized and managed by the main PostgreSQL schema.",
        "Express Server Stability: Resolved an Express.js JSON payload limit exception when submitting large base64 attachments."
      ]
    },
    {
      version: "v1.5.0",
      date: "Sep 1, 2026",
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      changes: [
        "Robust Fallback Architecture: Re-engineered the Blueminds API hook. If GPT-5.5 fails, traffic reroutes silently to Claude Sonnet, and then to Gemini Flash, preventing scanner downtime.",
        "Implemented Advanced Rate Limiting across all backend endpoints to prevent systemic abuse of our AI modules.",
        "Created fully detailed interactive Documentation and Changelog interfaces replacing legacy generic community tabs.",
        "Enhanced Theme System: Dark mode palettes now map perfectly to Tailwind utility classes, resolving the 'white flash' during initial SPA load."
      ]
    },
    {
      version: "v1.4.2",
      date: "Aug 29, 2026",
      icon: <ArrowUpCircle className="w-5 h-5 text-emerald-500" />,
      changes: [
        "Introduced the Visual Algo Builder. You can now drag and drop logic blocks without writing code.",
        "Integrated live Yahoo Finance Option Chain querying with dynamic strike resolution.",
        "Upgraded the UI theme rendering engine for perfect contrasts in 'Calm Twilight' mode.",
        "Added advanced volume threshold filters into the Smart Money Activity radar."
      ]
    },
    {
      version: "v1.4.0",
      date: "Aug 22, 2026",
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      changes: [
        "Deployed core Behavioral Coach metrics module. The platform now tracks risk-taking behaviors and alerts users on emotional deviations.",
        "Introduced the 'Risk Settings' Kill Switch that forcibly pauses trading when maximum daily drawdowns are breached.",
        "First production deployment of the real-time Paper Trading Simulator.",
        "Fixed mobile responsiveness across the Options and Heatmap components."
      ]
    },
    {
      version: "v1.3.0",
      date: "Aug 15, 2026",
      icon: <Activity className="w-5 h-5 text-cyan-500" />,
      changes: [
        "Initial MVP deployment of RetailX Core Systems.",
        "Added User Authentication flows, Brokerage connections (via simulated OAuth), and Dashboard layouts.",
        "Configured initial database schemas via Drizzle ORM and established Cloud SQL persistence."
      ]
    }
  ];

  return (
    <div className={`w-full p-6 h-full overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col items-center justify-center mb-12 max-w-4xl mx-auto text-center pt-8">
        <GitCommit className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h1 className="text-4xl font-bold font-mono mb-2">Changelog & Updates</h1>
        <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mt-4 leading-relaxed`}>
          Track the evolution of the platform. We ship updates constantly to bring you the best quantitative toolkit on the market.
        </p>
      </div>

      <div className="max-w-4xl mx-auto relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent pb-20">
        {updates.map((update, idx) => (
          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${theme === 'dark' ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'}`}>
              {update.icon}
            </div>
            
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl shadow-md transition-all ${theme === 'dark' ? 'bg-[#111] border border-white/10 hover:border-white/20' : 'bg-white border border-gray-100 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-blue-500 font-mono">{update.version}</h3>
                <time className={`text-xs font-medium font-mono px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{update.date}</time>
              </div>
              <ul className="space-y-3">
                {update.changes.map((change, i) => (
                  <li key={i} className={`flex text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
