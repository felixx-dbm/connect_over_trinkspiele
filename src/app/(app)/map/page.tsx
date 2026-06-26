"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useT } from "@/components/LanguageProvider";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-amber-50">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const t = useT();
  const GAME_TYPES = [
    { label: t.map.all,   value: "all"        },
    { label: "Beer Pong", value: "beer_pong"   },
    { label: "Flunky Ball", value: "flunky_ball" },
    { label: "Freestyle", value: "freestyle"   },
  ];
  const [filter, setFilter] = useState<string>("all");

  return (
    <div className="h-screen flex flex-col pb-safe">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-white/92 backdrop-blur-md flex-shrink-0 z-10 border-b border-amber-100/80 shadow-sm shadow-amber-100/40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl text-stone-900">
            {t.map.title} <span className="text-gradient">{t.map.titleAccent}</span>
          </h1>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {GAME_TYPES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === value
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200/60"
                  : "bg-white border border-amber-200 text-stone-600 hover:border-amber-400"
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
