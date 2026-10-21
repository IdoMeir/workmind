import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET ?year= — ייצוא CSV של משמרות, עבודות לעסק ותקבולים (עם BOM לאקסל בעברית). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = parseInt(request.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear()));
  const from = `${year}-01-01`, to = `${year}-12-31`;

  const [shifts, entries, payments] = await Promise.all([
    supabase.from('wm_shifts').select('*, employer:wm_employers(name)').eq('user_id', user.id)
      .gte('shift_date', from).lte('shift_date', to).order('shift_date'),
    supabase.from('wm_work_entries').select('*, client:wm_clients(name)').eq('user_id', user.id)
      .gte('entry_date', from).lte('entry_date', to).order('entry_date'),
    supabase.from('wm_payments').select('*, client:wm_clients(name)').eq('user_id', user.id)
      .gte('received_date', from).lte('received_date', to).order('received_date'),
  ]);
  const failed = [shifts, entries, payments].find(r => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  const rows: unknown[][] = [['סוג', 'תאריך', 'מעסיק / לקוח', 'פירוט', 'שעות', 'סכום']];
  for (const s of shifts.data ?? []) {
    const hours = ['hours_regular', 'hours_125', 'hours_150', 'hours_rest', 'hours_rest_ot_1', 'hours_rest_ot_2']
      .reduce((sum, k) => sum + Number(s[k] ?? 0), 0);
    rows.push(['משמרת', s.shift_date, s.employer?.name, `${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)}${s.is_rest_day ? ' מנוחה' : ''}`, hours, s.expected_amount]);
  }
  for (const e of entries.data ?? []) {
    rows.push(['עבודה לעסק', e.entry_date, e.client?.name, e.entry_type === 'event' ? e.event_name : e.description, e.hours, e.amount]);
  }
  for (const p of payments.data ?? []) {
    rows.push(['תקבול', p.received_date, p.client?.name, p.external_receipt_no ? `קבלה ${p.external_receipt_no}` : p.method, '', p.amount]);
  }

  const csv = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="workmind-${year}.csv"`,
    },
  });
}
