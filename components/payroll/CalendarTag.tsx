import { CalendarDays } from 'lucide-react';

/** תג קטן למשמרת שנכנסה מהיומן. */
export default function CalendarTag() {
  return (
    <span className="inline-flex items-center gap-1 ms-1.5 px-1.5 rounded border border-rule text-[13px] text-text-mute align-middle">
      <CalendarDays size={12} aria-hidden="true" />
      מהיומן
    </span>
  );
}
