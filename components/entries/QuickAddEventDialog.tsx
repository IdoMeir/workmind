'use client';

import { useState, useEffect } from 'react';
import type { Client, WorkEntry } from '@/types';
import { todayISO } from '@/lib/hebrew-format';
import Sheet from '@/components/shared/Sheet';
import Money from '@/components/shared/Money';
import { track } from '@/lib/events';

interface QuickAddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: WorkEntry) => void;
  clients: Client[];
}

export default function QuickAddEventDialog({ open, onClose, onAdd, clients }: QuickAddEventDialogProps) {
  const activeClients = clients.filter(c => c.is_active);

  const [eventName, setEventName] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveClientId = activeClients.length === 1 ? activeClients[0].id : clientId;

  useEffect(() => {
    if (open) {
      setEventName('');
      setClientId('');
      setDescription('');
      setCustomAmount('');
      setShowCustom(false);
      setError('');
      setDate(todayISO());
    }
  }, [open]);

  const selectedClient = activeClients.find(c => c.id === effectiveClientId);
  const previewAmount = customAmount ? parseFloat(customAmount) : selectedClient?.event_rate ?? null;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!effectiveClientId) { setError('בחר לקוח'); return; }
    if (!eventName.trim()) { setError('הכנס שם אירוע'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: 'event',
          client_id: effectiveClientId,
          entry_date: date,
          event_name: eventName.trim(),
          description: description.trim() || null,
          ...(customAmount ? { custom_amount: parseFloat(customAmount) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      track('entry_saved', { kind: 'event' });
      onAdd(data);
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
      title="אירוע לעסק"
      footer={
        <button type="submit" form="add-event-form" disabled={loading} className="wm-btn wm-btn-brass w-full">
          {loading ? 'שומר…' : 'שמור'}
        </button>
      }
    >
      <form id="add-event-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="ev-name" className="wm-label">שם האירוע</label>
          <input id="ev-name" type="text" value={eventName} onChange={e => setEventName(e.target.value)} autoFocus
            className="wm-field" placeholder="ערב צדקה" />
        </div>

        {activeClients.length > 1 && (
          <div>
            <label htmlFor="ev-client" className="wm-label">לקוח</label>
            <select id="ev-client" value={clientId} onChange={e => setClientId(e.target.value)} className="wm-field">
              <option value="">בחר לקוח…</option>
              {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="ev-date" className="wm-label">תאריך</label>
          <input id="ev-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="wm-field" />
        </div>

        <div>
          <label htmlFor="ev-note" className="wm-label">הערה</label>
          <input id="ev-note" type="text" value={description} onChange={e => setDescription(e.target.value)}
            className="wm-field" placeholder="רשות" />
        </div>

        <button type="button" onClick={() => setShowCustom(v => !v)} aria-expanded={showCustom}
          className="min-h-11 text-[13px] text-text-mute underline">
          {showCustom ? 'הסתר סכום ידני' : 'שנה סכום ידנית'}
        </button>

        {showCustom && (
          <div>
            <label htmlFor="ev-custom" className="wm-label">סכום ידני (₪)</label>
            <input id="ev-custom" type="number" inputMode="decimal" min="0" step="1" value={customAmount}
              onChange={e => setCustomAmount(e.target.value)} className="wm-field" />
          </div>
        )}

        {previewAmount !== null && (
          <p className="text-[15px]" aria-live="polite">
            סכום <Money amount={Number(previewAmount)} className="wm-num text-brass" />
          </p>
        )}

        {error && <p role="alert" className="wm-error">{error}</p>}
      </form>
    </Sheet>
  );
}
