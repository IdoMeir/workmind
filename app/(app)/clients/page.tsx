'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ClientsList from '@/components/clients/ClientsList';
import AddClientDialog from '@/components/clients/AddClientDialog';
import EditClientDialog from '@/components/clients/EditClientDialog';
import { Client } from '@/types';
import { Plus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function handleAdd(client: Client) {
    setClients(prev => [...prev, client].sort((a, b) => a.name.localeCompare(b.name, 'he')));
  }

  function handleSave(updated: Client) {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        if (data.deleted) {
          setClients(prev => prev.filter(c => c.id !== deleteConfirm.id));
        } else {
          // deactivated
          setClients(prev => prev.map(c =>
            c.id === deleteConfirm.id ? { ...c, is_active: false } : c
          ));
        }
        setDeleteConfirm(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="לקוחות"
        subtitle={loading ? '' : `${clients.filter(c => c.is_active).length} פעילים`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            לקוח חדש
          </button>
        }
      />

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <ClientsList
          clients={clients}
          onEdit={setEditClient}
          onDelete={setDeleteConfirm}
        />
      )}

      <AddClientDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />

      <EditClientDialog
        client={editClient}
        onClose={() => setEditClient(null)}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">מחיקת לקוח</h3>
            <p className="text-sm text-gray-600 mb-4">
              {`האם למחוק את "${deleteConfirm.name}"?`}
              {' '}אם יש רשומות עבודה משויכות, הלקוח יסומן כלא פעיל.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
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
