"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar, AlertCircle, Check, X } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import { validatePassword, passwordStrength } from "@/lib/validate";
import { useT } from "@/components/LanguageProvider";

function getAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

const STRENGTH_COLORS = ["", "bg-rose-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"] as const;
const STRENGTH_TEXT   = ["", "text-rose-500", "text-orange-500", "text-amber-600", "text-emerald-600"] as const;

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${met ? "text-emerald-600" : "text-stone-400"}`}>
      {met ? <Check size={10} /> : <X size={10} />}
      {label}
    </div>
  );
}

export default function RegisterPage() {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", dob: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const ageError = form.dob ? getAge(form.dob) < 18 : false;
  const passwordError = form.password.length > 0 ? validatePassword(form.password) : null;
  const strength = passwordStrength(form.password);

  const canSubmit =
    form.username.trim().length >= 2 &&
    form.email &&
    !passwordError &&
    form.password.length > 0 &&
    form.dob &&
    !ageError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const result = await signUp(form);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (result.needsConfirmation) { setConfirmed(true); return; }
    window.location.href = "/home";
  };

  if (confirmed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-300/50 animate-bounce-in">
          <Mail size={36} className="text-white" />
        </div>
        <div>
          <h2 className="font-display text-3xl text-stone-900 mb-2">
            {t.auth.confirmTitle} <span className="text-gradient">{t.auth.confirmTitleAccent}</span>
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed font-semibold">
            {t.auth.confirmText}<br />
            <span className="text-stone-800 font-extrabold">{form.email}</span>
          </p>
          <p className="text-stone-400 text-xs mt-3">{t.auth.confirmHint}</p>
        </div>
        <Link href="/login" className="h-12 px-8 btn-gold rounded-2xl flex items-center justify-center cursor-pointer">
          {t.auth.goToSignIn}
        </Link>
      </div>
    );
  }

  const inputClass = "w-full h-14 bg-white border border-amber-100 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-semibold shadow-sm";
  const inputErrorClass = "w-full h-14 bg-white border border-rose-300 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-sm font-semibold shadow-sm";

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <Link
        href="/"
        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors w-fit mb-8 cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-bold">{t.common.back}</span>
      </Link>

      <div className="mb-8">
        <div className="text-5xl mb-4 animate-bounce-in">⚔️</div>
        <h1 className="font-display text-4xl text-stone-900 leading-tight mb-1">
          {t.auth.registerTitle} <span className="text-gradient">{t.auth.registerTitleAccent}</span>
        </h1>
        <p className="text-stone-500 text-sm font-semibold">{t.auth.registerSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
          <input
            name="username"
            type="text"
            placeholder={t.auth.username}
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            minLength={2}
            maxLength={30}
            required
            className={`${inputClass} pl-11 pr-4`}
          />
        </div>

        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
          <input
            name="email"
            type="email"
            placeholder={t.auth.email}
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
            className={`${inputClass} pl-11 pr-4`}
          />
        </div>

        <div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t.auth.password}
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="new-password"
              required
              className={`${passwordError && form.password.length > 0 ? inputErrorClass : inputClass} pl-11 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {form.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1.5">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_COLORS[strength] : "bg-amber-100"}`} />
                ))}
              </div>
              <span className={`text-xs font-bold ${STRENGTH_TEXT[strength]}`}>{t.auth.strengthLabels[strength]}</span>
            </div>
          )}

          {(passwordFocused || form.password.length > 0) && (
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <PasswordRequirement met={form.password.length >= 8} label={t.auth.reqLength} />
              <PasswordRequirement met={/[A-Z]/.test(form.password)} label={t.auth.reqUpper} />
              <PasswordRequirement met={/[0-9]/.test(form.password)} label={t.auth.reqNumber} />
              <PasswordRequirement met={/[^A-Za-z0-9]/.test(form.password)} label={t.auth.reqSpecial} />
            </div>
          )}
        </div>

        <div>
          <div className="relative">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]}
              className={`${ageError ? inputErrorClass : inputClass} pl-11 pr-4 [color-scheme:light]`}
            />
          </div>
          {ageError && (
            <div className="flex items-center gap-2 mt-2 text-rose-600 text-xs font-bold">
              <AlertCircle size={12} /> {t.auth.ageError}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 font-semibold">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-1">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`w-full h-14 flex items-center justify-center text-base rounded-2xl cursor-pointer gap-2 ${
              canSubmit && !loading ? "btn-gold" : "bg-amber-100 text-amber-400 cursor-not-allowed font-bold"
            }`}
          >
            {loading ? t.auth.creatingAccount : t.auth.createAccount}
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center leading-relaxed font-semibold">
          {t.auth.terms}
        </p>
      </form>

      <p className="text-center text-sm text-stone-500 mt-4 font-semibold">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-extrabold transition-colors cursor-pointer">
          {t.auth.signInLink}
        </Link>
      </p>
    </div>
  );
}
