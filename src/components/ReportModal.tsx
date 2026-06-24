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
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-stone-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-rose-500" />
            <p className="font-bold text-stone-900">Report user</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-stone-800 mb-1">Report submitted</p>
            <p className="text-stone-500 text-sm font-semibold">We'll review it shortly. Thanks for keeping Prost safe.</p>
            <button onClick={onClose} className="mt-5 h-12 w-full btn-gold rounded-2xl font-bold cursor-pointer">Done</button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setCustom(""); }}
                  className={`h-11 px-4 rounded-2xl border-2 text-sm font-bold text-left transition-all cursor-pointer ${
                    reason === r
                      ? "bg-rose-50 border-rose-400 text-rose-700"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300"
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
                className="w-full h-24 px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-800 font-semibold placeholder:text-stone-400 focus:outline-none focus:border-amber-400 resize-none transition-colors mb-4"
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!reason || (reason === "Other" && !custom.trim()) || submitting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-rose-500 text-white font-bold rounded-2xl cursor-pointer disabled:opacity-50 transition-all hover:bg-rose-600"
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
