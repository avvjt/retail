import React from 'react';
import { Shield, Sparkles, Clock } from 'lucide-react';

export default function BrokerConnect({ theme }) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 transition-colors duration-300 ${isDark ? 'bg-transparent text-gray-100' : 'bg-transparent text-gray-800'}`}>
      
      {/* Ambient Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl text-center relative z-10">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-6 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 backdrop-blur-sm animate-pulse">
          <Sparkles size={13} className="text-indigo-400" />
          <span>BROKER INTEGRATION</span>
        </div>

        {/* Title */}
        <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Direct Broker Access <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Coming Soon
          </span>
        </h1>

        {/* Description */}
        <p className={`text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          We are currently undergoing advanced sandbox auditing, regulatory compliance reviews, and end-to-end security validation to ensure a safe, high-frequency live-trading pipeline.
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
          
          <div className={`p-5 rounded-2xl border backdrop-blur-sm ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-white/60 border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Shield size={18} />
              </div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Zero-Knowledge Security</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your broker API secrets, private keys, and login passwords will be protected using multi-layered AES-256 local key store masking.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border backdrop-blur-sm ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-white/60 border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Clock size={18} />
              </div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Zero-Latency Engine</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Optimized low-overhead websocket listeners built to process order routing, price ticks, and stream trade events instantly.
            </p>
          </div>

        </div>

        {/* Status Tracker */}
        <div className={`p-4 rounded-xl border inline-flex items-center gap-3 text-xs font-semibold ${isDark ? 'bg-gray-900/20 border-gray-800/80' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Sandbox Testing & Compliance Phase Active
          </span>
        </div>

      </div>
    </div>
  );
}
