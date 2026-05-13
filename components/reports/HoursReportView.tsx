'use client';

import { WorkEntry, Client } from '@/types';
import { Printer, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HoursReportViewProps {
  entries: WorkEntry[];
  client: Client;
  year: number;
  month: number;
}

const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Parse "HH:MM–HH:MM" from the beginning of a description string */
function extractTimeRange(desc: string | null): { timeRange: string | null; rest: string } {
  if (!desc) return { timeRange: null, rest: '' };
  const match = desc.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2})\s*[|]?\s*(.*)/);
  if (match) return { timeRange: match[1], rest: match[2].trim() };
  return { timeRange: null, rest: desc };
}

export default function HoursReportView({ entries, client, year, month }: HoursReportViewProps) {
  const router = useRouter();
  const monthName = MONTH_NAMES[month - 1];

  const hoursEntries = entries
    .filter(e => e.entry_type === 'hours')
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  const totalHours = hoursEntries.reduce((s, e) => s + (e.hours ?? 0), 0);
  const totalAmount = hoursEntries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Toolbar — hidden in print */}
      <div className="no-print flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-700">
          <ArrowRight size={20} />
        </button>
        <span className="font-medium text-gray-800 flex-1">דו&quot;ח שעות — {client.name}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Printer size={16} />
          הדפס
        </button>
      </div>

      {/* Report body */}
      <div className="max-w-3xl mx-auto p-6 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="mb-6 text-center print:mb-4">
          <h1 className="text-2xl font-bold text-gray-900 print:text-xl">דו&quot;ח שעות</h1>
          <p className="text-gray-600 mt-1">{monthName} {year}</p>
          <p className="text-gray-700 font-medium mt-1">{client.name}</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm print:shadow-none overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 print:bg-gray-100 border-b">
                <th className="text-right px-4 py-3 font-semibold text-gray-700">תאריך</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">שעות</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">שעון</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">תיאור</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">סכום</th>
              </tr>
            </thead>
            <tbody>
              {hoursEntries.map((entry, i) => {
                const { timeRange, rest } = extractTimeRange(entry.description);
                return (
                  <tr key={entry.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{entry.hours}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{timeRange ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{rest || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium text-left">₪{entry.amount.toLocaleString()}</td>
                  </tr>
                );
              })}
              {hoursEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">אין רשומות שעות לתקופה זו</td>
                </tr>
              )}
            </tbody>
            {hoursEntries.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="px-4 py-3 text-gray-800">סה&quot;כ</td>
                  <td className="px-4 py-3 text-gray-800">{totalHours} שעות</td>
                  <td />
                  <td />
                  <td className="px-4 py-3 text-gray-800 text-left">₪{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-gray-400 text-center print:mt-4">
          דו&quot;ח זה הופק מתוך WorkMind • {new Date().toLocaleDateString('he-IL')}
        </p>
      </div>
    </div>
  );
}
