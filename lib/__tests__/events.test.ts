import { describe, expect, it } from 'vitest';
import { sanitizeProps } from '../events';
import { eventSchema } from '../validations';

describe('אירועי שימוש — בלי סכומים', () => {
  it('משאיר תוויות קצרות ובוליאנים', () => {
    expect(sanitizeProps({ kind: 'shift', manual: true })).toEqual({ kind: 'shift', manual: true });
  });

  it('מסנן מספרים, מפתחות של כסף וערכים עם ספרות', () => {
    expect(sanitizeProps({ amount: 'x', total: true, hours: 9, note: '352 שקלים', kind: 'work' })).toEqual({ kind: 'work' });
  });

  it('נתיב מסך מותר גם עם מקף', () => {
    expect(sanitizeProps({ screen: '/reports/hours' })).toEqual({ screen: '/reports/hours' });
  });

  it('נתיב עם מזהה מספרי לא נשלח', () => {
    expect(sanitizeProps({ screen: '/receipts/123' })).toEqual({ screen: '/receipts/123' });
    expect(sanitizeProps({ screen: 'receipt 2026-06-002' })).toBeNull();
  });

  it('ריק → null', () => {
    expect(sanitizeProps({ price: 'abc' })).toBeNull();
    expect(sanitizeProps(undefined)).toBeNull();
  });
});

describe('סכמת אירוע בשרת', () => {
  it('שם מהרשימה בלבד', () => {
    expect(eventSchema.safeParse({ name: 'screen_open', props: { screen: '/' } }).success).toBe(true);
    expect(eventSchema.safeParse({ name: 'something_else' }).success).toBe(false);
  });

  it('דוחה מספר בתוך props', () => {
    expect(eventSchema.safeParse({ name: 'entry_saved', props: { amount: 352 } }).success).toBe(false);
  });
});
