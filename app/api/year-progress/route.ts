import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateYearProgress } from '@/lib/calculations';
import { turnoverFromPayments } from '@/lib/payments';

/** מחזור שנתי = סכום התקבולים (מפרט סעיף 7), מול תקרת עוסק זעיר. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = parseInt(request.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear()));

  const { data, error } = await supabase
    .from('wm_payments')
    .select('received_date, amount')
    .eq('user_id', user.id)
    .gte('received_date', `${year}-01-01`)
    .lte('received_date', `${year}-12-31`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(calculateYearProgress(turnoverFromPayments(data ?? [], year)));
}
