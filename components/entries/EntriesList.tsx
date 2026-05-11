'use client';

import { WorkEntry } from '@/types';
import EntryRow from './EntryRow';
import { FileText } from 'lucide-react';

interface EntriesListProps {
  entries: WorkEntry[];
  onEdit: (entry: WorkEntry) => void;
  onDelete: (entry: WorkEntry) => void;
}

export default function EntriesList({ entries, onEdit, onDelete }: EntriesListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <FileText size={28} className="text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">אין רשומות</p>
        <p className="text-gray-400 text-sm mt-1">הוסף שעות או אירועים מהדשבורד</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      {entries.map(entry => (
        <EntryRow
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
