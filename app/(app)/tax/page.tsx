'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import TaxInputsCard from '@/components/tax/TaxInputsCard';
import TaxBreakdownTable from '@/components/tax/TaxBreakdownTable';
import TaxSummaryCard from '@/components/tax/TaxSummaryCard';
import {
  calculateTotalTaxLiability,
  getCreditPointsForUser,
  TAX_YEAR,
} from '@/lib/tax-calculator';
import type { UserSettings, YearProgress, TaxSummary } from '@/types';

export default function TaxPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [yearProgress, setYearProgress] = useState<YearProgress | null>(null);
  const [salaryIncome, setSalaryIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch(`/api/year-progress?year=${year}`).then(r => r.json()),
    ]).then(([s, p]) => {
      setSettings(s);
      setYearProgress(p);
      if (s?.salary_annual_income) setSalaryIncome(s.salary_annual_income);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const taxSummary = useMemo<TaxSummary | null>(() => {
    if (!settings || !yearProgress) return null;
    const creditPoints = getCreditPointsForUser(settings.gender, settings.extra_credit_points);
    return calculateTotalTaxLiability({
      businessIncome: yearProgress.yearTotal,
      salaryIncome,
      creditPoints,
      settlementCreditRate: settings.settlement_credit_rate,
      settlementCeiling: settings.settlement_ceiling,
    });
  }, [settings, yearProgress, salaryIncome]);

  if (loading) {
    return (
      <>
        <PageHeader title={`מחשבון מס ${TAX_YEAR}`} />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <PageHeader title={`מחשבון מס ${TAX_YEAR}`} />
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-semibold text-yellow-800 mb-1">נדרשות הגדרות</div>
            <p className="text-sm text-yellow-700 mb-4">
              כדי לחשב את המס יש למלא את פרטי הפרופיל תחילה.
            </p>
            <Link
              href="/settings"
              className="inline-block bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              עבור להגדרות
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`מחשבון מס ${TAX_YEAR}`} />
      <div className="p-4 space-y-4">
        <TaxInputsCard
          settings={settings}
          businessIncome={yearProgress?.yearTotal ?? 0}
          salaryIncome={salaryIncome}
          onSalaryChange={setSalaryIncome}
        />

        {taxSummary && (
          <>
            <TaxSummaryCard summary={taxSummary} />
            <TaxBreakdownTable summary={taxSummary} />
          </>
        )}
      </div>
    </>
  );
}
