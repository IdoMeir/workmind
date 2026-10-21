'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center text-text">
      <h2 className="wm-title text-[19px]">משהו השתבש</h2>
      <p className="text-[15px] text-text-mute max-w-xs">אירעה שגיאה לא צפויה. אפשר לנסות שוב או לרענן את הדף.</p>
      <button onClick={reset} className="wm-btn wm-btn-brass">נסה שוב</button>
    </div>
  );
}
