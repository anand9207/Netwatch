import React from 'react';

export const MetricCard = ({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  accent = 'cyan', // 'cyan' | 'violet' | 'green' | 'amber' | 'red'
  badge,
  badgeType = 'default',
}) => {
  const accentStyles = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      line: 'from-cyan-500/40 via-cyan-500/10 to-transparent',
      textGlow: 'group-hover:text-cyan-300',
    },
    violet: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      line: 'from-purple-500/40 via-purple-500/10 to-transparent',
      textGlow: 'group-hover:text-purple-300',
    },
    green: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      line: 'from-emerald-500/40 via-emerald-500/10 to-transparent',
      textGlow: 'group-hover:text-emerald-300',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      line: 'from-amber-500/40 via-amber-500/10 to-transparent',
      textGlow: 'group-hover:text-amber-300',
    },
    red: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      line: 'from-rose-500/40 via-rose-500/10 to-transparent',
      textGlow: 'group-hover:text-rose-300',
    },
  }[accent] || accentStyles.cyan;

  return (
    <div className={`group relative rounded-xl bg-[#101827] border border-slate-800 p-4 sm:p-5 transition-all duration-300 ${accentStyles.border} shadow-lg overflow-hidden`}>
      {/* Subtle top indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentStyles.line}`} />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-medium">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${accentStyles.iconBg} transition-transform group-hover:scale-105 duration-200`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className={`text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-mono transition-colors ${accentStyles.textGlow}`}>
          {value !== undefined && value !== null ? value : '--'}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-400 font-medium">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <span className="truncate">{subtitle}</span>
        {badge && (
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
