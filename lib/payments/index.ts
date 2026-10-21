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

/** סכום תקבולים (₪ שהתקבלו בפועל). */
export function sumPayments(payments: { amount: number | string }[]): number {
  return r2(payments.reduce((s, p) => s + Number(p.amount), 0));
}

/**
 * עבודה פתוחה — הסכום שרשום ליד העבודה הוא הערכה בלבד (התעריף משתנה).
 * מוצג בנפרד מההכנסה, שהיא התשלומים שהתקבלו.
 */
export function openWorkEstimate(entries: (Pick<WorkEntry, 'payment_id' | 'receipt_id'> & { amount: number | string })[]): number {
  return r2(entries.filter(isOpenEntry).reduce((s, e) => s + Number(e.amount), 0));
}

/**
 * תקבולים מאותו לקוח שכנראה כבר משלמים את תקופת הקבלה: התקבלו בחודש התקופה או בחודש שאחריו.
 * רישום הקבלה כתקבול נוסף יספור את הכסף פעמיים.
 */
export function paymentsCoveringReceipt<P extends Pick<Payment, 'client_id' | 'received_date' | 'receipt_id'>>(
  receipt: { id: string; client_id: string; period_year: number; period_month: number },
  payments: P[],
): P[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const from = `${receipt.period_year}-${pad(receipt.period_month)}-01`;
  const nextY = receipt.period_month === 12 ? receipt.period_year + 1 : receipt.period_year;
  const nextM = receipt.period_month === 12 ? 1 : receipt.period_month + 1;
  const to = `${nextY}-${pad(nextM)}-31`;
  return payments.filter(p =>
    p.client_id === receipt.client_id &&
    p.receipt_id !== receipt.id &&
    p.received_date >= from && p.received_date <= to);
}

/** שעות שקושרו לתקבול (רק רשומות שעות). */
export function linkedHours(entries: { entry_type: string; hours: number | string | null }[]): number {
  return r2(entries.reduce((s, e) => s + (e.entry_type === 'hours' ? Number(e.hours ?? 0) : 0), 0));
}

/** תעריף אפקטיבי = סכום התקבול ÷ השעות המקושרות. null כשאין שעות. */
export function effectiveHourlyRate(amount: number | string, hours: number): number | null {
  return hours > 0 ? r2(Number(amount) / hours) : null;
}
