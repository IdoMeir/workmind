-- WorkMind v2 — מפרט סעיף 8: תלושי שכר
-- file_path מצביע ל-Supabase Storage, bucket פרטי (ייווצר בשלב 6).
CREATE TABLE IF NOT EXISTS wm_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES wm_employers(id) ON DELETE RESTRICT,
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  gross NUMERIC NOT NULL CHECK (gross >= 0),
  net NUMERIC NULL,
  income_tax NUMERIC NULL,
  ni_health NUMERIC NULL,
  pension_employee NUMERIC NULL,
  file_path TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, employer_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_wm_payslips_employer ON wm_payslips(employer_id);

ALTER TABLE wm_payslips ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'own_wm_payslips' AND tablename = 'wm_payslips'
  ) THEN
    CREATE POLICY "own_wm_payslips" ON wm_payslips FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
