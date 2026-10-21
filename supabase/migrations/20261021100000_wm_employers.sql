-- WorkMind v2 — מפרט סעיף 8: מעסיקים (שכיר)
CREATE TABLE IF NOT EXISTS wm_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deduction_file TEXT NULL,                          -- תיק ניכויים, לתיאום מס
  start_date DATE,
  end_date DATE NULL,
  pay_type TEXT NOT NULL DEFAULT 'daily' CHECK (pay_type IN ('hourly', 'daily', 'monthly')),
  hourly_rate NUMERIC NULL,
  daily_rate NUMERIC NULL,
  monthly_salary NUMERIC NULL,
  standard_day_hours NUMERIC NOT NULL DEFAULT 8.6,   -- יום מלא, נטו
  short_day_paid_full BOOLEAN NOT NULL DEFAULT false, -- יום קצר משולם כיום מלא?
  workweek_days INT NOT NULL DEFAULT 5 CHECK (workweek_days IN (5, 6)),
  short_day INT NULL CHECK (short_day BETWEEN 0 AND 6), -- 0=ראשון … 6=שבת
  break_minutes INT NOT NULL DEFAULT 30 CHECK (break_minutes >= 0),
  break_paid BOOLEAN NOT NULL DEFAULT false,
  ot_daily_threshold NUMERIC NOT NULL DEFAULT 8.6,
  ot_short_day_threshold NUMERIC NOT NULL DEFAULT 7.6,
  ot_weekly_threshold NUMERIC NOT NULL DEFAULT 42,
  travel_per_day NUMERIC NULL,
  has_existing_pension BOOLEAN NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_wm_employers_user ON wm_employers(user_id);

ALTER TABLE wm_employers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'own_wm_employers' AND tablename = 'wm_employers'
  ) THEN
    CREATE POLICY "own_wm_employers" ON wm_employers FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
