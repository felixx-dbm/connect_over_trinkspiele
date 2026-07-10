"use client";

import { useState } from "react";
import { Flag, X, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  reportedUserId: string;
  matchId?: string;
  onClose: () => void;
};

const REASONS = [
  "Offensive or abusive behaviour",
  "Cheating / false result",
  "Inappropriate content",
  "Harassment",
  "Other",
];

export default function ReportModal({ reportedUserId, matchId, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    const finalReason = reason === "Other" ? custom.trim() : reason;
    if (!finalReason) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      ...(matchId ? { match_id: matchId } : {}),
      reason: finalReason,
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-[#14110F]/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#FAF8F3] border-t border-rose-700 p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-rose-700" />
            <p className="font-bold">Report user</p>
          </div>
          <button onClick={onClose} aria-label="Close report dialog" className="w-7 h-7 border border-[#14110F] flex items-center justify-center hover:bg-[#14110F] hover:text-[#FAF8F3] cursor-pointer transition-colors">
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="text-emerald-700 mx-auto mb-3" />
            <p className="font-bold mb-1">Report submitted</p>
            <p className="text-[#4A3F2C] text-sm font-medium">We&apos;ll review it shortly. Thanks for keeping Prost safe.</p>
            <button onClick={onClose} className="mt-5 h-12 w-full btn-gold font-bold cursor-pointer">Done</button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setCustom(""); }}
                  className={`h-11 px-4 border text-sm font-bold text-left transition-colors cursor-pointer ${
                    reason === r
                      ? "bg-rose-50 border-rose-700 text-rose-700"
                      : "border-[#E3DCCB] text-[#4A3F2C] hover:border-[#14110F]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === "Other" && (
              <textarea
                placeholder="Describe the issue…"
                maxLength={500}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-full h-24 px-4 py-3 bg-transparent border border-[#14110F] text-sm font-medium placeholder:text-[#6B5D42] focus:outline-none resize-none transition-colors mb-4"
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!reason || (reason === "Other" && !custom.trim()) || submitting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 transition-colors hover:bg-rose-800"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
