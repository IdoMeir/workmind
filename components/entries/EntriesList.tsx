'use client';

import type { WorkEntry } from '@/types';
import EntryRow from './EntryRow';

interface EntriesListProps {
  entries: WorkEntry[];
  onEdit: (entry: WorkEntry) => void;
  onDelete: (entry: WorkEntry) => void;
}

export default function EntriesList({ entries, onEdit, onDelete }: EntriesListProps) {
  if (entries.length === 0) {
    return <p className="p-8 text-center text-[15px] text-text-mute">אין רשומות לעסק בחודש הזה.</p>;
  }

  return (
    <ul className="wm-card mx-4 px-3">
      {entries.map(entry => <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />)}
    </ul>
  );
}
