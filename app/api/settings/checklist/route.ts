import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checklistSchema } from '@/lib/validations';

/** PATCH — סימון משימות בצ'קליסט "מה לעשות" (נשמר ב-wm_user_settings). */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = checklistSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('wm_user_settings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'אנא מלא קודם את ההגדרות (שם מלא)' }, { status: 400 });
  }
  return NextResponse.json(data);
}
