import React, { useState } from 'react';
import { 
  ArrowRight, 
  Clock, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  X,
  Share2,
  Bookmark
} from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '../../data/blogData';

interface BlogSectionProps {
  onSelectArticle?: (post: BlogPost) => void;
}

export default function BlogSection({ onSelectArticle }: BlogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Market Intelligence', 'Risk & Psychology', 'Trading Guides', 'AI & Algorithms'];

  const filteredPosts = selectedCategory === 'All' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(p => p.category === selectedCategory);

  const featuredPost = BLOG_POSTS.find(p => p.featured) || BLOG_POSTS[0];

  const handleOpenArticle = (post: BlogPost) => {
    setActivePost(post);
    if (onSelectArticle) {
      onSelectArticle(post);
    }
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="blog" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase">
                RESEARCH & INSIGHTS
              </span>
              <div className="w-8 h-0.5 bg-[#2563EB] rounded-full" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
              Market Intelligence & Guides
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl">
              Actionable frameworks, quantitative research, and behavioral psychology strategies to sharpen your trading edge.
            </p>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article Hero Card */}
        {selectedCategory === 'All' && (
          <div 
            onClick={() => handleOpenArticle(featuredPost)}
            className="group cursor-pointer mb-12 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
          >
            <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full min-h-[280px] overflow-hidden">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Featured Deep Dive</span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    {featuredPost.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {featuredPost.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {featuredPost.readTime}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors leading-snug mb-3">
                  {featuredPost.title}
                </h3>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <img 
                    src={featuredPost.author.avatar} 
                    alt={featuredPost.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{featuredPost.author.name}</div>
                    <div className="text-xs text-slate-500">{featuredPost.author.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => toggleSave(featuredPost.id, e)}
                    className="p-2 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                    aria-label="Bookmark article"
                  >
                    <Bookmark size={18} className={savedPosts[featuredPost.id] ? 'fill-blue-600 text-blue-600' : ''} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosts.map((post) => (
            <article 
              key={post.id}
              onClick={() => handleOpenArticle(post)}
              className="group cursor-pointer bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-300 hover:translate-y-[-2px] transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200/80 shadow-sm">
                    {post.category}
                  </div>
                  <button
                    onClick={(e) => toggleSave(post.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-[#2563EB] shadow-sm transition-colors"
                  >
                    <Bookmark size={14} className={savedPosts[post.id] ? 'fill-blue-600 text-blue-600' : ''} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors leading-snug mb-2.5">
                    {post.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-semibold text-slate-700">{post.author.name}</span>
                </div>

                <span className="text-xs font-bold text-[#2563EB] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Read article <ArrowRight size={13} />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner with Newsletter / Education CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#070D1B] to-[#1E293B] rounded-3xl p-8 sm:p-10 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen size={14} />
              <span>Weekly Market Journal</span>
            </div>
            <h4 className="text-2xl font-bold text-white mb-1">
              Want actionable institutional setups in your inbox?
            </h4>
            <p className="text-sm text-slate-300 max-w-xl">
              Join 40,000+ Indian retail traders receiving our Sunday market breakdown, option chain levels, and risk setups.
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you for subscribing to RetailX Weekly Market Journal!');
            }}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0"
          >
            <input 
              type="email" 
              placeholder="Enter your email address" 
              required
              className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 min-w-[260px]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] whitespace-nowrap"
            >
              Subscribe Free
            </button>
          </form>
        </div>

      </div>

      {/* Reader Modal for Full Article View */}
      {activePost && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setActivePost(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-t-3xl">
              <img 
                src={activePost.image} 
                alt={activePost.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <button 
                onClick={() => setActivePost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center transition-all shadow-md"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                  {activePost.category}
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                  {activePost.title}
                </h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800">
              {/* Author & Meta */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img 
                    src={activePost.author.avatar} 
                    alt={activePost.author.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{activePost.author.name}</div>
                    <div className="text-xs text-slate-500">{activePost.author.role}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{activePost.date}</span>
                  <span>•</span>
                  <span>{activePost.readTime}</span>
                </div>
              </div>

              {/* Intro Paragraph */}
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                {activePost.content.intro}
              </p>

              {/* Subheadings & Paragraphs */}
              <div className="space-y-6">
                {activePost.content.subheadings.map((sub, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-900">{sub.title}</h4>
                    {sub.body.map((p, pIdx) => (
                      <p key={pIdx} className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Key Takeaways Box */}
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 space-y-3">
                <h5 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <Sparkles size={16} className="text-blue-600" />
                  Key Actionable Takeaways
                </h5>
                <ul className="space-y-2">
                  {activePost.content.takeaways.map((takeaway, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-blue-950 flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modal Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Article link copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#2563EB] px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Share2 size={14} />
                  <span>Share Article</span>
                </button>

                <button
                  onClick={() => setActivePost(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Close Article
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
