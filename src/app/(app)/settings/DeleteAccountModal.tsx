"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-[#14110F]/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF8F3] border-t border-rose-700 p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-700" />
            <p className="font-bold">Delete account</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 border border-[#14110F] flex items-center justify-center hover:bg-[#14110F] hover:text-[#FAF8F3] cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="border border-rose-700 p-4 mb-5">
              <p className="text-rose-800 text-sm font-bold mb-1">This cannot be undone.</p>
              <p className="text-rose-700 text-sm font-medium leading-relaxed">
                Your profile, match history, crew memberships, and all data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 btn-outline font-bold cursor-pointer"
              >
                Keep account
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-12 bg-rose-700 text-white font-bold cursor-pointer hover:bg-rose-800 transition-colors"
              >
                Yes, delete
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[#4A3F2C] text-sm font-medium mb-3 leading-relaxed">
              Type <span className="display text-rose-700 tracking-wider">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              placeholder="DELETE"
              className="w-full h-12 px-4 mb-4 bg-transparent border border-rose-700 font-bold text-sm focus:outline-none transition-colors tracking-widest"
              autoFocus
            />
            {error && (
              <p className="text-rose-700 text-sm font-semibold mb-3">{error}</p>
            )}
            <button
              onClick={handleDelete}
              disabled={input !== "DELETE" || deleting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 hover:bg-rose-800 transition-colors"
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
