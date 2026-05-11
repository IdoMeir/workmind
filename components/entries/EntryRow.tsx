'use client';

import { WorkEntry } from '@/types';
import { formatCurrency, formatHebrewDate } from '@/lib/hebrew-format';
import { Pencil, Trash2, Clock, CalendarDays, Receipt } from 'lucide-react';

interface EntryRowProps {
  entry: WorkEntry;
  onEdit: (entry: WorkEntry) => void;
  onDelete: (entry: WorkEntry) => void;
}

export default function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const isHours = entry.entry_type === 'hours';
  const hasReceipt = !!entry.receipt_id;

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 ${hasReceipt ? 'opacity-70' : ''}`}>
      <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isHours ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
        {isHours ? <Clock size={14} /> : <CalendarDays size={14} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {isHours
              ? `${entry.hours} שעות — ${entry.client?.name}`
              : `${entry.event_name} — ${entry.client?.name}`}
          </p>
          <span className="text-sm font-semibold text-gray-900 shrink-0">
            {formatCurrency(entry.amount)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{formatHebrewDate(entry.entry_date)}</span>
          {entry.description && (
            <span className="text-xs text-gray-400 truncate">· {entry.description}</span>
          )}
          {hasReceipt && (
            <span className="text-xs text-green-600 flex items-center gap-0.5">
              <Receipt size={11} /> קבלה
            </span>
          )}
        </div>
      </div>

      {!hasReceipt && (
        <div className="flex gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
