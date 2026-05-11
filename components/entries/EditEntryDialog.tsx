'use client';

import { useState, useEffect } from 'react';
import { WorkEntry } from '@/types';
import { X } from 'lucide-react';

interface EditEntryDialogProps {
  entry: WorkEntry | null;
  onClose: () => void;
  onSave: (entry: WorkEntry) => void;
}

export default function EditEntryDialog({ entry, onClose, onSave }: EditEntryDialogProps) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (entry) {
      setDate(entry.entry_date);
      setAmount(String(entry.amount));
      setHours(entry.hours ? String(entry.hours) : '');
      setEventName(entry.event_name ?? '');
      setDescription(entry.description ?? '');
      setError('');
    }
  }, [entry]);

  if (!entry) return null;
  const entryId = entry.id;
  const isHours = entry.entry_type === 'hours';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body: Record<string, unknown> = {
      entry_date: date,
      amount: parseFloat(amount),
      description: description.trim() || null,
    };
    if (isHours) body.hours = parseFloat(hours);
    else body.event_name = eventName.trim();

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      onSave(data);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">עריכת רשומה</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isHours ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעות</label>
              <input
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם האירוע</label>
              <input
                type="text"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סכום (₪)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערה</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'שומר...' : 'שמור שינויים'}
          </button>
        </form>
      </div>
    </div>
  );
}
