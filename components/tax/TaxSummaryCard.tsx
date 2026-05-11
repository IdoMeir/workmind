'use client';

import { formatCurrency } from '@/lib/hebrew-format';
import type { TaxSummary } from '@/types';

interface Props {
  summary: TaxSummary;
}

export default function TaxSummaryCard({ summary }: Props) {
  const effectiveRate = summary.totalIncome > 0
    ? ((summary.totalAnnualTax / summary.totalIncome) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-indigo-700 font-medium">חבות שנתית מוערכת</div>
          <div className="text-3xl font-bold text-indigo-900 mt-1">
            {formatCurrency(summary.totalAnnualTax)}
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs text-indigo-500">שיעור מס אפקטיבי</div>
          <div className="text-xl font-bold text-indigo-800">{effectiveRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-0.5">מס הכנסה</div>
          <div className="font-bold text-gray-900">{formatCurrency(summary.netIncomeTax)}</div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-0.5">ביטוח לאומי</div>
          <div className="font-bold text-gray-900">{formatCurrency(summary.nationalInsurance.total)}</div>
        </div>
      </div>

      <p className="mt-4 text-xs text-indigo-600 leading-relaxed">
        * זהו חישוב הערכה בלבד. הנתונים מבוססים על מדרגות המס לשנת 2026.
        מומלץ להיוועץ ברואה חשבון לחישוב מדויק.
      </p>
    </div>
  );
}
