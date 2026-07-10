"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LanguageProvider";

const FLOATERS = [
  { emoji: "🍺", x: 8,  y: 12, r: -15, delay: 0   },
  { emoji: "🍻", x: 78, y: 8,  r: 12,  delay: 0.6 },
  { emoji: "🥂", x: 88, y: 55, r: -8,  delay: 1.2 },
  { emoji: "🍹", x: 5,  y: 68, r: 18,  delay: 0.4 },
  { emoji: "🎲", x: 60, y: 80, r: -20, delay: 0.9 },
  { emoji: "🏓", x: 20, y: 85, r: 10,  delay: 1.5 },
  { emoji: "⚡", x: 72, y: 22, r: 5,   delay: 0.2 },
  { emoji: "🍷", x: 38, y: 6,  r: -6,  delay: 1.1 },
];

export default function AgeGate() {
  const [denied, setDenied] = useState(false);
  const t = useT();

  if (denied) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-8 animate-bounce-in">🚫</div>
          <h2 className="font-display text-3xl text-stone-900 mb-4">{t.ageGate.sorryTitle}</h2>
          <p className="text-stone-500 leading-relaxed text-base">{t.ageGate.sorryText}</p>
          <button
            onClick={() => setDenied(false)}
            className="link-arrow text-sm mt-8 cursor-pointer"
          >
            {t.ageGate.goBack}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-amber-200/55 blur-3xl animate-blob pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl animate-blob-2 pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-violet-200/35 blur-3xl animate-blob-3 pointer-events-none" />
      <div className="absolute bottom-1/3 -right-10 w-56 h-56 rounded-full bg-emerald-200/30 blur-3xl animate-blob pointer-events-none" />

      {FLOATERS.map(({ emoji, x, y, r, delay }, i) => (
        <div
          key={i}
          className="absolute select-none pointer-events-none text-3xl opacity-25 animate-float"
          style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, animationDelay: `${delay}s` }}
        >
          {emoji}
        </div>
      ))}

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <div className="mb-7 animate-bounce-in">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-300/40 blur-2xl scale-150 animate-pulse-glow" />
            <div className="relative text-8xl drop-shadow-lg animate-float">🍺</div>
          </div>
        </div>

        <h1 className="font-display text-6xl tracking-wide mb-1 leading-none">
          <span className="text-stone-900">PR</span>
          <span className="text-gradient">OST</span>
        </h1>
        <p className="text-stone-600 text-xs tracking-[0.22em] uppercase mb-10 font-bold">
          {t.ageGate.tagline}
        </p>

        <div className="w-full bg-white/90 backdrop-blur-sm p-6 mb-4 border border-amber-100 shadow-lg shadow-amber-100/60">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-md ">
            <span className="text-white font-display text-sm tracking-widest">18+</span>
          </div>
          
          <p className="text-stone-500 text-sm leading-relaxed">{t.ageGate.description}</p>
        </div>

        <Link
          href="/login"
          className="w-full h-14 flex items-center justify-center text-base cursor-pointer mb-3 btn-gold gap-2"
        >
          {t.ageGate.enter}
        </Link>

        <button
          onClick={() => setDenied(true)}
          className="text-sm text-stone-600 hover:text-stone-600 transition-colors cursor-pointer py-2 font-semibold"
        >
          {t.ageGate.underAge}
        </button>
      </div>
    </div>
  );
}