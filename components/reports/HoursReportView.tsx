'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkEntry, Client } from '@/types';
import { Printer, FileDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Money from '@/components/shared/Money';

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

function ReportTable({ entries, totalHours, totalAmount }: { entries: WorkEntry[]; totalHours: number; totalAmount: number }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-rule">
          <th className="text-start px-3 py-2 font-semibold">תאריך</th>
          <th className="text-start px-3 py-2 font-semibold">שעות</th>
          <th className="text-start px-3 py-2 font-semibold">שעון</th>
          <th className="text-start px-3 py-2 font-semibold">תיאור</th>
          <th className="text-end px-3 py-2 font-semibold">סכום</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule">
        {entries.map(entry => {
          const { timeRange, rest } = extractTimeRange(entry.description);
          return (
            <tr key={entry.id}>
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
              <td className="px-3 py-2 font-semibold">{entry.hours}</td>
              <td className="px-3 py-2 whitespace-nowrap text-text-mute"><bdi>{timeRange ?? '—'}</bdi></td>
              <td className="px-3 py-2 text-text-mute">{rest || '—'}</td>
              <td className="px-3 py-2 text-end"><Money amount={Number(entry.amount)} /></td>
            </tr>
          );
        })}
        {entries.length === 0 && (
          <tr>
            <td colSpan={5} className="px-3 py-8 text-center text-text-mute">אין רשומות שעות לתקופה זו</td>
          </tr>
        )}
      </tbody>
      {entries.length > 0 && (
        <tfoot>
          <tr className="border-t border-text font-semibold">
            <td className="px-3 py-2">סה&quot;כ</td>
            <td className="px-3 py-2">{totalHours} שעות</td>
            <td />
            <td />
            <td className="px-3 py-2 text-end"><Money amount={totalAmount} /></td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

export default function HoursReportView({ entries, client, year, month, printMode = false }: HoursReportViewProps) {
  const router = useRouter();
  const monthName = MONTH_NAMES[month - 1];
  const pdfRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  // ה-div ל-PDF קיים רק בזמן ההורדה. left:-9999px ב-RTL גלל את כל הדף שמאלה והמסך נראה ריק.
  const [pdfMounted, setPdfMounted] = useState(false);

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
    if (downloading) return;
    setDownloading(true);
    setPdfMounted(true);
    try {
      // מחכים שה-div יתרנדר לפני הצילום.
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (!pdfRef.current) return;
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
      setPdfMounted(false);
      setDownloading(false);
    }
  }

  // ── Print mode: נפתח בטאב ?print=true ומדפיס מיד ─────────────────────────
  if (printMode) {
    return (
      <div className="min-h-screen bg-ink text-text p-6 print:p-0">
        <div className="max-w-3xl mx-auto print:max-w-none">
          <div className="mb-6 text-center print:mb-4">
            <h1 className="wm-title text-[24px]">דו&quot;ח שעות</h1>
            <p className="text-text-mute mt-1">{monthName} {year}</p>
            <p className="font-semibold mt-1">{client.name}</p>
          </div>
          <ReportTable entries={hoursEntries} totalHours={totalHours} totalAmount={totalAmount} />
          <p className="mt-6 text-[13px] text-text-mute text-center print:mt-4">
            דו&quot;ח זה הופק מתוך בשתי ידיי • {new Date().toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>
    );
  }

  // ── Normal screen view ──────────────────────────────────────────────────────
  return (
    <>
      {/* div ל-html2canvas, בתוך מיכל fixed בגודל 0 כדי שלא ירחיב את הדף */}
      {pdfMounted && (
      <div aria-hidden="true" dir="rtl" style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden' }}>
      <div
        ref={pdfRef}
        style={{
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
          דו&quot;ח זה הופק מתוך בשתי ידיי • {new Date().toLocaleDateString('he-IL')}
        </div>
      </div>
      </div>
      )}

      <div className="min-h-screen bg-ink text-text">
        <div className="no-print flex items-center gap-2 px-2 py-2 border-b border-rule sticky top-0 z-10 bg-ink">
          <button onClick={() => router.back()} aria-label="חזרה" className="wm-btn text-text-mute">
            <ArrowRight size={20} aria-hidden="true" />
          </button>
          <span className="flex-1 truncate">דו&quot;ח שעות — {client.name}</span>
          <button onClick={() => window.print()} className="wm-btn wm-btn-ghost">
            <Printer size={16} aria-hidden="true" /> הדפס
          </button>
          <button onClick={downloadPdf} disabled={downloading} className="wm-btn wm-btn-brass">
            <FileDown size={16} aria-hidden="true" /> {downloading ? 'מכין…' : 'PDF'}
          </button>
        </div>

        <div className="max-w-3xl mx-auto p-4 print:p-0 print:max-w-none">
          <div className="mb-4 text-center">
            <h1 className="wm-title text-[24px]">דו&quot;ח שעות</h1>
            <p className="text-text-mute mt-1">{monthName} {year}</p>
            <p className="font-semibold mt-1">{client.name}</p>
          </div>
          <div className="wm-card overflow-x-auto">
            <ReportTable entries={hoursEntries} totalHours={totalHours} totalAmount={totalAmount} />
          </div>
          <p className="mt-6 text-[13px] text-text-mute text-center">
            דו&quot;ח זה הופק מתוך בשתי ידיי • {new Date().toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>
    </>
  );
}
