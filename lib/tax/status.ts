import { SELF_STATUS, SELF_STATUS_WINDOW_DAYS } from './constants-2026';

export type SelfStatusReason = 'hours' | 'income' | 'hours_and_income' | 'not_from_work';

export interface SelfStatusParams {
  /** ממוצע שעות שבועיות בעסק (בשלושת החודשים האחרונים). */
  avgWeeklyHours: number;
  /** ממוצע הכנסה חודשית מהעסק (בשלושת החודשים האחרונים). */
  avgMonthlyIncome: number;
}

export interface SelfStatusResult {
  isSelfEmployed: boolean;
  reason: SelfStatusReason;
}

/**
 * סיווג "עצמאי" לפי ב"ל. עצמאי אם מתקיים אחד מאלה:
 * - לפחות 20 שעות בשבוע;
 * - הכנסה של לפחות 6,885 ₪ בחודש;
 * - לפחות 12 שעות בשבוע וגם הכנסה של לפחות 2,065 ₪.
 * אחרת — "הכנסה שלא מעבודה".
 */
export function classifySelfEmployed({ avgWeeklyHours, avgMonthlyIncome }: SelfStatusParams): SelfStatusResult {
  if (avgWeeklyHours >= SELF_STATUS.hoursA) return { isSelfEmployed: true, reason: 'hours' };
  if (avgMonthlyIncome >= SELF_STATUS.incomeA) return { isSelfEmployed: true, reason: 'income' };
  if (avgWeeklyHours >= SELF_STATUS.hoursB && avgMonthlyIncome >= SELF_STATUS.incomeB) {
    return { isSelfEmployed: true, reason: 'hours_and_income' };
  }
  return { isSelfEmployed: false, reason: 'not_from_work' };
}


export interface ActivityEntry {
  entry_date: string;
  entry_type: 'hours' | 'event';
  hours: number | string | null;
  amount: number | string;
}

export interface BusinessActivity extends SelfStatusParams {
  from: string;
  to: string;
}

function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * ממוצעים לסיווג (מפרט סעיף 3): שעות בשבוע והכנסה בחודש מהעסק,
 * ב-91 הימים האחרונים כולל היום (13 שבועות, 3 חודשים).
 */
export function businessActivity(entries: ActivityEntry[], today: string): BusinessActivity {
  const from = shiftDate(today, -(SELF_STATUS_WINDOW_DAYS - 1));
  const inWindow = entries.filter(e => e.entry_date >= from && e.entry_date <= today);
  const hours = inWindow.reduce((s, e) => s + (e.entry_type === 'hours' ? Number(e.hours ?? 0) : 0), 0);
  const income = inWindow.reduce((s, e) => s + Number(e.amount), 0);
  const weeks = SELF_STATUS_WINDOW_DAYS / 7;
  const months = 3;
  return {
    from,
    to: today,
    avgWeeklyHours: Math.round((hours / weeks) * 10) / 10,
    avgMonthlyIncome: Math.round(income / months),
  };
}
