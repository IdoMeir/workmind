-- תעריף קבוע לשעה נוספת. NULL = חישוב לפי אחוזים (125%/150%).
-- הורץ ב-DB מבחוץ; הקובץ שומר על ההיסטוריה בריפו.
ALTER TABLE wm_employers ADD COLUMN IF NOT EXISTS ot_flat_rate NUMERIC NULL CHECK (ot_flat_rate IS NULL OR ot_flat_rate > 0);
