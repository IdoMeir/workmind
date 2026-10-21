'use client';

import { Pencil, Trash2 } from 'lucide-react';
import Money from '@/components/shared/Money';
import type { Client } from '@/types';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <article className={`wm-card p-4 ${client.is_active ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="wm-title text-[17px]">{client.name}</h3>
            {!client.is_active && (
              <span className="text-[13px] border border-rule text-text-mute px-2 rounded">לא פעיל</span>
            )}
          </div>
          {client.description && <p className="text-[13px] text-text-mute mt-0.5 truncate">{client.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2 text-[13px]">
            {client.hourly_rate && (
              <span className="border border-rule rounded px-2 py-0.5"><Money amount={Number(client.hourly_rate)} className="text-brass" /> לשעה</span>
            )}
            {client.event_rate && (
              <span className="border border-rule rounded px-2 py-0.5"><Money amount={Number(client.event_rate)} className="text-brass" /> לאירוע</span>
            )}
            {client.rate_presets?.map(p => (
              <span key={p.name} className="border border-rule rounded px-2 py-0.5">{p.name} <Money amount={p.rate} /></span>
            ))}
          </div>
          {client.contact_info && <p className="text-[13px] text-text-mute mt-1.5">{client.contact_info}</p>}
        </div>

        <div className="flex shrink-0">
          <button onClick={() => onEdit(client)} aria-label={`ערוך את ${client.name}`} className="wm-btn text-text-mute">
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button onClick={() => onDelete(client)} aria-label={`מחק את ${client.name}`} className="wm-btn text-text-mute">
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
