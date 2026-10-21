// משמרות שנכנסות מבחוץ (מהיומן, דרך SQL) מגיעות עם expected_amount = NULL ו-hours_* = 0.
// לפני שמחזירים או מסכמים משמרות, מחשבים מחדש את השבועות שלהן (מפרט: חישוב בעצלות).
import { weekStart } from './overtime';
import type { Employer, Shift } from '@/types';

export interface PendingWeek {
  employer_id: string;
  /** יום ראשון של השבוע. */
  week: string;
  /** תאריך של משמרת אחת בשבוע — להעברה ל-recomputeWeek. */
  date: string;
}

/** השבועות (לפי מעסיק) שיש בהם משמרת שעוד לא חושבה. */
export function weeksNeedingRecompute(shifts: Pick<Shift, 'employer_id' | 'shift_date' | 'expected_amount'>[]): PendingWeek[] {
  const seen = new Map<string, PendingWeek>();
  for (const s of shifts) {
    if (s.expected_amount !== null && s.expected_amount !== undefined) continue;
    const week = weekStart(s.shift_date);
    const key = `${s.employer_id}|${week}`;
    if (!seen.has(key)) seen.set(key, { employer_id: s.employer_id, week, date: s.shift_date });
  }
  return [...seen.values()];
}

export interface LazyRecomputeDeps {
  getEmployer: (id: string) => Promise<Employer | null>;
  recomputeWeek: (employer: Employer, date: string) => Promise<void>;
}

/** מחשב מחדש את השבועות החסרים. מחזיר true אם חושב משהו (ואז צריך לקרוא שוב). */
export async function ensureShiftsComputed(
  shifts: Pick<Shift, 'employer_id' | 'shift_date' | 'expected_amount'>[],
  deps: LazyRecomputeDeps
): Promise<boolean> {
  const pending = weeksNeedingRecompute(shifts);
  if (pending.length === 0) return false;
  const employers = new Map<string, Employer | null>();
  for (const p of pending) {
    if (!employers.has(p.employer_id)) employers.set(p.employer_id, await deps.getEmployer(p.employer_id));
    const employer = employers.get(p.employer_id);
    if (employer) await deps.recomputeWeek(employer, p.date);
  }
  return true;
}
