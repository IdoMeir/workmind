'use client';

import Link from 'next/link';
import Money from '@/components/shared/Money';
import { formatDecimal } from '@/lib/hebrew-format';
import type { ClientMonthlySummary } from '@/types';

interface Props {
  clientSummaries: ClientMonthlySummary[];
  onGenerateReceipt?: (clientId: string) => void;
  year: number;
  month: number;
}

export default function MonthlySummaryTable({ clientSummaries, onGenerateReceipt, year, month }: Props) {
  if (clientSummaries.length === 0) {
    return <p className="text-[15px] text-text-mute py-2">אין עבודות לעסק בחודש הזה.</p>;
  }

  return (
    <ul className="space-y-3">
      {clientSummaries.map(summary => (
        <li key={summary.clientId} className="border border-rule rounded-[10px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-rule">
            <span>
              <span className="text-[15px] text-text">{summary.clientName}</span>
              <span className="ms-2 text-[13px] text-text-mute">{summary.entries.length} רשומות</span>
            </span>
            <Money amount={summary.total} className="wm-num text-brass" />
          </div>

          <ul className="divide-y divide-rule text-[15px]">
            {summary.totalHours > 0 && (
              <li className="flex items-center justify-between px-3 py-2">
                <span>שעות עבודה — <bdi className="wm-num">{formatDecimal(summary.totalHours)}</bdi> שעות</span>
                <Money amount={summary.hoursAmount} />
              </li>
            )}
            {summary.entries
              .filter(e => e.entry_type === 'event')
              .map(entry => (
                <li key={entry.id} className="flex items-center justify-between px-3 py-2">
                  <span>{entry.event_name || 'אירוע'}</span>
                  <Money amount={Number(entry.amount)} />
                </li>
              ))}
          </ul>

          <div className="px-3 py-2 border-t border-rule flex gap-2">
            {summary.totalHours > 0 && (
              <Link
                href={`/reports/hours?year=${year}&month=${month}&client_id=${summary.clientId}`}
                className="wm-btn wm-btn-ghost flex-1"
              >
                דו&quot;ח שעות
              </Link>
            )}
            {onGenerateReceipt && (
              <button onClick={() => onGenerateReceipt(summary.clientId)} className="wm-btn wm-btn-ghost flex-1">
                הפק קבלה
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
