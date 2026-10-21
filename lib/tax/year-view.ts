// מסך "מס ופעולות": מכל הנתונים הגולמיים לצפי שנתי ולתשובה (מפרט 6.3–6.4).
// כל מספר כאן הוא צפי לשנה, לא "עד היום" (NEVER #3).
import { BASE_POINTS, CEILING_DISPLAY_RATIO, ZAIR_TURNOVER_CEILING_2026 } from './constants-2026';
import { calculateIncomeTax, taxFreeIncomeLimit, type IncomeTaxResult, type SettlementParams } from './income-tax';
import { calculateAnnualSelfEmployedNI, type AnnualNIResult } from './national-insurance';
import { projectAnnualTurnover } from './projection';
import { calculateSetAside, type SetAsideResult } from './setaside';
import { calculateBusinessTaxable, type BusinessTaxableResult, type TaxTrack } from './zair';

export interface TaxYearInputs {
  /** החודש הנוכחי (1–12). */
  currentMonth: number;
  gender: 'male' | 'female';
  extraCreditPoints: number;
  settlement: SettlementParams | null;
  track: TaxTrack;
  /** תקבולים לפי חודש (אינדקס 0 = ינואר). */
  turnoverByMonth: number[];
  /** 12 משכורות צפויות. */
  monthlySalaries: number[];
  overrides?: { annualTurnover?: number | null; annualSalary?: number | null };
}

export interface TaxYearView {
  turnoverReceived: number;
  projectedTurnover: number;
  turnoverOverridden: boolean;
  monthlySalaries: number[];
  projectedSalary: number;
  salaryOverridden: boolean;
  creditPoints: number;
  business: BusinessTaxableResult;
  taxableIncome: number;
  incomeTax: IncomeTaxResult;
  nationalInsurance: AnnualNIResult;
  setAside: SetAsideResult;
  taxFreeLimit: number;
  ceilingRatio: number;
  showCeiling: boolean;
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** דריסה ידנית של השכר השנתי: מתחלקת על החודשים שבהם יש משכורת (או על 12 אם אין). */
function distributeSalary(annual: number, projected: number[]): number[] {
  const active = projected.map(v => v > 0);
  const count = active.filter(Boolean).length;
  return projected.map((_, i) => (count === 0 ? annual / 12 : active[i] ? annual / count : 0));
}

export function buildTaxYearView(input: TaxYearInputs): TaxYearView {
  const m = Math.min(12, Math.max(1, input.currentMonth));
  const turnoverReceived = sum(input.turnoverByMonth.slice(0, m));
  // 3 החודשים השלמים האחרונים, לפני החודש הנוכחי.
  const recentMonths = input.turnoverByMonth.slice(Math.max(0, m - 4), m - 1);

  const turnoverOverride = input.overrides?.annualTurnover;
  const projectedTurnover = projectAnnualTurnover({
    turnoverYtd: turnoverReceived,
    recentMonths,
    monthsRemaining: 12 - m,
    override: turnoverOverride,
  });

  const salaryOverride = input.overrides?.annualSalary;
  const monthlySalaries = salaryOverride != null ? distributeSalary(salaryOverride, input.monthlySalaries) : input.monthlySalaries;
  const projectedSalary = sum(monthlySalaries);

  const creditPoints = Math.round((BASE_POINTS[input.gender] + Math.max(0, input.extraCreditPoints)) * 100) / 100;
  const business = calculateBusinessTaxable({ track: input.track, annualTurnover: projectedTurnover });
  const taxableIncome = projectedSalary + business.taxableIncome;
  const incomeTax = calculateIncomeTax({ taxableIncome, creditPoints, settlement: input.settlement });
  const nationalInsurance = calculateAnnualSelfEmployedNI(monthlySalaries, business.taxableIncome);
  const setAside = calculateSetAside({
    monthlySalaries,
    annualTurnover: projectedTurnover,
    track: input.track,
    creditPoints,
    settlement: input.settlement,
  });
  const ceilingRatio = projectedTurnover / ZAIR_TURNOVER_CEILING_2026;

  return {
    turnoverReceived,
    projectedTurnover,
    turnoverOverridden: turnoverOverride != null,
    monthlySalaries,
    projectedSalary,
    salaryOverridden: salaryOverride != null,
    creditPoints,
    business,
    taxableIncome,
    incomeTax,
    nationalInsurance,
    setAside,
    taxFreeLimit: taxFreeIncomeLimit(creditPoints, input.settlement),
    ceilingRatio,
    showCeiling: ceilingRatio > CEILING_DISPLAY_RATIO,
  };
}
