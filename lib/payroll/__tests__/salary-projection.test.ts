import { describe, expect, it } from 'vitest';
import { averageMonthlyGross, employedFraction, estimateMonthlyGross, projectMonthlySalaries } from '../salary-projection';
import { EMPLOYER_DEFAULTS } from '../rules-2026';
import type { EmployerRules } from '../overtime';

const base = { year: 2026, employmentEnd: null, payslipGross: {}, shiftsExpected: {} };

describe('צפי שכר ל-12 חודשים', () => {
  it('התחיל לעבוד בנובמבר → 0 עד אוקטובר, ממוצע בנובמבר ובדצמבר', () => {
    const s = projectMonthlySalaries({ ...base, currentMonth: 10, employmentStart: '2026-11-01', fallbackMonthly: 8_000 });
    expect(s).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8_000, 8_000]);
  });

  it('תלושים גוברים, חודש שעבר בלי תלוש לוקח את המשמרות, השאר ממוצע התלושים', () => {
    const s = projectMonthlySalaries({
      ...base,
      currentMonth: 4,
      employmentStart: '2026-01-01',
      payslipGross: { 1: 5_000, 2: 5_200 },
      shiftsExpected: { 3: 4_800 },
      fallbackMonthly: 1,
    });
    expect(s.slice(0, 3)).toEqual([5_000, 5_200, 4_800]);
    expect(s.slice(3)).toEqual(new Array(9).fill(5_100));
  });

  it('עזב באמצע השנה → 0 אחרי סיום העבודה', () => {
    const s = projectMonthlySalaries({
      ...base, currentMonth: 1, employmentStart: '2026-01-01', employmentEnd: '2026-06-30', fallbackMonthly: 6_000,
    });
    expect(s.slice(0, 6)).toEqual(new Array(6).fill(6_000));
    expect(s.slice(6)).toEqual(new Array(6).fill(0));
  });

  it('התחיל ב-16.11 → נובמבר רק מ-16 (15 מתוך 30 יום), דצמבר מלא', () => {
    const s = projectMonthlySalaries({ ...base, currentMonth: 10, employmentStart: '2026-11-16', fallbackMonthly: 8_000 });
    expect(s.slice(0, 10)).toEqual(new Array(10).fill(0));
    expect(s[10]).toBe(4_000);
    expect(s[11]).toBe(8_000);
  });

  it('חלק החודש: מתאריך ההתחלה עד סוף החודש, 1 בשאר החודשים', () => {
    expect(employedFraction(2026, 10, '2026-10-01')).toBe(1);
    expect(employedFraction(2026, 10, '2026-10-31')).toBeCloseTo(1 / 31, 10);
    expect(employedFraction(2026, 11, '2026-10-20')).toBe(1);
    expect(employedFraction(2026, 11, null)).toBe(1);
  });

  it('תלוש בחודש ההתחלה גובר על החישוב היחסי', () => {
    const s = projectMonthlySalaries({
      ...base, currentMonth: 12, employmentStart: '2026-11-16', payslipGross: { 11: 3_900 }, fallbackMonthly: 8_000,
    });
    expect(s[10]).toBe(3_900);
  });

  it('ממוצע: בלי תלושים — לפי חודשי משמרות שעברו', () => {
    expect(averageMonthlyGross({
      ...base, currentMonth: 5, employmentStart: null, shiftsExpected: { 2: 4_000, 3: 5_000, 5: 100 }, fallbackMonthly: 0,
    })).toBe(4_500);
  });
});

describe('הערכה מהגדרות המעסיק', () => {
  const rules: EmployerRules = { ...EMPLOYER_DEFAULTS, pay_type: 'daily', daily_rate: 400, hourly_rate: null, monthly_salary: null };

  it('יומי 400 × 5 ימים × 52/12', () => {
    expect(estimateMonthlyGross(rules)).toBeCloseTo(400 * 5 * 52 / 12, 6);
  });

  it('חודשי — המשכורת עצמה', () => {
    expect(estimateMonthlyGross({ ...rules, pay_type: 'monthly', monthly_salary: 9_000 })).toBe(9_000);
  });
});
