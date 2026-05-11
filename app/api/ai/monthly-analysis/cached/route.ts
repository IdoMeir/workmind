import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') ?? '');
  const month = parseInt(searchParams.get('month') ?? '');
  if (!year || !month) return NextResponse.json(null);

  const { data } = await supabase
    .from('wm_monthly_insights')
    .select('*')
    .eq('user_id', user.id)
    .eq('period_year', year)
    .eq('period_month', month)
    .single();

  return NextResponse.json(data ?? null);
}
