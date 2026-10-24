import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function FiiDiiData({ theme }) {
  const isDark = theme === 'dark';
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchFlows = async () => {
      setLoading(true);
      setError(false);
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/smart-money/flows', { headers });
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setFlows(data);
          } else {
            setFlows([]);
          }
        } else {
          setError(true);
          setFlows([]);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setFlows([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFlows();
    return () => {
      isMounted = false;
    };
  }, []);

  // Summary computations from live flow records
  const latestFlow = flows.length > 0 ? flows[0] : null;
  const latestFiiNet = latestFlow?.fiiNetBuySell ?? null;
  const latestDiiNet = latestFlow?.diiNetBuySell ?? null;
  const latestTotalNet = (latestFiiNet !== null && latestDiiNet !== null)
    ? latestFiiNet + latestDiiNet
    : (latestFiiNet ?? latestDiiNet ?? null);

  const mtdTotal = flows.reduce((sum, f) => {
    const fNet = f.fiiNetBuySell || 0;
    const dNet = f.diiNetBuySell || 0;
    return sum + fNet + dNet;
  }, 0);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            FII / DII Institutional Flows
          </h1>
          <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Daily FII/DII net flows (₹ Crores), from recorded exchange data.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-center ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Loading institutional flow data...
          </p>
        </div>
      )}

      {/* Error or Empty State: Data unavailable */}
      {!loading && (error || flows.length === 0) && (
        <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-center ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <AlertCircle className="w-10 h-10 text-slate-500 mb-3" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Data unavailable
          </h3>
          <p className={`text-xs mt-1 max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No institutional FII/DII flow records are available at this moment.
          </p>
        </div>
      )}

      {/* Live Data Display */}
      {!loading && !error && flows.length > 0 && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                FII Net Flow (Latest)
              </div>
              <div className={`text-2xl font-black font-mono ${latestFiiNet === null ? (isDark ? 'text-slate-300' : 'text-slate-700') : latestFiiNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {latestFiiNet !== null ? `${latestFiiNet >= 0 ? '+' : '-'}₹${Math.abs(latestFiiNet).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr` : '—'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mt-1">
                {latestFiiNet !== null && latestFiiNet >= 0 ? <ArrowUpRight size={13} className="text-emerald-400" /> : <ArrowDownRight size={13} className="text-rose-400" />}
                <span>{latestFiiNet !== null ? (latestFiiNet >= 0 ? 'Net Buyers in Cash' : 'Net Sellers in Cash') : 'Pending Exchange Update'}</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                DII Net Flow (Latest)
              </div>
              <div className={`text-2xl font-black font-mono ${latestDiiNet === null ? (isDark ? 'text-slate-300' : 'text-slate-700') : latestDiiNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {latestDiiNet !== null ? `${latestDiiNet >= 0 ? '+' : '-'}₹${Math.abs(latestDiiNet).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr` : '—'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mt-1">
                {latestDiiNet !== null && latestDiiNet >= 0 ? <ArrowUpRight size={13} className="text-emerald-400" /> : <ArrowDownRight size={13} className="text-rose-400" />}
                <span>{latestDiiNet !== null ? (latestDiiNet >= 0 ? 'Domestic Absorption Flow' : 'Domestic Net Outflow') : 'Pending Exchange Update'}</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Combined Net Inflow
              </div>
              <div className={`text-2xl font-black font-mono ${latestTotalNet === null ? (isDark ? 'text-slate-300' : 'text-slate-700') : latestTotalNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {latestTotalNet !== null ? `${latestTotalNet >= 0 ? '+' : '-'}₹${Math.abs(latestTotalNet).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr` : '—'}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold mt-1">
                {latestTotalNet !== null ? (latestTotalNet >= 0 ? 'Net positive market liquidity' : 'Net negative liquidity pressure') : '—'}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Period Institutional Total
              </div>
              <div className={`text-2xl font-black font-mono ${mtdTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mtdTotal >= 0 ? '+' : '-'}₹{Math.abs(mtdTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
              </div>
              <div className="text-[11px] text-blue-400 font-semibold mt-1">
                {flows.length} Recorded Sessions
              </div>
            </div>
          </div>

          {/* Main Table: Daily History */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60 mb-4">
              <Building2 size={18} className="text-blue-500" />
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Daily Cash Market Activity
              </h3>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">FII Net (₹ Cr)</th>
                    <th className="pb-3 font-semibold text-right">DII Net (₹ Cr)</th>
                    <th className="pb-3 font-semibold text-right">Total Net (₹ Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {flows.map((row) => {
                    const fNet = row.fiiNetBuySell ?? null;
                    const dNet = row.diiNetBuySell ?? null;
                    const netCombined = (fNet !== null && dNet !== null)
                      ? fNet + dNet
                      : (fNet ?? dNet ?? null);

                    return (
                      <tr key={row.id || row.date} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                        <td className={`py-3.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.date}</td>
                        <td className={`py-3.5 text-right font-mono font-bold ${fNet === null ? 'text-slate-400' : fNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {fNet !== null ? (fNet >= 0 ? `+${fNet.toFixed(2)}` : fNet.toFixed(2)) : '—'}
                        </td>
                        <td className={`py-3.5 text-right font-mono font-bold ${dNet === null ? 'text-slate-400' : dNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {dNet !== null ? (dNet >= 0 ? `+${dNet.toFixed(2)}` : dNet.toFixed(2)) : '—'}
                        </td>
                        <td className="py-3.5 text-right">
                          {netCombined !== null ? (
                            <span className={`font-mono font-black px-2 py-0.5 rounded ${
                              netCombined >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {netCombined >= 0 ? `+${netCombined.toFixed(2)}` : netCombined.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
