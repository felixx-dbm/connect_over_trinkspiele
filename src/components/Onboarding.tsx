"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, X } from "lucide-react";
import { useT } from "@/components/LanguageProvider";
import { safeStorage } from "@/lib/browser";

const STORAGE_KEY = "onboarding_v1_done";

type Slide = {
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  shadowColor: string;
  accentBg: string;
  accentText: string;
  titleKey: keyof ReturnType<typeof useT>["onboarding"];
  descKey:  keyof ReturnType<typeof useT>["onboarding"];
  chipKeys: [
    keyof ReturnType<typeof useT>["onboarding"],
    keyof ReturnType<typeof useT>["onboarding"],
    keyof ReturnType<typeof useT>["onboarding"],
  ];
};

const SLIDES: Slide[] = [
  {
    emoji: "🍺",
    gradientFrom: "from-amber-400", gradientTo: "to-orange-500",
    shadowColor: "shadow-amber-300/60",
    accentBg: "bg-amber-100", accentText: "text-amber-700",
    titleKey: "s1Title", descKey: "s1Desc",
    chipKeys: ["s1c1", "s1c2", "s1c3"],
  },
  {
    emoji: "🗺️",
    gradientFrom: "from-sky-400", gradientTo: "to-blue-500",
    shadowColor: "shadow-sky-300/60",
    accentBg: "bg-sky-100", accentText: "text-sky-700",
    titleKey: "s2Title", descKey: "s2Desc",
    chipKeys: ["s2c1", "s2c2", "s2c3"],
  },
  {
    emoji: "⚔️",
    gradientFrom: "from-rose-400", gradientTo: "to-orange-500",
    shadowColor: "shadow-rose-300/60",
    accentBg: "bg-rose-100", accentText: "text-rose-700",
    titleKey: "s3Title", descKey: "s3Desc",
    chipKeys: ["s3c1", "s3c2", "s3c3"],
  },
  {
    emoji: "👥",
    gradientFrom: "from-violet-400", gradientTo: "to-purple-600",
    shadowColor: "shadow-violet-300/60",
    accentBg: "bg-violet-100", accentText: "text-violet-700",
    titleKey: "s4Title", descKey: "s4Desc",
    chipKeys: ["s4c1", "s4c2", "s4c3"],
  },
  {
    emoji: "🏆",
    gradientFrom: "from-emerald-400", gradientTo: "to-teal-500",
    shadowColor: "shadow-emerald-300/60",
    accentBg: "bg-emerald-100", accentText: "text-emerald-700",
    titleKey: "s5Title", descKey: "s5Desc",
    chipKeys: ["s5c1", "s5c2", "s5c3"],
  },
];

export default function Onboarding() {
  const t = useT();
  const o = t.onboarding;
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<"in" | "out">("in");
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !safeStorage.get(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const finish = () => {
    safeStorage.set(STORAGE_KEY, "1");
    setVisible(false);
  };

  const goTo = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
    setAnimDir(next > step ? "out" : "in");
    setStep(next);
  };

  const handleNext = () => {
    if (step === SLIDES.length - 1) { finish(); return; }
    goTo(step + 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && step < SLIDES.length - 1) goTo(step + 1);
      else if (delta < 0 && step > 0) goTo(step - 1);
    }
    touchStartX.current = null;
  };

  if (!visible) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-b from-amber-50 to-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar: progress + skip */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4 flex-shrink-0">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === step
                  ? "w-6 bg-amber-500"
                  : i < step
                  ? "w-3 bg-amber-300"
                  : "w-3 bg-stone-200"
              }`}
            />
          ))}
        </div>
        <button
          onClick={finish}
          aria-label="Skip onboarding"
          className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer shadow-sm"
        >
          <X size={14} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {/* Illustration card */}
        <div
          key={step}
          className={`relative w-52 h-52 rounded-[2.5rem] bg-gradient-to-br ${slide.gradientFrom} ${slide.gradientTo} shadow-2xl ${slide.shadowColor} flex items-center justify-center mb-8 animate-bounce-in`}
        >
          {/* Decorative ring */}
          <div className="absolute inset-0 rounded-[2.5rem] border-4 border-white/20" />
          {/* Inner glow */}
          <div className="absolute inset-4 rounded-[2rem] bg-white/10" />
          <span className="text-8xl select-none relative z-10">{slide.emoji}</span>
        </div>

        {/* Title */}
        <h1
          key={`title-${step}`}
          className="font-display text-3xl text-center text-stone-900 leading-tight mb-4 animate-slide-up whitespace-pre-line"
        >
          {o[slide.titleKey] as string}
        </h1>

        {/* Description */}
        <p
          key={`desc-${step}`}
          className="text-stone-500 text-center text-sm font-semibold leading-relaxed mb-6 max-w-xs animate-slide-up"
          style={{ animationDelay: "60ms" }}
        >
          {o[slide.descKey] as string}
        </p>

        {/* Feature chips */}
        <div
          key={`chips-${step}`}
          className="flex gap-2 flex-wrap justify-center animate-slide-up"
          style={{ animationDelay: "120ms" }}
        >
          {slide.chipKeys.map((key) => (
            <span
              key={key}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${slide.accentBg} ${slide.accentText} border border-current/20`}
            >
              {o[key] as string}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-12 flex-shrink-0">
        <button
          onClick={handleNext}
          className={`w-full h-14 flex items-center justify-center gap-3 font-bold text-base rounded-2xl transition-all cursor-pointer ${
            isLast
              ? "btn-gold shadow-xl shadow-amber-200"
              : "bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20"
          }`}
        >
          {isLast ? o.letsgo : (
            <>
              {o.next}
              <ChevronRight size={18} />
            </>
          )}
        </button>

        {/* Step counter */}
        <p className="text-center text-stone-400 text-xs font-semibold mt-4">
          {step + 1} / {SLIDES.length}
        </p>
      </div>
    </div>
  );
}
