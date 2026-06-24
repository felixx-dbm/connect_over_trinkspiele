"use client";

import { useState, useEffect } from "react";
import { X, Share } from "lucide-react";

const STORAGE_KEY = "install_banner_dismissed";

export default function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (isIos && !isInstalled && !dismissed) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 z-[9998] animate-slide-up">
      <div className="bg-stone-900 text-white rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-stone-900/40">
        <img src="/Icon_192.png" alt="Prost" className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug">Install Prost</p>
          <p className="text-xs text-stone-400 font-semibold mt-0.5 leading-snug flex items-center gap-1 flex-wrap">
            Tap <Share size={11} className="inline text-stone-300 flex-shrink-0" /> then
            <span className="text-white font-bold">Add to Home Screen</span>
          </p>
        </div>
        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-stone-600 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
