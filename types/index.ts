export interface UserSettings {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string | null;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gender: 'male' | 'female';
  extra_credit_points: number;
  settlement_name: string | null;
  settlement_credit_rate: number;
  settlement_ceiling: number;
  salary_annual_income: number;
  receipt_counter_current_year: number;
  receipt_counter_year: number;
  created_at: string;
  updated_at: string;
}

export interface RatePreset {
  name: string;
  rate: number;
  type: 'hourly' | 'daily' | 'fixed';
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  hourly_rate: number | null;
  event_rate: number | null;
  rate_presets: RatePreset[] | null;
  contact_info: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkEntryType = 'hours' | 'event';

export interface WorkEntry {
  id: string;
  user_id: string;
  client_id: string;
  entry_type: WorkEntryType;
  entry_date: string;
  hours: number | null;
  event_name: string | null;
  amount: number;
  description: string | null;
  receipt_id: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ClientSnapshot {
  name: string;
  contact_info: string | null;
}

export interface UserSnapshot {
  full_name: string;
  business_name: string | null;
  tax_id: string | null;
  address: string | null;
}

export interface Receipt {
  id: string;
  user_id: string;
  client_id: string;
  receipt_number: string;
  issue_date: string;
  period_year: number;
  period_month: number;
  total_amount: number;
  client_snapshot: ClientSnapshot;
  user_snapshot: UserSnapshot;
  line_items: ReceiptLineItem[];
  notes: string | null;
  created_at: string;
}

export interface MonthlyInsight {
  id: string;
  user_id: string;
  period_year: number;
  period_month: number;
  content: string;
  metrics_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxBreakdownLine {
  bracketMin: number;
  bracketMax: number;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface IncomeTaxResult {
  grossTax: number;
  breakdown: TaxBreakdownLine[];
}

export interface NIBreakdown {
  reducedRateAmount: number;
  reducedRateTax: number;
  fullRateAmount: number;
  fullRateTax: number;
  total: number;
}

export interface TaxCalculationParams {
  businessIncome: number;
  salaryIncome: number;
  creditPoints: number;
  settlementCreditRate: number;
  settlementCeiling: number;
}

export interface TaxSummary {
  businessIncome: number;
  salaryIncome: number;
  totalIncome: number;
  creditPoints: number;
  grossIncomeTax: number;
  incomeTaxBreakdown: TaxBreakdownLine[];
  creditPointsValue: number;
  settlementCredit: number;
  netIncomeTax: number;
  nationalInsurance: NIBreakdown;
  totalAnnualTax: number;
  taxYear: number;
  calculatedAt: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalAmount: number;
  byClient: ClientMonthlySummary[];
  entriesCount: number;
}

export interface ClientMonthlySummary {
  clientId: string;
  clientName: string;
  totalHours: number;
  hoursAmount: number;
  eventsCount: number;
  eventsAmount: number;
  total: number;
  entries: WorkEntry[];
}

export interface YearProgress {
  yearTotal: number;
  ceiling: number;
  percentage: number;
  remaining: number;
  isExceeded: boolean;
}
