'use client';

import { useState, useEffect } from 'react';
import { Client, WorkEntry, RatePreset } from '@/types';
import { X } from 'lucide-react';
import { todayISO } from '@/lib/hebrew-format';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface QuickAddHoursDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: WorkEntry) => void;
  clients: Client[];
}

function parseTimeToMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function calcHoursFromRange(from: string, to: string): number | null {
  const fromMin = parseTimeToMinutes(from);
  const toMin = parseTimeToMinutes(to);
  if (fromMin === null || toMin === null) return null;
  let diff = toMin - fromMin;
  if (diff <= 0) diff += 24 * 60; // crosses midnight
  const rounded = Math.round(diff / 15) * 0.25; // nearest 0.25h
  return Math.max(0.25, Math.min(24, rounded));
}

function getPresets(client: Client | undefined): RatePreset[] {
  return client?.rate_presets?.filter(p => p.type === 'hourly') ?? [];
}

export default function QuickAddHoursDialog({ open, onClose, onAdd, clients }: QuickAddHoursDialogProps) {
  const activeClients = clients.filter(c => c.is_active);
  const vvh = useVisualViewport();

  const [hours, setHours] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveClientId = activeClients.length === 1 ? activeClients[0].id : clientId;
  const selectedClient = activeClients.find(c => c.id === effectiveClientId);
  const presets = getPresets(selectedClient);

  // When both time fields are filled, auto-compute hours
  useEffect(() => {
    if (timeFrom && timeTo) {
      const computed = calcHoursFromRange(timeFrom, timeTo);
      if (computed !== null) setHours(computed.toString());
    }
  }, [timeFrom, timeTo]);

  // Reset selected preset when client changes
  useEffect(() => {
    setSelectedPreset('');
  }, [effectiveClientId]);

  useEffect(() => {
    if (open) {
      setHours('');
      setTimeFrom('');
      setTimeTo('');
      setClientId('');
      setDescription('');
      setCustomAmount('');
      setShowCustom(false);
      setSelectedPreset('');
      setError('');
      setDate(todayISO());
    }
  }, [open]);

  if (!open) return null;

  // Rate preview
  const hoursNum = parseFloat(hours) || 0;
  const activePreset = presets.find(p => p.name === selectedPreset);
  const effectiveRate = activePreset ? activePreset.rate : (selectedClient?.hourly_rate ?? null);
  const previewAmount = customAmount
    ? parseFloat(customAmount)
    : effectiveRate && hoursNum
    ? Math.round(hoursNum * effectiveRate * 100) / 100
    : null;

  // Dialog height: JS-measured or CSS fallback
  const dialogStyle = vvh > 0 ? { maxHeight: `${Math.floor(vvh * 0.92)}px` } : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!effectiveClientId) { setError('בחר לקוח'); return; }
    if (!hours || parseFloat(hours) <= 0) { setError('הכנס מספר שעות'); return; }

    // Build description: prepend time range if used
    let desc = description.trim();
    if (timeFrom && timeTo) {
      const timeLabel = `${timeFrom}–${timeTo}`;
      desc = desc ? `${timeLabel} | ${desc}` : timeLabel;
    }

    // Compute custom_amount from preset if selected
    const resolvedCustomAmount = customAmount
      ? parseFloat(customAmount)
      : activePreset
      ? Math.round(parseFloat(hours) * activePreset.rate * 100) / 100
      : undefined;

    setLoading(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: 'hours',
          client_id: effectiveClientId,
          entry_date: date,
          hours: parseFloat(hours),
          description: desc || null,
          ...(resolvedCustomAmount !== undefined ? { custom_amount: resolvedCustomAmount } : {}),
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

      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
        style={dialogStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-semibold">הוסף שעות</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable fields */}
        <form id="add-hours-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 space-y-3 pb-2">

          {/* Time range — optional, auto-fills hours */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">משעה</label>
              <input
                type="time"
                value={timeFrom}
                onChange={e => setTimeFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">עד שעה</label>
              <input
                type="time"
                value={timeTo}
                onChange={e => setTimeTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שעות *</label>
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              value={hours}
              onChange={e => setHours(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              placeholder="2.5"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר לקוח...</option>
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Rate preset selector — shown only when client has hourly presets */}
          {presets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תעריף</label>
              <select
                value={selectedPreset}
                onChange={e => setSelectedPreset(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedClient?.hourly_rate && (
                  <option value="">ברירת מחדל — ₪{selectedClient.hourly_rate}/שעה</option>
                )}
                {presets.map(p => (
                  <option key={p.name} value={p.name}>{p.name} — ₪{p.rate}/שעה</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערה</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {previewAmount !== null && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">
              סכום מחושב: ₪{previewAmount.toLocaleString()}
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>

        {/* Save button — always above keyboard */}
        <div className="shrink-0 px-5 pt-3 pb-5">
          <button
            type="submit"
            form="add-hours-form"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
