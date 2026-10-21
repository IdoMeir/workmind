import { describe, expect, it } from 'vitest';
import { BASE_POINTS, SETTLEMENT_DEFAULT, buildTaxTasks, daysBetween, nextDeadlineTask, taxFreeIncomeLimit } from '../index';

const GAATON = { rate: SETTLEMENT_DEFAULT.rate, ceiling: SETTLEMENT_DEFAULT.ceiling };
const OPEN = { tax_coordination_done_year: null, form101_done: false, ni_advances_updated_at: null };

describe('תקרת הכנסה בלי מס', () => {
  it('זכר + געתון → 171,420 (מקרה 6.5 הראשון)', () => {
    expect(Math.abs(taxFreeIncomeLimit(BASE_POINTS.male, GAATON) - 171_420)).toBeLessThanOrEqual(1);
  });

  it('זכר בלי ישוב → 2.25 × 2,904 ÷ 10% = 65,340', () => {
    expect(Math.abs(taxFreeIncomeLimit(BASE_POINTS.male, null) - 65_340)).toBeLessThanOrEqual(1);
  });
});

describe('צ\'קליסט מועדים', () => {
  it('20.10.2026: תיאום מס בעוד 66 ימים, לא דחוף (כמו בסקיצה)', () => {
    const t = buildTaxTasks(2026, '2026-10-20', OPEN).find(x => x.id === 'tax_coordination')!;
    expect(t.due).toBe('2026-12-25');
    expect(t.daysLeft).toBe(66);
    expect(t.urgent).toBe(false);
  });

  it('15.12.2026: תיאום מס בעוד 10 ימים → דחוף', () => {
    const t = buildTaxTasks(2026, '2026-12-15', OPEN).find(x => x.id === 'tax_coordination')!;
    expect(t.urgent).toBe(true);
  });

  it('משימה שבוצעה לא דחופה ולא מופיעה בפס העליון', () => {
    const tasks = buildTaxTasks(2026, '2026-12-15', { ...OPEN, tax_coordination_done_year: 2026 });
    expect(tasks.find(x => x.id === 'tax_coordination')!.urgent).toBe(false);
    expect(nextDeadlineTask(tasks)?.id).toBe('vat_declaration');
  });

  it('תיאום מס של שנה קודמת לא נחשב בוצע', () => {
    const t = buildTaxTasks(2026, '2026-10-20', { ...OPEN, tax_coordination_done_year: 2025 });
    expect(t.find(x => x.id === 'tax_coordination')!.done).toBe(false);
  });

  it('מע"מ ועסק זעיר — מועדים בשנה שאחרי', () => {
    const tasks = buildTaxTasks(2026, '2026-10-20', OPEN);
    expect(tasks.find(x => x.id === 'vat_declaration')!.due).toBe('2027-01-31');
    expect(tasks.find(x => x.id === 'zair_report')!.due).toBe('2027-03-31');
  });

  it('מקדמות ב"ל: עדכון השנה = בוצע, עדכון בשנה קודמת = פתוח', () => {
    const done = buildTaxTasks(2026, '2026-10-20', { ...OPEN, ni_advances_updated_at: '2026-03-01' });
    const old = buildTaxTasks(2026, '2026-10-20', { ...OPEN, ni_advances_updated_at: '2025-03-01' });
    expect(done.find(x => x.id === 'ni_advances')!.done).toBe(true);
    expect(old.find(x => x.id === 'ni_advances')!.done).toBe(false);
  });

  it('הפס העליון: המשימה הפתוחה הקרובה', () => {
    expect(nextDeadlineTask(buildTaxTasks(2026, '2026-10-20', OPEN))?.id).toBe('tax_coordination');
  });

  it('ימים בין תאריכים חוצה שנה', () => {
    expect(daysBetween('2026-12-31', '2027-01-31')).toBe(31);
  });
});
