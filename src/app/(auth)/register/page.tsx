"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState("");
  const [ageError, setAgeError] = useState(false);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDob(value);
    if (value) {
      const birth = new Date(value);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      setAgeError(age < 18);
    } else {
      setAgeError(false);
    }
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

      <form className="flex flex-col gap-4 flex-1">
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Username"
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
          />
        </div>

        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="email"
            placeholder="Email address"
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
          />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div>
          <div className="relative">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="date"
              value={dob}
              onChange={handleDobChange}
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
              <span>You must be 18 or older to register</span>
            </div>
          )}
        </div>

        <div className="mt-2">
          <Link
            href="/home"
            className={`w-full h-14 flex items-center justify-center text-zinc-950 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer ${
              ageError
                ? "bg-zinc-700 pointer-events-none text-zinc-500"
                : "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 amber-glow"
            }`}
          >
            CREATE ACCOUNT
          </Link>
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
