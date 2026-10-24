import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, Award } from 'lucide-react';

interface Trade {
  id: string | number;
  tradeTime?: string;
  createdAt: string;
  pnl: string | number;
  instrument: string;
  emotion?: string;
  notes?: string;
}

interface Props {
  trades: Trade[];
  isDark: boolean;
}

export default function PnlHeatmapCalendar({ trades, isDark }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group trades by date string YYYY-MM-DD
  const tradesByDate = React.useMemo(() => {
    const map: Record<string, { count: number; netPnl: number; winCount: number }> = {};
    for (const t of trades) {
      const d = new Date(t.tradeTime || t.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const pnlNum = parseFloat(String(t.pnl)) || 0;
      if (!map[key]) {
        map[key] = { count: 0, netPnl: 0, winCount: 0 };
      }
      map[key].count += 1;
      map[key].netPnl += pnlNum;
      if (pnlNum > 0) map[key].winCount += 1;
    }
    return map;
  }, [trades]);

  // Calendar matrix calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Month aggregations
  let monthTotalPnl = 0;
  let monthGreenDays = 0;
  let monthRedDays = 0;
  let monthTotalTrades = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = tradesByDate[key];
    if (entry && entry.count > 0) {
      monthTotalPnl += entry.netPnl;
      monthTotalTrades += entry.count;
      if (entry.netPnl > 0) monthGreenDays++;
      else if (entry.netPnl < 0) monthRedDays++;
    }
  }

  // Calculate clean discipline streak (consecutive trading days with no FOMO / Revenge)
  const disciplineStreak = React.useMemo(() => {
    const sortedDays = Object.keys(tradesByDate).sort().reverse();
    let streak = 0;
    for (const dStr of sortedDays) {
      const dayTrades = trades.filter(t => {
        const d = new Date(t.tradeTime || t.createdAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return k === dStr;
      });
      const hasTilt = dayTrades.some(t => {
        const notes = (t.notes || '').toLowerCase();
        const emotion = (t.emotion || '').toLowerCase();
        return notes.includes('fomo') || notes.includes('revenge') || emotion.includes('fomo') || emotion.includes('revenge');
      });
      if (hasTilt) break;
      streak++;
    }
    return streak;
  }, [trades, tradesByDate]);

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-md'
    }`}>
      {/* Top Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-500/10 mb-5">
        <div>
          <h3 className={`text-md font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <CalendarIcon className="text-emerald-500 h-5 w-5" />
            P&L Calendar & Behavioral Heatmap
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Verified day-by-day realized trading performance & discipline tracking.
          </p>
        </div>

        {/* Quick Month Metrics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono font-bold">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            <Award size={14} className="text-amber-400" />
            <span className="font-sans font-normal text-gray-400">Discipline Streak:</span>
            <span className="text-amber-400">{disciplineStreak} days</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            monthTotalPnl >= 0 
              ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
              : (isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700')
          }`}>
            {monthTotalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-sans font-normal text-gray-400">Month Net:</span>
            <span>
              {monthTotalPnl >= 0 ? '+' : ''}₹{monthTotalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Month Selector Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className={`p-1.5 rounded-lg border transition-all ${
                isDark ? 'border-white/10 hover:bg-white/10 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-sans font-bold text-xs">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className={`p-1.5 rounded-lg border transition-all ${
                isDark ? 'border-white/10 hover:bg-white/10 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading blanks */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[64px] sm:min-h-[72px] rounded-xl opacity-0" />
        ))}

        {/* Days in current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry = tradesByDate[key];
          const hasTrades = entry && entry.count > 0;
          const isGreen = hasTrades && entry.netPnl > 0;
          const isRed = hasTrades && entry.netPnl < 0;
          const isBreakeven = hasTrades && entry.netPnl === 0;

          // Today indicator
          const today = new Date();
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

          return (
            <div
              key={`day-${day}`}
              className={`min-h-[64px] sm:min-h-[72px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                isToday ? 'ring-2 ring-blue-500' : ''
              } ${
                isGreen
                  ? (isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300')
                  : isRed
                    ? (isDark ? 'bg-rose-500/15 border-rose-500/30' : 'bg-rose-50 border-rose-300')
                    : isBreakeven
                      ? (isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')
                      : (isDark ? 'bg-white/[0.02] border-white/5 text-gray-600' : 'bg-gray-50/70 border-gray-100 text-gray-400')
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${
                  hasTrades 
                    ? (isDark ? 'text-white' : 'text-gray-900') 
                    : (isDark ? 'text-gray-500' : 'text-gray-400')
                }`}>
                  {day}
                </span>
                {hasTrades && (
                  <span className="text-[10px] font-bold text-gray-400">
                    {entry.count} trade{entry.count > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {hasTrades ? (
                <div className="mt-1">
                  <div className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                    isGreen ? 'text-emerald-500' : isRed ? 'text-rose-500' : 'text-amber-500'
                  }`}>
                    {entry.netPnl >= 0 ? '+' : ''}₹{entry.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {Math.round((entry.winCount / entry.count) * 100)}% Win
                  </div>
                </div>
              ) : (
                <div className="text-[10px] opacity-20 text-center select-none">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
