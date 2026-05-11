'use client';

import { formatCurrency } from '@/lib/hebrew-format';
import type { TaxSummary } from '@/types';

interface Props {
  summary: TaxSummary;
}

export default function TaxBreakdownTable({ summary }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h2 className="font-semibold text-gray-900">פירוט המס</h2>

      {/* Income */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>הכנסה מעסק</span>
          <span>{formatCurrency(summary.businessIncome)}</span>
        </div>
        {summary.salaryIncome > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>הכנסה ממשכורת</span>
            <span>{formatCurrency(summary.salaryIncome)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-100 pt-1.5">
          <span>סה&quot;כ הכנסה</span>
          <span>{formatCurrency(summary.totalIncome)}</span>
        </div>
      </div>

      {/* Brackets */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">מדרגות מס הכנסה</div>
        <div className="space-y-1">
          {summary.incomeTaxBreakdown.map((line, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {(line.rate * 100).toFixed(0)}% על {formatCurrency(line.taxableAmount)}
              </span>
              <span className="text-gray-800">{formatCurrency(line.tax)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-semibold text-gray-800 border-t border-gray-100 pt-2 mt-2">
          <span>מס גולמי</span>
          <span>{formatCurrency(summary.grossIncomeTax)}</span>
        </div>
      </div>

      {/* Credits */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">זיכויים</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-green-700">
            <span>נקודות זיכוי ({summary.creditPoints})</span>
            <span>-{formatCurrency(summary.creditPointsValue)}</span>
          </div>
          {summary.settlementCredit > 0 && (
            <div className="flex justify-between text-green-700">
              <span>זיכוי ישוב מוטב</span>
              <span>-{formatCurrency(summary.settlementCredit)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
          <span>מס הכנסה לתשלום</span>
          <span>{formatCurrency(summary.netIncomeTax)}</span>
        </div>
      </div>

      {/* National Insurance */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">ביטוח לאומי לעצמאי</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>7.7% על {formatCurrency(summary.nationalInsurance.reducedRateAmount)}</span>
            <span>{formatCurrency(summary.nationalInsurance.reducedRateTax)}</span>
          </div>
          {summary.nationalInsurance.fullRateAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>18% על {formatCurrency(summary.nationalInsurance.fullRateAmount)}</span>
              <span>{formatCurrency(summary.nationalInsurance.fullRateTax)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
          <span>סה&quot;כ ביטוח לאומי</span>
          <span>{formatCurrency(summary.nationalInsurance.total)}</span>
        </div>
      </div>
    </div>
  );
}
