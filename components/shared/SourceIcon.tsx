import { Paintbrush, Wrench } from 'lucide-react';

// צבע לבד לא נושא משמעות: לשכר ולעסק יש גם אייקון קבוע.
// שכר = מפתח ברגים (steel). עסק = מברשת (brass).
interface IconProps {
  size?: number;
  className?: string;
}

export function SalaryIcon({ size = 16, className = '' }: IconProps) {
  return <Wrench size={size} aria-hidden="true" className={`text-steel ${className}`} />;
}

export function BusinessIcon({ size = 16, className = '' }: IconProps) {
  return <Paintbrush size={size} aria-hidden="true" className={`text-brass ${className}`} />;
}
