// חוקי שעות עבודה ומנוחה — ברירות מחדל לפי החוק (מפרט סעיף 4).
// כל הספים כאן. אין מספרים קשיחים בקומפוננטות. הסכם ענפי יכול להיטיב —
// ולכן הספים נשמרים בהגדרות המעסיק וניתנים לעריכה.
import { MIN_WAGE_HOURLY_FROM_2026_04 } from '@/lib/tax/constants-2026';

export const MIN_WAGE_HOURLY = MIN_WAGE_HOURLY_FROM_2026_04;

/** ספי שעות נוספות יומיים לפי אורך שבוע העבודה. */
export const WORKWEEK_DEFAULTS = {
  5: { dailyThreshold: 8.6, shortDayThreshold: 7.6, shortDay: 4 }, // חמישי
  6: { dailyThreshold: 8, shortDayThreshold: 7, shortDay: 5 },     // שישי
} as const;

export const WEEKLY_THRESHOLD = 42;

/** שעות נוספות ביום רגיל: 2 הראשונות ב-125%, מהשלישית 150%. */
export const OT_FIRST_TIER_HOURS = 2;
export const OT_RATE_1 = 1.25;
export const OT_RATE_2 = 1.5;

/** יום מנוחה: 150% בסיס; שעות נוספות 187.5% ואחר כך 225%. */
export const REST_RATE = 1.5;
export const REST_OT_RATE_1 = 1.875;
export const REST_OT_RATE_2 = 2.25;

/** מחלק שעות חודשי לשכר חודשי (משרה מלאה). */
export const MONTHLY_HOURS_DIVISOR = 182;

/** ברירות המחדל של מעסיק חדש (המצב המאושר של עידו: יומי, 5 ימים). */
export const EMPLOYER_DEFAULTS = {
  pay_type: 'daily',
  standard_day_hours: WORKWEEK_DEFAULTS[5].dailyThreshold,
  short_day_paid_full: false,
  workweek_days: 5,
  short_day: WORKWEEK_DEFAULTS[5].shortDay,
  break_minutes: 30,
  break_paid: false,
  ot_daily_threshold: WORKWEEK_DEFAULTS[5].dailyThreshold,
  ot_short_day_threshold: WORKWEEK_DEFAULTS[5].shortDayThreshold,
  ot_weekly_threshold: WEEKLY_THRESHOLD,
  ot_flat_rate: null,
} as const;

/** שעת התחלה כשאין עדיין "יום רגיל" קודם. */
export const DEFAULT_SHIFT_START = '07:00';

/** שבועות בחודש בממוצע (52 ÷ 12) — להערכת שכר חודשי כשאין תלושים. */
export const WEEKS_PER_MONTH = 52 / 12;
