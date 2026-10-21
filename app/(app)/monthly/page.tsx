'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import MonthlySummaryTable from '@/components/receipts/MonthlySummaryTable';
import PaymentSheet from '@/components/payments/PaymentSheet';
import ShiftDialog from '@/components/payroll/ShiftDialog';
import Money from '@/components/shared/Money';
import { BusinessIcon, SalaryIcon } from '@/components/shared/SourceIcon';
import { formatDecimal, formatHebrewMonthYear, formatHours, formatShortDate, getCurrentMonthYear } from '@/lib/hebrew-format';
import { comparePayslip, expectedMonthGross, summarizeMonth } from '@/lib/payroll/payslip';
import { methodLabel } from '@/lib/payments';
import type { Client, Employer, MonthlySummary, Payment, Payslip, Shift } from '@/types';

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : fallback;
  } catch {
    return fallback;
  }
}

interface MonthData {
  employer: Employer | null;
  shifts: Shift[];
  payslip: Payslip | null;
  summary: MonthlySummary | null;
  clients: Client[];
  payments: Payment[];
}

const shiftHours = (s: Shift) =>
  Number(s.hours_regular) + Number(s.hours_125) + Number(s.hours_150) +
  Number(s.hours_rest) + Number(s.hours_rest_ot_1) + Number(s.hours_rest_ot_2);

export default function MonthlyPage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<MonthData | null>(null);

  const [gross, setGross] = useState('');
  const [net, setNet] = useState('');
  const [savingSlip, setSavingSlip] = useState(false);
  const [slipMessage, setSlipMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [shiftOpen, setShiftOpen] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const load = useCallback(async () => {
    setData(null);
    const [employers, shifts, payslips, summary, clients, payments] = await Promise.all([
      getJson<Employer[]>('/api/employers', []),
      getJson<Shift[]>(`/api/shifts?year=${year}&month=${month}`, []),
      getJson<Payslip[]>(`/api/payslips?year=${year}&month=${month}`, []),
      getJson<MonthlySummary | null>(`/api/monthly-summary?year=${year}&month=${month}`, null),
      getJson<Client[]>('/api/clients', []),
      getJson<Payment[]>(`/api/payments?year=${year}&month=${month}`, []),
    ]);
    const employer = employers.find(e => !e.end_date) ?? employers[0] ?? null;
    const payslip = payslips.find(p => p.employer_id === employer?.id) ?? null;
    setGross(payslip ? String(payslip.gross) : '');
    setNet(payslip?.net != null ? String(payslip.net) : '');
    setSlipMessage(null);
    setData({ employer, shifts, payslip, summary, clients, payments });
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }
  const isCurrentMonth = year === currentYear && month === currentMonth;

  async function savePayslip() {
    if (!data?.employer || gross === '') return;
    setSavingSlip(true);
    setSlipMessage(null);
    try {
      const res = await fetch('/api/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_id: data.employer.id,
          period_year: year,
          period_month: month,
          gross: Number(gross),
          net: net === '' ? null : Number(net),
        }),
      });
      const body = await res.json();
      if (!res.ok) { setSlipMessage({ ok: false, text: body.error || 'שגיאה בשמירה' }); return; }
      setData(d => (d ? { ...d, payslip: body } : d));
      setSlipMessage({ ok: true, text: 'התלוש נשמר' });
    } catch {
      setSlipMessage({ ok: false, text: 'שגיאת רשת' });
    } finally {
      setSavingSlip(false);
    }
  }

  const hours = data ? summarizeMonth(data.shifts) : null;
  const employer = data?.employer ?? null;
  const travel = employer?.travel_per_day ? Number(employer.travel_per_day) : 0;
  const expectedGross = data && employer ? expectedMonthGross(data.shifts, employer) : 0;
  const comparison = gross !== '' && !isNaN(Number(gross)) ? comparePayslip(expectedGross, Number(gross)) : null;

  const paymentsTotal = (data?.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);

  async function deletePayment(id: string) {
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  return (
    <>
      <header className="flex items-center justify-between px-2 py-2 border-b border-rule no-print">
        <button onClick={prevMonth} aria-label="החודש הקודם" className="wm-btn text-text-mute">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        <h1 className="wm-title text-[19px]">{formatHebrewMonthYear(month, year)}</h1>
        <button onClick={nextMonth} disabled={isCurrentMonth} aria-label="החודש הבא" className="wm-btn text-text-mute">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
      </header>

      {!data ? (
        <div className="p-4 space-y-4" aria-busy="true" aria-label="טוען">
          <div className="wm-card h-56 animate-pulse" />
          <div className="wm-card h-40 animate-pulse" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* ─── שכר ─── */}
          <section className="wm-card p-4 space-y-3" aria-labelledby="month-salary">
            <div className="flex items-center justify-between">
              <h2 id="month-salary" className="flex items-center gap-2 wm-title text-[17px]">
                <SalaryIcon size={18} /> שכר{employer ? ` · ${employer.name}` : ''}
              </h2>
              {employer && (
                <button onClick={() => { setEditShift(null); setShiftOpen(true); }} aria-label="הוסף משמרת" className="wm-btn text-steel">
                  <Plus size={20} aria-hidden="true" />
                </button>
              )}
            </div>

            {!employer ? (
              <p className="text-[15px] text-text-mute">
                עוד לא הוגדר מעסיק. <a href="/employer" className="text-steel underline min-h-11 inline-flex items-center">להגדרה</a>
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-4 gap-2 text-center">
                  {([
                    ['רגילות', hours!.regular],
                    ['125%', hours!.h125],
                    ['150%', hours!.h150],
                    ['מנוחה', hours!.rest],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="rounded-[10px] bg-ink py-2">
                      <dt className="text-[13px] text-text-mute">{label}</dt>
                      <dd className="wm-num text-[19px]">{formatDecimal(value)}</dd>
                    </div>
                  ))}
                </dl>

                <p className="flex items-baseline justify-between text-[15px]">
                  <span className="text-text-mute">
                    ברוטו צפוי ({hours!.shiftsCount} משמרות{travel > 0 ? ', כולל נסיעות' : ''})
                  </span>
                  <Money amount={expectedGross} className="wm-num text-[21px] text-steel" />
                </p>

                <div className="border-t border-rule pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="slip-gross" className="wm-label">ברוטו בתלוש</label>
                      <input id="slip-gross" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                        value={gross} onChange={e => { setGross(e.target.value); setSlipMessage(null); }} />
                    </div>
                    <div>
                      <label htmlFor="slip-net" className="wm-label">נטו בתלוש</label>
                      <input id="slip-net" type="number" inputMode="decimal" min="0" step="any" className="wm-field"
                        value={net} onChange={e => { setNet(e.target.value); setSlipMessage(null); }} />
                    </div>
                  </div>

                  {comparison?.direction === 'lower' && (
                    <p role="alert" className="wm-error">
                      התלוש נמוך ב-<Money amount={Math.abs(comparison.gap)} /> ממה שרשמת. בדוק שעות נוספות.
                    </p>
                  )}
                  {comparison?.direction === 'higher' && (
                    <p role="alert" className="wm-error">
                      התלוש גבוה ב-<Money amount={comparison.gap} /> ממה שרשמת. ייתכן שחסרות משמרות.
                    </p>
                  )}
                  {comparison?.direction === 'match' && gross !== '' && (
                    <p className="text-[15px] text-sage">התלוש תואם למה שרשמת.</p>
                  )}

                  <button onClick={savePayslip} disabled={savingSlip || gross === ''} className="wm-btn wm-btn-ghost w-full">
                    {savingSlip ? 'שומר…' : data.payslip ? 'עדכן תלוש' : 'שמור תלוש'}
                  </button>
                  {slipMessage && (
                    <p role={slipMessage.ok ? 'status' : 'alert'} className={slipMessage.ok ? 'text-[15px] text-sage' : 'wm-error'}>
                      {slipMessage.text}
                    </p>
                  )}
                </div>

                {data.shifts.length > 0 && (
                  <ul className="border-t border-rule divide-y divide-rule">
                    {data.shifts.map(s => (
                      <li key={s.id}>
                        <button onClick={() => { setEditShift(s); setShiftOpen(true); }}
                          className="w-full min-h-11 py-2 flex items-center gap-2 text-start text-[15px]">
                          <span className="text-[13px] text-text-mute w-10 shrink-0">{formatShortDate(s.shift_date)}</span>
                          <bdi className="text-text-mute">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</bdi>
                          <span className="flex-1"><bdi className="wm-num">{formatHours(shiftHours(s))}</bdi> ש׳{s.is_rest_day ? ' · מנוחה' : ''}</span>
                          <Money amount={Number(s.expected_amount ?? 0)} className="wm-num text-steel" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {/* ─── עסק ─── */}
          <section className="wm-card p-4 space-y-3" aria-labelledby="month-business">
            <div className="flex items-center justify-between">
              <h2 id="month-business" className="flex items-center gap-2 wm-title text-[17px]">
                <BusinessIcon size={18} /> עסק
              </h2>
              <Money amount={data.summary?.totalAmount ?? 0} className="wm-num text-[21px] text-brass" />
            </div>
            <MonthlySummaryTable
              clientSummaries={data.summary?.byClient ?? []}
              year={year}
              month={month}
            />

            <div className="border-t border-rule pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px]">תקבולים החודש</h3>
                <Money amount={paymentsTotal} className="wm-num text-brass" />
              </div>
              {data.payments.length === 0 ? (
                <p className="text-[13px] text-text-mute">לא נרשם כסף שהתקבל החודש.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {data.payments.map(p => (
                    <li key={p.id} className="min-h-11 py-2 flex items-center gap-2 text-[15px]">
                      <span className="text-[13px] text-text-mute w-10 shrink-0">{formatShortDate(p.received_date)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{p.client?.name}</span>
                        <span className="block text-[13px] text-text-mute">
                          {methodLabel(p.method)}
                          {p.external_receipt_no ? ` · קבלה ${p.external_receipt_no}` : ''}
                        </span>
                      </span>
                      <Money amount={Number(p.amount)} className="wm-num" />
                      <button onClick={() => deletePayment(p.id)} aria-label={`מחק תקבול מ${p.client?.name ?? 'לקוח'}`}
                        className="wm-btn text-text-mute text-[13px]">מחק</button>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => setPaymentOpen(true)} className="wm-btn wm-btn-brass w-full">התקבל תשלום</button>
            </div>
          </section>
        </div>
      )}

      {employer && (
        <ShiftDialog
          open={shiftOpen}
          onClose={() => setShiftOpen(false)}
          onSaved={() => load()}
          onDeleted={() => load()}
          employer={employer}
          shift={editShift}
        />
      )}

      <PaymentSheet
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSaved={() => load()}
        clients={data?.clients ?? []}
      />
    </>
  );
}
