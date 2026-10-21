'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface SheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** כפתורי פעולה קבועים בתחתית, מעל המקלדת. */
  footer?: React.ReactNode;
}

/** גיליון תחתון כהה. נשאר מעל ה-BottomNav ומעל המקלדת. */
export default function Sheet({ open, title, subtitle, onClose, children, footer }: SheetProps) {
  const vvh = useVisualViewport();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const style = vvh > 0 ? { maxHeight: `${Math.floor(vvh * 0.92)}px` } : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-above-nav">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-md bg-ink-raised border border-rule rounded-t-[10px] sm:rounded-[10px] flex flex-col max-h-[92dvh] sm:max-h-[85vh] text-text"
        style={style}
      >
        <div className="flex items-start justify-between px-5 pt-4 pb-2 shrink-0">
          <div>
            <h2 id={titleId} className="wm-title text-[17px]">{title}</h2>
            {subtitle && <p className="text-[13px] text-text-mute mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="סגור" className="wm-btn -me-3 -mt-1 text-text-mute">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-3 space-y-3">{children}</div>
        {footer && <div className="shrink-0 px-5 pt-2 pb-5">{footer}</div>}
      </div>
    </div>
  );
}
