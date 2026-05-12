"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Filter } from "lucide-react";

const GAME_TYPES = ["All", "Beer Pong", "Flunky Ball", "Freestyle"];

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-zinc-900">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const [filter, setFilter] = useState("All");

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-md flex-shrink-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl text-zinc-100">
            NEARBY <span className="text-amber-400">BATTLES</span>
          </h1>
          <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:border-zinc-700 transition-colors cursor-pointer">
            <Filter size={12} />
            Filter
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {GAME_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filter === type
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <MapView filter={filter} />
    </div>
  );
}
