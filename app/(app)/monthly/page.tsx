'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import MonthlySummaryTable from '@/components/receipts/MonthlySummaryTable';
import GenerateReceiptDialog from '@/components/receipts/GenerateReceiptDialog';
import { formatCurrency, formatHebrewMonthYear, getCurrentMonthYear } from '@/lib/hebrew-format';
import type { MonthlySummary, Client } from '@/types';

export default function MonthlyPage() {
  const router = useRouter();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogClientId, setDialogClientId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [summaryRes, clientsRes] = await Promise.all([
      fetch(`/api/monthly-summary?year=${year}&month=${month}`),
      fetch('/api/clients'),
    ]);
    if (summaryRes.ok) setSummary(await summaryRes.json());
    if (clientsRes.ok) setClients(await clientsRes.json());
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }
  const isCurrentMonth = year === currentYear && month === currentMonth;

  const dialogClientSummary = summary?.byClient.find(c => c.clientId === dialogClientId) ?? null;
  const dialogClient = clients.find(c => c.id === dialogClientId) ?? null;

  return (
    <>
      <PageHeader title="סיכום חודשי" />

      <div className="p-4 space-y-4">
        {/* Month navigator */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
          <button onClick={prevMonth} className="text-gray-500 hover:text-gray-800 text-xl px-2">→</button>
          <span className="font-semibold text-gray-900">{formatHebrewMonthYear(month, year)}</span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-xl px-2"
          >
            ←
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Total card */}
            {summary && summary.byClient.length > 0 && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 px-5 py-4 flex justify-between items-center">
                <span className="text-indigo-800 font-medium">סה&quot;כ החודש</span>
                <span className="text-2xl font-bold text-indigo-700">{formatCurrency(summary.totalAmount)}</span>
              </div>
            )}

            <MonthlySummaryTable
              clientSummaries={summary?.byClient ?? []}
              onGenerateReceipt={(cid) => setDialogClientId(cid)}
            />
          </>
        )}
      </div>

      {dialogClientId && dialogClientSummary && dialogClient && (
        <GenerateReceiptDialog
          clientSummary={dialogClientSummary}
          clientId={dialogClientId}
          year={year}
          month={month}
          hourlyRate={dialogClient.hourly_rate}
          onClose={() => setDialogClientId(null)}
          onSuccess={(receiptId) => {
            setDialogClientId(null);
            router.push(`/receipts/${receiptId}`);
          }}
        />
      )}
    </>
  );
}
