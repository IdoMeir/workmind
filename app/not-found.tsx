import Link from 'next/link';

// מוצג בתוך ה-root layout: בלי <html>/<body> משלו.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-text flex flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="wm-title text-[19px]">הדף לא נמצא</h2>
      <p className="text-[15px] text-text-mute">הקישור שניסית לפתוח לא קיים.</p>
      <Link href="/" className="wm-btn wm-btn-brass">חזרה למסך הראשי</Link>
    </div>
  );
}
