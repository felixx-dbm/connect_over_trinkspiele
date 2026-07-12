"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden bg-amber-50">
      {/* Bernsteinfarbene Design-Blobs im Hintergrund (passend zum Prost-Look) */}
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-amber-200/55 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-violet-200/35 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* W-Lan-Aus Symbol in einer schicken Box */}
        <div className="w-16 h-16 border border-[#14110F] flex items-center justify-center mb-6 bg-white shadow-md">
          <WifiOff size={28} className="text-amber-700" />
        </div>

        {/* Deutsche Version */}
        <h1 className="font-display text-4xl mb-4 italic text-[#14110F]">
          Keine Verbindung
        </h1>
        <p className="text-sm text-[#4A3F2C] font-medium leading-relaxed mb-1">
          Prost benötigt eine Internetverbindung, um Spiele, Crews und die Karte zu laden.
        </p>
        
        {/* Englische Übersetzung als Untertitel */}
        <p className="text-xs text-[#6B5D42] mb-8 font-semibold">
          (Prost needs an internet connection to load matches, crews and the map.)
        </p>

        {/* Interaktiver Reload-Button */}
        <button
          onClick={handleReload}
          className="w-full h-12 btn-gold flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={16} />
          Erneut versuchen / Retry
        </button>
      </div>
    </main>
  );
}
