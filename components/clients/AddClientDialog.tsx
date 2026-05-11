'use client';

import { useState } from 'react';
import { Client } from '@/types';
import { X } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (client: Client) => void;
}

const emptyForm = {
  name: '',
  description: '',
  hourly_rate: '',
  event_rate: '',
  contact_info: '',
};

export default function AddClientDialog({ open, onClose, onAdd }: AddClientDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const hourly = form.hourly_rate ? parseFloat(form.hourly_rate) : null;
    const event = form.event_rate ? parseFloat(form.event_rate) : null;

    if (!hourly && !event) {
      setError('חייב להגדיר לפחות תעריף שעתי או תעריף אירוע');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          hourly_rate: hourly,
          event_rate: event,
          contact_info: form.contact_info.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
      } else {
        onAdd(data);
        setForm(emptyForm);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">לקוח חדש</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם לקוח *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ירון הפקות"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="הפקות אירועים"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תעריף שעתי (₪)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.hourly_rate}
                onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תעריף אירוע (₪)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.event_rate}
                onChange={e => setForm(f => ({ ...f, event_rate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">פרטי קשר</label>
            <input
              type="text"
              value={form.contact_info}
              onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="טלפון / אימייל"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-1"
          >
            {loading ? 'שומר...' : 'הוסף לקוח'}
          </button>
        </form>
      </div>
    </div>
  );
}
