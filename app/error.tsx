'use client';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          משהו השתבש
        </h2>
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.625rem 1.5rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          נסה שוב
        </button>
      </body>
    </html>
  );
}
