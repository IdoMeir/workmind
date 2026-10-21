// צ'קליסט "מה לעשות ומתי" (מפרט סעיף 6). פונקציות טהורות.
import { DEADLINE_ALERT_DAYS, TAX_DEADLINES } from './constants-2026';

export type TaxTaskId = 'tax_coordination' | 'form101' | 'ni_advances' | 'vat_declaration' | 'zair_report';

export interface TaxTaskState {
  tax_coordination_done_year: number | null;
  form101_done: boolean;
  ni_advances_updated_at: string | null;
}

export interface TaxTask {
  id: TaxTaskId;
  title: string;
  detail: string;
  /** YYYY-MM-DD או null למשימה בלי מועד קבוע. */
  due: string | null;
  done: boolean;
  /** אפשר לסמן במסך (נשמר ב-DB). */
  checkable: boolean;
  daysLeft: number | null;
  /** פתוחה ובתוך 14 יום (או שעבר המועד). */
  urgent: boolean;
}

function dueDate(year: number, d: { date: string; nextYear: boolean }): string {
  return `${d.nextYear ? year + 1 : year}-${d.date}`;
}

export function daysBetween(from: string, to: string): number {
  const ms = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000);
}

export function buildTaxTasks(year: number, today: string, state: TaxTaskState): TaxTask[] {
  const raw: Omit<TaxTask, 'daysLeft' | 'urgent'>[] = [
    {
      id: 'tax_coordination',
      title: `תיאום מס ${year}`,
      detail: 'כדי שהמעסיק ינכה מס נכון כשיש גם עסק, נקודות זיכוי וישוב מוטב.',
      due: dueDate(year, TAX_DEADLINES.taxCoordination),
      done: state.tax_coordination_done_year === year,
      checkable: true,
    },
    {
      id: 'form101',
      title: 'טופס 101 + אישור תושב',
      detail: 'למעסיק, בתחילת עבודה ובכל שנה, עם אישור תושב מהרשות המקומית.',
      due: null,
      done: state.form101_done,
      checkable: true,
    },
    {
      id: 'ni_advances',
      title: 'עדכון מקדמות ב"ל (טופס 672)',
      detail: 'כשההכנסה מהעסק משתנה, כדי שהמקדמות יתאימו להכנסה הצפויה.',
      due: null,
      done: !!state.ni_advances_updated_at && state.ni_advances_updated_at.startsWith(`${year}-`),
      checkable: true,
    },
    {
      id: 'vat_declaration',
      title: 'הצהרת מחזור מע"מ',
      detail: `דיווח שנתי על המחזור של ${year}.`,
      due: dueDate(year, TAX_DEADLINES.vatTurnoverDeclaration),
      done: false,
      checkable: false,
    },
    {
      id: 'zair_report',
      title: 'דיווח עסק זעיר',
      detail: `הדוח השנתי למס הכנסה על ${year}.`,
      due: dueDate(year, TAX_DEADLINES.zairAnnualReport),
      done: false,
      checkable: false,
    },
  ];

  return raw.map(t => {
    const daysLeft = t.due ? daysBetween(today, t.due) : null;
    return { ...t, daysLeft, urgent: !t.done && daysLeft !== null && daysLeft <= DEADLINE_ALERT_DAYS };
  });
}

/** המשימה הפתוחה עם המועד הקרוב ביותר — לפס העליון במסך "היום". */
export function nextDeadlineTask(tasks: TaxTask[]): TaxTask | null {
  return tasks
    .filter(t => !t.done && t.due !== null)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0] ?? null;
}
