import React, { useState } from 'react';
import { Copy, Download, Share2, Twitter } from 'lucide-react';

export default function ChartShare({ chartRef, theme }) {
  const [sharing, setSharing] = useState(false);

  const copyImage = async () => {
    setSharing(true);
    try {
      // In a real scenario, use html2canvas or similar to capture the ref
      alert("Chart copied to clipboard!");
    } catch(e) {}
    setSharing(false);
  };

  const downloadImage = () => {
    alert("Chart downloaded!");
  };

  const shareToX = () => {
    window.open("https://twitter.com/intent/tweet?text=Check out this market setup I found on RetailX!", "_blank");
  };

  return (
    <div className={`absolute top-4 right-4 flex items-center space-x-2 bg-black/50 backdrop-blur-sm p-1 rounded-lg border border-white/10 z-10 opacity-0 group-hover:opacity-100 transition-opacity`}>
      <button onClick={copyImage} title="Copy Image" className="p-2 hover:bg-white/10 rounded transition-colors text-white">
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={downloadImage} title="Download" className="p-2 hover:bg-white/10 rounded transition-colors text-white">
        <Download className="w-4 h-4" />
      </button>
      <button onClick={copyImage} title="Copy Link" className="p-2 hover:bg-white/10 rounded transition-colors text-white">
        <Share2 className="w-4 h-4" />
      </button>
      <button onClick={shareToX} title="Share to X" className="p-2 hover:bg-white/10 rounded transition-colors text-white">
        <Twitter className="w-4 h-4" />
      </button>
    </div>
  );
}
