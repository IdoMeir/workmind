'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Money from '@/components/shared/Money';
import {
  SURTAX_THRESHOLD_2026,
  TAX_YEAR,
  ZAIR_TAXABLE_SHARE,
  ZAIR_TURNOVER_CEILING_2026,
  buildTaxTasks,
  buildTaxYearView,
  evenMonthlySalaries,
  type TaxTask,
} from '@/lib/tax';
import { turnoverByMonth } from '@/lib/payments';
import { estimateMonthlyGross, projectMonthlySalaries } from '@/lib/payroll/salary-projection';
import { expectedMonthGross } from '@/lib/payroll/payslip';
import { toRules } from '@/lib/payroll/employer';
import { formatDecimal, formatShortDate, todayISO } from '@/lib/hebrew-format';
import { track } from '@/lib/events';
import type { Employer, Payment, Payslip, Shift, UserSettings } from '@/types';

const DISCLAIMER = '* זהו חישוב הערכה בלבד. הנתונים מבוססים על מדרגות המס לשנת 2026. מומלץ להיוועץ ברואה חשבון לחישוב מדויק.';

interface RawData {
  settings: UserSettings | null;
  employer: Employer | null;
  payments: Payment[];
  payslips: Payslip[];
  shifts: Shift[];
}

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : fallback;
  } catch {
    return fallback;
  }
}

const numOrNull = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));

export default function TaxPage() {
  const year = TAX_YEAR;
  const today = todayISO();
  const currentMonth = Number(today.slice(5, 7));

  const [raw, setRaw] = useState<RawData | null>(null);
  const [turnoverOverride, setTurnoverOverride] = useState('');
  const [salaryOverride, setSalaryOverride] = useState('');
  const [taskError, setTaskError] = useState('');

  const load = useCallback(async () => {
    const [settings, employers, payments, payslips, shifts] = await Promise.all([
      getJson<UserSettings | null>('/api/settings', null),
      getJson<Employer[]>('/api/employers', []),
      getJson<Payment[]>(`/api/payments?year=${year}`, []),
      getJson<Payslip[]>(`/api/payslips?year=${year}`, []),
      getJson<Shift[]>(`/api/shifts?year=${year}`, []),
    ]);
    setRaw({ settings, employer: employers.find(e => !e.end_date) ?? employers[0] ?? null, payments, payslips, shifts });
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const view = useMemo(() => {
    if (!raw?.settings) return null;
    const { settings, employer } = raw;

    let monthlySalaries: number[];
    if (employer) {
      const payslipGross: Record<number, number> = {};
      raw.payslips.filter(p => p.employer_id === employer.id).forEach(p => { payslipGross[p.period_month] = Number(p.gross); });
      const shiftsExpected: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) {
        const monthShifts = raw.shifts.filter(s => s.employer_id === employer.id && Number(s.shift_date.slice(5, 7)) === m);
        if (monthShifts.length) shiftsExpected[m] = expectedMonthGross(monthShifts, employer);
      }
      monthlySalaries = projectMonthlySalaries({
        year,
        currentMonth,
        employmentStart: employer.start_date,
        employmentEnd: employer.end_date,
        payslipGross,
        shiftsExpected,
        fallbackMonthly: estimateMonthlyGross(toRules(employer)),
      });
    } else {
      // תאימות: בלי מעסיק מוגדר — המשכורת השנתית מההגדרות הישנות.
      monthlySalaries = evenMonthlySalaries(Number(settings.salary_annual_income ?? 0));
    }

    return buildTaxYearView({
      currentMonth,
      gender: settings.gender,
      extraCreditPoints: Number(settings.extra_credit_points ?? 0),
      settlement: settings.settlement_name
        ? { rate: Number(settings.settlement_credit_rate), ceiling: Number(settings.settlement_ceiling) }
        : null,
      track: settings.tax_track ?? 'zair',
      turnoverByMonth: turnoverByMonth(raw.payments, year),
      monthlySalaries,
      overrides: { annualTurnover: numOrNull(turnoverOverride), annualSalary: numOrNull(salaryOverride) },
    });
  }, [raw, year, currentMonth, turnoverOverride, salaryOverride]);

  const tasks = raw?.settings ? buildTaxTasks(year, today, raw.settings) : [];

  async function toggleTask(task: TaxTask) {
    if (!task.checkable) return;
    setTaskError('');
    const body =
      task.id === 'tax_coordination' ? { tax_coordination_done_year: task.done ? null : year }
      : task.id === 'form101' ? { form101_done: !task.done }
      : { ni_advances_updated_at: task.done ? null : today };
    const res = await fetch('/api/settings/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setTaskError(data.error || 'שגיאה בשמירה'); return; }
    setRaw(r => (r ? { ...r, settings: data } : r));
  }

  if (!raw) {
    return (
      <>
        <PageHeader title="מס ופעולות" />
        <div className="p-4 space-y-4" aria-busy="true" aria-label="טוען">
          <div className="wm-card h-64 animate-pulse" />
          <div className="wm-card h-56 animate-pulse" />
        </div>
      </>
    );
  }

  if (!raw.settings || !view) {
    return (
      <>
        <PageHeader title="מס ופעולות" />
        <div className="p-4">
          <div className="wm-card p-5 space-y-3">
            <p className="text-[15px]">כדי לחשב מס צריך קודם למלא את ההגדרות: מין, נקודות זיכוי וישוב.</p>
            <Link href="/settings" className="wm-btn wm-btn-brass w-full">להגדרות</Link>
          </div>
        </div>
      </>
    );
  }

  const { settings, employer } = raw;
  const settlementName = settings.settlement_name;
  const netTax = view.incomeTax.netTax;

  return (
    <>
      <PageHeader title="מס ופעולות" />
      <div className="p-4 space-y-4">
        {/* ─── התשובה ─── */}
        <section className="wm-card p-4 space-y-4" aria-labelledby="tax-answer">
          <p className="text-[13px] text-text-mute">
            {year} · {view.business.appliedTrack === 'zair' ? 'עסק זעיר' : 'עסק (מסלול רגיל)'}{employer || view.projectedSalary > 0 ? ' + שכיר' : ''}
          </p>

          <div>
            <h2 id="tax-answer" className="text-[15px] text-text-mute">מס הכנסה צפוי לשנה</h2>
            <p className={`wm-num text-[44px] leading-tight ${netTax === 0 ? 'text-sage' : 'text-text'}`}>
              <Money amount={netTax} context="לשנה" />
            </p>
            <p className="text-[15px] text-text-mute">
              {netTax === 0 ? (
                <>{settlementName ? `${settlementName} + נקודות זיכוי מכסים` : 'נקודות הזיכוי מכסות'} עד <Money amount={view.taxFreeLimit} /> הכנסה</>
              ) : (
                <>ההכנסה הצפויה (<Money amount={view.taxableIncome} />) עוברת את <Money amount={view.taxFreeLimit} /> שמכוסים</>
              )}
            </p>
          </div>

          <div className="border-t border-rule pt-3">
            <h3 className="text-[15px] text-text-mute">ביטוח לאומי ובריאות</h3>
            <p className="text-[19px]">
              <Money amount={view.nationalInsurance.total} context="לשנה" className="wm-num text-[21px] text-brass" /> לשנה (עסק)
            </p>
            {view.nationalInsurance.verifyMinimumWithNI && (
              <p className="text-[13px] text-text-mute mt-1">
                בחודשים עם משכורת ההכנסה מהעסק נמוכה מההכנסה המזערית, והיא לא נוספה. לאמת מול ב״ל.
              </p>
            )}
          </div>

          <div className="border-t border-rule pt-3">
            <h3 className="text-[15px] text-text-mute">שים בצד מכל 100₪ מהעסק</h3>
            <p className="wm-num text-[40px] leading-tight text-text">
              <Money amount={view.setAside.perHundred} fractionDigits={1} />
            </p>
          </div>

          {view.business.exceededZairCeiling && (
            <p role="alert" className="wm-error">
              המחזור הצפוי עובר את תקרת העסק הזעיר (<Money amount={ZAIR_TURNOVER_CEILING_2026} />). החישוב עבר למסלול רגיל — לדבר עם רו״ח.
            </p>
          )}
        </section>

        {/* ─── תקרה, רק מעל 70% ─── */}
        {view.showCeiling && !view.business.exceededZairCeiling && (
          <section className="wm-card p-4 space-y-2" aria-labelledby="tax-ceiling">
            <h2 id="tax-ceiling" className="text-[15px]">תקרת עסק זעיר</h2>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(view.ceilingRatio * 100)}
              aria-label="ניצול תקרת העסק הזעיר"
              className="h-2.5 rounded-full bg-ink-track overflow-hidden"
            >
              <div className="h-full bg-brass" style={{ width: `${Math.min(100, view.ceilingRatio * 100)}%` }} />
            </div>
            <p className="text-[13px] text-text-mute">
              צפי <Money amount={view.projectedTurnover} /> מתוך <Money amount={ZAIR_TURNOVER_CEILING_2026} /> ({Math.round(view.ceilingRatio * 100)}%)
            </p>
          </section>
        )}

        {/* ─── מה לעשות ─── */}
        <section className="wm-card" aria-labelledby="tax-todo">
          <h2 id="tax-todo" className="px-4 pt-3 pb-1 wm-title text-[17px]">מה לעשות</h2>
          <ul className="divide-y divide-rule">
            {tasks.map(task => (
              <li key={task.id} className={`px-4 py-2 ${task.urgent ? 'border-s-2 border-alert' : ''}`}>
                <div className="flex items-center gap-3 min-h-11">
                  {task.checkable ? (
                    <input
                      id={`task-${task.id}`}
                      type="checkbox"
                      className="size-5 shrink-0 accent-[var(--color-sage)]"
                      checked={task.done}
                      onChange={() => toggleTask(task)}
                    />
                  ) : (
                    <CalendarClock size={20} aria-hidden="true" className="shrink-0 text-text-mute" />
                  )}
                  <label htmlFor={task.checkable ? `task-${task.id}` : undefined} className="flex-1">
                    <span className={`block text-[15px] ${task.done ? 'text-sage line-through' : ''}`}>{task.title}</span>
                    <span className="block text-[13px] text-text-mute">{task.detail}</span>
                  </label>
                  {task.due && !task.done && (
                    <span className={`text-[13px] text-end shrink-0 ${task.urgent ? 'text-alert font-semibold' : 'text-text-mute'}`}>
                      עד {formatShortDate(task.due)}
                      {task.daysLeft !== null && (
                        <span className="block">{task.daysLeft >= 0 ? `עוד ${task.daysLeft} ימים` : 'עבר המועד'}</span>
                      )}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {taskError && <p role="alert" className="wm-error m-4">{taskError}</p>}
        </section>

        {/* ─── איך זה מחושב ─── */}
        <details
          className="wm-card group"
          id="how-calculated"
          onToggle={e => { if ((e.currentTarget as HTMLDetailsElement).open) track('how_calculated_open'); }}
        >
          <summary className="min-h-12 px-4 flex items-center cursor-pointer text-[15px]">איך זה מחושב</summary>
          <div className="px-4 pb-4 space-y-4 text-[15px]">
            <div className="space-y-2">
              <h3 className="text-[13px] text-text-mute">צפי לשנה</h3>
              <p>
                מחזור העסק: <Money amount={view.projectedTurnover} className="wm-num" />
                {!view.turnoverOverridden && <span className="text-text-mute text-[13px]"> (<Money amount={view.turnoverReceived} /> שהתקבלו + ממוצע 3 החודשים האחרונים לחודשים שנותרו)</span>}
              </p>
              <p>
                שכר: <Money amount={view.projectedSalary} className="wm-num" />
                {!view.salaryOverridden && <span className="text-text-mute text-[13px]"> (תלושים + ממוצע חודשי מתחילת העבודה)</span>}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ov-turnover" className="wm-label">דריסת מחזור שנתי</label>
                  <input id="ov-turnover" type="number" inputMode="decimal" min="0" className="wm-field"
                    value={turnoverOverride} onChange={e => setTurnoverOverride(e.target.value)} placeholder="אוטומטי" />
                </div>
                <div>
                  <label htmlFor="ov-salary" className="wm-label">דריסת שכר שנתי</label>
                  <input id="ov-salary" type="number" inputMode="decimal" min="0" className="wm-field"
                    value={salaryOverride} onChange={e => setSalaryOverride(e.target.value)} placeholder="אוטומטי" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-[13px] text-text-mute">מס הכנסה</h3>
              <p>
                הכנסה חייבת: שכר + {view.business.appliedTrack === 'zair' ? `${Math.round(ZAIR_TAXABLE_SHARE * 100)}% מהמחזור` : 'המחזור'} = <Money amount={view.taxableIncome} className="wm-num" />
              </p>
              <ul className="text-[13px] text-text-mute">
                {view.incomeTax.brackets.map(b => (
                  <li key={b.from} className="flex justify-between">
                    <span>{Math.round(b.rate * 100)}% על <Money amount={b.amount} /></span>
                    <Money amount={b.tax} />
                  </li>
                ))}
                {view.incomeTax.surtax > 0 && (
                  <li className="flex justify-between">
                    <span>מס יסף מעל <Money amount={SURTAX_THRESHOLD_2026} /></span>
                    <Money amount={view.incomeTax.surtax} />
                  </li>
                )}
              </ul>
              <p className="flex justify-between"><span>מס לפי מדרגות</span><Money amount={view.incomeTax.grossTax} /></p>
              <p className="flex justify-between"><span>נקודות זיכוי ({formatDecimal(view.creditPoints)})</span><span>−<Money amount={view.incomeTax.creditPointsValue} /></span></p>
              {settlementName && (
                <p className="flex justify-between"><span>זיכוי ישוב ({settlementName})</span><span>−<Money amount={view.incomeTax.settlementCredit} /></span></p>
              )}
              <p className="flex justify-between font-semibold"><span>מס הכנסה צפוי</span><Money amount={netTax} /></p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[13px] text-text-mute">ביטוח לאומי ובריאות (עסק, כל חודש לחוד, המשכורת קודם)</h3>
              <p className="flex justify-between"><span>7.7% על <Money amount={view.nationalInsurance.reducedAmount} /></span><Money amount={view.nationalInsurance.reducedTax} /></p>
              <p className="flex justify-between"><span>18% על <Money amount={view.nationalInsurance.fullAmount} /></span><Money amount={view.nationalInsurance.fullTax} /></p>
              {view.nationalInsurance.minimumIncomeMonths > 0 && (
                <p className="text-[13px] text-text-mute">ב-{view.nationalInsurance.minimumIncomeMonths} חודשים בלי משכורת חושבה הכנסה מזערית.</p>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-[13px] text-text-mute">שים בצד — מכל 100₪ מחזור נוסף</h3>
              <p className="flex justify-between"><span>מס הכנסה</span><Money amount={view.setAside.incomeTaxPart} fractionDigits={1} /></p>
              <p className="flex justify-between"><span>ביטוח לאומי ובריאות</span><Money amount={view.setAside.nationalInsurancePart} fractionDigits={1} /></p>
            </div>

            <p className="text-[13px] text-text-mute border-t border-rule pt-3">{DISCLAIMER}</p>
          </div>
        </details>
      </div>
    </>
  );
}
