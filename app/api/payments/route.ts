import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { paymentSchema } from '@/lib/validations';
import { getDateRange } from '@/lib/hebrew-format';

/** GET ?year=&month= | ?year= */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  let query = supabase
    .from('wm_payments')
    .select('*, client:wm_clients(id, name), entries:wm_work_entries(entry_type, hours, amount)')
    .eq('user_id', user.id)
    .order('received_date', { ascending: false });

  const year = sp.get('year'), month = sp.get('month');
  if (year && month) {
    const { from, to } = getDateRange(Number(year), Number(month));
    query = query.gte('received_date', from).lte('received_date', to);
  } else if (year) {
    query = query.gte('received_date', `${year}-01-01`).lte('received_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST — רישום תקבול וקישור העבודות הפתוחות שהוא משלם. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = paymentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }
  const { entry_ids, ...payment } = parsed.data;

  const { data: client } = await supabase
    .from('wm_clients').select('id').eq('id', payment.client_id).eq('user_id', user.id).single();
  if (!client) return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });

  if (payment.receipt_id) {
    const { data: receipt } = await supabase
      .from('wm_receipts').select('id').eq('id', payment.receipt_id).eq('user_id', user.id).single();
    if (!receipt) return NextResponse.json({ error: 'קבלה לא נמצאה' }, { status: 404 });
  }

  // רק עבודות פתוחות של אותו לקוח.
  if (entry_ids.length > 0) {
    const { data: open } = await supabase
      .from('wm_work_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('client_id', payment.client_id)
      .is('payment_id', null)
      .is('receipt_id', null)
      .in('id', entry_ids);
    if ((open ?? []).length !== entry_ids.length) {
      return NextResponse.json({ error: 'חלק מהעבודות כבר שולמו או שייכות ללקוח אחר. רענן ונסה שוב.' }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('wm_payments')
    .insert({ ...payment, user_id: user.id })
    .select('*, client:wm_clients(id, name)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (entry_ids.length > 0) {
    const { error: linkError } = await supabase
      .from('wm_work_entries')
      .update({ payment_id: data.id })
      .eq('user_id', user.id)
      .in('id', entry_ids);
    if (linkError) {
      await supabase.from('wm_payments').delete().eq('id', data.id).eq('user_id', user.id);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  }

  return NextResponse.json(data, { status: 201 });
}
