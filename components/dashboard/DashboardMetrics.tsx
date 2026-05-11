import { MonthlySummary } from '@/types';
import { formatCurrency } from '@/lib/hebrew-format';

interface DashboardMetricsProps {
  summary: MonthlySummary;
  monthLabel: string;
}

export default function DashboardMetrics({ summary, monthLabel }: DashboardMetricsProps) {
  const top3 = summary.byClient.slice(0, 3);
  const totalHours = summary.byClient.reduce((s, c) => s + c.totalHours, 0);
  const totalEvents = summary.byClient.reduce((s, c) => s + c.eventsCount, 0);

  return (
    <div className="space-y-3">
      {/* Month total */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-400 mb-1">סיכום {monthLabel}</p>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {summary.entriesCount} רשומות
          {totalHours > 0 && ` · ${totalHours} שעות`}
          {totalEvents > 0 && ` · ${totalEvents} אירועים`}
        </p>
      </div>

      {/* Top clients */}
      {top3.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 mb-3">פירוט לפי לקוח</p>
          <div className="space-y-2.5">
            {top3.map(client => {
              const pct = summary.totalAmount > 0
                ? Math.round((client.total / summary.totalAmount) * 100)
                : 0;
              return (
                <div key={client.clientId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 truncate">{client.clientName}</span>
                    <span className="text-gray-600 shrink-0 mr-2">
                      {formatCurrency(client.total)}
                      <span className="text-gray-400 text-xs"> ({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
