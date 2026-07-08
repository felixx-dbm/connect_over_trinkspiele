import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import InstallBanner from "@/components/InstallBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-lg mx-auto pb-safe">
        {children}
      </div>
      <BottomNav />
      <Onboarding />
      <InstallBanner />
    </div>
  );
}