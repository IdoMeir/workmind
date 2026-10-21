'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Sheet from '@/components/shared/Sheet';
import type { Client, RatePreset } from '@/types';

interface ClientSheetProps {
  open: boolean;
  /** null = לקוח חדש. */
  client: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}

const RATE_TYPE_LABELS: Record<RatePreset['type'], string> = {
  hourly: 'שעתי',
  daily: 'יומי',
  fixed: 'קבוע',
};

const EMPTY = { name: '', description: '', hourly_rate: '', event_rate: '', contact_info: '', is_active: true };

export default function ClientSheet({ open, client, onClose, onSaved }: ClientSheetProps) {
  const [form, setForm] = useState(EMPTY);
  const [presets, setPresets] = useState<RatePreset[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (client) {
      setForm({
        name: client.name,
        description: client.description ?? '',
        hourly_rate: client.hourly_rate?.toString() ?? '',
        event_rate: client.event_rate?.toString() ?? '',
        contact_info: client.contact_info ?? '',
        is_active: client.is_active,
      });
      setPresets(client.rate_presets ?? []);
    } else {
      setForm(EMPTY);
      setPresets([]);
    }
  }, [open, client]);

  function updatePreset(i: number, field: keyof RatePreset, value: string | number) {
    setPresets(p => p.map((pr, idx) => (idx === i ? { ...pr, [field]: value } : pr)));
  }

  async function save() {
    setError('');
    const hourly = form.hourly_rate ? parseFloat(form.hourly_rate) : null;
    const event = form.event_rate ? parseFloat(form.event_rate) : null;
    const validPresets = presets.filter(p => p.name.trim() && p.rate > 0);
    if (!form.name.trim()) { setError('חסר שם לקוח'); return; }
    if (!hourly && !event && validPresets.length === 0) {
      setError('חייב להגדיר לפחות תעריף שעתי, תעריף אירוע, או תעריף מוגדר');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(client ? `/api/clients/${client.id}` : '/api/clients', {
        method: client ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          hourly_rate: hourly,
          event_rate: event,
          rate_presets: validPresets.length > 0 ? validPresets : null,
          contact_info: form.contact_info.trim() || null,
          ...(client ? { is_active: form.is_active } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בשמירה'); return; }
      onSaved(data);
      onClose();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={client ? 'עריכת לקוח' : 'לקוח חדש'}
      footer={
        <button type="button" onClick={save} disabled={loading} className="wm-btn wm-btn-brass w-full">
          {loading ? 'שומר…' : client ? 'שמור שינויים' : 'הוסף לקוח'}
        </button>
      }
    >
      <div>
        <label htmlFor="cl-name" className="wm-label">שם לקוח</label>
        <input id="cl-name" className="wm-field" value={form.name} autoFocus={!client}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label htmlFor="cl-desc" className="wm-label">תיאור</label>
        <input id="cl-desc" className="wm-field" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="רשות" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cl-hourly" className="wm-label">תעריף שעתי (₪)</label>
          <input id="cl-hourly" type="number" inputMode="decimal" min="0" step="1" className="wm-field"
            value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="cl-event" className="wm-label">תעריף אירוע (₪)</label>
          <input id="cl-event" type="number" inputMode="decimal" min="0" step="1" className="wm-field"
            value={form.event_rate} onChange={e => setForm(f => ({ ...f, event_rate: e.target.value }))} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="wm-label mb-0">תעריפים מוגדרים</legend>
          <button type="button" onClick={() => setPresets(p => [...p, { name: '', rate: 0, type: 'hourly' }])}
            className="wm-btn text-brass text-[13px]">
            <Plus size={16} aria-hidden="true" /> הוסף תעריף
          </button>
        </div>
        {presets.map((preset, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input aria-label="שם התעריף" className="wm-field flex-1" value={preset.name}
              onChange={e => updatePreset(i, 'name', e.target.value)} placeholder="מחסן" />
            <input aria-label="תעריף בשקלים" type="number" inputMode="decimal" min="0" step="1" className="wm-field w-20"
              value={preset.rate || ''} onChange={e => updatePreset(i, 'rate', parseFloat(e.target.value) || 0)} />
            <select aria-label="סוג תעריף" className="wm-field w-24" value={preset.type}
              onChange={e => updatePreset(i, 'type', e.target.value as RatePreset['type'])}>
              {(Object.entries(RATE_TYPE_LABELS) as [RatePreset['type'], string][]).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <button type="button" onClick={() => setPresets(p => p.filter((_, idx) => idx !== i))}
              aria-label="הסר תעריף" className="wm-btn text-text-mute">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {presets.length === 0 && (
          <p className="text-[13px] text-text-mute">תעריפים מוגדרים מאפשרים לבחור תעריף בזמן רישום שעות.</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="cl-contact" className="wm-label">פרטי קשר</label>
        <input id="cl-contact" className="wm-field" value={form.contact_info}
          onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))} placeholder="טלפון / אימייל" />
      </div>

      {client && (
        <label className="flex items-center gap-3 min-h-11">
          <input type="checkbox" className="size-5 accent-[var(--color-brass)]" checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          <span>לקוח פעיל</span>
        </label>
      )}

      {error && <p role="alert" className="wm-error">{error}</p>}
    </Sheet>
  );
}
