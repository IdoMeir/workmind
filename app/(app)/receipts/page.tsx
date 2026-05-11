'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency, formatHebrewDate, formatHebrewMonthYear } from '@/lib/hebrew-format';
import type { Receipt } from '@/types';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<(Receipt & { client?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/receipts')
      .then(r => r.json())
      .then(data => { setReceipts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="קבלות" />

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
            ))}
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <div className="font-medium text-gray-600">אין קבלות עדיין</div>
            <div className="text-sm mt-1">הפק קבלה ממסך הסיכום החודשי</div>
          </div>
        ) : (
          receipts.map(receipt => (
            <Link
              key={receipt.id}
              href={`/receipts/${receipt.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition-all active:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900">
                    {receipt.client?.name ?? receipt.client_snapshot.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {formatHebrewMonthYear(receipt.period_month, receipt.period_year)}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-bold text-indigo-700">{formatCurrency(receipt.total_amount)}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{receipt.receipt_number}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                הופקה: {formatHebrewDate(receipt.issue_date)}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
