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
        <Loader2 size={32} className="text-[#14110F] animate-spin" />
        <p className="text-[#4A3F2C] text-sm font-medium">Verifying reset link…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-emerald-600 border border-emerald-700 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-white" />
        </div>
        <h2 className="display text-2xl mb-2">Password updated!</h2>
        <p className="text-[#4A3F2C] text-sm font-medium">Redirecting you to the app…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B5D42]" />
        <input
          type={showPw ? "text" : "password"}
          required
          placeholder="New password (8+ chars)"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          className="w-full h-14 bg-transparent border-b border-[#14110F] pl-7 pr-12 text-[#14110F] placeholder:text-[#6B5D42] focus:outline-none focus:border-b-2 transition-all text-sm font-medium"
        />
        <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#6B5D42] hover:text-[#14110F] cursor-pointer">
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="relative">
        <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B5D42]" />
        <input
          type={showPw ? "text" : "password"}
          required
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          className="w-full h-14 bg-transparent border-b border-[#14110F] pl-7 pr-4 text-[#14110F] placeholder:text-[#6B5D42] focus:outline-none focus:border-b-2 transition-all text-sm font-medium"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-700 text-sm border border-rose-700 bg-rose-50 px-4 py-3 font-semibold">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="h-14 btn-gold flex items-center justify-center gap-2 font-bold text-base disabled:opacity-60 cursor-pointer mt-2"
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
        <p className="eyebrow mb-2">Password reset</p>
        <h1 className="display text-4xl mb-2">
          New password
        </h1>
        <p className="text-[#4A3F2C] text-sm font-medium mb-8">Choose something you&apos;ll remember.</p>
        <Suspense fallback={<Loader2 size={24} className="text-[#14110F] animate-spin" />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
