import { describe, expect, it } from 'vitest';
import { effectiveHourlyRate, paymentsCoveringReceipt, isOpenEntry, linkedHours, openWorkEstimate, sumPayments, turnoverByMonth, turnoverFromPayments } from '../index';

const payments = [
  { received_date: '2026-01-15', amount: 1_000 },
  { received_date: '2026-06-02', amount: '5230.5' }, // NUMERIC מגיע כמחרוזת
  { received_date: '2026-06-20', amount: 700 },
  { received_date: '2025-12-30', amount: 9_999 }, // שנה אחרת
];

describe('מחזור לפי תקבולים', () => {
  it('מחזור שנתי = סכום התקבולים באותה שנה', () => {
    expect(turnoverFromPayments(payments, 2026)).toBe(6_930.5);
    expect(turnoverFromPayments(payments, 2025)).toBe(9_999);
  });

  it('פירוק לפי חודשים מסתכם למחזור השנתי', () => {
    const m = turnoverByMonth(payments, 2026);
    expect(m[0]).toBe(1_000);
    expect(m[5]).toBe(5_930.5);
    expect(m.reduce((s, x) => s + x, 0)).toBe(6_930.5);
  });

  it('אין תקבולים → 0', () => {
    expect(turnoverFromPayments([], 2026)).toBe(0);
  });
});

describe('עבודה פתוחה', () => {
  it('לא שולמה ולא בקבלה → פתוחה', () => {
    expect(isOpenEntry({ payment_id: null, receipt_id: null })).toBe(true);
  });
  it('קושרה לתקבול או נכללה בקבלה ישנה → לא פתוחה', () => {
    expect(isOpenEntry({ payment_id: 'p', receipt_id: null })).toBe(false);
    expect(isOpenEntry({ payment_id: null, receipt_id: 'r' })).toBe(false);
  });
});

describe('הכנסה = תשלומים, עבודה פתוחה = הערכה', () => {
  const entries = [
    { payment_id: null, receipt_id: null, amount: '546' },   // פתוחה
    { payment_id: null, receipt_id: null, amount: 420 },     // פתוחה
    { payment_id: 'p1', receipt_id: null, amount: 1_000 },   // שולמה
    { payment_id: null, receipt_id: 'r1', amount: 700 },     // בקבלה ישנה
  ];

  it('סכום התקבולים', () => {
    expect(sumPayments([{ amount: 1_000 }, { amount: '230.5' }])).toBe(1_230.5);
  });

  it('עבודה פתוחה משוערת — רק רשומות שלא שולמו', () => {
    expect(openWorkEstimate(entries)).toBe(966);
  });
});

describe('תעריף אפקטיבי לתקבול', () => {
  it('סכום ÷ שעות מקושרות', () => {
    const hours = linkedHours([
      { entry_type: 'hours', hours: '6.5' },
      { entry_type: 'hours', hours: 6 },
      { entry_type: 'event', hours: null },
    ]);
    expect(hours).toBe(12.5);
    expect(effectiveHourlyRate(1_050, hours)).toBe(84);
  });

  it('בלי שעות מקושרות → אין תעריף', () => {
    expect(effectiveHourlyRate(700, 0)).toBeNull();
  });
});

describe('קבלה ישנה שכבר מכוסה בתקבולים', () => {
  const receipt = { id: 'r1', client_id: 'c1', period_year: 2026, period_month: 5 };
  const p = (client_id: string, received_date: string, receipt_id: string | null = null) => ({ client_id, received_date, receipt_id });

  it('תקבול מאותו לקוח בחודש התקופה או בחודש שאחריו מכסה', () => {
    expect(paymentsCoveringReceipt(receipt, [p('c1', '2026-05-28'), p('c1', '2026-06-10')])).toHaveLength(2);
  });

  it('לקוח אחר, חודש רחוק, או התקבול של הקבלה עצמה — לא מכסים', () => {
    expect(paymentsCoveringReceipt(receipt, [
      p('c2', '2026-05-28'), p('c1', '2026-04-30'), p('c1', '2026-07-01'), p('c1', '2026-05-15', 'r1'),
    ])).toEqual([]);
  });

  it('קבלה של דצמבר — ינואר של השנה הבאה מכסה', () => {
    expect(paymentsCoveringReceipt({ ...receipt, period_month: 12 }, [p('c1', '2027-01-05')])).toHaveLength(1);
  });
});
