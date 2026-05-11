import { SupabaseClient } from '@supabase/supabase-js';
import type { ClientMonthlySummary, ReceiptLineItem } from '@/types';

export async function generateReceiptNumber(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: settings, error } = await supabase
    .from('wm_user_settings')
    .select('receipt_counter_current_year, receipt_counter_year')
    .eq('user_id', userId)
    .single();

  if (error || !settings) throw new Error('הגדרות משתמש לא נמצאו — אנא מלא את פרטי הפרופיל בהגדרות');

  const nextNumber =
    settings.receipt_counter_year !== currentYear
      ? 1
      : (settings.receipt_counter_current_year || 0) + 1;

  await supabase
    .from('wm_user_settings')
    .update({ receipt_counter_current_year: nextNumber, receipt_counter_year: currentYear })
    .eq('user_id', userId);

  return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(nextNumber).padStart(3, '0')}`;
}

export function buildLineItemsFromSummary(
  clientSummary: ClientMonthlySummary,
  hourlyRate: number | null
): ReceiptLineItem[] {
  const items: ReceiptLineItem[] = [];

  if (clientSummary.totalHours > 0 && hourlyRate) {
    items.push({
      description: `שעות עבודה — ${clientSummary.totalHours} שעות`,
      quantity: clientSummary.totalHours,
      unit_price: hourlyRate,
      total: clientSummary.hoursAmount,
    });
  }

  for (const entry of clientSummary.entries) {
    if (entry.entry_type === 'event') {
      items.push({
        description: entry.event_name || 'אירוע',
        quantity: 1,
        unit_price: entry.amount,
        total: entry.amount,
      });
    }
  }

  return items;
}
