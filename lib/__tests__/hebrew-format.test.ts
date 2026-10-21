import { describe, expect, it } from 'vitest';
import { formatHours } from '../hebrew-format';

describe('תצוגת שעות אחידה — עשרוני', () => {
  it('8.5 → "8.5", לא "8:30"', () => {
    expect(formatHours(8.5)).toBe('8.5');
    expect(formatHours(9)).toBe('9');
    expect(formatHours(8.25)).toBe('8.25');
    expect(formatHours(8.6)).not.toContain(':');
  });
});
