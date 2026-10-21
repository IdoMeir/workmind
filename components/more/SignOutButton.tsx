'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await createClient().auth.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={signOut} disabled={busy} className="flex items-center gap-3 px-4 min-h-14 py-2 w-full text-start">
      <LogOut size={20} aria-hidden="true" className="text-text-mute" />
      <span className="flex-1 text-[15px] text-text">{busy ? 'מתנתק…' : 'התנתק'}</span>
    </button>
  );
}
