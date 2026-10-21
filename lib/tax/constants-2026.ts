// כל קבועי המס, ביטוח לאומי ושכר לשנת 2026.
// זה המקום היחיד במערכת שבו מותר מספר מס (מפרט v2, NEVER #1).
// עדכון שנתי = קובץ constants-2027.ts חדש.

export const TAX_YEAR = 2026;

// ─── מס הכנסה ───────────────────────────────────────────────
// מקור: לוח הניכויים של רשות המסים 2026 (שנתי, הכנסה מיגיעה אישית).
export interface IncomeTaxBracket {
  upTo: number;
  rate: number;
}

export const INCOME_TAX_BRACKETS_2026: readonly IncomeTaxBracket[] = [
  { upTo: 84_120, rate: 0.10 },
  { upTo: 120_720, rate: 0.14 },
  { upTo: 228_000, rate: 0.20 },
  { upTo: 301_200, rate: 0.31 },
  { upTo: 560_280, rate: 0.35 },
  { upTo: Infinity, rate: 0.47 },
];

// מס יסף — 3% נוספים על הכנסה מעל הסף. מקור: רשות המסים 2026.
export const SURTAX_THRESHOLD_2026 = 721_560;
export const SURTAX_RATE = 0.03;

// נקודת זיכוי — 2,904 ₪ לשנה (242 ₪ לחודש). מקור: רשות המסים 2026.
export const CREDIT_POINT_ANNUAL_2026 = 2_904;
export const BASE_POINTS = { male: 2.25, female: 2.75 } as const;

// ─── ישוב מוטב ───────────────────────────────────────────────
// מקור: הודעת מס הכנסה, רשימת יישובים מוטבים 2026 (ק"ת תשפ"ו 830):
// "געתון 57.0 10% 180,000".
export const SETTLEMENT_DEFAULT = { name: 'געתון', rate: 0.10, ceiling: 180_000 } as const;

// ─── עסק זעיר ────────────────────────────────────────────────
// מקור: כל זכות / רשות המסים — תקרת מחזור 2026, והכנסה חייבת = 70% מהמחזור.
export const ZAIR_TURNOVER_CEILING_2026 = 122_833;
export const ZAIR_TAXABLE_SHARE = 0.70;

// ─── ביטוח לאומי ובריאות (חודשי) ────────────────────────────
// מקור: btl.gov.il, שיעורים וספים מ-1.1.2026.
export const NI_REDUCED_THRESHOLD = 7_703; // 60% מהשכר הממוצע
export const NI_MAX_INCOME = 51_910;
export const NI_SELF_REDUCED = 0.077; // 4.47% ב"ל + 3.23% בריאות
export const NI_SELF_FULL = 0.18; // 12.83% ב"ל + 5.17% בריאות
export const NI_EMP_REDUCED = 0.0427; // חלק העובד
export const NI_EMP_FULL = 0.1217;
export const NI_MIN_INCOME_SELF = 3_442; // הכנסה מזערית לעצמאי

// ספי הגדרת "עצמאי" לפי ב"ל. מקור: btl.gov.il.
// A: 20 שעות בשבוע, או הכנסה של 6,885 ₪ לפחות (בלי תלות בשעות).
// B: 12 שעות בשבוע וגם הכנסה של 2,065 ₪ לפחות.
export const SELF_STATUS = { hoursA: 20, incomeA: 6_885, hoursB: 12, incomeB: 2_065 } as const;

// ─── שכר ─────────────────────────────────────────────────────
// מקור: שכר מינימום מ-1.4.2026.
export const MIN_WAGE_HOURLY_FROM_2026_04 = 35.40;
export const MIN_WAGE_MONTHLY_FROM_2026_04 = 6_443.85;

// ─── שים בצד ─────────────────────────────────────────────────
// כמה ₪ מחזור מוצגים ביחידת "שים בצד" (לכל 100 ₪).
export const SETASIDE_PER = 100;

// ─── מועדים ─────────────────────────────────────────────────
// MM-DD. "nextYear" = המועד חל בשנה שאחרי שנת המס.
// מקור: רשות המסים / מע"מ — תיאום מס עד סוף השנה, הצהרת מחזור עד 31.1, דוח שנתי עד 31.3.
export const TAX_DEADLINES = {
  taxCoordination: { date: '12-25', nextYear: false },
  vatTurnoverDeclaration: { date: '01-31', nextYear: true },
  zairAnnualReport: { date: '03-31', nextYear: true },
} as const;

/** מועד שבתוכו הוא "קרוב" (alert). */
export const DEADLINE_ALERT_DAYS = 14;

/** פס תקרת העסק הזעיר מוצג רק מעל היחס הזה (מפרט סעיף 3, 10). */
export const CEILING_DISPLAY_RATIO = 0.70;
