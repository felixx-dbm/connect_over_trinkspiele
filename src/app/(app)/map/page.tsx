"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useT } from "@/components/LanguageProvider";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#FAF8F3]">
      <div className="w-6 h-6 border-2 border-[#14110F] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const t = useT();
  const GAME_TYPES = [
    { label: t.map.all,     value: "all"         },
    { label: "Beer Pong",   value: "beer_pong"    },
    { label: "Flunky Ball", value: "flunky_ball"  },
    { label: "Freestyle",   value: "freestyle"    },
  ];
  const [filter, setFilter] = useState<string>("all");

  return (
    <div className="h-screen flex flex-col pb-safe bg-[#FAF8F3]">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-[#FAF8F3] flex-shrink-0 z-10 border-b border-[#14110F]">
        <p className="eyebrow mb-1">{t.map.title}</p>
        <h1 className="display text-3xl mb-4">{t.map.titleAccent}</h1>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {GAME_TYPES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex-shrink-0 px-4 py-2 border text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                filter === value
                  ? "bg-[#14110F] border-[#14110F] text-[#FAF8F3]"
                  : "bg-transparent border-[#E3DCCB] text-[#8C7A5B] hover:border-[#14110F] hover:text-[#14110F]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <MapView filter={filter} />
    </div>
  );
}