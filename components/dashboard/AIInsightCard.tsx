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
      if (!res.ok) {
        setError(data.error || 'שגיאה ביצירת הניתוח');
        return;
      }
      onInsightReady(data);
    } catch {
      setError('שגיאת רשת');
    } finally {
      setLoading(false);
    }
  }

  if (insight) {
    return (
      <div className="bg-white rounded-xl border border-purple-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-500" />
          <span className="text-sm font-medium text-purple-700">תובנות AI</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {insight.content}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-purple-400" />
        <span className="text-sm font-medium text-gray-600">תובנות AI</span>
      </div>
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-purple-200 text-purple-700 rounded-lg py-2.5 text-sm font-medium hover:bg-purple-50 disabled:opacity-50 transition-colors"
      >
        <Sparkles size={14} />
        {loading ? 'מנתח...' : 'צור ניתוח חודשי'}
      </button>
    </div>
  );
}
