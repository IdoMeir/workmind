// תקבולים (מפרט סעיף 7, אפשרות B): המחזור נספר לפי כסף שהתקבל בפועל.
import type { Payment, WorkEntry } from '@/types';

export const PAYMENT_METHODS = [
  { value: 'transfer', label: 'העברה' },
  { value: 'bit', label: 'ביט' },
  { value: 'cash', label: 'מזומן' },
  { value: 'check', label: 'צ׳ק' },
  { value: 'other', label: 'אחר' },
] as const;

export function methodLabel(method: Payment['method']): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.label ?? '';
}

const r2 = (n: number) => Math.round(n * 100) / 100;

type PaymentAmount = { received_date: string; amount: number | string };

/** מחזור שנתי = סכום התקבולים שהתקבלו באותה שנה. */
export function turnoverFromPayments(payments: PaymentAmount[], year: number): number {
  return r2(payments
    .filter(p => p.received_date.startsWith(`${year}-`))
    .reduce((s, p) => s + Number(p.amount), 0));
}

/** מחזור לפי חודש (אינדקס 0 = ינואר) בשנה נתונה. */
export function turnoverByMonth(payments: PaymentAmount[], year: number): number[] {
  const months = new Array<number>(12).fill(0);
  for (const p of payments) {
    if (!p.received_date.startsWith(`${year}-`)) continue;
    months[Number(p.received_date.slice(5, 7)) - 1] += Number(p.amount);
  }
  return months.map(r2);
}

/** עבודה "פתוחה": לא שולמה בתקבול ולא נכללה בקבלה ישנה. */
export function isOpenEntry(e: Pick<WorkEntry, 'payment_id' | 'receipt_id'>): boolean {
  return !e.payment_id && !e.receipt_id;
}
