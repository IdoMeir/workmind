import { SELF_STATUS } from './constants-2026';

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
