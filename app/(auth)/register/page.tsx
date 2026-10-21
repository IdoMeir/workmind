'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
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
          <p className="text-text-mute text-[15px] mt-1">יצירת חשבון חדש</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-f1" className="wm-label">
              שם מלא
            </label>
            <input
              id="register-f1"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="wm-field"
              placeholder="ישראל ישראלי"
            />
          </div>

          <div>
            <label htmlFor="register-f2" className="wm-label">
              אימייל
            </label>
            <input
              id="register-f2"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="wm-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="register-f3" className="wm-label">
              סיסמה
            </label>
            <input
              id="register-f3"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="wm-field"
              placeholder="מינימום 6 תווים"
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
            {loading ? 'נרשם...' : 'הרשמה'}
          </button>
        </form>

        <p className="text-center text-[15px] text-text-mute mt-4">
          כבר יש לך חשבון?{' '}
          <Link href="/login" className="text-brass underline inline-flex items-center min-h-11">
            התחברות
          </Link>
        </p>
      </div>
    </div>
  );
}
