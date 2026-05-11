'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, Users, Calculator } from 'lucide-react';

const tabs = [
  { href: '/', label: 'בית', icon: Home },
  { href: '/entries', label: 'רשומות', icon: List },
  { href: '/clients', label: 'לקוחות', icon: Users },
  { href: '/tax', label: 'מס', icon: Calculator },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 z-50 no-print">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
