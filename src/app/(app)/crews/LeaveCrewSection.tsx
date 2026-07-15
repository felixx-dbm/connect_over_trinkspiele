"use client";

import { Loader2, LogOut } from "lucide-react";

interface LeaveCrewSectionProps {
  isCaptain: boolean;
  membersCount: number;
  leaving: boolean;
  handleLeave: () => void;
  t: any;
}

export default function LeaveCrewSection({
  isCaptain,
  membersCount,
  leaving,
  handleLeave,
  t
}: LeaveCrewSectionProps) {
  return (
    <div className="mt-8 border-t border-[#E3DCCB] pt-6 flex flex-col items-center w-full">
      {isCaptain && membersCount > 1 ? (
        <p className="text-xs text-[#6B5D42] italic text-center">
          {t.crews.cannotLeaveCaptain}
        </p>
      ) : (
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="w-full h-12 border border-rose-700 text-rose-700 hover:bg-rose-700 hover:text-white flex items-center justify-center gap-2 font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          {leaving ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {leaving ? t.crews.leaving : t.crews.leaveBtn}
        </button>
      )}
    </div>
  );
}