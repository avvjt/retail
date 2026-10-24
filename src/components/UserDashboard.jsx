import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Play, 
  Activity, 
  BookOpen, 
  Brain, 
  Bell, 
  BarChart2, 
  GraduationCap, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Sun, 
  Moon, 
  TrendingUp, 
  Star, 
  Layers, 
  Grid3x3, 
  Cpu, 
  Link, 
  Users, 
  CreditCard, 
  Radar, 
  Sparkles, 
  Bot, 
  Phone, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Search,
  Compass,
  Sliders,
  ShieldCheck,
  Newspaper,
  Building2,
  FileBarChart,
  HelpCircle,
  Crown,
  Home,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
  CandlestickChart
} from 'lucide-react';
import ProfileSettings from './dashboard/ProfileSettings';
import FloatingCopilot from './dashboard/FloatingCopilot';
import TradingQuizModal from './dashboard/TradingQuizModal';
import RetailXLogo from './common/RetailXLogo';
import UniversalSearchModal from './common/UniversalSearchModal';
import { 
  isNotificationSupported, 
  getNotificationPermissionState, 
  requestNotificationPermission, 
  notifyUserOfAlert,
  isInsideIframe
} from '../utils/notifications';

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState('light');

  // Keep Tailwind's dark: variants in sync with the app's day/night toggle
  // (instead of the phone's system setting).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    return localStorage.getItem('retailx_desktop_sidebar_collapsed') === 'true';
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Live IST Clock & Market Status
  const [istTimeStr, setIstTimeStr] = useState('');
  const [marketStatus, setMarketStatus] = useState('Market Closed');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setIstTimeStr(`${datePart}  ${timePart}`);

      // Market Hours: Mon-Fri 09:15 - 15:30 IST, Pre-Market 09:00 - 09:15, Post-Market 15:30 - 16:00
      const kolkataTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const kolkataDate = new Date(kolkataTimeStr);
      const day = kolkataDate.getDay();
      const minutes = kolkataDate.getHours() * 60 + kolkataDate.getMinutes();
      const isWeekday = (day >= 1 && day <= 5);
      
      let status = 'Market Closed';
      if (isWeekday) {
        if (minutes >= 540 && minutes < 555) {
          status = 'Pre-Market';
        } else if (minutes >= 555 && minutes < 930) {
          status = 'Market Open';
        } else if (minutes >= 930 && minutes < 960) {
          status = 'Post-Market';
        } else {
          status = 'Market Closed';
        }
      } else {
        status = 'Market Closed';
      }
      setMarketStatus(status);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for custom search trigger
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open_universal_search', handleOpenSearch);
    return () => window.removeEventListener('open_universal_search', handleOpenSearch);
  }, []);

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('retailx_desktop_sidebar_collapsed', String(next));
      return next;
    });
  };
  const [user, setUser] = useState(null);
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [alertsList, setAlertsList] = useState([]);
  
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [activeSimulatedNotifs, setActiveSimulatedNotifs] = useState([]);

  const [expandedGroups, setExpandedGroups] = useState({
    overview: true,
    research: false,
    trading: false,
    community: false,
    account: false
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Trading Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [stylePreference, setStylePreference] = useState(null);

  const pathRef = React.useRef(location.pathname);
  useEffect(() => {
    pathRef.current = location.pathname;
    if (location.pathname === '/dashboard/alerts') {
      setUnreadAlertsCount(0);
    }
  }, [location.pathname]);

  // Handle click-navigation from notifications
  useEffect(() => {
    const handleNavigation = (e) => {
      const destination = e.detail;
      if (destination) {
        navigate(destination);
        setMobileMenuOpen(false);
      }
    };
    const handleSWMessage = (e) => {
      if (e.data && e.data.type === 'NAVIGATE') {
        navigate(e.data.url);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('navigate_to_tab', handleNavigation);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    return () => {
      window.removeEventListener('navigate_to_tab', handleNavigation);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [navigate]);

  // Listen for simulated notifications & permission updates
  useEffect(() => {
    const handleSimulatedNotif = (e) => {
      const notif = e.detail;
      if (!notif) return;
      
      // Push new simulated notification
      setActiveSimulatedNotifs(prev => [notif, ...prev]);
      
      // Auto-remove simulated notification after 6 seconds
      setTimeout(() => {
        setActiveSimulatedNotifs(prev => prev.filter(n => n.id !== notif.id));
      }, 6500);
    };

    const handlePermissionChange = () => {
      setNotificationPermission(getNotificationPermissionState());
    };

    window.addEventListener('retailx_simulated_notification', handleSimulatedNotif);
    window.addEventListener('retailx_notification_permission_changed', handlePermissionChange);
    return () => {
      window.removeEventListener('retailx_simulated_notification', handleSimulatedNotif);
      window.removeEventListener('retailx_notification_permission_changed', handlePermissionChange);
    };
  }, []);

  // Check notification permission and show banner if 'default'
  useEffect(() => {
    if (isNotificationSupported()) {
      const state = getNotificationPermissionState();
      setNotificationPermission(state);
      
      const isDismissed = localStorage.getItem('retailx_notifications_dismissed') === 'true';
      if (state === 'default' && !isDismissed) {
        // Delay slightly for high-end visual feel
        const timer = setTimeout(() => {
          setShowPermissionBanner(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    setShowPermissionBanner(false);
    
    if (permission === 'granted') {
      // Trigger a welcoming alert
      notifyUserOfAlert({
        id: 'welcome-alert',
        title: '🔔 Real-Time Alerts Enabled!',
        observation: 'You will now receive high-impact Indian market alerts in real-time. Feel free to customize your watchlist filters in Settings.',
        severity: 'High',
        category: 'Strategic',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
      });
    }
  };

  const handleDismissBanner = () => {
    localStorage.setItem('retailx_notifications_dismissed', 'true');
    setShowPermissionBanner(false);
  };

  

useEffect(() => {
  // TEMPORARY PREVIEW MODE:
  // Allows exploring dashboard pages on the Vercel deployment.
  // Remove or disable this before making the app public.

  const demoMode = true;

  if (demoMode) {
    setUser({
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@retailx.local',
    });
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    navigate('/login');
    return;
  }

  fetch('/api/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Authentication failed');
      }
      return res.json();
    })
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      setUser(data);
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });
}, [navigate]);



  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.stylePreference === null) {
        if (localStorage.getItem('just_signed_up') === 'true') {
          setShowQuiz(true);
          localStorage.removeItem('just_signed_up');
        }
      } else if (data && data.stylePreference) {
        setStylePreference(data.stylePreference);
      }
    })
    .catch(err => {
      console.error("Failed to fetch profile settings inside UserDashboard:", err);
    });

    // Handle custom events to trigger the quiz
    const handleOpenQuiz = () => {
      setShowQuiz(true);
    };

    const handleQuizCompleted = (e) => {
      if (e.detail && e.detail.stylePreference) {
        setStylePreference(e.detail.stylePreference);
      }
    };

    window.addEventListener('open_trading_quiz', handleOpenQuiz);
    window.addEventListener('trading_quiz_completed', handleQuizCompleted);

    return () => {
      window.removeEventListener('open_trading_quiz', handleOpenQuiz);
      window.removeEventListener('trading_quiz_completed', handleQuizCompleted);
    };
  }, []);

  useEffect(() => {
    console.log("📡 [UserDashboard] Initializing real-time SSE Alerts Feed connection...");
    const eventSource = new EventSource('/api/market/stream');

    eventSource.addEventListener('alert', (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        console.log("🚨 [UserDashboard] Received real-time High severity alert via SSE:", newAlert);
        
        setAlertsList(prev => {
          if (prev.some(item => item.id === newAlert.id)) return prev;
          return [newAlert, ...prev];
        });

        if (pathRef.current !== '/dashboard/alerts') {
          setUnreadAlertsCount(prev => prev + 1);
        }

        // Trigger native notification if allowed and alert is "useful"
        notifyUserOfAlert(newAlert);
      } catch (err) {
        console.error("❌ [UserDashboard] Failed to parse SSE alert:", err);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Heartbeat pulse received
    });

    eventSource.onerror = (err) => {
      console.warn("⚠️ [UserDashboard] SSE connection lost. The browser will automatically attempt reconnection...", err);
    };

    return () => {
      console.log("🔌 [UserDashboard] Closing SSE Alerts Feed connection.");
      eventSource.close();
    };
  }, []);

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    const maxScroll = e.target.scrollHeight - e.target.clientHeight;
    
    if (currentScrollY < 0 || currentScrollY > maxScroll) {
      return;
    }

    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setShowMobileNav(false);
    } else if (currentScrollY < lastScrollY) {
      setShowMobileNav(true);
    }
    setLastScrollY(currentScrollY);
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  // Comprehensive navigation sections containing all platform features
  const navSections = [
    {
      id: 'markets',
      title: 'Markets & Overview',
      items: [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'alerts', path: '/dashboard/alerts', label: 'Live Alerts Feed', icon: Bell, badgeCount: unreadAlertsCount },
        { id: 'analysis', path: '/dashboard/analysis', label: 'Market Overview', icon: BarChart2 },
        { id: 'openchart', path: '/dashboard/openchart', label: 'OpenChart Historical', icon: CandlestickChart },
        { id: 'heatmap', path: '/dashboard/heatmap', label: 'Market Heatmap', icon: Grid3x3 },
        { id: 'global-indices', path: '/dashboard/global-indices', label: 'Global Indices', icon: Compass },
      ]
    },
    {
      id: 'intelligence',
      title: 'AI & Intelligence',
      items: [
        { id: 'watchlist', path: '/dashboard/watchlist', label: 'AI Watchlist', icon: Star },
        { id: 'options', path: '/dashboard/options', label: 'Options Intelligence', icon: Layers },
        { id: 'smart-money', path: '/dashboard/smart-money', label: 'Smart Money Activity', icon: TrendingUp },
        { id: 'fii-dii', path: '/dashboard/fii-dii', label: 'FII/DII Cash & F&O', icon: Building2 },
        { id: 'core-scanner', path: '/dashboard/core-scanner', label: 'Core Scanner', icon: Sliders },
        { id: 'pattern-scanner', path: '/dashboard/scanner', label: 'Pattern Scanner', icon: Radar },
        { id: 'copilot', path: '#copilot', label: 'Alpha Copilot', icon: Bot, isAction: true },
        { id: 'news', path: '/dashboard/news', label: 'News & Insights', icon: Newspaper },
      ]
    },
    {
      id: 'trading',
      title: 'Trading & Execution',
      items: [
        { id: 'paper-trading', path: '/dashboard/paper-trading', label: 'Paper Trading', icon: Play },
        { id: 'journal', path: '/dashboard/journal', label: 'Trade Journal', icon: BookOpen },
        { id: 'algo-builder', path: '/dashboard/algo-builder', label: 'OpenAlgo Builder', icon: Cpu },
        { id: 'orderbook', path: '/dashboard/orderbook', label: 'L2 Orderbook', icon: Activity },
        { id: 'broker', path: '/dashboard/broker', label: 'Broker Connect', icon: Link },
      ]
    },
    {
      id: 'coach',
      title: 'Discipline & Analytics',
      items: [
        { id: 'risk-guard', path: '/dashboard/coach', label: 'AI Risk Guard & Coach', icon: ShieldCheck },
        { id: 'performance', path: '/dashboard/performance', label: 'Performance Analytics', icon: BarChart2 },
        { id: 'education', path: '/dashboard/education', label: 'Trader Academy', icon: GraduationCap },
        { id: 'reports', path: '/dashboard/reports', label: 'Reports & Statements', icon: FileBarChart },
      ]
    },
    {
      id: 'community',
      title: 'Community & Growth',
      items: [
        { id: 'community', path: '/dashboard/community', label: 'Community Hub', icon: Users },
        { id: 'discussions', path: '/dashboard/discussions', label: 'Discussions', icon: MessageSquare },
        { id: 'referrals', path: '/dashboard/referrals', label: 'Referral Rewards', icon: Sparkles },
      ]
    },
    {
      id: 'tools',
      title: 'Tools & Platform',
      items: [
        { id: 'settings', path: '/dashboard/settings', label: 'Settings', icon: Settings },
        { id: 'billing', path: '/dashboard/billing', label: 'Plans & Billing', icon: CreditCard },
        { id: 'documentation', path: '/dashboard/documentation', label: 'Documentation', icon: BookOpen },
        { id: 'changelog', path: '/dashboard/changelog', label: 'Changelog', icon: Sparkles },
        { id: 'support', path: '/dashboard/support', label: 'Help & Support', icon: HelpCircle },
      ]
    }
  ];

  const mobileTabs = [
    { id: 'home', label: 'Home', path: '/dashboard', icon: Home },
    { id: 'markets', label: 'Markets', path: '/dashboard/analysis', icon: BarChart2 },
    { id: 'trade', label: 'Trade', path: '/dashboard/paper-trading', icon: Layers },
    { id: 'ai', label: 'AI', path: '/dashboard/coach', icon: Bot },
    { id: 'profile', label: 'Profile', path: '/dashboard/settings', icon: UserIcon },
  ];

  const handleNavItemClick = (item) => {
    if (item.isAction && item.id === 'copilot') {
      window.dispatchEvent(new CustomEvent('open_copilot_ask', { detail: '' }));
      window.dispatchEvent(new CustomEvent('open_copilot'));
      if (typeof window.openAlphaCopilot === 'function') {
        window.openAlphaCopilot('');
      }
      setMobileMenuOpen(false);
      return;
    }
    navigate(item.path);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`flex h-screen w-full font-sans transition-colors duration-300 ${isDark ? 'bg-[#090d16] text-white' : 'bg-[#f1f5f9] text-slate-900'}`}>
      <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Mobile Top Header */}
        <div className={`md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-b z-40 shadow-sm transition-transform duration-300 ${isDark ? 'border-slate-800 bg-[#0B0F17]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2.5">
            <RetailXLogo isDark={isDark} size="sm" showTagline={false} />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={() => navigate('/dashboard/alerts')}
              className={`p-2 rounded-lg relative transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Dark Sidebar Nav (Desktop & Mobile Drawer) */}
        <aside 
          className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-shrink-0 flex-col z-50 fixed inset-0 md:relative md:inset-auto md:h-full transition-all duration-300 bg-[#0B0F17] border-r border-slate-800/80 text-white overflow-y-auto custom-scrollbar ${
            desktopSidebarCollapsed ? 'md:w-20 md:p-3' : 'md:w-64 md:p-5'
          } p-5`}
        >
          {/* Mobile close bar */}
          <div className="flex md:hidden items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <RetailXLogo isDark={true} size="md" />
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X size={22} />
            </button>
          </div>

          {/* Desktop Logo Header */}
          <div className={`hidden md:flex items-center ${desktopSidebarCollapsed ? 'justify-center mb-6' : 'justify-between mb-6'}`}>
            <RetailXLogo 
              isDark={true} 
              size={desktopSidebarCollapsed ? "sm" : "md"} 
              collapsed={desktopSidebarCollapsed} 
            />
            <button
              onClick={toggleDesktopSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title={desktopSidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
              aria-label="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-0.5">
            {navSections.map((section, sIdx) => (
              <div key={section.id} className="space-y-0.5">
                {/* Section Header or Divider */}
                {sIdx > 0 && (
                  desktopSidebarCollapsed ? (
                    <div className="h-px w-8 mx-auto bg-slate-800 my-2" />
                  ) : (
                    <div className="px-3.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {section.title}
                    </div>
                  )
                )}
                {sIdx === 0 && !desktopSidebarCollapsed && (
                  <div className="px-3.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </div>
                )}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = !item.isAction && (
                    item.path === '/dashboard' 
                      ? location.pathname === '/dashboard' 
                      : (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
                  );

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavItemClick(item)}
                      title={desktopSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        desktopSidebarCollapsed ? 'md:justify-center md:px-0 px-3.5' : 'gap-3 px-3.5'
                      } py-2 rounded-xl text-xs font-semibold transition-all relative group ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      {!desktopSidebarCollapsed && (
                        <span className="truncate text-left">{item.label}</span>
                      )}
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className={`${desktopSidebarCollapsed ? 'absolute top-1 right-1' : 'ml-auto'} bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm`}>
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Upgrade to Pro Card & Logout */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
            {!desktopSidebarCollapsed ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-[#0f172a] border border-slate-800 shadow-lg text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Crown size={14} className="fill-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">Upgrade to Pro</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Unlock advanced scanners, more AI insights and premium features.
                </p>
                <button
                  onClick={() => { navigate('/dashboard/billing'); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
                >
                  <span>Upgrade Now</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/dashboard/billing')}
                title="Upgrade to Pro"
                className="w-full flex justify-center py-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-all"
              >
                <Crown size={18} className="fill-amber-400" />
              </button>
            )}

            {/* Quick action buttons */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors flex items-center gap-2"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                {!desktopSidebarCollapsed && <span>{isDark ? 'Light' : 'Dark'}</span>}
              </button>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                {!desktopSidebarCollapsed && <span>Log Out</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex flex-col flex-1 overflow-hidden h-full min-h-0 bg-inherit">
          {/* Top Bar (Web) */}
          <header className={`hidden md:flex items-center justify-between px-8 py-3.5 border-b shrink-0 z-30 transition-colors ${
            isDark ? 'bg-[#0B0F17] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            {/* Universal Search Bar */}
            <div className="flex-1 max-w-md mr-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs border transition-all ${
                  isDark 
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 shadow-inner'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate">Search stocks, indices, sectors, news or ask AI...</span>
                </div>
                <kbd className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  ⌘ K
                </kbd>
              </button>
            </div>

            {/* Right Top Bar Controls */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Market Status Pill */}
              <div className={`hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="relative flex h-2 w-2 shrink-0">
                  {marketStatus === 'Market Open' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : marketStatus === 'Pre-Market' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </>
                  ) : marketStatus === 'Post-Market' ? (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  )}
                </span>
                <span className={`font-bold ${
                  marketStatus === 'Market Open' ? 'text-emerald-500' :
                  marketStatus === 'Pre-Market' ? 'text-sky-400' :
                  marketStatus === 'Post-Market' ? 'text-indigo-400' : 'text-rose-500'
                }`}>
                  {marketStatus}
                </span>
                <span className="text-slate-400 text-[11px] font-mono border-l border-slate-700/40 pl-2">
                  {istTimeStr || 'India Market Time'}
                </span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-colors ${
                  isDark 
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                aria-label="Theme toggle"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl border relative transition-colors ${
                    isDark 
                      ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={17} />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl p-4 z-50 transition-all ${
                    isDark ? 'bg-[#0B0F17] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 mb-3">
                      <h4 className="text-sm font-bold">Real-time Notifications</h4>
                      {unreadAlertsCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                          {unreadAlertsCount} New
                        </span>
                      )}
                    </div>
                    {alertsList && alertsList.length > 0 ? (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto">
                        {alertsList.map((n, idx) => (
                          <div key={n.id || `alert-${idx}`} className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-blue-500 text-[10px] uppercase">{n.type || n.category || 'Alert'}</span>
                              <span className="text-slate-400 text-[10px]">{n.time || 'Just now'}</span>
                            </div>
                            <p className="font-medium text-xs line-clamp-2">{n.title || n.observation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/dashboard/alerts');
                      }}
                      className="w-full mt-3 py-2 text-center text-xs font-bold text-blue-500 hover:underline"
                    >
                      View All Alerts →
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar & Plan */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border transition-all ${
                    isDark 
                      ? 'border-slate-800 hover:bg-slate-800 text-slate-200' 
                      : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700 shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'T')}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-xs font-bold leading-tight">
                      {user?.name || (user?.email ? user.email.split('@')[0] : 'Trader')}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500">
                      Free Plan
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 ${
                    isDark ? 'bg-[#0B0F17] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className="p-3 border-b border-slate-700/30 mb-1">
                      <div className="text-xs font-bold">{user?.email || 'trader@retailx.io'}</div>
                      <div className="text-[10px] text-emerald-500 font-bold mt-0.5">Free Member • RetailX</div>
                    </div>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/dashboard/settings'); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      <Settings size={14} /> Profile & Settings
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/dashboard/journal'); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      <BookOpen size={14} /> Trade Journal
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/dashboard/performance'); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      <BarChart2 size={14} /> Performance Analytics
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/dashboard/referrals'); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles size={14} /> Referral Rewards
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/dashboard/billing'); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      <Crown size={14} className="text-amber-400 fill-amber-400" /> Upgrade Plan
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/dashboard/documentation'); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      <BookOpen size={14} /> Documentation
                    </button>
                    <div className="h-px bg-slate-700/30 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Upgrade to Pro CTA Button */}
              <button
                onClick={() => navigate('/dashboard/billing')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 shadow-sm transition-all"
              >
                <Crown size={14} className="text-amber-400 fill-amber-400 shrink-0" />
                <span>Upgrade to Pro</span>
              </button>
            </div>
          </header>

          {/* Scrollable Main Views Area */}
          <div onScroll={handleScroll} className="flex-1 overflow-y-auto min-h-0 px-4 md:px-8 pt-4 pb-24 md:pb-12 custom-scrollbar">
            {/* Mobile Header Spacer */}
            <div className="h-12 md:hidden w-full flex-shrink-0" />

            {/* Notification Permission Banner */}
            <AnimatePresence>
              {showPermissionBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  } shadow-md`}
                >
                  <div className="flex gap-3.5 items-start">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        Enable Real-Time Market Alerts
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Get high-impact breakout signals and institutional volume alerts delivered straight to your device.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleDismissBanner}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleRequestPermission}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Enable Access
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Outlet context={{ theme, toggleTheme, user, unreadAlertsCount, setUnreadAlertsCount, alertsList, setAlertsList }} />
          </div>

          {/* Mobile Bottom Tab Bar (matching Image 1) */}
          <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t z-40 px-2 py-1.5 flex items-center justify-around ${
            isDark ? 'bg-[#0B0F17] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          } shadow-lg`}>
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = (
                (tab.id === 'home' && location.pathname === '/dashboard') ||
                (tab.id === 'markets' && (location.pathname === '/dashboard/analysis' || location.pathname === '/dashboard/watchlist' || location.pathname === '/dashboard/options')) ||
                (tab.id === 'trade' && location.pathname === '/dashboard/paper-trading') ||
                (tab.id === 'ai' && location.pathname === '/dashboard/coach') ||
                (tab.id === 'profile' && (location.pathname === '/dashboard/settings' || location.pathname === '/dashboard/billing'))
              );

              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                    isActive ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                  <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </main>
      </div>

      {/* Universal Search Modal */}
      <UniversalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        isDark={isDark} 
      />

      {/* Floating Copilot */}
      <FloatingCopilot theme={theme} />

      {/* Trading Quiz Modal */}
      <TradingQuizModal 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
        onQuizCompleted={(pref) => setStylePreference(pref)} 
      />
    </div>
  );
}
