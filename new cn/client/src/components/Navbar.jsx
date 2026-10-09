import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Activity,
  Menu,
  GraduationCap,
  Database,
  Radio,
} from 'lucide-react';

export const Navbar = ({
  onToggleSidebar,
  onRefresh,
  refreshing = false,
  lastUpdated,
  hosts = [],
  onSelectHost,
  systemState,
}) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [relativeTime, setRelativeTime] = useState('just now');

  // Page title and breadcrumbs mapping
  const pageTitles = {
    '/': { title: 'Network Operations Overview', category: 'Dashboard' },
    '/topology': { title: 'Interactive Network Topology', category: 'Network Map' },
    '/hosts': { title: 'Host Monitoring Management', category: 'Hosts' },
    '/analytics': { title: 'Performance & Latency Analytics', category: 'Analytics' },
    '/alerts': { title: 'Alerts & System Events Log', category: 'Incidents' },
    '/history': { title: 'Monitoring Telemetry History', category: 'Logs' },
    '/tools': { title: 'Network Diagnostics & Tooling', category: 'Diagnostics' },
    '/settings': { title: 'System Settings & Syllabus Guide', category: 'System' },
  };

  const currentInfo = pageTitles[location.pathname] || {
    title: 'NetWatch NOC Console',
    category: 'Console',
  };

  // Calculate relative time since last update
  useEffect(() => {
    const updateRelative = () => {
      if (!lastUpdated) {
        setRelativeTime('live');
        return;
      }
      const diffSec = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      if (diffSec < 5) setRelativeTime('just now');
      else if (diffSec < 60) setRelativeTime(`${diffSec}s ago`);
      else setRelativeTime(`${Math.floor(diffSec / 60)}m ago`);
    };

    updateRelative();
    const interval = setInterval(updateRelative, 3000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Search filter
  const searchResults = searchQuery.trim()
    ? hosts.filter(
        (h) =>
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080D18]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 font-mono">
      {/* Left: Mobile Toggle & Page Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>NetWatch NOC</span>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">{currentInfo.category}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {currentInfo.title}
          </h1>
        </div>
      </div>

      {/* Center: Global Host Search */}
      <div className="relative hidden md:block flex-1 max-w-md mx-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search host by name or IP (e.g. 1.1.1.1)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[#101827] border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery.trim() && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 bg-[#101827] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto"
            onMouseLeave={() => setShowSearchResults(false)}
          >
            {searchResults.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center">
                No matching monitored hosts found.
              </div>
            ) : (
              searchResults.map((h) => (
                <div
                  key={h._id || h.id}
                  onClick={() => {
                    onSelectHost && onSelectHost(h);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{h.name}</span>
                    <span className="text-[10px] text-slate-400">{h.address}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      h.status === 'ONLINE'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : h.status === 'DEGRADED'
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Status Indicators & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
        {/* Database indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Storage:</span>
          <span className="text-cyan-300 font-semibold">
            {systemState?.database === 'mongodb' ? 'MongoDB Atlas' : 'In-Memory Engine'}
          </span>
        </div>

        {/* Last updated indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span>{relativeTime}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-[#101827] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Manual Probe Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden md:inline text-[11px]">Refresh</span>
        </button>

        {/* Academic Project Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-300 text-[11px]">
          <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
          <span>BTech CN Project</span>
        </div>
      </div>
    </header>
  );
};
