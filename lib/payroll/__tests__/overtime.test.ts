import { describe, expect, it } from 'vitest';
import {
  computeWeek,
  dayOfWeek,
  hourlyEquivalent,
  isBelowMinimumWage,
  netHours,
  regularDayTemplate,
  shiftPay,
  weekStart,
  type EmployerRules,
  type ShiftInput,
} from '../overtime';
import { EMPLOYER_DEFAULTS } from '../rules-2026';

// מעסיק יומי, 5 ימים, יום קצר חמישי, הפסקה 30 דק' לא בתשלום — ברירות המחדל של סעיף 4.
const DAILY: EmployerRules = {
  ...EMPLOYER_DEFAULTS,
  pay_type: 'daily',
  daily_rate: 400,
  hourly_rate: null,
  monthly_salary: null,
};
const HE = 400 / 8.6; // תעריף שעה שקול

const shift = (date: string, start: string, end: string, extra: Partial<ShiftInput> = {}): ShiftInput => ({
  shift_date: date, start_time: start, end_time: end, break_minutes: 30, is_rest_day: false, ...extra,
});

// שבוע 18–24.10.2026: ראשון 18 … חמישי 22, שבת 24.
const SUN = '2026-10-18', MON = '2026-10-19', TUE = '2026-10-20', WED = '2026-10-21', THU = '2026-10-22', SAT = '2026-10-24';

describe('ברירות מחדל לפי סעיף 4', () => {
  it('יומי, 5 ימים, יום מלא 8.6, יום קצר יחסי, ספים 8.6/7.6/42', () => {
    expect(EMPLOYER_DEFAULTS.pay_type).toBe('daily');
    expect(EMPLOYER_DEFAULTS.workweek_days).toBe(5);
    expect(EMPLOYER_DEFAULTS.short_day_paid_full).toBe(false);
    expect(EMPLOYER_DEFAULTS.standard_day_hours).toBe(8.6);
    expect(EMPLOYER_DEFAULTS.ot_daily_threshold).toBe(8.6);
    expect(EMPLOYER_DEFAULTS.ot_short_day_threshold).toBe(7.6);
    expect(EMPLOYER_DEFAULTS.ot_weekly_threshold).toBe(42);
  });
});

describe('עזרי תאריך ושעות', () => {
  it('יום בשבוע ותחילת שבוע (ראשון)', () => {
    expect(dayOfWeek(SUN)).toBe(0);
    expect(dayOfWeek(THU)).toBe(4);
    expect(weekStart(THU)).toBe(SUN);
    expect(weekStart(SAT)).toBe(SUN);
  });

  it('שעות נטו: הפסקה לא בתשלום מקוזזת; בתשלום לא', () => {
    expect(netHours(shift(SUN, '07:00', '16:30'), false)).toBe(9);
    expect(netHours(shift(SUN, '07:00', '16:30'), true)).toBe(9.5);
  });

  it('משמרת שעוברת חצות', () => {
    expect(netHours(shift(SUN, '22:00', '06:00'), false)).toBe(7.5);
  });
});

describe('5 משמרות לדוגמה — מול חישוב ידני', () => {
  const week = [
    shift(SUN, '07:00', '16:06'), // 8.6 נטו — יום מלא
    shift(MON, '07:00', '17:30'), // 10 — 1.4 ב-125%
    shift(TUE, '07:00', '19:30'), // 12 — 2 ב-125%, 1.4 ב-150%
    shift(WED, '07:00', '12:30'), // 5 — יום קצר יחסי
    shift(THU, '07:00', '15:06'), // 7.6 — היום הקצר של השבוע, מלא
  ];
  const b = computeWeek(week, DAILY);

  it('פירוק שעות', () => {
    expect(b.map(x => [x.regular, x.h125, x.h150])).toEqual([
      [8.6, 0, 0],
      [8.6, 1.4, 0],
      [8.6, 2, 1.4],
      [5, 0, 0],
      [7.6, 0, 0],
    ]);
    // 38.4 שעות רגילות — מתחת ל-42, אין המרה שבועית.
    expect(b.every(x => x.weeklyConverted === 0)).toBe(true);
  });

  it('שווי', () => {
    const pay = b.map(x => shiftPay(x, DAILY));
    expect(pay[0]).toBe(400);
    expect(pay[1]).toBeCloseTo(400 + 1.4 * 1.25 * HE, 2); // 481.40
    expect(pay[2]).toBeCloseTo(400 + 2 * 1.25 * HE + 1.4 * 1.5 * HE, 2); // 613.95
    expect(pay[3]).toBeCloseTo(5 * HE, 2); // 232.56
    expect(pay[4]).toBe(400);
  });

  it('יום קצר משולם כיום מלא — כשהמתג דלוק', () => {
    const rules = { ...DAILY, short_day_paid_full: true };
    expect(shiftPay(computeWeek([week[3]], rules)[0], rules)).toBe(400);
  });
});

describe('שעות נוספות יומיות', () => {
  it('שעות עודפות ביום אחד לא מתקזזות עם יום קצר', () => {
    const b = computeWeek([shift(MON, '07:00', '17:30'), shift(TUE, '07:00', '13:30')], DAILY);
    expect(b[0].h125).toBe(1.4); // 10 שעות
    expect(b[1].regular).toBe(6); // 6 שעות — לא "מקבל" את העודף של יום שני
  });

  it('ביום הקצר של השבוע הסף הוא 7.6', () => {
    const [b] = computeWeek([shift(THU, '07:00', '16:30')], DAILY); // 9 נטו
    expect(b.isShortWeekday).toBe(true);
    expect(b.regular).toBe(7.6);
    expect(b.h125).toBe(1.4);
  });
});

describe('שעות נוספות שבועיות', () => {
  // בלי יום קצר מוגדר: 5 × 9 שעות. יומי: 0.4 נוספות בכל יום. רגילות מצטברות 43 > 42.
  const rules = { ...DAILY, short_day: null };
  const week = [SUN, MON, TUE, WED, THU].map(d => shift(d, '07:00', '16:30'));
  const b = computeWeek(week, rules);

  it('השעה ה-43 הופכת לשעה נוספת ביום האחרון', () => {
    expect(b.slice(0, 4).map(x => x.h125)).toEqual([0.4, 0.4, 0.4, 0.4]);
    expect(b[4].regular).toBe(7.6);
    expect(b[4].weeklyConverted).toBe(1);
    expect(b[4].h125).toBe(1.4);
    expect(b.reduce((s, x) => s + x.regular, 0)).toBeCloseTo(42, 6);
  });

  it('שעה שהומרה כבר שולמה בבסיס — מקבלת רק תוספת 25%', () => {
    expect(shiftPay(b[4], rules)).toBeCloseTo(400 + 1 * 0.25 * HE + 0.4 * 1.25 * HE, 2);
  });

  it('סדר הקלט לא משנה — החישוב כרונולוגי', () => {
    const reversed = computeWeek([...week].reverse(), rules);
    expect(reversed[0].weeklyConverted).toBe(1); // חמישי, שהגיע ראשון בקלט
  });

  it('6 משמרות מעל 42 — השבתית לא נספרת, השישית כן', () => {
    const six = computeWeek([...week, shift('2026-10-23', '07:00', '12:30')], rules); // שישי 5 שעות
    expect(six[5].regular).toBe(0);
    expect(six[5].weeklyConverted).toBe(5);
    expect(six[5].h125).toBe(2);
    expect(six[5].h150).toBe(3);
  });
});

describe('יום מנוחה', () => {
  it('11 שעות: 8.6 ב-150%, 2 ב-187.5%, 0.4 ב-225%', () => {
    const [b] = computeWeek([shift(SAT, '08:00', '19:30', { is_rest_day: true })], DAILY);
    expect([b.rest, b.restOt1, b.restOt2]).toEqual([8.6, 2, 0.4]);
    expect(b.regular + b.h125 + b.h150).toBe(0);
    expect(shiftPay(b, DAILY)).toBeCloseTo(HE * (8.6 * 1.5 + 2 * 1.875 + 0.4 * 2.25), 2); // 816.28
  });

  it('שעות מנוחה לא נספרות לסף השבועי', () => {
    const b = computeWeek([
      shift(SAT, '08:00', '19:30', { is_rest_day: true }),
      ...[SUN, MON, TUE, WED].map(d => shift(d, '07:00', '16:06')), // 4 × 8.6 = 34.4
      shift(THU, '07:00', '15:06'), // 7.6 → 42 בדיוק
    ], DAILY);
    expect(b.every(x => x.weeklyConverted === 0)).toBe(true);
  });
});

describe('סוגי תשלום', () => {
  it('שעתי: 8.6 × 50 + 1.4 × 125% × 50', () => {
    const rules: EmployerRules = { ...DAILY, pay_type: 'hourly', hourly_rate: 50, daily_rate: null };
    const [b] = computeWeek([shift(MON, '07:00', '17:30')], rules);
    expect(shiftPay(b, rules)).toBeCloseTo(517.5, 2);
  });

  it('חודשי: המשמרת שווה רק את התוספות (משכורת ÷ 182)', () => {
    const rules: EmployerRules = { ...DAILY, pay_type: 'monthly', monthly_salary: 9_100, daily_rate: null };
    expect(hourlyEquivalent(rules)).toBe(50);
    const [b] = computeWeek([shift(MON, '07:00', '17:30')], rules);
    expect(shiftPay(b, rules)).toBeCloseTo(1.4 * 1.25 * 50, 2);
  });
});

describe('שכר מינימום כרצפה', () => {
  it('יומי 300 ÷ 8.6 = 34.88 < 35.40 → אזהרה', () => {
    expect(isBelowMinimumWage({ ...DAILY, daily_rate: 300 })).toBe(true);
  });
  it('יומי 400 → אין אזהרה', () => {
    expect(isBelowMinimumWage(DAILY)).toBe(false);
  });
});

describe('כפתור "יום רגיל"', () => {
  it('ממלא את שעות היום הרגיל האחרון (לא יום קצר, לא מנוחה)', () => {
    const t = regularDayTemplate([
      shift(SUN, '06:30', '15:36'),
      shift(MON, '07:00', '17:30'),
      shift(TUE, '07:00', '12:30'), // קצר — לא נבחר
      shift(SAT, '08:00', '19:30', { is_rest_day: true }), // מנוחה — לא נבחר
    ], DAILY, 30);
    expect(t).toEqual({ start_time: '07:00', end_time: '17:30', break_minutes: 30 });
  });

  it('בלי היסטוריה: 07:00 ועד יום מלא נטו (8.6 + 30 דק\' הפסקה = 16:06)', () => {
    expect(regularDayTemplate([], DAILY, 30)).toEqual({ start_time: '07:00', end_time: '16:06', break_minutes: 30 });
  });
});
