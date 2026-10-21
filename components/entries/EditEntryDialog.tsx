'use client';

import { useState, useEffect } from 'react';
import type { WorkEntry } from '@/types';
import Sheet from '@/components/shared/Sheet';

interface EditEntryDialogProps {
  entry: WorkEntry | null;
  onClose: () => void;
  onSave: (entry: WorkEntry) => void;
}

function parseTimeToMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function calcHoursFromRange(from: string, to: string): number | null {
  const fromMin = parseTimeToMinutes(from);
  const toMin = parseTimeToMinutes(to);
  if (fromMin === null || toMin === null) return null;
  let diff = toMin - fromMin;
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return null;
  const rounded = Math.round(diff / 15) * 0.25;
  return Math.max(0.25, Math.min(24, rounded));
}

function parseDescriptionToTimeParts(desc: string | null): { timeFrom: string; timeTo: string; rest: string } {
  if (!desc) return { timeFrom: '', timeTo: '', rest: '' };
  const match = desc.match(/^(\d{2}:\d{2})[–-](\d{2}:\d{2})\s*[|]?\s*(.*)/);
  if (match) return { timeFrom: match[1], timeTo: match[2], rest: match[3].trim() };
  return { timeFrom: '', timeTo: '', rest: desc };
}

export default function EditEntryDialog({ entry, onClose, onSave }: EditEntryDialogProps) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
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
      const { timeFrom: tf, timeTo: tt, rest } = parseDescriptionToTimeParts(entry.description);
      setTimeFrom(tf);
      setTimeTo(tt);
      setDescription(rest);
      setError('');
    }
  }, [entry]);

  useEffect(() => {
    if (timeFrom && timeTo) {
      const computed = calcHoursFromRange(timeFrom, timeTo);
      if (computed !== null) setHours(String(computed));
    }
  }, [timeFrom, timeTo]);

  const isHours = entry?.entry_type === 'hours';

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!entry) return;
    setError('');
    setLoading(true);

    let finalDescription = description.trim() || null;
    if (isHours && timeFrom && timeTo) {
      const timeLabel = `${timeFrom}–${timeTo}`;
      finalDescription = finalDescription ? `${timeLabel} | ${finalDescription}` : timeLabel;
    }

    const body: Record<string, unknown> = {
      entry_date: date,
      amount: parseFloat(amount),
      description: finalDescription,
    };
    if (isHours) body.hours = parseFloat(hours);
    else body.event_name = eventName.trim();

    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      onSave(data);
      onClose();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={entry !== null}
      onClose={onClose}
      title="עריכת רשומה"
      subtitle={entry?.client?.name}
      footer={
        <button type="submit" form="edit-entry-form" disabled={loading} className="wm-btn wm-btn-brass w-full">
          {loading ? 'שומר…' : 'שמור שינויים'}
        </button>
      }
    >
      <form id="edit-entry-form" onSubmit={handleSubmit} className="space-y-3">
        {isHours ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ed-from" className="wm-label">משעה</label>
                <input id="ed-from" type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className="wm-field" />
              </div>
              <div>
                <label htmlFor="ed-to" className="wm-label">עד שעה</label>
                <input id="ed-to" type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} className="wm-field" />
              </div>
            </div>
            <div>
              <label htmlFor="ed-hours" className="wm-label">שעות</label>
              <input id="ed-hours" type="number" inputMode="decimal" min="0.25" max="24" step="0.25" value={hours}
                onChange={e => setHours(e.target.value)} className="wm-field" />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="ed-event" className="wm-label">שם האירוע</label>
            <input id="ed-event" type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="wm-field" />
          </div>
        )}

        <div>
          <label htmlFor="ed-amount" className="wm-label">סכום (₪)</label>
          <input id="ed-amount" type="number" inputMode="decimal" min="0" step="1" value={amount}
            onChange={e => setAmount(e.target.value)} className="wm-field" />
        </div>
        <div>
          <label htmlFor="ed-date" className="wm-label">תאריך</label>
          <input id="ed-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="wm-field" />
        </div>
        <div>
          <label htmlFor="ed-note" className="wm-label">הערה</label>
          <input id="ed-note" type="text" value={description} onChange={e => setDescription(e.target.value)} className="wm-field" />
        </div>

        {error && <p role="alert" className="wm-error">{error}</p>}
      </form>
    </Sheet>
  );
}
