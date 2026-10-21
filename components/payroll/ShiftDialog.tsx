'use client';

import { useEffect, useMemo, useState } from 'react';
import Sheet from '@/components/shared/Sheet';
import Money from '@/components/shared/Money';
import CalendarTag from '@/components/payroll/CalendarTag';
import { addDays, computeWeek, dailyOvertimeHours, regularDayTemplate, shiftFlatRateWarning, shiftPay, weekStart } from '@/lib/payroll/overtime';
import { toRules } from '@/lib/payroll/employer';
import { formatDayAndDate, formatDecimal, formatHours, todayISO } from '@/lib/hebrew-format';
import { track } from '@/lib/events';
import type { Employer, Shift } from '@/types';

interface ShiftDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (shift: Shift) => void;
  onDeleted?: (id: string) => void;
  employer: Employer;
  /** עריכה של משמרת קיימת. */
  shift?: Shift | null;
}

export default function ShiftDialog({ open, onClose, onSaved, onDeleted, employer, shift }: ShiftDialogProps) {
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [breakMin, setBreakMin] = useState(employer.break_minutes);
  const [isRest, setIsRest] = useState(false);
  const [weekShifts, setWeekShifts] = useState<Shift[]>([]);
  const [history, setHistory] = useState<Shift[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const rules = useMemo(() => toRules(employer), [employer]);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (shift) {
      setDate(shift.shift_date);
      setStart(shift.start_time.slice(0, 5));
      setEnd(shift.end_time.slice(0, 5));
      setBreakMin(shift.break_minutes);
      setIsRest(shift.is_rest_day);
    } else {
      setDate(todayISO());
      setStart('');
      setEnd('');
      setBreakMin(employer.break_minutes);
      setIsRest(false);
    }
    fetch('/api/shifts?limit=30')
      .then(r => (r.ok ? r.json() : []))
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [open, shift, employer.break_minutes]);

  // שאר משמרות השבוע — לחישוב חי של הסף השבועי.
  useEffect(() => {
    if (!open || !date) return;
    const from = weekStart(date);
    fetch(`/api/shifts?from=${from}&to=${addDays(from, 6)}`)
      .then(r => (r.ok ? r.json() : []))
      .then((list: Shift[]) => setWeekShifts(list.filter(s => s.employer_id === employer.id && s.id !== shift?.id)))
      .catch(() => setWeekShifts([]));
  }, [open, date, employer.id, shift?.id]);

  const preview = useMemo(() => {
    if (!start || !end) return null;
    const current = { shift_date: date, start_time: start, end_time: end, break_minutes: breakMin, is_rest_day: isRest };
    const all = [...weekShifts, current];
    const b = computeWeek(all, rules)[all.length - 1];
    return { b, pay: shiftPay(b, rules) };
  }, [start, end, date, breakMin, isRest, weekShifts, rules]);

  function fillRegularDay() {
    const t = regularDayTemplate(history, rules, employer.break_minutes);
    setStart(t.start_time);
    setEnd(t.end_time);
    setBreakMin(t.break_minutes);
  }

  async function save() {
    if (!start || !end) { setError('חסרות שעת התחלה וסיום'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(shift ? `/api/shifts/${shift.id}` : '/api/shifts', {
        method: shift ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_id: employer.id,
          shift_date: date,
          start_time: start,
          end_time: end,
          break_minutes: breakMin,
          is_rest_day: isRest,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בשמירה'); return; }
      track('entry_saved', { kind: 'shift', edit: !!shift });
      onSaved(data);
      onClose();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!shift) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, { method: 'DELETE' });
      if (!res.ok) { setError('שגיאה במחיקה'); return; }
      onDeleted?.(shift.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const b = preview?.b;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`משמרת ב${employer.name}`}
      subtitle={formatDayAndDate(date)}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={saving} className="wm-btn wm-btn-steel flex-1">
            {saving ? 'שומר…' : 'שמור'}
          </button>
          {shift && (
            <button type="button" onClick={remove} disabled={saving} className="wm-btn wm-btn-danger">
              מחק
            </button>
          )}
        </div>
      }
    >
      {shift?.calendar_event_id && (
        <p className="text-[13px] text-text-mute">
          <CalendarTag /> המשמרת נכנסה מהיומן. שמירה כאן תנתק אותה מהיומן, כדי שהעדכון הבא לא ידרוס את התיקון.
        </p>
      )}

      <button type="button" onClick={fillRegularDay} className="wm-btn wm-btn-ghost w-full">
        יום רגיל
      </button>

      <div>
        <label htmlFor="shift-date" className="wm-label">תאריך</label>
        <input id="shift-date" type="date" className="wm-field" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="shift-start" className="wm-label">התחלה</label>
          <input id="shift-start" type="time" className="wm-field" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="shift-end" className="wm-label">סיום</label>
          <input id="shift-end" type="time" className="wm-field" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="shift-break" className="wm-label">
          הפסקה בדקות {employer.break_paid ? '(בתשלום)' : '(לא בתשלום)'}
        </label>
        <input id="shift-break" type="number" inputMode="numeric" min="0" max="240" className="wm-field"
          value={breakMin} onChange={e => setBreakMin(Number(e.target.value) || 0)} />
      </div>

      <label className="flex items-center gap-3 min-h-11">
        <input type="checkbox" className="size-5 accent-[var(--color-steel)]" checked={isRest}
          onChange={e => setIsRest(e.target.checked)} />
        <span>יום מנוחה / חג</span>
      </label>

      {b && (
        <div className="border-t border-rule pt-3" aria-live="polite">
          <p className="wm-num text-[21px] text-text">{formatHours(b.netHours)} שעות</p>
          <p className="text-[13px] text-text-mute">
            {isRest
              ? `מנוחה ${formatDecimal(b.rest)} · 187.5% ${formatDecimal(b.restOt1)} · 225% ${formatDecimal(b.restOt2)}`
              : `רגילות ${formatDecimal(b.regular)} · 125% ${formatDecimal(b.h125)} · 150% ${formatDecimal(b.h150)}`}
          </p>
          {rules.ot_flat_rate && !isRest && dailyOvertimeHours(b) > 0 && (
            <p className="text-[15px]">
              שעות נוספות: <bdi className="wm-num">{formatDecimal(dailyOvertimeHours(b))}</bdi> × <Money amount={rules.ot_flat_rate} context="לשעה" />
            </p>
          )}
          {!isRest && shiftFlatRateWarning(b, rules) === '125' && (
            <p className="text-[13px] text-alert">התעריף נמוך מהמינימום בחוק לשעות נוספות (125%)</p>
          )}
          {!isRest && shiftFlatRateWarning(b, rules) === '150' && (
            <p className="text-[13px] text-alert">משעה נוספת שלישית החוק דורש 150%</p>
          )}
          {b.weeklyConverted > 0 && (
            <p className="text-[13px] text-text-mute">{formatDecimal(b.weeklyConverted)} שעות מעל הסף השבועי</p>
          )}
          <p className="text-[15px] text-text mt-1">
            שווי משוער <Money amount={preview.pay} className="wm-num text-steel" />
          </p>
        </div>
      )}

      {error && <p role="alert" className="wm-error">{error}</p>}
    </Sheet>
  );
}
