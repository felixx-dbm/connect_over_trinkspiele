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
        className="w-full flex items-center gap-3 border border-[#14110F] p-4 hover:bg-amber-50 transition-colors cursor-pointer"
      >
        <QrCode size={18} className="text-amber-700 flex-shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">
            {t.challenge.title} <span className="text-amber-700">{t.challenge.titleAccent}</span>
          </p>
          <p className="text-[#4A3F2C] text-xs font-medium">{t.challenge.qrHint}</p>
        </div>
        <span className="text-[#6B5D42] text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border border-[#14110F] border-t-0 p-5 flex flex-col items-center gap-4">
          <div className="bg-white p-3 border border-[#E3DCCB]">
            <QRCodeSVG value={challengeUrl} size={180} />
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 border border-[#14110F] px-4 py-2 text-sm font-bold hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : t.challenge.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
