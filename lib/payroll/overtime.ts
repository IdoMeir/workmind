// חישוב שעות נוספות ושווי משמרת — פונקציות טהורות (מפרט סעיף 4).
import {
  DEFAULT_SHIFT_START,
  MIN_WAGE_HOURLY,
  MONTHLY_HOURS_DIVISOR,
  OT_FIRST_TIER_HOURS,
  OT_RATE_1,
  OT_RATE_2,
  REST_OT_RATE_1,
  REST_OT_RATE_2,
  REST_RATE,
} from './rules-2026';

export type PayType = 'hourly' | 'daily' | 'monthly';

export interface EmployerRules {
  pay_type: PayType;
  hourly_rate: number | null;
  daily_rate: number | null;
  monthly_salary: number | null;
  standard_day_hours: number;
  short_day_paid_full: boolean;
  workweek_days: number;
  short_day: number | null;
  break_paid: boolean;
  ot_daily_threshold: number;
  ot_short_day_threshold: number;
  ot_weekly_threshold: number;
  /** תעריף קבוע לשעה נוספת (₪). null = לפי אחוזים (125%/150%). */
  ot_flat_rate: number | null;
}

export interface ShiftInput {
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM[:SS]
  end_time: string;
  break_minutes: number;
  is_rest_day: boolean;
}

export interface ShiftBreakdown {
  netHours: number;
  /** שעות רגילות אחרי ספי היום והשבוע. */
  regular: number;
  h125: number;
  h150: number;
  rest: number;
  restOt1: number;
  restOt2: number;
  /** שעות שהיו רגילות ביום אבל עברו את הסף השבועי (חלק מ-h125/h150). */
  weeklyConverted: number;
  /** שעות עד הסף היומי, לפני הסף השבועי. */
  dayRegular: number;
  isShortWeekday: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const t = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** 0 = ראשון … 6 = שבת. */
export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** תחילת השבוע (יום ראשון) של התאריך, YYYY-MM-DD. */
export function weekStart(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - dayOfWeek(date)));
  return dt.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** שעות נטו: סיום פחות התחלה (כולל מעבר חצות), פחות הפסקה שלא בתשלום. */
export function netHours(shift: Pick<ShiftInput, 'start_time' | 'end_time' | 'break_minutes'>, breakPaid: boolean): number {
  let minutes = toMinutes(shift.end_time) - toMinutes(shift.start_time);
  if (minutes <= 0) minutes += 24 * 60;
  if (!breakPaid) minutes -= Math.max(0, shift.break_minutes);
  return round2(Math.max(0, minutes) / 60);
}

function splitOvertime(hours: number): [number, number] {
  const first = Math.min(hours, OT_FIRST_TIER_HOURS);
  return [first, hours - first];
}

/**
 * מחשב את כל משמרות שבוע אחד (ראשון–שבת), לפי סדר כרונולוגי.
 * - יומי: מעל הסף היומי (או סף היום הקצר) → שעות נוספות.
 * - שבועי: שעות רגילות מצטברות מעל הסף השבועי → שעות נוספות.
 *   שעות עודפות ביום אחד לא מתקזזות עם יום קצר.
 * - ביום: 2 השעות הנוספות הראשונות 125%, מהשלישית 150%. שעות שהומרו בגלל הסף השבועי
 *   נספרות ראשונות.
 * - יום מנוחה: לא נספר לסף השבועי. עד הסף היומי 150%, אחר כך 187.5% ו-225%.
 * מחזיר breakdown לפי סדר הקלט.
 */
export function computeWeek(shifts: ShiftInput[], rules: EmployerRules): ShiftBreakdown[] {
  const order = shifts
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.shift_date.localeCompare(b.s.shift_date) || a.s.start_time.localeCompare(b.s.start_time));

  const result: ShiftBreakdown[] = new Array(shifts.length);
  let weekRegular = 0;

  for (const { s, i } of order) {
    const net = netHours(s, rules.break_paid);
    const isShortWeekday = rules.short_day !== null && dayOfWeek(s.shift_date) === rules.short_day;

    if (s.is_rest_day) {
      const rest = Math.min(net, rules.ot_daily_threshold);
      const [restOt1, restOt2] = splitOvertime(net - rest);
      result[i] = {
        netHours: net, regular: 0, h125: 0, h150: 0,
        rest: round2(rest), restOt1: round2(restOt1), restOt2: round2(restOt2),
        weeklyConverted: 0, dayRegular: 0, isShortWeekday,
      };
      continue;
    }

    const threshold = isShortWeekday ? rules.ot_short_day_threshold : rules.ot_daily_threshold;
    const dayRegular = Math.min(net, threshold);
    const dailyOt = net - dayRegular;
    const weeklyRoom = Math.max(0, rules.ot_weekly_threshold - weekRegular);
    const regular = Math.min(dayRegular, weeklyRoom);
    const weeklyConverted = dayRegular - regular;
    weekRegular += dayRegular;

    const [h125, h150] = splitOvertime(weeklyConverted + dailyOt);
    result[i] = {
      netHours: net,
      regular: round2(regular),
      h125: round2(h125),
      h150: round2(h150),
      rest: 0, restOt1: 0, restOt2: 0,
      weeklyConverted: round2(weeklyConverted),
      dayRegular: round2(dayRegular),
      isShortWeekday,
    };
  }

  return result;
}

/** תעריף שעה שקול: יומי ÷ שעות יום מלא, שעתי כמות שהוא, חודשי ÷ 182. */
export function hourlyEquivalent(rules: EmployerRules): number {
  switch (rules.pay_type) {
    case 'daily':
      return rules.daily_rate && rules.standard_day_hours > 0 ? rules.daily_rate / rules.standard_day_hours : 0;
    case 'hourly':
      return rules.hourly_rate ?? 0;
    case 'monthly':
      return rules.monthly_salary ? rules.monthly_salary / MONTHLY_HOURS_DIVISOR : 0;
  }
}

/**
 * שווי משוער של משמרת.
 * - יומי: יום מלא = התעריף היומי. יום קצר (פחות שעות מיום מלא) = שעות × תעריף שקול,
 *   אלא אם "יום קצר משולם כיום מלא". ביום הקצר של השבוע, יום מלא = סף היום הקצר.
 * - שעתי: שעות רגילות × תעריף.
 * - חודשי: המשכורת מכסה את הימים הרגילים; המשמרת שווה רק את התוספות.
 * שעות נוספות יומיות מקבלות 125%/150% מלאים. שעות שהומרו בגלל הסף השבועי כבר
 * שולמו בבסיס, ולכן מקבלות רק את התוספת (25%/50%).
 */
export function shiftPay(b: ShiftBreakdown, rules: EmployerRules): number {
  const he = hourlyEquivalent(rules);

  if (b.rest + b.restOt1 + b.restOt2 > 0) {
    return round2(he * (b.rest * REST_RATE + b.restOt1 * REST_OT_RATE_1 + b.restOt2 * REST_OT_RATE_2));
  }

  let base = 0;
  if (rules.pay_type === 'daily') {
    const fullDay = b.isShortWeekday ? rules.ot_short_day_threshold : rules.standard_day_hours;
    const isFull = b.dayRegular >= fullDay - 0.005;
    base = isFull || (rules.short_day_paid_full && b.dayRegular > 0) ? rules.daily_rate ?? 0 : b.dayRegular * he;
  } else if (rules.pay_type === 'hourly') {
    base = b.dayRegular * he;
  }

  // השעות שהומרו תופסות ראשונות את משבצות ה-125%.
  const [conv125, conv150] = splitOvertime(b.weeklyConverted);
  const daily125 = b.h125 - conv125;
  const daily150 = b.h150 - conv150;

  if (rules.ot_flat_rate) {
    // תעריף קבוע: כל שעה נוספת יומית (125 וגם 150) = התעריף הקבוע.
    // שעה שהומרה בגלל הסף השבועי כבר שולמה בבסיס — מקבלת רק את ההפרש מעל התעריף השקול.
    const flat = rules.ot_flat_rate;
    return round2(base + (daily125 + daily150) * flat + b.weeklyConverted * Math.max(0, flat - he));
  }

  const premium =
    conv125 * (OT_RATE_1 - 1) + conv150 * (OT_RATE_2 - 1) + daily125 * OT_RATE_1 + daily150 * OT_RATE_2;

  return round2(base + premium * he);
}

export interface FlatRateWarnings {
  /** התעריף הקבוע נמוך מ-125% מהתעריף השקול. */
  below125: boolean;
  /** התעריף הקבוע נמוך מ-150% מהתעריף השקול (נדרש משעה נוספת שלישית). */
  below150: boolean;
}

/** בדיקת התעריף הקבוע מול המינימום בחוק. לא חוסם — רק אזהרה. */
export function flatRateWarnings(rules: EmployerRules): FlatRateWarnings {
  const he = hourlyEquivalent(rules);
  const flat = rules.ot_flat_rate;
  if (!flat || he <= 0) return { below125: false, below150: false };
  return { below125: flat < he * OT_RATE_1 - 0.005, below150: flat < he * OT_RATE_2 - 0.005 };
}

/** אזהרה למשמרת מסוימת: רק כשיש בה שעות נוספות יומיות באותה מדרגה. */
export function shiftFlatRateWarning(b: ShiftBreakdown, rules: EmployerRules): '125' | '150' | null {
  const w = flatRateWarnings(rules);
  const [conv125, conv150] = splitOvertime(b.weeklyConverted);
  if (w.below125 && b.h125 - conv125 > 0) return '125';
  if (w.below150 && b.h150 - conv150 > 0) return '150';
  return null;
}

/** שעות נוספות יומיות (לא כולל המרה שבועית) — לתצוגה "שעות נוספות: 1.5 × 75 ₪". */
export function dailyOvertimeHours(b: ShiftBreakdown): number {
  const [conv125, conv150] = splitOvertime(b.weeklyConverted);
  return round2(b.h125 - conv125 + b.h150 - conv150);
}

/** האם תעריף השעה השקול נמוך משכר המינימום. */
export function isBelowMinimumWage(rules: EmployerRules): boolean {
  const he = hourlyEquivalent(rules);
  return he > 0 && he < MIN_WAGE_HOURLY;
}

/**
 * מילוי "יום רגיל": שעות ההתחלה והסיום של היום הרגיל האחרון (משמרת לא-מנוחה
 * באורך יום מלא לפחות). אם אין — התחלה ברירת מחדל וסיום שנותן יום מלא נטו.
 */
export function regularDayTemplate(
  pastShifts: (ShiftInput & { created_at?: string })[],
  rules: EmployerRules,
  defaultBreakMinutes: number
): { start_time: string; end_time: string; break_minutes: number } {
  const last = [...pastShifts]
    .filter(s => !s.is_rest_day && netHours(s, rules.break_paid) >= rules.standard_day_hours - 0.005)
    .sort((a, b) => b.shift_date.localeCompare(a.shift_date) || b.start_time.localeCompare(a.start_time))[0];

  if (last) {
    return { start_time: last.start_time.slice(0, 5), end_time: last.end_time.slice(0, 5), break_minutes: last.break_minutes };
  }

  const breakMin = rules.break_paid ? 0 : defaultBreakMinutes;
  const end = toMinutes(DEFAULT_SHIFT_START) + rules.standard_day_hours * 60 + breakMin;
  return { start_time: DEFAULT_SHIFT_START, end_time: fromMinutes(end), break_minutes: defaultBreakMinutes };
}
