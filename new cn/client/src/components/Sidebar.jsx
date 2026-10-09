import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Network,
  Server,
  BarChart3,
  Bell,
  History,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';

export const Sidebar = ({
  collapsed,
  onToggleCollapse,
  activeAlertsCount = 0,
  sseStatus = 'connected',
}) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: Activity },
    { to: '/topology', label: 'Network Topology', icon: Network },
    { to: '/hosts', label: 'Host Monitoring', icon: Server },
    { to: '/analytics', label: 'Performance Analytics', icon: BarChart3 },
    {
      to: '/alerts',
      label: 'Alerts & Events',
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-500 text-slate-950 font-bold',
    },
    { to: '/history', label: 'Monitoring History', icon: History },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-[#080D18] border-r border-slate-800 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
            <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#080D18] animate-ping" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-black tracking-widest font-mono text-slate-100 flex items-center gap-1.5">
                NET<span className="text-cyan-400">WATCH</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                NOC MONITORING SYSTEM
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800/80 transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 font-mono text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#101827] text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {/* Left accent bar on active item */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-cyan-400/50 shadow-sm" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />

                  {!collapsed && (
                    <span className="truncate tracking-wide">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {collapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#080D18]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Engine Status Card at Bottom */}
      <div className="p-3 border-t border-slate-800 bg-[#080D18]">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-[#101827] border border-slate-800 text-[11px] font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                PROBE ENGINE
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>SSE STREAM:</span>
              <span className={sseStatus === 'connected' ? 'text-cyan-400' : 'text-amber-400'}>
                {sseStatus.toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="NOC Engine: ACTIVE">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
