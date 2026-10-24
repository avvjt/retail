import React from 'react';

export default function RetailXLogo({ 
  collapsed = false, 
  isDark = true, 
  size = "md", 
  showTagline = true,
  className = "" 
}) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 40 : 34;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Stylized Electric Blue X Brand Mark */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-md shadow-blue-500/20"
        style={{ width: iconSize, height: iconSize }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9]" />
        
        {/* Geometric intersecting X lines */}
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 drop-shadow-sm"
        >
          {/* Back diagonal stroke */}
          <path 
            d="M9 31L31 9" 
            stroke="white" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Front diagonal stroke with cyan glow accent */}
          <path 
            d="M31 31L9 9" 
            stroke="#e0f2fe" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Center glowing focal point */}
          <circle cx="20" cy="20" r="2.5" fill="#38bdf8" />
        </svg>
      </div>

      {/* Typography */}
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Retail<span className="text-[#38bdf8]">X</span>
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium tracking-wide text-slate-400">
              Trade Smarter. Live Better.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
