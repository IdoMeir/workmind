import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem 1rem', background: '#f9fafb' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
          הדף לא נמצא
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
          הקישור שניסית לגשת אליו לא קיים.
        </p>
        <a
          href="/"
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '0.625rem 1.5rem',
            borderRadius: '0.75rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          חזרה לדף הבית
        </a>
      </body>
    </html>
  );
}
