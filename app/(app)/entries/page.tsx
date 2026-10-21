'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { WorkEntry, Client } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import Sheet from '@/components/shared/Sheet';
import Money from '@/components/shared/Money';
import EntriesList from '@/components/entries/EntriesList';
import EditEntryDialog from '@/components/entries/EditEntryDialog';
import QuickAddHoursDialog from '@/components/entries/QuickAddHoursDialog';
import QuickAddEventDialog from '@/components/entries/QuickAddEventDialog';
import { formatHebrewDate, formatHebrewMonthYear, getCurrentMonthYear } from '@/lib/hebrew-format';

export default function EntriesPage() {
  const now = getCurrentMonthYear();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [entries, setEntries] = useState<WorkEntry[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [editEntry, setEditEntry] = useState<WorkEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showHours, setShowHours] = useState(false);
  const [showEvent, setShowEvent] = useState(false);

  const fetchEntries = useCallback(async () => {
    setEntries(null);
    try {
      const res = await fetch(`/api/entries?year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    }
  }, [year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => setClients([]));
  }, []);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/entries/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || 'שגיאה במחיקה'); return; }
      setEntries(prev => (prev ?? []).filter(e => e.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const monthTotal = (entries ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <PageHeader
        title="רשומות העסק"
        backHref="/more"
        action={
          <div className="flex gap-1">
            <button onClick={() => setShowHours(true)} className="wm-btn wm-btn-brass px-3">
              <Plus size={16} aria-hidden="true" /> שעות
            </button>
            <button onClick={() => setShowEvent(true)} className="wm-btn wm-btn-ghost px-3">
              <Plus size={16} aria-hidden="true" /> אירוע
            </button>
          </div>
        }
      />

      <div className="flex items-center justify-between px-2 py-2 border-b border-rule">
        <button onClick={prevMonth} aria-label="החודש הקודם" className="wm-btn text-text-mute">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="wm-title text-[17px]">{formatHebrewMonthYear(month, year)}</p>
          {entries && <p className="text-[13px] text-text-mute"><Money amount={monthTotal} /></p>}
        </div>
        <button onClick={nextMonth} aria-label="החודש הבא" className="wm-btn text-text-mute">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="pt-3">
        {entries === null ? (
          <div className="px-4 space-y-2" aria-busy="true" aria-label="טוען">
            {[1, 2, 3, 4].map(i => <div key={i} className="wm-card h-14 animate-pulse" />)}
          </div>
        ) : (
          <EntriesList entries={entries} onEdit={setEditEntry} onDelete={e => { setDeleteError(''); setDeleteConfirm(e); }} />
        )}
      </div>

      <EditEntryDialog
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={updated => setEntries(prev => (prev ?? []).map(e => (e.id === updated.id ? updated : e)))}
      />
      <QuickAddHoursDialog open={showHours} onClose={() => setShowHours(false)} onAdd={() => fetchEntries()} clients={clients} />
      <QuickAddEventDialog open={showEvent} onClose={() => setShowEvent(false)} onAdd={() => fetchEntries()} clients={clients} />

      <Sheet
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="מחיקת רשומה"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="wm-btn wm-btn-ghost flex-1">ביטול</button>
            <button onClick={handleDeleteConfirm} disabled={deleteLoading} className="wm-btn wm-btn-danger flex-1">
              {deleteLoading ? 'מוחק…' : 'מחק'}
            </button>
          </div>
        }
      >
        <p className="text-[15px]">
          למחוק את הרשומה מ-{deleteConfirm ? formatHebrewDate(deleteConfirm.entry_date) : ''}?
        </p>
        {deleteError && <p role="alert" className="wm-error">{deleteError}</p>}
      </Sheet>
    </>
  );
}
