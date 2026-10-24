import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, CheckCircle, Lock, Sparkles, Video, Search, ChevronRight, Award, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EducationLearning({ theme }) {
  const isDark = theme === 'dark';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const glassCard = `rounded-2xl border p-6 transition-all ${
    isDark 
      ? 'bg-black/30 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/60 border-black/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]'
  }`;

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token missing. Please sign in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve education modules.');
      }
      setCourses(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading course materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleToggleComplete = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/courses/${courseId}/toggle-progress`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Update local list
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, completed: data.completed } : c));
        
        // Update selected module object dynamically
        if (selectedModule && selectedModule.id === courseId) {
          setSelectedModule(prev => ({ ...prev, completed: data.completed }));
        }

        // Celebrate completion
        if (data.completed) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#c8f135', '#10b981', '#3b82f6']
          });
        }
      }
    } catch (err) {
      console.error("Error toggling completion:", err);
    }
  };

  // Stats calculation
  const totalCount = courses.length;
  const completedCount = courses.filter(c => c.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter topics
  const topics = ['All', ...new Set(courses.map(c => c.topic))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || course.topic === activeTab;
    return matchesSearch && matchesTab;
  });

  if (selectedModule) {
    return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
           <button 
             onClick={() => {
               setSelectedModule(null);
               fetchCourses(); // refresh progress in list
             }} 
             className={`text-xs font-semibold px-4 py-2 rounded-xl border flex items-center gap-2 hover:opacity-80 transition-all ${
               isDark ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-black/5 text-zinc-700'
             }`}
           >
             ← Core Library Modules
           </button>
           
           <span className="text-xs font-mono opacity-50">Theatre Mode</span>
         </div>

         {/* Cinematic Theatre Video Player Board */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-4">
             <div className={`${glassCard} overflow-hidden p-0 border-[#c8f135]/15`}>
               <div className="relative aspect-video bg-black flex items-center justify-center">
                 {selectedModule.videoUrl ? (
                   <video 
                     src={selectedModule.videoUrl} 
                     controls 
                     className="w-full h-full object-contain"
                     poster="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1000"
                     
                   />
                 ) : (
                   <div className="text-center p-8">
                     <Video size={48} className="mx-auto text-zinc-600 mb-2" />
                     <p className="text-sm text-zinc-400">Video source currently unavailable.</p>
                   </div>
                 )}
               </div>
               
               <div className="p-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div>
                     <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 ${
                       isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                     }`}>
                       {selectedModule.topic}
                     </span>
                     <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                       {selectedModule.title}
                     </h2>
                   </div>
                   
                   <button 
                     onClick={() => handleToggleComplete(selectedModule.id)}
                     className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                       selectedModule.completed 
                         ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                         : isDark 
                           ? 'bg-gradient-to-r from-[#c8f135] to-[#aee015] text-black hover:brightness-110' 
                           : 'bg-black text-white hover:bg-zinc-800'
                     }`}
                   >
                     <CheckCircle size={15} />
                     {selectedModule.completed ? 'Completed' : 'Mark as Completed'}
                   </button>
                 </div>
               </div>
             </div>
           </div>

           {/* Lesson details bar */}
           <div className="space-y-4">
             <div className={glassCard}>
               <div className="flex items-center gap-2 mb-4 text-[#c8f135]">
                 <Sparkles size={16} />
                 <h4 className="text-xs uppercase font-extrabold tracking-wider">Intervention Synopsis</h4>
               </div>
               
               <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                 Our proprietary behavioral metrics match your trade journal's emotional triggers directly with these educational videos. Watching this clip helps retrain neural risk loops.
               </p>

               <div className="space-y-3.5 border-t border-zinc-500/10 pt-4">
                 <div className="flex justify-between text-xs">
                   <span className="text-zinc-500">Duration</span>
                   <span className="font-semibold text-zinc-300">{selectedModule.duration}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                   <span className="text-zinc-500">Status</span>
                   <span className={`font-semibold ${selectedModule.completed ? 'text-emerald-400' : 'text-amber-500'}`}>
                     {selectedModule.completed ? 'Passed / Completed' : 'In Progress'}
                   </span>
                 </div>
                 <div className="flex justify-between text-xs">
                   <span className="text-zinc-500">Methodology</span>
                   <span className="font-semibold text-zinc-300">Cognitive Trading</span>
                 </div>
               </div>
             </div>

             {/* Dynamic course deck navigator */}
             <div className={`${glassCard} max-h-[190px] overflow-y-auto custom-scrollbar`}>
               <h4 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 mb-3">Other Lessons</h4>
               <div className="space-y-2">
                 {courses.filter(c => c.id !== selectedModule.id).slice(0, 3).map((other) => (
                   <div 
                     key={other.id}
                     onClick={() => setSelectedModule(other)}
                     className="p-2 border border-zinc-500/5 hover:border-[#c8f135]/30 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-all"
                   >
                     <div className="truncate pr-2">
                       <p className="font-medium text-zinc-300 truncate">{other.title}</p>
                       <span className="text-[10px] text-zinc-500">{other.topic}</span>
                     </div>
                     <ChevronRight size={14} className="text-zinc-500" />
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total stats */}
        <div className={glassCard}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold">Active Syllabus</p>
              <h3 className="text-3xl font-semibold tracking-tight mt-1">{totalCount} Modules</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        {/* Completed Stats */}
        <div className={glassCard}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">My Completed</p>
              <h3 className="text-3xl font-semibold tracking-tight text-emerald-400 mt-1">{completedCount} Completed</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Award size={24} />
            </div>
          </div>
        </div>

        {/* Progress gauge */}
        <div className={glassCard}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Knowledge Coverage</p>
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-zinc-500">Overall Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-500/10">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#c8f135] to-emerald-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
        <div className="flex gap-2 p-1 bg-zinc-500/5 border border-zinc-500/10 rounded-xl overflow-x-auto max-w-full">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === t
                  ? isDark 
                    ? 'bg-white text-black font-semibold' 
                    : 'bg-black text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input
            type="text"
            placeholder="Search curricula & focus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border outline-none placeholder-zinc-500 transition-all ${
              isDark 
                ? 'bg-zinc-950 border-white/5 text-zinc-200 focus:border-[#c8f135]/50' 
                : 'bg-white border-black/5 text-zinc-800 focus:border-black'
            }`}
          />
        </div>
      </div>

      {/* 3. Core Materials Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#c8f135] animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500 font-mono">Syncing educational library...</p>
        </div>
      ) : error ? (
        <div className="text-center p-12 border border-rose-500/20 bg-rose-500/5 rounded-2xl">
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-500/10 rounded-2xl">
          <p className="text-xs text-zinc-500">No trading modules found matching your request.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((mod) => (
            <div 
              key={mod.id} 
              className={`${glassCard} flex flex-col cursor-pointer transition-all border-zinc-500/10 hover:border-[#c8f135]/40 hover:-translate-y-0.5 group`}
              onClick={() => setSelectedModule(mod)}
            >
              <div className="flex justify-between items-start mb-6">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                  isDark ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-650'
                }`}>
                  {mod.topic}
                </span>
                
                <div className={`p-2.5 rounded-xl text-xs transition-colors ${
                  mod.completed 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : isDark ? 'bg-zinc-850 text-[#c8f135]' : 'bg-zinc-100 text-[#101010]'
                }`}>
                  <PlayCircle size={18} />
                </div>
              </div>
              
              <h3 className={`text-base font-semibold tracking-tight mb-2 group-hover:text-[#c8f135] transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {mod.title}
              </h3>
              
              <div className="flex items-center gap-1.5 opacity-60 text-[11px] mb-6">
                <Clock size={12} />
                <span>{mod.duration}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-zinc-500/5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-medium">Status</span>
                <span className={`text-[11px] font-semibold ${mod.completed ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {mod.completed ? 'Passed / Completed' : 'Incomplete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
