'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AIInsightCard from '@/components/dashboard/AIInsightCard';
import { formatHebrewMonthYear, getCurrentMonthYear } from '@/lib/hebrew-format';
import type { MonthlyInsight } from '@/types';

/** ניתוח AI של החודש הקודם — עבר מהמסך הראשי ל"עוד" (מפרט סעיפים 0, 10). */
export default function InsightsPage() {
  const { month, year } = getCurrentMonthYear();
  const insightMonth = month === 1 ? 12 : month - 1;
  const insightYear = month === 1 ? year - 1 : year;

  const [insight, setInsight] = useState<MonthlyInsight | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/ai/monthly-analysis/cached?year=${insightYear}&month=${insightMonth}`)
      .then(r => (r.ok ? r.json() : null))
      .then(setInsight)
      .catch(() => setInsight(null));
  }, [insightYear, insightMonth]);

  return (
    <>
      <PageHeader title="ניתוח חודשי" subtitle={formatHebrewMonthYear(insightMonth, insightYear)} backHref="/more" />
      <div className="p-4">
        {insight === undefined ? (
          <div className="wm-card h-40 animate-pulse" aria-busy="true" aria-label="טוען" />
        ) : (
          <AIInsightCard insight={insight} year={insightYear} month={insightMonth} onInsightReady={setInsight} />
        )}
      </div>
    </>
  );
}
