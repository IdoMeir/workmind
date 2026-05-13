'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/hebrew-format';
import type { ClientMonthlySummary } from '@/types';

interface LineItemDisplay {
  description: string;
  total: number;
  eventName?: string; // original event name for AI suggestion
  isEditable: boolean;
  index: number;
}

interface Props {
  clientSummary: ClientMonthlySummary;
  clientId: string;
  year: number;
  month: number;
  hourlyRate: number | null;
  onClose: () => void;
  onSuccess: (receiptId: string) => void;
}

export default function GenerateReceiptDialog({
  clientSummary,
  clientId,
  year,
  month,
  hourlyRate,
  onClose,
  onSuccess,
}: Props) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Build editable line items
  const initialItems: LineItemDisplay[] = [];
  if (clientSummary.totalHours > 0 && hourlyRate) {
    initialItems.push({
      description: `שעות עבודה — ${clientSummary.totalHours} שעות`,
      total: clientSummary.hoursAmount,
      isEditable: false,
      index: initialItems.length,
    });
  }
  for (const entry of clientSummary.entries) {
    if (entry.entry_type === 'event') {
      initialItems.push({
        description: entry.event_name || 'אירוע',
        total: entry.amount,
        eventName: entry.event_name || undefined,
        isEditable: true,
        index: initialItems.length,
      });
    }
  }

  const [items, setItems] = useState<LineItemDisplay[]>(initialItems);
  const [suggestingIndex, setSuggestingIndex] = useState<number | null>(null);

  const total = items.reduce((s, i) => s + i.total, 0);

  function updateDescription(index: number, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, description: value } : item));
  }

  async function suggestDescription(index: number, eventName: string) {
    setSuggestingIndex(index);
    try {
      const res = await fetch('/api/ai/suggest-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: eventName }),
      });
      if (res.ok) {
        const data = await res.json();
        updateDescription(index, data.suggestion);
      }
    } finally {
      setSuggestingIndex(null);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      // Build custom_line_items from current descriptions
      const customLineItems = (() => {
        const result = [];
        let hoursIdx = 0;
        let eventIdx = 0;
        for (const item of items) {
          if (!item.isEditable) {
            // hours line
            result.push({
              description: item.description,
              quantity: clientSummary.totalHours,
              unit_price: hourlyRate!,
              total: item.total,
            });
            hoursIdx++;
          } else {
            // event lines
            const entry = clientSummary.entries.filter(e => e.entry_type === 'event')[eventIdx];
            result.push({
              description: item.description,
              quantity: 1,
              unit_price: entry?.amount ?? item.total,
              total: item.total,
            });
            eventIdx++;
          }
        }
        return result;
      })();

      const res = await fetch('/api/receipts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          year,
          month,
          notes: notes || undefined,
          custom_line_items: customLineItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה ביצירת הקבלה');
        return;
      }
      onSuccess(data.id);
    } catch {
      setError('שגיאת רשת');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 pb-above-nav sm:pb-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">הפקת קבלה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Client name */}
          <div>
            <div className="text-sm text-gray-500 mb-1">לקוח</div>
            <div className="font-semibold text-gray-900">{clientSummary.clientName}</div>
          </div>

          {/* Line items — editable descriptions for events */}
          <div>
            <div className="text-sm text-gray-500 mb-2">פירוט</div>
            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {items.map((item, i) => (
                <div key={i} className="px-3 py-2.5">
                  {item.isEditable ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          value={item.description}
                          onChange={e => updateDescription(i, e.target.value)}
                          className="flex-1 text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                        {item.eventName && (
                          <button
                            onClick={() => suggestDescription(i, item.eventName!)}
                            disabled={suggestingIndex === i}
                            title="הצע תיאור מקצועי"
                            className="p-1 text-purple-500 hover:text-purple-700 disabled:opacity-40 transition-colors"
                          >
                            <Sparkles size={14} />
                          </button>
                        )}
                      </div>
                      <div className="text-left text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center px-3 py-2.5 bg-gray-50">
                <span className="font-bold text-gray-900">סה&quot;כ</span>
                <span className="font-bold text-indigo-700">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הערות (אופציונלי)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="הערות לקבלה..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'מפיק...' : 'הפק קבלה'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
