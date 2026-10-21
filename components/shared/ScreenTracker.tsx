'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/events';

/** רושם פתיחת מסך (wm_events). */
export default function ScreenTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track('screen_open', { screen: pathname });
  }, [pathname]);
  return null;
}
