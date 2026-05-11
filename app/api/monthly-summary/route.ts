import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { buildMonthlySummary } from '@/lib/calculations';
import { getDateRange } from '@/lib/hebrew-format';
import type { WorkEntry } from '@/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1));

  const { from, to } = getDateRange(year, month);

  const { data, error } = await supabase
    .from('wm_work_entries')
    .select('*, client:wm_clients(*)')
    .eq('user_id', user.id)
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = buildMonthlySummary((data ?? []) as WorkEntry[], year, month);
  return NextResponse.json(summary);
}
