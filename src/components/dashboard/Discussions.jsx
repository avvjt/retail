import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Trash2, Send, ChevronDown, ChevronUp, AlertCircle, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export default function Discussions({ theme }) {
  const isDark = theme === 'dark';

  // State managers
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });

  // Post composer state
  const [newPostContent, setNewPostContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState(null);

  // Comments state: expanded posts, loading states, cache, error, and new comment composer state per post
  const [expandedPosts, setExpandedPosts] = useState({}); // { [postId]: boolean }
  const [commentsCache, setCommentsCache] = useState({}); // { [postId]: [comments] }
  const [commentsLoading, setCommentsLoading] = useState({}); // { [postId]: boolean }
  const [commentsError, setCommentsError] = useState({}); // { [postId]: string }
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: string }
  const [commentSubmitting, setCommentSubmitting] = useState({}); // { [postId]: boolean }
  const [commentErrors, setCommentErrors] = useState({}); // { [postId]: string }

  useEffect(() => {
    fetchMe();
    fetchPosts(1);
  }, []);

  // Fetch current logged-in user profile to identify author and admin privileges
  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Error fetching me details inside Discussions:", err);
    }
  };

  // Fetch paginated discussion posts
  const fetchPosts = async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/discussions?page=${targetPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve discussion posts');
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
      setPage(data.pagination.page);
    } catch (err) {
      console.error("Error fetching discussions:", err);
      setError('An error occurred while fetching community discussions.');
    } finally {
      setLoading(false);
    }
  };

  // Create new discussion post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError(null);
    if (!newPostContent.trim()) return;

    setPostSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPostContent })
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

      // Success
      setNewPostContent('');
      // Prepend to current feed and update total count locally
      setPosts(prev => [data, ...prev]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    } catch (err) {
      console.error(err);
      setPostError(err instanceof Error ? err.message : 'Failed to publish discussion post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  // Fetch comments for a specific post
  const fetchCommentsForPost = async (postId) => {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    setCommentsError(prev => ({ ...prev, [postId]: null }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/discussions/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setCommentsCache(prev => ({ ...prev, [postId]: data.comments }));
    } catch (err) {
      console.error(`Error loading comments for post ${postId}:`, err);
      setCommentsError(prev => ({ ...prev, [postId]: 'Failed to retrieve comments thread.' }));
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle comments thread expansion
  const handleToggleComments = async (postId) => {
    const isExpanded = expandedPosts[postId];
    setExpandedPosts(prev => ({ ...prev, [postId]: !isExpanded }));

    // Fetch comments if expanding and not already loaded in memory
    if (!isExpanded && !commentsCache[postId]) {
      await fetchCommentsForPost(postId);
    }
  };

  // Submit new comment under a post
  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    setCommentErrors(prev => ({ ...prev, [postId]: null }));
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/discussions/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
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
        throw new Error(data.error || 'Failed to submit comment');
      }

      // Success
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // Update cache
      setCommentsCache(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      // Update post comment count locally
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentCount: (p.commentCount || 0) + 1 };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
      setCommentErrors(prev => ({
        ...prev,
        [postId]: err instanceof Error ? err.message : 'Failed to publish comment.'
      }));
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this discussion post? This action is irreversible.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/discussions/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete discussion post');

      // Remove locally
      setPosts(prev => prev.filter(p => p.id !== postId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error(err);
      alert('Failed to delete post. Please try again.');
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/discussions/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete comment');

      // Update cache
      setCommentsCache(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }));
      // Decrement count locally
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to delete comment.');
    }
  };

  // Format timestamps neatly
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header banner */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#c8f135]/15 text-[#c8f135]' : 'bg-black/5 text-black'}`}>
            <MessageSquare size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">Community Discussions</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Share analytical observations, discuss charts, patterns, and historical statistics safely.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchPosts(1)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          <RefreshCw size={14} className="animate-hover-spin" /> Refresh Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Guidelines & Create Post Composer */}
        <div className="space-y-6">
          
          {/* SEBI Notice and Rules */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10 text-white' : 'bg-white border-black/5 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-3 text-amber-500">
              <ShieldAlert size={18} />
              <h3 className="font-bold text-sm">Regulatory Compliance Notice</h3>
            </div>
            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              To maintain compliance on this retail platform, we strictly prohibit direct trade recommendations. Discuss metrics, indicator readings, or patterns—never provide buy/sell targets.
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No signal tips or price target predictions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Banned keywords (buy, sell, guaranteed, short) are automatically blocked.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Descriptive, chart-based pattern analysis is highly encouraged.</span>
              </li>
            </ul>
          </div>

          {/* New Discussion Composer */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className="font-bold text-sm mb-4">Start a Discussion</h3>
            
            <form onSubmit={handleCreatePost} className="space-y-4" id="new-discussion-form">
              <div>
                <textarea
                  id="new-discussion-content"
                  required
                  placeholder="Describe your current market observations (e.g., 'Noticed a clean double bottom structure developing on NIFTY50 15m chart with RSI indicators stabilizing...')"
                  value={newPostContent}
                  onChange={(e) => {
                    setNewPostContent(e.target.value);
                    if (postError) setPostError(null);
                  }}
                  rows={4}
                  maxLength={2000}
                  className={`w-full p-3 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 ${isDark ? 'bg-white/5 border border-white/10 text-white focus:ring-[#c8f135]' : 'bg-white border border-gray-200 focus:ring-black'}`}
                />
                <div className="flex justify-between items-center mt-1.5 text-[10px] text-gray-400 font-bold">
                  <span>Character count:</span>
                  <span className={newPostContent.length >= 1900 ? "text-red-500" : ""}>
                    {newPostContent.length} / 2000
                  </span>
                </div>
              </div>

              {postError && (
                <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-2 text-xs text-red-500 leading-relaxed" id="post-error-alert">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{postError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={postSubmitting || !newPostContent.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                  isDark
                    ? 'bg-[#c8f135] text-black hover:bg-[#b0d62d] disabled:opacity-50 disabled:hover:bg-[#c8f135]'
                    : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black'
                }`}
                id="submit-discussion-post-btn"
              >
                {postSubmitting ? 'Publishing Observation...' : 'Post Observation'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Discussions Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" /> Recent Observations Feed
            </h3>

            {error && (
              <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-500 mb-6">
                {error}
              </div>
            )}

            {/* Skeletons Loader */}
            {loading && posts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className={`p-5 rounded-2xl border ${isDark ? 'border-white/5 bg-white/2' : 'border-gray-100 bg-gray-50'} animate-pulse`}>
                    <div className="flex justify-between mb-3">
                      <div className="h-4 w-32 bg-gray-400/20 rounded-md"></div>
                      <div className="h-4 w-16 bg-gray-400/20 rounded-md"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 w-full bg-gray-400/20 rounded-md"></div>
                      <div className="h-3 w-3/4 bg-gray-400/20 rounded-md"></div>
                    </div>
                    <div className="h-4 w-24 bg-gray-400/20 rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              /* Honest empty state */
              <div className="text-center py-16 px-4" id="empty-discussions-state">
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                  <MessageSquare size={26} />
                </div>
                <h4 className={`text-sm font-bold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>No discussions yet</h4>
                <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Be the first to post! Share your clean, objective technical patterns or market observation analysis using the composer.
                </p>
              </div>
            ) : (
              /* Feed items */
              <div className="space-y-6">
                {posts.map((post) => {
                  const isPostExpanded = expandedPosts[post.id];
                  const comments = commentsCache[post.id] || [];
                  const isCommentsLoading = commentsLoading[post.id];
                  const postCommentsError = commentsError[post.id];
                  const inputVal = commentInputs[post.id] || '';
                  const isCommentSubmitting = commentSubmitting[post.id];
                  const commentError = commentErrors[post.id];

                  const isAuthor = currentUser && currentUser.id === post.userId;
                  const isAdmin = currentUser && currentUser.isAdmin === true;
                  const canDeletePost = isAuthor || isAdmin;

                  return (
                    <div
                      key={post.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isDark 
                          ? 'bg-[#181818] border-white/5 hover:border-white/10' 
                          : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                      }`}
                      id={`discussion-post-${post.id}`}
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            {post.authorEmail}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">•</span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-semibold">
                            <Clock size={11} /> {formatTime(post.createdAt)}
                          </span>
                        </div>

                        {canDeletePost && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10"
                            title="Delete discussion post"
                            id={`delete-post-btn-${post.id}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {post.content}
                      </p>

                      {/* Post Footer Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-dashed border-gray-200/10 dark:border-white/5">
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                            isPostExpanded
                              ? (isDark ? 'text-[#c8f135]' : 'text-black')
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          id={`toggle-comments-btn-${post.id}`}
                        >
                          <MessageSquare size={13} />
                          <span>
                            {post.commentCount > 0 ? `${post.commentCount} Comments` : 'Add Comment'}
                          </span>
                          {isPostExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* Comments Thread (Expanded Inline) */}
                      {isPostExpanded && (
                        <div className="mt-5 pl-3 sm:pl-5 border-l-2 border-gray-200/20 dark:border-white/5 space-y-4 pt-1">
                          
                          {/* Comments List */}
                          {isCommentsLoading && comments.length === 0 ? (
                            <div className="text-xs text-gray-500 animate-pulse py-2">
                              Loading discussion comments...
                            </div>
                          ) : postCommentsError ? (
                            <div className="text-xs text-red-500 py-1">
                              {postCommentsError}
                            </div>
                          ) : comments.length === 0 ? (
                            <p className="text-[11px] text-gray-500 italic py-1">
                              No comments yet. Write the first response!
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {comments.map((comment) => {
                                const isCommentAuthor = currentUser && currentUser.id === comment.userId;
                                const canDeleteComment = isCommentAuthor || isAdmin;

                                return (
                                  <div
                                    key={comment.id}
                                    className={`p-3 rounded-xl ${
                                      isDark ? 'bg-white/2' : 'bg-white border border-gray-100'
                                    }`}
                                    id={`comment-${comment.id}`}
                                  >
                                    <div className="flex items-center justify-between gap-4 mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                          {comment.authorEmail}
                                        </span>
                                        <span className="text-[9px] text-gray-500 font-bold">•</span>
                                        <span className="text-[9px] text-gray-500 font-semibold">
                                          {formatTime(comment.createdAt)}
                                        </span>
                                      </div>

                                      {canDeleteComment && (
                                        <button
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          className="text-gray-500 hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-red-500/10"
                                          title="Delete comment"
                                          id={`delete-comment-btn-${comment.id}`}
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {comment.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Comment Reply Composer */}
                          <form
                            onSubmit={(e) => handleCreateComment(e, post.id)}
                            className="pt-2"
                            id={`comment-form-${post.id}`}
                          >
                            <div className="flex gap-2">
                              <input
                                id={`comment-input-${post.id}`}
                                type="text"
                                required
                                maxLength={500}
                                placeholder="Add your constructive response..."
                                value={inputVal}
                                onChange={(e) => {
                                  setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }));
                                  if (commentError) {
                                    setCommentErrors(prev => ({ ...prev, [post.id]: null }));
                                  }
                                }}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none ${
                                  isDark
                                    ? 'bg-white/5 border border-white/10 text-white focus:ring-1 focus:ring-[#c8f135]'
                                    : 'bg-white border border-gray-200 focus:ring-1 focus:ring-black'
                                }`}
                              />
                              <button
                                type="submit"
                                disabled={isCommentSubmitting || !inputVal.trim()}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                                  isDark
                                    ? 'bg-white text-black hover:bg-gray-100 disabled:opacity-50'
                                    : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50'
                                }`}
                                id={`submit-comment-btn-${post.id}`}
                              >
                                {isCommentSubmitting ? 'Posting...' : <Send size={11} />}
                              </button>
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[9px] text-gray-500 font-bold px-1">
                              <span>Max 500 chars</span>
                              <span>{inputVal.length} / 500</span>
                            </div>

                            {commentError && (
                              <div className="mt-2 p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 flex items-start gap-1.5" id={`comment-error-${post.id}`}>
                                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                <span>{commentError}</span>
                              </div>
                            )}
                          </form>

                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200/5" id="feed-pagination-controls">
                    <button
                      onClick={() => fetchPosts(page - 1)}
                      disabled={page <= 1}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isDark 
                          ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 disabled:opacity-30 disabled:hover:bg-gray-50'
                      }`}
                      id="prev-page-btn"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500 font-bold">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => fetchPosts(page + 1)}
                      disabled={page >= pagination.pages}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isDark 
                          ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 disabled:opacity-30 disabled:hover:bg-gray-50'
                      }`}
                      id="next-page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
