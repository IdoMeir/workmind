'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ListChecks, Menu, Sun } from 'lucide-react';

const tabs = [
  { href: '/', label: 'היום', icon: Sun },
  { href: '/monthly', label: 'חודש', icon: CalendarDays },
  { href: '/tax', label: 'מס ופעולות', icon: ListChecks },
  { href: '/more', label: 'עוד', icon: Menu },
];

/** מסכים שנפתחים מ"עוד" — הטאב "עוד" מסומן כפעיל בהם. */
const MORE_ROUTES = ['/more', '/clients', '/employer', '/entries', '/receipts', '/settings', '/reports', '/insights', '/events'];

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/more') return MORE_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`));
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="ניווט ראשי" className="fixed bottom-0 right-0 left-0 bg-ink border-t border-rule z-50 no-print pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 text-[13px] ${
                active ? 'text-text font-semibold' : 'text-text-mute'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" className={active ? 'text-brass' : ''} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
