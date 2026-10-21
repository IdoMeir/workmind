'use client';

// שגיאה מתחת ל-root layout: ה-<html> וה-<body> כבר קיימים, ולכן רק תוכן.
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="min-h-screen bg-ink text-text flex flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="wm-title text-[19px]">משהו השתבש</h2>
      <button onClick={reset} className="wm-btn wm-btn-brass">נסה שוב</button>
    </div>
  );
}
