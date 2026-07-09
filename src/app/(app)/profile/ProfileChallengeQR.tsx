"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { QrCode, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/browser";

const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

type Translations = {
  challenge: {
    title: string;
    titleAccent: string;
    qrHint: string;
    copyLink: string;
  };
};

export default function ProfileChallengeQR({ userId, t }: { userId: string; t: Translations }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const challengeUrl = `${origin}/challenge/${userId}`;

  function copyLink() {
    copyToClipboard(challengeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-white border border-amber-200 rounded-2xl p-4 hover:bg-amber-50 transition-colors cursor-pointer shadow-sm"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <QrCode size={16} className="text-amber-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-stone-800 text-sm font-bold">
            {t.challenge.title} <span className="text-amber-500">{t.challenge.titleAccent}</span>
          </p>
          <p className="text-stone-400 text-xs font-semibold">{t.challenge.qrHint}</p>
        </div>
        <span className="text-stone-300 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white border border-amber-100 rounded-2xl p-5 mt-2 flex flex-col items-center gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
            <QRCodeSVG value={challengeUrl} size={180} />
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-bold text-stone-600 hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? "Copied!" : t.challenge.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
