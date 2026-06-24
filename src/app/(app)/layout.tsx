import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-lg mx-auto pb-safe">
        {children}
      </div>
      <BottomNav />
      <Onboarding />
    </div>
  );
}
