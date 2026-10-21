import { z } from 'zod';

const ratePresetSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.number().positive(),
  type: z.enum(['hourly', 'daily', 'fixed']),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  hourly_rate: z.number().positive().optional().nullable(),
  event_rate: z.number().positive().optional().nullable(),
  rate_presets: z.array(ratePresetSchema).optional().nullable(),
  contact_info: z.string().max(1000).optional().nullable(),
}).refine(
  data => data.hourly_rate || data.event_rate || (data.rate_presets && data.rate_presets.length > 0),
  { message: 'חייב להגדיר לפחות תעריף שעתי, תעריף אירוע, או תעריף מוגדר' }
);

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  hourly_rate: z.number().positive().optional().nullable(),
  event_rate: z.number().positive().optional().nullable(),
  rate_presets: z.array(ratePresetSchema).optional().nullable(),
  contact_info: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const createWorkEntrySchema = z.discriminatedUnion('entry_type', [
  z.object({
    entry_type: z.literal('hours'),
    client_id: z.string().uuid(),
    entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hours: z.number().positive().max(24),
    description: z.string().max(500).optional().nullable(),
    custom_amount: z.number().positive().optional(),
  }),
  z.object({
    entry_type: z.literal('event'),
    client_id: z.string().uuid(),
    entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    event_name: z.string().min(1).max(200),
    description: z.string().max(500).optional().nullable(),
    custom_amount: z.number().positive().optional(),
  }),
]);

export const updateWorkEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hours: z.number().positive().max(24).optional().nullable(),
  event_name: z.string().min(1).max(200).optional().nullable(),
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional().nullable(),
});

export const userSettingsSchema = z.object({
  full_name: z.string().min(1).max(200),
  business_name: z.string().max(200).optional().nullable(),
  tax_id: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  gender: z.enum(['male', 'female']),
  extra_credit_points: z.number().min(0).max(20),
  settlement_name: z.string().max(100).optional().nullable(),
  settlement_credit_rate: z.number().min(0).max(0.30),
  settlement_ceiling: z.number().positive(),
  salary_annual_income: z.number().min(0),
  tax_track: z.enum(['zair', 'regular']).optional(),
  is_kibbutz_member: z.boolean().optional(),
});

export const checklistSchema = z.object({
  tax_coordination_done_year: z.number().int().min(2020).max(2100).nullable().optional(),
  form101_done: z.boolean().optional(),
  ni_advances_updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'אין שינוי' });


// ─── v2: מעסיק, משמרות, תלושים, תקבולים ──────────────────────

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeStr = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const money = z.number().nonnegative();

export const employerSchema = z.object({
  name: z.string().min(1).max(200),
  deduction_file: z.string().max(50).optional().nullable(),
  start_date: dateStr.optional().nullable(),
  end_date: dateStr.optional().nullable(),
  pay_type: z.enum(['hourly', 'daily', 'monthly']),
  hourly_rate: z.number().positive().optional().nullable(),
  daily_rate: z.number().positive().optional().nullable(),
  monthly_salary: z.number().positive().optional().nullable(),
  standard_day_hours: z.number().positive().max(24),
  short_day_paid_full: z.boolean(),
  workweek_days: z.union([z.literal(5), z.literal(6)]),
  short_day: z.number().int().min(0).max(6).nullable(),
  break_minutes: z.number().int().min(0).max(240),
  break_paid: z.boolean(),
  ot_daily_threshold: z.number().positive().max(24),
  ot_short_day_threshold: z.number().positive().max(24),
  ot_weekly_threshold: z.number().positive().max(168),
  travel_per_day: money.optional().nullable(),
  has_existing_pension: z.boolean().optional().nullable(),
}).refine(
  d => (d.pay_type === 'daily' && d.daily_rate) || (d.pay_type === 'hourly' && d.hourly_rate) || (d.pay_type === 'monthly' && d.monthly_salary),
  { message: 'חסר תעריף לסוג התשלום שנבחר' }
);

export const shiftSchema = z.object({
  employer_id: z.string().uuid(),
  shift_date: dateStr,
  start_time: timeStr,
  end_time: timeStr,
  break_minutes: z.number().int().min(0).max(240),
  is_rest_day: z.boolean(),
  note: z.string().max(500).optional().nullable(),
});

export const payslipSchema = z.object({
  employer_id: z.string().uuid(),
  period_year: z.number().int().min(2020).max(2100),
  period_month: z.number().int().min(1).max(12),
  gross: money,
  net: money.optional().nullable(),
  income_tax: money.optional().nullable(),
  ni_health: money.optional().nullable(),
  pension_employee: money.optional().nullable(),
});

export const paymentSchema = z.object({
  client_id: z.string().uuid(),
  received_date: dateStr,
  amount: z.number().positive(),
  method: z.enum(['transfer', 'cash', 'check', 'bit', 'other']).nullable(),
  external_receipt_no: z.string().max(50).optional().nullable(),
  receipt_id: z.string().uuid().optional().nullable(),
  /** עבודות פתוחות שהתקבול משלם עליהן. */
  entry_ids: z.array(z.string().uuid()).default([]),
});

// אירועי שימוש: רק שם מהרשימה ותוויות קצרות. אין מספרים, ולכן אין סכומים.
export const eventSchema = z.object({
  name: z.enum(['screen_open', 'entry_saved', 'like_yesterday', 'how_calculated_open']),
  props: z.record(z.string().max(40), z.union([z.string().max(60), z.boolean()])).nullable().optional(),
});
