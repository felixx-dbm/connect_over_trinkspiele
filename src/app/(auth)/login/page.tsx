"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/redirect";
import { useT } from "@/components/LanguageProvider";
import Marquee from "@/components/Marquee";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const t = useT();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
      window.location.href = safeRedirect(next);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect(next))}`,
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      {/* Full-bleed break-out: cancels the parent's max-w-sm/mx-auto
          constraint so the ticker spans the true viewport width.
          Relies on the (auth) layout wrapper having overflow-hidden. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen -mt-8 mb-8" style={{ minHeight: 40 }}>
        <Marquee />
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 text-[#8C7A5B] hover:text-[#14110F] transition-colors w-fit mb-10 cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">{t.common.back}</span>
      </Link>

      <div className="mb-10">
        <p className="eyebrow mb-2">{t.auth.loginSubtitle}</p>
        <h1 className="display text-5xl leading-[0.95]">
          {t.auth.loginTitle}
          <br />
          {t.auth.loginTitleAccent}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="relative">
          <Mail size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C7A5B]" />
          <input
            name="email"
            type="email"
            placeholder={t.auth.email}
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
            className="w-full h-14 bg-transparent border-b border-[#14110F] pl-7 pr-4 text-[#14110F] placeholder:text-[#8C7A5B] focus:outline-none focus:border-b-2 transition-all text-sm font-medium"
          />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C7A5B]" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t.auth.password}
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
            className="w-full h-14 bg-transparent border-b border-[#14110F] pl-7 pr-12 text-[#14110F] placeholder:text-[#8C7A5B] focus:outline-none focus:border-b-2 transition-all text-sm font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8C7A5B] hover:text-[#14110F] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-[#8C7A5B] hover:text-[#14110F] transition-colors cursor-pointer">
            {t.auth.forgotPassword}
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[#14110F] text-sm border border-[#14110F] px-4 py-3 font-medium">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full h-14 flex items-center justify-center text-base cursor-pointer gap-2 mt-2 ${
            !loading ? "btn-gold" : "border border-[#E3DCCB] text-[#8C7A5B] cursor-not-allowed font-semibold"
          }`}
        >
          {loading ? t.auth.signingIn : t.auth.signIn}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-[#E3DCCB]" />
          <span className="eyebrow">{t.common.or}</span>
          <div className="flex-1 h-px bg-[#E3DCCB]" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading}
          className="btn-outline w-full h-14 flex items-center justify-center gap-3 text-sm cursor-pointer disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {oauthLoading ? t.auth.redirecting : t.auth.continueGoogle}
        </button>
      </form>

      <p className="text-center text-sm text-[#8C7A5B] mt-6 font-medium">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="text-[#14110F] font-semibold underline underline-offset-2 cursor-pointer">
          {t.auth.registerHere}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}