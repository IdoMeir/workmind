'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { BASE_POINTS, SETTLEMENT_DEFAULT } from '@/lib/tax';
import { formatDecimal } from '@/lib/hebrew-format';
import type { UserSettings } from '@/types';

type FormData = {
  full_name: string;
  business_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  extra_credit_points: string;
  settlement_name: string;
  settlement_credit_rate: string;
  settlement_ceiling: string;
  tax_track: 'zair' | 'regular';
  is_kibbutz_member: boolean;
};

const DEFAULT_FORM: FormData = {
  full_name: '',
  business_name: '',
  tax_id: '',
  address: '',
  phone: '',
  email: '',
  gender: 'male',
  extra_credit_points: '0',
  settlement_name: SETTLEMENT_DEFAULT.name,
  settlement_credit_rate: String(SETTLEMENT_DEFAULT.rate * 100),
  settlement_ceiling: String(SETTLEMENT_DEFAULT.ceiling),
  tax_track: 'zair',
  is_kibbutz_member: false,
};

function settingsToForm(s: UserSettings): FormData {
  return {
    full_name: s.full_name ?? '',
    business_name: s.business_name ?? '',
    tax_id: s.tax_id ?? '',
    address: s.address ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    gender: s.gender ?? 'male',
    extra_credit_points: String(s.extra_credit_points ?? 0),
    settlement_name: s.settlement_name ?? '',
    settlement_credit_rate: String(Number(s.settlement_credit_rate ?? SETTLEMENT_DEFAULT.rate) * 100),
    settlement_ceiling: String(s.settlement_ceiling ?? SETTLEMENT_DEFAULT.ceiling),
    tax_track: s.tax_track ?? 'zair',
    is_kibbutz_member: s.is_kibbutz_member ?? false,
  };
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="wm-label">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [legacySalary, setLegacySalary] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => (r.ok ? r.json() : null))
      .then((data: UserSettings | null) => {
        if (data) {
          setForm(settingsToForm(data));
          setLegacySalary(Number(data.salary_annual_income ?? 0));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    const payload = {
      full_name: form.full_name,
      business_name: form.business_name || null,
      tax_id: form.tax_id || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      gender: form.gender,
      extra_credit_points: parseFloat(form.extra_credit_points) || 0,
      settlement_name: form.settlement_name || null,
      settlement_credit_rate: (parseFloat(form.settlement_credit_rate) || 0) / 100,
      settlement_ceiling: parseFloat(form.settlement_ceiling) || SETTLEMENT_DEFAULT.ceiling,
      // נשאר לתאימות; השכר מחושב היום מהתלושים והמשמרות.
      salary_annual_income: legacySalary,
      tax_track: form.tax_track,
      is_kibbutz_member: form.is_kibbutz_member,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'שגיאה בשמירה');
      else setSaved(true);
    } catch {
      setError('שגיאת רשת');
    } finally {
      setSaving(false);
    }
  }

  const totalPoints = BASE_POINTS[form.gender] + (parseFloat(form.extra_credit_points) || 0);

  if (loading) {
    return (
      <>
        <PageHeader title="הגדרות" backHref="/more" />
        <div className="p-4 space-y-3" aria-busy="true" aria-label="טוען">
          {[1, 2, 3].map(i => <div key={i} className="wm-card h-24 animate-pulse" />)}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="הגדרות" backHref="/more" />
      <form onSubmit={handleSave} className="p-4 space-y-4">
        <section className="wm-card p-4 space-y-3" aria-labelledby="set-personal">
          <h2 id="set-personal" className="wm-title text-[17px]">פרטים אישיים</h2>
          <Field id="s-name" label="שם מלא">
            <input id="s-name" required value={form.full_name} onChange={e => set('full_name', e.target.value)} className="wm-field" />
          </Field>
          <Field id="s-biz" label="שם עסק">
            <input id="s-biz" value={form.business_name} onChange={e => set('business_name', e.target.value)} className="wm-field" placeholder="רשות" />
          </Field>
          <Field id="s-tax-id" label="ת.ז. / ח.פ.">
            <input id="s-tax-id" inputMode="numeric" value={form.tax_id} onChange={e => set('tax_id', e.target.value)} className="wm-field" />
          </Field>
          <Field id="s-address" label="כתובת">
            <input id="s-address" value={form.address} onChange={e => set('address', e.target.value)} className="wm-field" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="s-phone" label="טלפון">
              <input id="s-phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="wm-field" />
            </Field>
            <Field id="s-email" label="אימייל">
              <input id="s-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} className="wm-field" />
            </Field>
          </div>
        </section>

        <section className="wm-card p-4 space-y-3" aria-labelledby="set-tax">
          <h2 id="set-tax" className="wm-title text-[17px]">מס</h2>

          <fieldset>
            <legend className="wm-label">מין (משפיע על נקודות הזיכוי)</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)} aria-pressed={form.gender === g}
                  className={`wm-btn ${form.gender === g ? 'wm-btn-sage' : 'wm-btn-ghost'}`}>
                  {g === 'male' ? 'זכר' : 'נקבה'}
                </button>
              ))}
            </div>
          </fieldset>

          <Field id="s-points" label={`נקודות זיכוי נוספות (סה"כ ${formatDecimal(totalPoints)})`}>
            <input id="s-points" type="number" inputMode="decimal" min={0} max={20} step={0.25}
              value={form.extra_credit_points} onChange={e => set('extra_credit_points', e.target.value)} className="wm-field" />
          </Field>

          <fieldset>
            <legend className="wm-label">מסלול העסק</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['zair', 'עסק זעיר'], ['regular', 'רגיל']] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => set('tax_track', value)} aria-pressed={form.tax_track === value}
                  className={`wm-btn ${form.tax_track === value ? 'wm-btn-brass' : 'wm-btn-ghost'}`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <Field id="s-settlement" label="ישוב מוטב">
            <input id="s-settlement" value={form.settlement_name} onChange={e => set('settlement_name', e.target.value)}
              className="wm-field" placeholder="ריק אם לא רלוונטי" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="s-rate" label="שיעור זיכוי (%)">
              <input id="s-rate" type="number" inputMode="decimal" min={0} max={30} step={0.1}
                value={form.settlement_credit_rate} onChange={e => set('settlement_credit_rate', e.target.value)} className="wm-field" />
            </Field>
            <Field id="s-ceiling" label="תקרת הכנסה מזכה (₪)">
              <input id="s-ceiling" type="number" inputMode="numeric" min={0} step={1000}
                value={form.settlement_ceiling} onChange={e => set('settlement_ceiling', e.target.value)} className="wm-field" />
            </Field>
          </div>

          <label className="flex items-center gap-3 min-h-11">
            <input type="checkbox" className="size-5 accent-[var(--color-sage)]" checked={form.is_kibbutz_member}
              onChange={e => set('is_kibbutz_member', e.target.checked)} />
            <span>חבר קיבוץ</span>
          </label>
          <p className="text-[13px] text-text-mute">את המשכורת מחשבים מהתלושים ומהמשמרות. הגדרות השכר נמצאות במסך המעסיק.</p>
        </section>

        {error && <p role="alert" className="wm-error">{error}</p>}
        {saved && <p role="status" className="text-[15px] text-sage">ההגדרות נשמרו.</p>}

        <button type="submit" disabled={saving} className="wm-btn wm-btn-sage w-full">
          {saving ? 'שומר…' : 'שמור הגדרות'}
        </button>
      </form>
    </>
  );
}
