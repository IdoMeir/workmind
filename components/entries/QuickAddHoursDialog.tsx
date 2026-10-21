'use client';

import { useState, useEffect } from 'react';
import { Client, WorkEntry, RatePreset } from '@/types';
import { todayISO } from '@/lib/hebrew-format';
import Sheet from '@/components/shared/Sheet';
import Money from '@/components/shared/Money';
import { track } from '@/lib/events';

interface QuickAddHoursDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: WorkEntry) => void;
  clients: Client[];
  /** הלקוח האחרון — נבחר אוטומטית, בלי שלב בחירה. */
  defaultClientId?: string | null;
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
  if (diff <= 0) diff += 24 * 60; // crosses midnight
  const rounded = Math.round(diff / 15) * 0.25; // nearest 0.25h
  return Math.max(0.25, Math.min(24, rounded));
}

function getPresets(client: Client | undefined): RatePreset[] {
  return client?.rate_presets?.filter(p => p.type === 'hourly') ?? [];
}

export default function QuickAddHoursDialog({ open, onClose, onAdd, clients, defaultClientId }: QuickAddHoursDialogProps) {
  const activeClients = clients.filter(c => c.is_active);

  const [hours, setHours] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  /** תעריף שהוקלד ברישום הזה. ריק = ברירת המחדל של הלקוח (או התעריף המוגדר שנבחר). */
  const [rateInput, setRateInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveClientId = activeClients.length === 1 ? activeClients[0].id : clientId;
  const selectedClient = activeClients.find(c => c.id === effectiveClientId);
  const presets = getPresets(selectedClient);

  // When both time fields are filled, auto-compute hours
  useEffect(() => {
    if (timeFrom && timeTo) {
      const computed = calcHoursFromRange(timeFrom, timeTo);
      if (computed !== null) setHours(computed.toString());
    }
  }, [timeFrom, timeTo]);

  // לקוח אחר → חוזרים לתעריפי ברירת המחדל שלו
  useEffect(() => {
    setSelectedPreset('');
    setRateInput('');
  }, [effectiveClientId]);

  useEffect(() => {
    if (open) {
      setHours('');
      setTimeFrom('');
      setTimeTo('');
      setClientId(defaultClientId && clients.some(c => c.id === defaultClientId && c.is_active) ? defaultClientId : '');
      setDescription('');
      setRateInput('');
      setSelectedPreset('');
      setError('');
      setDate(todayISO());
    }
  }, [open, defaultClientId, clients]);

  // התעריף מוצע מברירת המחדל של הלקוח (או מהתעריף המוגדר), וניתן לשינוי בכל רישום.
  // הסכום שנשמר הוא הערכה — ההכנסה בפועל היא התשלום.
  const hoursNum = parseFloat(hours) || 0;
  const activePreset = presets.find(p => p.name === selectedPreset);
  const defaultRate = activePreset ? activePreset.rate : (selectedClient?.hourly_rate != null ? Number(selectedClient.hourly_rate) : null);
  const effectiveRate = rateInput !== '' ? parseFloat(rateInput) || null : defaultRate;
  const previewAmount = effectiveRate && hoursNum ? Math.round(hoursNum * effectiveRate * 100) / 100 : null;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!effectiveClientId) { setError('בחר לקוח'); return; }
    if (!hours || parseFloat(hours) <= 0) { setError('הכנס מספר שעות'); return; }

    // Build description: prepend time range if used
    let desc = description.trim();
    if (timeFrom && timeTo) {
      const timeLabel = `${timeFrom}–${timeTo}`;
      desc = desc ? `${timeLabel} | ${desc}` : timeLabel;
    }

    // הסכום המשוער לפי התעריף שבטופס (לא נעול לתעריף הלקוח)
    const resolvedCustomAmount = previewAmount ?? undefined;

    setLoading(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: 'hours',
          client_id: effectiveClientId,
          entry_date: date,
          hours: parseFloat(hours),
          description: desc || null,
          ...(resolvedCustomAmount !== undefined ? { custom_amount: resolvedCustomAmount } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      track('entry_saved', { kind: 'work' });
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
      title="עבודה לעסק"
      subtitle={selectedClient?.name}
      footer={
        <button type="submit" form="add-hours-form" disabled={loading} className="wm-btn wm-btn-brass w-full">
          {loading ? 'שומר…' : 'שמור'}
        </button>
      }
    >
      <form id="add-hours-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="hours-hours" className="wm-label">שעות</label>
          <input
            id="hours-hours"
            type="number"
            inputMode="decimal"
            min="0.25"
            max="24"
            step="0.25"
            value={hours}
            onChange={e => setHours(e.target.value)}
            autoFocus
            className="wm-field wm-num text-[19px]"
            placeholder="2.5"
          />
        </div>

        {/* Time range — optional, auto-fills hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="hours-from" className="wm-label">משעה (רשות)</label>
            <input id="hours-from" type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className="wm-field" />
          </div>
          <div>
            <label htmlFor="hours-to" className="wm-label">עד שעה</label>
            <input id="hours-to" type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} className="wm-field" />
          </div>
        </div>

        {activeClients.length > 1 && (
          <div>
            <label htmlFor="hours-client" className="wm-label">לקוח</label>
            <select id="hours-client" value={clientId} onChange={e => setClientId(e.target.value)} className="wm-field">
              <option value="">בחר לקוח…</option>
              {activeClients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* תעריף מוגדר — ממלא את שדה התעריף */}
        {presets.length > 0 && (
          <div>
            <label htmlFor="hours-preset" className="wm-label">תעריף מוגדר</label>
            <select id="hours-preset" value={selectedPreset}
              onChange={e => { setSelectedPreset(e.target.value); setRateInput(''); }} className="wm-field">
              {selectedClient?.hourly_rate && (
                <option value="">ברירת מחדל — {selectedClient.hourly_rate}₪ לשעה</option>
              )}
              {presets.map(p => (
                <option key={p.name} value={p.name}>{p.name} — {p.rate}₪ לשעה</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="hours-rate" className="wm-label">תעריף לשעה (₪) — אפשר לשנות</label>
          <input id="hours-rate" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
            value={rateInput !== '' ? rateInput : defaultRate ?? ''}
            onChange={e => setRateInput(e.target.value)}
            placeholder="לפי הלקוח" />
        </div>

        <div>
          <label htmlFor="hours-date" className="wm-label">תאריך</label>
          <input id="hours-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="wm-field" />
        </div>

        <div>
          <label htmlFor="hours-note" className="wm-label">הערה</label>
          <input id="hours-note" type="text" value={description} onChange={e => setDescription(e.target.value)}
            className="wm-field" placeholder="רשות" />
        </div>

        {previewAmount !== null && (
          <p className="text-[15px] text-text" aria-live="polite">
            סכום משוער <Money amount={previewAmount} fractionDigits={2} context="משוער" className="wm-num text-brass" />
            <span className="block text-[13px] text-text-mute">ההכנסה בפועל נקבעת לפי התשלום שיתקבל.</span>
          </p>
        )}

        {error && <p role="alert" className="wm-error">{error}</p>}
      </form>
    </Sheet>
  );
}
