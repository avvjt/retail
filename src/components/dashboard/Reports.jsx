import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  CheckCircle, 
  Filter, 
  Sparkles, 
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function Reports({ theme }) {
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState('all');
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const reportsList = [
    {
      id: 'rep-01',
      title: 'Daily Market Intelligence Briefing',
      date: '12 Sep 2024',
      type: 'market-brief',
      category: 'Daily',
      size: '2.4 MB',
      description: 'Pre-market analysis, key support/resistance levels, FII/DII positioning, and top breakout setups.'
    },
    {
      id: 'rep-02',
      title: 'Weekly Institutional Radar & Derivative Flow Report',
      date: '08 Sep 2024',
      type: 'institutional',
      category: 'Weekly',
      size: '5.1 MB',
      description: 'Comprehensive analysis of FII index futures long-short ratio, sector-wise net flow, and options open interest heatmaps.'
    },
    {
      id: 'rep-03',
      title: 'RetailX Behavioral Discipline & Performance Audit',
      date: '01 Sep 2024',
      type: 'performance',
      category: 'Monthly',
      size: '3.8 MB',
      description: 'AI-generated post-trade review, win rate by session timing, emotional deviation analysis, and profit factor audit.'
    },
    {
      id: 'rep-04',
      title: 'NIFTY & BANK NIFTY Monthly Expiry Wrap-up',
      date: '29 Aug 2024',
      type: 'derivatives',
      category: 'Expiry',
      size: '4.2 MB',
      description: 'Rollover analysis, max pain shifts, strike volume spikes, and smart money positioning leading into the next month.'
    },
    {
      id: 'rep-05',
      title: 'Annual Capital Gains & Tax P&L Statement (FY 2023-24)',
      date: '15 Jul 2024',
      type: 'tax',
      category: 'Tax',
      size: '1.2 MB',
      description: 'Consolidated short-term, long-term capital gains, speculative intraday profit/loss breakdown for income tax filing.'
    }
  ];

  const handleDownload = (report) => {
    setDownloadSuccess(report.id);
    // Create a mock client-side download text blob
    const element = document.createElement("a");
    const file = new Blob([`RetailX Report: ${report.title}\nDate: ${report.date}\nCategory: ${report.category}\n\n${report.description}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${report.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3000);
  };

  const filteredReports = reportsList.filter(rep => {
    if (filterType === 'all') return true;
    return rep.type === filterType;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Intelligence & Audit Reports
          </h1>
          <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Download official institutional briefings, AI performance audits, and verified tax reports.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Reports' },
          { id: 'market-brief', label: 'Daily Briefs' },
          { id: 'institutional', label: 'Institutional Flows' },
          { id: 'performance', label: 'AI Performance Audits' },
          { id: 'tax', label: 'Tax & Compliance' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : (isDark ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark 
                ? 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700' 
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 uppercase tracking-wider">
                    {report.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {report.date}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    • {report.size}
                  </span>
                </div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {report.title}
                </h3>
                <p className={`text-xs mt-1 leading-relaxed max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {report.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                onClick={() => handleDownload(report)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  downloadSuccess === report.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                }`}
              >
                {downloadSuccess === report.id ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
