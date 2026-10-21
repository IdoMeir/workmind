-- WorkMind v2 — שלב 0 (מפרט סעיפים 7, 8)
-- הערה פנימית לקבלות. לא מודפסת על הקבלה ולא משנה את תוכנה.
ALTER TABLE wm_receipts ADD COLUMN IF NOT EXISTS internal_note TEXT NULL;

-- קבלה 2026-06-002 כוללת רשומות שכבר נכללו בקבלה 2026-05-001 (באג הקבלה הכפולה).
-- קבלה שהוצאה היא מסמך: לא מוחקים ולא משנים אף שדה אחר — רק internal_note.
-- המיגרציה נכשלת (ומתגלגלת אחורה) אם לא נמצאה בדיוק קבלה אחת.
DO $$
DECLARE
  matched INT;
BEGIN
  UPDATE wm_receipts
     SET internal_note = 'כוללת 2,630 ₪ שכבר הופיעו בקבלה 2026-05-001. לא למחוק, לבדוק עם רו״ח'
   WHERE receipt_number = '2026-06-002'
     AND internal_note IS NULL;
  GET DIAGNOSTICS matched = ROW_COUNT;

  IF matched <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 receipt 2026-06-002 without internal_note, found %', matched;
  END IF;
END $$;
