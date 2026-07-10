"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Share } from "lucide-react";
import { safeStorage } from "@/lib/browser";

const STORAGE_KEY = "install_banner_dismissed";

export default function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = safeStorage.get(STORAGE_KEY);
    if (isIos && !isInstalled && !dismissed) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    safeStorage.set(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 z-[9998] animate-slide-up">
      <div className="bg-[#14110F] text-[#FAF8F3] border border-[#14110F] p-4 flex items-center gap-3">
        <Image src="/Icon_192.png" alt="Prost" width={40} height={40} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug">Install Prost</p>
          <p className="text-xs text-[#FAF8F3]/60 font-medium mt-0.5 leading-snug flex items-center gap-1 flex-wrap">
            Tap <Share size={11} className="inline text-[#FAF8F3]/60 flex-shrink-0" /> then
            <span className="text-[#FAF8F3] font-bold">Add to Home Screen</span>
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss install banner"
          className="w-7 h-7 border border-[#FAF8F3]/30 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#FAF8F3]/10 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
