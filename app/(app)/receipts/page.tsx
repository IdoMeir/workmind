'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import Money from '@/components/shared/Money';
import PaymentSheet, { type PaymentPreset } from '@/components/payments/PaymentSheet';
import { formatHebrewDate, formatHebrewMonthYear } from '@/lib/hebrew-format';
import type { Client, Payment, Receipt } from '@/types';

type ReceiptRow = Receipt & { client?: { name: string } };

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [preset, setPreset] = useState<PaymentPreset | null>(null);

  const load = useCallback(async () => {
    const [r, p, c] = await Promise.all([
      fetch('/api/receipts').then(res => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/api/payments').then(res => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/api/clients').then(res => (res.ok ? res.json() : [])).catch(() => []),
    ]);
    setReceipts(r);
    setPayments(p);
    setClients(c);
  }, []);

  useEffect(() => { load(); }, [load]);

  const recorded = new Set(payments.map(p => p.receipt_id).filter(Boolean));

  return (
    <>
      <PageHeader title="קבלות שהוצאו" subtitle="לצפייה בלבד. קבלות חדשות מופקות בתוכנה רשומה." backHref="/more" />

      <div className="p-4 space-y-3">
        {receipts === null ? (
          <div className="space-y-3" aria-busy="true" aria-label="טוען">
            {[1, 2, 3].map(i => <div key={i} className="wm-card h-24 animate-pulse" />)}
          </div>
        ) : receipts.length === 0 ? (
          <p className="text-[15px] text-text-mute py-8 text-center">לא הוצאו קבלות מבשתי ידיי.</p>
        ) : (
          receipts.map(receipt => (
            <article key={receipt.id} className="wm-card">
              <Link href={`/receipts/${receipt.id}`} className="block px-4 py-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="text-[15px] text-text">{receipt.client?.name ?? receipt.client_snapshot.name}</h2>
                    <p className="text-[13px] text-text-mute">
                      {formatHebrewMonthYear(receipt.period_month, receipt.period_year)} · הוצאה {formatHebrewDate(receipt.issue_date)}
                    </p>
                  </div>
                  <div className="text-end">
                    <Money amount={Number(receipt.total_amount)} className="wm-num text-brass" />
                    <p className="text-[13px] text-text-mute"><bdi>{receipt.receipt_number}</bdi></p>
                  </div>
                </div>
                {receipt.internal_note && (
                  <p className="mt-2 text-[13px] text-alert">הערה פנימית: {receipt.internal_note}</p>
                )}
              </Link>
              <div className="px-4 pb-3">
                {recorded.has(receipt.id) ? (
                  <p className="text-[13px] text-sage min-h-11 flex items-center">נרשם כתקבול</p>
                ) : (
                  <button
                    onClick={() => setPreset({
                      clientId: receipt.client_id,
                      amount: Number(receipt.total_amount),
                      date: receipt.issue_date,
                      receiptId: receipt.id,
                      receiptNumber: receipt.receipt_number,
                    })}
                    className="wm-btn wm-btn-ghost w-full"
                  >
                    רשום כתקבול
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <PaymentSheet
        open={preset !== null}
        onClose={() => setPreset(null)}
        onSaved={() => load()}
        clients={clients}
        preset={preset}
      />
    </>
  );
}
