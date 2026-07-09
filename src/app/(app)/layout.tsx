import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import InstallBanner from "@/components/InstallBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto pb-safe">
        {children}
      </main>
      <BottomNav />
      <Onboarding />
      <InstallBanner />
    </div>
  );
}
