import { WorkEntry } from '@/types';
import { formatCurrency, formatHebrewDate } from '@/lib/hebrew-format';
import { Clock, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface RecentEntriesProps {
  entries: WorkEntry[];
}

export default function RecentEntries({ entries }: RecentEntriesProps) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-400">רשומות אחרונות</p>
        <Link href="/entries" className="text-xs text-blue-500 hover:text-blue-700">
          כל הרשומות
        </Link>
      </div>
      <div className="space-y-0">
        {entries.slice(0, 5).map(entry => (
          <div key={entry.id} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${entry.entry_type === 'hours' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
              {entry.entry_type === 'hours' ? <Clock size={13} /> : <CalendarDays size={13} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">
                {entry.entry_type === 'hours'
                  ? `${entry.hours}ש׳ — ${entry.client?.name}`
                  : `${entry.event_name} — ${entry.client?.name}`}
              </p>
              <p className="text-xs text-gray-400">{formatHebrewDate(entry.entry_date)}</p>
            </div>
            <span className="text-sm font-medium text-gray-900 shrink-0">
              {formatCurrency(entry.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
