'use client';

import { Client } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${!client.is_active ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base">{client.name}</h3>
            {!client.is_active && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                לא פעיל
              </span>
            )}
          </div>
          {client.description && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{client.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {client.hourly_rate && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                ₪{client.hourly_rate.toLocaleString()}/שעה
              </span>
            )}
            {client.event_rate && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">
                ₪{client.event_rate.toLocaleString()}/אירוע
              </span>
            )}
          </div>
          {client.contact_info && (
            <p className="text-xs text-gray-400 mt-1.5">{client.contact_info}</p>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(client)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="ערוך לקוח"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(client)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="מחק לקוח"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
