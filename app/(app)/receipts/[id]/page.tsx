import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ReceiptPrintView from '@/components/receipts/ReceiptPrintView';
import type { Receipt } from '@/types';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data, error } = await supabase
    .from('wm_receipts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <ReceiptPrintView receipt={data as Receipt} />
    </div>
  );
}
