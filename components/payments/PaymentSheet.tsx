'use client';

import { useEffect, useMemo, useState } from 'react';
import Sheet from '@/components/shared/Sheet';
import Money from '@/components/shared/Money';
import { PAYMENT_METHODS } from '@/lib/payments';
import { track } from '@/lib/events';
import { formatDecimal, formatShortDate, todayISO } from '@/lib/hebrew-format';
import type { Client, Payment, PaymentMethod, WorkEntry } from '@/types';

export interface PaymentPreset {
  clientId?: string;
  amount?: number;
  date?: string;
  /** קבלה ישנה מ-WorkMind שהתקבול הזה מתעד. */
  receiptId?: string;
  receiptNumber?: string;
}

interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: (payment: Payment) => void;
  clients: Client[];
  preset?: PaymentPreset | null;
}

export default function PaymentSheet({ open, onClose, onSaved, clients, preset }: PaymentSheetProps) {
  const activeClients = clients.filter(c => c.is_active);
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [receiptNo, setReceiptNo] = useState('');
  const [openEntries, setOpenEntries] = useState<WorkEntry[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isLegacyReceipt = !!preset?.receiptId;

  useEffect(() => {
    if (!open) return;
    setClientId(preset?.clientId ?? (activeClients.length === 1 ? activeClients[0].id : ''));
    setDate(preset?.date ?? todayISO());
    setAmount(preset?.amount !== undefined ? String(preset.amount) : '');
    setAmountTouched(preset?.amount !== undefined);
    setMethod('transfer');
    setReceiptNo('');
    setSelected(new Set());
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

  useEffect(() => {
    if (!open || !clientId || isLegacyReceipt) { setOpenEntries(null); return; }
    setOpenEntries(null);
    fetch(`/api/entries?open=1&client_id=${clientId}`)
      .then(r => (r.ok ? r.json() : []))
      .then((list: WorkEntry[]) => setOpenEntries([...list].sort((a, b) => a.entry_date.localeCompare(b.entry_date))))
      .catch(() => setOpenEntries([]));
  }, [open, clientId, isLegacyReceipt]);

  const selectedSum = useMemo(
    () => Math.round((openEntries ?? []).filter(e => selected.has(e.id)).reduce((s, e) => s + Number(e.amount), 0) * 100) / 100,
    [openEntries, selected]
  );

  // הסכום עוקב אחרי העבודות שנבחרו, עד שהמשתמש מקליד סכום בעצמו.
  useEffect(() => {
    if (!amountTouched) setAmount(selectedSum > 0 ? String(selectedSum) : '');
  }, [selectedSum, amountTouched]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setError('');
    if (!clientId) { setError('בחר לקוח'); return; }
    if (!amount || Number(amount) <= 0) { setError('הכנס סכום'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          received_date: date,
          amount: Number(amount),
          method,
          external_receipt_no: receiptNo.trim() || null,
          receipt_id: preset?.receiptId ?? null,
          entry_ids: [...selected],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בשמירה'); return; }
      track('entry_saved', { kind: 'payment', legacy_receipt: isLegacyReceipt });
      onSaved(data);
      onClose();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setSaving(false);
    }
  }

  const amountNum = Number(amount) || 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="התקבל תשלום"
      subtitle={isLegacyReceipt ? `לפי קבלה ${preset?.receiptNumber}` : 'כסף שנכנס בפועל — נספר למחזור'}
      footer={
        <button type="button" onClick={save} disabled={saving} className="wm-btn wm-btn-brass w-full">
          {saving ? 'שומר…' : 'שמור תקבול'}
        </button>
      }
    >
      <div>
        <label htmlFor="pay-client" className="wm-label">לקוח</label>
        <select id="pay-client" className="wm-field" value={clientId} disabled={isLegacyReceipt}
          onChange={e => { setClientId(e.target.value); setSelected(new Set()); }}>
          <option value="">בחר לקוח…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!isLegacyReceipt && clientId && (
        <fieldset>
          <legend className="wm-label">עבודות פתוחות שהתשלום מכסה</legend>
          {openEntries === null ? (
            <div className="h-12 rounded-[10px] bg-ink animate-pulse" aria-busy="true" />
          ) : openEntries.length === 0 ? (
            <p className="text-[13px] text-text-mute">אין עבודות פתוחות ללקוח הזה.</p>
          ) : (
            <ul className="border border-rule rounded-[10px] divide-y divide-rule max-h-56 overflow-y-auto">
              {openEntries.map(e => (
                <li key={e.id}>
                  <label className="flex items-center gap-3 px-3 min-h-11">
                    <input type="checkbox" className="size-5 accent-[var(--color-brass)]"
                      checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                    <span className="text-[13px] text-text-mute w-10">{formatShortDate(e.entry_date)}</span>
                    <span className="flex-1 text-[15px]">
                      {e.entry_type === 'hours' ? `${formatDecimal(Number(e.hours))} ש׳` : e.event_name}
                    </span>
                    <Money amount={Number(e.amount)} />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pay-amount" className="wm-label">סכום שהתקבל (₪)</label>
          <input id="pay-amount" type="number" inputMode="decimal" min="0" step="any" className="wm-field wm-num"
            value={amount} onChange={e => { setAmount(e.target.value); setAmountTouched(true); }} />
        </div>
        <div>
          <label htmlFor="pay-date" className="wm-label">תאריך קבלה</label>
          <input id="pay-date" type="date" className="wm-field" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {selected.size > 0 && Math.abs(amountNum - selectedSum) >= 0.01 && (
        <p className="text-[13px] text-text-mute">
          העבודות שנבחרו שוות <Money amount={selectedSum} />. הפרש של <Money amount={Math.abs(amountNum - selectedSum)} fractionDigits={2} />.
        </p>
      )}

      <fieldset>
        <legend className="wm-label">אמצעי תשלום</legend>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map(m => (
            <button key={m.value} type="button" onClick={() => setMethod(m.value)} aria-pressed={method === m.value}
              className={`wm-btn ${method === m.value ? 'wm-btn-brass' : 'wm-btn-ghost'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {!isLegacyReceipt && (
        <div>
          <label htmlFor="pay-receipt" className="wm-label">מספר קבלה (מהתוכנה הרשומה)</label>
          <input id="pay-receipt" className="wm-field" value={receiptNo} onChange={e => setReceiptNo(e.target.value)}
            placeholder="רשות" />
        </div>
      )}

      {error && <p role="alert" className="wm-error">{error}</p>}
    </Sheet>
  );
}
