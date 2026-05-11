'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { getCreditPointsForUser, GAATON_CREDIT_RATE, GAATON_CEILING } from '@/lib/tax-calculator';
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
  salary_annual_income: string;
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
  settlement_name: 'געתון',
  settlement_credit_rate: String(GAATON_CREDIT_RATE * 100),
  settlement_ceiling: String(GAATON_CEILING),
  salary_annual_income: '0',
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
    settlement_credit_rate: String((s.settlement_credit_rate ?? GAATON_CREDIT_RATE) * 100),
    settlement_ceiling: String(s.settlement_ceiling ?? GAATON_CEILING),
    salary_annual_income: String(s.salary_annual_income ?? 0),
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data) setForm(settingsToForm(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function set(field: keyof FormData, value: string) {
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
      settlement_ceiling: parseFloat(form.settlement_ceiling) || GAATON_CEILING,
      salary_annual_income: parseFloat(form.salary_annual_income) || 0,
    };

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'שגיאה בשמירה');
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  const totalCredits = getCreditPointsForUser(
    form.gender,
    parseFloat(form.extra_credit_points) || 0
  );

  if (loading) {
    return (
      <>
        <PageHeader title="הגדרות" />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-16 animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="הגדרות" />
      <form onSubmit={handleSave} className="p-4 space-y-5 pb-24">

        {/* Personal details */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">פרטים אישיים</h2>

          <Field label="שם מלא *">
            <input
              required
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className={inputCls}
              placeholder="ישראל ישראלי"
            />
          </Field>
          <Field label="שם עסק">
            <input
              value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              className={inputCls}
              placeholder="שם העסק (אופציונלי)"
            />
          </Field>
          <Field label="ת.ז. / ח.פ.">
            <input
              value={form.tax_id}
              onChange={e => set('tax_id', e.target.value)}
              className={inputCls}
              placeholder="000000000"
            />
          </Field>
          <Field label="כתובת">
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className={inputCls}
              placeholder="רחוב, עיר"
            />
          </Field>
          <Field label="טלפון">
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className={inputCls}
              placeholder="050-0000000"
            />
          </Field>
          <Field label="אימייל">
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className={inputCls}
              placeholder="me@example.com"
            />
          </Field>
        </section>

        {/* Tax settings */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">הגדרות מס</h2>

          <Field label="מין">
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(g => (
                <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => set('gender', g)}
                    className="accent-indigo-600"
                  />
                  {g === 'male' ? 'זכר' : 'נקבה'}
                </label>
              ))}
            </div>
          </Field>

          <Field label={`נקודות זיכוי נוספות (סה"כ: ${totalCredits})`}>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={form.extra_credit_points}
              onChange={e => set('extra_credit_points', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="שם ישוב מוטב">
            <input
              value={form.settlement_name}
              onChange={e => set('settlement_name', e.target.value)}
              className={inputCls}
              placeholder="גע'תון (השאר ריק אם לא רלוונטי)"
            />
          </Field>
          <Field label="שיעור זיכוי ישוב (%)">
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={form.settlement_credit_rate}
              onChange={e => set('settlement_credit_rate', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="תקרת הכנסה מזכה (₪)">
            <input
              type="number"
              min={0}
              step={1000}
              value={form.settlement_ceiling}
              onChange={e => set('settlement_ceiling', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="הכנסה שנתית ממשכורת (₪)">
            <input
              type="number"
              min={0}
              step={1000}
              value={form.salary_annual_income}
              onChange={e => set('salary_annual_income', e.target.value)}
              className={inputCls}
              placeholder="0"
            />
          </Field>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
            ✓ ההגדרות נשמרו בהצלחה
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </form>
    </>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
