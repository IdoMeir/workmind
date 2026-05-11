'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkEntry, Client } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import EntriesList from '@/components/entries/EntriesList';
import EditEntryDialog from '@/components/entries/EditEntryDialog';
import QuickAddHoursDialog from '@/components/entries/QuickAddHoursDialog';
import QuickAddEventDialog from '@/components/entries/QuickAddEventDialog';
import { formatCurrency, formatHebrewMonth, getCurrentMonthYear } from '@/lib/hebrew-format';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';

export default function EntriesPage() {
  const now = getCurrentMonthYear();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEntry, setEditEntry] = useState<WorkEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showEvent, setShowEvent] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
  }, []);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function handleSave(updated: WorkEntry) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  function handleAdded(entry: WorkEntry) {
    // Re-fetch to get the right date ordering
    fetchEntries();
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/entries/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== deleteConfirm.id));
        setDeleteConfirm(null);
      } else {
        alert(data.error || 'שגיאה במחיקה');
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  const monthTotal = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <PageHeader
        title="רשומות עבודה"
        action={
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowHours(true)}
              className="bg-blue-600 text-white px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-blue-700"
            >
              <Plus size={14} className="inline ml-0.5" />שעות
            </button>
            <button
              onClick={() => setShowEvent(true)}
              className="bg-purple-600 text-white px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-purple-700"
            >
              <Plus size={14} className="inline ml-0.5" />אירוע
            </button>
          </div>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronRight size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {formatHebrewMonth(month)} {year}
          </p>
          {!loading && (
            <p className="text-xs text-gray-400">{formatCurrency(monthTotal)}</p>
          )}
        </div>
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={18} />
        </button>
      </div>

      {loading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-white rounded-lg border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="pt-2">
          <EntriesList
            entries={entries}
            onEdit={setEditEntry}
            onDelete={setDeleteConfirm}
          />
        </div>
      )}

      <EditEntryDialog
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={handleSave}
      />

      <QuickAddHoursDialog
        open={showHours}
        onClose={() => setShowHours(false)}
        onAdd={handleAdded}
        clients={clients}
      />
      <QuickAddEventDialog
        open={showEvent}
        onClose={() => setShowEvent(false)}
        onAdd={handleAdded}
        clients={clients}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">מחיקת רשומה</h3>
            <p className="text-sm text-gray-600 mb-4">
              למחוק את הרשומה ב-{deleteConfirm.entry_date}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {deleteLoading ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
