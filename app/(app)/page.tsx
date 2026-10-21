'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { Client, Employer, Shift, UserSettings, WorkEntry } from '@/types';
import Money from '@/components/shared/Money';
import { BusinessIcon, SalaryIcon } from '@/components/shared/SourceIcon';
import ShiftDialog from '@/components/payroll/ShiftDialog';
import QuickAddHoursDialog from '@/components/entries/QuickAddHoursDialog';
import { formatDecimal, formatHebrewMonth, formatHours, formatShortDate, getCurrentMonthYear, todayISO } from '@/lib/hebrew-format';
import { dayOfWeek } from '@/lib/payroll/overtime';
import { buildTaxTasks, nextDeadlineTask } from '@/lib/tax/tasks';

interface TodayData {
  settings: UserSettings | null;
  employer: Employer | null;
  clients: Client[];
  monthShifts: Shift[];
  monthEntries: WorkEntry[];
  recentShifts: Shift[];
  recentEntries: WorkEntry[];
}

type RecentItem =
  | { kind: 'shift'; date: string; created: string; shift: Shift }
  | { kind: 'entry'; date: string; created: string; entry: WorkEntry };

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const shiftHours = (s: Shift) =>
  Number(s.hours_regular) + Number(s.hours_125) + Number(s.hours_150) +
  Number(s.hours_rest) + Number(s.hours_rest_ot_1) + Number(s.hours_rest_ot_2);

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : fallback;
  } catch {
    return fallback;
  }
}

export default function TodayPage() {
  const { month, year } = getCurrentMonthYear();
  const today = todayISO();
  const dayOfMonth = Number(today.slice(8, 10));
  const daysInMonth = new Date(year, month, 0).getDate();

  const [data, setData] = useState<TodayData | null>(null);
  const [showShift, setShowShift] = useState(false);
  const [showWork, setShowWork] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [duplicating, setDuplicating] = useState<'shift' | 'entry' | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [settings, employers, clients, monthShifts, monthEntries, recentShifts, recentEntries] = await Promise.all([
      getJson<UserSettings | null>('/api/settings', null),
      getJson<Employer[]>('/api/employers', []),
      getJson<Client[]>('/api/clients', []),
      getJson<Shift[]>(`/api/shifts?year=${year}&month=${month}`, []),
      getJson<WorkEntry[]>(`/api/entries?year=${year}&month=${month}`, []),
      getJson<Shift[]>('/api/shifts?limit=5', []),
      getJson<WorkEntry[]>('/api/entries?limit=5', []),
    ]);
    setData({
      settings,
      employer: employers.find(e => !e.end_date) ?? employers[0] ?? null,
      clients,
      monthShifts,
      monthEntries,
      recentShifts,
      recentEntries,
    });
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className="p-4 space-y-4" aria-busy="true" aria-label="טוען">
        <div className="wm-card h-44 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="wm-card h-14 animate-pulse" />
          <div className="wm-card h-14 animate-pulse" />
        </div>
        <div className="wm-card h-40 animate-pulse" />
      </div>
    );
  }

  const salary = sum(data.monthShifts.map(s => Number(s.expected_amount ?? 0)));
  const business = sum(data.monthEntries.map(e => Number(e.amount)));
  const total = salary + business;
  const salaryPct = total > 0 ? (salary / total) * 100 : 0;

  const lastShift = data.recentShifts[0];
  const lastWork = data.recentEntries.find(e => e.entry_type === 'hours');
  const defaultClientId = data.recentEntries[0]?.client_id ?? null;

  const deadline = data.settings ? nextDeadlineTask(buildTaxTasks(year, today, data.settings)) : null;

  const recent: RecentItem[] = [
    ...data.recentShifts.map(s => ({ kind: 'shift' as const, date: s.shift_date, created: s.created_at, shift: s })),
    ...data.recentEntries.map(e => ({ kind: 'entry' as const, date: e.entry_date, created: e.created_at, entry: e })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created))
    .slice(0, 5);

  async function duplicateShift() {
    if (!lastShift || !data?.employer) return;
    setDuplicating('shift');
    setError('');
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_id: lastShift.employer_id,
          shift_date: today,
          start_time: lastShift.start_time.slice(0, 5),
          end_time: lastShift.end_time.slice(0, 5),
          break_minutes: lastShift.break_minutes,
          is_rest_day: dayOfWeek(today) === 6,
        }),
      });
      if (!res.ok) setError((await res.json()).error || 'שגיאה בשמירה');
      await load();
    } finally {
      setDuplicating(null);
    }
  }

  async function duplicateWork() {
    if (!lastWork) return;
    setDuplicating('entry');
    setError('');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: 'hours',
          client_id: lastWork.client_id,
          entry_date: today,
          hours: Number(lastWork.hours),
          description: lastWork.description,
          custom_amount: Number(lastWork.amount),
        }),
      });
      if (!res.ok) setError((await res.json()).error || 'שגיאה בשמירה');
      await load();
    } finally {
      setDuplicating(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* מועד קרוב: alert רק בתוך 14 יום */}
      {deadline && deadline.daysLeft !== null && (
        <Link
          href="/tax"
          className={`flex items-center justify-between gap-2 min-h-11 px-4 py-2 rounded-[10px] border text-[15px] ${
            deadline.urgent ? 'border-alert text-alert font-semibold' : 'border-rule text-text-mute'
          }`}
        >
          <span>
            {deadline.title} — {deadline.daysLeft >= 0 ? `עוד ${deadline.daysLeft} ימים` : 'עבר המועד'}
          </span>
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
      )}

      {/* הגיבור: סך החודש משני המקורות */}
      <section className="wm-card p-4" aria-labelledby="today-hero">
        <div className="flex items-baseline justify-between text-[13px] text-text-mute">
          <span className="wm-title text-[17px] text-text">{formatHebrewMonth(month)}</span>
          <span>{dayOfMonth} מתוך {daysInMonth}</span>
        </div>
        <h1 id="today-hero" className="mt-3 text-[15px] text-text-mute">הרווחת החודש</h1>
        <p className="wm-num text-[44px] leading-tight text-text">
          <Money amount={total} context="החודש" />
        </p>
        <div
          role="img"
          aria-label={`שכר ${Math.round(salary)} שקלים, עסק ${Math.round(business)} שקלים`}
          className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-ink-track"
        >
          {total > 0 && <div className="bg-steel" style={{ width: `${salaryPct}%` }} />}
          {total > 0 && <div className="bg-brass flex-1" />}
        </div>
        <div className="mt-2 flex justify-between text-[15px]">
          <span className="flex items-center gap-1.5"><SalaryIcon /> שכר <Money amount={salary} className="wm-num text-steel" /></span>
          <span className="flex items-center gap-1.5"><BusinessIcon /> עסק <Money amount={business} className="wm-num text-brass" /></span>
        </div>
      </section>

      {/* רישום — שני מקורות, שני צבעים */}
      <section aria-label="רישום מהיר" className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {data.employer ? (
            <button onClick={() => { setEditShift(null); setShowShift(true); }} className="wm-btn wm-btn-steel min-h-14 flex-col gap-0 leading-tight">
              <span>משמרת</span>
              <span className="text-[13px] font-normal">ב{data.employer.name}</span>
            </button>
          ) : (
            <Link href="/employer" className="wm-btn wm-btn-ghost min-h-14 flex-col gap-0 leading-tight">
              <span className="flex items-center gap-1"><SalaryIcon /> הגדר מעסיק</span>
              <span className="text-[13px] font-normal text-text-mute">לרישום משמרות</span>
            </Link>
          )}
          <button onClick={() => setShowWork(true)} className="wm-btn wm-btn-brass min-h-14 flex-col gap-0 leading-tight">
            <span>עבודה</span>
            <span className="text-[13px] font-normal">לעסק</span>
          </button>
        </div>

        {lastShift && data.employer && lastShift.shift_date !== today && (
          <button onClick={duplicateShift} disabled={duplicating !== null}
            className="w-full min-h-11 flex items-center gap-2 text-[15px] text-text px-1">
            <RotateCcw size={16} aria-hidden="true" className="text-steel" />
            <span>משמרת כמו אתמול:</span>
            <bdi className="wm-num">{lastShift.start_time.slice(0, 5)}–{lastShift.end_time.slice(0, 5)}</bdi>
            {duplicating === 'shift' && <span className="text-text-mute text-[13px]">שומר…</span>}
          </button>
        )}
        {lastWork && lastWork.entry_date !== today && (
          <button onClick={duplicateWork} disabled={duplicating !== null}
            className="w-full min-h-11 flex items-center gap-2 text-[15px] text-text px-1">
            <RotateCcw size={16} aria-hidden="true" className="text-brass" />
            <span>עבודה כמו אתמול:</span>
            <span className="truncate">{lastWork.client?.name} {formatDecimal(Number(lastWork.hours))} ש׳</span>
            {duplicating === 'entry' && <span className="text-text-mute text-[13px]">שומר…</span>}
          </button>
        )}
        {error && <p role="alert" className="wm-error">{error}</p>}
      </section>

      {/* אחרונים */}
      {recent.length > 0 && (
        <section className="wm-card" aria-labelledby="today-recent">
          <h2 id="today-recent" className="px-4 pt-3 pb-1 text-[13px] text-text-mute">אחרונים</h2>
          <ul className="divide-y divide-rule">
            {recent.map(item =>
              item.kind === 'shift' ? (
                <li key={`s-${item.shift.id}`}>
                  <button
                    onClick={() => { setEditShift(item.shift); setShowShift(true); }}
                    disabled={!data.employer}
                    className="w-full min-h-12 px-4 py-2 flex items-center gap-2 text-start"
                  >
                    <SalaryIcon />
                    <span className="text-[13px] text-text-mute w-10 shrink-0">{formatShortDate(item.shift.shift_date)}</span>
                    <span className="flex-1 truncate text-[15px]">
                      {data.employer?.name ?? 'משמרת'} <bdi className="wm-num">{formatHours(shiftHours(item.shift))}</bdi> ש׳
                      {Number(item.shift.hours_125) + Number(item.shift.hours_150) > 0 && <span className="text-text-mute"> · נוספות</span>}
                      {item.shift.is_rest_day && <span className="text-text-mute"> · מנוחה</span>}
                    </span>
                    <Money amount={Number(item.shift.expected_amount ?? 0)} className="wm-num text-steel" />
                  </button>
                </li>
              ) : (
                <li key={`e-${item.entry.id}`} className="min-h-12 px-4 py-2 flex items-center gap-2">
                  <BusinessIcon />
                  <span className="text-[13px] text-text-mute w-10 shrink-0">{formatShortDate(item.entry.entry_date)}</span>
                  <span className="flex-1 truncate text-[15px]">
                    {item.entry.client?.name}{' '}
                    {item.entry.entry_type === 'hours'
                      ? <><bdi className="wm-num">{formatDecimal(Number(item.entry.hours))}</bdi> ש׳</>
                      : item.entry.event_name}
                  </span>
                  <Money amount={Number(item.entry.amount)} className="wm-num text-brass" />
                </li>
              )
            )}
          </ul>
        </section>
      )}

      {data.employer && (
        <ShiftDialog
          open={showShift}
          onClose={() => setShowShift(false)}
          onSaved={() => load()}
          onDeleted={() => load()}
          employer={data.employer}
          shift={editShift}
        />
      )}
      <QuickAddHoursDialog
        open={showWork}
        onClose={() => setShowWork(false)}
        onAdd={() => load()}
        clients={data.clients}
        defaultClientId={defaultClientId}
      />
    </div>
  );
}
