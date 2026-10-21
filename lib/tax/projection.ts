// "שנה צפויה" ולא "עד היום" (מפרט 6.4). כל מספר במסך המס הוא צפי לשנה.

export interface BusinessProjectionParams {
  /** מחזור מתחילת השנה. */
  turnoverYtd: number;
  /** מחזור בכל אחד מהחודשים האחרונים (עד 3), מהישן לחדש. */
  recentMonths: number[];
  /** חודשים שנותרו עד סוף השנה (לא כולל החודש הנוכחי אם הוא כבר בתוך ytd). */
  monthsRemaining: number;
  /** דריסה ידנית של המשתמש. */
  override?: number | null;
}

/** עסק: מחזור עד היום + ממוצע 3 חודשים אחרונים × חודשים שנותרו. */
export function projectAnnualTurnover({ turnoverYtd, recentMonths, monthsRemaining, override }: BusinessProjectionParams): number {
  if (override != null) return override;
  const last3 = recentMonths.slice(-3);
  const avg = last3.length ? last3.reduce((s, m) => s + m, 0) / last3.length : 0;
  return Math.max(0, turnoverYtd) + avg * Math.max(0, monthsRemaining);
}

export interface SalaryProjectionParams {
  /** ברוטו מכל התלושים שהוזנו השנה. */
  payslipGrosses: number[];
  /** ממוצע ברוטו חודשי (מתלושים או ממשמרות). */
  avgMonthlyGross: number;
  /** חודשים שנותרו מהיום — או מתאריך תחילת העבודה, המאוחר מביניהם. */
  monthsRemaining: number;
  override?: number | null;
}

/** שכר: ברוטו מהתלושים שהוזנו + ברוטו חודשי ממוצע × חודשים שנותרו. */
export function projectAnnualSalary({ payslipGrosses, avgMonthlyGross, monthsRemaining, override }: SalaryProjectionParams): number {
  if (override != null) return override;
  const entered = payslipGrosses.reduce((s, g) => s + g, 0);
  return entered + Math.max(0, avgMonthlyGross) * Math.max(0, monthsRemaining);
}
