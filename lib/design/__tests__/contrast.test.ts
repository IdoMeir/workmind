import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseThemeColors } from '../contrast';

const css = readFileSync(join(__dirname, '../../../app/globals.css'), 'utf-8');
const colors = parseThemeColors(css);

// כל צבע שמותר לכתוב בו טקסט — חייב 4.5:1 (WCAG AA) מול שני הרקעים.
const TEXT_COLORS = ['text', 'text-mute', 'brass', 'steel', 'sage', 'alert'] as const;
const BACKGROUNDS = ['ink', 'ink-raised'] as const;

describe('טוקנים בסעיף 1 קיימים ב-globals.css', () => {
  it.each([...TEXT_COLORS, ...BACKGROUNDS, 'ink-track', 'rule', 'text-faint'])('--color-%s', name => {
    expect(colors[name]).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('ניגודיות טקסט ≥ 4.5:1', () => {
  for (const fg of TEXT_COLORS) {
    for (const bg of BACKGROUNDS) {
      it(`${fg} על ${bg}`, () => {
        expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('text-faint — אייקונים בלבד', () => {
  it('מתחת ל-4.5 על ink, ולכן אסור לטקסט', () => {
    expect(contrastRatio(colors['text-faint'], colors.ink)).toBeLessThan(4.5);
  });

  it('לפחות 2.8:1 על ink-raised, כפי שמופיע במפרט', () => {
    // WCAG 1.4.11 דורש 3:1 לרכיבים גרפיים. על ink-raised זה 2.8 — אייקון ב-text-faint
    // לא יכול לשאת משמעות לבד, וחייב תווית טקסט לידו.
    expect(contrastRatio(colors['text-faint'], colors['ink-raised'])).toBeGreaterThanOrEqual(2.8);
  });

  it('לא משמש לטקסט באף קומפוננטה', async () => {
    const { globSync } = await import('node:fs');
    const root = join(__dirname, '../../..');
    const files = globSync(['app/**/*.tsx', 'components/**/*.tsx'], { cwd: root });
    const offenders = files.filter(f => readFileSync(join(root, f), 'utf-8').includes('text-text-faint'));
    // שימוש מותר רק על אייקון (aria-hidden). כרגע אין שימוש בכלל; כשיתווסף — לבדוק ידנית.
    expect(offenders).toEqual([]);
  });
});
