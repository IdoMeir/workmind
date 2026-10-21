import {
  BASE_POINTS,
  CREDIT_POINT_ANNUAL_2026,
  INCOME_TAX_BRACKETS_2026,
  SURTAX_RATE,
  SURTAX_THRESHOLD_2026,
} from './constants-2026';

export interface BracketLine {
  from: number;
  to: number;
  rate: number;
  amount: number;
  tax: number;
}

export interface SettlementParams {
  rate: number;
  ceiling: number;
}

export interface IncomeTaxParams {
  /** הכנסה חייבת שנתית מיגיעה אישית (משכורת + חלק העסק החייב). */
  taxableIncome: number;
  creditPoints: number;
  /** null = אין ישוב מוטב. */
  settlement: SettlementParams | null;
}

export interface IncomeTaxResult {
  taxableIncome: number;
  brackets: BracketLine[];
  surtax: number;
  grossTax: number;
  creditPointsValue: number;
  settlementCredit: number;
  netTax: number;
}

/** מס לפי מדרגות + מס יסף, לפני זיכויים. */
export function bracketTax(taxableIncome: number): { brackets: BracketLine[]; surtax: number; total: number } {
  const income = Math.max(0, taxableIncome);
  const brackets: BracketLine[] = [];
  let from = 0;
  let total = 0;

  for (const { upTo, rate } of INCOME_TAX_BRACKETS_2026) {
    if (income <= from) break;
    const amount = Math.min(income, upTo) - from;
    const tax = amount * rate;
    brackets.push({ from, to: Math.min(income, upTo), rate, amount, tax });
    total += tax;
    from = upTo;
  }

  const surtax = Math.max(0, income - SURTAX_THRESHOLD_2026) * SURTAX_RATE;
  return { brackets, surtax, total: total + surtax };
}

export function basePointsFor(gender: 'male' | 'female'): number {
  return BASE_POINTS[gender];
}

/**
 * סדר החישוב (מפרט 6.3, צעד 2):
 * מס לפי מדרגות → פחות נקודות זיכוי (לא מתחת ל-0) → פחות זיכוי ישוב (לא מתחת ל-0).
 */
export function calculateIncomeTax({ taxableIncome, creditPoints, settlement }: IncomeTaxParams): IncomeTaxResult {
  const income = Math.max(0, taxableIncome);
  const { brackets, surtax, total: grossTax } = bracketTax(income);

  const creditPointsValue = Math.min(Math.max(0, creditPoints) * CREDIT_POINT_ANNUAL_2026, grossTax);
  const afterPoints = grossTax - creditPointsValue;

  const settlementCredit = settlement
    ? Math.min(settlement.rate * Math.min(income, settlement.ceiling), afterPoints)
    : 0;

  return {
    taxableIncome: income,
    brackets,
    surtax,
    grossTax,
    creditPointsValue,
    settlementCredit,
    netTax: Math.max(0, afterPoints - settlementCredit),
  };
}
