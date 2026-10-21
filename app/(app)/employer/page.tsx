'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Money from '@/components/shared/Money';
import { EMPLOYER_DEFAULTS, MIN_WAGE_HOURLY, WORKWEEK_DEFAULTS } from '@/lib/payroll/rules-2026';
import { flatRateWarnings, hourlyEquivalent, isBelowMinimumWage } from '@/lib/payroll/overtime';
import { toRules } from '@/lib/payroll/employer';
import { DAY_NAMES } from '@/lib/hebrew-format';
import type { Employer, PayType } from '@/types';

type Form = Omit<Employer, 'id' | 'user_id' | 'created_at'>;

const EMPTY: Form = {
  ...EMPLOYER_DEFAULTS,
  pay_type: EMPLOYER_DEFAULTS.pay_type as PayType,
  workweek_days: EMPLOYER_DEFAULTS.workweek_days,
  name: '',
  deduction_file: null,
  start_date: null,
  end_date: null,
  hourly_rate: null,
  daily_rate: null,
  monthly_salary: null,
  travel_per_day: null,
  has_existing_pension: null,
};

const PAY_TYPES: { value: PayType; label: string }[] = [
  { value: 'daily', label: 'יומי' },
  { value: 'hourly', label: 'שעתי' },
  { value: 'monthly', label: 'חודשי' },
];

const num = (v: string) => (v === '' ? null : Number(v));

export default function EmployerPage() {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/employers')
      .then(r => (r.ok ? r.json() : []))
      .then((list: Employer[]) => {
        if (list[0]) {
          setEmployer(list[0]);
          const { id: _id, user_id: _u, created_at: _c, ...rest } = list[0];
          setForm(rest);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setMessage(null);
  }

  function setWorkweek(days: 5 | 6) {
    const d = WORKWEEK_DEFAULTS[days];
    setForm(f => ({
      ...f,
      workweek_days: days,
      short_day: d.shortDay,
      ot_daily_threshold: d.dailyThreshold,
      ot_short_day_threshold: d.shortDayThreshold,
      standard_day_hours: d.dailyThreshold,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (form.ot_flat_rate !== null && !(form.ot_flat_rate > 0)) {
        setMessage({ ok: false, text: 'הכנס תעריף לשעה נוספת, או בחר "לפי אחוזים"' });
        return;
      }
      const res = await fetch(employer ? `/api/employers/${employer.id}` : '/api/employers', {
        method: employer ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ ok: false, text: data.error || 'שגיאה בשמירה' }); return; }
      setEmployer(data);
      setMessage({ ok: true, text: 'נשמר. שווי המשמרות של השנה חושב מחדש.' });
    } catch {
      setMessage({ ok: false, text: 'שגיאת רשת' });
    } finally {
      setSaving(false);
    }
  }

  const rules = toRules({ ...form, id: '', user_id: '', created_at: '' } as Employer);
  const he = hourlyEquivalent(rules);
  const belowMin = isBelowMinimumWage(rules);
  const otWarn = flatRateWarnings(rules);
  const flatMode = form.ot_flat_rate !== null;

  return (
    <>
      <PageHeader title="מעסיק" subtitle="הגדרות שכר וחישוב שעות נוספות" backHref="/more" />

      {loading ? (
        <div className="p-4 space-y-3" aria-busy="true">
          {[1, 2, 3].map(i => <div key={i} className="wm-card h-24 animate-pulse" />)}
        </div>
      ) : (
        <form onSubmit={save} className="p-4 space-y-4 text-text">
          <section className="wm-card p-4 space-y-3">
            <div>
              <label htmlFor="emp-name" className="wm-label">שם המעסיק</label>
              <input id="emp-name" className="wm-field" value={form.name} required
                onChange={e => set('name', e.target.value)} placeholder="מסגריה" />
            </div>

            <fieldset>
              <legend className="wm-label">סוג תשלום</legend>
              <div className="grid grid-cols-3 gap-2">
                {PAY_TYPES.map(p => (
                  <button key={p.value} type="button" onClick={() => set('pay_type', p.value)}
                    aria-pressed={form.pay_type === p.value}
                    className={`wm-btn ${form.pay_type === p.value ? 'wm-btn-steel' : 'wm-btn-ghost'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {form.pay_type === 'daily' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="emp-daily" className="wm-label">תעריף יומי (₪)</label>
                  <input id="emp-daily" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                    value={form.daily_rate ?? ''} onChange={e => set('daily_rate', num(e.target.value))} />
                </div>
                <div>
                  <label htmlFor="emp-std" className="wm-label">שעות ביום מלא (נטו)</label>
                  <input id="emp-std" type="number" inputMode="decimal" min="1" max="24" step="0.1" className="wm-field"
                    value={form.standard_day_hours} onChange={e => set('standard_day_hours', Number(e.target.value))} />
                </div>
              </div>
            )}
            {form.pay_type === 'hourly' && (
              <div>
                <label htmlFor="emp-hourly" className="wm-label">תעריף לשעה (₪)</label>
                <input id="emp-hourly" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                  value={form.hourly_rate ?? ''} onChange={e => set('hourly_rate', num(e.target.value))} />
              </div>
            )}
            {form.pay_type === 'monthly' && (
              <div>
                <label htmlFor="emp-monthly" className="wm-label">משכורת חודשית ברוטו (₪)</label>
                <input id="emp-monthly" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                  value={form.monthly_salary ?? ''} onChange={e => set('monthly_salary', num(e.target.value))} />
              </div>
            )}

            {he > 0 && (
              <p className="text-[13px] text-text-mute">
                תעריף שעה שקול: <Money amount={he} fractionDigits={2} className="text-text" />
              </p>
            )}
            {belowMin && (
              <p role="alert" className="wm-error">
                תעריף השעה נמוך משכר המינימום (<Money amount={MIN_WAGE_HOURLY} fractionDigits={2} /> לשעה מ-1.4.2026). כדאי לבדוק את התלוש.
              </p>
            )}

            {form.pay_type === 'daily' && (
              <label className="flex items-center gap-3 min-h-11">
                <input type="checkbox" className="size-5 accent-[var(--color-steel)]" checked={form.short_day_paid_full}
                  onChange={e => set('short_day_paid_full', e.target.checked)} />
                <span>יום קצר משולם כיום מלא</span>
              </label>
            )}
          </section>

          <section className="wm-card p-4 space-y-3" aria-labelledby="emp-ot">
            <fieldset>
              <legend id="emp-ot" className="wm-label">תשלום על שעה נוספת</legend>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set('ot_flat_rate', null)} aria-pressed={!flatMode}
                  className={`wm-btn ${!flatMode ? 'wm-btn-steel' : 'wm-btn-ghost'}`}>
                  לפי אחוזים (125%/150%)
                </button>
                <button type="button" onClick={() => set('ot_flat_rate', form.ot_flat_rate ?? 0)} aria-pressed={flatMode}
                  className={`wm-btn ${flatMode ? 'wm-btn-steel' : 'wm-btn-ghost'}`}>
                  תעריף קבוע לשעה נוספת
                </button>
              </div>
            </fieldset>
            {flatMode && (
              <div>
                <label htmlFor="emp-ot-flat" className="wm-label">תעריף לשעה נוספת (₪)</label>
                <input id="emp-ot-flat" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                  value={form.ot_flat_rate ? form.ot_flat_rate : ''}
                  onChange={e => set('ot_flat_rate', e.target.value === '' ? 0 : Number(e.target.value))} />
                <p className="text-[13px] text-text-mute mt-1">ביום מנוחה החישוב נשאר לפי אחוזים.</p>
              </div>
            )}
            {flatMode && otWarn.below125 && (
              <p role="alert" className="wm-error">התעריף נמוך מהמינימום בחוק לשעות נוספות (125%)</p>
            )}
            {flatMode && !otWarn.below125 && otWarn.below150 && (
              <p role="alert" className="wm-error">משעה נוספת שלישית החוק דורש 150%</p>
            )}
          </section>

          <section className="wm-card p-4 space-y-3">
            <fieldset>
              <legend className="wm-label">שבוע עבודה</legend>
              <div className="grid grid-cols-2 gap-2">
                {([5, 6] as const).map(d => (
                  <button key={d} type="button" onClick={() => setWorkweek(d)} aria-pressed={form.workweek_days === d}
                    className={`wm-btn ${form.workweek_days === d ? 'wm-btn-steel' : 'wm-btn-ghost'}`}>
                    {d} ימים
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="emp-short" className="wm-label">היום הקצר</label>
                <select id="emp-short" className="wm-field" value={form.short_day ?? ''}
                  onChange={e => set('short_day', e.target.value === '' ? null : Number(e.target.value))}>
                  <option value="">אין</option>
                  {DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="emp-break" className="wm-label">הפסקה (דקות)</label>
                <input id="emp-break" type="number" inputMode="numeric" min="0" max="240" className="wm-field"
                  value={form.break_minutes} onChange={e => set('break_minutes', Number(e.target.value))} />
              </div>
            </div>
            <label className="flex items-center gap-3 min-h-11">
              <input type="checkbox" className="size-5 accent-[var(--color-steel)]" checked={form.break_paid}
                onChange={e => set('break_paid', e.target.checked)} />
              <span>הפסקה בתשלום</span>
            </label>

            <details className="group">
              <summary className="min-h-11 flex items-center cursor-pointer text-text-mute">ספי שעות נוספות (לפי החוק, ניתן לשנות לפי הסכם)</summary>
              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="emp-ot-d" className="wm-label">סף יומי (שעות)</label>
                  <input id="emp-ot-d" type="number" step="0.1" className="wm-field" value={form.ot_daily_threshold}
                    onChange={e => set('ot_daily_threshold', Number(e.target.value))} />
                </div>
                {form.short_day !== null && (
                <div>
                  <label htmlFor="emp-ot-s" className="wm-label">סף יום קצר (שעות)</label>
                  <input id="emp-ot-s" type="number" step="0.1" className="wm-field" value={form.ot_short_day_threshold}
                    onChange={e => set('ot_short_day_threshold', Number(e.target.value))} />
                </div>
                )}
                <div>
                  <label htmlFor="emp-ot-w" className="wm-label">סף שבועי (שעות)</label>
                  <input id="emp-ot-w" type="number" step="0.5" className="wm-field" value={form.ot_weekly_threshold}
                    onChange={e => set('ot_weekly_threshold', Number(e.target.value))} />
                </div>
              </div>
            </details>
          </section>

          <section className="wm-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="emp-start" className="wm-label">תחילת עבודה</label>
                <input id="emp-start" type="date" className="wm-field" value={form.start_date ?? ''}
                  onChange={e => set('start_date', e.target.value || null)} />
              </div>
              <div>
                <label htmlFor="emp-file" className="wm-label">תיק ניכויים</label>
                <input id="emp-file" inputMode="numeric" className="wm-field" value={form.deduction_file ?? ''}
                  onChange={e => set('deduction_file', e.target.value || null)} placeholder="לתיאום מס" />
              </div>
            </div>
            <div>
              <label htmlFor="emp-travel" className="wm-label">נסיעות ליום (₪)</label>
              <input id="emp-travel" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                value={form.travel_per_day ?? ''} onChange={e => set('travel_per_day', num(e.target.value))} />
            </div>
          </section>

          {message && (
            <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'text-sage text-[15px]' : 'wm-error'}>
              {message.text}
            </p>
          )}

          <button type="submit" disabled={saving} className="wm-btn wm-btn-steel w-full">
            {saving ? 'שומר…' : 'שמור'}
          </button>
        </form>
      )}
    </>
  );
}
