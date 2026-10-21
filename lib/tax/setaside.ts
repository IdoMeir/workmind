import { SETASIDE_PER } from './constants-2026';
import { calculateIncomeTax, type SettlementParams } from './income-tax';
import { calculateAnnualSelfEmployedNI } from './national-insurance';
import { calculateBusinessTaxable, type TaxTrack } from './zair';

export interface YearInputs {
  /** משכורת ברוטו שנתית צפויה. */
  annualSalary: number;
  /** מחזור עסק שנתי צפוי. */
  annualTurnover: number;
  track: TaxTrack;
  annualExpenses?: number;
  creditPoints: number;
  settlement: SettlementParams | null;
}

/** מס הכנסה + ב"ל עצמאי לשנה, לקלט נתון. משמש להשוואה שולית. */
export function annualLiability(inputs: YearInputs): { incomeTax: number; nationalInsurance: number } {
  const business = calculateBusinessTaxable({
    track: inputs.track,
    annualTurnover: inputs.annualTurnover,
    annualExpenses: inputs.annualExpenses,
  });
  const incomeTax = calculateIncomeTax({
    taxableIncome: Math.max(0, inputs.annualSalary) + business.taxableIncome,
    creditPoints: inputs.creditPoints,
    settlement: inputs.settlement,
  }).netTax;
  const nationalInsurance = calculateAnnualSelfEmployedNI(inputs.annualSalary, business.taxableIncome).total;
  return { incomeTax, nationalInsurance };
}

export interface SetAsideResult {
  /** ₪ לשים בצד מכל 100 ₪ מחזור, מעוגל לעשירית. */
  perHundred: number;
  incomeTaxPart: number;
  nationalInsurancePart: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * כמה לשים בצד מכל 100 ₪ מהעסק (מפרט 6.3, צעד 5):
 * (מס הכנסה שולי + ב"ל שולי) × החלק החייב (0.70 בזעיר).
 * השולי מחושב כהפרש בחבות כשהמחזור השנתי הצפוי גדל ב-100 ₪, ולכן כולל
 * את השפעת נקודות הזיכוי, זיכוי הישוב, התקרות וההכנסה המזערית.
 */
export function calculateSetAside(inputs: YearInputs): SetAsideResult {
  const now = annualLiability(inputs);
  const next = annualLiability({ ...inputs, annualTurnover: Math.max(0, inputs.annualTurnover) + SETASIDE_PER });

  const incomeTaxPart = Math.max(0, next.incomeTax - now.incomeTax);
  const nationalInsurancePart = Math.max(0, next.nationalInsurance - now.nationalInsurance);

  return {
    perHundred: round1(incomeTaxPart + nationalInsurancePart),
    incomeTaxPart: round1(incomeTaxPart),
    nationalInsurancePart: round1(nationalInsurancePart),
  };
}
