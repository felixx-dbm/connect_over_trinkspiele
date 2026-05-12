"use client";

import { useState } from "react";
import { MapPin, Navigation, Filter, Swords, Users, ChevronRight, X } from "lucide-react";

const GAME_TYPES = ["All", "Beer Pong", "Flunky Ball", "Freestyle"];

const challenges = [
  { id: "1", crew: "BierBrigade", game: "Beer Pong", mode: "crew", distance: "0.3 km", members: 4, x: 35, y: 40 },
  { id: "2", crew: "FlunkyMasters", game: "Flunky Ball", mode: "solo", distance: "0.7 km", members: 1, x: 60, y: 55 },
  { id: "3", crew: "KegNation", game: "Beer Pong", mode: "regional", distance: "1.1 km", members: 6, x: 20, y: 65 },
  { id: "4", crew: "ProRingers", game: "Freestyle", mode: "crew", distance: "1.8 km", members: 3, x: 75, y: 30 },
];

export default function MapPage() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = filter === "All" ? challenges : challenges.filter((c) => c.game === filter);
  const selectedChallenge = challenges.find((c) => c.id === selected);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-md">
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

      {/* Fake map */}
      <div className="flex-1 relative bg-zinc-900 overflow-hidden" style={{ minHeight: "400px" }}>
        {/* Map grid lines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(#71717a 1px, transparent 1px), linear-gradient(90deg, #71717a 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Road-like lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bg-zinc-700 h-0.5 w-3/4 top-1/3 left-0 rotate-[-5deg]" />
          <div className="absolute bg-zinc-700 w-0.5 h-3/4 left-1/2 top-0 rotate-[3deg]" />
          <div className="absolute bg-zinc-700 h-0.5 w-1/2 bottom-1/4 right-0 rotate-[8deg]" />
          <div className="absolute bg-zinc-700 w-0.5 h-1/2 left-1/4 top-1/4 rotate-[-2deg]" />
        </div>
        {/* Block fills */}
        <div className="absolute opacity-5">
          <div className="absolute bg-zinc-500 rounded w-16 h-12 top-16 left-20" />
          <div className="absolute bg-zinc-500 rounded w-20 h-10 top-32 right-16" />
          <div className="absolute bg-zinc-500 rounded w-12 h-16 bottom-24 left-1/3" />
          <div className="absolute bg-zinc-500 rounded w-24 h-8 bottom-16 right-1/4" />
        </div>

        {/* Challenge markers */}
        {filtered.map((challenge) => (
          <button
            key={challenge.id}
            onClick={() => setSelected(challenge.id === selected ? null : challenge.id)}
            className="absolute cursor-pointer group"
            style={{ left: `${challenge.x}%`, top: `${challenge.y}%` }}
          >
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
              selected === challenge.id
                ? "bg-amber-500 border-amber-400 scale-125 amber-glow-sm"
                : "bg-zinc-900/90 border-amber-500/50 hover:border-amber-400 hover:scale-110"
            }`}>
              <Swords size={16} className={selected === challenge.id ? "text-zinc-950" : "text-amber-400"} />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
          </button>
        ))}

        {/* My location */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-400">
            <Navigation size={18} className="text-blue-400" />
          </div>
          <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-ping" />
        </div>

        {/* Selected challenge popup */}
        {selectedChallenge && (
          <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 backdrop-blur border border-amber-500/30 rounded-2xl p-4 amber-glow-sm">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {selectedChallenge.game}
              </span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs text-zinc-500 capitalize">{selectedChallenge.mode}</span>
              <span className="text-xs text-zinc-600">·</span>
              <MapPin size={11} className="text-zinc-600" />
              <span className="text-xs text-zinc-500">{selectedChallenge.distance}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-100 font-semibold">{selectedChallenge.crew}</p>
                <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                  <Users size={11} />
                  {selectedChallenge.members} player{selectedChallenge.members > 1 ? "s" : ""}
                </p>
              </div>
              <button className="h-10 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2">
                Accept
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Challenge list */}
      <div className="bg-zinc-950 border-t border-zinc-800 px-4 pt-4 pb-2">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">{filtered.length} challenges nearby</p>
        <div className="flex flex-col gap-2">
          {filtered.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => setSelected(challenge.id)}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-xl p-3 transition-all cursor-pointer text-left w-full"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Swords size={14} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-sm font-medium truncate">{challenge.crew}</p>
                <p className="text-zinc-600 text-xs">{challenge.game}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-zinc-400 text-xs">{challenge.distance}</p>
                <p className="text-zinc-600 text-xs capitalize">{challenge.mode}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
