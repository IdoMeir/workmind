import { describe, expect, it, vi } from 'vitest';
import { ensureShiftsComputed, weeksNeedingRecompute } from '../lazy-recompute';
import { addDays, computeWeek, shiftPay, weekStart } from '../overtime';
import { toRules } from '../employer';
import { EMPLOYER_DEFAULTS } from '../rules-2026';
import type { Employer, Shift } from '@/types';

const EMPLOYER: Employer = {
  ...EMPLOYER_DEFAULTS,
  id: 'emp-1',
  user_id: 'u',
  name: 'מסגריה',
  deduction_file: null,
  start_date: null,
  end_date: null,
  pay_type: 'daily',
  hourly_rate: null,
  daily_rate: 450,
  monthly_salary: null,
  standard_day_hours: 8.5,
  ot_daily_threshold: 8.5,
  short_day: null,
  workweek_days: 5,
  ot_flat_rate: 75,
  travel_per_day: null,
  has_existing_pension: null,
  created_at: '',
};

/** שורה כמו שהמשימה המתוזמנת מכניסה: expected_amount = NULL, hours_* = 0. */
function calendarShift(id: string, date: string, start: string, end: string): Shift {
  return {
    id, user_id: 'u', employer_id: 'emp-1', shift_date: date, start_time: `${start}:00`, end_time: `${end}:00`,
    break_minutes: 30, is_rest_day: false,
    hours_regular: 0, hours_125: 0, hours_150: 0, hours_rest: 0, hours_rest_ot_1: 0, hours_rest_ot_2: 0,
    expected_amount: null, note: null, calendar_event_id: `gcal-${id}`, created_at: '',
  };
}

/** DB בזיכרון + recomputeWeek אמיתי (אותו חישוב כמו בשרת). */
function fakeDb(rows: Shift[]) {
  const recompute = vi.fn(async (employer: Employer, date: string) => {
    const from = weekStart(date), to = addDays(from, 6);
    const week = rows.filter(s => s.employer_id === employer.id && s.shift_date >= from && s.shift_date <= to);
    const rules = toRules(employer);
    computeWeek(week, rules).forEach((b, i) => {
      Object.assign(week[i], {
        hours_regular: b.regular, hours_125: b.h125, hours_150: b.h150,
        hours_rest: b.rest, hours_rest_ot_1: b.restOt1, hours_rest_ot_2: b.restOt2,
        expected_amount: shiftPay(b, rules),
      });
    });
  });
  return { rows, recompute, getEmployer: vi.fn(async (id: string) => (id === EMPLOYER.id ? EMPLOYER : null)) };
}

/** מדמה GET /api/shifts: קריאה, חישוב בעצלות אם צריך, קריאה שנייה. */
async function readShifts(db: ReturnType<typeof fakeDb>): Promise<Shift[]> {
  const first = db.rows.map(r => ({ ...r }));
  const changed = await ensureShiftsComputed(first, { getEmployer: db.getEmployer, recomputeWeek: db.recompute });
  return changed ? db.rows.map(r => ({ ...r })) : first;
}

describe('חישוב בעצלות של משמרות מהיומן', () => {
  it('משמרת עם expected_amount NULL מחושבת בקריאה הראשונה', async () => {
    const db = fakeDb([calendarShift('a', '2026-10-19', '07:00', '17:30')]); // 10 שעות נטו
    const result = await readShifts(db);
    expect(result[0].expected_amount).toBe(562.5);
    expect(result[0].hours_regular).toBe(8.5);
    expect(result[0].hours_125).toBe(1.5);
    expect(db.recompute).toHaveBeenCalledTimes(1);
  });

  it('קריאה שנייה לא מחשבת שוב', async () => {
    const db = fakeDb([calendarShift('a', '2026-10-19', '07:00', '17:30')]);
    await readShifts(db);
    await readShifts(db);
    expect(db.recompute).toHaveBeenCalledTimes(1);
  });

  it('חישוב אחד לכל שבוע ומעסיק, גם כשיש כמה משמרות חסרות באותו שבוע', () => {
    const weeks = weeksNeedingRecompute([
      calendarShift('a', '2026-10-19', '07:00', '16:00'),
      calendarShift('b', '2026-10-20', '07:00', '16:00'),
      calendarShift('c', '2026-10-27', '07:00', '16:00'),
      { ...calendarShift('d', '2026-11-03', '07:00', '16:00'), expected_amount: 450 },
    ]);
    expect(weeks.map(w => w.week)).toEqual(['2026-10-18', '2026-10-25']);
  });

  it('השבוע כולו מחושב מחדש: משמרת מהיומן משנה את ההמרה השבועית של משמרות קיימות', async () => {
    // 4 משמרות קיימות של 9 שעות שכבר חושבו, ואז נכנסת משמרת חמישי מהיומן.
    const days = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'];
    const existing = days.map((d, i) => ({ ...calendarShift(`e${i}`, d, '07:00', '16:30'), calendar_event_id: null, expected_amount: 487.5 }));
    const db = fakeDb([...existing, calendarShift('thu', '2026-10-22', '07:00', '16:30')]);
    const result = await readShifts(db);
    const thu = result.find(s => s.id === 'thu')!;
    expect(thu.expected_amount).toBeCloseTo(450 + 0.5 * 75 + 0.5 * (75 - 450 / 8.5), 2);
  });

  it('אין משמרות חסרות → לא קורא למעסיק ולא מחשב', async () => {
    const db = fakeDb([{ ...calendarShift('a', '2026-10-19', '07:00', '16:00'), expected_amount: 450 }]);
    await readShifts(db);
    expect(db.getEmployer).not.toHaveBeenCalled();
    expect(db.recompute).not.toHaveBeenCalled();
  });
});
