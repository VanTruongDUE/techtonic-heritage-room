import React from 'react';
import { CheckCircle2, Compass, Info, X } from 'lucide-react';
import { useHeritageStore } from '../../store/useHeritageStore';

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useHeritageStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4 select-none"
    >
      {toasts.map((toast) => {
        const toneClasses =
          toast.tone === 'success'
            ? 'border-emerald-400/45 text-emerald-200'
            : toast.tone === 'accent'
            ? 'border-tech-cyan/50 text-tech-cyan'
            : 'border-sky-300/35 text-sky-200';

        const Icon =
          toast.tone === 'success'
            ? CheckCircle2
            : toast.tone === 'accent'
            ? Compass
            : Info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto glass-panel rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 w-full animate-toast-in border ${toneClasses}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white leading-snug">{toast.title}</div>
              {toast.detail && (
                <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  {toast.detail}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-0.5 rounded text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
