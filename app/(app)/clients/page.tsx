'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Sheet from '@/components/shared/Sheet';
import ClientsList from '@/components/clients/ClientsList';
import ClientSheet from '@/components/clients/ClientSheet';
import type { Client } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function handleSaved(saved: Client) {
    setClients(prev => {
      const list = prev ?? [];
      const exists = list.some(c => c.id === saved.id);
      const next = exists ? list.map(c => (c.id === saved.id ? saved : c)) : [...list, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/clients/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || 'שגיאה במחיקה'); return; }
      setClients(prev =>
        data.deleted
          ? (prev ?? []).filter(c => c.id !== deleteConfirm.id)
          : (prev ?? []).map(c => (c.id === deleteConfirm.id ? { ...c, is_active: false } : c))
      );
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="לקוחות"
        subtitle={clients ? `${clients.filter(c => c.is_active).length} פעילים` : undefined}
        backHref="/more"
        action={
          <button onClick={() => { setEditClient(null); setSheetOpen(true); }} className="wm-btn wm-btn-brass">
            <Plus size={18} aria-hidden="true" /> לקוח חדש
          </button>
        }
      />

      {clients === null ? (
        <div className="p-4 space-y-3" aria-busy="true" aria-label="טוען">
          {[1, 2, 3].map(i => <div key={i} className="wm-card h-24 animate-pulse" />)}
        </div>
      ) : (
        <ClientsList
          clients={clients}
          onEdit={c => { setEditClient(c); setSheetOpen(true); }}
          onDelete={c => { setDeleteError(''); setDeleteConfirm(c); }}
        />
      )}

      <ClientSheet open={sheetOpen} client={editClient} onClose={() => setSheetOpen(false)} onSaved={handleSaved} />

      <Sheet
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="מחיקת לקוח"
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
          למחוק את &quot;{deleteConfirm?.name}&quot;? אם יש לו רשומות עבודה, הוא רק יסומן כלא פעיל.
        </p>
        {deleteError && <p role="alert" className="wm-error">{deleteError}</p>}
      </Sheet>
    </>
  );
}
