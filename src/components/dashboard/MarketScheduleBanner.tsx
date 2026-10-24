import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  day: string;
}

const NSE_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-26', name: 'Republic Day', day: 'Monday' },
  { date: '2026-03-03', name: 'Holi', day: 'Tuesday' },
  { date: '2026-03-20', name: 'Id-Ul-Fitr (Ramzan Id)', day: 'Friday' },
  { date: '2026-03-27', name: 'Shri Ram Navami', day: 'Friday' },
  { date: '2026-04-03', name: 'Good Friday', day: 'Friday' },
  { date: '2026-04-14', name: 'Dr. Baba Saheb Ambedkar Jayanti', day: 'Tuesday' },
  { date: '2026-05-01', name: 'Maharashtra Day', day: 'Friday' },
  { date: '2026-05-27', name: 'Bakri Id / Eid ul-Adha', day: 'Wednesday' },
  { date: '2026-08-15', name: 'Independence Day', day: 'Saturday' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', day: 'Friday' },
  { date: '2026-10-20', name: 'Dussehra', day: 'Tuesday' },
  { date: '2026-11-08', name: 'Diwali Laxmi Pujan (Muhurat Trading)', day: 'Sunday' },
  { date: '2026-11-10', name: 'Diwali Balipratipada', day: 'Tuesday' },
  { date: '2026-11-24', name: 'Gurunanak Jayanti', day: 'Tuesday' },
  { date: '2026-12-25', name: 'Christmas', day: 'Friday' }
];

export default function MarketScheduleBanner({ isDark }: { isDark: boolean }) {
  const [countdownText, setCountdownText] = useState('');
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false);
  const [nextEventDescription, setNextEventDescription] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const now = new Date();
        const istParts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          weekday: 'short',
          hour12: false
        }).formatToParts(now);

        const year = parseInt(istParts.find(p => p.type === 'year')?.value || '2026', 10);
        const month = parseInt(istParts.find(p => p.type === 'month')?.value || '1', 10);
        const day = parseInt(istParts.find(p => p.type === 'day')?.value || '1', 10);
        const hour = parseInt(istParts.find(p => p.type === 'hour')?.value || '0', 10);
        const minute = parseInt(istParts.find(p => p.type === 'minute')?.value || '0', 10);
        const second = parseInt(istParts.find(p => p.type === 'second')?.value || '0', 10);
        const weekday = istParts.find(p => p.type === 'weekday')?.value || '';

        const totalMinutes = hour * 60 + minute;
        const isWeekend = weekday === 'Sat' || weekday === 'Sun';

        // Check if today is an official NSE holiday
        const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const holidayToday = NSE_HOLIDAYS_2026.find(h => h.date === todayStr);

        const isOpen = !isWeekend && !holidayToday && (totalMinutes >= 555 && totalMinutes <= 930);
        setIsCurrentlyOpen(isOpen);

        if (isOpen) {
          // Time until close at 15:30 IST
          const closeMin = 15 * 60 + 30;
          const diffSec = (closeMin - totalMinutes) * 60 - second;
          const h = Math.floor(diffSec / 3600);
          const m = Math.floor((diffSec % 3600) / 60);
          const s = diffSec % 60;
          setCountdownText(`${h}h ${m}m ${s}s to Market Close`);
          setNextEventDescription('Regular NSE Equity & F&O Session actively trading.');
        } else {
          // Time until next open at 09:15 IST
          let daysAhead = 1;
          if (weekday === 'Fri' && totalMinutes > 930) daysAhead = 3;
          else if (weekday === 'Sat') daysAhead = 2;
          else if (weekday === 'Sun') daysAhead = 1;
          else if (totalMinutes < 555) daysAhead = 0;

          const openMin = 9 * 60 + 15;
          let diffSec = 0;
          if (daysAhead === 0) {
            diffSec = (openMin - totalMinutes) * 60 - second;
          } else {
            diffSec = ((24 * 60 - totalMinutes) + (daysAhead - 1) * 24 * 60 + openMin) * 60 - second;
          }

          const h = Math.floor(diffSec / 3600);
          const m = Math.floor((diffSec % 3600) / 60);
          const s = diffSec % 60;

          if (holidayToday) {
            setCountdownText(`Trading Holiday: ${holidayToday.name}`);
            setNextEventDescription(`NSE/BSE exchange closed today in observance of ${holidayToday.name}.`);
          } else if (isWeekend) {
            setCountdownText(`Opens in ${h}h ${m}m (Monday 09:15 AM IST)`);
            setNextEventDescription('Weekend exchange break. Simulation & Journaling enabled.');
          } else {
            setCountdownText(`Opens in ${h}h ${m}m (09:15 AM IST)`);
            setNextEventDescription('Pre-market & off-hours practice mode active.');
          }
        }
      } catch (err) {
        setCountdownText('Next session: 09:15 AM IST');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
      isCurrentlyOpen
        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
        : (isDark ? 'bg-[#0B0F17] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm')
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${
          isCurrentlyOpen 
            ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
            : (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')
        }`}>
          {isCurrentlyOpen ? <Clock size={18} className="animate-pulse" /> : <Calendar size={18} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider">
              {isCurrentlyOpen ? 'NSE Live Session' : 'Exchange Hours Intelligence'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCurrentlyOpen 
                ? 'bg-emerald-500 text-white' 
                : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
            }`}>
              {isCurrentlyOpen ? 'Live Open' : 'Off-Hours'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {nextEventDescription}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono font-bold text-xs self-end sm:self-auto">
        <span className={`px-3 py-1.5 rounded-xl border ${
          isCurrentlyOpen
            ? (isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800')
            : (isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800')
        }`}>
          {countdownText}
        </span>
      </div>
    </div>
  );
}
