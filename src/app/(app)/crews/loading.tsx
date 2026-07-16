import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trophy, Swords, Crown, Copy } from "lucide-react";

export default function CrewsLoading() {
  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* ── Header Skeleton ── */}
      <div className="mb-8">
        <Skeleton className="h-3 w-16 mb-2" /> {/* t.crews.title */}
        <Skeleton className="h-8 w-44" /> {/* t.crews.titleAccent */}
      </div>

      {/* ── Main Crew Card Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <Skeleton className="h-6 w-40 mb-2" /> {/* Crew Name */}
            <Skeleton className="h-3.5 w-24" /> {/* Crew City */}
          </div>
          <Skeleton className="w-8 h-8 flex-shrink-0" /> {/* Action / Share Button */}
        </div>

        {/* Crew Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-[#E3DCCB] border-t border-b border-[#14110F]/20">
          {[
            { Icon: Trophy },
            { Icon: Swords },
            { Icon: Users },
          ].map(({ Icon }, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-4">
              <Icon size={14} className="text-[#4A3F2C]/30" />
              <Skeleton className="h-6 w-10 my-1" /> {/* Stat Value */}
              <Skeleton className="h-3 w-12" /> {/* Stat Label */}
            </div>
          ))}
        </div>
      </div>

      {/* ── Invite Code Block Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-5">
        <Skeleton className="h-3 w-28 mb-3" /> {/* Invite Code Label */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1" /> {/* Code-Display */}
          <div className="w-10 h-10 border border-[#14110F]/10 flex items-center justify-center flex-shrink-0">
            <Copy size={14} className="text-[#14110F]/20" />
          </div>
        </div>
      </div>

      {/* ── Members List Skeleton ── */}
      <div className="mb-6">
        <Skeleton className="h-3 w-24 mb-3" /> {/* "Mitglieder" Title */}
        <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]/20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div className="relative flex-shrink-0">
                <Skeleton className="w-8 h-8 border border-[#14110F]/10" /> {/* Member Avatar */}
                {i === 1 && (
                  <div className="absolute -top-1.5 -left-1.5 bg-amber-500/10 p-0.5 border border-amber-500/20">
                    <Crown size={8} className="text-amber-700/40" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" /> {/* Username */}
                <Skeleton className="h-3 w-16" /> {/* Role Badge */}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Trophy size={11} className="text-amber-700/40" />
                <Skeleton className="h-3.5 w-8" /> {/* Wins Counter */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions Button Skeleton ── */}
      <Skeleton className="w-full h-12" /> {/* Leave / Management Button */}
    </div>
  );
}