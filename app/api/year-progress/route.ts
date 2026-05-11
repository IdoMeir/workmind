import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateYearProgress } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = parseInt(
    request.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear())
  );

  const { data, error } = await supabase
    .from('wm_work_entries')
    .select('amount')
    .eq('user_id', user.id)
    .gte('entry_date', `${year}-01-01`)
    .lte('entry_date', `${year}-12-31`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const yearTotal = (data ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const progress = calculateYearProgress(yearTotal);
  return NextResponse.json(progress);
}
