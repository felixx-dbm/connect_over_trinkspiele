"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar, AlertCircle } from "lucide-react";
import { signUp } from "@/app/actions/auth";

function getAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", dob: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ageError = form.dob ? getAge(form.dob) < 18 : false;
  const passwordError =
    form.password.length > 0 && (form.password.length < 8 || form.password.length > 72);
  const canSubmit =
    form.username && form.email && form.password && form.dob && !ageError && !passwordError;

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

    router.push("/home");
  };

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
              placeholder="Password (8–72 characters)"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              className={`w-full h-14 bg-zinc-900 border rounded-xl pl-11 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all text-sm ${
                passwordError
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
          {passwordError && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
              <AlertCircle size={12} />
              Password must be between 8 and 72 characters
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
