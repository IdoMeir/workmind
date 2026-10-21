// השוואת התלוש למה שנרשם (מפרט סעיף 5).

/** פער בברוטו שמעליו מוצגת שורת התראה. */
export const PAYSLIP_GAP_THRESHOLD = 0.02;

export interface PayslipComparison {
  /** תלוש פחות צפוי. שלילי = התלוש נמוך ממה שנרשם. */
  gap: number;
  /** הפער ביחס לצפוי (ערך מוחלט). */
  gapRatio: number;
  flagged: boolean;
  direction: 'lower' | 'higher' | 'match';
}

export function comparePayslip(expectedGross: number, payslipGross: number): PayslipComparison {
  const gap = payslipGross - expectedGross;
  const gapRatio = expectedGross > 0 ? Math.abs(gap) / expectedGross : payslipGross > 0 ? 1 : 0;
  const flagged = gapRatio > PAYSLIP_GAP_THRESHOLD;
  return {
    gap,
    gapRatio,
    flagged,
    direction: !flagged ? 'match' : gap < 0 ? 'lower' : 'higher',
  };
}

export interface MonthHours {
  regular: number;
  h125: number;
  h150: number;
  rest: number;
  shiftsCount: number;
  expectedFromShifts: number;
}

type ShiftHoursRow = {
  hours_regular: number | string;
  hours_125: number | string;
  hours_150: number | string;
  hours_rest: number | string;
  hours_rest_ot_1: number | string;
  hours_rest_ot_2: number | string;
  expected_amount: number | string | null;
};

/** סיכום שעות חודשי: רגילות / 125% / 150% / מנוחה (כולל נוספות במנוחה). */
export function summarizeMonth(shifts: ShiftHoursRow[]): MonthHours {
  const n = (v: number | string | null) => Number(v ?? 0);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const t = shifts.reduce<MonthHours>(
    (acc, s) => ({
      regular: acc.regular + n(s.hours_regular),
      h125: acc.h125 + n(s.hours_125),
      h150: acc.h150 + n(s.hours_150),
      rest: acc.rest + n(s.hours_rest) + n(s.hours_rest_ot_1) + n(s.hours_rest_ot_2),
      shiftsCount: acc.shiftsCount + 1,
      expectedFromShifts: acc.expectedFromShifts + n(s.expected_amount),
    }),
    { regular: 0, h125: 0, h150: 0, rest: 0, shiftsCount: 0, expectedFromShifts: 0 }
  );
  // סכומי NUMERIC בנקודה צפה — מעגלים לאגורה/לשבריר שעה.
  return {
    regular: r2(t.regular), h125: r2(t.h125), h150: r2(t.h150), rest: r2(t.rest),
    shiftsCount: t.shiftsCount, expectedFromShifts: r2(t.expectedFromShifts),
  };
}

type EmployerPay = {
  pay_type: 'hourly' | 'daily' | 'monthly';
  monthly_salary: number | string | null;
  travel_per_day: number | string | null;
};

/**
 * ברוטו צפוי לחודש: שווי המשמרות + נסיעות לכל יום עבודה (לא מנוחה)
 * + המשכורת הבסיסית כשהתשלום חודשי.
 */
export function expectedMonthGross(
  shifts: (ShiftHoursRow & { is_rest_day: boolean })[],
  employer: EmployerPay
): number {
  const fromShifts = summarizeMonth(shifts).expectedFromShifts;
  const travel = employer.travel_per_day ? Number(employer.travel_per_day) * shifts.filter(s => !s.is_rest_day).length : 0;
  const monthlyBase = employer.pay_type === 'monthly' && employer.monthly_salary ? Number(employer.monthly_salary) : 0;
  return Math.round((fromShifts + travel + monthlyBase) * 100) / 100;
}
