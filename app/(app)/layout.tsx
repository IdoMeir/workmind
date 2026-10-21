import BottomNav from '@/components/shared/BottomNav';
import DisclaimerBanner from '@/components/shared/DisclaimerBanner';
import ScreenTracker from '@/components/shared/ScreenTracker';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-text">
      <ScreenTracker />
      <DisclaimerBanner />
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
