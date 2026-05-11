import type { Client, WorkEntry, MonthlySummary, ClientMonthlySummary, YearProgress } from '@/types';

export const OSEK_PATUR_CEILING_2026 = 122833;

export function calculateEntryAmount(
  entryType: 'hours' | 'event',
  hours: number | null,
  client: Pick<Client, 'hourly_rate' | 'event_rate'>,
  customAmount?: number
): number {
  if (customAmount !== undefined) return customAmount;
  if (entryType === 'hours' && hours && client.hourly_rate) {
    return Math.round(hours * client.hourly_rate * 100) / 100;
  }
  if (entryType === 'event' && client.event_rate) {
    return client.event_rate;
  }
  return 0;
}

export function buildMonthlySummary(
  entries: WorkEntry[],
  year: number,
  month: number
): MonthlySummary {
  const byClient = new Map<string, ClientMonthlySummary>();

  for (const entry of entries) {
    const client = entry.client;
    if (!client) continue;

    if (!byClient.has(entry.client_id)) {
      byClient.set(entry.client_id, {
        clientId: entry.client_id,
        clientName: client.name,
        totalHours: 0,
        hoursAmount: 0,
        eventsCount: 0,
        eventsAmount: 0,
        total: 0,
        entries: [],
      });
    }

    const summary = byClient.get(entry.client_id)!;
    summary.entries.push(entry);

    if (entry.entry_type === 'hours') {
      summary.totalHours += entry.hours || 0;
      summary.hoursAmount += entry.amount;
    } else {
      summary.eventsCount += 1;
      summary.eventsAmount += entry.amount;
    }
    summary.total += entry.amount;
  }

  return {
    year,
    month,
    totalAmount: Array.from(byClient.values()).reduce((sum, c) => sum + c.total, 0),
    byClient: Array.from(byClient.values()).sort((a, b) => b.total - a.total),
    entriesCount: entries.length,
  };
}

export function calculateYearProgress(
  yearTotal: number,
  ceiling: number = OSEK_PATUR_CEILING_2026
): YearProgress {
  return {
    yearTotal,
    ceiling,
    percentage: Math.round((yearTotal / ceiling) * 10000) / 100,
    remaining: Math.max(0, ceiling - yearTotal),
    isExceeded: yearTotal > ceiling,
  };
}
