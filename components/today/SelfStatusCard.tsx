import Money from '@/components/shared/Money';
import { SELF_STATUS, classifySelfEmployed, type BusinessActivity } from '@/lib/tax';
import { formatDecimal } from '@/lib/hebrew-format';

const REASON: Record<string, string> = {
  hours: `בממוצע ${SELF_STATUS.hoursA} שעות בשבוע או יותר.`,
  income: 'ההכנסה החודשית הממוצעת עוברת את הסף, בלי תלות בשעות.',
  hours_and_income: `לפחות ${SELF_STATUS.hoursB} שעות בשבוע, וגם הכנסה מעל הסף.`,
  not_from_work: 'מתחת לספים — ב״ל רואה בזה "הכנסה שלא מעבודה".',
};

/** אינדיקטור "עצמאי לפי ב"ל" (מפרט סעיף 3, שלב 9). מסביר את עצמו בלחיצה. */
export default function SelfStatusCard({ activity }: { activity: BusinessActivity }) {
  const status = classifySelfEmployed(activity);

  return (
    <details className="wm-card">
      <summary className="list-none cursor-pointer px-4 py-3 min-h-14">
        <span className="block text-[15px]">
          עצמאי לפי ב״ל:{' '}
          <span className={status.isSelfEmployed ? 'text-sage font-semibold' : 'text-text-mute font-semibold'}>
            {status.isSelfEmployed ? 'כן' : 'לא'}
          </span>
        </span>
        <span className="block text-[13px] text-text-mute">
          <bdi className="wm-num">{formatDecimal(activity.avgWeeklyHours, 1)}</bdi> שעות בשבוע בממוצע · למה?
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-2 text-[13px] text-text-mute">
        <p className="text-[15px] text-text">{REASON[status.reason]}</p>
        <p>
          לפי 3 החודשים האחרונים בעסק: <bdi className="wm-num">{formatDecimal(activity.avgWeeklyHours, 1)}</bdi> שעות
          בשבוע, <Money amount={activity.avgMonthlyIncome} /> בחודש.
        </p>
        <p>
          השעות לפי העבודות שרשמת. ההכנסה לפי התשלומים שהתקבלו בפועל, לא לפי הסכומים המשוערים ליד העבודות.
        </p>
        <p>
          לאמת מול ב״ל אם בעסק זעיר הם בודקים את סף ההכנסה לפי 70% מהתשלומים (ההכנסה החייבת) ולא לפי המחזור המלא.
        </p>
        <ul className="list-disc ps-5 space-y-1">
          <li>{SELF_STATUS.hoursA} שעות בשבוע ומעלה — עצמאי.</li>
          <li>הכנסה של <Money amount={SELF_STATUS.incomeA} /> בחודש ומעלה — עצמאי.</li>
          <li>{SELF_STATUS.hoursB} שעות בשבוע וגם <Money amount={SELF_STATUS.incomeB} /> בחודש — עצמאי.</li>
        </ul>
        <p>עצמאי משלם ב״ל ומקדמות על הכנסת העסק. לא עצמאי — ההכנסה מדווחת אחרת. לאמת מול ב״ל.</p>
      </div>
    </details>
  );
}
