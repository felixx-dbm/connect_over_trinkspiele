"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar, AlertCircle, Check, X } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import { validatePassword, passwordStrength } from "@/lib/validate";

function getAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"] as const;
const STRENGTH_TEXT = ["", "text-red-400", "text-orange-400", "text-yellow-400", "text-green-400"] as const;

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? "text-green-400" : "text-zinc-600"}`}>
      {met ? <Check size={10} /> : <X size={10} />}
      {label}
    </div>
  );
}

export default function RegisterPage() {
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

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsConfirmation) {
      setConfirmed(true);
      return;
    }

    window.location.href = "/home";
  };

  if (confirmed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
          <Mail size={32} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-display text-3xl text-zinc-100 mb-2">CHECK YOUR <span className="text-amber-400">EMAIL</span></h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            We sent a confirmation link to<br />
            <span className="text-zinc-200 font-medium">{form.email}</span>
          </p>
          <p className="text-zinc-600 text-xs mt-3">Click the link in the email to activate your account, then sign in.</p>
        </div>
        <Link href="/login" className="h-12 px-8 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl flex items-center justify-center transition-all cursor-pointer">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <Link
        href="/"
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors w-fit mb-8 cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-4xl text-zinc-100 mb-2">
          JOIN THE<br />
          <span className="text-amber-400">BATTLE</span>
        </h1>
        <p className="text-zinc-500 text-sm">Create your account to start playing</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            minLength={2}
            maxLength={30}
            required
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
          />
        </div>

        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
          />
        </div>

        <div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="new-password"
              required
              className={`w-full h-14 bg-zinc-900 border rounded-xl pl-11 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all text-sm ${
                passwordError && form.password.length > 0
                  ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                  : "border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength bar */}
          {form.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength ? STRENGTH_COLORS[strength] : "bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs ${STRENGTH_TEXT[strength]}`}>
                {STRENGTH_LABELS[strength]}
              </span>
            </div>
          )}

          {/* Requirements checklist — shows when focused or has content */}
          {(passwordFocused || form.password.length > 0) && (
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <PasswordRequirement met={form.password.length >= 8} label="8+ characters" />
              <PasswordRequirement met={/[A-Z]/.test(form.password)} label="Uppercase letter" />
              <PasswordRequirement met={/[0-9]/.test(form.password)} label="Number" />
              <PasswordRequirement met={/[^A-Za-z0-9]/.test(form.password)} label="Special character" />
            </div>
          )}
        </div>

        <div>
          <div className="relative">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]}
              className={`w-full h-14 bg-zinc-900 border rounded-xl pl-11 pr-4 text-zinc-100 focus:outline-none focus:ring-1 transition-all text-sm [color-scheme:dark] ${
                ageError
                  ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                  : "border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20"
              }`}
            />
          </div>
          {ageError && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
              <AlertCircle size={12} />
              You must be 18 or older to register
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-2">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`w-full h-14 flex items-center justify-center text-zinc-950 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer ${
              canSubmit && !loading
                ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 amber-glow"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Creating account…" : "CREATE ACCOUNT"}
          </button>
        </div>

        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          By creating an account you confirm you are 18+ and agree to our terms.
        </p>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer">
          Sign in
        </Link>
      </p>
    </div>
  );
}
