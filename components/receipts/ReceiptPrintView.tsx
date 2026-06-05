'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { formatCurrency, formatHebrewDate } from '@/lib/hebrew-format';
import type { Receipt } from '@/types';

const HEBREW_MONTHS = [
  'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
  'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר',
];

interface Props {
  receipt: Receipt;
}

export default function ReceiptPrintView({ receipt }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'שגיאה במחיקה');
        return;
      }
      router.push('/receipts');
    } finally {
      setDeleting(false);
    }
  }

  const periodStr = `${HEBREW_MONTHS[receipt.period_month - 1]} ${receipt.period_year}`;

  return (
    <div className="receipt-print bg-white max-w-2xl mx-auto p-8 shadow-lg rounded-xl print:shadow-none print:rounded-none print:p-0">
      {/* Header — provider info */}
      <div className="mb-6 border-b border-gray-300 pb-4">
        <div className="text-xl font-bold text-gray-900">
          {receipt.user_snapshot.full_name}
        </div>
        {receipt.user_snapshot.business_name && (
          <div className="text-gray-700">{receipt.user_snapshot.business_name}</div>
        )}
        {receipt.user_snapshot.tax_id && (
          <div className="text-sm text-gray-600">ת.ז. / ח.פ.: {receipt.user_snapshot.tax_id}</div>
        )}
        {receipt.user_snapshot.address && (
          <div className="text-sm text-gray-600">{receipt.user_snapshot.address}</div>
        )}
        {(receipt.user_snapshot as { phone?: string }).phone && (
          <div className="text-sm text-gray-600">
            טלפון: {(receipt.user_snapshot as { phone?: string }).phone}
          </div>
        )}
      </div>

      {/* Receipt metadata */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="text-2xl font-bold text-gray-900">קבלה</div>
          <div className="text-gray-600 text-sm mt-1">תקופה: {periodStr}</div>
        </div>
        <div className="text-left text-sm text-gray-700 space-y-1">
          <div>
            <span className="font-medium">מספר קבלה:</span>{' '}
            <span className="font-mono">{receipt.receipt_number}</span>
          </div>
          <div>
            <span className="font-medium">תאריך הפקה:</span>{' '}
            {formatHebrewDate(receipt.issue_date)}
          </div>
        </div>
      </div>

      {/* Client info */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-500 mb-1">לכבוד:</div>
        <div className="font-semibold text-gray-900">{receipt.client_snapshot.name}</div>
        {receipt.client_snapshot.contact_info && (
          <div className="text-sm text-gray-600 mt-0.5">{receipt.client_snapshot.contact_info}</div>
        )}
      </div>

      {/* Line items table */}
      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-right pb-2 font-semibold text-gray-700 w-1/2">תיאור</th>
            <th className="text-center pb-2 font-semibold text-gray-700">כמות</th>
            <th className="text-center pb-2 font-semibold text-gray-700">מחיר יחידה</th>
            <th className="text-left pb-2 font-semibold text-gray-700">סה&quot;כ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {receipt.line_items.map((item, i) => (
            <tr key={i}>
              <td className="py-2.5 text-gray-800">{item.description}</td>
              <td className="py-2.5 text-center text-gray-700">{item.quantity}</td>
              <td className="py-2.5 text-center text-gray-700">{formatCurrency(item.unit_price)}</td>
              <td className="py-2.5 text-left font-medium text-gray-900">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="border-t-2 border-gray-900 pt-3 flex justify-between items-center mb-6">
        <span className="font-bold text-gray-900 text-lg">סה&quot;כ לתשלום:</span>
        <span className="font-bold text-indigo-700 text-2xl">{formatCurrency(receipt.total_amount)}</span>
      </div>

      {/* Notes */}
      {receipt.notes && (
        <div className="mb-6 text-sm text-gray-600 bg-yellow-50 rounded-lg p-3">
          <span className="font-medium">הערות:</span> {receipt.notes}
        </div>
      )}

      {/* Osek Patur disclaimer */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
        עוסק פטור — פטור מניכוי מע&quot;מ
      </div>

      {/* Actions — hidden in print */}
      <div className="mt-6 flex gap-3 no-print">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-indigo-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          הדפס ←
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          חזרה
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="מחק קבלה"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Delete confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">מחיקת קבלה</h3>
            <p className="text-sm text-gray-600 mb-1">
              האם למחוק את קבלה מס&apos; <span className="font-mono font-medium">{receipt.receipt_number}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-5">
              הרשומות שהיו מקושרות לקבלה זו יחזרו להיות זמינות להפקה מחדש.
            </p>
            {deleteError && <p className="text-red-600 text-sm mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'מוחק...' : 'מחק קבלה'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
