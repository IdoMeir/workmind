import { describe, expect, it } from 'vitest';
import {
  BASE_POINTS,
  NI_MIN_INCOME_SELF,
  NI_SELF_REDUCED,
  SETTLEMENT_DEFAULT,
  ZAIR_TURNOVER_CEILING_2026,
  annualLiability,
  calculateAnnualSelfEmployedNI,
  calculateBusinessTaxable,
  calculateEmployeeNI,
  calculateIncomeTax,
  calculateSelfEmployedNI,
  calculateSetAside,
  classifySelfEmployed,
  isZairEligible,
  projectAnnualSalary,
  projectAnnualTurnover,
} from '../index';

const GAATON = { rate: SETTLEMENT_DEFAULT.rate, ceiling: SETTLEMENT_DEFAULT.ceiling };
const MALE = BASE_POINTS.male;

/** בודק קרבה בטווח מוחלט (₪). */
function expectWithin(actual: number, expected: number, tolerance: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// ─── טבלה 6.5 — בדיקות חובה ──────────────────────────────────
describe('מפרט 6.5 — מס הכנסה', () => {
  it('הכנסה 171,420, זכר, געתון → מס 0', () => {
    const r = calculateIncomeTax({ taxableIncome: 171_420, creditPoints: MALE, settlement: GAATON });
    expect(r.grossTax).toBeCloseTo(23_676, 2);
    expect(r.netTax).toBeCloseTo(0, 2);
  });

  it('הכנסה 200,000, זכר, געתון → מס 4,858', () => {
    const r = calculateIncomeTax({ taxableIncome: 200_000, creditPoints: MALE, settlement: GAATON });
    expect(r.grossTax).toBeCloseTo(29_392, 2);
    expect(r.settlementCredit).toBeCloseTo(18_000, 2);
    expect(r.netTax).toBeCloseTo(4_858, 2);
  });

  it('הכנסה 120,720, בלי ישוב → 13,536 − 6,534 = 7,002', () => {
    const r = calculateIncomeTax({ taxableIncome: 120_720, creditPoints: MALE, settlement: null });
    expect(r.grossTax).toBeCloseTo(13_536, 2);
    expect(r.creditPointsValue).toBeCloseTo(6_534, 2);
    expect(r.netTax).toBeCloseTo(7_002, 2);
  });
});

describe('מפרט 6.5 — ביטוח לאומי לעצמאי (חודשי, משכורת-קודם)', () => {
  it('משכורת 4,000 + בסיס עסקי 16,000 → 285 + 2,214 (±1), דוגמת כל זכות', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 4_000, monthlyBusinessBase: 16_000 });
    expectWithin(r.reducedTax, 285, 1);
    expectWithin(r.fullTax, 2_214, 1);
    expectWithin(r.total, 285 + 2_214, 1);
  });

  it('משכורת 8,000 + בסיס 1,400 → 252', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 8_000, monthlyBusinessBase: 1_400 });
    expect(r.reducedTax).toBe(0);
    expect(r.total).toBeCloseTo(252, 2);
    expect(r.minimumIncomeApplied).toBe(false);
  });

  it('משכורת 0 + בסיס 5,600 → 431.2', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 0, monthlyBusinessBase: 5_600 });
    expect(r.total).toBeCloseTo(431.2, 2);
    expect(r.minimumIncomeApplied).toBe(false);
  });
});

describe('מפרט 6.5 — סיווג עצמאי לפי ב"ל', () => {
  it('27 שעות בשבוע → עצמאי', () => {
    const r = classifySelfEmployed({ avgWeeklyHours: 27, avgMonthlyIncome: 4_590 });
    expect(r.isSelfEmployed).toBe(true);
    expect(r.reason).toBe('hours');
  });

  it('10 שעות בשבוע, 3,000 ₪ בחודש → לא עצמאי ("הכנסה שלא מעבודה")', () => {
    const r = classifySelfEmployed({ avgWeeklyHours: 10, avgMonthlyIncome: 3_000 });
    expect(r.isSelfEmployed).toBe(false);
    expect(r.reason).toBe('not_from_work');
  });
});

// ─── מקרי קצה ─────────────────────────────────────────────────
describe('קצה — הכנסה 0', () => {
  it('מס הכנסה 0, בלי זיכויים שליליים', () => {
    const r = calculateIncomeTax({ taxableIncome: 0, creditPoints: MALE, settlement: GAATON });
    expect(r.grossTax).toBe(0);
    expect(r.creditPointsValue).toBe(0);
    expect(r.settlementCredit).toBe(0);
    expect(r.netTax).toBe(0);
    expect(r.brackets).toEqual([]);
  });

  it('הכנסה שלילית מטופלת כ-0', () => {
    expect(calculateIncomeTax({ taxableIncome: -5_000, creditPoints: MALE, settlement: null }).netTax).toBe(0);
  });

  it('ב"ל בלי משכורת ובלי הכנסה → הכנסה מזערית 3,442', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 0, monthlyBusinessBase: 0 });
    expect(r.minimumIncomeApplied).toBe(true);
    expect(r.chargedBase).toBe(NI_MIN_INCOME_SELF);
    expect(r.total).toBeCloseTo(NI_MIN_INCOME_SELF * NI_SELF_REDUCED, 4);
  });

  it('שים בצד מחזור 0 בלי משכורת → 0 (ההכנסה המזערית לא זזה)', () => {
    const r = calculateSetAside({
      annualSalary: 0, annualTurnover: 0, track: 'zair', creditPoints: MALE, settlement: GAATON,
    });
    expect(r.perHundred).toBe(0);
  });
});

describe('קצה — הכנסה מזערית כשיש משכורת', () => {
  it('לא מוסיפים, אבל מסמנים לאימות מול ב"ל', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 3_000, monthlyBusinessBase: 1_000 });
    expect(r.minimumIncomeApplied).toBe(false);
    expect(r.verifyMinimumWithNI).toBe(true);
    expect(r.chargedBase).toBe(1_000);
    expect(r.total).toBeCloseTo(1_000 * NI_SELF_REDUCED, 4);
  });
});

describe('קצה — מחזור מעל 122,833', () => {
  it('בדיוק בתקרה — עדיין זעיר, 70%', () => {
    expect(isZairEligible(ZAIR_TURNOVER_CEILING_2026)).toBe(true);
    const r = calculateBusinessTaxable({ track: 'zair', annualTurnover: ZAIR_TURNOVER_CEILING_2026 });
    expect(r.appliedTrack).toBe('zair');
    expect(r.taxableIncome).toBeCloseTo(85_983.1, 2);
    expect(r.exceededZairCeiling).toBe(false);
  });

  it('מעל התקרה — לא זכאי לזעיר, מחושב כרגיל (100% פחות הוצאות)', () => {
    expect(isZairEligible(130_000)).toBe(false);
    const r = calculateBusinessTaxable({ track: 'zair', annualTurnover: 130_000, annualExpenses: 10_000 });
    expect(r.appliedTrack).toBe('regular');
    expect(r.exceededZairCeiling).toBe(true);
    expect(r.exceededBy).toBe(130_000 - ZAIR_TURNOVER_CEILING_2026);
    expect(r.taxableIncome).toBe(120_000);
  });

  it('מסלול רגיל מתחת לתקרה — לא מסומן כחריגה', () => {
    const r = calculateBusinessTaxable({ track: 'regular', annualTurnover: 50_000, annualExpenses: 8_000 });
    expect(r.appliedTrack).toBe('regular');
    expect(r.exceededZairCeiling).toBe(false);
    expect(r.taxableIncome).toBe(42_000);
  });
});

describe('קצה — משכורת מעל 51,910 (תקרת ב"ל)', () => {
  it('המשכורת תופסת את כל התקרה → העסק לא משלם ב"ל', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 60_000, monthlyBusinessBase: 5_000 });
    expect(r.chargedBase).toBe(0);
    expect(r.total).toBe(0);
  });

  it('משכורת קרובה לתקרה → רק היתרה עד 51,910 מחויבת, ב-18%', () => {
    const r = calculateSelfEmployedNI({ monthlySalary: 50_000, monthlyBusinessBase: 5_000 });
    expect(r.chargedBase).toBe(1_910);
    expect(r.total).toBeCloseTo(1_910 * 0.18, 4);
  });

  it('חלק העובד מהמשכורת נעצר בתקרה', () => {
    const atCap = calculateEmployeeNI(51_910);
    expect(calculateEmployeeNI(80_000)).toBeCloseTo(atCap, 6);
    expect(atCap).toBeCloseTo(7_703 * 0.0427 + (51_910 - 7_703) * 0.1217, 4);
  });
});

describe('מס יסף', () => {
  it('הכנסה 800,000 → מדרגות + 3% מעל 721,560', () => {
    const r = calculateIncomeTax({ taxableIncome: 800_000, creditPoints: 0, settlement: null });
    expect(r.surtax).toBeCloseTo(2_353.2, 2);
    expect(r.grossTax).toBeCloseTo(263_383.6, 2);
  });
});

// ─── שים בצד ותרחיש המפרט ─────────────────────────────────────
describe('שים בצד — דוגמת מסך המס (סעיף 6)', () => {
  // משכורת 8,000 ₪ לחודש, מחזור זעיר 20,000 ₪ לשנה, געתון, זכר.
  const inputs = {
    annualSalary: 96_000,
    annualTurnover: 20_000,
    track: 'zair' as const,
    creditPoints: MALE,
    settlement: GAATON,
  };

  it('מס הכנסה 0, ב"ל 2,520 לשנה', () => {
    const { incomeTax, nationalInsurance } = annualLiability(inputs);
    expect(incomeTax).toBe(0);
    expect(nationalInsurance).toBeCloseTo(2_520, 2);
  });

  it('שים בצד 12.6 ₪ מכל 100 ₪ (18% × 0.70, מס שולי 0)', () => {
    const r = calculateSetAside(inputs);
    expect(r.incomeTaxPart).toBe(0);
    expect(r.perHundred).toBe(12.6);
  });

  it('בין נקודת האיזון לתקרת געתון — מס שולי 20% פחות 10% ישוב', () => {
    // הכנסה חייבת 160,000 + 14,000 = 174,000: מעל 171,420 ומתחת ל-180,000.
    const r = calculateSetAside({ ...inputs, annualSalary: 160_000 });
    // 10% שולי על 70 ₪ חייבים = 7; ב"ל 18% × 70 = 12.6
    expect(r.incomeTaxPart).toBeCloseTo(7, 1);
    expect(r.perHundred).toBeCloseTo(19.6, 1);
  });

  it('מעל תקרת געתון — אין זיכוי ישוב שולי, 20% מלא', () => {
    // הכנסה חייבת 214,000 > 180,000.
    const r = calculateSetAside({ ...inputs, annualSalary: 200_000 });
    // 20% × 70 = 14; ב"ל 18% × 70 = 12.6
    expect(r.incomeTaxPart).toBeCloseTo(14, 1);
    expect(r.perHundred).toBeCloseTo(26.6, 1);
  });
});

describe('ב"ל שנתי', () => {
  it('12 × החודשי הממוצע', () => {
    const annual = calculateAnnualSelfEmployedNI(0, 67_200);
    expect(annual.total).toBeCloseTo(431.2 * 12, 2);
  });
});

// ─── שנה צפויה (6.4) ─────────────────────────────────────────
describe('צפי שנתי', () => {
  it('עסק: עד היום + ממוצע 3 חודשים אחרונים × חודשים שנותרו', () => {
    expect(projectAnnualTurnover({
      turnoverYtd: 45_000, recentMonths: [3_000, 4_000, 5_000, 6_000], monthsRemaining: 2,
    })).toBe(45_000 + 5_000 * 2);
  });

  it('עסק: בלי היסטוריה → רק מה שכבר נכנס', () => {
    expect(projectAnnualTurnover({ turnoverYtd: 1_000, recentMonths: [], monthsRemaining: 5 })).toBe(1_000);
  });

  it('שכר: תלושים + ממוצע × חודשים שנותרו', () => {
    expect(projectAnnualSalary({
      payslipGrosses: [4_800, 5_000], avgMonthlyGross: 4_900, monthsRemaining: 3,
    })).toBe(9_800 + 14_700);
  });

  it('דריסה ידנית גוברת', () => {
    expect(projectAnnualTurnover({ turnoverYtd: 1, recentMonths: [1], monthsRemaining: 1, override: 60_000 })).toBe(60_000);
    expect(projectAnnualSalary({ payslipGrosses: [1], avgMonthlyGross: 1, monthsRemaining: 1, override: 0 })).toBe(0);
  });
});
