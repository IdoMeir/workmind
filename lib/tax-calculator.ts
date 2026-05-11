import type {
  TaxBracket,
  TaxBreakdownLine,
  IncomeTaxResult,
  NIBreakdown,
  TaxCalculationParams,
  TaxSummary,
} from '@/types';

export const TAX_YEAR = 2026;

export const INCOME_TAX_BRACKETS_2026: TaxBracket[] = [
  { min: 0,      max: 84120,   rate: 0.10 },
  { min: 84120,  max: 120720,  rate: 0.14 },
  { min: 120720, max: 228000,  rate: 0.20 },
  { min: 228000, max: 301200,  rate: 0.31 },
  { min: 301200, max: 628560,  rate: 0.35 },
  { min: 628560, max: 721560,  rate: 0.47 },
  { min: 721560, max: null,    rate: 0.50 },
];

export const CREDIT_POINT_VALUE_ANNUAL = 2904;
export const BASE_CREDIT_POINTS_MALE = 2.25;
export const BASE_CREDIT_POINTS_FEMALE = 2.75;

export const NI_BRACKET_1_CEILING_ANNUAL = 92436;
export const NI_BRACKET_2_CEILING_ANNUAL = 622920;
export const NI_RATE_BRACKET_1 = 0.077;
export const NI_RATE_BRACKET_2 = 0.18;
export const NI_MIN_INCOME_MONTHLY = 2065;

export const OSEK_PATUR_CEILING_2026 = 122833;

export const GAATON_CREDIT_RATE = 0.10;
export const GAATON_CEILING = 180000;

export function calculateIncomeTax(annualIncome: number): IncomeTaxResult {
  if (annualIncome <= 0) return { grossTax: 0, breakdown: [] };

  let grossTax = 0;
  const breakdown: TaxBreakdownLine[] = [];

  for (const bracket of INCOME_TAX_BRACKETS_2026) {
    if (annualIncome <= bracket.min) break;
    const cap = bracket.max ?? Infinity;
    const taxableAmount = Math.min(annualIncome, cap) - bracket.min;
    if (taxableAmount <= 0) continue;
    const tax = taxableAmount * bracket.rate;
    grossTax += tax;
    breakdown.push({
      bracketMin: bracket.min,
      bracketMax: bracket.max ?? annualIncome,
      rate: bracket.rate,
      taxableAmount,
      tax,
    });
  }

  return { grossTax, breakdown };
}

export function calculateCreditPointsValue(creditPoints: number, grossTax: number): number {
  return Math.min(creditPoints * CREDIT_POINT_VALUE_ANNUAL, grossTax);
}

export function calculateSettlementCredit(
  annualIncomeFromPersonalWork: number,
  taxAfterCreditPoints: number,
  settlementCreditRate: number,
  settlementCeiling: number
): number {
  if (settlementCreditRate <= 0) return 0;
  const eligibleIncome = Math.min(annualIncomeFromPersonalWork, settlementCeiling);
  const theoreticalCredit = eligibleIncome * settlementCreditRate;
  return Math.min(theoreticalCredit, taxAfterCreditPoints);
}

export function calculateNationalInsurance(businessAnnualIncome: number): NIBreakdown {
  const minAnnual = NI_MIN_INCOME_MONTHLY * 12;
  const effectiveIncome = Math.max(
    Math.min(businessAnnualIncome, NI_BRACKET_2_CEILING_ANNUAL),
    minAnnual
  );

  const reducedRateAmount = Math.min(effectiveIncome, NI_BRACKET_1_CEILING_ANNUAL);
  const reducedRateTax = reducedRateAmount * NI_RATE_BRACKET_1;

  const fullRateAmount = Math.max(0, effectiveIncome - NI_BRACKET_1_CEILING_ANNUAL);
  const fullRateTax = fullRateAmount * NI_RATE_BRACKET_2;

  return {
    reducedRateAmount,
    reducedRateTax,
    fullRateAmount,
    fullRateTax,
    total: reducedRateTax + fullRateTax,
  };
}

export function calculateTotalTaxLiability(params: TaxCalculationParams): TaxSummary {
  const { businessIncome, salaryIncome, creditPoints, settlementCreditRate, settlementCeiling } = params;
  const totalIncome = businessIncome + salaryIncome;

  const { grossTax, breakdown } = calculateIncomeTax(totalIncome);
  const creditPointsValue = calculateCreditPointsValue(creditPoints, grossTax);
  const taxAfterPoints = grossTax - creditPointsValue;
  const settlementCredit = calculateSettlementCredit(
    totalIncome,
    taxAfterPoints,
    settlementCreditRate,
    settlementCeiling
  );
  const netIncomeTax = Math.max(0, taxAfterPoints - settlementCredit);

  const nationalInsurance = calculateNationalInsurance(businessIncome);

  return {
    businessIncome,
    salaryIncome,
    totalIncome,
    creditPoints,
    grossIncomeTax: grossTax,
    incomeTaxBreakdown: breakdown,
    creditPointsValue,
    settlementCredit,
    netIncomeTax,
    nationalInsurance,
    totalAnnualTax: netIncomeTax + nationalInsurance.total,
    taxYear: TAX_YEAR,
    calculatedAt: new Date().toISOString(),
  };
}

export function getCreditPointsForUser(gender: 'male' | 'female', extraPoints: number): number {
  const base = gender === 'female' ? BASE_CREDIT_POINTS_FEMALE : BASE_CREDIT_POINTS_MALE;
  return Math.round((base + (extraPoints || 0)) * 100) / 100;
}
