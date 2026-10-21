-- WorkMind v2 — מפרט סעיף 8: משמרות (שכיר)
-- hours_* מחושבים מחדש לכל השבוע בכל שמירה או מחיקה של משמרת (שעות נוספות שבועיות).
CREATE TABLE IF NOT EXISTS wm_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES wm_employers(id) ON DELETE RESTRICT,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INT NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  hours_regular NUMERIC NOT NULL DEFAULT 0,
  hours_125 NUMERIC NOT NULL DEFAULT 0,
  hours_150 NUMERIC NOT NULL DEFAULT 0,
  hours_rest NUMERIC NOT NULL DEFAULT 0,
  hours_rest_ot_1 NUMERIC NOT NULL DEFAULT 0,
  hours_rest_ot_2 NUMERIC NOT NULL DEFAULT 0,
  expected_amount NUMERIC,                           -- snapshot בזמן השמירה
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wm_shifts_user_date ON wm_shifts(user_id, shift_date DESC);
CREATE INDEX IF NOT EXISTS idx_wm_shifts_employer ON wm_shifts(employer_id);

ALTER TABLE wm_shifts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'own_wm_shifts' AND tablename = 'wm_shifts'
  ) THEN
    CREATE POLICY "own_wm_shifts" ON wm_shifts FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
