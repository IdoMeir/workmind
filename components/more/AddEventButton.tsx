'use client';

import { useState } from 'react';
import { CalendarPlus, ChevronLeft } from 'lucide-react';
import QuickAddEventDialog from '@/components/entries/QuickAddEventDialog';
import type { Client } from '@/types';

/** "הוסף אירוע" עבר מהמסך הראשי ל"עוד" (מפרט סעיף 10). */
export default function AddEventButton() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [saved, setSaved] = useState(false);

  async function openSheet() {
    setSaved(false);
    try {
      const res = await fetch('/api/clients');
      setClients(res.ok ? await res.json() : []);
    } catch {
      setClients([]);
    }
    setOpen(true);
  }

  return (
    <>
      <button onClick={openSheet} className="w-full flex items-center gap-3 px-4 min-h-14 py-2 text-start">
        <CalendarPlus size={20} aria-hidden="true" className="text-brass" />
        <span className="flex-1">
          <span className="block text-[15px] text-text">הוסף אירוע</span>
          <span className="block text-[13px] text-text-mute">{saved ? 'האירוע נשמר' : 'עבודה בתעריף אירוע'}</span>
        </span>
        <ChevronLeft size={18} aria-hidden="true" className="text-text-faint" />
      </button>
      <QuickAddEventDialog open={open} onClose={() => setOpen(false)} onAdd={() => setSaved(true)} clients={clients} />
    </>
  );
}
