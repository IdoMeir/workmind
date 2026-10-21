'use client';

import { formatCurrency, formatHebrewDate, formatHebrewMonthYear } from '@/lib/hebrew-format';
import type { Receipt } from '@/types';

interface Props {
  receipt: Receipt;
}

/**
 * קבלה שהוצאה — לקריאה ולהדפסה בלבד. אין עריכה ואין מחיקה (NEVER #2).
 * על המסך: טוקנים כהים. בהדפסה: שחור על לבן (globals.css, .receipt-print).
 */
export default function ReceiptPrintView({ receipt }: Props) {
  const phone = (receipt.user_snapshot as { phone?: string }).phone;

  return (
    <div className="receipt-print wm-card max-w-2xl mx-auto p-6 text-text">
      {receipt.internal_note && (
        <p role="note" className="wm-error mb-4 no-print">הערה פנימית: {receipt.internal_note}</p>
      )}

      <div className="mb-6 border-b border-rule pb-4">
        <div className="wm-title text-[21px]">{receipt.user_snapshot.full_name}</div>
        {receipt.user_snapshot.business_name && <div>{receipt.user_snapshot.business_name}</div>}
        {receipt.user_snapshot.tax_id && (
          <div className="text-[13px] text-text-mute">ת.ז. / ח.פ.: {receipt.user_snapshot.tax_id}</div>
        )}
        {receipt.user_snapshot.address && <div className="text-[13px] text-text-mute">{receipt.user_snapshot.address}</div>}
        {phone && <div className="text-[13px] text-text-mute">טלפון: <bdi>{phone}</bdi></div>}
      </div>

      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="wm-title text-[24px]">קבלה</div>
          <div className="text-[13px] text-text-mute mt-1">
            תקופה: {formatHebrewMonthYear(receipt.period_month, receipt.period_year)}
          </div>
        </div>
        <div className="text-end text-[13px] space-y-1">
          <div>מספר קבלה: <bdi className="wm-num">{receipt.receipt_number}</bdi></div>
          <div>תאריך הפקה: {formatHebrewDate(receipt.issue_date)}</div>
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-rule p-4">
        <div className="text-[13px] text-text-mute mb-1">לכבוד:</div>
        <div className="font-semibold">{receipt.client_snapshot.name}</div>
        {receipt.client_snapshot.contact_info && (
          <div className="text-[13px] text-text-mute mt-0.5">{receipt.client_snapshot.contact_info}</div>
        )}
      </div>

      <table className="w-full mb-6 text-[13px]">
        <thead>
          <tr className="border-b border-rule">
            <th className="text-start pb-2 font-semibold w-1/2">תיאור</th>
            <th className="text-center pb-2 font-semibold">כמות</th>
            <th className="text-center pb-2 font-semibold">מחיר יחידה</th>
            <th className="text-end pb-2 font-semibold">סה&quot;כ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {receipt.line_items.map((item, i) => (
            <tr key={i}>
              <td className="py-2.5">{item.description}</td>
              <td className="py-2.5 text-center">{item.quantity}</td>
              <td className="py-2.5 text-center"><bdi>{formatCurrency(item.unit_price)}</bdi></td>
              <td className="py-2.5 text-end font-semibold"><bdi>{formatCurrency(item.total)}</bdi></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-text pt-3 flex justify-between items-center mb-6">
        <span className="font-semibold text-[17px]">סה&quot;כ לתשלום:</span>
        <bdi className="wm-num text-[24px]">{formatCurrency(Number(receipt.total_amount))}</bdi>
      </div>

      {receipt.notes && (
        <div className="mb-6 text-[13px] rounded-[10px] border border-rule p-3">
          <span className="font-semibold">הערות:</span> {receipt.notes}
        </div>
      )}

      <div className="text-center text-[13px] text-text-mute border-t border-rule pt-4">
        עוסק פטור — פטור מניכוי מע&quot;מ
      </div>

      <div className="mt-6 flex gap-3 no-print">
        <button onClick={() => window.print()} className="wm-btn wm-btn-brass flex-1">הדפס</button>
        <button onClick={() => window.history.back()} className="wm-btn wm-btn-ghost">חזרה</button>
      </div>
    </div>
  );
}
