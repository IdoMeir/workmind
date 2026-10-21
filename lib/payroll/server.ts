import type { SupabaseClient } from '@supabase/supabase-js';
import type { Employer, Shift } from '@/types';
import { addDays, computeWeek, shiftPay, weekStart } from './overtime';
import { toRules } from './employer';
import { ensureShiftsComputed } from './lazy-recompute';

/**
 * השעות הנוספות השבועיות תלויות בכל משמרות השבוע, ולכן אחרי כל שמירה או מחיקה
 * מחושבות מחדש כל משמרות השבוע (ראשון–שבת) של אותו מעסיק.
 */
export async function recomputeWeek(supabase: SupabaseClient, userId: string, employer: Employer, date: string) {
  const from = weekStart(date);
  const to = addDays(from, 6);

  const { data, error } = await supabase
    .from('wm_shifts')
    .select('*')
    .eq('user_id', userId)
    .eq('employer_id', employer.id)
    .gte('shift_date', from)
    .lte('shift_date', to);
  if (error) throw new Error(error.message);

  const shifts = (data ?? []) as Shift[];
  const rules = toRules(employer);
  const breakdown = computeWeek(shifts, rules);

  const results = await Promise.all(shifts.map((s, i) => {
    const b = breakdown[i];
    return supabase
      .from('wm_shifts')
      .update({
        hours_regular: b.regular,
        hours_125: b.h125,
        hours_150: b.h150,
        hours_rest: b.rest,
        hours_rest_ot_1: b.restOt1,
        hours_rest_ot_2: b.restOt2,
        expected_amount: shiftPay(b, rules),
      })
      .eq('id', s.id)
      .eq('user_id', userId);
  }));
  const failed = results.find(r => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function getEmployer(supabase: SupabaseClient, userId: string, employerId: string): Promise<Employer | null> {
  const { data } = await supabase
    .from('wm_employers')
    .select('*')
    .eq('id', employerId)
    .eq('user_id', userId)
    .single();
  return (data as Employer) ?? null;
}

/** חישוב בעצלות של משמרות שנכנסו מבחוץ (expected_amount = NULL). מחזיר true אם חושב משהו. */
export async function ensureShiftsComputedForUser(
  supabase: SupabaseClient,
  userId: string,
  shifts: Pick<Shift, 'employer_id' | 'shift_date' | 'expected_amount'>[]
): Promise<boolean> {
  return ensureShiftsComputed(shifts, {
    getEmployer: id => getEmployer(supabase, userId, id),
    recomputeWeek: (employer, date) => recomputeWeek(supabase, userId, employer, date),
  });
}
