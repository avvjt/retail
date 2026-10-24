import React, { useState } from 'react';
import { Phone, FileText, Bug, ExternalLink, Upload, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Support({ theme }) {
  const [form, setForm] = useState({ type: 'support', subject: '', description: '', mediaData: null, mediaType: null });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        mediaData: event.target.result,
        mediaType: file.type
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/settings/support', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      setSubmitted(true);
      setForm({ type: 'support', subject: '', description: '', mediaData: null, mediaType: null });
      setTimeout(() => setSubmitted(false), 3000);
    } catch(err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className={`w-full p-6 h-full overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono">Support & Bugs</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Get help, report issues, and read documentation.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
        <div className="col-span-1 lg:col-span-2">
          <div className={`p-6 border rounded-lg ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h2 className="text-lg font-bold mb-4">Submit a Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Ticket Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`}>
                  <option value="support">General Support</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Subject</label>
                <input required type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Description</label>
                <textarea required rows={5} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`}></textarea>
              </div>
              
              {form.type === 'bug' && (
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-70">Attach Image/Video (Max 50MB)</label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer relative ${theme === 'dark' ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="pointer-events-none flex flex-col items-center">
                      <Upload className="w-5 h-5 mb-1 opacity-60" />
                      <span className="text-xs font-bold">{form.mediaData ? 'Change file' : 'Choose file to upload'}</span>
                      <span className="text-[10px] opacity-60 mt-1">Images or videos up to 50MB</span>
                    </div>
                  </div>
                  {form.mediaType && (
                    <div className="mt-2 text-[10px] text-blue-500 font-medium flex items-center gap-1">
                      File attached ({form.mediaType})
                    </div>
                  )}
                  {error && (
                    <div className="text-red-500 text-[10px] mt-1">{error}</div>
                  )}
                </div>
              )}
              
              <button disabled={submitting} type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50 flex items-center">
                {submitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Ticket
              </button>
              {submitted && <span className="ml-4 text-emerald-500 text-sm font-medium">Ticket submitted successfully!</span>}
            </form>
          </div>
        </div>
        <div className="col-span-1 space-y-4">
          <Link to="/documentation" className={`block p-4 border rounded-lg hover:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <FileText className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-bold flex items-center">Documentation <ExternalLink className="w-3 h-3 ml-2 opacity-50" /></h3>
            <p className="text-xs opacity-70 mt-1">Read our guides and tutorials.</p>
          </Link>
          <Link to="/changelog" className={`block p-4 border rounded-lg hover:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <Bug className="w-6 h-6 text-rose-500 mb-2" />
            <h3 className="font-bold flex items-center">Changelog <ExternalLink className="w-3 h-3 ml-2 opacity-50" /></h3>
            <p className="text-xs opacity-70 mt-1">See what's new in RetailX.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
