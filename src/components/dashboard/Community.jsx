import React, { useState, useEffect } from 'react';
import { Users, Copy, Send, MessageSquare, Sparkles } from 'lucide-react';

export default function Community({ theme }) {
  const isDark = theme === 'dark';
  
  // Post state managers (initialised to empty strings)
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostIndicator, setNewPostIndicator] = useState('EMA');
  const [newPostBuy, setNewPostBuy] = useState(30);
  const [newPostSell, setNewPostSell] = useState(70);
  
  // Real backtest stats fields (required now)
  const [newPostWinRate, setNewPostWinRate] = useState('');
  const [newPostTotalTrades, setNewPostTotalTrades] = useState('');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState(null);
  const [error, setError] = useState(null);

  // Inline Clone feedback states keyed by postId
  const [cloneMessages, setCloneMessages] = useState({});
  const [cloneErrors, setCloneErrors] = useState({});

  // Comments state managers (keyed by postId)
  const [expandedPosts, setExpandedPosts] = useState({});
  const [comments, setComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentsError, setCommentsError] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [commentPostErrors, setCommentPostErrors] = useState({});

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  const fetchCommunityPosts = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/community/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download community feeds');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching community strategies feed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/community/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPostTitle,
          description: newPostDesc,
          winRate: newPostWinRate,
          totalTrades: newPostTotalTrades ? Number(newPostTotalTrades) : 0,
          rulesJson: {
            indicator: newPostIndicator,
            buyValue: newPostBuy,
            sellValue: newPostSell
          }
        })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }
      
      // Reset fields to empty values (no canned examples)
      setNewPostTitle('');
      setNewPostDesc('');
      setNewPostWinRate('');
      setNewPostTotalTrades('');
      
      await fetchCommunityPosts();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to share strategy idea.');
    }
  };

  const handleClone = async (postId) => {
    setCloningId(postId);
    setCloneMessages(prev => ({ ...prev, [postId]: null }));
    setCloneErrors(prev => ({ ...prev, [postId]: null }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/community/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      if (!res.ok) throw new Error(data.error || 'Failed to clone strategy');
      
      setCloneMessages(prev => ({
        ...prev,
        [postId]: `${data.message || 'Successfully cloned strategy!'} This configuration has been copied to your Quantitative Algo Builder.`
      }));
    } catch (err) {
      console.error(err);
      setCloneErrors(prev => ({
        ...prev,
        [postId]: err instanceof Error ? err.message : 'Cloning failed. Make sure you are subscribed to Pro to save strategies.'
      }));
    } finally {
      setCloningId(null);
    }
  };

  // Comments Actions
  const fetchComments = async (postId) => {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    setCommentsError(prev => ({ ...prev, [postId]: null }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error(err);
      setCommentsError(prev => ({ ...prev, [postId]: err.message || 'Failed to fetch comments' }));
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    const isNowExpanded = !expandedPosts[postId];
    setExpandedPosts(prev => ({ ...prev, [postId]: isNowExpanded }));
    if (isNowExpanded) {
      fetchComments(postId);
    }
  };

  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    const content = commentInputs[postId] || '';
    if (!content.trim()) return;

    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    setCommentPostErrors(prev => ({ ...prev, [postId]: null }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      if (!res.ok) throw new Error(data.error || 'Failed to add comment');

      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // Prepend comment
      setComments(prev => ({
        ...prev,
        [postId]: [data, ...(prev[postId] || [])]
      }));
    } catch (err) {
      console.error(err);
      setCommentPostErrors(prev => ({
        ...prev,
        [postId]: err instanceof Error ? err.message : 'Failed to post comment'
      }));
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top section */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-[#0b1329] border-cyan-500/15' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' : 'bg-black/5 text-black'}`}>
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">Alpha Share Community</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Discover, audit, and securely clone technical trading strategies curated by fellow platform members.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Post creation panel */}
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B132B] border-cyan-500/20' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className="font-bold text-sm mb-4 text-cyan-400 flex items-center gap-2">
              <Sparkles size={14} />
              <span>Share Strategy Template</span>
            </h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Strategy Header Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Golden Cross Breakthrough"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200 focus:ring-1 focus:ring-black'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Strategy Overview / Notes</label>
                <textarea
                  required
                  placeholder="Explain why this setup has high-probability risk-to-reward ratios. Describe buy/sell metrics."
                  value={newPostDesc}
                  onChange={(e) => setNewPostDesc(e.target.value)}
                  rows={3}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200 focus:ring-1 focus:ring-black'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Underlying Indicator Logic</label>
                <select
                  value={newPostIndicator}
                  onChange={(e) => setNewPostIndicator(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200'}`}
                >
                  <option value="RSI">Relative Strength Index (RSI)</option>
                  <option value="EMA">EMA Cross (5D vs 20D MA)</option>
                  <option value="SUPERTREND">Supertrend ATR Channel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Buy Level</label>
                  <input
                    type="number"
                    value={newPostBuy === undefined || isNaN(newPostBuy) ? '' : newPostBuy}
                    onChange={(e) => setNewPostBuy(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Sell Level</label>
                  <input
                    type="number"
                    value={newPostSell === undefined || isNaN(newPostSell) ? '' : newPostSell}
                    onChange={(e) => setNewPostSell(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Win Rate (%)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 65.5%"
                    value={newPostWinRate}
                    onChange={(e) => setNewPostWinRate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Total Trades</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 50"
                    value={newPostTotalTrades === undefined || isNaN(newPostTotalTrades) ? '' : newPostTotalTrades}
                    onChange={(e) => setNewPostTotalTrades(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none ${isDark ? 'bg-slate-900 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400' : 'bg-white border border-gray-200'}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 mt-4 ${
                  isDark ? 'bg-cyan-500 text-black hover:bg-cyan-400' : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                <Send size={12} /> Share with Community Feed
              </button>

            </form>
          </div>
        </div>

        {/* Live Shared Feed column */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B132B] border-cyan-500/20' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className="font-bold text-sm mb-4 text-cyan-400">Active Shared Strategies Stream</h3>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">No community posts published yet. Be the first to share your breakthrough algorithm!</p>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => {
                  const displayName = post.creatorEmail ? post.creatorEmail.split('@')[0] : 'anonymous';
                  const isPostExpanded = expandedPosts[post.id];
                  
                  return (
                    <div key={post.id} className={`p-6 rounded-2xl border ${isDark ? 'border-cyan-500/10 bg-slate-900/40' : 'bg-white border-gray-200'} text-xs flex flex-col justify-between gap-4 transition-all hover:scale-[1.005]`}>
                      
                      <div>
                        {/* Author + Timestamp Row */}
                        <div className="flex items-center justify-between mb-3 border-b border-cyan-500/5 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                              {post.creatorEmail ? post.creatorEmail[0].toUpperCase() : 'A'}
                            </div>
                            <span className="font-bold text-xs text-cyan-400">
                              @{displayName}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatTime(post.sharedAt)}
                          </span>
                        </div>
                        
                        <h4 className="font-bold text-sm text-white mb-2">{post.strategyName}</h4>
                        <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {post.description}
                        </p>
                        
                        {/* Blueprint spec cards */}
                        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 text-[8px] font-bold uppercase block tracking-wider mb-0.5">Logic Core</span>
                            <span className="font-extrabold text-cyan-400">{post.rulesJson?.indicator || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[8px] font-bold uppercase block tracking-wider mb-0.5">Buy Rule</span>
                            <span className="font-extrabold text-white">{post.rulesJson?.buyValue || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[8px] font-bold uppercase block tracking-wider mb-0.5">Sell Rule</span>
                            <span className="font-extrabold text-white">{post.rulesJson?.sellValue || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[8px] font-bold uppercase block tracking-wider mb-0.5">Performance</span>
                            <span className="font-extrabold text-emerald-400">{post.winRate} / {post.totalTrades} Trades</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive controls */}
                      <div className="flex flex-col gap-3 pt-2.5 border-t border-cyan-500/5 text-gray-400">
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
                          >
                            <MessageSquare size={13} className="text-cyan-400" />
                            <span>
                              Comments {comments[post.id]?.length > 0 ? `(${comments[post.id].length})` : ''}
                            </span>
                          </button>

                          <button
                            onClick={() => handleClone(post.id)}
                            disabled={cloningId === post.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 font-bold text-[10px] transition-colors"
                          >
                            <Copy size={12} />
                            <span>{cloningId === post.id ? 'Cloning...' : 'Clone Strategy'}</span>
                          </button>
                        </div>

                        {/* Inline status banner for clone actions */}
                        {cloneMessages[post.id] && (
                          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] flex justify-between items-start gap-2">
                            <span>{cloneMessages[post.id]}</span>
                            <button 
                              onClick={() => setCloneMessages(prev => ({ ...prev, [post.id]: null }))}
                              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {cloneErrors[post.id] && (
                          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] flex justify-between items-start gap-2">
                            <span>{cloneErrors[post.id]}</span>
                            <button 
                              onClick={() => setCloneErrors(prev => ({ ...prev, [post.id]: null }))}
                              className="text-red-400 hover:text-red-300 font-bold text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Collapsible comment thread */}
                      {isPostExpanded && (
                        <div className="mt-4 pl-4 border-l-2 border-cyan-500/10 space-y-4 pt-2">
                          {/* Comments List */}
                          {commentsLoading[post.id] && (!comments[post.id] || comments[post.id].length === 0) ? (
                            <div className="text-xs text-gray-500 animate-pulse py-1">
                              Loading comments...
                            </div>
                          ) : commentsError[post.id] ? (
                            <div className="text-xs text-red-500 py-1">
                              {commentsError[post.id]}
                            </div>
                          ) : (!comments[post.id] || comments[post.id].length === 0) ? (
                            <p className="text-[10px] text-gray-500 italic py-1">
                              No comments yet. Write the first response!
                            </p>
                          ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                              {comments[post.id].map((comment) => {
                                const commentAuthor = comment.commenterEmail ? comment.commenterEmail.split('@')[0] : 'anonymous';
                                return (
                                  <div
                                    key={comment.id}
                                    className={`p-2.5 rounded-xl ${
                                      isDark ? 'bg-slate-900 border border-white/5' : 'bg-gray-50 border border-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-[10px] text-cyan-400">
                                        @{commentAuthor}
                                      </span>
                                      <span className="text-[9px] text-gray-500 font-medium">
                                        {formatTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {comment.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Inline comment post error banner */}
                          {commentPostErrors[post.id] && (
                            <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] flex justify-between items-start gap-2">
                              <span>{commentPostErrors[post.id]}</span>
                              <button 
                                type="button"
                                onClick={() => setCommentPostErrors(prev => ({ ...prev, [post.id]: null }))}
                                className="text-red-400 hover:text-red-300 font-bold text-xs"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          {/* Comment Reply Composer */}
                          <form
                            onSubmit={(e) => handleCreateComment(e, post.id)}
                            className="flex gap-2 pt-1"
                          >
                            <input
                              type="text"
                              required
                              maxLength={500}
                              placeholder="Add your constructive response..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => {
                                setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }));
                              }}
                              className={`flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none ${
                                isDark
                                  ? 'bg-slate-950 border border-cyan-500/20 text-white focus:ring-1 focus:ring-cyan-400'
                                  : 'bg-white border border-gray-200 focus:ring-1 focus:ring-black'
                              }`}
                            />
                            <button
                              type="submit"
                              disabled={commentSubmitting[post.id] || !(commentInputs[post.id] || '').trim()}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                                isDark
                                  ? 'bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50'
                                  : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50'
                              }`}
                            >
                              {commentSubmitting[post.id] ? 'Posting...' : <Send size={11} />}
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Required Disclaimer */}
      <div className={`p-4 rounded-xl border text-center text-xs ${isDark ? 'bg-slate-900 border-cyan-500/10 text-gray-400' : 'bg-gray-100 border-black/5 text-gray-500'}`}>
        Educational information, not investment advice.
      </div>
    </div>
  );
}
