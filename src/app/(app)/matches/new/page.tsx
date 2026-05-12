"use client";

import { useState } from "react";
import { ArrowLeft, Navigation, Users, Globe, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

const GAME_TYPES = [
  {
    id: "beer_pong",
    name: "Beer Pong",
    desc: "Classic cup elimination",
    icon: "🏓",
  },
  {
    id: "flunky_ball",
    name: "Flunky Ball",
    desc: "Outdoor team relay",
    icon: "⚽",
  },
  {
    id: "freestyle",
    name: "Freestyle",
    desc: "Any game, your rules",
    icon: "🎲",
  },
];

const MODES = [
  {
    id: "solo",
    name: "Solo",
    desc: "You vs a random opponent nearby",
    icon: Navigation,
    geoRequired: true,
  },
  {
    id: "crew",
    name: "Crew Battle",
    desc: "Challenge a specific crew",
    icon: Users,
    geoRequired: false,
  },
  {
    id: "regional",
    name: "Open Challenge",
    desc: "Post publicly on the map",
    icon: Globe,
    geoRequired: true,
  },
];

export default function NewMatchPage() {
  const [gameType, setGameType] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);

  const selectedMode = MODES.find((m) => m.id === mode);
  const canProceed = gameType && mode;

  const handleStart = () => {
    if (!canProceed) return;
    setFinding(true);
    setTimeout(() => setFinding(false), 3000);
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl text-zinc-100">
          NEW <span className="text-amber-400">BATTLE</span>
        </h1>
      </div>

      {/* Game type */}
      <div className="mb-7">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">1. Choose Game</p>
        <div className="flex flex-col gap-2">
          {GAME_TYPES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGameType(g.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                gameType === g.id
                  ? "bg-amber-500/10 border-amber-500/40 amber-glow-sm"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <span className="text-2xl select-none">{g.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${gameType === g.id ? "text-amber-300" : "text-zinc-200"}`}>
                  {g.name}
                </p>
                <p className="text-zinc-500 text-xs">{g.desc}</p>
              </div>
              {gameType === g.id && (
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-zinc-950" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="mb-7">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">2. Choose Mode</p>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                mode === m.id
                  ? "bg-amber-500/10 border-amber-500/40 amber-glow-sm"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mode === m.id ? "bg-amber-500/20" : "bg-zinc-800"
              }`}>
                <m.icon size={18} className={mode === m.id ? "text-amber-400" : "text-zinc-400"} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${mode === m.id ? "text-amber-300" : "text-zinc-200"}`}>
                    {m.name}
                  </p>
                  {m.geoRequired && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full border border-zinc-700">
                      GPS
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs">{m.desc}</p>
              </div>
              {mode === m.id && (
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-zinc-950" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Geo notice */}
      {selectedMode?.geoRequired && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-6 flex items-start gap-3">
          <Navigation size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Your location will be requested to find nearby opponents.
            Coordinates are fuzzed to ±200m for privacy.
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={!canProceed || finding}
        className={`w-full h-14 flex items-center justify-center gap-3 font-bold text-base rounded-2xl transition-all duration-200 cursor-pointer ${
          canProceed && !finding
            ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 active:scale-[0.98] amber-glow"
            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
        }`}
      >
        {finding ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Finding opponent…
          </>
        ) : (
          <>
            {mode === "solo"
              ? "Find Opponent"
              : mode === "crew"
              ? "Send Challenge"
              : "Post to Map"}
            <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}
