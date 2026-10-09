import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  severity = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#101827] border border-slate-800 shadow-2xl p-5 font-mono text-xs">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase mb-1">
              {title}
            </h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold tracking-wider uppercase transition-all duration-200 shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
