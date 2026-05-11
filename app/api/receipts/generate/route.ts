import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptSchema } from '@/lib/validations';
import { generateReceiptNumber, buildLineItemsFromSummary } from '@/lib/receipts';
import { buildMonthlySummary } from '@/lib/calculations';
import { getDateRange } from '@/lib/hebrew-format';
import type { WorkEntry } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = generateReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { client_id, year, month, notes, custom_line_items } = parsed.data;

  // Fetch user settings for snapshot + receipt counter
  const { data: settings, error: settingsError } = await supabase
    .from('wm_user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (settingsError || !settings) {
    return NextResponse.json(
      { error: 'אנא מלא את פרטי הפרופיל בהגדרות לפני הפקת קבלה' },
      { status: 400 }
    );
  }

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('wm_clients')
    .select('*')
    .eq('id', client_id)
    .eq('user_id', user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
  }

  // Fetch unbilled entries for this client + month
  const { from, to } = getDateRange(year, month);
  const { data: entriesRaw, error: entriesError } = await supabase
    .from('wm_work_entries')
    .select('*, client:wm_clients(*)')
    .eq('user_id', user.id)
    .eq('client_id', client_id)
    .gte('entry_date', from)
    .lte('entry_date', to)
    .is('receipt_id', null)
    .order('entry_date');

  if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });

  const entries = (entriesRaw ?? []) as WorkEntry[];
  if (entries.length === 0) {
    return NextResponse.json({ error: 'אין רשומות חדשות להפקת קבלה בחודש זה' }, { status: 400 });
  }

  // Build line items
  const monthlySummary = buildMonthlySummary(entries, year, month);
  const clientSummary = monthlySummary.byClient[0];
  const lineItems = custom_line_items ?? buildLineItemsFromSummary(clientSummary, client.hourly_rate);
  const totalAmount = lineItems.reduce((s, item) => s + item.total, 0);

  // Generate receipt number (increments counter atomically)
  let receiptNumber: string;
  try {
    receiptNumber = await generateReceiptNumber(supabase, user.id);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const userSnapshot = {
    full_name: settings.full_name,
    business_name: settings.business_name ?? null,
    tax_id: settings.tax_id ?? null,
    address: settings.address ?? null,
    phone: settings.phone ?? null,
  };
  const clientSnapshot = {
    name: client.name,
    contact_info: client.contact_info ?? null,
  };

  // Insert receipt
  const { data: receipt, error: insertError } = await supabase
    .from('wm_receipts')
    .insert({
      user_id: user.id,
      client_id,
      receipt_number: receiptNumber,
      issue_date: new Date().toISOString().split('T')[0],
      period_year: year,
      period_month: month,
      total_amount: totalAmount,
      client_snapshot: clientSnapshot,
      user_snapshot: userSnapshot,
      line_items: lineItems,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Link entries to receipt
  const entryIds = entries.map(e => e.id);
  await supabase
    .from('wm_work_entries')
    .update({ receipt_id: receipt.id })
    .in('id', entryIds);

  return NextResponse.json(receipt, { status: 201 });
}
