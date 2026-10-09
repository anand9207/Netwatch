import React from 'react';

export const StatusBadge = ({ status, size = 'sm', showPulse = true }) => {
  const normStatus = (status || 'UNKNOWN').toUpperCase();

  const config = {
    ONLINE: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      pulse: 'bg-emerald-400/40',
      label: 'ONLINE',
    },
    DEGRADED: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      pulse: 'bg-amber-400/40',
      label: 'DEGRADED',
    },
    OFFLINE: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      pulse: 'bg-rose-400/40',
      label: 'OFFLINE',
    },
    TIMEOUT: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      pulse: 'bg-rose-400/40',
      label: 'TIMEOUT',
    },
    OPTIMAL: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      pulse: 'bg-emerald-400/40',
      label: 'OPTIMAL',
    },
    CRITICAL: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      pulse: 'bg-rose-400/40',
      label: 'CRITICAL',
    },
    UNKNOWN: {
      bg: 'bg-slate-700/20 text-slate-400 border-slate-700/40',
      dot: 'bg-slate-500',
      pulse: 'bg-slate-500/20',
      label: 'UNKNOWN',
    },
  }[normStatus] || {
    bg: 'bg-slate-700/20 text-slate-400 border-slate-700/40',
    dot: 'bg-slate-500',
    pulse: 'bg-slate-500/20',
    label: normStatus,
  };

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : size === 'lg'
    ? 'text-xs px-3 py-1 font-semibold'
    : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wider ${config.bg} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        {showPulse && normStatus === 'ONLINE' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulse}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
};
