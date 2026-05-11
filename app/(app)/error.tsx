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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">משהו השתבש</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        אירעה שגיאה בלתי צפויה. אפשר לנסות שוב או לרענן את הדף.
      </p>
      <button
        onClick={reset}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
      >
        נסה שוב
      </button>
    </div>
  );
}
