import { describe, expect, it } from 'vitest';
import { businessActivity, classifySelfEmployed, type ActivityEntry } from '../index';

const TODAY = '2026-10-20';
const hoursEntry = (date: string, hours: number, amount = hours * 84): ActivityEntry =>
  ({ entry_date: date, entry_type: 'hours', hours, amount });

describe('אינדיקטור עצמאי לפי ב"ל (שלב 9)', () => {
  it('27 שעות בשבוע (351 שעות ב-13 שבועות) → "כן"', () => {
    // 13 רשומות של 27 שעות, אחת בכל שבוע
    const entries = Array.from({ length: 13 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 9, 20 - i * 7)).toISOString().slice(0, 10);
      return hoursEntry(d, 27);
    });
    const a = businessActivity(entries, TODAY);
    expect(a.avgWeeklyHours).toBe(27);
    expect(classifySelfEmployed(a).isSelfEmployed).toBe(true);
  });

  it('חלון של 91 יום כולל היום: רשומה מלפני 91 יום לא נספרת', () => {
    const a = businessActivity([hoursEntry('2026-07-22', 13), hoursEntry('2026-07-21', 1_000)], TODAY);
    expect(a.from).toBe('2026-07-22');
    expect(a.avgWeeklyHours).toBe(1);
  });

  it('אירועים נספרים להכנסה ולא לשעות', () => {
    const a = businessActivity([{ entry_date: TODAY, entry_type: 'event', hours: null, amount: 3_000 }], TODAY);
    expect(a.avgWeeklyHours).toBe(0);
    expect(a.avgMonthlyIncome).toBe(1_000);
  });

  it('10 שעות בשבוע ו-3,000 ₪ בחודש → לא עצמאי', () => {
    const entries = Array.from({ length: 13 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 9, 20 - i * 7)).toISOString().slice(0, 10);
      return hoursEntry(d, 10, 9_000 / 13);
    });
    const a = businessActivity(entries, TODAY);
    expect(a.avgWeeklyHours).toBe(10);
    expect(a.avgMonthlyIncome).toBe(3_000);
    expect(classifySelfEmployed(a)).toEqual({ isSelfEmployed: false, reason: 'not_from_work' });
  });

  it('12 שעות + 2,065 ₪ → עצמאי (תנאי משולב)', () => {
    expect(classifySelfEmployed({ avgWeeklyHours: 12, avgMonthlyIncome: 2_065 }).reason).toBe('hours_and_income');
  });
});
