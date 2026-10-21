-- WorkMind v2 — מפרט סעיף 8: עמודות חדשות בהגדרות המשתמש
-- salary_annual_income נשאר לתאימות, ומוחלף בחישוב מ-wm_payslips ו-wm_shifts.
-- הטבלה כבר עם RLS ומדיניות own_wm_settings — לא משתנה כאן.
ALTER TABLE wm_user_settings
  ADD COLUMN IF NOT EXISTS tax_track TEXT NOT NULL DEFAULT 'zair',
  ADD COLUMN IF NOT EXISTS is_kibbutz_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_coordination_done_year INT NULL,
  ADD COLUMN IF NOT EXISTS form101_done BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ni_advances_updated_at DATE NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_user_settings_tax_track_check'
  ) THEN
    ALTER TABLE wm_user_settings
      ADD CONSTRAINT wm_user_settings_tax_track_check CHECK (tax_track IN ('zair', 'regular'));
  END IF;
END $$;
