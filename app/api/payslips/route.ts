import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { payslipSchema } from '@/lib/validations';

/** GET ?year=&month= */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  let query = supabase.from('wm_payslips').select('*').eq('user_id', user.id).order('period_month');
  if (sp.get('year')) query = query.eq('period_year', Number(sp.get('year')));
  if (sp.get('month')) query = query.eq('period_month', Number(sp.get('month')));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST — יצירה או עדכון של התלוש לחודש ולמעסיק. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = payslipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { data: employer } = await supabase
    .from('wm_employers').select('id').eq('id', parsed.data.employer_id).eq('user_id', user.id).single();
  if (!employer) return NextResponse.json({ error: 'מעסיק לא נמצא' }, { status: 404 });

  const { data, error } = await supabase
    .from('wm_payslips')
    .upsert({ ...parsed.data, user_id: user.id }, { onConflict: 'user_id,employer_id,period_year,period_month' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
