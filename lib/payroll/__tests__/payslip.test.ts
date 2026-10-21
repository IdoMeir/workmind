import { describe, expect, it } from 'vitest';
import { comparePayslip, summarizeMonth } from '../payslip';

describe('השוואה לתלוש', () => {
  it('פער מעל 2% כלפי מטה → התראה, "התלוש נמוך"', () => {
    const c = comparePayslip(5_000, 4_800); // 4%
    expect(c.flagged).toBe(true);
    expect(c.direction).toBe('lower');
    expect(c.gap).toBe(-200);
  });

  it('פער של 2% בדיוק → אין התראה', () => {
    expect(comparePayslip(5_000, 4_900).flagged).toBe(false);
  });

  it('פער מעל 2% כלפי מעלה → מסומן כגבוה', () => {
    expect(comparePayslip(5_000, 5_200).direction).toBe('higher');
  });

  it('אין משמרות אבל יש תלוש → מסומן', () => {
    expect(comparePayslip(0, 3_000).flagged).toBe(true);
  });

  it('אין משמרות ואין תלוש → תואם', () => {
    expect(comparePayslip(0, 0).direction).toBe('match');
  });
});

describe('סיכום שעות חודשי', () => {
  it('מסכם רגילות, 125%, 150%, מנוחה ושווי — גם כשהערכים מחרוזות (NUMERIC)', () => {
    const s = summarizeMonth([
      { hours_regular: '8.6', hours_125: '1.4', hours_150: 0, hours_rest: 0, hours_rest_ot_1: 0, hours_rest_ot_2: 0, expected_amount: '481.4' },
      { hours_regular: 0, hours_125: 0, hours_150: 0, hours_rest: 8.6, hours_rest_ot_1: 2, hours_rest_ot_2: 0.4, expected_amount: 816.28 },
    ]);
    expect(s).toEqual({ regular: 8.6, h125: 1.4, h150: 0, rest: 11, shiftsCount: 2, expectedFromShifts: 1297.68 });
  });
});
