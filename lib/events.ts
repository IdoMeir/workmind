// אירועי שימוש (מפרט סעיף 8, wm_events). לא נרשמים סכומים — רק שמות ותוויות קצרות.

export const EVENT_NAMES = ['screen_open', 'entry_saved', 'like_yesterday', 'how_calculated_open'] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export type EventProps = Record<string, string | boolean>;

/** מפתחות שאסור לשלוח, גם אם בטעות מגיעים כמחרוזת. */
const FORBIDDEN_KEYS = /amount|sum|total|gross|net|salary|price|rate|₪/i;
const MAX_VALUE_LENGTH = 60;
const MAX_KEYS = 5;

/**
 * מנקה props: רק מחרוזות קצרות ובוליאנים, בלי מספרים, בלי מפתחות של כסף,
 * ובלי ערכים שנראים כמו סכום. מחזיר null אם לא נשאר כלום.
 */
export function sanitizeProps(props: Record<string, unknown> | undefined): EventProps | null {
  if (!props) return null;
  const clean: EventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (Object.keys(clean).length >= MAX_KEYS) break;
    if (FORBIDDEN_KEYS.test(key)) continue;
    if (typeof value === 'boolean') clean[key] = value;
    else if (typeof value === 'string' && !/\d/.test(value.replace(/^\/[\w/-]*$/, ''))) {
      clean[key] = value.slice(0, MAX_VALUE_LENGTH);
    }
  }
  return Object.keys(clean).length ? clean : null;
}

/** שליחה ברקע. כישלון לא משפיע על הממשק. */
export function track(name: EventName, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, props: sanitizeProps(props) }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // שימוש בלבד — מתעלמים
  }
}
