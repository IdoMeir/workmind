'use client';

import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import type { WorkEntry } from '@/types';
import Money from '@/components/shared/Money';
import { BusinessIcon } from '@/components/shared/SourceIcon';
import { formatDecimal, formatHebrewDate } from '@/lib/hebrew-format';
import { isOpenEntry } from '@/lib/payments';

interface EntryRowProps {
  entry: WorkEntry;
  onEdit: (entry: WorkEntry) => void;
  onDelete: (entry: WorkEntry) => void;
}

export default function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const isHours = entry.entry_type === 'hours';
  const locked = !!entry.receipt_id;
  const open = isOpenEntry(entry);
  const label = isHours ? `${formatDecimal(Number(entry.hours))} שעות` : entry.event_name;

  return (
    <li className="flex items-center gap-3 py-2 border-b border-rule last:border-0">
      {isHours ? <BusinessIcon /> : <CalendarDays size={16} aria-hidden="true" className="text-brass" />}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[15px] truncate">{label} — {entry.client?.name}</p>
          <Money amount={Number(entry.amount)} className="wm-num shrink-0" />
        </div>
        <p className="text-[13px] text-text-mute truncate">
          {formatHebrewDate(entry.entry_date)}
          {entry.description && ` · ${entry.description}`}
          {locked && ' · בקבלה ישנה'}
          {!locked && (open ? ' · פתוח' : ' · שולם')}
        </p>
      </div>

      {!locked && (
        <div className="flex shrink-0">
          <button onClick={() => onEdit(entry)} aria-label={`ערוך ${label}`} className="wm-btn text-text-mute">
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button onClick={() => onDelete(entry)} aria-label={`מחק ${label}`} className="wm-btn text-text-mute">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}
