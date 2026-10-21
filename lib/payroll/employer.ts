import type { Employer } from '@/types';
import type { EmployerRules } from './overtime';

/** שורת מעסיק מה-DB (NUMERIC מגיע כמחרוזת) → כללי חישוב. */
export function toRules(e: Employer): EmployerRules {
  return {
    pay_type: e.pay_type,
    hourly_rate: e.hourly_rate !== null ? Number(e.hourly_rate) : null,
    daily_rate: e.daily_rate !== null ? Number(e.daily_rate) : null,
    monthly_salary: e.monthly_salary !== null ? Number(e.monthly_salary) : null,
    standard_day_hours: Number(e.standard_day_hours),
    short_day_paid_full: e.short_day_paid_full,
    workweek_days: e.workweek_days,
    short_day: e.short_day,
    break_paid: e.break_paid,
    ot_daily_threshold: Number(e.ot_daily_threshold),
    ot_short_day_threshold: Number(e.ot_short_day_threshold),
    ot_weekly_threshold: Number(e.ot_weekly_threshold),
  };
}
