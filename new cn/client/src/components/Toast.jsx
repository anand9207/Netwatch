import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-mono text-xs">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
        };

        const borderStyles = {
          success: 'border-emerald-500/30 bg-[#101827]/95',
          warning: 'border-amber-500/30 bg-[#101827]/95',
          error: 'border-rose-500/30 bg-[#101827]/95',
          info: 'border-cyan-500/30 bg-[#101827]/95',
        }[toast.type || 'info'];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ${borderStyles}`}
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type || 'info']}
              <span className="text-slate-200 font-medium tracking-tight">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
