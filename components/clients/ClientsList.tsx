'use client';

import { Client } from '@/types';
import ClientCard from './ClientCard';
import { Users } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Users size={28} className="text-blue-400" />
        </div>
        <p className="text-gray-600 font-medium">אין לקוחות עדיין</p>
        <p className="text-gray-400 text-sm mt-1">לחץ על "לקוח חדש" כדי להוסיף</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {active.length > 0 && (
        <div className="space-y-3">
          {active.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
            לא פעילים
          </p>
          <div className="space-y-3">
            {inactive.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
