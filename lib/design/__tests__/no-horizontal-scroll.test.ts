import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// אסור שאלמנט יחרוג מרוחב הדף (scrollWidth > clientWidth). ב-RTL, אלמנט שמוזז שמאלה מחוץ למסך
// (left:-9999px) גולל את כל הדף שמאלה והמסך נראה ריק — כך קרה בדוח השעות.
const root = join(__dirname, '../../..');

async function sourceFiles(): Promise<string[]> {
  const { globSync } = await import('node:fs');
  return globSync(['app/**/*.tsx', 'components/**/*.tsx', 'app/**/*.css'], { cwd: root });
}

/** הזזה גדולה מחוץ למסך: left/right/inset שלילי בסגנון inline או במחלקות Tailwind. */
const OFFSCREEN = [
  /\b(?:left|right|insetInlineStart|insetInlineEnd|marginLeft|marginRight)\s*:\s*['"]?-\d{3,}/,
  /(?:^|[\s"'`])-(?:left|right|start|end|inset-x|ms|me|ml|mr)-\[\d{3,}px\]/,
  /\b(?:left|right)\s*:\s*-\d{3,}px/,
];

describe('אין גלילה אופקית', () => {
  it('אין אלמנטים שמוזזים מחוץ למסך לרוחב', async () => {
    const offenders: string[] = [];
    for (const f of await sourceFiles()) {
      readFileSync(join(root, f), 'utf-8').split('\n').forEach((line, i) => {
        if (/^\s*(?:\/\/|\*|\{\/\*)/.test(line)) return; // הערות
        if (OFFSCREEN.some(re => re.test(line))) offenders.push(`${f}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('דוח השעות: ה-div ל-PDF בתוך מיכל fixed בגודל 0 עם overflow מוסתר', () => {
    const src = readFileSync(join(root, 'components/reports/HoursReportView.tsx'), 'utf-8');
    expect(src).toMatch(/position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden'/);
  });
});
