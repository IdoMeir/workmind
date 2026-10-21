// צפי שכר ל-12 חודשי השנה (מפרט 6.4): תלושים שהוזנו + ממוצע חודשי לחודשים שנותרו,
// רק מתאריך תחילת העבודה. מזין את ב"ל החודשי (calculateAnnualSelfEmployedNI).
import { WEEKS_PER_MONTH } from './rules-2026';
import type { EmployerRules } from './overtime';

export interface SalaryProjectionInput {
  year: number;
  /** החודש הנוכחי (1–12). חודשים לפניו נחשבים "עברו". */
  currentMonth: number;
  employmentStart: string | null;
  employmentEnd: string | null;
  /** ברוטו מהתלוש, לפי חודש (1–12). */
  payslipGross: Partial<Record<number, number>>;
  /** שווי צפוי מהמשמרות, לפי חודש (1–12). */
  shiftsExpected: Partial<Record<number, number>>;
  /** הערכה מהגדרות המעסיק כשאין תלושים ואין משמרות. */
  fallbackMonthly: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

function isEmployed(year: number, month: number, start: string | null, end: string | null): boolean {
  const first = `${year}-${pad(month)}-01`;
  const last = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
  return (!start || start <= last) && (!end || end >= first);
}

/** ממוצע חודשי: 3 התלושים האחרונים; אחרת חודשי משמרות שעברו; אחרת הערכה מהמעסיק. */
export function averageMonthlyGross(input: SalaryProjectionInput): number {
  const slips = Object.entries(input.payslipGross)
    .filter(([, v]) => v !== undefined && v > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice(-3)
    .map(([, v]) => v as number);
  if (slips.length) return slips.reduce((s, v) => s + v, 0) / slips.length;

  const pastShifts = Object.entries(input.shiftsExpected)
    .filter(([m, v]) => Number(m) < input.currentMonth && v !== undefined && v > 0)
    .map(([, v]) => v as number);
  if (pastShifts.length) return pastShifts.reduce((s, v) => s + v, 0) / pastShifts.length;

  return Math.max(0, input.fallbackMonthly);
}

/** החלק של החודש שבו עבד: בחודש תחילת העבודה — מתאריך ההתחלה בלבד (ימים קלנדריים). */
export function employedFraction(year: number, month: number, start: string | null): number {
  if (!start || start.slice(0, 7) !== `${year}-${pad(month)}`) return 1;
  const days = new Date(year, month, 0).getDate();
  const startDay = Number(start.slice(8, 10));
  return (days - startDay + 1) / days;
}

export function projectMonthlySalaries(input: SalaryProjectionInput): number[] {
  const avg = averageMonthlyGross(input);
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const slip = input.payslipGross[m];
    if (slip !== undefined) return slip;
    if (!isEmployed(input.year, m, input.employmentStart, input.employmentEnd)) return 0;
    const shifts = input.shiftsExpected[m] ?? 0;
    if (m < input.currentMonth && shifts > 0) return shifts;
    return Math.round(avg * employedFraction(input.year, m, input.employmentStart) * 100) / 100;
  });
}

/** הערכת ברוטו חודשי מהגדרות המעסיק בלבד. */
export function estimateMonthlyGross(rules: EmployerRules): number {
  const daysPerMonth = rules.workweek_days * WEEKS_PER_MONTH;
  switch (rules.pay_type) {
    case 'daily':
      return (rules.daily_rate ?? 0) * daysPerMonth;
    case 'hourly':
      return (rules.hourly_rate ?? 0) * rules.standard_day_hours * daysPerMonth;
    case 'monthly':
      return rules.monthly_salary ?? 0;
  }
}
