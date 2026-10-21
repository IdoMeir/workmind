import Link from 'next/link';
import { ChevronLeft, FileText, List, Settings, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { BusinessIcon, SalaryIcon } from '@/components/shared/SourceIcon';

const SECTIONS: { title: string; items: { href: string; label: string; hint?: string; icon: React.ReactNode }[] }[] = [
  {
    title: 'עבודה',
    items: [
      { href: '/employer', label: 'מעסיק', hint: 'תעריף, יום מלא, שעות נוספות', icon: <SalaryIcon size={20} /> },
      { href: '/clients', label: 'לקוחות', hint: 'תעריפים ללקוחות העסק', icon: <Users size={20} aria-hidden="true" className="text-brass" /> },
      { href: '/entries', label: 'כל הרשומות של העסק', icon: <List size={20} aria-hidden="true" className="text-brass" /> },
    ],
  },
  {
    title: 'מסמכים',
    items: [
      { href: '/receipts', label: 'קבלות שהוצאו', hint: 'לצפייה בלבד', icon: <FileText size={20} aria-hidden="true" className="text-brass" /> },
    ],
  },
  {
    title: 'חשבון',
    items: [
      { href: '/settings', label: 'הגדרות', hint: 'פרטים אישיים, נקודות זיכוי, ישוב', icon: <Settings size={20} aria-hidden="true" className="text-text-mute" /> },
    ],
  },
];

export default function MorePage() {
  return (
    <>
      <PageHeader title="עוד" />
      <div className="p-4 space-y-5">
        {SECTIONS.map(section => (
          <section key={section.title} aria-labelledby={`more-${section.title}`}>
            <h2 id={`more-${section.title}`} className="text-[13px] text-text-mute mb-2">{section.title}</h2>
            <ul className="wm-card divide-y divide-rule">
              {section.items.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center gap-3 px-4 min-h-14 py-2">
                    {item.icon}
                    <span className="flex-1">
                      <span className="block text-[15px] text-text">{item.label}</span>
                      {item.hint && <span className="block text-[13px] text-text-mute">{item.hint}</span>}
                    </span>
                    <ChevronLeft size={18} aria-hidden="true" className="text-text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="flex items-center gap-2 text-[13px] text-text-mute">
          <SalaryIcon /> שכר
          <span aria-hidden="true">·</span>
          <BusinessIcon /> עסק
        </p>
      </div>
    </>
  );
}
