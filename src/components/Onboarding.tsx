"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, X } from "lucide-react";
import { useT } from "@/components/LanguageProvider";
import { safeStorage } from "@/lib/browser";

const STORAGE_KEY = "onboarding_v1_done";

type Slide = {
  emoji: string;
  bg: string;
  border: string;
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
    bg: "bg-amber-600", border: "border-amber-700", accentText: "text-amber-700",
    titleKey: "s1Title", descKey: "s1Desc",
    chipKeys: ["s1c1", "s1c2", "s1c3"],
  },
  {
    emoji: "🗺️",
    bg: "bg-sky-700", border: "border-sky-800", accentText: "text-sky-700",
    titleKey: "s2Title", descKey: "s2Desc",
    chipKeys: ["s2c1", "s2c2", "s2c3"],
  },
  {
    emoji: "⚔️",
    bg: "bg-rose-700", border: "border-rose-800", accentText: "text-rose-700",
    titleKey: "s3Title", descKey: "s3Desc",
    chipKeys: ["s3c1", "s3c2", "s3c3"],
  },
  {
    emoji: "👥",
    bg: "bg-violet-700", border: "border-violet-800", accentText: "text-violet-700",
    titleKey: "s4Title", descKey: "s4Desc",
    chipKeys: ["s4c1", "s4c2", "s4c3"],
  },
  {
    emoji: "🏆",
    bg: "bg-emerald-700", border: "border-emerald-800", accentText: "text-emerald-700",
    titleKey: "s5Title", descKey: "s5Desc",
    chipKeys: ["s5c1", "s5c2", "s5c3"],
  },
];

export default function Onboarding() {
  const t = useT();
  const o = t.onboarding;
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    function show() { setVisible(true); }
    if (typeof window !== "undefined" && !safeStorage.get(STORAGE_KEY)) {
      show();
    }
  }, []);

  const finish = () => {
    safeStorage.set(STORAGE_KEY, "1");
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  const goTo = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
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
      className="fixed inset-0 z-[9999] flex flex-col bg-[#FAF8F3]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar: progress + skip */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4 flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1} of ${SLIDES.length}`}
              aria-current={i === step}
              className="h-11 px-1.5 flex items-center justify-center cursor-pointer group"
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-[#14110F]"
                    : i < step
                    ? "w-3 bg-[#6B5D42]"
                    : "w-3 bg-[#E3DCCB]"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={finish}
          aria-label="Skip onboarding"
          className="w-8 h-8 border border-[#14110F] flex items-center justify-center hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {/* Illustration card */}
        <div
          key={step}
          className={`w-52 h-52 ${slide.bg} border ${slide.border} flex items-center justify-center mb-8 animate-bounce-in`}
        >
          <span className="text-8xl select-none">{slide.emoji}</span>
        </div>

        {/* Title */}
        <h1
          key={`title-${step}`}
          className="display text-3xl text-center leading-tight mb-4 animate-slide-up whitespace-pre-line"
        >
          {o[slide.titleKey] as string}
        </h1>

        {/* Description */}
        <p
          key={`desc-${step}`}
          className="text-[#4A3F2C] text-center text-sm font-medium leading-relaxed mb-6 max-w-xs animate-slide-up"
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
              className={`text-xs font-bold px-3 py-1.5 border border-current ${slide.accentText}`}
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
          className={`w-full h-14 flex items-center justify-center gap-3 font-bold text-base transition-colors cursor-pointer ${
            isLast
              ? "btn-gold"
              : "bg-[#14110F] text-[#FAF8F3] hover:bg-[#322C24]"
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
        <p className="text-center text-[#6B5D42] text-xs font-medium mt-4">
          {step + 1} / {SLIDES.length}
        </p>
      </div>
    </div>
  );
}
