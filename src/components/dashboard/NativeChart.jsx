import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Download, Share2, Loader2, Camera, AlertCircle, BarChart3, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';

export default function NativeChart({ symbol, currentPrice, isDark }) {
  const [timeframe, setTimeframe] = useState('5m');
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    const fetchChartData = async () => {
      try {
        const symbolParam = symbol === 'NIFTY50' || symbol === 'NIFTY' ? 'NIFTY50' : symbol;
        const rangeParam = timeframe === '1d' ? '1mo' : '1d';
        const res = await fetch(`/api/market/chart?symbol=${symbolParam}&interval=${timeframe}&range=${rangeParam}`);
        if (!res.ok) {
          throw new Error(`Chart data request failed with status ${res.status}`);
        }
        const data = await res.json();
        
        if (data && Array.isArray(data.data) && data.data.length > 0 && isMounted) {
          const formatted = data.data.map(d => ({
            x: new Date(d.timestamp).getTime(),
            y: [
              Number(d.open.toFixed(2)), 
              Number(d.high.toFixed(2)), 
              Number(d.low.toFixed(2)), 
              Number(d.close.toFixed(2))
            ]
          }));
          setSeries([{ data: formatted }]);
          setFetchError(null);
        } else if (isMounted && (!data || !data.data || data.data.length === 0)) {
          // If no candles returned, set series empty but don't crash
          setSeries([]);
        }
      } catch (err) {
        console.error("Failed to fetch native chart data", err);
        if (isMounted) setFetchError(err.message || "Failed to load chart data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // refresh every minute

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol, timeframe]);

  // Optionally update the real-time spot price on the latest candle when price changes
  useEffect(() => {
    if (!currentPrice || typeof currentPrice !== 'number' || series.length === 0 || !series[0]?.data?.length) return;
    
    setSeries(prev => {
      if (!prev || prev.length === 0 || !prev[0]?.data?.length) return prev;
      const currentCandles = prev[0].data;
      const lastCandle = currentCandles[currentCandles.length - 1];
      if (!lastCandle || !Array.isArray(lastCandle.y)) return prev;

      const open = Number(lastCandle.y[0]);
      let high = Number(lastCandle.y[1]);
      let low = Number(lastCandle.y[2]);
      const prevClose = Number(lastCandle.y[3]);
      const close = Number(currentPrice.toFixed(2));
      
      // Avoid re-rendering candle if price is virtually identical
      if (Math.abs(close - prevClose) < 0.01) return prev;

      if (close > high) high = close;
      if (close < low) low = close;

      const updatedCandle = {
        ...lastCandle,
        y: [open, high, low, close]
      };

      const updatedData = [...currentCandles.slice(0, -1), updatedCandle];
      return [{ data: updatedData }];
    });
  }, [currentPrice]);

  const options = useMemo(() => ({
    chart: {
      id: `candlestick-${symbol}`,
      type: 'candlestick',
      height: '100%',
      background: 'transparent',
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      selection: {
        enabled: false
      },
      toolbar: {
        show: true,
        autoSelected: 'zoom',
        tools: {
          download: false,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: { 
        enabled: false 
      }
    },
    theme: { mode: isDark ? "dark" : "light" },
    annotations: {
      yaxis: currentPrice ? [
        {
          y: Number(currentPrice),
          borderColor: '#10b981',
          strokeDashArray: 4,
          borderWidth: 2,
          opacity: 0.95,
          label: {
            borderColor: '#10b981',
            style: {
              color: '#ffffff',
              background: '#059669',
              fontWeight: 800,
              fontSize: '11px',
              padding: { left: 8, right: 8, top: 4, bottom: 4 }
            },
            text: `₹${Number(currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Live Index)`
          }
        }
      ] : []
    },
    title: {
      text: `${symbol} (Real-time NSE)`,
      align: 'left',
      style: {
        color: isDark ? '#fff' : '#000',
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: { 
        style: { colors: isDark ? '#888' : '#666' },
        datetimeUTC: false
      }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { colors: isDark ? '#888' : '#666' },
        formatter: (value) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    },
    grid: {
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      strokeDashArray: 4
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#10B981', downward: '#EF4444' }
      }
    }
  }), [symbol, isDark, currentPrice]);

  const handleShare = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: isDark ? '#121212' : '#ffffff'
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'chart-analysis.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${symbol} Technical Analysis`,
            text: `Check out my live paper trading chart for ${symbol} on RetailX!`,
            files: [file]
          });
        } else {
          // Fallback download if web share API files not supported
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${symbol}-analysis.png`;
          a.click();
        }
      });
    } catch (err) {
      console.error("Error generating shareable chart image", err);
    }
  };

  const hasCandles = series.length > 0 && Array.isArray(series[0]?.data) && series[0].data.length > 0;

  return (
    <div className="w-full flex flex-col h-full">
      {/* Custom Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 px-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Live Index</span>
            {currentPrice ? (
              <span className="font-mono font-black text-xs ml-1 border-l border-emerald-500/30 pl-2 text-emerald-400">
                ₹{Number(currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : null}
          </div>

          {/* Timeframe Chips */}
          <div className={`flex items-center p-0.5 rounded-lg border ${isDark ? 'bg-[#181818] border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            {[
              { id: '1m', label: '1m' },
              { id: '5m', label: '5m' },
              { id: '15m', label: '15m' },
              { id: '1h', label: '1H' },
              { id: '1d', label: '1D' },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  timeframe === tf.id
                    ? (isDark ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-emerald-700 shadow-sm border border-emerald-200')
                    : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/openchart"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-xs font-semibold"
            title="Open Historical Candlestick Data Engine"
          >
            <Database size={14} />
            OpenChart Engine
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium"
          >
            <Camera size={16} />
            Capture & Share
          </button>
        </div>
      </div>

      <div ref={chartRef} className="flex-1 min-h-[450px] relative flex flex-col justify-center">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading real-time candlestick data...
            </span>
          </div>
        )}

        {fetchError && !hasCandles && !loading && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Unable to load chart data for {symbol}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {fetchError}
            </p>
          </div>
        )}

        {!loading && !fetchError && !hasCandles && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <BarChart3 className="w-10 h-10 text-gray-400 mb-2 opacity-60" />
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              No Candlestick Data Available
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Market might be closed or intraday data is being calculated.
            </p>
          </div>
        )}

        {hasCandles && (
          <ReactApexChart
            key={`chart-${symbol}`}
            options={options}
            series={series}
            type="candlestick"
            height="100%"
          />
        )}
      </div>
    </div>
  );
}
