'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('אימייל או סיסמה שגויים');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center p-4">
      <div className="wm-card w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <h1 className="wm-title text-[24px]">WorkMind</h1>
          <p className="text-text-mute text-[15px] mt-1">ניהול עבודה לפרילנסר</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-f1" className="wm-label">
              אימייל
            </label>
            <input
              id="login-f1"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="wm-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-f2" className="wm-label">
              סיסמה
            </label>
            <input
              id="login-f2"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="wm-field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="wm-error text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="wm-btn wm-btn-brass w-full"
          >
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>

        <p className="text-center text-[15px] text-text-mute mt-4">
          אין לך חשבון?{' '}
          <Link href="/register" className="text-brass underline inline-flex items-center min-h-11">
            הרשמה
          </Link>
        </p>
      </div>
    </div>
  );
}
