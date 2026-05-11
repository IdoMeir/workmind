'use client';

import { formatCurrency } from '@/lib/hebrew-format';
import { getCreditPointsForUser } from '@/lib/tax-calculator';
import type { UserSettings } from '@/types';

interface Props {
  settings: UserSettings;
  businessIncome: number;
  salaryIncome: number;
  onSalaryChange: (v: number) => void;
}

export default function TaxInputsCard({ settings, businessIncome, salaryIncome, onSalaryChange }: Props) {
  const baseCredits = getCreditPointsForUser(settings.gender, 0);
  const totalCredits = getCreditPointsForUser(settings.gender, settings.extra_credit_points);
  const hasSettlement = !!settings.settlement_name && settings.settlement_credit_rate > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h2 className="font-semibold text-gray-900">נתוני קלט</h2>

      <div className="space-y-3">
        {/* Business income — read-only from year progress */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">הכנסה מהעסק (שנתי עד כה)</span>
          <span className="font-semibold text-gray-900">{formatCurrency(businessIncome)}</span>
        </div>

        {/* Salary income — editable */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">הכנסה ממשכורת (שכיר)</label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₪</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={salaryIncome || ''}
              onChange={e => onSalaryChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Credit points */}
        <div className="flex justify-between items-center py-2 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <div>נקודות זיכוי</div>
            <div className="text-xs text-gray-400">
              בסיס {baseCredits}
              {settings.extra_credit_points > 0 && ` + ${settings.extra_credit_points} נוספות`}
            </div>
          </div>
          <span className="font-semibold text-gray-900">{totalCredits} נקודות</span>
        </div>

        {/* Settlement */}
        {hasSettlement && (
          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <div>ישוב מוטב</div>
              <div className="text-xs text-gray-400">{settings.settlement_name}</div>
            </div>
            <span className="font-semibold text-green-700">
              {(settings.settlement_credit_rate * 100).toFixed(0)}% עד {formatCurrency(settings.settlement_ceiling)}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        לשינוי פרטי המס (מין, נקודות זיכוי, ישוב מוטב) — עדכן בהגדרות.
      </p>
    </div>
  );
}
