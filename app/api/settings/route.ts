import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { userSettingsSchema } from '@/lib/validations';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('wm_user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = userSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('wm_user_settings')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let result;
  if (existing) {
    result = await supabase
      .from('wm_user_settings')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('wm_user_settings')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data);
}
