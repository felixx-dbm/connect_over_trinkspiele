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
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-8">
      <Link href="/login" className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors w-fit mb-10 cursor-pointer">
        <ArrowLeft size={16} />
        <span className="text-sm font-bold">Back to login</span>
      </Link>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        {sent ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50">
              <CheckCircle size={36} className="text-white" />
            </div>
            <h1 className="font-display text-2xl text-stone-900 mb-2">Check your email</h1>
            <p className="text-stone-500 text-sm font-semibold leading-relaxed mb-8">
              We sent a reset link to <span className="text-stone-800 font-bold">{email}</span>. Click it to set a new password.
            </p>
            <p className="text-stone-400 text-xs font-semibold">Didn't get it? Check spam or try again.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-3 text-amber-600 hover:text-amber-700 text-sm font-bold cursor-pointer"
            >
              Try another email
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl text-stone-900 mb-2">
              Forgot <span className="text-gradient">password?</span>
            </h1>
            <p className="text-stone-500 text-sm font-semibold mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full h-13 pl-11 pr-4 bg-white border border-amber-200 rounded-2xl text-sm text-stone-800 font-semibold placeholder:text-stone-300 focus:outline-none focus:border-amber-400 transition-colors shadow-sm"
                />
              </div>

              {error && (
                <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="h-13 btn-gold rounded-2xl flex items-center justify-center gap-2 font-bold text-base disabled:opacity-60 cursor-pointer"
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
