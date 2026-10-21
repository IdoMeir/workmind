'use client';

import Link from 'next/link';
import Money from '@/components/shared/Money';
import { formatDecimal } from '@/lib/hebrew-format';
import { isOpenEntry } from '@/lib/payments';
import type { ClientMonthlySummary } from '@/types';

interface Props {
  clientSummaries: ClientMonthlySummary[];
  year: number;
  month: number;
}

export default function MonthlySummaryTable({ clientSummaries, year, month }: Props) {
  if (clientSummaries.length === 0) {
    return <p className="text-[15px] text-text-mute py-2">אין עבודות לעסק בחודש הזה.</p>;
  }

  return (
    <ul className="space-y-3">
      {clientSummaries.map(summary => {
        const open = summary.entries.filter(isOpenEntry);
        const openAmount = open.reduce((s, e) => s + Number(e.amount), 0);
        return (
        <li key={summary.clientId} className="border border-rule rounded-[10px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-rule">
            <span>
              <span className="text-[15px] text-text">{summary.clientName}</span>
              <span className="ms-2 text-[13px] text-text-mute">{summary.entries.length} רשומות</span>
            </span>
            <Money amount={summary.total} className="wm-num text-brass" />
          </div>
          {open.length > 0 && (
            <p className="px-3 pt-2 text-[13px] text-text-mute">
              <span className="inline-block border border-brass text-brass rounded px-1.5 me-1">פתוח</span>
              {open.length} עבודות מחכות לתשלום · <Money amount={openAmount} />
            </p>
          )}

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

          {summary.totalHours > 0 && (
            <div className="px-3 py-2 border-t border-rule">
              <Link
                href={`/reports/hours?year=${year}&month=${month}&client_id=${summary.clientId}`}
                className="wm-btn wm-btn-ghost w-full"
              >
                דו&quot;ח שעות
              </Link>
            </div>
          )}
        </li>
        );
      })}
    </ul>
  );
}
