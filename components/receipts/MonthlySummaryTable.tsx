'use client';

import { formatCurrency } from '@/lib/hebrew-format';
import type { ClientMonthlySummary } from '@/types';

interface Props {
  clientSummaries: ClientMonthlySummary[];
  onGenerateReceipt: (clientId: string) => void;
}

export default function MonthlySummaryTable({ clientSummaries, onGenerateReceipt }: Props) {
  if (clientSummaries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        אין רשומות לא מחויבות בחודש זה
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clientSummaries.map((summary) => (
        <div key={summary.clientId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div>
              <span className="font-semibold text-gray-900">{summary.clientName}</span>
              <span className="mr-2 text-sm text-gray-500">
                {summary.entries.length} רשומות
              </span>
            </div>
            <span className="font-bold text-indigo-700">{formatCurrency(summary.total)}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {summary.totalHours > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-700">
                  שעות עבודה — {summary.totalHours} שעות
                </span>
                <span className="text-gray-900 font-medium">{formatCurrency(summary.hoursAmount)}</span>
              </div>
            )}
            {summary.entries
              .filter(e => e.entry_type === 'event')
              .map(entry => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-700">{entry.event_name || 'אירוע'}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(entry.amount)}</span>
                </div>
              ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => onGenerateReceipt(summary.clientId)}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              הפק קבלה ←
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
