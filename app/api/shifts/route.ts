import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { shiftSchema } from '@/lib/validations';
import { getEmployer, recomputeWeek } from '@/lib/payroll/server';
import { getDateRange } from '@/lib/hebrew-format';

/** GET ?year=&month= | ?from=&to= | ?limit= (האחרונות) */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  let query = supabase
    .from('wm_shifts')
    .select('*')
    .eq('user_id', user.id)
    .order('shift_date', { ascending: false })
    .order('start_time', { ascending: false });

  const year = sp.get('year'), month = sp.get('month');
  if (year && month) {
    const { from, to } = getDateRange(Number(year), Number(month));
    query = query.gte('shift_date', from).lte('shift_date', to);
  } else if (year) {
    query = query.gte('shift_date', `${year}-01-01`).lte('shift_date', `${year}-12-31`);
  }
  if (sp.get('from')) query = query.gte('shift_date', sp.get('from')!);
  if (sp.get('to')) query = query.lte('shift_date', sp.get('to')!);
  if (sp.get('limit')) query = query.limit(Number(sp.get('limit')));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = shiftSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const employer = await getEmployer(supabase, user.id, parsed.data.employer_id);
  if (!employer) return NextResponse.json({ error: 'מעסיק לא נמצא' }, { status: 404 });

  const { data, error } = await supabase
    .from('wm_shifts')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await recomputeWeek(supabase, user.id, employer, data.shift_date);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const { data: saved } = await supabase.from('wm_shifts').select('*').eq('id', data.id).single();
  return NextResponse.json(saved ?? data, { status: 201 });
}
