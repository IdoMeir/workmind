-- WorkMind v2 — מפרט סעיף 8: אירועי שימוש
-- נרשם: פתיחת מסך, שמירת רשומה, "כמו אתמול", פתיחת "איך זה מחושב". לא נרשמים סכומים.
-- רק הוספה וקריאה. אין עדכון ואין מחיקה דרך ה-API.
CREATE TABLE IF NOT EXISTS wm_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  props JSONB NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wm_events_user_at ON wm_events(user_id, at DESC);

ALTER TABLE wm_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'own_wm_events_insert' AND tablename = 'wm_events'
  ) THEN
    CREATE POLICY "own_wm_events_insert" ON wm_events FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'own_wm_events_select' AND tablename = 'wm_events'
  ) THEN
    CREATE POLICY "own_wm_events_select" ON wm_events FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
