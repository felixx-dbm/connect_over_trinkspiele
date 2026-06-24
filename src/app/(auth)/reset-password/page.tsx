"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase sends the token as a hash fragment; the client SDK picks it up automatically
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push("/home"), 2000);
  };

  if (!sessionReady) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 size={32} className="text-amber-500 animate-spin" />
        <p className="text-stone-500 text-sm font-semibold">Verifying reset link…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50">
          <CheckCircle size={36} className="text-white" />
        </div>
        <h2 className="font-display text-2xl text-stone-900 mb-2">Password updated!</h2>
        <p className="text-stone-500 text-sm font-semibold">Redirecting you to the app…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type={showPw ? "text" : "password"}
          required
          placeholder="New password (8+ chars)"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          className="w-full h-13 pl-11 pr-12 bg-white border border-amber-200 rounded-2xl text-sm text-stone-800 font-semibold placeholder:text-stone-300 focus:outline-none focus:border-amber-400 transition-colors shadow-sm"
        />
        <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer">
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type={showPw ? "text" : "password"}
          required
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          className="w-full h-13 pl-11 pr-4 bg-white border border-amber-200 rounded-2xl text-sm text-stone-800 font-semibold placeholder:text-stone-300 focus:outline-none focus:border-amber-400 transition-colors shadow-sm"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 font-semibold">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="h-13 btn-gold rounded-2xl flex items-center justify-center gap-2 font-bold text-base disabled:opacity-60 cursor-pointer"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-8">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="font-display text-3xl text-stone-900 mb-2">
          New <span className="text-gradient">password</span>
        </h1>
        <p className="text-stone-500 text-sm font-semibold mb-8">Choose something you'll remember.</p>
        <Suspense fallback={<Loader2 size={24} className="text-amber-500 animate-spin" />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
