'use client';

import type { Client } from '@/types';
import ClientCard from './ClientCard';

interface ClientsListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientsList({ clients, onEdit, onDelete }: ClientsListProps) {
  const active = clients.filter(c => c.is_active);
  const inactive = clients.filter(c => !c.is_active);

  if (clients.length === 0) {
    return (
      <p className="p-8 text-center text-[15px] text-text-mute">
        אין לקוחות עדיין. &quot;לקוח חדש&quot; למעלה מוסיף אחד.
      </p>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {active.length > 0 && (
        <div className="space-y-3">
          {active.map(client => <ClientCard key={client.id} client={client} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
      {inactive.length > 0 && (
        <section aria-labelledby="clients-inactive">
          <h2 id="clients-inactive" className="text-[13px] text-text-mute mb-2 px-1">לא פעילים</h2>
          <div className="space-y-3">
            {inactive.map(client => <ClientCard key={client.id} client={client} onEdit={onEdit} onDelete={onDelete} />)}
          </div>
        </section>
      )}
    </div>
  );
}
