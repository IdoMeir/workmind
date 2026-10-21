-- משמרות שמגיעות מהיומן (משימה מתוזמנת חיצונית). NULL = נרשמה באפליקציה או תוקנה בה.
-- הורץ ב-DB מבחוץ; הקובץ שומר על ההיסטוריה בריפו.
ALTER TABLE wm_shifts ADD COLUMN IF NOT EXISTS calendar_event_id TEXT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_wm_shifts_calendar_event ON wm_shifts(user_id, calendar_event_id) WHERE calendar_event_id IS NOT NULL;
