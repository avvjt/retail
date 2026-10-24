import React from 'react';
import RetailXLogo from './RetailXLogo';

export default function LandingFooter() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#070D1B] border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Left: Brand Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <RetailXLogo showTagline={true} size="md" />
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Empowering Indian retail traders with AI market intelligence, disciplined risk management, and institutional data.
            </p>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-white transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-white transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('copilot-preview')}
              className="hover:text-white transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('blog')}
              className="hover:text-white transition-colors"
            >
              Blog
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-white transition-colors"
            >
              Support
            </button>
          </nav>

          {/* Right: Social Media Icons */}
          <div className="flex items-center gap-4 text-slate-400">
            {/* X / Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X Twitter"
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.4 1.4 0 1 0-1.4-1.4c0 .77.63 1.4 1.4 1.4m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>
          </div>

        </div>

        {/* Bottom Disclaimer and Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2024 RetailX. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('RetailX Privacy Policy: All trading telemetry is stored with bank-grade encryption.'); }} className="hover:text-slate-400">
              Privacy Policy
            </a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); alert('RetailX Terms: Paper trading accounts simulate real-time market order-books without financial liability.'); }} className="hover:text-slate-400">
              Terms of Service
            </a>
            <a href="#disclaimer" onClick={(e) => { e.preventDefault(); alert('Disclaimer: RetailX is a technology analytics platform and does not provide SEBI-registered investment advice.'); }} className="hover:text-slate-400">
              Regulatory Disclosures
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
