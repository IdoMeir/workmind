import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { shiftSchema } from '@/lib/validations';
import { getEmployer, recomputeWeek } from '@/lib/payroll/server';
import { weekStart } from '@/lib/payroll/overtime';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const parsed = shiftSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { data: before } = await supabase
    .from('wm_shifts').select('shift_date, employer_id').eq('id', id).eq('user_id', user.id).single();
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const employer = await getEmployer(supabase, user.id, parsed.data.employer_id);
  if (!employer) return NextResponse.json({ error: 'מעסיק לא נמצא' }, { status: 404 });

  const { error } = await supabase.from('wm_shifts').update(parsed.data).eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await recomputeWeek(supabase, user.id, employer, parsed.data.shift_date);
    // המשמרת עברה שבוע או מעסיק — גם השבוע הקודם משתנה.
    if (weekStart(before.shift_date) !== weekStart(parsed.data.shift_date) || before.employer_id !== employer.id) {
      const prev = before.employer_id === employer.id ? employer : await getEmployer(supabase, user.id, before.employer_id);
      if (prev) await recomputeWeek(supabase, user.id, prev, before.shift_date);
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const { data } = await supabase.from('wm_shifts').select('*').eq('id', id).single();
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
  const { data: shift } = await supabase
    .from('wm_shifts').select('shift_date, employer_id').eq('id', id).eq('user_id', user.id).single();
  if (!shift) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('wm_shifts').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const employer = await getEmployer(supabase, user.id, shift.employer_id);
  try {
    if (employer) await recomputeWeek(supabase, user.id, employer, shift.shift_date);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
