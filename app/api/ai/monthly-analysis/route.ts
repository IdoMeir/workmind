import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyAnalysis } from '@/lib/claude';
import { buildMonthlySummary } from '@/lib/calculations';
import { calculateYearProgress } from '@/lib/calculations';
import { getDateRange } from '@/lib/hebrew-format';
import { OSEK_PATUR_CEILING_2026 } from '@/lib/tax-calculator';
import type { WorkEntry } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { year, month } = await request.json();
  if (!year || !month) return NextResponse.json({ error: 'Missing year/month' }, { status: 400 });

  // Return cached insight if already exists
  const { data: existing } = await supabase
    .from('wm_monthly_insights')
    .select('*')
    .eq('user_id', user.id)
    .eq('period_year', year)
    .eq('period_month', month)
    .single();

  if (existing) return NextResponse.json(existing);

  // Fetch entries for the requested month
  const { from, to } = getDateRange(year, month);
  const { data: entriesRaw } = await supabase
    .from('wm_work_entries')
    .select('*, client:wm_clients(*)')
    .eq('user_id', user.id)
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date');

  const entries = (entriesRaw ?? []) as WorkEntry[];
  const monthlySummary = buildMonthlySummary(entries, year, month);

  // Fetch year-to-date total
  const { data: yearRows } = await supabase
    .from('wm_work_entries')
    .select('amount')
    .eq('user_id', user.id)
    .gte('entry_date', `${year}-01-01`)
    .lte('entry_date', `${year}-12-31`);

  const yearTotal = (yearRows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  const progress = calculateYearProgress(yearTotal, OSEK_PATUR_CEILING_2026);

  // Fetch previous month total
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { from: prevFrom, to: prevTo } = getDateRange(prevYear, prevMonth);
  const { data: prevRows } = await supabase
    .from('wm_work_entries')
    .select('amount')
    .eq('user_id', user.id)
    .gte('entry_date', prevFrom)
    .lte('entry_date', prevTo);
  const previousMonthTotal = prevRows && prevRows.length > 0
    ? prevRows.reduce((s, r) => s + (r.amount ?? 0), 0)
    : undefined;

  // Generate AI analysis
  const content = await generateMonthlyAnalysis({
    year,
    month,
    totalAmount: monthlySummary.totalAmount,
    byClient: monthlySummary.byClient,
    yearTotalSoFar: progress.yearTotal,
    ceiling: OSEK_PATUR_CEILING_2026,
    previousMonthTotal,
  });

  // Save to cache
  const { data: insight, error } = await supabase
    .from('wm_monthly_insights')
    .insert({
      user_id: user.id,
      period_year: year,
      period_month: month,
      content,
      metrics_snapshot: {
        totalAmount: monthlySummary.totalAmount,
        yearTotal: progress.yearTotal,
        previousMonthTotal,
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(insight, { status: 201 });
}
