import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, RefreshCw, Sliders, Users, Calendar, Activity, 
  AlertTriangle, ArrowLeft, Mail, Copy, Check, Shield, 
  CircleDollarSign, ArrowRight, ChevronLeft, ChevronRight,
  BookOpen, Plus, PlayCircle, Trash2, Upload, Video, Sparkles
, Headphones } from 'lucide-react';
import './AdminPanel.css';

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('waitlist'); // 'waitlist' or 'courses'
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterPain, setFilterPain] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Course Management State
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [referralsData, setReferralsData] = useState({ history: [], users: [] });
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const fetchReferrals = async () => {
    setReferralsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/admin/referrals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setReferralsData(data);
      }
    } catch(err) {
      console.error(err);
    }
    setReferralsLoading(false);
  };

  const fetchSupportTickets = async () => {
    setTicketsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/admin/support-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setSupportTickets(data);
      }
    } catch(err) {
      console.error(err);
    }
    setTicketsLoading(false);
  };

  useEffect(() => {
    if(activeAdminTab === 'support') {
      fetchSupportTickets();
    }
    if(activeAdminTab === 'referrals') {
      fetchReferrals();
    }
  }, [activeAdminTab]);

  const [publishing, setPublishing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [courseForm, setCourseForm] = useState({
    title: '',
    topic: 'Theory',
    duration: '',
    videoUrl: '',
    videoSource: 'url' // 'url' or 'file'
  });

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in or lack administrative privileges.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve administrative records.');
      }
      setSubmissions(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching submissions data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(data);
      }
    } catch (err) {
      console.error("Error loading courses inside admin panel:", err);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      fetchSubmissions();
      fetchCourses();
    };

    window.addEventListener('openAdmin', handleOpen);
    window.addEventListener('newSubmissionSaved', fetchSubmissions);

    return () => {
      window.removeEventListener('openAdmin', handleOpen);
      window.removeEventListener('newSubmissionSaved', fetchSubmissions);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedId(null);
    window.dispatchEvent(new Event('closeAdmin'));
  };

  if (!isOpen) return null;

  // Filter logic for applicants
  const filteredSubmissions = submissions.filter(sub => {
    const textMatch = 
      (sub.name || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (sub.email || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (sub.experience || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (sub.valuable_feature || sub.valuableFeature || '').toLowerCase().includes(filterText.toLowerCase());

    const painVal = Number(sub.pain_scale || sub.painScale || 5);

    if (filterPain === 'all') return textMatch;
    if (filterPain === 'critical') return textMatch && painVal >= 8;
    if (filterPain === 'moderate') return textMatch && painVal >= 5 && painVal <= 7;
    if (filterPain === 'mild') return textMatch && painVal < 5;
    return textMatch;
  });

  const totalCount = submissions.length;
  const criticalCount = submissions.filter(s => Number(s.pain_scale || s.painScale || 0) >= 8).length;
  const avgPain = totalCount > 0 
    ? (submissions.reduce((acc, curr) => acc + Number(curr.pain_scale || curr.painScale || 5), 0) / totalCount).toFixed(1) 
    : '0.0';

  const activeIndex = filteredSubmissions.findIndex(sub => (sub.id || sub.email) === selectedId);
  const activeSub = activeIndex !== -1 ? filteredSubmissions[activeIndex] : null;

  const handlePrevApplicant = () => {
    if (activeIndex > 0) {
      const prevSub = filteredSubmissions[activeIndex - 1];
      setSelectedId(prevSub.id || prevSub.email);
    }
  };

  const handleNextApplicant = () => {
    if (activeIndex < filteredSubmissions.length - 1) {
      const nextSub = filteredSubmissions[activeIndex + 1];
      setSelectedId(nextSub.id || nextSub.email);
    }
  };

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBackToList = () => {
    setSelectedId(null);
  };

  // Video course uploads & creation actions
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Double check video duration automatically in the browser using the Video Metadata API
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = URL.createObjectURL(file);
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(tempVideo.src);
        const durationSecs = tempVideo.duration;
        if (durationSecs && !isNaN(durationSecs)) {
          const totalSecs = Math.round(durationSecs);
          const minutes = Math.floor(totalSecs / 60);
          const seconds = totalSecs % 60;
          const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          setCourseForm(prev => ({ ...prev, duration: formatted }));
        }
      };
    } catch (metadataError) {
      console.warn("Could not parse video duration locally in browser:", metadataError);
    }

    setUploadStatus('Reading video file...');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      const token = localStorage.getItem('token');
      if (!token) return;

      setUploadStatus('Streaming to Cloudinary...');
      try {
        const res = await fetch('/api/admin/courses/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoData: base64Data,
            originalName: file.name
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to complete video streaming.');
        }

        setCourseForm(prev => {
          const updated = { ...prev, videoUrl: data.url };
          // If server parsed a duration, and we haven't already set one, use it
          if (data.duration && !prev.duration) {
            updated.duration = data.duration;
          }
          return updated;
        });
        setUploadStatus(data.warning ? `⚠️ Fallback active (Saved offline)` : '✅ Video uploaded successfully!');
      } catch (err) {
        console.error(err);
        setUploadStatus(`❌ Upload failed: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishCourse = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const { title, topic, duration, videoUrl } = courseForm;

    if (!title || !topic || !duration || !videoUrl) {
      alert("Please fill out all video course details to publish.");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, topic, duration, videoUrl })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record details.');
      }

      // Success
      setCourseForm({
        title: '',
        topic: 'Theory',
        duration: '',
        videoUrl: '',
        videoSource: 'url'
      });
      setUploadStatus('');
      fetchCourses();
      alert("🎓 Beautiful! Course video has been published directly to user education dashboards!");
    } catch (err) {
      console.error(err);
      alert(`Error publishing course: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this course?")) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete course.");
      }
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  return (
    <div className="admin-overlay" onClick={handleClose}>
      <motion.div 
        className="admin-container-modal fullscreen-layout"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Universal Top Tab Menu */}
        <div className="flex flex-col sm:flex-row border-b border-white/10 px-8 py-3 bg-[#0d0d10] items-center justify-between gap-4 select-none shrink-0" id="admin_top_tabs_header">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#c8f135] border border-[#c8f135]/30 px-2 py-0.5 rounded bg-[#c8f135]/5">
              ADMIN CONTROL CENTER
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setSelectedId(null); setActiveAdminTab('waitlist'); }}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  activeAdminTab === 'waitlist' && !selectedId
                    ? 'bg-[#c8f135] text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Applications waitlist
              </button>
              
              <button 
                onClick={() => { setSelectedId(null); setActiveAdminTab('courses'); }}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  activeAdminTab === 'courses' && !selectedId
                    ? 'bg-[#c8f135] text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Course video management
              </button>
              <button
                onClick={() => { setSelectedId(null); setActiveAdminTab('referrals'); }}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  activeAdminTab === 'referrals' && !selectedId
                    ? 'bg-[#c8f135] text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => { setSelectedId(null); setActiveAdminTab('support'); }}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  activeAdminTab === 'support' && !selectedId
                    ? 'bg-[#c8f135] text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Support Tickets
              </button>
            </div>
          </div>
          
          <button className="text-zinc-400 hover:text-white transition-colors p-1" onClick={handleClose} title="Close Panel">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: WAITLIST & SUBMISSIONS */}
            {activeAdminTab === 'waitlist' && (
              <div className="h-full">
                {!activeSub ? (
                  /* ==================== VIEW 1: THE ALL SUBMISSIONS DIRECTORY ==================== */
                  <motion.div 
                    key="list-view"
                    className="admin-list-view-container p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Dashboard Top Header */}
                    <div className="admin-layout-header">
                      <div>
                        <h2>Beta Waitlist Pool ({totalCount})</h2>
                        <p className="subtitle">Realtime database of every person who filled out the psychological risk audit</p>
                      </div>
                      <div className="header-actions-row">
                        <button className="refresh-btn-simple" onClick={fetchSubmissions} disabled={loading}>
                          <RefreshCw size={13} className={loading ? 'spinning' : ''} />
                          <span>Sync Database</span>
                        </button>
                      </div>
                    </div>

                    {/* Bento Stats Board */}
                    <div className="bento-stats-grid">
                      <div className="bento-stat-card">
                        <span className="stat-label">TOTAL LIST</span>
                        <div className="stat-value-row">
                          <Users size={18} className="text-secondary" />
                          <span className="stat-number">{totalCount}</span>
                        </div>
                        <span className="stat-desc">Registered profiles</span>
                      </div>

                      <div className="bento-stat-card alert">
                        <span className="stat-label">TRAUMA POOL</span>
                        <div className="stat-value-row">
                          <AlertTriangle size={18} className="text-red" />
                          <span className="stat-number text-red">{criticalCount}</span>
                        </div>
                        <span className="stat-desc">Pain Index &gt;= 8/10</span>
                      </div>

                      <div className="bento-stat-card progress">
                        <span className="stat-label">AVERAGE PAIN</span>
                        <div className="stat-value-row">
                          <Activity size={18} className="text-accent" />
                          <span className="stat-number text-accent">{avgPain} <span className="stat-max">/10</span></span>
                        </div>
                        <span className="stat-desc">Emotional risk loading</span>
                      </div>
                    </div>

                    {/* Toolbar Search with Filters */}
                    <div className="directory-toolbar-row">
                      <div className="search-box-wrapper flex-1">
                        <Search className="search-icon" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search applicants by name, email, pricing tier, features..." 
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="toolbar-search-input-wide"
                        />
                      </div>

                      <div className="filter-scroll-wrapper">
                        <button 
                          className={`filter-button-tab ${filterPain === 'all' ? 'active' : ''}`}
                          onClick={() => setFilterPain('all')}
                        >
                          All Accounts
                        </button>
                        <button 
                          className={`filter-button-tab ${filterPain === 'critical' ? 'active' : ''}`}
                          onClick={() => setFilterPain('critical')}
                        >
                          Critical Trauma (8+)
                        </button>
                        <button 
                          className={`filter-button-tab ${filterPain === 'moderate' ? 'active' : ''}`}
                          onClick={() => setFilterPain('moderate')}
                        >
                          Moderate Pain (5-7)
                        </button>
                        <button 
                          className={`filter-button-tab ${filterPain === 'mild' ? 'active' : ''}`}
                          onClick={() => setFilterPain('mild')}
                        >
                          Mild Strain (&lt;5)
                        </button>
                      </div>
                    </div>

                    {/* Error Alert Display */}
                    {error && (
                      <div className="admin-error-banner-pane">
                        <AlertTriangle size={15} />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Master directory container */}
                    <div className="waitlist-grid-scroller">
                      {loading && submissions.length === 0 ? (
                        <div className="pane-loader-full">
                          <RefreshCw size={36} className="spinning text-[#c8f135]" />
                          <h3>Syncing safety audit files...</h3>
                          <p className="monospace">CONNECTING TO SECURE NEON POSTGRESQL INSTANCE</p>
                        </div>
                      ) : filteredSubmissions.length === 0 ? (
                        <div className="pane-empty-full">
                          <span>📭</span>
                          <h3>No matching candidate forms found</h3>
                          <p>Try modifying your search query or choosing a different emotional pain index filter tab.</p>
                        </div>
                      ) : (
                        <div className="applicant-grid-layout">
                          {filteredSubmissions.map((sub, index) => {
                            const painValue = Number(sub.pain_scale || sub.painScale || 5);
                            const parsedDate = sub.created_at ? new Date(sub.created_at) : null;
                            const dateStr = parsedDate 
                              ? parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Recent';

                            return (
                              <div 
                                key={sub.id ? `panel-sub-${sub.id}-${index}` : `panel-email-${sub.email || index}-${index}`}
                                className="directory-card-item pointer-events-auto cursor-pointer"
                                onClick={() => setSelectedId(sub.id || sub.email)}
                              >
                                <div className="card-top-accent"></div>
                                
                                <div className="card-inner">
                                  <div className="card-header-line">
                                    <div className="profile-badge-avatar">
                                      {(sub.name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`pain-badge ${
                                      painValue >= 8 ? 'critical' :
                                      painValue >= 5 ? 'moderate' : 'mild'
                                    }`}>
                                      Pain: {painValue}/10
                                    </span>
                                  </div>

                                  <h3 className="card-applicant-name">{sub.name || 'Anonymous User'}</h3>
                                  <span className="card-applicant-email">{sub.email}</span>

                                  <div className="card-metadata-fields">
                                    <div className="meta-line">
                                      <span className="meta-label">HOOK DETECTED:</span>
                                      <span className="meta-value text-accent">
                                        🛡️ {sub.valuable_feature || sub.valuableFeature || 'Auto Limits'}
                                      </span>
                                    </div>
                                    <div className="meta-line">
                                      <span className="meta-label">BUDGET INTEREST:</span>
                                      <span className="meta-value text-green">
                                        💵 {sub.pricing || 'Free Plan'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="card-footer-action">
                                    <span className="timestamp">{dateStr}</span>
                                    <div className="action-link">
                                      <span>See Full Audit</span>
                                      <ArrowRight size={13} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* ==================== VIEW 2: THE DETAILED PERSONAL OUTLINE ==================== */
                  <motion.div 
                    key="detail-view"
                    className="admin-fullscreen-detail-view p-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Back to pool header */}
                    <div className="detail-navigation-bar">
                      <button className="back-to-pool-btn border border-zinc-700/50 p-2 rounded-xl flex items-center gap-1.5 px-3" onClick={handleBackToList}>
                        <ArrowLeft size={16} />
                        <span>Back to Waitlist Directory</span>
                      </button>

                      <div className="applicant-flipper-navigation">
                        <span className="navigation-status monospace mr-4">
                          CANDIDATE {activeIndex + 1} OF {filteredSubmissions.length}
                        </span>
                        
                        <div className="flipper-buttons mr-2">
                          <button 
                            onClick={handlePrevApplicant} 
                            disabled={activeIndex === 0}
                            className="flipper-button border border-zinc-700/30 p-2 rounded-lg"
                            title="Previous Candidate"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button 
                            onClick={handleNextApplicant} 
                            disabled={activeIndex === filteredSubmissions.length - 1}
                            className="flipper-button border border-zinc-700/30 p-2 rounded-lg"
                            title="Next Candidate"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Core Detailed Persona Board */}
                    <div className="detail-scrollable-body mt-4">
                      <div className="large-detail-view-card">
                        
                        {/* Personal Contact and Pain Score Header Card */}
                        <div className="individual-rich-header">
                          <div className="left-candidate-block">
                            <div className="large-round-avatar">
                              {(activeSub.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div className="candidate-credentials">
                              <span className="candidate-badge-pill">VERIFIED ACCESS REQUEST</span>
                              <h2>{activeSub.name || 'Anonymous User'}</h2>
                              
                              <div className="email-action-row">
                                <span className="profile-mail-text">{activeSub.email}</span>
                                <span className="divider-dot">•</span>
                                
                                <div className="quick-action-strip">
                                  <button 
                                    onClick={() => handleCopyEmail(activeSub.email, activeSub.id || activeSub.email)}
                                    className="action-pill-btn"
                                    title="Copy Email To Clipboard"
                                  >
                                    {copiedId === (activeSub.id || activeSub.email) ? (
                                      <>
                                        <Check size={12} className="text-[#c8f135]" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copy Email</span>
                                      </>
                                    )}
                                  </button>

                                  <a 
                                    href={`mailto:${activeSub.email}`} 
                                    className="action-pill-btn mail"
                                    title="Email Candidate Directly"
                                  >
                                    <Mail size={12} />
                                    <span>Draft Email</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="right-trauma-meter">
                            <div className="interactive-metric-circle">
                              <span className="big-index-number">{activeSub.pain_scale || activeSub.painScale || 5}</span>
                              <span className="max-index-number">/10</span>
                            </div>
                            <div className="metric-meta-details">
                              <span className="metric-title-label">EMOTIONAL TRAUMA INDEX</span>
                              <span className="metric-sub-label">
                                {Number(activeSub.pain_scale || activeSub.painScale || 5) >= 8 ? '🚨 Critically Impacted' :
                                 Number(activeSub.pain_scale || activeSub.painScale || 5) >= 5 ? '⚠️ Moderately Vulnerable' : '🥱 Mildly Vulnerable'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* High Density Form Fields Grid Layout */}
                        <div className="form-data-grid-layout">
                          
                          {/* Section 1: Detailed narrative response */}
                          <div className="grid-colspan-2 data-block-section">
                            <div className="datablock-section-title">
                              <Calendar size={14} className="icon" />
                              <h3>Last 12 Months trading Experience Outline</h3>
                            </div>
                            <div className="quote-narrative-container">
                              <span className="aesthetic-quotes">“</span>
                              <p className="experience-response-para text-sm text-zinc-350 leading-relaxed">
                                {activeSub.experience || "No experience summary or timeline description entered. The user submitted an empty or unselected response."}
                              </p>
                            </div>
                          </div>

                          {/* Section 2: Split statistics */}
                          <div className="data-block-section select-features">
                            <div className="datablock-section-title">
                              <Shield size={14} className="icon text-[#c8f135]" />
                              <h3>Requested Loss Elimination Feature</h3>
                            </div>
                            <div className="highlighted-value-display label-accent">
                              {activeSub.valuable_feature || activeSub.valuableFeature || "Auto-Pause Checklist Rule"}
                            </div>
                            <p className="field-interpretation-notes mt-2 text-xs text-zinc-500">
                              This is the exact behavioral intervention rule this user requested to enforce safe thresholds.
                            </p>
                          </div>

                          <div className="data-block-section select-pricing">
                            <div className="datablock-section-title">
                              <CircleDollarSign size={14} className="icon text-green" />
                              <h3>Stated Monthly Subscription Interest</h3>
                            </div>
                            <div className="highlighted-value-display label-green">
                              {activeSub.pricing || "Free Plan Support"}
                            </div>
                            <p className="field-interpretation-notes mt-2 text-xs text-zinc-500">
                              The self-selected price threshold the applicant declared they are willing to allocate for safety.
                            </p>
                          </div>

                          {/* Section 3: Pitfalls check list */}
                          <div className="grid-colspan-2 data-block-section">
                            <div className="datablock-section-title">
                              <Activity size={14} className="icon" />
                              <h3>Reported Impulse Trading Setbacks & Habits</h3>
                            </div>
                            
                            {activeSub.behaviors ? (
                              <div className="pitfall-interactive-pills">
                                {(Array.isArray(activeSub.behaviors) ? activeSub.behaviors : String(activeSub.behaviors).split(',')).map((behav, idx) => {
                                  const trimmedStr = typeof behav === 'string' ? behav.trim() : String(behav).trim();
                                  if (!trimmedStr) return null;
                                  return (
                                    <div key={idx} className="interactive-warning-pill">
                                      <span className="warning-icon-pill">⚠️</span>
                                      <span className="warning-text-pill">{trimmedStr}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="empty-pitfalls-box">
                                <p>No critical impulsive trading patterns were selected on submission. The user may be relatively disciplined, or skipped checking pitfalls.</p>
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* TAB 2: COURSE & VIDEO UPLOAD MANAGEMENT */}
            {activeAdminTab === 'courses' && (
              <motion.div
                key="courses-manager"
                className="p-8 space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Header Section */}
                <div className="admin-layout-header pb-4 border-b border-zinc-200">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                      <BookOpen size={22} className="text-zinc-700" /> Course & Video Materials
                    </h2>
                    <p className="subtitle mt-1 text-sm text-zinc-500">
                      Upload instructional lessons and instantly build the curriculum available on the user-facing education dashboard.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: Register Course Form */}
                  <div className="lg:col-span-2 bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 h-fit space-y-6">
                    <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                      <BookOpen size={16} className="text-zinc-600" />
                      <h3 className="text-sm font-bold text-zinc-800">Publish New Curricula</h3>
                    </div>

                    <form onSubmit={handlePublishCourse} className="space-y-4">
                      {/* Course Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-700 font-bold uppercase tracking-wider font-mono">Curriculum Module Title</label>
                        <input
                          type="text"
                          required
                          value={courseForm.title}
                          onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Breakout Liquidity Traps"
                          className="w-full text-xs p-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-medium"
                        />
                      </div>

                      {/* Course Topic & Duration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-700 font-bold uppercase tracking-wider font-mono">Category</label>
                          <select
                            value={courseForm.topic}
                            onChange={(e) => setCourseForm(prev => ({ ...prev, topic: e.target.value }))}
                            className="w-full text-xs p-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 outline-none focus:border-zinc-400 transition-all font-medium cursor-pointer"
                          >
                            <option value="Theory">Theory</option>
                            <option value="Execution">Execution</option>
                            <option value="Risk">Risk</option>
                            <option value="Psychology">Psychology</option>
                            <option value="Mindset">Mindset</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-700 font-bold uppercase tracking-wider font-mono">Clipping Duration</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 50m, 1h 20m"
                            value={courseForm.duration}
                            onChange={(e) => setCourseForm(prev => ({ ...prev, duration: e.target.value }))}
                            className="w-full text-xs p-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {/* Video Source Type */}
                      <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCourseForm(prev => ({ ...prev, videoSource: 'file' }))}
                          className={`text-[11px] font-bold py-2 rounded-lg transition-all ${
                            courseForm.videoSource === 'file'
                              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                              : 'text-zinc-600 hover:text-zinc-800'
                          }`}
                        >
                          Upload Video File
                        </button>
                        <button
                          type="button"
                          onClick={() => setCourseForm(prev => ({ ...prev, videoSource: 'url' }))}
                          className={`text-[11px] font-bold py-2 rounded-lg transition-all ${
                            courseForm.videoSource === 'url'
                              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                              : 'text-zinc-600 hover:text-zinc-800'
                          }`}
                        >
                          Direct Web Link
                        </button>
                      </div>

                      {/* Video payload input */}
                      {courseForm.videoSource === 'file' ? (
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-700 font-bold uppercase tracking-wider font-mono block">Video File Selector</label>
                          <div className="border-2 border-dashed border-zinc-300 hover:border-zinc-450 transition-all rounded-xl p-4 text-center cursor-pointer relative bg-zinc-50/50">
                            <input 
                              type="file" 
                              accept="video/*" 
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="pointer-events-none">
                              <Upload size={22} className="mx-auto text-zinc-500 mb-1" />
                              <span className="text-xs text-zinc-700 block font-bold">Choose video file to stream</span>
                              <span className="text-[10px] text-zinc-500 mt-1 block font-medium">MP4, WebM up to 50MB</span>
                            </div>
                          </div>
                          {uploadStatus && (
                            <p className="text-[10px] bg-sky-50 border border-sky-100 p-2 rounded-lg text-sky-700 font-mono leading-none flex gap-1.5 items-center">
                              <RefreshCw size={10} className="animate-spin text-sky-600" />
                              {uploadStatus}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-700 font-bold uppercase tracking-wider font-mono">External Core Video URL</label>
                          <input
                            type="url"
                            required
                            placeholder="e.g. https://www.example.com/asset.mp4"
                            value={courseForm.videoUrl}
                            onChange={(e) => setCourseForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                            className="w-full text-xs p-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 transition-all font-medium"
                          />
                        </div>
                      )}

                      {/* Confirm showing uploaded URL */}
                      {courseForm.videoUrl && (
                        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-mono break-all leading-relaxed">
                          <span className="font-bold block text-zinc-500 text-[10px] mb-1">PUBLISHING SOURCE:</span>
                          {courseForm.videoUrl}
                        </div>
                      )}

                      {/* Submit Trigger */}
                      <button
                        type="submit"
                        disabled={publishing || !courseForm.videoUrl}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                          (!courseForm.videoUrl || publishing) 
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' 
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md'
                        }`}
                      >
                        <Plus size={15} />
                        {publishing ? 'Publishing...' : 'Publish Lesson to Users'}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Published Courses Grid */}
                  <div className="lg:col-span-3 bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 h-fit space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="text-sm font-bold text-zinc-800">Currently Live Modules ({courses.length})</h3>
                      <button className="text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 p-1.5 rounded-lg bg-zinc-50 transition-colors" onClick={fetchCourses} disabled={coursesLoading}>
                        <RefreshCw size={13} className={coursesLoading ? "spinning" : ""} />
                      </button>
                    </div>

                    {coursesLoading ? (
                      <div className="text-center py-20">
                        <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-zinc-900 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">Checking video course indexes...</p>
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                        <Video size={32} className="mx-auto text-zinc-400 mb-2" />
                        <p className="text-xs text-zinc-500 font-medium">No trading modules discovered. Add some!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {courses.map((item) => (
                          <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  {item.topic}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono font-medium">⏱️ {item.duration}</span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-800 truncate">{item.title}</h4>
                              <p className="text-[10px] text-zinc-400 truncate font-mono mt-0.5">{item.videoUrl}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a 
                                href={item.videoUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 border border-zinc-200 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 rounded-lg bg-zinc-50 transition-all font-medium" 
                                title="Preview Video Source"
                              >
                                <PlayCircle size={15} />
                              </a>
                              <button 
                                onClick={() => handleDeleteCourse(item.id)}
                                className="p-2 border border-red-200 hover:border-red-350 text-red-600 hover:text-red-800 rounded-lg bg-red-50/55 transition-all font-medium" 
                                title="Delete Course Curricula"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
  
            
            {activeAdminTab === 'referrals' && (
              <motion.div
                key="referrals-manager"
                className="p-8 space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Referrals</h2>
                    <p className="text-sm text-zinc-400 max-w-xl">
                      Monitor user referrals and points data.
                    </p>
                  </div>
                  <button onClick={fetchReferrals} className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                    <RefreshCw size={18} className={referralsLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Leaderboard / User Points */}
                  <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5">
                      <h3 className="text-sm font-extrabold text-white flex items-center">
                        <Users size={16} className="mr-2 text-[#c8f135]" /> User Points Leaderboard
                      </h3>
                    </div>
                    {referralsLoading ? (
                      <div className="p-8 text-center text-zinc-500 text-xs font-semibold">Loading data...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">User</th>
                              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Referrals</th>
                              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {referralsData.users.sort((a,b) => Number(b.totalPoints) - Number(a.totalPoints)).map((u, i) => (
                              <tr key={i} className="hover:bg-white/2 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="text-xs font-bold text-white">{u.name || 'Anonymous'}</div>
                                  <div className="text-[10px] text-zinc-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-zinc-300">{u.totalReferrals}</td>
                                <td className="px-6 py-4">
                                  <span className="inline-block px-2 py-1 rounded bg-[#c8f135]/10 text-[#c8f135] text-xs font-extrabold">
                                    {u.totalPoints} pts
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {referralsData.users.length === 0 && (
                              <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-xs text-zinc-500">No users with points yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recent Referrals History */}
                  <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5">
                      <h3 className="text-sm font-extrabold text-white flex items-center">
                        <Activity size={16} className="mr-2 text-[#c8f135]" /> Recent History
                      </h3>
                    </div>
                    {referralsLoading ? (
                      <div className="p-8 text-center text-zinc-500 text-xs font-semibold">Loading data...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Referred User</th>
                              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Invited By</th>
                              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {referralsData.history.map((h, i) => (
                              <tr key={h.id} className="hover:bg-white/2 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="text-xs font-bold text-white">{h.referredEmail}</div>
                                  <div className="text-[10px] text-zinc-500">{new Date(h.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-[10px] text-zinc-400">{h.referrerEmail}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-[#c8f135]">+{h.pointsEarned}</td>
                              </tr>
                            ))}
                            {referralsData.history.length === 0 && (
                              <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-xs text-zinc-500">No referrals yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeAdminTab === 'support' && (
              <motion.div
                key="support-manager"
                className="p-8 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-zinc-900 font-mono flex items-center gap-2">
                    <Headphones size={22} className="text-zinc-500" />
                    Support & Bug Reports
                  </h2>
                  <button className="text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 p-2 rounded-lg bg-zinc-50 transition-colors" onClick={fetchSupportTickets} disabled={ticketsLoading}>
                    <RefreshCw size={15} className={ticketsLoading ? "animate-spin" : ""} />
                  </button>
                </div>
                
                {ticketsLoading ? (
                  <div className="text-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-zinc-900 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Loading tickets...</p>
                  </div>
                ) : supportTickets.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                    <p className="text-xs text-zinc-500 font-medium">No support tickets found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                                {ticket.type}
                              </span>
                              <span className="text-[10px] text-zinc-500">{new Date(ticket.createdAt).toLocaleString()}</span>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-800">{ticket.subject}</h3>
                            <p className="text-xs text-zinc-500">From: {ticket.userEmail || `User ID: ${ticket.userId}`}</p>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-700 whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg border border-zinc-100 mb-4">{ticket.description}</p>
                        
                        {ticket.mediaData && ticket.mediaType && (
                          <div className="mt-4">
                            <h4 className="text-xs font-bold text-zinc-700 mb-2">Attached Media ({ticket.mediaType}):</h4>
                            {ticket.mediaType.startsWith('image/') ? (
                              <img src={ticket.mediaData} alt="Support Media" className="max-w-full h-auto rounded-lg border border-zinc-200 max-h-[400px]" />
                            ) : ticket.mediaType.startsWith('video/') ? (
                              <video src={ticket.mediaData} controls className="max-w-full rounded-lg border border-zinc-200 max-h-[400px]" />
                            ) : (
                              <p className="text-xs text-zinc-500">Unsupported media format: {ticket.mediaType}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

  

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
