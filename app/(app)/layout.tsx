import BottomNav from '@/components/shared/BottomNav';
import DisclaimerBanner from '@/components/shared/DisclaimerBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DisclaimerBanner />
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
