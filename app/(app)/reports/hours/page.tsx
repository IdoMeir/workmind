import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDateRange } from '@/lib/hebrew-format';
import HoursReportView from '@/components/reports/HoursReportView';

interface Props {
  searchParams: Promise<{ year?: string; month?: string; client_id?: string }>;
}

export default async function HoursReportPage({ searchParams }: Props) {
  const { year: yearStr, month: monthStr, client_id } = await searchParams;

  const year = parseInt(yearStr ?? '') || new Date().getFullYear();
  const month = parseInt(monthStr ?? '') || new Date().getMonth() + 1;

  if (!client_id) redirect('/monthly');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: clientData }, { data: entries }] = await Promise.all([
    supabase
      .from('wm_clients')
      .select('*')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('wm_work_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_id', client_id)
      .gte('entry_date', getDateRange(year, month).from)
      .lte('entry_date', getDateRange(year, month).to)
      .order('entry_date', { ascending: true }),
  ]);

  if (!clientData) redirect('/monthly');

  return (
    <HoursReportView
      entries={entries ?? []}
      client={clientData}
      year={year}
      month={month}
    />
  );
}
