import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Zap, 
  Filter, 
  ArrowUpRight, 
  Building2, 
  Activity, 
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function SmartMoneySignals({ theme }) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [deals, setDeals] = useState([]);
  const [flows, setFlows] = useState([]);
  const [volumeSpikes, setVolumeSpikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSmartMoneyData = async () => {
      setLoading(true);
      setError(false);
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [dealsRes, flowsRes, spikesRes] = await Promise.all([
          fetch('/api/smart-money/deals', { headers }).catch(() => null),
          fetch('/api/smart-money/flows', { headers }).catch(() => null),
          fetch('/api/smart-money/volume-spikes', { headers }).catch(() => null)
        ]);

        if (!isMounted) return;

        let dealsData = [];
        let flowsData = [];
        let spikesData = [];

        if (dealsRes && dealsRes.ok) {
          dealsData = await dealsRes.json();
        }
        if (flowsRes && flowsRes.ok) {
          flowsData = await flowsRes.json();
        }
        if (spikesRes && spikesRes.ok) {
          spikesData = await spikesRes.json();
        }

        setDeals(Array.isArray(dealsData) ? dealsData : []);
        setFlows(Array.isArray(flowsData) ? flowsData : []);
        setVolumeSpikes(Array.isArray(spikesData) ? spikesData : []);
      } catch (err) {
        console.error("Failed to fetch smart money data:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSmartMoneyData();
    return () => { isMounted = false; };
  }, []);

  const filteredActivities = deals.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'positive') return s.isPositive;
    if (activeTab === 'negative') return !s.isPositive;
    return true;
  });

  // Calculate dynamic KPIs from real data or show unavailable
  const latestFlow = flows.length > 0 ? flows[0] : null;
  const fiiRatioDisplay = (latestFlow && latestFlow.fiiNetBuySell !== null)
    ? `₹${latestFlow.fiiNetBuySell > 0 ? '+' : ''}${latestFlow.fiiNetBuySell} Cr`
    : "Data unavailable";

  const totalBlockVal = deals.reduce((acc, d) => {
    const val = parseFloat((d.totalVal || "").replace(/[^0-9.]/g, ''));
    return !isNaN(val) ? acc + val : acc;
  }, 0);

  const blockValDisplay = totalBlockVal > 0 ? `₹${totalBlockVal.toFixed(1)} Cr` : (deals.length > 0 ? "—" : "Data unavailable");
  const spikesDisplay = volumeSpikes.length > 0 ? `${volumeSpikes.length} Stocks` : "Data unavailable";
  const flowBiasDisplay = latestFlow
    ? ((latestFlow.fiiNetBuySell || 0) + (latestFlow.diiNetBuySell || 0) >= 0 ? "Positive Inflow" : "Negative Inflow")
    : "Data unavailable";

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Smart Money Activity
          </h1>
          <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Institutional Block Deals, Bulk Deals, and real-time delivery activity in Indian equities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'positive', 'negative'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : (isDark ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }`}
            >
              {tab === 'all' ? 'All Activity' : tab === 'positive' ? 'Positive Momentum' : 'Negative Momentum'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Block Value Today
          </div>
          <div className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {blockValDisplay}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">
            Exchange Reported Transactions
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            FII Net Buy/Sell
          </div>
          <div className={`text-2xl font-black font-mono ${latestFlow?.fiiNetBuySell > 0 ? 'text-emerald-500' : latestFlow?.fiiNetBuySell < 0 ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
            {fiiRatioDisplay}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">
            Institutional Capital Flow
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Delivery Spikes Detected
          </div>
          <div className="text-2xl font-black font-mono text-blue-500">
            {spikesDisplay}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">
            Real-time Volume Radar
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Institutional Flow Bias
          </div>
          <div className={`text-2xl font-black ${flowBiasDisplay.includes('Positive') ? 'text-emerald-500' : flowBiasDisplay.includes('Negative') ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
            {flowBiasDisplay}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">
            Combined FII + DII Net
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {loading ? (
        <div className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center gap-3 ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs font-medium">Fetching real institutional activity...</span>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center gap-3 ${
          isDark ? 'bg-[#0B0F17] border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <AlertCircle className="w-8 h-8 text-slate-500" />
          <div className="text-sm font-bold">Data unavailable</div>
          <p className="text-xs max-w-sm">No live institutional bulk/block deals recorded for this filter in the current market session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/60 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm ${
                    activity.isPositive 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {activity.isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {activity.symbol}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                        {activity.type}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        activity.conviction === 'Very High' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {activity.conviction} Conviction
                      </span>
                    </div>
                    <div className={`text-xs font-semibold mt-0.5 ${activity.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {activity.action}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activity.totalVal}
                  </div>
                  <div className="text-xs text-slate-400">
                    {activity.shares} shares @ {activity.price} ({activity.time})
                  </div>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {activity.rationale}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800/40 text-xs">
                <div>
                  <span className="text-slate-400">Acquiring Entity: </span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{activity.participantA}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Counterparty: </span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{activity.participantB}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
