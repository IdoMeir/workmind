import { describe, expect, it } from 'vitest';
import { SETTLEMENT_DEFAULT, buildTaxYearView } from '../index';

const GAATON = { rate: SETTLEMENT_DEFAULT.rate, ceiling: SETTLEMENT_DEFAULT.ceiling };
const base = {
  gender: 'male' as const,
  extraCreditPoints: 0,
  settlement: GAATON,
  track: 'zair' as const,
};

describe('מסך מס — צפי שנתי', () => {
  // אוקטובר: התקבלו 15,000 עד היום (5,000 ביולי–ספטמבר), משכורת 8,000 כל השנה.
  const turnover = [0, 0, 0, 0, 0, 0, 5_000, 5_000, 5_000, 0, 0, 0];
  const view = buildTaxYearView({ ...base, currentMonth: 10, turnoverByMonth: turnover, monthlySalaries: new Array(12).fill(8_000) });

  it('מחזור צפוי = שהתקבל + ממוצע 3 חודשים × חודשים שנותרו', () => {
    expect(view.turnoverReceived).toBe(15_000);
    expect(view.projectedTurnover).toBe(15_000 + 5_000 * 2);
  });

  it('תשובת הסקיצה: מס 0, ב"ל ≈ 18% על 70%, שים בצד 12.6', () => {
    expect(view.incomeTax.netTax).toBe(0);
    expect(view.nationalInsurance.total).toBeCloseTo(25_000 * 0.7 * 0.18, 2);
    expect(view.setAside.perHundred).toBe(12.6);
    expect(Math.abs(view.taxFreeLimit - 171_420)).toBeLessThanOrEqual(1);
  });

  it('פס התקרה מוסתר מתחת ל-70%', () => {
    expect(view.showCeiling).toBe(false);
  });

  it('מעל 70% מהתקרה — מוצג', () => {
    const big = buildTaxYearView({ ...base, currentMonth: 12, turnoverByMonth: new Array(12).fill(8_000), monthlySalaries: new Array(12).fill(0) });
    expect(big.ceilingRatio).toBeGreaterThan(0.7);
    expect(big.showCeiling).toBe(true);
  });

  it('דריסה ידנית: מחזור ושכר', () => {
    const v = buildTaxYearView({
      ...base, currentMonth: 10, turnoverByMonth: turnover,
      monthlySalaries: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8_000, 8_000],
      overrides: { annualTurnover: 60_000, annualSalary: 20_000 },
    });
    expect(v.projectedTurnover).toBe(60_000);
    expect(v.turnoverOverridden).toBe(true);
    // השכר הדרוס מתחלק רק על החודשים שבהם יש משכורת
    expect(v.monthlySalaries.slice(10)).toEqual([10_000, 10_000]);
    expect(v.projectedSalary).toBe(20_000);
  });
});
