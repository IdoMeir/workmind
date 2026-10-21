import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// בדיקה סטטית של קבצי המיגרציה — הם מורצים מחוץ לסביבת הפיתוח.
const dir = join(__dirname, '../migrations');
const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const sql = Object.fromEntries(files.map(f => [f, readFileSync(join(dir, f), 'utf-8')]));
const all = Object.values(sql).join('\n');

const createdTables = [...all.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m => m[1]);

describe('מיגרציות', () => {
  it('שמות קבצים בפורמט YYYYMMDDHHMMSS_name.sql וללא כפילות גרסה', () => {
    const versions = files.map(f => f.match(/^(\d{14})_[a-z0-9_]+\.sql$/)?.[1]);
    expect(versions.every(Boolean)).toBe(true);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('כל הטבלאות של סעיף 8 נוצרות', () => {
    expect(createdTables.sort()).toEqual(['wm_employers', 'wm_events', 'wm_payments', 'wm_payslips', 'wm_shifts']);
  });

  it('כל טבלה בתחילית wm_', () => {
    expect(createdTables.every(t => t.startsWith('wm_'))).toBe(true);
  });

  it.each(createdTables)('%s — RLS מופעל ויש לה מדיניות', table => {
    expect(all).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    expect(all).toMatch(new RegExp(`CREATE POLICY "[^"]+" ON ${table} `));
  });

  it('כל המדיניות משתמשות ב-(SELECT auth.uid()) ולא ב-auth.uid() ישיר', () => {
    const policies = [...all.matchAll(/CREATE POLICY[\s\S]*?;/g)].map(m => m[0]);
    expect(policies.length).toBeGreaterThan(0);
    for (const p of policies) {
      expect(p.replace(/\(SELECT auth\.uid\(\)\)/g, '')).not.toContain('auth.uid()');
    }
  });

  it('עמודות חדשות בטבלאות קיימות', () => {
    expect(all).toMatch(/ALTER TABLE wm_receipts ADD COLUMN IF NOT EXISTS internal_note TEXT NULL/);
    expect(all).toMatch(/ALTER TABLE wm_work_entries\s+ADD COLUMN IF NOT EXISTS payment_id UUID NULL/);
    for (const col of ['tax_track', 'is_kibbutz_member', 'tax_coordination_done_year', 'form101_done', 'ni_advances_updated_at']) {
      expect(all).toContain(`ADD COLUMN IF NOT EXISTS ${col} `);
    }
  });

  it('אף מיגרציה לא מוחקת נתונים או טבלאות', () => {
    expect(all).not.toMatch(/\b(DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE)\b/i);
  });
});
