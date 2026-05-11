\# WorkMind — אפליקציה אישית לפרילנסר ישראלי



\## סקירה כללית



WorkMind היא אפליקציה אישית (single-user) לפרילנסר בתחום הפקות אירועים, המנהלת:

\- \*\*לקוחות\*\* עם תעריפים שעתיים ותעריפי אירוע

\- \*\*רישום עבודה\*\* (שעות ואירועים)

\- \*\*הפקת קבלות\*\* בעברית במבנה תקני לעוסק פטור

\- \*\*מחשבון מס\*\* עם תמיכה במדרגות 2026, נקודות זיכוי, זיכוי ישוב מוטב (געתון) וביטוח לאומי לעצמאי

\- \*\*תובנות AI\*\* חודשיות



UI עברית מלאה, RTL, mobile-first PWA. נפרדת מ-StudyMind ו-InvestMind ברמת ה-repo וב-Vercel project.



\*\*⚠️ Disclaimer:\*\* WorkMind היא כלי עזר אישי בלבד. החישובים הם הערכה. כל החלטה מיסויית בפועל מצריכה ייעוץ של רואה חשבון.



\### Supabase Setup



WorkMind משתמשת בפרויקט Supabase הקיים של StudyMind (`euoomvrjyximybvnquck`) עם prefix `wm\_` לכל הטבלאות. אין צורך בפרויקט Supabase חדש.



\*\*ביצוע ה-SQL:\*\* Claude Code יריץ את ה-migrations ישירות דרך Supabase MCP. ה-SQL כתוב בסעיף Database Schema אך לא נדרשים migration files נפרדים — MCP מבצע את ה-DDL ב-DB ישירות.



\---



\## Tech Stack



| שכבה | כלי | הערות |

|---|---|---|

| Framework | Next.js 15 App Router, TypeScript | strict mode |

| UI | Tailwind CSS + shadcn/ui | RTL via `dir="rtl"` on html |

| Charts | Recharts | SSR-safe |

| DB + Auth | Supabase (פרויקט StudyMind, prefix `wm\_`) | אותו project ref |

| AI | Claude API (`claude-sonnet-4-20250514`) | אותו API key |

| PDF/Print | window.print + CSS @media print | ללא ספריה חיצונית |

| Deploy | Vercel Hobby | אין cron בגרסה ראשונה |



\---



\## Environment Variables (.env.local)



```

NEXT\_PUBLIC\_SUPABASE\_URL=

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=

SUPABASE\_SERVICE\_ROLE\_KEY=

ANTHROPIC\_API\_KEY=

```



כל המפתחות זהים ל-StudyMind/InvestMind. גם ב-Vercel Dashboard → Settings → Environment Variables.



\---



\## Critical Domain Notes — נתוני מס 2026



כל המספרים והשיעורים אומתו מול מקורות רשמיים (רשות המסים, ביטוח לאומי, ק"ת תשפ"ו 830) \*\*לפני התחלת הפיתוח\*\*. כל ה-constants כתובים ב-`/lib/tax-calculator.ts`.



\### עוסק פטור

\- \*\*תקרת מחזור שנתית 2026: 122,833 ₪\*\*

\- אסור להוציא חשבונית מס. רק \*\*קבלה\*\*.

\- פטור מגביית מע"מ.

\- דיווח שנתי בלבד למע"מ עד 31.01 על המחזור של השנה שחלפה.



\### מדרגות מס הכנסה 2026 (מיגיעה אישית, שנתי)



| מ-(₪) | עד (₪) | שיעור |

|---|---|---|

| 0 | 84,120 | 10% |

| 84,121 | 120,720 | 14% |

| 120,721 | \*\*228,000\*\* | 20% |

| 228,001 | \*\*301,200\*\* | 31% |

| 301,201 | 628,560 | 35% |

| 628,561 | 721,560 | 47% |

| 721,561+ | — | 50% (כולל מס יסף 3%) |



\*\*שינוי 2026:\*\* ריווח מדרגת 20% (הוארכה עד 228,000 ₪ שנתי) ומדרגת 31% (החל מ-228,001 עד 301,200 ₪). אסור להשתמש במדרגות 2025.



\### נקודות זיכוי 2026

\- \*\*שווי נקודה שנתי: 2,904 ₪\*\* (₪242 לחודש)

\- זכר תושב ישראל: \*\*2.25 נקודות\*\*

\- אישה תושבת ישראל: \*\*2.75 נקודות\*\* (2.25 + 0.5 לאישה)

\- חייל משוחרר (36 חודשים אחרי שחרור): +0.5 או +1 לפי משך שירות

\- תואר ראשון: +1 נקודה לתקופה שווה למספר שנות הלימוד עד 3 שנים מקסימום

\- ילד בן 1–5: ראה דוגמאות (לא נדרש לגרסה ראשונה — אופציונלי בהגדרות)



\### ביטוח לאומי לעצמאי 2026



⚠️ \*\*השיעורים שונים ממה שהיה ב-prompt המקורי\*\* — מאומת מול אתר ביטוח לאומי הרשמי וכל-זכות.



\- 60% מהשכר הממוצע = \*\*7,703 ₪/חודש\*\* = \*\*92,436 ₪/שנה\*\* (מדרגה ראשונה)

\- ההכנסה המירבית החייבת = \*\*51,910 ₪/חודש\*\* = \*\*622,920 ₪/שנה\*\*

\- הכנסה מזערית = \*\*2,065 ₪/חודש\*\* = \*\*24,780 ₪/שנה\*\*



\*\*שיעורי תשלום (כולל בריאות):\*\*

\- מדרגה ראשונה (עד 92,436 ₪ שנתי): \*\*7.7%\*\* (4.47% ביטוח לאומי + 3.23% בריאות)

\- מדרגה שנייה (92,437–622,920 ₪ שנתי): \*\*18%\*\* (12.83% ביטוח לאומי + 5.17% בריאות)

\- מעל 622,920 ₪ שנתי: אין חיוב על החלק שמעל



\### ישוב מוטב — געתון (קוד יישוב 57.0)



\*\*מקור רשמי:\*\* הודעת מס הכנסה (רשימת יישובים מוטבים לשנת 2026), ק"ת תשפ"ו 830, 11.01.2026.



\- \*\*שיעור זיכוי: 10%\*\*

\- \*\*תקרת הכנסה שנתית מזכה: 180,000 ₪\*\*

\- חישוב: `creditAmount = min(annualIncomeFromPersonalWork, 180000) \* 0.10`

\- מופחת ממס ההכנסה החייב \*\*אחרי\*\* נקודות הזיכוי

\- חל \*\*רק\*\* על הכנסה מיגיעה אישית (עסק + שכר)

\- הזיכוי לא יכול להעלות את ההחזר מעל המס שחושב (לא ניתן לקבל "החזר על אפס")



\---



\## Database Schema (prefix `wm\_`)



הביצוע מתבצע דרך Supabase MCP. הרץ block אחד אחרי השני, לבדוק שעבד, ואז להמשיך לבא.



\### wm\_user\_settings — הגדרות משתמש



```sql

CREATE TABLE wm\_user\_settings (

&#x20; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20; user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

&#x20; full\_name TEXT NOT NULL,

&#x20; business\_name TEXT,

&#x20; tax\_id TEXT,

&#x20; address TEXT,

&#x20; phone TEXT,

&#x20; email TEXT,

&#x20; gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',

&#x20; -- נקודות זיכוי נוספות

&#x20; extra\_credit\_points DECIMAL(4,2) DEFAULT 0,

&#x20; -- ישוב מוטב

&#x20; settlement\_name TEXT,

&#x20; settlement\_credit\_rate DECIMAL(5,4) DEFAULT 0.10,

&#x20; settlement\_ceiling DECIMAL(12,2) DEFAULT 180000,

&#x20; -- הכנסה ממקורות נוספים (שכיר)

&#x20; salary\_annual\_income DECIMAL(12,2) DEFAULT 0,

&#x20; -- מספור קבלות

&#x20; receipt\_counter\_current\_year INT DEFAULT 0,

&#x20; receipt\_counter\_year INT DEFAULT 2026,

&#x20; created\_at TIMESTAMPTZ DEFAULT now(),

&#x20; updated\_at TIMESTAMPTZ DEFAULT now(),

&#x20; UNIQUE(user\_id)

);



CREATE INDEX idx\_wm\_user\_settings\_user ON wm\_user\_settings(user\_id);



ALTER TABLE wm\_user\_settings ENABLE ROW LEVEL SECURITY;



DO $$ BEGIN

&#x20; IF NOT EXISTS (

&#x20;   SELECT 1 FROM pg\_policies

&#x20;   WHERE policyname = 'own\_wm\_settings' AND tablename = 'wm\_user\_settings'

&#x20; ) THEN

&#x20;   CREATE POLICY "own\_wm\_settings" ON wm\_user\_settings FOR ALL

&#x20;     USING (auth.uid() = user\_id) WITH CHECK (auth.uid() = user\_id);

&#x20; END IF;

END $$;

```



\### wm\_clients — לקוחות



```sql

CREATE TABLE wm\_clients (

&#x20; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20; user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

&#x20; name TEXT NOT NULL,

&#x20; description TEXT,

&#x20; hourly\_rate DECIMAL(8,2),

&#x20; event\_rate DECIMAL(10,2),

&#x20; contact\_info TEXT,

&#x20; is\_active BOOLEAN DEFAULT true,

&#x20; created\_at TIMESTAMPTZ DEFAULT now(),

&#x20; updated\_at TIMESTAMPTZ DEFAULT now()

);



CREATE INDEX idx\_wm\_clients\_user ON wm\_clients(user\_id);

CREATE INDEX idx\_wm\_clients\_active ON wm\_clients(user\_id) WHERE is\_active = true;



ALTER TABLE wm\_clients ENABLE ROW LEVEL SECURITY;



DO $$ BEGIN

&#x20; IF NOT EXISTS (

&#x20;   SELECT 1 FROM pg\_policies

&#x20;   WHERE policyname = 'own\_wm\_clients' AND tablename = 'wm\_clients'

&#x20; ) THEN

&#x20;   CREATE POLICY "own\_wm\_clients" ON wm\_clients FOR ALL

&#x20;     USING (auth.uid() = user\_id) WITH CHECK (auth.uid() = user\_id);

&#x20; END IF;

END $$;

```



\### wm\_work\_entries — רשומות עבודה



```sql

CREATE TABLE wm\_work\_entries (

&#x20; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20; user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

&#x20; client\_id UUID REFERENCES wm\_clients(id) ON DELETE RESTRICT NOT NULL,

&#x20; entry\_type TEXT NOT NULL CHECK (entry\_type IN ('hours', 'event')),

&#x20; entry\_date DATE NOT NULL,

&#x20; -- עבור hours:

&#x20; hours DECIMAL(6,2),

&#x20; -- עבור event:

&#x20; event\_name TEXT,

&#x20; -- סכום מחושב (snapshot של החישוב בעת היצירה):

&#x20; amount DECIMAL(10,2) NOT NULL,

&#x20; description TEXT,

&#x20; receipt\_id UUID, -- nullable, ימולא כשהרשומה תכלל בקבלה

&#x20; created\_at TIMESTAMPTZ DEFAULT now(),

&#x20; updated\_at TIMESTAMPTZ DEFAULT now(),

&#x20; CHECK (

&#x20;   (entry\_type = 'hours' AND hours IS NOT NULL AND hours > 0) OR

&#x20;   (entry\_type = 'event' AND event\_name IS NOT NULL)

&#x20; )

);



CREATE INDEX idx\_wm\_entries\_user ON wm\_work\_entries(user\_id);

CREATE INDEX idx\_wm\_entries\_date ON wm\_work\_entries(user\_id, entry\_date DESC);

CREATE INDEX idx\_wm\_entries\_client ON wm\_work\_entries(client\_id);

CREATE INDEX idx\_wm\_entries\_receipt ON wm\_work\_entries(receipt\_id) WHERE receipt\_id IS NOT NULL;

CREATE INDEX idx\_wm\_entries\_month ON wm\_work\_entries(user\_id, date\_trunc('month', entry\_date));



ALTER TABLE wm\_work\_entries ENABLE ROW LEVEL SECURITY;



DO $$ BEGIN

&#x20; IF NOT EXISTS (

&#x20;   SELECT 1 FROM pg\_policies

&#x20;   WHERE policyname = 'own\_wm\_entries' AND tablename = 'wm\_work\_entries'

&#x20; ) THEN

&#x20;   CREATE POLICY "own\_wm\_entries" ON wm\_work\_entries FOR ALL

&#x20;     USING (auth.uid() = user\_id) WITH CHECK (auth.uid() = user\_id);

&#x20; END IF;

END $$;

```



\### wm\_receipts — קבלות שהופקו



```sql

CREATE TABLE wm\_receipts (

&#x20; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20; user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

&#x20; client\_id UUID REFERENCES wm\_clients(id) ON DELETE RESTRICT NOT NULL,

&#x20; receipt\_number TEXT NOT NULL, -- format: 'YYYY-MM-NNN'

&#x20; issue\_date DATE NOT NULL DEFAULT CURRENT\_DATE,

&#x20; period\_year INT NOT NULL,

&#x20; period\_month INT NOT NULL CHECK (period\_month BETWEEN 1 AND 12),

&#x20; total\_amount DECIMAL(12,2) NOT NULL,

&#x20; -- snapshot של פרטים נדרשים, למניעת שינוי בדיעבד:

&#x20; client\_snapshot JSONB NOT NULL, -- {name, contact\_info, ...}

&#x20; user\_snapshot JSONB NOT NULL,   -- {full\_name, business\_name, tax\_id, address}

&#x20; line\_items JSONB NOT NULL,      -- \[{description, quantity, unit\_price, total}]

&#x20; notes TEXT,

&#x20; created\_at TIMESTAMPTZ DEFAULT now(),

&#x20; UNIQUE(user\_id, receipt\_number)

);



CREATE INDEX idx\_wm\_receipts\_user ON wm\_receipts(user\_id);

CREATE INDEX idx\_wm\_receipts\_client ON wm\_receipts(client\_id);

CREATE INDEX idx\_wm\_receipts\_period ON wm\_receipts(user\_id, period\_year, period\_month);



ALTER TABLE wm\_receipts ENABLE ROW LEVEL SECURITY;



DO $$ BEGIN

&#x20; IF NOT EXISTS (

&#x20;   SELECT 1 FROM pg\_policies

&#x20;   WHERE policyname = 'own\_wm\_receipts' AND tablename = 'wm\_receipts'

&#x20; ) THEN

&#x20;   CREATE POLICY "own\_wm\_receipts" ON wm\_receipts FOR ALL

&#x20;     USING (auth.uid() = user\_id) WITH CHECK (auth.uid() = user\_id);

&#x20; END IF;

END $$;

```



\### wm\_monthly\_insights — ניתוחי AI חודשיים (cache)



```sql

CREATE TABLE wm\_monthly\_insights (

&#x20; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20; user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

&#x20; period\_year INT NOT NULL,

&#x20; period\_month INT NOT NULL CHECK (period\_month BETWEEN 1 AND 12),

&#x20; content TEXT NOT NULL,

&#x20; metrics\_snapshot JSONB,

&#x20; created\_at TIMESTAMPTZ DEFAULT now(),

&#x20; UNIQUE(user\_id, period\_year, period\_month)

);



CREATE INDEX idx\_wm\_insights\_user ON wm\_monthly\_insights(user\_id, period\_year, period\_month);



ALTER TABLE wm\_monthly\_insights ENABLE ROW LEVEL SECURITY;



DO $$ BEGIN

&#x20; IF NOT EXISTS (

&#x20;   SELECT 1 FROM pg\_policies

&#x20;   WHERE policyname = 'own\_wm\_insights' AND tablename = 'wm\_monthly\_insights'

&#x20; ) THEN

&#x20;   CREATE POLICY "own\_wm\_insights" ON wm\_monthly\_insights FOR ALL

&#x20;     USING (auth.uid() = user\_id) WITH CHECK (auth.uid() = user\_id);

&#x20; END IF;

END $$;

```



\---



\## TypeScript Types (`/types/index.ts`)



```typescript

export interface UserSettings {

&#x20; id: string;

&#x20; user\_id: string;

&#x20; full\_name: string;

&#x20; business\_name: string | null;

&#x20; tax\_id: string | null;

&#x20; address: string | null;

&#x20; phone: string | null;

&#x20; email: string | null;

&#x20; gender: 'male' | 'female';

&#x20; extra\_credit\_points: number;

&#x20; settlement\_name: string | null;

&#x20; settlement\_credit\_rate: number;

&#x20; settlement\_ceiling: number;

&#x20; salary\_annual\_income: number;

&#x20; receipt\_counter\_current\_year: number;

&#x20; receipt\_counter\_year: number;

&#x20; created\_at: string;

&#x20; updated\_at: string;

}



export interface Client {

&#x20; id: string;

&#x20; user\_id: string;

&#x20; name: string;

&#x20; description: string | null;

&#x20; hourly\_rate: number | null;

&#x20; event\_rate: number | null;

&#x20; contact\_info: string | null;

&#x20; is\_active: boolean;

&#x20; created\_at: string;

&#x20; updated\_at: string;

}



export type WorkEntryType = 'hours' | 'event';



export interface WorkEntry {

&#x20; id: string;

&#x20; user\_id: string;

&#x20; client\_id: string;

&#x20; entry\_type: WorkEntryType;

&#x20; entry\_date: string;

&#x20; hours: number | null;

&#x20; event\_name: string | null;

&#x20; amount: number;

&#x20; description: string | null;

&#x20; receipt\_id: string | null;

&#x20; created\_at: string;

&#x20; updated\_at: string;

&#x20; // populated by join:

&#x20; client?: Client;

}



export interface ReceiptLineItem {

&#x20; description: string;

&#x20; quantity: number;

&#x20; unit\_price: number;

&#x20; total: number;

}



export interface ClientSnapshot {

&#x20; name: string;

&#x20; contact\_info: string | null;

}



export interface UserSnapshot {

&#x20; full\_name: string;

&#x20; business\_name: string | null;

&#x20; tax\_id: string | null;

&#x20; address: string | null;

}



export interface Receipt {

&#x20; id: string;

&#x20; user\_id: string;

&#x20; client\_id: string;

&#x20; receipt\_number: string;

&#x20; issue\_date: string;

&#x20; period\_year: number;

&#x20; period\_month: number;

&#x20; total\_amount: number;

&#x20; client\_snapshot: ClientSnapshot;

&#x20; user\_snapshot: UserSnapshot;

&#x20; line\_items: ReceiptLineItem\[];

&#x20; notes: string | null;

&#x20; created\_at: string;

}



export interface MonthlyInsight {

&#x20; id: string;

&#x20; user\_id: string;

&#x20; period\_year: number;

&#x20; period\_month: number;

&#x20; content: string;

&#x20; metrics\_snapshot: Record<string, unknown> | null;

&#x20; created\_at: string;

}



// Tax calculator types

export interface TaxBracket {

&#x20; min: number;

&#x20; max: number | null;

&#x20; rate: number;

}



export interface TaxBreakdownLine {

&#x20; bracketMin: number;

&#x20; bracketMax: number;

&#x20; rate: number;

&#x20; taxableAmount: number;

&#x20; tax: number;

}



export interface IncomeTaxResult {

&#x20; grossTax: number;

&#x20; breakdown: TaxBreakdownLine\[];

}



export interface NIBreakdown {

&#x20; reducedRateAmount: number;     // הכנסה במדרגה ראשונה

&#x20; reducedRateTax: number;

&#x20; fullRateAmount: number;         // הכנסה במדרגה שנייה

&#x20; fullRateTax: number;

&#x20; total: number;

}



export interface TaxCalculationParams {

&#x20; businessIncome: number;

&#x20; salaryIncome: number;

&#x20; creditPoints: number;

&#x20; settlementCreditRate: number;

&#x20; settlementCeiling: number;

}



export interface TaxSummary {

&#x20; // Inputs

&#x20; businessIncome: number;

&#x20; salaryIncome: number;

&#x20; totalIncome: number;

&#x20; creditPoints: number;



&#x20; // Income tax calculation

&#x20; grossIncomeTax: number;

&#x20; incomeTaxBreakdown: TaxBreakdownLine\[];

&#x20; creditPointsValue: number;

&#x20; settlementCredit: number;

&#x20; netIncomeTax: number; // לאחר זיכויים, מינימום 0



&#x20; // National insurance (only on business income)

&#x20; nationalInsurance: NIBreakdown;



&#x20; // Total

&#x20; totalAnnualTax: number; // netIncomeTax + nationalInsurance.total



&#x20; // Metadata

&#x20; taxYear: number;

&#x20; calculatedAt: string;

}



// Dashboard types

export interface MonthlySummary {

&#x20; year: number;

&#x20; month: number;

&#x20; totalAmount: number;

&#x20; byClient: ClientMonthlySummary\[];

&#x20; entriesCount: number;

}



export interface ClientMonthlySummary {

&#x20; clientId: string;

&#x20; clientName: string;

&#x20; totalHours: number;

&#x20; hoursAmount: number;

&#x20; eventsCount: number;

&#x20; eventsAmount: number;

&#x20; total: number;

&#x20; entries: WorkEntry\[];

}



export interface YearProgress {

&#x20; yearTotal: number;

&#x20; ceiling: number; // 122833 for 2026

&#x20; percentage: number;

&#x20; remaining: number;

&#x20; isExceeded: boolean;

}

```



\---



\## Project Structure



```

/app

&#x20; layout.tsx                       -- RTL, Hebrew font (Heebo), Supabase provider

&#x20; manifest.ts                      -- PWA manifest

&#x20; /(auth)

&#x20;   /login/page.tsx

&#x20;   /register/page.tsx

&#x20; /(app)

&#x20;   layout.tsx                     -- App shell with BottomNav

&#x20;   page.tsx                       -- דשבורד

&#x20;   /entries

&#x20;     page.tsx                     -- כל הרשומות (חיפוש, סינון, עריכה)

&#x20;   /clients

&#x20;     page.tsx                     -- ניהול לקוחות

&#x20;   /monthly

&#x20;     page.tsx                     -- סיכום חודשי + הפקת קבלות

&#x20;   /receipts

&#x20;     page.tsx                     -- היסטוריית קבלות

&#x20;     \[id]/page.tsx                -- תצוגה מודפסת של קבלה

&#x20;   /tax

&#x20;     page.tsx                     -- מחשבון מס

&#x20;   /settings

&#x20;     page.tsx                     -- הגדרות משתמש



&#x20; /api

&#x20;   /clients/route.ts              -- GET, POST

&#x20;   /clients/\[id]/route.ts         -- PATCH, DELETE

&#x20;   /entries/route.ts              -- GET (with filters), POST

&#x20;   /entries/\[id]/route.ts         -- PATCH, DELETE

&#x20;   /receipts/route.ts             -- GET (list)

&#x20;   /receipts/generate/route.ts    -- POST { clientId, year, month } → create receipt

&#x20;   /receipts/\[id]/route.ts        -- GET (single)

&#x20;   /settings/route.ts             -- GET, PATCH

&#x20;   /monthly-summary/route.ts      -- GET ?year=\&month=

&#x20;   /year-progress/route.ts        -- GET ?year= (סכום שנתי + יחס לתקרה)

&#x20;   /ai/monthly-analysis/route.ts  -- POST { year, month }

&#x20;   /ai/suggest-description/route.ts -- POST { eventName }



/components

&#x20; /shared

&#x20;   BottomNav.tsx                  -- 4 tabs

&#x20;   PageHeader.tsx

&#x20;   DisclaimerBanner.tsx

&#x20;   YearCeilingProgress.tsx        -- Progress bar לתקרת עוסק פטור

&#x20; /entries

&#x20;   QuickAddHoursDialog.tsx        -- הוספת שעות מהירה

&#x20;   QuickAddEventDialog.tsx        -- הוספת אירוע מהיר

&#x20;   EntriesList.tsx

&#x20;   EntryRow.tsx

&#x20;   EditEntryDialog.tsx

&#x20; /clients

&#x20;   ClientsList.tsx

&#x20;   ClientCard.tsx

&#x20;   AddClientDialog.tsx

&#x20;   EditClientDialog.tsx

&#x20; /receipts

&#x20;   MonthlySummaryTable.tsx        -- טבלה ראשית של החודש לפי לקוח

&#x20;   GenerateReceiptDialog.tsx      -- preview + confirm

&#x20;   ReceiptPrintView.tsx           -- תצוגה מודפסת (window.print)

&#x20; /tax

&#x20;   TaxInputsCard.tsx              -- קלט: משכורת שכיר וכו'

&#x20;   TaxBreakdownTable.tsx          -- פירוט המס

&#x20;   TaxSummaryCard.tsx

&#x20; /dashboard

&#x20;   DashboardMetrics.tsx           -- שווי החודש + פירוט לקוחות

&#x20;   RecentEntries.tsx

&#x20;   AIInsightCard.tsx

&#x20;   QuickActions.tsx



/lib

&#x20; supabase/

&#x20;   client.ts                      -- Browser client

&#x20;   server.ts                      -- Server client (cookies)

&#x20; tax-calculator.ts                -- כל חישובי המס (pure functions)

&#x20; calculations.ts                  -- חישובי שעות, מחזור, progress

&#x20; receipts.ts                      -- generateReceiptNumber, buildLineItems

&#x20; claude.ts                        -- AI prompt functions

&#x20; validations.ts                   -- Zod schemas

&#x20; hebrew-format.ts                 -- formatCurrency, formatHebrewMonth



/types

&#x20; index.ts                         -- כל ה-interfaces

```



\---



\## Key Library Files — Function Signatures



\### `/lib/tax-calculator.ts`



```typescript

// כל חישובי המס — pure functions, לא נוגעות ב-DB.

// כל הקבועים כאן בקובץ. עדכון שנתי = עדכון הקבועים.



export const TAX\_YEAR = 2026;



// מדרגות מס הכנסה 2026 (שנתי, מיגיעה אישית)

export const INCOME\_TAX\_BRACKETS\_2026: TaxBracket\[] = \[

&#x20; { min: 0,       max: 84120,   rate: 0.10 },

&#x20; { min: 84120,   max: 120720,  rate: 0.14 },

&#x20; { min: 120720,  max: 228000,  rate: 0.20 },  // ✅ ריווח 2026

&#x20; { min: 228000,  max: 301200,  rate: 0.31 },  // ✅ ריווח 2026

&#x20; { min: 301200,  max: 628560,  rate: 0.35 },

&#x20; { min: 628560,  max: 721560,  rate: 0.47 },

&#x20; { min: 721560,  max: null,    rate: 0.50 },  // כולל מס יסף 3%

];



// נקודות זיכוי 2026

export const CREDIT\_POINT\_VALUE\_ANNUAL = 2904;

export const BASE\_CREDIT\_POINTS\_MALE = 2.25;

export const BASE\_CREDIT\_POINTS\_FEMALE = 2.75;



// ביטוח לאומי לעצמאי 2026

export const NI\_BRACKET\_1\_CEILING\_ANNUAL = 92436; // 7,703 × 12

export const NI\_BRACKET\_2\_CEILING\_ANNUAL = 622920; // 51,910 × 12

export const NI\_RATE\_BRACKET\_1 = 0.077;  // 7.7% (4.47% NI + 3.23% Health)

export const NI\_RATE\_BRACKET\_2 = 0.18;   // 18% (12.83% NI + 5.17% Health)

export const NI\_MIN\_INCOME\_MONTHLY = 2065;



// עוסק פטור 2026

export const OSEK\_PATUR\_CEILING\_2026 = 122833;



// געתון

export const GAATON\_CREDIT\_RATE = 0.10;

export const GAATON\_CEILING = 180000;



/\*\*

&#x20;\* חישוב מס הכנסה לפי מדרגות.

&#x20;\* מקבל הכנסה שנתית מצטברת (מעסק + שכר) וחוזר מס גולמי + פירוט.

&#x20;\*/

export function calculateIncomeTax(annualIncome: number): IncomeTaxResult {

&#x20; // pseudocode:

&#x20; // - לכל מדרגה: taxableInBracket = min(annualIncome, bracket.max) - bracket.min

&#x20; //   if taxableInBracket > 0: tax += taxableInBracket \* bracket.rate

&#x20; // - return grossTax + breakdown\[]

}



/\*\*

&#x20;\* חישוב ערך כספי של נקודות זיכוי.

&#x20;\* ערך הנקודות לא יכול לעלות על המס הגולמי (אסור החזר על אפס).

&#x20;\*/

export function calculateCreditPointsValue(

&#x20; creditPoints: number,

&#x20; grossTax: number

): number {

&#x20; return Math.min(creditPoints \* CREDIT\_POINT\_VALUE\_ANNUAL, grossTax);

}



/\*\*

&#x20;\* חישוב זיכוי ישוב מוטב.

&#x20;\* חל רק על מס שנשאר אחרי נקודות הזיכוי. לא יכול להוריד מתחת לאפס.

&#x20;\*/

export function calculateSettlementCredit(

&#x20; annualIncomeFromPersonalWork: number,

&#x20; taxAfterCreditPoints: number,

&#x20; settlementCreditRate: number,

&#x20; settlementCeiling: number

): number {

&#x20; const eligibleIncome = Math.min(annualIncomeFromPersonalWork, settlementCeiling);

&#x20; const theoreticalCredit = eligibleIncome \* settlementCreditRate;

&#x20; return Math.min(theoreticalCredit, taxAfterCreditPoints);

}



/\*\*

&#x20;\* חישוב ביטוח לאומי לעצמאי על הכנסה שנתית מהעסק בלבד.

&#x20;\* הכנסה שמתחת למינימום: מתחייבים על הכנסה מזערית.

&#x20;\* הכנסה מעל מקסימום: לא מתחייבים על החלק העודף.

&#x20;\*/

export function calculateNationalInsurance(businessAnnualIncome: number): NIBreakdown {

&#x20; const minAnnual = NI\_MIN\_INCOME\_MONTHLY \* 12; // 24,780

&#x20; const effectiveIncome = Math.max(

&#x20;   Math.min(businessAnnualIncome, NI\_BRACKET\_2\_CEILING\_ANNUAL),

&#x20;   minAnnual

&#x20; );



&#x20; const reducedRateAmount = Math.min(effectiveIncome, NI\_BRACKET\_1\_CEILING\_ANNUAL);

&#x20; const reducedRateTax = reducedRateAmount \* NI\_RATE\_BRACKET\_1;



&#x20; const fullRateAmount = Math.max(0, effectiveIncome - NI\_BRACKET\_1\_CEILING\_ANNUAL);

&#x20; const fullRateTax = fullRateAmount \* NI\_RATE\_BRACKET\_2;



&#x20; return {

&#x20;   reducedRateAmount,

&#x20;   reducedRateTax,

&#x20;   fullRateAmount,

&#x20;   fullRateTax,

&#x20;   total: reducedRateTax + fullRateTax,

&#x20; };

}



/\*\*

&#x20;\* חישוב מסכם של כל המס.

&#x20;\* סדר החישוב חשוב:

&#x20;\* 1. סך הכנסה = עסק + שכר

&#x20;\* 2. מס גולמי לפי מדרגות

&#x20;\* 3. הפחתת נקודות זיכוי (לא מתחת לאפס)

&#x20;\* 4. הפחתת זיכוי ישוב (לא מתחת לאפס)

&#x20;\* 5. ביטוח לאומי על ההכנסה מהעסק בלבד (שכיר משלם בנפרד דרך מעסיק)

&#x20;\* 6. סה"כ = מס אחרי זיכויים + ביטוח לאומי

&#x20;\*/

export function calculateTotalTaxLiability(

&#x20; params: TaxCalculationParams

): TaxSummary {

&#x20; const { businessIncome, salaryIncome, creditPoints, settlementCreditRate, settlementCeiling } = params;

&#x20; const totalIncome = businessIncome + salaryIncome;



&#x20; const { grossTax, breakdown } = calculateIncomeTax(totalIncome);

&#x20; const creditPointsValue = calculateCreditPointsValue(creditPoints, grossTax);

&#x20; const taxAfterPoints = grossTax - creditPointsValue;

&#x20; const settlementCredit = calculateSettlementCredit(

&#x20;   totalIncome,

&#x20;   taxAfterPoints,

&#x20;   settlementCreditRate,

&#x20;   settlementCeiling

&#x20; );

&#x20; const netIncomeTax = Math.max(0, taxAfterPoints - settlementCredit);



&#x20; // ביטוח לאומי לעצמאי — רק על הכנסה מהעסק.

&#x20; // אם המשתמש גם שכיר — שכיר משלם דרך המעסיק.

&#x20; const nationalInsurance = calculateNationalInsurance(businessIncome);



&#x20; return {

&#x20;   businessIncome,

&#x20;   salaryIncome,

&#x20;   totalIncome,

&#x20;   creditPoints,

&#x20;   grossIncomeTax: grossTax,

&#x20;   incomeTaxBreakdown: breakdown,

&#x20;   creditPointsValue,

&#x20;   settlementCredit,

&#x20;   netIncomeTax,

&#x20;   nationalInsurance,

&#x20;   totalAnnualTax: netIncomeTax + nationalInsurance.total,

&#x20;   taxYear: TAX\_YEAR,

&#x20;   calculatedAt: new Date().toISOString(),

&#x20; };

}



/\*\*

&#x20;\* חישוב נקודות זיכוי לפי הגדרות משתמש.

&#x20;\* המקסימום: 2 ספרות עשרוניות.

&#x20;\*/

export function getCreditPointsForUser(

&#x20; gender: 'male' | 'female',

&#x20; extraPoints: number

): number {

&#x20; const base = gender === 'female' ? BASE\_CREDIT\_POINTS\_FEMALE : BASE\_CREDIT\_POINTS\_MALE;

&#x20; return Math.round((base + (extraPoints || 0)) \* 100) / 100;

}

```



\### `/lib/calculations.ts`



```typescript

/\*\*

&#x20;\* סכום של רשומה — לפי entry\_type:

&#x20;\* - hours: hours × hourly\_rate של הלקוח באותו זמן

&#x20;\* - event: event\_rate של הלקוח באותו זמן

&#x20;\*

&#x20;\* הסכום ב-DB הוא snapshot של החישוב בעת היצירה. אם השתנה התעריף של הלקוח אחר כך — לא נספור מחדש.

&#x20;\* אם המשתמש רוצה לשנות סכום על אירוע ספציפי, הוא יכול לעדכן ידנית.

&#x20;\*/

export function calculateEntryAmount(

&#x20; entryType: 'hours' | 'event',

&#x20; hours: number | null,

&#x20; client: Pick<Client, 'hourly\_rate' | 'event\_rate'>,

&#x20; customAmount?: number

): number {

&#x20; if (customAmount !== undefined) return customAmount;

&#x20; if (entryType === 'hours' \&\& hours \&\& client.hourly\_rate) {

&#x20;   return Math.round(hours \* client.hourly\_rate \* 100) / 100;

&#x20; }

&#x20; if (entryType === 'event' \&\& client.event\_rate) {

&#x20;   return client.event\_rate;

&#x20; }

&#x20; return 0;

}



/\*\*

&#x20;\* סיכום חודשי לכל הלקוחות.

&#x20;\* מקבץ work\_entries לפי client\_id, מסכם שעות ואירועים.

&#x20;\*/

export function buildMonthlySummary(

&#x20; entries: WorkEntry\[],

&#x20; year: number,

&#x20; month: number

): MonthlySummary {

&#x20; const byClient = new Map<string, ClientMonthlySummary>();



&#x20; for (const entry of entries) {

&#x20;   const client = entry.client;

&#x20;   if (!client) continue;



&#x20;   if (!byClient.has(entry.client\_id)) {

&#x20;     byClient.set(entry.client\_id, {

&#x20;       clientId: entry.client\_id,

&#x20;       clientName: client.name,

&#x20;       totalHours: 0,

&#x20;       hoursAmount: 0,

&#x20;       eventsCount: 0,

&#x20;       eventsAmount: 0,

&#x20;       total: 0,

&#x20;       entries: \[],

&#x20;     });

&#x20;   }



&#x20;   const summary = byClient.get(entry.client\_id)!;

&#x20;   summary.entries.push(entry);



&#x20;   if (entry.entry\_type === 'hours') {

&#x20;     summary.totalHours += entry.hours || 0;

&#x20;     summary.hoursAmount += entry.amount;

&#x20;   } else {

&#x20;     summary.eventsCount += 1;

&#x20;     summary.eventsAmount += entry.amount;

&#x20;   }

&#x20;   summary.total += entry.amount;

&#x20; }



&#x20; return {

&#x20;   year,

&#x20;   month,

&#x20;   totalAmount: Array.from(byClient.values()).reduce((sum, c) => sum + c.total, 0),

&#x20;   byClient: Array.from(byClient.values()).sort((a, b) => b.total - a.total),

&#x20;   entriesCount: entries.length,

&#x20; };

}



/\*\*

&#x20;\* Progress של שנה שוטפת לעומת תקרת עוסק פטור.

&#x20;\*/

export function calculateYearProgress(

&#x20; yearTotal: number,

&#x20; ceiling: number = OSEK\_PATUR\_CEILING\_2026

): YearProgress {

&#x20; return {

&#x20;   yearTotal,

&#x20;   ceiling,

&#x20;   percentage: Math.round((yearTotal / ceiling) \* 10000) / 100,

&#x20;   remaining: Math.max(0, ceiling - yearTotal),

&#x20;   isExceeded: yearTotal > ceiling,

&#x20; };

}

```



\### `/lib/receipts.ts`



```typescript

/\*\*

&#x20;\* מספר קבלה: YYYY-MM-NNN

&#x20;\* - YYYY = שנת הפקה

&#x20;\* - MM = חודש הפקה

&#x20;\* - NNN = מספר רץ של השנה (לא של החודש), padded ל-3 ספרות

&#x20;\*

&#x20;\* צריך אטומיות — לעדכן את wm\_user\_settings.receipt\_counter\_current\_year

&#x20;\* באותה טרנזקציה של יצירת הקבלה.

&#x20;\*/

export async function generateReceiptNumber(

&#x20; supabase: SupabaseClient,

&#x20; userId: string

): Promise<string> {

&#x20; // 1. SELECT receipt\_counter\_current\_year, receipt\_counter\_year FROM wm\_user\_settings WHERE user\_id=...

&#x20; // 2. const now = new Date(); const currentYear = now.getFullYear(); const currentMonth = now.getMonth() + 1;

&#x20; // 3. if (settings.receipt\_counter\_year !== currentYear) → reset counter to 0

&#x20; // 4. nextNumber = (counter || 0) + 1

&#x20; // 5. UPDATE wm\_user\_settings SET receipt\_counter\_current\_year = nextNumber, receipt\_counter\_year = currentYear

&#x20; // 6. return `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(nextNumber).padStart(3,'0')}`

}



/\*\*

&#x20;\* בונה line\_items מסיכום חודשי של לקוח.

&#x20;\* שעות → שורה אחת מסכמת. אירועים → שורה לכל אירוע.

&#x20;\*/

export function buildLineItemsFromSummary(

&#x20; clientSummary: ClientMonthlySummary,

&#x20; hourlyRate: number | null

): ReceiptLineItem\[] {

&#x20; const items: ReceiptLineItem\[] = \[];



&#x20; if (clientSummary.totalHours > 0 \&\& hourlyRate) {

&#x20;   items.push({

&#x20;     description: `שעות עבודה — ${clientSummary.totalHours} שעות`,

&#x20;     quantity: clientSummary.totalHours,

&#x20;     unit\_price: hourlyRate,

&#x20;     total: clientSummary.hoursAmount,

&#x20;   });

&#x20; }



&#x20; for (const entry of clientSummary.entries) {

&#x20;   if (entry.entry\_type === 'event') {

&#x20;     items.push({

&#x20;       description: entry.event\_name || 'אירוע',

&#x20;       quantity: 1,

&#x20;       unit\_price: entry.amount,

&#x20;       total: entry.amount,

&#x20;     });

&#x20;   }

&#x20; }



&#x20; return items;

}

```



\### `/lib/claude.ts`



```typescript

import Anthropic from '@anthropic-ai/sdk';



const client = new Anthropic({ apiKey: process.env.ANTHROPIC\_API\_KEY });

const MODEL = 'claude-sonnet-4-20250514';



export interface MonthlyAnalysisInput {

&#x20; year: number;

&#x20; month: number;

&#x20; totalAmount: number;

&#x20; byClient: ClientMonthlySummary\[];

&#x20; yearTotalSoFar: number;

&#x20; ceiling: number;

&#x20; previousMonthTotal?: number;

}



export async function generateMonthlyAnalysis(

&#x20; input: MonthlyAnalysisInput

): Promise<string> {

&#x20; const monthName = \['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']\[input.month - 1];



&#x20; const clientsText = input.byClient.map(c =>

&#x20;   `- ${c.clientName}: ₪${c.total.toLocaleString()} (${c.totalHours} שעות, ${c.eventsCount} אירועים)`

&#x20; ).join('\\n');



&#x20; const prompt = `אתה יועץ עסקי לפרילנסר עצמאי. נתח את החודש החולף וספק תובנות פרקטיות.



חודש: ${monthName} ${input.year}

סה"כ הכנסות החודש: ₪${input.totalAmount.toLocaleString()}

${input.previousMonthTotal !== undefined ? `סה"כ חודש קודם: ₪${input.previousMonthTotal.toLocaleString()}` : ''}



פירוט לפי לקוח:

${clientsText}



מצב שנתי:

\- הכנסות שנתיות עד עכשיו: ₪${input.yearTotalSoFar.toLocaleString()}

\- תקרת עוסק פטור 2026: ₪${input.ceiling.toLocaleString()}

\- אחוז ניצול תקרה: ${((input.yearTotalSoFar / input.ceiling) \* 100).toFixed(1)}%



ספק ניתוח ב-5 עד 7 שורות בעברית:

1\. שורה אחת מסכמת את החודש (האם חזק/חלש בהשוואה לקודם)

2\. מי הלקוח הכי רווחי, וכמה אחוז מההכנסות

3\. ממוצע לשעה בפועל (אם רלוונטי)

4\. מצב התקרה — האם יש סיכון לחריגה בקרוב, מה הקצב הצפוי לסוף שנה

5\. 1-2 תובנות פרקטיות (לדוגמה: "ירדה הפעילות עם לקוח X, שווה לבדוק")



סגנון: ישיר, ענייני, ללא מילים מיותרות. בעברית בלבד. אל תוסיף disclaimer בסוף.`;



&#x20; const response = await client.messages.create({

&#x20;   model: MODEL,

&#x20;   max\_tokens: 800,

&#x20;   messages: \[{ role: 'user', content: prompt }],

&#x20; });



&#x20; const textBlock = response.content.find(b => b.type === 'text');

&#x20; return textBlock?.type === 'text' ? textBlock.text : '';

}



export async function suggestReceiptDescription(eventName: string): Promise<string> {

&#x20; const prompt = `הלקוח כתב לקבלה שם של אירוע: "${eventName}".

נסח עבורו שורה מקצועית אחת בעברית שתופיע כתיאור בקבלה. שורה אחת בלבד, ענייני, ללא הסברים נוספים.

דוגמאות לסגנון רצוי:

\- "הפקת אירוע חתונה, 15.6.2026"

\- "ניהול הפקה — אירוע חברה ספטמבר 2026"



החזר רק את השורה עצמה, ללא מרכאות וללא טקסט נוסף.`;



&#x20; const response = await client.messages.create({

&#x20;   model: MODEL,

&#x20;   max\_tokens: 150,

&#x20;   messages: \[{ role: 'user', content: prompt }],

&#x20; });



&#x20; const textBlock = response.content.find(b => b.type === 'text');

&#x20; return textBlock?.type === 'text' ? textBlock.text.trim() : eventName;

}

```



\---



\## Validation Schemas (`/lib/validations.ts`)



```typescript

import { z } from 'zod';



export const createClientSchema = z.object({

&#x20; name: z.string().min(1).max(200),

&#x20; description: z.string().max(1000).optional().nullable(),

&#x20; hourly\_rate: z.number().positive().optional().nullable(),

&#x20; event\_rate: z.number().positive().optional().nullable(),

&#x20; contact\_info: z.string().max(1000).optional().nullable(),

}).refine(data => data.hourly\_rate || data.event\_rate, {

&#x20; message: 'חייב להגדיר לפחות תעריף שעתי או תעריף אירוע',

});



export const updateClientSchema = createClientSchema.partial().extend({

&#x20; is\_active: z.boolean().optional(),

});



export const createWorkEntrySchema = z.discriminatedUnion('entry\_type', \[

&#x20; z.object({

&#x20;   entry\_type: z.literal('hours'),

&#x20;   client\_id: z.string().uuid(),

&#x20;   entry\_date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),

&#x20;   hours: z.number().positive().max(24),

&#x20;   description: z.string().max(500).optional().nullable(),

&#x20;   custom\_amount: z.number().positive().optional(),

&#x20; }),

&#x20; z.object({

&#x20;   entry\_type: z.literal('event'),

&#x20;   client\_id: z.string().uuid(),

&#x20;   entry\_date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),

&#x20;   event\_name: z.string().min(1).max(200),

&#x20;   description: z.string().max(500).optional().nullable(),

&#x20;   custom\_amount: z.number().positive().optional(),

&#x20; }),

]);



export const updateWorkEntrySchema = z.object({

&#x20; entry\_date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),

&#x20; hours: z.number().positive().max(24).optional().nullable(),

&#x20; event\_name: z.string().min(1).max(200).optional().nullable(),

&#x20; amount: z.number().positive().optional(),

&#x20; description: z.string().max(500).optional().nullable(),

});



export const userSettingsSchema = z.object({

&#x20; full\_name: z.string().min(1).max(200),

&#x20; business\_name: z.string().max(200).optional().nullable(),

&#x20; tax\_id: z.string().max(20).optional().nullable(),

&#x20; address: z.string().max(500).optional().nullable(),

&#x20; phone: z.string().max(20).optional().nullable(),

&#x20; email: z.string().email().optional().nullable(),

&#x20; gender: z.enum(\['male', 'female']),

&#x20; extra\_credit\_points: z.number().min(0).max(20),

&#x20; settlement\_name: z.string().max(100).optional().nullable(),

&#x20; settlement\_credit\_rate: z.number().min(0).max(0.30),

&#x20; settlement\_ceiling: z.number().positive(),

&#x20; salary\_annual\_income: z.number().min(0),

});



export const generateReceiptSchema = z.object({

&#x20; client\_id: z.string().uuid(),

&#x20; year: z.number().int().min(2020).max(2100),

&#x20; month: z.number().int().min(1).max(12),

&#x20; notes: z.string().max(1000).optional(),

&#x20; // Optional: override line items if user customized

&#x20; custom\_line\_items: z.array(z.object({

&#x20;   description: z.string(),

&#x20;   quantity: z.number().positive(),

&#x20;   unit\_price: z.number().positive(),

&#x20;   total: z.number().positive(),

&#x20; })).optional(),

});

```



\---



\## API Endpoint Patterns



כל route עוקב אחרי הדפוס הבא:



```typescript

import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {

&#x20; const supabase = await createClient();

&#x20; const { data: { user } } = await supabase.auth.getUser();

&#x20; if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });



&#x20; // ... .eq('user\_id', user.id)

}

```



\### POST `/api/entries` — לוגיקה מיוחדת



```typescript

// 1. Validate with createWorkEntrySchema

// 2. Fetch client to get hourly\_rate / event\_rate

// 3. Calculate amount via calculateEntryAmount() — שמור snapshot

// 4. INSERT into wm\_work\_entries with amount

// 5. Return the new entry with joined client

```



\### POST `/api/receipts/generate` — לוגיקה מיוחדת



```typescript

// 1. Validate with generateReceiptSchema

// 2. Fetch user settings → user\_snapshot

// 3. Fetch client → client\_snapshot

// 4. Fetch all entries for {client\_id, year, month} where receipt\_id IS NULL

// 5. Build line\_items via buildLineItemsFromSummary OR use custom\_line\_items if provided

// 6. Generate receipt\_number via generateReceiptNumber() — מעדכן counter

// 7. INSERT into wm\_receipts

// 8. UPDATE wm\_work\_entries SET receipt\_id = ... WHERE id IN (...)

// 9. Return receipt

```



\### GET `/api/monthly-summary?year=2026\&month=5`



```typescript

// 1. Fetch entries WHERE user\_id=user.id AND entry\_date BETWEEN '2026-05-01' AND '2026-05-31'

//    LEFT JOIN clients

// 2. Build summary via buildMonthlySummary()

// 3. Return summary

```



\### GET `/api/year-progress?year=2026`



```typescript

// 1. SELECT SUM(amount) FROM wm\_work\_entries WHERE user\_id=user.id AND entry\_date BETWEEN '2026-01-01' AND '2026-12-31'

// 2. Calculate progress via calculateYearProgress()

// 3. Return progress

```



\---



\## UI Specifications



\### דשבורד (Home)



```

┌──────────────────────────────────────┐

│ DisclaimerBanner (sticky top, light) │

├──────────────────────────────────────┤

│ Header: שלום \[שם]                    │

├──────────────────────────────────────┤

│ Card: סיכום החודש                   │

│   ₪X,XXX סה"כ                       │

│   X רשומות (Y שעות, Z אירועים)      │

├──────────────────────────────────────┤

│ Card: פירוט לפי לקוחות (top 3)      │

│   ירון       ₪X,XXX (XX%)           │

│   לקוח 2    ₪X,XXX                   │

│   לקוח 3    ₪XXX                     │

├──────────────────────────────────────┤

│ Card: YearCeilingProgress             │

│   ████████░░░░ 68%                   │

│   ₪83,400 / ₪122,833 (תקרת עוסק פטור)│

├──────────────────────────────────────┤

│ Card: AIInsightCard (אם קיים)        │

│   "החודש היה חזק, +25% מהקודם..."   │

├──────────────────────────────────────┤

│ QuickActions:                        │

│   \[+ הוסף שעות]  \[+ הוסף אירוע]    │

├──────────────────────────────────────┤

│ Card: 5 רשומות אחרונות               │

└──────────────────────────────────────┘

```



\### Bottom Navigation (4 tabs)



```

🏠 בית | 📋 רשומות | 👥 לקוחות | 📊 מס

```



הגדרות, סיכום חודשי, וקבלות נגישות מהדשבורד או מתוך טאבים.



\### Flow הוספת רשומת שעות (3 לחיצות מהדשבורד)



1\. דשבורד → `\[+ הוסף שעות]` (לחיצה 1)

2\. Dialog נפתח: שדה "שעות" עם autofocus + dropdown "לקוח" (אם יש 1, נבחר אוטומטית; אם 2+, dropdown), תאריך = היום (default)

3\. הקלדה: `2.5` → טאב → בחירת לקוח → `\[שמור]` (לחיצה 2-3)

4\. הסכום מחושב אוטומטית מתעריף הלקוח. אופציה ל"שנה סכום ידנית" (collapsed).



\### Flow הוספת אירוע (3 לחיצות)



1\. `\[+ הוסף אירוע]` (1)

2\. Dialog: שם האירוע + dropdown לקוח. הסכום מחושב מתעריף האירוע של הלקוח.

3\. `\[שמור]` (2-3 אם לקוח אוטומטי, 3 אם dropdown)



\### מסך סיכום חודשי `/monthly`



```

Header: סיכום \[חודש] \[שנה]

Selector: ▼ אפריל 2026



Card: סה"כ ₪X,XXX



Table per client:

┌─────────────────────────────────────────────┐

│ ירון - הפקות         | סה"כ ₪3,600          │

├─────────────────────────────────────────────┤

│ שעות: 25 × ₪60        = ₪1,500              │

│ אירוע: ערב צדקה       = ₪700                │

│ אירוע: כנס יזמים      = ₪700                │

│ אירוע: יום הולדת       = ₪700                │

├─────────────────────────────────────────────┤

│ \[הפק קבלה ←]                                │

└─────────────────────────────────────────────┘



(table לכל לקוח)

```



\### מסך קבלה (Print Preview) `/receipts/\[id]`



```

┌──────────────────────────────────────┐

│ \[שם מלא של המשתמש]                  │

│ \[שם העסק]                            │

│ ת.ז.: XXXXXXXXX                      │

│ \[כתובת]                              │

│ טלפון: XXX-XXXXXXX                   │

├──────────────────────────────────────┤

│ קבלה מס': 2026-05-001                │

│ תאריך: 11.05.2026                    │

├──────────────────────────────────────┤

│ לכבוד: \[שם הלקוח]                   │

│ \[פרטי קשר של הלקוח]                 │

├──────────────────────────────────────┤

│ תיאור        | כמות | מחיר | סה"כ    │

│ שעות עבודה   | 25   | 60   | 1,500   │

│ ערב צדקה     | 1    | 700  | 700     │

│ ...                                   │

├──────────────────────────────────────┤

│ סה"כ לתשלום:           ₪3,600        │

├──────────────────────────────────────┤

│ עוסק פטור — פטור מניכוי מע"מ        │

├──────────────────────────────────────┤

│ \[הדפס ←] (window.print())            │

└──────────────────────────────────────┘

```



\*\*CSS @media print:\*\* הסתר את BottomNav, Header, וכפתורים. הצג רק את גוף הקבלה.



\### מסך מחשבון מס `/tax`



```

Header: מחשבון מס 2026



Card: קלט

┌──────────────────────────────────────┐

│ הכנסה מהעסק (שנתי):  ₪X,XXX (auto)  │

│ הכנסה ממשכורת:        \[\_\_\_\_] (input) │

│ נקודות זיכוי בסיס:    2.25 (auto male)│

│ נקודות זיכוי נוספות:  \[\_\_\_\_]         │

│ ─ סה"כ נקודות: 2.25                  │

│ ישוב מוטב: געתון ✓                  │

│ אחוז זיכוי ישוב: 10% • תקרה ₪180,000│

└──────────────────────────────────────┘



Card: פירוט המס

┌──────────────────────────────────────┐

│ הכנסה כוללת (עסק + שכר): ₪XX,XXX    │

│ ─                                     │

│ מס הכנסה לפי מדרגות:                 │

│   10% על ₪84,120:        ₪8,412     │

│   14% על ₪Y:             ₪Z         │

│   ...                                 │

│ מס גולמי:                ₪XX,XXX    │

│ ─                                     │

│ פחות זיכויים:                        │

│   נקודות זיכוי (2.25): -₪6,534      │

│   זיכוי ישוב (10%):    -₪XX,XXX     │

│ מס הכנסה לתשלום:        ₪XX,XXX     │

│ ─                                     │

│ ביטוח לאומי לעצמאי:                  │

│   7.7% על ₪92,436:      ₪X,XXX      │

│   18% על ₪Y:            ₪Z          │

│ סה"כ ביטוח לאומי:        ₪XX,XXX    │

│ ─                                     │

│ ════════════════════════════════════ │

│ סה"כ חבות שנתית מוערכת: ₪XX,XXX     │

│ ════════════════════════════════════ │

└──────────────────────────────────────┘



⚠️ זהו חישוב הערכה בלבד. הנתונים מבוססים על מדרגות 

המס לשנת 2026. מומלץ להיוועץ ברואה חשבון לחישוב מדויק.

```



\### מסך הגדרות `/settings`



טופס פשוט עם:

\- פרטים אישיים: שם, שם עסק, ת"ז, כתובת, טלפון, אימייל

\- מין (זכר/נקבה) → משפיע על נקודות זיכוי בסיס

\- נקודות זיכוי נוספות (input)

\- ישוב מוטב (default: געתון 10% / 180,000)

\- הכנסה ממשכורת (אם רלוונטי)



\---



\## Build Order — Phases



\### Phase 1 — Foundation

\*\*מטרה:\*\* Auth + DB tables + שלד אפליקציה ריק עובד.



\*\*קבצים:\*\*

\- `/app/layout.tsx` — RTL, Heebo font, html lang="he" dir="rtl"

\- `/app/manifest.ts` — PWA manifest

\- `/middleware.ts` — Auth redirect (זהה ל-StudyMind)

\- `/lib/supabase/client.ts`, `/lib/supabase/server.ts`

\- `/app/(auth)/login/page.tsx`, `/register/page.tsx`

\- `/app/(app)/layout.tsx` — App shell עם BottomNav

\- `/components/shared/BottomNav.tsx` — 4 tabs

\- `/components/shared/DisclaimerBanner.tsx`

\- `/components/shared/PageHeader.tsx`

\- `/types/index.ts` — ה-types המלאים

\- הרץ דרך Supabase MCP את כל ה-SQL מהסעיף Database Schema



\*\*Verify:\*\* הרשמה + התחברות עובדות. רואים את 4 הטאבים בתחתית. כל הטאבים מובילים לעמודים ריקים. ב-Supabase כל הטבלאות `wm\_\*` קיימות עם RLS פעיל.



\### Phase 2 — Clients

\*\*מטרה:\*\* ניהול לקוחות מלא.



\*\*קבצים:\*\*

\- `/lib/validations.ts` — createClientSchema, updateClientSchema

\- `/app/api/clients/route.ts` — GET (list), POST

\- `/app/api/clients/\[id]/route.ts` — PATCH, DELETE

\- `/app/(app)/clients/page.tsx`

\- `/components/clients/ClientsList.tsx`

\- `/components/clients/ClientCard.tsx` — מציג שם, תיאור, תעריפים, badge פעיל/לא פעיל

\- `/components/clients/AddClientDialog.tsx`

\- `/components/clients/EditClientDialog.tsx`



\*\*Verify:\*\* ניתן להוסיף לקוח חדש (ירון: ₪60/שעה + ₪700/אירוע). עריכה ומחיקה עובדות. הגנת RLS — לקוח לא רואה לקוחות של אחרים.



\### Phase 3 — Work Entries + Dashboard

\*\*מטרה:\*\* רישום עבודה + דשבורד פעיל.



\*\*קבצים:\*\*

\- `/lib/calculations.ts` — calculateEntryAmount, buildMonthlySummary, calculateYearProgress

\- `/lib/hebrew-format.ts` — formatCurrency, formatHebrewMonth, formatHebrewDate

\- `/lib/validations.ts` — הוסף createWorkEntrySchema, updateWorkEntrySchema

\- `/app/api/entries/route.ts` — GET ?year=\&month=\&client\_id=, POST

\- `/app/api/entries/\[id]/route.ts` — PATCH, DELETE

\- `/app/api/monthly-summary/route.ts`

\- `/app/api/year-progress/route.ts`

\- `/app/(app)/page.tsx` — דשבורד מלא

\- `/app/(app)/entries/page.tsx` — רשימת רשומות עם סינון

\- `/components/entries/QuickAddHoursDialog.tsx`

\- `/components/entries/QuickAddEventDialog.tsx`

\- `/components/entries/EntriesList.tsx`

\- `/components/entries/EntryRow.tsx`

\- `/components/entries/EditEntryDialog.tsx`

\- `/components/dashboard/DashboardMetrics.tsx`

\- `/components/dashboard/RecentEntries.tsx`

\- `/components/dashboard/QuickActions.tsx`

\- `/components/shared/YearCeilingProgress.tsx`



\*\*Verify:\*\* ניתן להוסיף שעות (₪60×2.5 = ₪150) ואירועים (ערב צדקה = ₪700) ב-3 לחיצות. סכומים מחושבים אוטומטית. דשבורד מציג סיכום החודש, top 3 לקוחות, ו-progress bar. סינון רשומות לפי חודש עובד.



\### Phase 4 — Monthly Summary + Receipts

\*\*מטרה:\*\* הפקת קבלות חוקיות לעוסק פטור.



\*\*קבצים:\*\*

\- `/lib/receipts.ts` — generateReceiptNumber, buildLineItemsFromSummary

\- `/lib/validations.ts` — הוסף generateReceiptSchema

\- `/app/api/receipts/route.ts` — GET (list)

\- `/app/api/receipts/generate/route.ts` — POST

\- `/app/api/receipts/\[id]/route.ts` — GET

\- `/app/(app)/monthly/page.tsx`

\- `/app/(app)/receipts/page.tsx`

\- `/app/(app)/receipts/\[id]/page.tsx` — Print view

\- `/components/receipts/MonthlySummaryTable.tsx`

\- `/components/receipts/GenerateReceiptDialog.tsx` — preview + edit lines + confirm

\- `/components/receipts/ReceiptPrintView.tsx` — עיצוב הקבלה + CSS print



\*\*CSS print:\*\* בקובץ globals.css או component-level:

```css

@media print {

&#x20; body { background: white; }

&#x20; .no-print, nav, header { display: none !important; }

&#x20; .receipt-print { box-shadow: none; padding: 0; }

}

```



\*\*Verify:\*\* ניתן לבחור חודש ולראות סיכום לפי לקוח. לחיצה על "הפק קבלה" → preview → אישור → קבלה נוצרת עם מספר רץ (2026-05-001). הרשומות מקבלות receipt\_id ולא מופיעות שוב להפקה נוספת. window.print() מציג את הקבלה בלבד.



\### Phase 5 — Tax Calculator + Settings

\*\*מטרה:\*\* מחשבון מס מלא עובד.



\*\*קבצים:\*\*

\- `/lib/tax-calculator.ts` — כל פונקציות החישוב

\- `/lib/validations.ts` — הוסף userSettingsSchema

\- `/app/api/settings/route.ts` — GET, PATCH

\- `/app/(app)/settings/page.tsx`

\- `/app/(app)/tax/page.tsx`

\- `/components/tax/TaxInputsCard.tsx`

\- `/components/tax/TaxBreakdownTable.tsx`

\- `/components/tax/TaxSummaryCard.tsx`



\*\*Logic:\*\*

\- בעת טעינת מסך מס: קרא להגדרות + ל-year-progress (לקבל הכנסה מהעסק עד היום).

\- חישוב לחיים — כל שינוי בקלט (משכורת שכיר, נקודות נוספות) מפעיל calculateTotalTaxLiability ומציג תוצאות חדשות.

\- ההגדרות הראשוניות (default): male, 0 נקודות נוספות, געתון 10%/180000, salary 0.



\*\*Verify:\*\* הגדרת המשתמש נשמרת. במסך המס: כל הקלט מתעדכן בזמן אמת. הפירוט תואם לחישוב ידני (תוכל לבדוק עם הכנסה של 100,000 ₪: מס גולמי = 84,120×10% + 15,880×14% = ₪10,635.2; נק' זיכוי = 2.25 × 2,904 = ₪6,534; ישוב = min(100000,180000)×10% = ₪10,000; מס סופי = max(0, 10635.2 - 6534 - 10000) = ₪0; ביטוח לאומי = 92,436×7.7% + 7,564×18% = ₪7,117.5 + ₪1,361.5 = ₪8,479).



\### Phase 6 — AI Features

\*\*מטרה:\*\* ניתוח חודשי + הצעת תיאור.



\*\*קבצים:\*\*

\- `/lib/claude.ts` — generateMonthlyAnalysis, suggestReceiptDescription

\- `/app/api/ai/monthly-analysis/route.ts`

\- `/app/api/ai/suggest-description/route.ts`

\- `/components/dashboard/AIInsightCard.tsx`



\*\*Logic:\*\*

\- ניתוח חודשי: בעת טעינת הדשבורד, בדוק אם יש wm\_monthly\_insights לחודש הקודם. אם כן → הצג. אם לא → כפתור "צור ניתוח" שמפעיל את ה-API ושומר ל-cache.

\- הצעת תיאור: בתוך GenerateReceiptDialog, ליד שדה ה-description של line\_item מסוג event, יש כפתור 🪄 שמפעיל את ה-API ומחליף את הטקסט בהצעה.



\*\*Verify:\*\* AIInsightCard מציג תובנה רלוונטית (5-7 שורות עברית). אין disclaimer בטעות בתוך התובנה. הצעת תיאור עובדת ומחזירה שורה אחת.



\### Phase 7 — Polish + PWA

\*\*מטרה:\*\* ייצוב, PWA installable, error states.



\*\*משימות:\*\*

\- Manifest תקין (theme\_color, background\_color, icons 192/512/maskable)

\- Service Worker בסיסי (cache shell)

\- Loading skeletons בכל מסך עם נתונים

\- Error boundaries (`/app/(app)/error.tsx`)

\- בדיקות RTL pixel-perfect במסכים החשובים

\- בדיקה על Android Chrome (התקנה כ-PWA)

\- Disclaimer מורחב במסך מס + במסך AI



\*\*Verify:\*\* האפליקציה ניתנת להתקנה כ-PWA על Android. כל המסכים תקינים ב-RTL. אין שגיאות hydration.



\---



\## Files NOT to Touch (לאחר הקמה)



\- `/middleware.ts` — רק auth redirect, כמו ב-StudyMind

\- `/lib/supabase/\*` — סטנדרט Supabase Next.js

\- `/components/ui/\*` — shadcn/ui (התקנה דרך `npx shadcn-ui@latest add`)



\---



\## הוראות מיוחדות לClaud Code



1\. \*\*התחל מ-Phase 1.\*\* אל תקפוץ קדימה.

2\. \*\*בכל phase: בדוק שמקמפל לפני שממשיכים.\*\* `npm run dev` בלי errors.

3\. \*\*כל ה-SQL מתבצע דרך Supabase MCP\*\*, לא דרך migration files.

4\. \*\*prefix `wm\_` חובה\*\* — אסור לטבלאות WorkMind להתנגש ב-StudyMind/InvestMind על אותו DB.

5\. \*\*שמור את כל הקבועים של 2026 ב-`/lib/tax-calculator.ts`\*\* ולא ב-DB. עדכון שנתי בעתיד = עדכון קובץ אחד.

6\. \*\*כל תשובת AI במחשבון מס מקבלת disclaimer בעברית בסוף\*\* — חוץ מ-MonthlyAnalysis (שם אסור).

7\. \*\*window.print() בלבד\*\* לקבלות — אין pdfkit, html2pdf או ספריות PDF.

8\. \*\*כל מסך עם נתונים מציג Loading state\*\* עד שהנתונים מגיעים. אסור flash של "אין נתונים" לפני שהבקשה הסתיימה.

9\. \*\*Disclaimer קבוע למחשבון מס:\*\*

&#x20;  `"\* זהו חישוב הערכה בלבד. הנתונים מבוססים על מדרגות המס לשנת 2026. מומלץ להיוועץ ברואה חשבון לחישוב מדויק."`



\---



\## בדיקת שפיות לחישוב מס (test case)



ב-Phase 5 ודא שהחישוב חוזר לערכים האלה:



\*\*קלט:\*\*

\- businessIncome: 100,000 ₪

\- salaryIncome: 0

\- creditPoints: 2.25 (זכר)

\- settlementCreditRate: 0.10

\- settlementCeiling: 180,000



\*\*פלט מצופה:\*\*

\- grossIncomeTax: 84,120 × 10% + (100,000 - 84,120) × 14% = 8,412 + 2,223.20 = \*\*10,635.20 ₪\*\*

\- creditPointsValue: min(2.25 × 2,904, 10,635.20) = min(6,534, 10,635.20) = \*\*6,534 ₪\*\*

\- taxAfterPoints: 10,635.20 - 6,534 = \*\*4,101.20 ₪\*\*

\- settlementCredit: min(100,000 × 10%, 4,101.20) = min(10,000, 4,101.20) = \*\*4,101.20 ₪\*\*

\- netIncomeTax: max(0, 4,101.20 - 4,101.20) = \*\*0 ₪\*\*

\- NI: 92,436 × 7.7% + (100,000 - 92,436) × 18% = 7,117.57 + 1,361.52 = \*\*8,479.09 ₪\*\*

\- totalAnnualTax: 0 + 8,479.09 = \*\*8,479.09 ₪\*\*

