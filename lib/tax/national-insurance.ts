import {
  NI_EMP_FULL,
  NI_EMP_REDUCED,
  NI_MAX_INCOME,
  NI_MIN_INCOME_SELF,
  NI_REDUCED_THRESHOLD,
  NI_SELF_FULL,
  NI_SELF_REDUCED,
} from './constants-2026';

export interface SelfEmployedNIParams {
  /** משכורת ברוטו באותו חודש. */
  monthlySalary: number;
  /** בסיס ההכנסה מהעסק לחודש (בעסק זעיר: 70% מהמחזור החודשי). */
  monthlyBusinessBase: number;
}

export interface SelfEmployedNIResult {
  /** הבסיס שעליו חושב בפועל (אחרי הכנסה מזערית ותקרה). */
  chargedBase: number;
  reducedAmount: number;
  reducedTax: number;
  fullAmount: number;
  fullTax: number;
  total: number;
  minimumIncomeApplied: boolean;
  /** יש משכורת והבסיס מתחת להכנסה המזערית — לא מוסיפים, אבל לאמת מול ב"ל (מפרט 6.3, צעד 4). */
  verifyMinimumWithNI: boolean;
}

/**
 * ביטוח לאומי ובריאות לעצמאי, לחודש אחד, בשיטת "משכורת-קודם" (מפרט 6.3, צעד 3):
 * המשכורת תופסת ראשונה את המדרגה המופחתת ואת התקרה. העסק מקבל 7.7% רק על
 * מה שנשאר מתחת לסף, 18% מעליו, ואפס מעל התקרה.
 */
export function calculateSelfEmployedNI({ monthlySalary, monthlyBusinessBase }: SelfEmployedNIParams): SelfEmployedNIResult {
  const salary = Math.max(0, monthlySalary);
  let base = Math.max(0, monthlyBusinessBase);

  let minimumIncomeApplied = false;
  let verifyMinimumWithNI = false;
  if (base < NI_MIN_INCOME_SELF) {
    if (salary === 0) {
      base = NI_MIN_INCOME_SELF;
      minimumIncomeApplied = true;
    } else if (base > 0) {
      verifyMinimumWithNI = true;
    }
  }

  const chargedBase = Math.min(base, Math.max(0, NI_MAX_INCOME - salary));
  const reducedAmount = Math.min(chargedBase, Math.max(0, NI_REDUCED_THRESHOLD - salary));
  const fullAmount = chargedBase - reducedAmount;
  const reducedTax = reducedAmount * NI_SELF_REDUCED;
  const fullTax = fullAmount * NI_SELF_FULL;

  return {
    chargedBase,
    reducedAmount,
    reducedTax,
    fullAmount,
    fullTax,
    total: reducedTax + fullTax,
    minimumIncomeApplied,
    verifyMinimumWithNI,
  };
}

/** ביטוח לאומי ובריאות שמנוכה מהמשכורת (חלק העובד), לחודש. */
export function calculateEmployeeNI(monthlySalary: number): number {
  const salary = Math.min(Math.max(0, monthlySalary), NI_MAX_INCOME);
  const reduced = Math.min(salary, NI_REDUCED_THRESHOLD);
  return reduced * NI_EMP_REDUCED + (salary - reduced) * NI_EMP_FULL;
}

/** הערכה שנתית: 12 חודשים לפי הממוצע החודשי של כל מקור. */
export function calculateAnnualSelfEmployedNI(annualSalary: number, annualBusinessBase: number): SelfEmployedNIResult {
  const m = calculateSelfEmployedNI({
    monthlySalary: annualSalary / 12,
    monthlyBusinessBase: annualBusinessBase / 12,
  });
  return {
    ...m,
    chargedBase: m.chargedBase * 12,
    reducedAmount: m.reducedAmount * 12,
    reducedTax: m.reducedTax * 12,
    fullAmount: m.fullAmount * 12,
    fullTax: m.fullTax * 12,
    total: m.total * 12,
  };
}
