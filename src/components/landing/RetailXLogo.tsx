import React from 'react';

interface RetailXLogoProps {
  className?: string;
  showTagline?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  size?: 'sm' | 'md' | 'lg';
}

export default function RetailXLogo({
  className = '',
  showTagline = false,
  theme = 'dark',
  size = 'md'
}: RetailXLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const isLight = theme === 'light';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Stylized Modern X Emblem matching the screenshot */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Left-leaning diagonal segment with rounded pill ends */}
          <rect
            x="4"
            y="7"
            width="8.5"
            height="30"
            rx="4.25"
            transform="rotate(-45 4 7)"
            fill="#2563EB"
          />
          {/* Right-leaning diagonal segment with rounded pill ends */}
          <rect
            x="25.5"
            y="7"
            width="8.5"
            height="30"
            rx="4.25"
            transform="rotate(45 25.5 7)"
            fill="#3B82F6"
          />
          {/* Center intersecting notch */}
          <circle cx="18" cy="18" r="3" fill="#1D4ED8" />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <span 
          className={`font-extrabold tracking-tight leading-none ${textSizes[size]} ${
            isLight ? 'text-[#0F172A]' : 'text-white'
          }`}
        >
          Retail<span className="text-[#2563EB]">X</span>
        </span>
        {showTagline && (
          <span 
            className={`text-[10px] tracking-normal font-normal mt-0.5 leading-tight ${
              isLight ? 'text-[#64748B]' : 'text-slate-400'
            }`}
          >
            Trade Smarter. Live Better.
          </span>
        )}
      </div>
    </div>
  );
}
