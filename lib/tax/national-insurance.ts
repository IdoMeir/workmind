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

export interface AnnualNIResult extends SelfEmployedNIResult {
  /** החישוב של כל חודש לחוד (ינואר = 0). */
  months: SelfEmployedNIResult[];
  /** בכמה חודשים הופעלה ההכנסה המזערית. */
  minimumIncomeMonths: number;
}

/**
 * הערכה שנתית: כל חודש מחושב לחוד מול המשכורת של אותו חודש, והבסיס העסקי
 * מתחלק שווה בין 12 החודשים. כך שנה שבה המשכורת מתחילה באמצע מחושבת נכון:
 * בחודשים בלי משכורת חלה ההכנסה המזערית והמדרגה המופחתת פנויה לעסק.
 * @param monthlySalaries 12 משכורות ברוטו, 0 בחודש שאין בו משכורת.
 */
export function calculateAnnualSelfEmployedNI(monthlySalaries: number[], annualBusinessBase: number): AnnualNIResult {
  if (monthlySalaries.length !== 12) {
    throw new Error(`calculateAnnualSelfEmployedNI: expected 12 monthly salaries, got ${monthlySalaries.length}`);
  }
  const monthlyBase = Math.max(0, annualBusinessBase) / 12;
  const months = monthlySalaries.map(salary =>
    calculateSelfEmployedNI({ monthlySalary: salary, monthlyBusinessBase: monthlyBase })
  );
  const total = (key: keyof Pick<SelfEmployedNIResult, 'chargedBase' | 'reducedAmount' | 'reducedTax' | 'fullAmount' | 'fullTax' | 'total'>) =>
    months.reduce((s, m) => s + m[key], 0);

  return {
    chargedBase: total('chargedBase'),
    reducedAmount: total('reducedAmount'),
    reducedTax: total('reducedTax'),
    fullAmount: total('fullAmount'),
    fullTax: total('fullTax'),
    total: total('total'),
    minimumIncomeApplied: months.some(m => m.minimumIncomeApplied),
    verifyMinimumWithNI: months.some(m => m.verifyMinimumWithNI),
    months,
    minimumIncomeMonths: months.filter(m => m.minimumIncomeApplied).length,
  };
}

/** משכורת שנתית שמתחלקת שווה על 12 חודשים. */
export function evenMonthlySalaries(annualSalary: number): number[] {
  return new Array<number>(12).fill(Math.max(0, annualSalary) / 12);
}
