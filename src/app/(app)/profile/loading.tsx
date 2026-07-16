import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Trophy, Swords, TrendingUp, Clock, ChevronRight, Users } from "lucide-react";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* ── Header Skeleton ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-3 w-16 mb-2" /> {/* t.profile.title */}
          <Skeleton className="h-8 w-32" /> {/* t.profile.titleAccent */}
        </div>
        <div className="w-10 h-10 border border-[#14110F]/10 flex items-center justify-center">
          <Settings size={16} className="text-[#14110F]/20" />
        </div>
      </div>

      {/* ── Profile Hero Card Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {/* Avatar Upload Placeholder */}
            <Skeleton className="w-16 h-16 border border-[#14110F]/10" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-6 w-36 mb-2" /> {/* Username */}
            <div className="flex items-center gap-2 mt-1">
              <Skeleton className="h-3.5 w-20" /> {/* Location / Crew Placeholder */}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-[#E3DCCB] border-t border-b border-[#14110F]/20">
          {[
            { Icon: Trophy },
            { Icon: Swords },
            { Icon: TrendingUp },
          ].map(({ Icon }, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-4">
              <Icon size={14} className="text-[#4A3F2C]/30" />
              <Skeleton className="h-6 w-10 my-1" /> {/* Stat-Wert */}
              <Skeleton className="h-3 w-12" /> {/* Stat-Label */}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Links Skeleton ── */}
      <div className="border border-[#14110F]/20 mb-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-4 ${i !== 1 ? "border-t border-[#E3DCCB]" : ""}`}
          >
            <Skeleton className="w-4 h-4 flex-shrink-0" /> {/* Link Icon */}
            <div className="flex-1">
              <Skeleton className="h-4 w-28 mb-1.5" /> {/* Link Title */}
              <Skeleton className="h-3 w-40" /> {/* Link Subtitle */}
            </div>
            <ChevronRight size={14} className="text-[#6B5D42]/20" />
          </div>
        ))}
      </div>

      {/* ── Recent Matches Skeleton ── */}
      <div className="mb-6">
        <Skeleton className="h-3 w-28 mb-3" /> {/* "Recent Battles" Title */}
        <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]/20">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-9 h-9 flex-shrink-0" /> {/* W/L Box */}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32 mb-1.5" /> {/* Match Opponent */}
                <Skeleton className="h-3 w-20" /> {/* Game Mode */}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Clock size={11} className="text-[#6B5D42]/20" />
                <Skeleton className="h-3 w-16" /> {/* Match Date */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Achievements Skeleton ── */}
      <div className="mb-5">
        <Skeleton className="h-3 w-24 mb-3" /> {/* Achievements Title */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5 border border-[#14110F]/10 px-3 py-1.5">
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Challenge QR Box Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-5 flex flex-col items-center text-center">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="w-32 h-32 my-3" /> {/* QR-Code-Box */}
        <Skeleton className="h-3 w-48" />
      </div>

      {/* ── Sign Out Button Skeleton ── */}
      <Skeleton className="w-full h-12" />
    </div>
  );
}