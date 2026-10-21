import { describe, expect, it } from 'vitest';
import {
  computeWeek,
  dailyOvertimeHours,
  flatRateWarnings,
  hourlyEquivalent,
  shiftFlatRateWarning,
  shiftPay,
  type EmployerRules,
  type ShiftInput,
} from '../overtime';
import { EMPLOYER_DEFAULTS } from '../rules-2026';

// יומי 450 ₪, יום מלא 8.5 שעות, תעריף קבוע 75 ₪ לשעה נוספת. בלי יום קצר.
const RULES: EmployerRules = {
  ...EMPLOYER_DEFAULTS,
  pay_type: 'daily',
  daily_rate: 450,
  hourly_rate: null,
  monthly_salary: null,
  standard_day_hours: 8.5,
  ot_daily_threshold: 8.5,
  short_day: null,
  ot_flat_rate: 75,
};
const HE = 450 / 8.5; // 52.94

const shift = (date: string, start: string, end: string, extra: Partial<ShiftInput> = {}): ShiftInput => ({
  shift_date: date, start_time: start, end_time: end, break_minutes: 30, is_rest_day: false, ...extra,
});
const MON = '2026-10-19';

describe('תעריף קבוע לשעה נוספת', () => {
  it('10 שעות נטו → 450 + 1.5 × 75 = 562.5', () => {
    const [b] = computeWeek([shift(MON, '07:00', '17:30')], RULES);
    expect(b.netHours).toBe(10);
    expect(dailyOvertimeHours(b)).toBe(1.5);
    expect(shiftPay(b, RULES)).toBe(562.5);
  });

  it('11.5 שעות נטו → 450 + 3 × 75 = 675 (גם השעה השלישית ב-75, לא 150%)', () => {
    const [b] = computeWeek([shift(MON, '07:00', '19:00')], RULES);
    expect(b.netHours).toBe(11.5);
    expect(b.h125).toBe(2);
    expect(b.h150).toBe(1);
    expect(shiftPay(b, RULES)).toBe(675);
  });

  it('11.5 שעות → אזהרת 150% מופיעה (75 < 150% × 52.94 = 79.41)', () => {
    const [b] = computeWeek([shift(MON, '07:00', '19:00')], RULES);
    expect(shiftFlatRateWarning(b, RULES)).toBe('150');
  });

  it('10 שעות (רק 125%) → אין אזהרה: 75 ≥ 125% × 52.94 = 66.18', () => {
    const [b] = computeWeek([shift(MON, '07:00', '17:30')], RULES);
    expect(shiftFlatRateWarning(b, RULES)).toBeNull();
  });

  it('אזהרות בהגדרות המעסיק', () => {
    expect(flatRateWarnings(RULES)).toEqual({ below125: false, below150: true });
    expect(flatRateWarnings({ ...RULES, ot_flat_rate: 60 })).toEqual({ below125: true, below150: true });
    expect(flatRateWarnings({ ...RULES, ot_flat_rate: 80 })).toEqual({ below125: false, below150: false });
    expect(flatRateWarnings({ ...RULES, ot_flat_rate: null })).toEqual({ below125: false, below150: false });
  });

  it('המרה שבועית: השעה שהומרה מקבלת רק 75 − תעריף שקול', () => {
    // 5 × 9 שעות: 0.5 נוספת בכל יום; רגילות מצטברות 42.5 → בחמישי 0.5 מומרת.
    const days = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'];
    const week = computeWeek(days.map(d => shift(d, '07:00', '16:30')), RULES);
    const thu = week[4];
    expect(thu.weeklyConverted).toBe(0.5);
    expect(dailyOvertimeHours(thu)).toBe(0.5);
    expect(shiftPay(thu, RULES)).toBeCloseTo(450 + 0.5 * 75 + 0.5 * (75 - HE), 2); // 498.53
    // ימים בלי המרה: 450 + 0.5 × 75
    expect(shiftPay(week[0], RULES)).toBe(487.5);
  });

  it('תעריף קבוע נמוך מהתעריף השקול → השעה שהומרה לא מקבלת תוספת (לא שלילי)', () => {
    const rules = { ...RULES, ot_flat_rate: 40 };
    const days = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'];
    const thu = computeWeek(days.map(d => shift(d, '07:00', '16:30')), rules)[4];
    expect(shiftPay(thu, rules)).toBeCloseTo(450 + 0.5 * 40, 2);
  });

  it('יום מנוחה נשאר לפי אחוזים', () => {
    const [b] = computeWeek([shift('2026-10-24', '08:00', '19:30', { is_rest_day: true })], RULES);
    expect(shiftPay(b, RULES)).toBeCloseTo(hourlyEquivalent(RULES) * (8.5 * 1.5 + 2 * 1.875 + 0.5 * 2.25), 2);
  });

  it('בלי תעריף קבוע — החישוב באחוזים לא השתנה', () => {
    const rules = { ...RULES, ot_flat_rate: null };
    const [b] = computeWeek([shift(MON, '07:00', '17:30')], rules);
    expect(shiftPay(b, rules)).toBeCloseTo(450 + 1.5 * 1.25 * HE, 2);
  });
});
