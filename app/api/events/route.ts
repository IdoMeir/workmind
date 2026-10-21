import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { eventSchema } from '@/lib/validations';
import { sanitizeProps } from '@/lib/events';

/** POST — רישום אירוע שימוש. בלי סכומים (מפרט סעיף 8). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

  const { error } = await supabase.from('wm_events').insert({
    user_id: user.id,
    name: parsed.data.name,
    props: sanitizeProps(parsed.data.props ?? undefined),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
