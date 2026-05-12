"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Trophy, Swords } from "lucide-react";

export default function MatchPage() {
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const match = {
    id: "active-1",
    game: "Beer Pong",
    mode: "Solo",
    status: "active" as const,
    challenger: { name: "BeerHero", initials: "BH", isMe: true },
    opponent: { name: "KegLord", initials: "KL", isMe: false },
    location: "Near Marienplatz",
    started: "12 min ago",
  };

  const statusConfig = {
    open: { label: "Waiting", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    active: { label: "In Progress", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    completed: { label: "Completed", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
  };
  const status = statusConfig[match.status];

  if (submitted) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col items-center justify-center text-center gap-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
          result === "win"
            ? "bg-amber-500/10 border-2 border-amber-500/40"
            : "bg-zinc-800 border-2 border-zinc-700"
        }`}>
          {result === "win"
            ? <Trophy size={40} className="text-amber-400" />
            : <XCircle size={40} className="text-zinc-500" />}
        </div>
        <div>
          <h2 className="font-display text-3xl text-zinc-100 mb-2">
            {result === "win" ? (
              <>YOU <span className="text-amber-400">WIN!</span></>
            ) : (
              <>BETTER LUCK<br /><span className="text-zinc-400">NEXT TIME</span></>
            )}
          </h2>
          <p className="text-zinc-500 text-sm">
            {result === "win"
              ? "Result submitted. Win added to your record!"
              : "Result submitted. Keep practicing!"}
          </p>
        </div>
        <Link
          href="/home"
          className="h-12 px-8 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <Swords size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl text-zinc-100">
          MATCH <span className="text-amber-400">LOBBY</span>
        </h1>
      </div>

      {/* Status + meta */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${status.bg} ${status.color}`}>
          {match.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          {status.label}
        </span>
        <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400">
          {match.game}
        </span>
        <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400">
          {match.mode}
        </span>
      </div>

      {/* VS card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-zinc-800/30 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          {/* Challenger */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-lg">
              {match.challenger.initials}
            </div>
            <p className="text-zinc-200 font-semibold text-sm text-center">{match.challenger.name}</p>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              You
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-2xl text-amber-400">VS</span>
            <Swords size={16} className="text-zinc-600" />
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center font-display text-zinc-300 text-lg">
              {match.opponent.initials}
            </div>
            <p className="text-zinc-200 font-semibold text-sm text-center">{match.opponent.name}</p>
            <span className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
              Opponent
            </span>
          </div>
        </div>
      </div>

      {/* Match details */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-2">
          <MapPin size={14} className="text-zinc-600" />
          <div>
            <p className="text-zinc-500 text-xs">Location</p>
            <p className="text-zinc-300 text-sm font-medium">{match.location}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-2">
          <Clock size={14} className="text-zinc-600" />
          <div>
            <p className="text-zinc-500 text-xs">Started</p>
            <p className="text-zinc-300 text-sm font-medium">{match.started}</p>
          </div>
        </div>
      </div>

      {/* Submit result */}
      {match.status === "active" && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Submit Result</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setResult("win")}
              className={`h-14 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                result === "win"
                  ? "bg-amber-500 border-amber-500 text-zinc-950 amber-glow"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-amber-500/30"
              }`}
            >
              <Trophy size={16} />
              I Won
            </button>
            <button
              onClick={() => setResult("loss")}
              className={`h-14 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                result === "loss"
                  ? "bg-zinc-700 border-zinc-600 text-zinc-200"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <XCircle size={16} />
              I Lost
            </button>
          </div>
          <button
            onClick={() => result && setSubmitted(true)}
            disabled={!result}
            className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base rounded-2xl transition-all cursor-pointer ${
              result
                ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 active:scale-[0.98] amber-glow"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            <CheckCircle size={18} />
            Submit Result
          </button>
        </div>
      )}
    </div>
  );
}
