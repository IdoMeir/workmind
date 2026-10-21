'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { MonthlyInsight } from '@/types';

interface Props {
  insight: MonthlyInsight | null;
  year: number;
  month: number;
  onInsightReady: (insight: MonthlyInsight) => void;
}

export default function AIInsightCard({ insight, year, month, onInsightReady }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/monthly-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה ביצירת הניתוח'); return; }
      onInsightReady(data);
    } catch {
      setError('שגיאת רשת');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wm-card p-4 space-y-3" aria-labelledby="ai-insight">
      <h2 id="ai-insight" className="flex items-center gap-2 text-[15px]">
        <Sparkles size={16} aria-hidden="true" className="text-brass" /> ניתוח חודשי (AI)
      </h2>
      {insight ? (
        <p className="text-[15px] whitespace-pre-line leading-relaxed">{insight.content}</p>
      ) : (
        <>
          {error && <p role="alert" className="wm-error">{error}</p>}
          <button onClick={generate} disabled={loading} className="wm-btn wm-btn-ghost w-full">
            {loading ? 'מנתח…' : 'צור ניתוח חודשי'}
          </button>
        </>
      )}
      <p className="text-[13px] text-text-mute">ניתוח אוטומטי של עבודות העסק. הערכה בלבד.</p>
    </section>
  );
}
