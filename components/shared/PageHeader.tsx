import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** קישור חזרה (למשל למסך "עוד"). */
  backHref?: string;
}

export default function PageHeader({ title, subtitle, action, backHref }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-rule bg-ink no-print">
      <div className="flex items-center gap-1 min-w-0">
        {backHref && (
          <Link href={backHref} aria-label="חזרה" className="wm-btn -ms-3 text-text-mute">
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="wm-title text-[19px] text-text truncate">{title}</h1>
          {subtitle && <p className="text-[13px] text-text-mute mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
