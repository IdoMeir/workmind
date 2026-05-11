import Anthropic from '@anthropic-ai/sdk';
import type { ClientMonthlySummary } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

export interface MonthlyAnalysisInput {
  year: number;
  month: number;
  totalAmount: number;
  byClient: ClientMonthlySummary[];
  yearTotalSoFar: number;
  ceiling: number;
  previousMonthTotal?: number;
}

export async function generateMonthlyAnalysis(input: MonthlyAnalysisInput): Promise<string> {
  const monthName = [
    'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
    'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר',
  ][input.month - 1];

  const clientsText = input.byClient.map(c =>
    `- ${c.clientName}: ₪${c.total.toLocaleString()} (${c.totalHours} שעות, ${c.eventsCount} אירועים)`
  ).join('\n');

  const prompt = `אתה יועץ עסקי לפרילנסר עצמאי. נתח את החודש החולף וספק תובנות פרקטיות.

חודש: ${monthName} ${input.year}
סה"כ הכנסות החודש: ₪${input.totalAmount.toLocaleString()}
${input.previousMonthTotal !== undefined ? `סה"כ חודש קודם: ₪${input.previousMonthTotal.toLocaleString()}` : ''}

פירוט לפי לקוח:
${clientsText}

מצב שנתי:
- הכנסות שנתיות עד עכשיו: ₪${input.yearTotalSoFar.toLocaleString()}
- תקרת עוסק פטור 2026: ₪${input.ceiling.toLocaleString()}
- אחוז ניצול תקרה: ${((input.yearTotalSoFar / input.ceiling) * 100).toFixed(1)}%

ספק ניתוח ב-5 עד 7 שורות בעברית:
1. שורה אחת מסכמת את החודש (האם חזק/חלש בהשוואה לקודם)
2. מי הלקוח הכי רווחי, וכמה אחוז מההכנסות
3. ממוצע לשעה בפועל (אם רלוונטי)
4. מצב התקרה — האם יש סיכון לחריגה בקרוב, מה הקצב הצפוי לסוף שנה
5. 1-2 תובנות פרקטיות (לדוגמה: "ירדה הפעילות עם לקוח X, שווה לבדוק")

סגנון: ישיר, ענייני, ללא מילים מיותרות. בעברית בלבד. אל תוסיף disclaimer בסוף.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}

export async function suggestReceiptDescription(eventName: string): Promise<string> {
  const prompt = `הלקוח כתב לקבלה שם של אירוע: "${eventName}".
נסח עבורו שורה מקצועית אחת בעברית שתופיע כתיאור בקבלה. שורה אחת בלבד, ענייני, ללא הסברים נוספים.
דוגמאות לסגנון רצוי:
- "הפקת אירוע חתונה, 15.6.2026"
- "ניהול הפקה — אירוע חברה ספטמבר 2026"

החזר רק את השורה עצמה, ללא מרכאות וללא טקסט נוסף.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text.trim() : eventName;
}
