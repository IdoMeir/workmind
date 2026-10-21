-- WorkMind v2 — מפרט סעיפים 7, 8: תקבולים (אפשרות B — קבלה מתוכנה רשומה)
CREATE TABLE IF NOT EXISTS wm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES wm_clients(id) ON DELETE RESTRICT,
  received_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  method TEXT CHECK (method IN ('transfer', 'cash', 'check', 'bit', 'other')),
  external_receipt_no TEXT NULL,                     -- מספר הקבלה בתוכנה הרשומה
  receipt_id UUID NULL REFERENCES wm_receipts(id) ON DELETE SET NULL, -- קבלות ישנות מ-WorkMind
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wm_payments_user_date ON wm_payments(user_id, received_date DESC);
CREATE INDEX IF NOT EXISTS idx_wm_payments_client ON wm_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_wm_payments_receipt ON wm_payments(receipt_id) WHERE receipt_id IS NOT NULL;

ALTER TABLE wm_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'own_wm_payments' AND tablename = 'wm_payments'
  ) THEN
    CREATE POLICY "own_wm_payments" ON wm_payments FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- עבודה ← התקבול שמשלם עליה. NULL = "פתוח", מחכה לתקבול.
ALTER TABLE wm_work_entries
  ADD COLUMN IF NOT EXISTS payment_id UUID NULL REFERENCES wm_payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wm_entries_payment ON wm_work_entries(payment_id) WHERE payment_id IS NOT NULL;
