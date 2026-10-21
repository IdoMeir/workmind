import { describe, expect, it } from 'vitest';
import { businessActivity, classifySelfEmployed, type ActivityEntry, type ActivityPayment } from '../index';

const TODAY = '2026-10-20';
const hoursEntry = (date: string, hours: number): ActivityEntry => ({ entry_date: date, entry_type: 'hours', hours });
const payment = (date: string, amount: number | string): ActivityPayment => ({ received_date: date, amount });
const weekly = (i: number) => new Date(Date.UTC(2026, 9, 20 - i * 7)).toISOString().slice(0, 10);

describe('אינדיקטור עצמאי לפי ב"ל (שלב 9)', () => {
  it('27 שעות בשבוע (351 שעות ב-13 שבועות) → "כן"', () => {
    const entries = Array.from({ length: 13 }, (_, i) => hoursEntry(weekly(i), 27));
    const a = businessActivity(entries, [], TODAY);
    expect(a.avgWeeklyHours).toBe(27);
    expect(classifySelfEmployed(a).isSelfEmployed).toBe(true);
  });

  it('חלון של 91 יום כולל היום: רשומה ותשלום מלפני 91 יום לא נספרים', () => {
    const a = businessActivity(
      [hoursEntry('2026-07-22', 13), hoursEntry('2026-07-21', 1_000)],
      [payment('2026-07-22', 300), payment('2026-07-21', 99_999)],
      TODAY
    );
    expect(a.from).toBe('2026-07-22');
    expect(a.avgWeeklyHours).toBe(1);
    expect(a.avgMonthlyIncome).toBe(100);
  });

  it('אירועים לא נספרים לשעות', () => {
    const a = businessActivity([{ entry_date: TODAY, entry_type: 'event', hours: null }], [], TODAY);
    expect(a.avgWeeklyHours).toBe(0);
  });

  it('ההכנסה לפי התשלומים שהתקבלו, לא לפי הסכומים המשוערים בעבודות', () => {
    // עבודות של 27 ש׳/שבוע; שולמו בפועל 3 תשלומים של 3,000 ₪ (גם NUMERIC כמחרוזת)
    const entries = Array.from({ length: 13 }, (_, i) => hoursEntry(weekly(i), 27));
    const a = businessActivity(entries, [payment('2026-08-01', 3_000), payment('2026-09-01', '3000'), payment('2026-10-01', 3_000)], TODAY);
    expect(a.avgMonthlyIncome).toBe(3_000);
  });

  it('10 שעות בשבוע ו-3,000 ₪ בחודש מתשלומים → לא עצמאי', () => {
    const entries = Array.from({ length: 13 }, (_, i) => hoursEntry(weekly(i), 10));
    const a = businessActivity(entries, [payment('2026-08-15', 9_000)], TODAY);
    expect(a.avgWeeklyHours).toBe(10);
    expect(a.avgMonthlyIncome).toBe(3_000);
    expect(classifySelfEmployed(a)).toEqual({ isSelfEmployed: false, reason: 'not_from_work' });
  });

  it('בלי תשלומים בחלון → הכנסה 0, גם אם נרשמו עבודות', () => {
    const a = businessActivity([hoursEntry(TODAY, 5)], [], TODAY);
    expect(a.avgMonthlyIncome).toBe(0);
  });

  it('12 שעות + 2,065 ₪ → עצמאי (תנאי משולב)', () => {
    expect(classifySelfEmployed({ avgWeeklyHours: 12, avgMonthlyIncome: 2_065 }).reason).toBe('hours_and_income');
  });
});
