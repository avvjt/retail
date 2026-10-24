import React, { useState } from 'react';
import { X, Play, Shield, BarChart2, Bot, ArrowRight } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export default function DemoModal({ isOpen, onClose, onGetStarted }: DemoModalProps) {
  const [activeTab, setActiveTab] = useState<'copilot' | 'risk' | 'options'>('copilot');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#0A1628] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#070D1B] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              X
            </div>
            <div>
              <h3 className="font-bold text-base text-white">RetailX Interactive Product Tour</h3>
              <p className="text-xs text-slate-400">See how AI behavioral guardrails and live market tools work</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#080E1D] px-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'copilot'
                ? 'border-[#2563EB] text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot size={16} />
            <span>Alpha Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'risk'
                ? 'border-[#2563EB] text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={16} />
            <span>AI Risk Guard</span>
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'options'
                ? 'border-[#2563EB] text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 size={16} />
            <span>Options Intelligence</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'copilot' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs font-semibold text-blue-400 mb-1">Live Multi-Factor Scanner</div>
                <div className="text-sm font-bold text-white mb-2">
                  "Find institutional breakout setups in NIFTY 50"
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 font-mono bg-black/40 p-3 rounded-xl border border-slate-800">
                  <div className="text-emerald-400 font-bold">✓ 3 Setups Identified (Confidence 89%)</div>
                  <div>• RELIANCE: VWAP crossover + 2.4x Volume</div>
                  <div>• HDFCBANK: 52W Consolidation breakout with DII inflow</div>
                  <div>• TCS: Positive Momentum Call Open Interest buildup at 4,100 strike</div>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Alpha Copilot connects to NSE order books in real-time, executing pattern recognition and volume-spread analysis in under 50 milliseconds.
              </p>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-400">Behavioral Lockout System</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  Revenge Trade Interceptor
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Detected: 2 consecutive losses in 15 minutes. High emotional adrenaline state detected.
                </p>
                <div className="bg-rose-950/40 border border-rose-900/60 p-3 rounded-xl text-xs text-rose-300">
                  ⚠️ <span className="font-bold">Intervention Triggered:</span> 15-minute cooling off period enforced. Buy order buttons temporarily locked to safeguard capital.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs font-semibold text-blue-400 mb-1">Option Chain Greeks & Heatmap</div>
                <div className="text-sm font-bold text-white mb-2">
                  NIFTY Current Expiry Analysis
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Max Pain</div>
                    <div className="font-bold text-white text-sm">25,000</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">PCR (Volume)</div>
                    <div className="font-bold text-emerald-400 text-sm">1.18</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">IV Percentile</div>
                    <div className="font-bold text-amber-400 text-sm">18.4%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#070D1B] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Ready to test with zero financial risk?
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg border border-slate-700"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onGetStarted();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-md"
            >
              <span>Get Started Free</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
