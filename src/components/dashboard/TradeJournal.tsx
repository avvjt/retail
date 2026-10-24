import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PnlHeatmapCalendar from './PnlHeatmapCalendar';
import { 
  Plus, 
  Smile, 
  Frown, 
  AlertCircle, 
  Crosshair, 
  BookOpen, 
  Activity, 
  Trash2, 
  Loader2, 
  Upload, 
  Clock, 
  Image as ImageIcon,
  CheckCircle,
  Eye,
  X,
  Download,
  FileSpreadsheet
} from 'lucide-react';

const EMOTION_CONFIG = {
  'Calm': { icon: Smile, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  'Anxious': { icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  'FOMO': { icon: Crosshair, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  'Revenge Trading': { icon: Frown, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
};

function getLocalNowString() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function TradeJournal({ theme }: { theme?: string }) {
  const isDark = theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Controlled Form States
  const [instrument, setInstrument] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [emotion, setEmotion] = useState('Calm');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [tradeTime, setTradeTime] = useState(getLocalNowString());
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Tag Parsing Helpers
  const parseTags = (noteText?: string): string[] => {
    if (!noteText) return [];
    const match = noteText.match(/Tags:\s+(.*)/);
    if (match && match[1]) {
      return match[1].split(' ').map((t: string) => t.replace('#', '').trim()).filter(Boolean);
    }
    return [];
  };

  const cleanNotes = (noteText?: string): string => {
    if (!noteText) return '';
    return noteText.split('Tags:')[0].trim();
  };

  // Drag and Drop & Image Upload states
  const [dragActive, setDragActive] = useState(false);
  const [analyzingScreenshot, setAnalyzingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState('');
  const [screenshotSuccess, setScreenshotSuccess] = useState('');
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);

  // Lightbox view state
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch Trades on Load
  const fetchTrades = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session missing. Please sign back in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrades(data.trades || []);
      } else {
        setError(data.error || 'Failed to retrieve trade journal.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to fintech server lost. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // Compute stats dynamically in JS
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.tradeTime || a.createdAt).getTime();
    const timeB = new Date(b.tradeTime || b.createdAt).getTime();
    return timeB - timeA;
  });

  const weeklyPnl = sortedTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
  const totalTradesCount = sortedTrades.length;
  const calmTradesCount = sortedTrades.filter(t => t.emotion === 'Calm').length;
  const disciplineScore = totalTradesCount > 0 ? Math.round((calmTradesCount / totalTradesCount) * 100) : 100;

  // Psychological triggers counts
  const fomoTradesCount = sortedTrades.filter(t => t.notes && t.notes.includes('#fomo')).length;
  const revengeTradesCount = sortedTrades.filter(t => t.notes && t.notes.includes('#revenge-trade')).length;
  const setupTradesCount = sortedTrades.filter(t => t.notes && t.notes.includes('#good-setup')).length;

  // File processing and Gemini Parsing call
  const processImageFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Unsupported format. Please select an image file.');
      return;
    }

    setAnalyzingScreenshot(true);
    setScreenshotError('');
    setScreenshotSuccess('');

    // Previews local image instantly
    const localReader = new FileReader();
    localReader.onloadend = () => {
      setLocalImagePreview(typeof localReader.result === 'string' ? localReader.result : null);
    };
    localReader.readAsDataURL(file);

    // Call server endpoint to analyze
    const backendReader = new FileReader();
    backendReader.onloadend = async () => {
      const base64String = backendReader.result;
      const token = localStorage.getItem('token');

      try {
        const res = await fetch('/api/trades/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64String })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          // Pre-populate response metrics
          if (data.analysis.instrument) setInstrument(data.analysis.instrument.toUpperCase());
          if (data.analysis.entryPrice) setEntryPrice(data.analysis.entryPrice);
          if (data.analysis.exitPrice) setExitPrice(data.analysis.exitPrice);
          if (data.analysis.pnl) setPnl(data.analysis.pnl.replace('$', '').replace('₹', '').replace('Rs', '').replace('+', '').trim());
          if (data.analysis.emotion) {
            const parsedEmotion = data.analysis.emotion;
            if ((EMOTION_CONFIG as Record<string, any>)[parsedEmotion]) {
              setEmotion(parsedEmotion);
            } else if (parsedEmotion === 'Revenge') {
              setEmotion('Revenge Trading');
            } else {
              setEmotion('Calm');
            }
          }
          if (data.analysis.notes) setNotes(data.analysis.notes);
          if (data.screenshotUrl) setScreenshotUrl(data.screenshotUrl);

          setScreenshotSuccess('AI successfully identified and populated trading parameters!');
        } else {
          setScreenshotError(data.error || 'Failed to analyze trade details from this image.');
        }
      } catch (err) {
        console.error(err);
        setScreenshotError('Failed to communicate with the Gemini AI recognition hosts.');
      } finally {
        setAnalyzingScreenshot(false);
      }
    };
    backendReader.readAsDataURL(file);
  };

  // Drag handlers
  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Handle Log New Trade Form Submit
  const handleSaveTrade = async (e: any) => {
    e.preventDefault();
    setModalError('');

    if (!instrument.trim()) {
      setModalError('Please specify the asset instrument symbol.');
      return;
    }
    if (entryPrice === '' || exitPrice === '' || pnl === '') {
      setModalError('Numeric entry, exit, and P&L results are required.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    let finalNotes = notes.trim();
    if (selectedTags.length > 0) {
      finalNotes += "\n\nTags: " + selectedTags.map(t => `#${t}`).join(' ');
    }

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instrument: instrument.trim(),
          entryPrice: String(entryPrice),
          exitPrice: String(exitPrice),
          pnl: String(pnl),
          emotion,
          notes: finalNotes,
          screenshotUrl: screenshotUrl || null,
          tradeTime: tradeTime ? new Date(tradeTime).toISOString() : null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Prepend new trade to local state list
        setTrades(prev => [data.trade, ...prev]);

        // Reset Inputs & Close Modal
        setInstrument('');
        setEntryPrice('');
        setExitPrice('');
        setPnl('');
        setEmotion('Calm');
        setNotes('');
        setScreenshotUrl('');
        setLocalImagePreview(null);
        setScreenshotSuccess('');
        setScreenshotError('');
        setSelectedTags([]);
        setTradeTime(getLocalNowString());
        setShowModal(false);
      } else {
        setModalError(data.error || 'Failed to log the trade.');
      }
    } catch (err) {
      console.error(err);
      setModalError('Failed to communicate safely with backend hosts.');
    } finally {
      setSubmitting(false);
    }
  };

  // Secure Delete Handler
  const handleDeleteTrade = async (tradeId: string | number) => {
    if (!window.confirm('Delete this trade record securely? This action is irreversible.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrades(prev => prev.filter(t => t.id !== tradeId));
      } else {
        alert(data.error || 'Failed to complete secure deletion.');
      }
    } catch (err) {
      console.error(err);
      alert('Secure connection interrupted. Please try again.');
    }
  };

  // Human Readable Date Formatter
  const formatTradeDate = (isoStr?: string) => {
    if (!isoStr) return 'Recent';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const glassCard = `rounded-2xl border p-6 transition-all ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]'
  }`;

  // Analytics KPI Bento Grid
  const fomoCount = fomoTradesCount;
  const revengeCount = revengeTradesCount;
  const setupCount = setupTradesCount;

  // Export trades as CSV
  const handleExportCSV = () => {
    if (trades.length === 0) {
      alert('No trades available to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Instrument', 'Entry Price', 'Exit Price', 'Net PnL', 'Emotion', 'Tags', 'Notes'];
    const rows = trades.map(t => {
      const d = t.tradeTime || t.createdAt;
      const cleanNotes = (t.notes || '').replace(/"/g, '""');
      return [
        t.id,
        `"${d}"`,
        `"${t.instrument || ''}"`,
        t.entryPrice || 0,
        t.exitPrice || 0,
        t.pnl || 0,
        `"${t.emotion || ''}"`,
        `"${(parseTags(t.notes) || []).join(';')}"`,
        `"${cleanNotes}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetailX_Trade_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative" id="trade_journal_container">
      {/* Top action rail */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-transparent">
        <div>
          <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Trade Journal & Performance Ledger
          </h2>
          <p className="text-xs text-gray-400">
            Log, audit, and analyze psychological discipline and execution statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all border ${
              isDark
                ? 'border-white/10 hover:bg-white/10 text-gray-200'
                : 'border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
            title="Export all trades to CSV spreadsheet"
          >
            <Download size={15} /> Export CSV
          </button>

          <button 
            onClick={() => {
              setModalError('');
              setLocalImagePreview(null);
              setScreenshotUrl('');
              setScreenshotSuccess('');
              setScreenshotError('');
              setSelectedTags([]);
              setTradeTime(getLocalNowString());
              setShowModal(true);
            }}
            id="btn_add_trade"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
              isDark 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <Plus size={18} /> Log Trade
          </button>
        </div>
      </div>

      {/* Network or Session Error Bar */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2 animate-pulse">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Analytics KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${glassCard} flex items-center justify-between`} id="kpi_discipline">
          <div>
            <h3 className={`text-sm tracking-wider uppercase font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Discipline Ratio</h3>
            <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '---' : disciplineScore}
              <span className="text-xl text-gray-500 font-medium font-mono">/100</span>
            </div>
          </div>
          <Activity size={48} className="text-[#c8f135] opacity-20" />
        </div>

        <div className={`${glassCard} flex items-center justify-between`} id="kpi_weekly_pnl">
          <div>
            <h3 className={`text-sm tracking-wider uppercase font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Net Profit / Loss</h3>
            <div className={`text-4xl font-bold ${
              loading 
                ? (isDark ? 'text-white' : 'text-gray-900') 
                : (weeklyPnl >= 0 ? 'text-green-500' : 'text-red-500')
            }`}>
              {loading ? '---' : (
                weeklyPnl >= 0 
                  ? `+₹${weeklyPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `-₹${Math.abs(weeklyPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <BookOpen size={48} className={`${weeklyPnl >= 0 ? 'text-green-500' : 'text-red-500'} opacity-20`} />
        </div>

        <div className={`${glassCard} flex items-center justify-between`} id="kpi_triggers_bias">
          <div className="space-y-1">
            <h3 className={`text-sm tracking-wider uppercase font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Psychological Bias distribution</h3>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400">
                {fomoCount} FOMO
              </span>
              <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">
                {revengeCount} Revenge
              </span>
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                {setupCount} A+ Setup
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* P&L Calendar Heatmap & Streak Tracker */}
      <PnlHeatmapCalendar trades={trades} isDark={isDark} />

      {/* Interactive Datatable Card */}
      <div className={`${glassCard} overflow-hidden px-0 pb-0`} id="trades_datatable_card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Analyzing security metrics and fetching trades...</p>
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="text-center py-16 px-4">
            <BookOpen className="mx-auto text-gray-400 mb-3 opacity-30 animate-bounce" size={40} />
            <h4 className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Clean Slate Journal</h4>
            <p className={`text-sm max-w-sm mx-auto mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Establish your biometric accountability trail. Log your entry/exit positions and watch for tilt!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="trades_table">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Timestamp</th>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Asset Symbol</th>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Biometric Emotion</th>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Entry / Exit</th>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Checklist & post-mortem notes</th>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Screenshot</th>
                  <th className={`p-4 text-xs tracking-wider uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'} text-right`}>P&L (₹)</th>
                  <th className="p-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-black/5'}`}>
                {sortedTrades.map((tr) => {
                  const val = parseFloat(tr.pnl) || 0;
                  const config = (EMOTION_CONFIG as Record<string, any>)[tr.emotion] || { icon: Smile, color: 'text-gray-400 bg-gray-100 border-gray-200' };
                  const EmotionIcon = config.icon;

                  return (
                    <tr key={tr.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`} id={`trade_row_${tr.id}`}>
                      {/* Displays custom trade timestamp overridden by user, otherwise fallback to creation timestamp */}
                      <td className={`p-4 text-sm font-mono whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatTradeDate(tr.tradeTime || tr.createdAt)}
                      </td>
                      <td className={`p-4 text-sm font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tr.instrument}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${config.color}`}>
                          <EmotionIcon size={12} /> {tr.emotion}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {tr.entryPrice} &rarr; {tr.exitPrice}
                      </td>
                      <td className={`p-4 text-sm max-w-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={cleanNotes(tr.notes)}>
                        <div className="space-y-1.5">
                          <div className="line-clamp-2 leading-relaxed">
                            {cleanNotes(tr.notes) || <span className="opacity-30 italic">No checklist notes recorded...</span>}
                          </div>
                          {parseTags(tr.notes).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parseTags(tr.notes).map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#c8f135]/15 text-[#c8f135] uppercase">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {tr.screenshotUrl ? (
                          <button
                            onClick={() => setLightboxImage(tr.screenshotUrl)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all border ${
                              isDark 
                                ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                            }`}
                          >
                            <ImageIcon size={12} /> View
                          </button>
                        ) : (
                          <span className="text-gray-500 text-xs italic opacity-40">None</span>
                        )}
                      </td>
                      <td className={`p-4 text-sm font-mono font-bold text-right ${val >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {val >= 0 
                          ? `+₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : `-₹${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleDeleteTrade(tr.id)}
                          title="Delete verification trail"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Trade Portal Modal Frame */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className={`w-full max-w-md p-6 border rounded-2xl ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-gray-900'
          } shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar`} id="log_trade_modal">
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold">Journal Audit Log Entry</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Add your metric accountability checks below.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'} transition-all`}
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                {modalError}
              </div>
            )}

            {/* Drag and Drop Screenshot / AI Recognition Area */}
            <div className="mb-4">
              <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Screenshot Upload & AI Extraction (Optional)
              </label>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('screenshot_input')?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative ${
                  dragActive 
                    ? (isDark ? 'border-white bg-zinc-900' : 'border-black bg-zinc-50')
                    : (isDark ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50')
                }`}
              >
                <input 
                  type="file" 
                  id="screenshot_input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />

                {analyzingScreenshot ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Gemini is OCR-scanning your screenshot...
                    </span>
                  </div>
                ) : localImagePreview ? (
                  <div className="w-full flex items-center gap-3">
                    <img 
                      src={localImagePreview} 
                      alt="Uploaded Screenshot" 
                      className="w-16 h-16 rounded object-cover border border-zinc-700/50" 
                    />
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        Screenshot loaded
                      </p>
                      <p className="text-[10px] text-green-500 flex items-center gap-1 font-semibold mt-0.5">
                        <CheckCircle size={10} /> Extracting completed
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalImagePreview(null);
                          setScreenshotUrl('');
                          setScreenshotSuccess('');
                          setScreenshotError('');
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 underline font-medium mt-1 inline-block"
                      >
                        Reset Picture
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Drag and drop trade chart/log or <strong className={`${isDark ? 'text-white' : 'text-black'}`}>browse</strong>
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Gemini automatically populates Symbol, Entry, Exit & PnL
                    </span>
                  </>
                )}
              </div>

              {screenshotError && (
                <p className="text-[11px] text-red-400 font-semibold mt-1.5 flex items-center gap-1 animate-pulse">
                  <AlertCircle size={10} /> {screenshotError}
                </p>
              )}
              {screenshotSuccess && (
                <p className="text-[11px] text-green-500 font-semibold mt-1.5 flex items-center gap-1">
                  <CheckCircle size={10} /> {screenshotSuccess}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveTrade} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Instrument / Symbol
                </label>
                <input 
                  type="text" 
                  required
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700' 
                      : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400'
                  }`} 
                  placeholder="e.g. NIFTY50, ES, AAPL, MNQ" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Entry Price
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700' 
                        : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400'
                    }`} 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Exit Price
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700' 
                        : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400'
                    }`} 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Net P&L Result (₹)
                </label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700' 
                      : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400'
                  }`} 
                  placeholder="Use negative for losses (e.g. -150 or 450)" 
                />
              </div>

              {/* Custom Date and Time input control */}
              <div>
                <label className={`block text-xs font-bold mb-1 uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <Clock size={12} /> Choose Execution Time
                </label>
                <input 
                  type="datetime-local" 
                  required
                  value={tradeTime}
                  onChange={(e) => setTradeTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all font-mono ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700 cursor-pointer' 
                      : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400 cursor-pointer'
                  }`} 
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Biometric Bias & Emotion
                </label>
                <select 
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg outline-none text-sm cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700' 
                      : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400'
                  }`}
                >
                  <option value="Calm">Calm & Confident (A+ execution)</option>
                  <option value="Anxious">Anxious / Nervous</option>
                  <option value="FOMO">FOMO / Chasing Moves</option>
                  <option value="Revenge Trading">Revenge / Angry trading</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Psychological Bias Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {['revenge-trade', 'fomo', 'good-setup', 'disciplined', 'over-leveraged'].map(t => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(prev => prev.filter(x => x !== t));
                          } else {
                            setSelectedTags(prev => [...prev, t]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-[#c8f135] text-black border-[#c8f135]' 
                            : (isDark ? 'bg-zinc-900 border border-zinc-850 text-zinc-400 hover:bg-zinc-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Pre-trade checklist & post-mortem Notes
                </label>
                <textarea 
                  rows={2} 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700' 
                      : 'bg-white border-zinc-200 text-gray-900 focus:border-zinc-400'
                  }`} 
                  placeholder="Explain details: Biases observed, why you entered or exited..."
                  maxLength={2000}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 py-2.5 rounded-lg font-bold border text-sm transition-all ${
                    isDark 
                      ? 'border-zinc-800 text-white hover:bg-zinc-900' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting || analyzingScreenshot}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                    isDark 
                      ? 'bg-white text-zinc-950 hover:bg-zinc-200' 
                      : 'bg-black text-white hover:bg-zinc-800'
                  } ${(submitting || analyzingScreenshot) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin text-current" size={14} />
                      Logging...
                    </>
                  ) : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Screenshot Portal View */}
      {lightboxImage && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all"
            >
              <X size={20} />
            </button>
            <img 
              src={lightboxImage} 
              referrerPolicy="no-referrer"
              alt="Visual Trading Screenshot" 
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/10" 
            />
            <p className="text-zinc-400 text-xs font-semibold mt-4 tracking-wider uppercase">
              Visual Trade Journal Exhibit
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
