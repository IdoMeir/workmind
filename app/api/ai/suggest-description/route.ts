import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { suggestReceiptDescription } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event_name } = await request.json();
  if (!event_name) return NextResponse.json({ error: 'Missing event_name' }, { status: 400 });

  const suggestion = await suggestReceiptDescription(event_name);
  return NextResponse.json({ suggestion });
}
