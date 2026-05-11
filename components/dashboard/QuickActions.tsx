'use client';

import Link from 'next/link';
import { Clock, CalendarDays, FileText, Receipt } from 'lucide-react';

interface QuickActionsProps {
  onAddHours: () => void;
  onAddEvent: () => void;
}

export default function QuickActions({ onAddHours, onAddEvent }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onAddHours}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Clock size={18} />
          + הוסף שעות
        </button>
        <button
          onClick={onAddEvent}
          className="flex items-center justify-center gap-2 bg-purple-600 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-purple-700 active:scale-95 transition-all shadow-sm"
        >
          <CalendarDays size={18} />
          + הוסף אירוע
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/monthly"
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
        >
          <FileText size={16} />
          סיכום חודשי
        </Link>
        <Link
          href="/receipts"
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
        >
          <Receipt size={16} />
          קבלות
        </Link>
      </div>
    </div>
  );
}
