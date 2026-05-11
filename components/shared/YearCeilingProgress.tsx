import { YearProgress } from '@/types';
import { formatCurrency } from '@/lib/hebrew-format';

interface YearCeilingProgressProps {
  progress: YearProgress;
}

export default function YearCeilingProgress({ progress }: YearCeilingProgressProps) {
  const pct = Math.min(progress.percentage, 100);
  const barColor = progress.isExceeded
    ? 'bg-red-500'
    : pct >= 80
    ? 'bg-amber-500'
    : 'bg-blue-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">תקרת עוסק פטור 2026</p>
        <p className={`text-sm font-semibold ${progress.isExceeded ? 'text-red-600' : 'text-gray-700'}`}>
          {pct.toFixed(1)}%
        </p>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatCurrency(progress.yearTotal)}</span>
        <span>{formatCurrency(progress.ceiling)}</span>
      </div>

      {!progress.isExceeded && (
        <p className="text-xs text-gray-400 mt-1">
          נותרו {formatCurrency(progress.remaining)} לתקרה
        </p>
      )}
      {progress.isExceeded && (
        <p className="text-xs text-red-600 font-medium mt-1">
          ⚠️ חרגת מתקרת עוסק פטור ב-{formatCurrency(progress.yearTotal - progress.ceiling)}
        </p>
      )}
    </div>
  );
}
