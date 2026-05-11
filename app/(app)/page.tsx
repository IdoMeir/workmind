'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { MonthlySummary, YearProgress, WorkEntry, Client, MonthlyInsight } from '@/types';
import { getCurrentMonthYear, formatHebrewMonthYear } from '@/lib/hebrew-format';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import RecentEntries from '@/components/dashboard/RecentEntries';
import QuickActions from '@/components/dashboard/QuickActions';
import YearCeilingProgress from '@/components/shared/YearCeilingProgress';
import AIInsightCard from '@/components/dashboard/AIInsightCard';
import QuickAddHoursDialog from '@/components/entries/QuickAddHoursDialog';
import QuickAddEventDialog from '@/components/entries/QuickAddEventDialog';

export default function DashboardPage() {
  const { month, year } = getCurrentMonthYear();
  // Show insights for the previous month (previous month is complete)
  const insightMonth = month === 1 ? 12 : month - 1;
  const insightYear = month === 1 ? year - 1 : year;

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [progress, setProgress] = useState<YearProgress | null>(null);
  const [recentEntries, setRecentEntries] = useState<WorkEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [insight, setInsight] = useState<MonthlyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHours, setShowHours] = useState(false);
  const [showEvent, setShowEvent] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, progressRes, entriesRes, clientsRes, insightRes] = await Promise.all([
        fetch(`/api/monthly-summary?year=${year}&month=${month}`),
        fetch(`/api/year-progress?year=${year}`),
        fetch(`/api/entries?year=${year}&month=${month}`),
        fetch('/api/clients'),
        fetch(`/api/ai/monthly-analysis/cached?year=${insightYear}&month=${insightMonth}`),
      ]);
      const [summaryData, progressData, entriesData, clientsData, insightData] = await Promise.all([
        summaryRes.json(),
        progressRes.json(),
        entriesRes.json(),
        clientsRes.json(),
        insightRes.ok ? insightRes.json() : Promise.resolve(null),
      ]);
      setSummary(summaryData);
      setProgress(progressData);
      setRecentEntries(Array.isArray(entriesData) ? entriesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setInsight(insightData);
    } finally {
      setLoading(false);
    }
  }, [year, month, insightYear, insightMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleEntryAdded(entry: WorkEntry) {
    setRecentEntries(prev => [entry, ...prev]);
    // Reload summary and progress to reflect new entry
    loadData();
  }

  const monthLabel = formatHebrewMonthYear(month, year);

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">WorkMind</h1>
          <p className="text-sm text-gray-400">{monthLabel}</p>
        </div>
        <Link href="/settings" className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
          <Settings size={20} />
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-32 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 h-24 animate-pulse" />
          </>
        ) : (
          <>
            {summary && <DashboardMetrics summary={summary} monthLabel={monthLabel} />}
            {progress && <YearCeilingProgress progress={progress} />}
          </>
        )}

        {!loading && (
          <AIInsightCard
            insight={insight}
            year={insightYear}
            month={insightMonth}
            onInsightReady={setInsight}
          />
        )}

        <QuickActions
          onAddHours={() => setShowHours(true)}
          onAddEvent={() => setShowEvent(true)}
        />

        {!loading && recentEntries.length > 0 && (
          <RecentEntries entries={recentEntries} />
        )}
      </div>

      <QuickAddHoursDialog
        open={showHours}
        onClose={() => setShowHours(false)}
        onAdd={handleEntryAdded}
        clients={clients}
      />
      <QuickAddEventDialog
        open={showEvent}
        onClose={() => setShowEvent(false)}
        onAdd={handleEntryAdded}
        clients={clients}
      />
    </>
  );
}
