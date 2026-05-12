"use client";

import { useState } from "react";
import { Users, Crown, Copy, Plus, LogIn, ChevronRight, Shield, Swords, Check } from "lucide-react";

const mockCrew = {
  name: "BierBrigade",
  city: "Munich",
  wins: 412,
  inviteCode: "BIER-4821",
  members: [
    { id: "1", name: "BeerHero", role: "captain", wins: 87 },
    { id: "2", name: "HopsMaster", role: "member", wins: 52 },
    { id: "3", name: "SchaumKing", role: "member", wins: 65 },
    { id: "4", name: "PongPro", role: "member", wins: 76 },
  ],
};

export default function CrewsPage() {
  const [hasCrew] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(mockCrew.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasCrew) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col">
        <h1 className="font-display text-xl text-zinc-100 mb-2">
          MY <span className="text-amber-400">CREW</span>
        </h1>
        <p className="text-zinc-500 text-sm mb-10">Join forces with friends to battle crews</p>

        <div className="flex flex-col gap-4 flex-1">
          <button className="flex-1 max-h-48 bg-amber-500/10 border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/15 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-all">
              <Plus size={24} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-200 font-semibold">Create a Crew</p>
              <p className="text-zinc-500 text-sm">Start your own team</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 max-h-48 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-all">
              <LogIn size={24} className="text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-200 font-semibold">Join a Crew</p>
              <p className="text-zinc-500 text-sm">Enter an invite code</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <h1 className="font-display text-xl text-zinc-100 mb-6">
        MY <span className="text-amber-400">CREW</span>
      </h1>

      {/* Crew card */}
      <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-5 mb-5 amber-glow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl text-zinc-100">{mockCrew.name}</h2>
            <p className="text-zinc-500 text-sm">{mockCrew.city}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-amber-400">{mockCrew.wins}</p>
            <p className="text-zinc-600 text-xs">Total Wins</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-800 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">Members</p>
            <p className="text-zinc-200 font-semibold flex items-center gap-2">
              <Users size={14} className="text-amber-400" />
              {mockCrew.members.length}
            </p>
          </div>
          <div className="flex-1 bg-zinc-800 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">Rank</p>
            <p className="text-zinc-200 font-semibold flex items-center gap-2">
              <Shield size={14} className="text-amber-400" />
              #1 Munich
            </p>
          </div>
        </div>
      </div>

      {/* Invite code */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Invite Code</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 font-display text-xl text-amber-400 tracking-widest">{mockCrew.inviteCode}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm text-zinc-300 transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Challenge crew */}
      <button className="w-full h-12 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm rounded-2xl transition-all active:scale-[0.98] cursor-pointer amber-glow mb-5">
        <Swords size={16} />
        Challenge Another Crew
      </button>

      {/* Members list */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Members</p>
        <div className="flex flex-col gap-2">
          {mockCrew.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0 ${
                member.role === "captain"
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}>
                {member.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-zinc-200 text-sm font-medium truncate">{member.name}</p>
                  {member.role === "captain" && (
                    <Crown size={12} className="text-amber-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-zinc-600 text-xs capitalize">{member.role}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-zinc-400 text-sm font-medium">{member.wins}W</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join crew modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowJoin(false)}>
          <div className="w-full max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
            <h3 className="font-display text-lg text-zinc-100 mb-1">Join a Crew</h3>
            <p className="text-zinc-500 text-sm mb-5">Enter the invite code your crew captain shared</p>
            <input
              type="text"
              placeholder="e.g. BIER-4821"
              className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 text-sm font-display tracking-widest mb-4"
            />
            <button className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
              <LogIn size={16} />
              Join Crew
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
