import { ZAIR_TAXABLE_SHARE, ZAIR_TURNOVER_CEILING_2026 } from './constants-2026';

export type TaxTrack = 'zair' | 'regular';

export interface BusinessTaxableParams {
  track: TaxTrack;
  annualTurnover: number;
  /** הוצאות מוכרות — רלוונטי רק במסלול רגיל. */
  annualExpenses?: number;
}

export interface BusinessTaxableResult {
  /** המסלול שחושב בפועל. */
  appliedTrack: TaxTrack;
  taxableIncome: number;
  /** ביקשו מסלול זעיר אבל המחזור מעל התקרה — חושב כמסלול רגיל. */
  exceededZairCeiling: boolean;
  /** כמה ₪ מעל התקרה (0 אם לא חרג). */
  exceededBy: number;
}

export function isZairEligible(annualTurnover: number): boolean {
  return annualTurnover <= ZAIR_TURNOVER_CEILING_2026;
}

/**
 * הכנסה חייבת מהעסק (מפרט 6.3, צעד 1):
 * זעיר — 70% מהמחזור. רגיל — מחזור פחות הוצאות.
 * מחזור מעל התקרה אינו זכאי למסלול זעיר, ולכן מחושב כרגיל.
 */
export function calculateBusinessTaxable({ track, annualTurnover, annualExpenses = 0 }: BusinessTaxableParams): BusinessTaxableResult {
  const turnover = Math.max(0, annualTurnover);
  const exceededBy = Math.max(0, turnover - ZAIR_TURNOVER_CEILING_2026);
  const exceededZairCeiling = track === 'zair' && exceededBy > 0;

  if (track === 'zair' && !exceededZairCeiling) {
    return { appliedTrack: 'zair', taxableIncome: turnover * ZAIR_TAXABLE_SHARE, exceededZairCeiling, exceededBy };
  }

  return {
    appliedTrack: 'regular',
    taxableIncome: Math.max(0, turnover - Math.max(0, annualExpenses)),
    exceededZairCeiling,
    exceededBy,
  };
}

/** החלק מכל ₪ מחזור שנחשב הכנסה חייבת (ולבסיס ב"ל). */
export function taxableShareFor(track: TaxTrack): number {
  return track === 'zair' ? ZAIR_TAXABLE_SHARE : 1;
}
