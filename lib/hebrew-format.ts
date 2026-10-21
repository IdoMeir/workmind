export function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export function formatHebrewMonth(month: number): string {
  return HEBREW_MONTHS[month - 1] ?? '';
}

export function formatHebrewMonthYear(month: number, year: number): string {
  return `${HEBREW_MONTHS[month - 1]} ${year}`;
}

export function formatHebrewDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getDateRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/** "יום ב׳, 20.10" */
export function formatDayAndDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `יום ${DAY_LETTERS[dow]}, ${d}.${m}`;
}

/** "19.10" */
export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d}.${m}`;
}

/** שעות בעשרוני, אחיד בכל האפליקציה: 8.5 → "8.5", 9 → "9", 8.25 → "8.25" */
export function formatHours(hours: number): string {
  return formatDecimal(hours, 2);
}

/** 8.6 → "8.6", 9 → "9" */
export function formatDecimal(n: number, digits = 2): string {
  return Number(n.toFixed(digits)).toLocaleString('he-IL', { maximumFractionDigits: digits });
}
