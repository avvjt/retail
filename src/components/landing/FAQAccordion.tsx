import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is RetailX free to use?',
      a: 'Yes! RetailX offers a permanently free tier with access to core market tracking, paper trading with ₹10,00,000 in virtual funds, standard scanners, and basic AI watchlists. You can upgrade to Pro anytime for unlimited AI insights.'
    },
    {
      q: 'Do I need a credit card to sign up?',
      a: 'No credit card is required. You can sign in with your email or one-click Google Sign-In and immediately start exploring the platform.'
    },
    {
      q: 'Is my data and trading activity secure?',
      a: 'Absolutely. We utilize 256-bit AES encryption at rest and TLS 1.3 in transit. We never sell your personal trading information or order book history to third parties or market makers.'
    },
    {
      q: 'What markets does RetailX currently support?',
      a: 'RetailX specializes in Indian financial markets, providing comprehensive coverage for NSE and BSE equities, F&O derivatives (NIFTY, BANK NIFTY, FINNIFTY), and sectoral indices with sub-second real-time quotes.'
    },
    {
      q: 'How does the AI Behavioral Risk Guard work?',
      a: 'The Risk Guard continuously monitors your order flow velocity, position sizing, and loss frequency. When it detects patterns matching emotional revenge trading or tilt, it intervenes with customizable cooling-off periods and visual friction.'
    },
    {
      q: 'Can I use RetailX on multiple devices?',
      a: 'Yes, RetailX runs seamlessly in modern desktop web browsers as well as iOS and Android companion apps with real-time session synchronization.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle size={13} />
            <span>COMMON QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Got Questions? We've Got Answers.
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Everything you need to know about getting started with RetailX.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-slate-900 hover:text-[#2563EB] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-50 text-[#2563EB]' : ''
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
