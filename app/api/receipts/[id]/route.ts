import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from('wm_receipts')
    .select('*, client:wm_clients(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'קבלה לא נמצאה' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: receipt } = await supabase
    .from('wm_receipts')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!receipt) return NextResponse.json({ error: 'קבלה לא נמצאה' }, { status: 404 });

  // Release all linked entries so they become available for future receipts
  await supabase
    .from('wm_work_entries')
    .update({ receipt_id: null })
    .eq('receipt_id', id)
    .eq('user_id', user.id);

  const { error } = await supabase
    .from('wm_receipts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'שגיאה במחיקת הקבלה' }, { status: 500 });
  return NextResponse.json({ success: true });
}
