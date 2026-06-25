"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (input !== "DELETE") return;
    setDeleting(true);
    setError(null);

    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Something went wrong");
      setDeleting(false);
      return;
    }

    // Sign out locally then redirect to root
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-stone-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <p className="font-bold text-stone-900">Delete account</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-5">
              <p className="text-rose-800 text-sm font-bold mb-1">This cannot be undone.</p>
              <p className="text-rose-700 text-sm font-semibold leading-relaxed">
                Your profile, match history, crew memberships, and all data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 bg-stone-100 text-stone-600 font-bold rounded-2xl cursor-pointer hover:bg-stone-200 transition-colors"
              >
                Keep account
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-12 bg-rose-500 text-white font-bold rounded-2xl cursor-pointer hover:bg-rose-600 transition-colors"
              >
                Yes, delete
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-stone-600 text-sm font-semibold mb-3 leading-relaxed">
              Type <span className="font-display text-rose-600 tracking-wider">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              placeholder="DELETE"
              className="w-full h-12 px-4 mb-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 font-bold text-sm focus:outline-none focus:border-rose-400 transition-colors tracking-widest"
              autoFocus
            />
            {error && (
              <p className="text-rose-600 text-sm font-semibold mb-3">{error}</p>
            )}
            <button
              onClick={handleDelete}
              disabled={input !== "DELETE" || deleting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-rose-500 text-white font-bold rounded-2xl cursor-pointer disabled:opacity-50 hover:bg-rose-600 transition-colors"
            >
              {deleting
                ? <><Loader2 size={16} className="animate-spin" /> Deleting…</>
                : <><Trash2 size={16} /> Permanently delete account</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  );
}
