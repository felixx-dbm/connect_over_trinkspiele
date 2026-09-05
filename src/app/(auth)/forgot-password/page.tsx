"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // Must land on /auth/callback so the recovery code is exchanged for a session
    // server-side; the callback then forwards to /reset-password. There is no
    // /auth/reset-password route — pointing here directly 404s every reset link.
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-8">
      <Link href="/login" className="flex items-center gap-2 text-[#6B5D42] hover:text-[#14110F] transition-colors w-fit mb-10 cursor-pointer">
        <ArrowLeft size={16} />
        <span className="text-sm font-semibold">Back to login</span>
      </Link>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        {sent ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-600 border border-emerald-700 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-white" />
            </div>
            <h1 className="display text-2xl mb-2">Check your email</h1>
            <p className="text-[#4A3F2C] text-sm font-medium leading-relaxed mb-8">
              We sent a reset link to <span className="font-bold">{email}</span>. Click it to set a new password.
            </p>
            <p className="text-[#6B5D42] text-xs font-medium">Didn&apos;t get it? Check spam or try again.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-3 text-amber-700 hover:text-amber-800 text-sm font-bold cursor-pointer"
            >
              Try another email
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow mb-2">Password reset</p>
            <h1 className="display text-4xl mb-2">
              Forgot password?
            </h1>
            <p className="text-[#4A3F2C] text-sm font-medium mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Mail size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B5D42]" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full h-14 bg-transparent border-b border-[#14110F] pl-7 pr-4 text-[#14110F] placeholder:text-[#6B5D42] focus:outline-none focus:border-b-2 transition-all text-sm font-medium"
                />
              </div>

              {error && (
                <p className="text-rose-700 text-sm border border-rose-700 bg-rose-50 px-4 py-3 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="h-14 btn-gold flex items-center justify-center gap-2 font-bold text-base disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
