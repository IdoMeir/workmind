'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkEntry, Client } from '@/types';
import { Printer, FileDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HoursReportViewProps {
  entries: WorkEntry[];
  client: Client;
  year: number;
  month: number;
  printMode?: boolean;
}

const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function extractTimeRange(desc: string | null): { timeRange: string | null; rest: string } {
  if (!desc) return { timeRange: null, rest: '' };
  const match = desc.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2})\s*[|]?\s*(.*)/);
  if (match) return { timeRange: match[1], rest: match[2].trim() };
  return { timeRange: null, rest: desc };
}

function splitTimeRange(timeRange: string | null): { from: string; to: string } {
  if (!timeRange) return { from: '—', to: '—' };
  const parts = timeRange.split(/[–-]/);
  return { from: parts[0]?.trim() ?? '—', to: parts[1]?.trim() ?? '—' };
}

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '9px 14px',
  fontWeight: 700,
  color: '#374151',
  borderBottom: '2px solid #d1d5db',
  fontSize: '13px',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 14px',
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '13px',
};

export default function HoursReportView({ entries, client, year, month, printMode = false }: HoursReportViewProps) {
  const router = useRouter();
  const monthName = MONTH_NAMES[month - 1];
  const pdfRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // printMode: auto-trigger browser print dialog (opened via ?print=true tab)
  useEffect(() => {
    if (!printMode) return;
    document.title = `דוח-שעות-${client.name}-${monthName}`;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [printMode, client.name, monthName]);

  const hoursEntries = entries
    .filter(e => e.entry_type === 'hours')
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  const totalHours = hoursEntries.reduce((s, e) => s + (e.hours ?? 0), 0);
  const totalAmount = hoursEntries.reduce((s, e) => s + e.amount, 0);

  async function downloadPdf() {
    if (!pdfRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');
      const imgHeightMm = (canvas.height / canvas.width) * pageWidth;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeightMm);

      // Multi-page: shift image up by one page height on each subsequent page
      const totalPages = Math.ceil(imgHeightMm / pageHeight);
      for (let i = 1; i < totalPages; i++) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -pageHeight * i, pageWidth, imgHeightMm);
      }

      pdf.save(`דוח-שעות-${client.name}-${monthName}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  // ── Print mode: clean page with PDF table, no toolbar ──────────────────────
  if (printMode) {
    return (
      <div className="min-h-screen bg-white p-6 print:p-0">
        <div className="max-w-3xl mx-auto print:max-w-none">
          <div className="mb-6 text-center print:mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">דו&quot;ח שעות</h1>
            <p className="text-gray-600 mt-1">{monthName} {year}</p>
            <p className="text-gray-700 font-medium mt-1">{client.name}</p>
          </div>
          <div className="bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 print:bg-gray-100 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">תאריך</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">משעה</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">עד שעה</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">שעות</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">הערות</th>
                </tr>
              </thead>
              <tbody>
                {hoursEntries.map((entry, i) => {
                  const { timeRange, rest } = extractTimeRange(entry.description);
                  const { from, to } = splitTimeRange(timeRange);
                  return (
                    <tr key={entry.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{from}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{to}</td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{entry.hours}</td>
                      <td className="px-4 py-2.5 text-gray-600">{rest || '—'}</td>
                    </tr>
                  );
                })}
                {hoursEntries.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">אין רשומות שעות לתקופה זו</td></tr>
                )}
              </tbody>
              {hoursEntries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="px-4 py-3 text-gray-800">סה&quot;כ</td>
                    <td /><td />
                    <td className="px-4 py-3 text-gray-800">{totalHours} שעות</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="mt-6 text-xs text-gray-400 text-center print:mt-4">
            דו&quot;ח זה הופק מתוך WorkMind • {new Date().toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>
    );
  }

  // ── Normal screen view ──────────────────────────────────────────────────────
  return (
    <>
      {/* Off-screen div rendered for html2canvas PDF capture */}
      <div
        ref={pdfRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '-9999px',
          width: '794px',       // ≈ A4 width at 96dpi
          backgroundColor: '#ffffff',
          padding: '40px 48px',
          fontFamily: 'Heebo, Arial, Helvetica, sans-serif',
          direction: 'rtl',
          color: '#111827',
        }}
      >
        {/* PDF header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>דו&quot;ח שעות</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px' }}>
            {client.name} — {monthName} {year}
          </div>
        </div>

        {/* PDF table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={thStyle}>תאריך</th>
              <th style={thStyle}>משעה</th>
              <th style={thStyle}>עד שעה</th>
              <th style={thStyle}>שעות</th>
              <th style={{ ...thStyle, width: '40%' }}>הערות</th>
            </tr>
          </thead>
          <tbody>
            {hoursEntries.map((entry, i) => {
              const { timeRange, rest } = extractTimeRange(entry.description);
              const { from, to } = splitTimeRange(timeRange);
              return (
                <tr key={entry.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={tdStyle}>{formatDate(entry.entry_date)}</td>
                  <td style={tdStyle}>{from}</td>
                  <td style={tdStyle}>{to}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{entry.hours}</td>
                  <td style={tdStyle}>{rest || '—'}</td>
                </tr>
              );
            })}
            {hoursEntries.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                  אין רשומות שעות לתקופה זו
                </td>
              </tr>
            )}
          </tbody>
          {hoursEntries.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #374151' }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>סה&quot;כ</td>
                <td style={tdStyle} /><td style={tdStyle} />
                <td style={{ ...tdStyle, fontWeight: 700 }}>{totalHours} שעות</td>
                <td style={tdStyle} />
              </tr>
            </tfoot>
          )}
        </table>

        {/* PDF footer */}
        <div style={{ marginTop: '28px', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
          דו&quot;ח זה הופק מתוך WorkMind • {new Date().toLocaleDateString('he-IL')}
        </div>
      </div>

      {/* Main page */}
      <div className="min-h-screen bg-gray-50 print:bg-white">
        {/* Toolbar — hidden in print */}
        <div className="no-print flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-0 z-10">
          <button onClick={() => router.back()} aria-label="חזרה" className="min-w-11 min-h-11 inline-flex items-center justify-center text-gray-500 hover:text-gray-700">
            <ArrowRight size={20} />
          </button>
          <span className="font-medium text-gray-800 flex-1">דו&quot;ח שעות — {client.name}</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <Printer size={16} />
            הדפס
          </button>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <FileDown size={16} />
            {downloading ? 'מכין...' : 'הורד PDF'}
          </button>
        </div>

        {/* Report body */}
        <div className="max-w-3xl mx-auto p-6 print:p-0 print:max-w-none">
          <div className="mb-6 text-center print:mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">דו&quot;ח שעות</h1>
            <p className="text-gray-600 mt-1">{monthName} {year}</p>
            <p className="text-gray-700 font-medium mt-1">{client.name}</p>
          </div>

          {/* Screen table — full columns including amount */}
          <div className="bg-white rounded-xl shadow-sm print:shadow-none overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 print:bg-gray-100 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">תאריך</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">שעות</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">שעון</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">תיאור</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">סכום</th>
                </tr>
              </thead>
              <tbody>
                {hoursEntries.map((entry, i) => {
                  const { timeRange, rest } = extractTimeRange(entry.description);
                  return (
                    <tr key={entry.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{entry.hours}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{timeRange ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{rest || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-800 font-medium text-left">₪{entry.amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {hoursEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">אין רשומות שעות לתקופה זו</td>
                  </tr>
                )}
              </tbody>
              {hoursEntries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="px-4 py-3 text-gray-800">סה&quot;כ</td>
                    <td className="px-4 py-3 text-gray-800">{totalHours} שעות</td>
                    <td /><td />
                    <td className="px-4 py-3 text-gray-800 text-left">₪{totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center print:mt-4">
            דו&quot;ח זה הופק מתוך WorkMind • {new Date().toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>
    </>
  );
}
