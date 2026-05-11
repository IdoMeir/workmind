'use client';

import { useState, useEffect } from 'react';
import { Client, WorkEntry } from '@/types';
import { X } from 'lucide-react';
import { todayISO } from '@/lib/hebrew-format';

interface QuickAddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: WorkEntry) => void;
  clients: Client[];
}

export default function QuickAddEventDialog({ open, onClose, onAdd, clients }: QuickAddEventDialogProps) {
  const activeClients = clients.filter(c => c.is_active);

  const [eventName, setEventName] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derive at render time so single-client default works even when clients prop
  // arrives after the dialog opens.
  const effectiveClientId = activeClients.length === 1 ? activeClients[0].id : clientId;

  useEffect(() => {
    if (open) {
      setEventName('');
      setClientId('');
      setDescription('');
      setCustomAmount('');
      setShowCustom(false);
      setError('');
      setDate(todayISO());
    }
  }, [open]);

  if (!open) return null;

  const selectedClient = activeClients.find(c => c.id === effectiveClientId);
  const previewAmount = customAmount
    ? parseFloat(customAmount)
    : selectedClient?.event_rate ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!effectiveClientId) { setError('בחר לקוח'); return; }
    if (!eventName.trim()) { setError('הכנס שם אירוע'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: 'event',
          client_id: effectiveClientId,
          entry_date: date,
          event_name: eventName.trim(),
          description: description.trim() || null,
          ...(customAmount ? { custom_amount: parseFloat(customAmount) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      onAdd(data);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog: flex column, capped height so it never grows behind the keyboard */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90dvh] sm:max-h-[85vh]">

        {/* Header — always visible */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-semibold">הוסף אירוע</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable fields */}
        <form id="add-event-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 space-y-3 pb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם האירוע *</label>
            <input
              type="text"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="חתונה / כנס / יום הולדת"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">לקוח *</label>
            {activeClients.length === 1 ? (
              <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                {activeClients[0].name}
              </div>
            ) : (
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">בחר לקוח...</option>
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערה</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="רשות"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCustom(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {showCustom ? 'הסתר' : 'שנה סכום ידנית'}
          </button>

          {showCustom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סכום ידני (₪)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {previewAmount !== null && (
            <div className="bg-purple-50 rounded-lg px-3 py-2 text-sm text-purple-700 font-medium">
              סכום: ₪{previewAmount.toLocaleString()}
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>

        {/* Save button — always visible above keyboard */}
        <div className="shrink-0 px-5 pt-3 pb-5">
          <button
            type="submit"
            form="add-event-form"
            disabled={loading}
            className="w-full bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
