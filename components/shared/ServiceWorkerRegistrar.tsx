'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SW] registered, scope:', reg.scope);
        }
      })
      .catch(err => console.warn('[SW] registration failed:', err));
  }, []);
  return null;
}
