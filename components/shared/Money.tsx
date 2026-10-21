// סכום כספי: עטוף ב-<bdi> כדי לא להישבר ב-RTL, עם הקשר קריא לקורא מסך.

export function formatShekel(amount: number, fractionDigits = 0): string {
  return `${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })}₪`;
}

interface MoneyProps {
  amount: number;
  /** הקשר שנוסף לקורא המסך, למשל "לשנה". */
  context?: string;
  fractionDigits?: number;
  className?: string;
}

export default function Money({ amount, context, fractionDigits = 0, className }: MoneyProps) {
  const spoken = `${amount.toLocaleString('he-IL', { maximumFractionDigits: fractionDigits })} שקלים${context ? ` ${context}` : ''}`;
  return (
    <bdi className={className}>
      <span aria-hidden="true">{formatShekel(amount, fractionDigits)}</span>
      <span className="sr-only">{spoken}</span>
    </bdi>
  );
}
