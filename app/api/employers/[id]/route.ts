import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { employerSchema } from '@/lib/validations';
import { recomputeWeek } from '@/lib/payroll/server';
import { weekStart } from '@/lib/payroll/overtime';
import type { Employer } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const parsed = employerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('wm_employers')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // תעריף או ספים השתנו — מחשבים מחדש את השווי של משמרות השנה הנוכחית.
  const year = new Date().getFullYear();
  const { data: dates } = await supabase
    .from('wm_shifts')
    .select('shift_date')
    .eq('user_id', user.id)
    .eq('employer_id', id)
    .gte('shift_date', `${year}-01-01`);
  const weeks = [...new Set((dates ?? []).map(d => weekStart(d.shift_date)))];
  try {
    for (const w of weeks) await recomputeWeek(supabase, user.id, data as Employer, w);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json(data);
}
