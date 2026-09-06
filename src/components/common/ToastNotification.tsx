import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { notifications, dismissNotification } = useApp();
  const activeNotice = notifications[0];

  if (!activeNotice) return null;

  const getIcon = () => {
    switch (activeNotice.type) {
      case 'approaching':
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'full':
        return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />;
      case 'delay':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-jklu-orange shrink-0" />;
    }
  };

  return (
    <div className="fixed top-16 inset-x-4 z-40 max-w-sm mx-auto pointer-events-auto transition-all animate-slideDown">
      <div className="bg-[#121316] text-[#FBFBF9] rounded-xl px-3.5 py-3 shadow-float border border-stone-800 flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-editorial font-bold text-[11px] tracking-wider text-jklu-orange uppercase">
              {activeNotice.title}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {activeNotice.timestamp}
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-0.5 leading-snug">
            {activeNotice.message}
          </p>
        </div>
        <button
          onClick={() => dismissNotification(activeNotice.id)}
          className="text-stone-400 hover:text-stone-200 p-0.5"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
