import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  hourly_rate: z.number().positive().optional().nullable(),
  event_rate: z.number().positive().optional().nullable(),
  contact_info: z.string().max(1000).optional().nullable(),
}).refine(data => data.hourly_rate || data.event_rate, {
  message: 'חייב להגדיר לפחות תעריף שעתי או תעריף אירוע',
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  hourly_rate: z.number().positive().optional().nullable(),
  event_rate: z.number().positive().optional().nullable(),
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
});

export const generateReceiptSchema = z.object({
  client_id: z.string().uuid(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  notes: z.string().max(1000).optional(),
  custom_line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    total: z.number().positive(),
  })).optional(),
});
