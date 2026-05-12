"use client";

import { useState } from "react";
import Link from "next/link";

export default function AgeGate() {
  const [denied, setDenied] = useState(false);

  if (denied) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6 select-none">🚫</div>
          <h2 className="font-display text-2xl text-zinc-100 mb-3">Sorry</h2>
          <p className="text-zinc-400 leading-relaxed">
            You must be 18 or older to use Trinkspiel. Come back when you&apos;re of legal age.
          </p>
          <button
            onClick={() => setDenied(false)}
            className="mt-8 text-sm text-zinc-500 hover:text-zinc-300 underline transition-colors cursor-pointer"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grain min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Beer mug SVG */}
        <div className="mb-8">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_24px_rgba(245,158,11,0.4)]"
          >
            <rect x="12" y="28" width="52" height="56" rx="4" fill="#d97706" />
            <rect x="14" y="30" width="48" height="52" rx="3" fill="#f59e0b" />
            <rect x="18" y="34" width="40" height="8" rx="2" fill="#fbbf24" opacity="0.6" />
            <path d="M64 40 Q80 40 80 52 Q80 64 64 64" stroke="#d97706" strokeWidth="6" strokeLinecap="round" fill="none" />
            <rect x="14" y="30" width="48" height="18" rx="3" fill="#fefce8" opacity="0.9" />
            <rect x="16" y="32" width="44" height="8" rx="2" fill="white" opacity="0.7" />
          </svg>
        </div>

        {/* App name */}
        <h1 className="font-display text-5xl text-zinc-100 tracking-wide mb-2">
          TRINK<span className="text-amber-400">SPIEL</span>
        </h1>
        <p className="text-zinc-500 text-sm tracking-widest uppercase mb-12">
          Battle. Drink. Conquer.
        </p>

        {/* Age verification card */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-400 font-display text-sm">18+</span>
          </div>
          <h2 className="text-zinc-100 font-semibold text-lg mb-2">Age Verification</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            This app contains content related to alcohol and drinking games. You must be 18 or older to continue.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full h-14 flex items-center justify-center bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] amber-glow cursor-pointer mb-3"
        >
          I AM 18 OR OLDER — ENTER
        </Link>

        <button
          onClick={() => setDenied(true)}
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer py-2"
        >
          I am under 18
        </button>
      </div>
    </div>
  );
}
