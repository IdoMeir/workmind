'use client';

import { useState } from 'react';
import { Client, RatePreset } from '@/types';
import { X, Plus, Trash2 } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (client: Client) => void;
}

const RATE_TYPE_LABELS: Record<RatePreset['type'], string> = {
  hourly: 'שעתי',
  daily: 'יומי',
  fixed: 'קבוע',
};

const emptyForm = {
  name: '',
  description: '',
  hourly_rate: '',
  event_rate: '',
  contact_info: '',
};

export default function AddClientDialog({ open, onClose, onAdd }: AddClientDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [presets, setPresets] = useState<RatePreset[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function addPreset() {
    setPresets(p => [...p, { name: '', rate: 0, type: 'hourly' }]);
  }

  function removePreset(i: number) {
    setPresets(p => p.filter((_, idx) => idx !== i));
  }

  function updatePreset(i: number, field: keyof RatePreset, value: string | number) {
    setPresets(p => p.map((pr, idx) => idx === i ? { ...pr, [field]: value } : pr));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const hourly = form.hourly_rate ? parseFloat(form.hourly_rate) : null;
    const event = form.event_rate ? parseFloat(form.event_rate) : null;
    const validPresets = presets.filter(p => p.name.trim() && p.rate > 0);

    if (!hourly && !event && validPresets.length === 0) {
      setError('חייב להגדיר לפחות תעריף שעתי, תעריף אירוע, או תעריף מוגדר');
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
          rate_presets: validPresets.length > 0 ? validPresets : null,
          contact_info: form.contact_info.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
      } else {
        onAdd(data);
        setForm(emptyForm);
        setPresets([]);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-above-nav">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-semibold">לקוח חדש</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form id="add-client-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 space-y-3 pb-2">
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

          {/* Rate presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">תעריפים מוגדרים</label>
              <button
                type="button"
                onClick={addPreset}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} /> הוסף תעריף
              </button>
            </div>
            {presets.map((preset, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={preset.name}
                  onChange={e => updatePreset(i, 'name', e.target.value)}
                  placeholder="מחסן"
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={preset.rate || ''}
                  onChange={e => updatePreset(i, 'rate', parseFloat(e.target.value) || 0)}
                  placeholder="₪"
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={preset.type}
                  onChange={e => updatePreset(i, 'type', e.target.value as RatePreset['type'])}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.entries(RATE_TYPE_LABELS) as [RatePreset['type'], string][]).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removePreset(i)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {presets.length === 0 && (
              <p className="text-xs text-gray-400">תעריפים מוגדרים מאפשרים בחירת תעריף בעת הוספת שעות</p>
            )}
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
        </form>

        <div className="shrink-0 px-5 pt-3 pb-5">
          <button
            type="submit"
            form="add-client-form"
            disabled={loading || !form.name.trim()}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'שומר...' : 'הוסף לקוח'}
          </button>
        </div>
      </div>
    </div>
  );
}
