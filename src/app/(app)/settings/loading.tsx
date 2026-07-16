import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, User, Mail, MapPin, Shield, FileText } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* ── Header Skeleton ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 border border-[#14110F]/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#14110F]/20" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1.5" /> {/* t.settings.title */}
          <Skeleton className="h-7 w-36" /> {/* t.settings.titleAccent */}
        </div>
      </div>

      {/* ── Account Info Block Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-3 w-24" /> {/* t.settings.account Label */}
          <Skeleton className="h-5 w-12" /> {/* Edit Button oben */}
        </div>
        
        {/* Account Info Rows */}
        <div className="flex flex-col divide-y divide-[#E3DCCB]">
          {[
            { Icon: User },
            { Icon: MapPin },
            { Icon: Mail },
          ].map(({ Icon }, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <Icon size={14} className="text-amber-700/40 flex-shrink-0" />
              <Skeleton className="h-4 w-20 flex-1" /> {/* Label */}
              <Skeleton className="h-4 w-28" /> {/* Value */}
            </div>
          ))}
        </div>
        
        {/* Full-Width Edit Button unten */}
        <div className="mt-2 pt-3 border-t border-[#E3DCCB]">
          <Skeleton className="w-full h-10" />
        </div>
      </div>

      {/* ── Language Switcher Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-24" /> {/* Language Dropdown/Button */}
        </div>
      </div>

      {/* ── Privacy Settings Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={13} className="text-amber-700/40" />
          <Skeleton className="h-3 w-24" /> {/* t.settings.privacy */}
        </div>
        
        {/* Privacy Toggles */}
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1.5" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              <Skeleton className="w-10 h-6 flex-shrink-0" /> {/* Toggle Switch */}
            </div>
          ))}
        </div>
      </div>

      {/* ── Coming Soon Block Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-4">
        <Skeleton className="h-3 w-28 mb-3" /> {/* Title */}
        <div className="space-y-1.5 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-16" /> 
          ))}
        </div>
      </div>

      {/* ── Legal Block Skeleton ── */}
      <div className="border border-[#14110F]/20 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={13} className="text-amber-700/40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between py-1">
          <div className="flex-1">
            <Skeleton className="h-4 w-28 mb-1.5" />
            <Skeleton className="h-3 w-40" />
          </div>
          <ArrowLeft size={14} className="text-[#6B5D42]/20 rotate-180" />
        </div>
      </div>

      {/* ── Danger Zone Skeleton (Rose Border!) ── */}
      <div className="border border-rose-700/30 p-5 mb-6">
        <Skeleton className="h-3 w-24 mb-4" /> {/* dangerZone Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 size={16} className="text-rose-700/40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="w-20 h-9" /> {/* Delete Account Button */}
        </div>
      </div>

      {/* ── Sign Out Button Skeleton ── */}
      <Skeleton className="w-full h-12" />
    </div>
  );
}