import { Skeleton } from "@/components/ui/skeleton"; // Passe den Pfad an, falls deine skeleton.tsx woanders liegt
import { Swords, Trophy, TrendingUp } from "lucide-react";

export default function HomeLoading() {
  return (
    <div className="min-h-screen pb-6">
      {/* ── Header Skeleton ── */}
      <div className="flex items-center justify-between px-4 pt-2 mb-6">
        <div>
          <Skeleton className="h-4 w-24 mb-2" /> {/* Eyebrow-Grußformel */}
          <Skeleton className="h-10 w-44" /> {/* Username */}
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 border border-[#14110F]/10" /> {/* Benachrichtigungsglocke */}
          <Skeleton className="w-10 h-10 border border-[#14110F]/10" /> {/* Profilbild */}
        </div>
      </div>

      <div className="px-4">
        {/* ── Stats Skeleton ── */}
        <div className="mb-8">
          <div className="grid grid-cols-3 divide-x divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {[
              { Icon: Trophy },
              { Icon: Swords },
              { Icon: TrendingUp },
            ].map(({ Icon }, i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-4">
                <Icon size={14} className="text-[#4A3F2C]/40" />
                <Skeleton className="h-8 w-12" /> {/* Stat-Wert */}
                <Skeleton className="h-3 w-10" /> {/* Stat-Label */}
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Match (Live) Skeleton ── */}
        <div className="border border-[#14110F]/20 p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14110F]/20 animate-pulse" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="text-center">
              <Skeleton className="w-10 h-10 mb-2 mx-auto" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
            <span className="display italic text-xl text-[#4A3F2C]/30">vs</span>
            <div className="text-center">
              <Skeleton className="w-10 h-10 mb-2 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </div>
          <Skeleton className="mt-4 w-full h-11" /> {/* Go To Match Button */}
        </div>

        {/* ── Quick Actions Skeleton ── */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Skeleton className="h-[54px] w-full" /> {/* Button: Kampf suchen */}
          <Skeleton className="h-[54px] w-full" /> {/* Button: Meine Crew */}
        </div>

        {/* ── Recent Matches Skeleton ── */}
        <div>
          <Skeleton className="h-3 w-28 mb-4" /> {/* "Recent Battles" Title */}
          <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="w-8 h-8 flex-shrink-0" /> {/* W/L Kasten */}
                <div className="flex-1">
                  <Skeleton className="h-4 w-36 mb-2" /> {/* Gegner-Name */}
                  <Skeleton className="h-3 w-20" /> {/* Spieltyp */}
                </div>
                <Skeleton className="h-4 w-16 flex-shrink-0" /> {/* Datum */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}