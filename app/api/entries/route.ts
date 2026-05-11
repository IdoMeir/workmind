import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createWorkEntrySchema } from '@/lib/validations';
import { calculateEntryAmount } from '@/lib/calculations';
import { getDateRange } from '@/lib/hebrew-format';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const clientId = searchParams.get('client_id');

  let query = supabase
    .from('wm_work_entries')
    .select('*, client:wm_clients(*)')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (year && month) {
    const { from, to } = getDateRange(parseInt(year), parseInt(month));
    query = query.gte('entry_date', from).lte('entry_date', to);
  } else if (year) {
    query = query
      .gte('entry_date', `${year}-01-01`)
      .lte('entry_date', `${year}-12-31`);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = createWorkEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  // Fetch client for rate snapshot
  const { data: clientData, error: clientError } = await supabase
    .from('wm_clients')
    .select('hourly_rate, event_rate')
    .eq('id', parsed.data.client_id)
    .eq('user_id', user.id)
    .single();

  if (clientError || !clientData) {
    return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
  }

  const amount = calculateEntryAmount(
    parsed.data.entry_type,
    parsed.data.entry_type === 'hours' ? parsed.data.hours : null,
    clientData,
    parsed.data.custom_amount
  );

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    client_id: parsed.data.client_id,
    entry_type: parsed.data.entry_type,
    entry_date: parsed.data.entry_date,
    description: parsed.data.description ?? null,
    amount,
  };

  if (parsed.data.entry_type === 'hours') {
    insertData.hours = parsed.data.hours;
  } else {
    insertData.event_name = parsed.data.event_name;
  }

  const { data, error } = await supabase
    .from('wm_work_entries')
    .insert(insertData)
    .select('*, client:wm_clients(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
