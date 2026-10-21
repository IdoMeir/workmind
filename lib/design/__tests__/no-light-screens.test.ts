import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// סוף שלב 10: אין מסך בהיר. כל המסכים על הטוקנים הכהים של סעיף 1.
const root = join(__dirname, '../../..');

async function sourceFiles(): Promise<string[]> {
  const { globSync } = await import('node:fs');
  return globSync(['app/**/*.tsx', 'components/**/*.tsx'], { cwd: root });
}

/** מחלקות Tailwind של פלטת ברירת המחדל — במקומן יש טוקנים (ink, brass, steel, sage, alert, text*). */
const PALETTE = /\b(?:bg|text|border|ring|divide|accent|from|to)-(?:white|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?(?:\/\d+)?\b/g;

describe('אין מסכים בהירים', () => {
  it('אין bg-white ואין text-gray באף קומפוננטה או מסך', async () => {
    const offenders = (await sourceFiles()).filter(f => /\bbg-white\b|\btext-gray-\d+/.test(readFileSync(join(root, f), 'utf-8')));
    expect(offenders).toEqual([]);
  });

  it('אין צבעי פלטה של Tailwind — רק טוקנים', async () => {
    const offenders: string[] = [];
    for (const f of await sourceFiles()) {
      for (const m of readFileSync(join(root, f), 'utf-8').matchAll(PALETTE)) offenders.push(`${f}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });
});
